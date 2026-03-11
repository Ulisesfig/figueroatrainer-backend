const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { sendPaymentNotificationToAdmin, sendPaymentConfirmationToClient } = require('../utils/mailer');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});
const preference = new Preference(client);
const payment = new MPPayment(client);

// Mapeo de planes con precios
const PLAN_PRICES = {
  'rutina-personalizada': { amount: 20000, title: 'Rutina Personalizada' },
  'rutina-seguimiento': { amount: 30000, title: 'Rutina + Seguimiento' },
  'entrenamiento-presencial': { amount: 0, title: 'Entrenamiento Presencial' } // Precio a consultar
};

const paymentController = {
  /**
   * Crear preferencia de pago en Mercado Pago
   */
  createPreference: async (req, res) => {
    try {
      const { planType } = req.body;
      const userId = req.user?.id;

      console.log('🔵 [CREATE PREFERENCE] Usuario:', userId, 'Plan:', planType);

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
      }

      if (!planType || !PLAN_PRICES[planType]) {
        return res.status(400).json({ 
          success: false, 
          message: 'Plan inválido' 
        });
      }

      const planData = PLAN_PRICES[planType];

      if (planData.amount === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Este plan requiere contacto previo' 
        });
      }

      // Obtener datos del usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Crear registro de pago en la base de datos
      const paymentRecord = await Payment.create({
        userId,
        planType: planData.title,
        amount: planData.amount,
        currency: 'ARS',
        status: 'pending'
      });

      console.log('💾 Registro de pago creado:', paymentRecord.id);

      // Crear preferencia en Mercado Pago
      const frontendUrl = process.env.FRONTEND_URL || 'https://figueroatrainer.netlify.app';
      
      const preferenceData = {
        items: [
          {
            id: planType,
            title: planData.title,
            description: `Plan mensual - ${planData.title}`,
            quantity: 1,
            unit_price: planData.amount,
            currency_id: 'ARS'
          }
        ],
        payer: {
          name: user.name,
          surname: user.surname || '',
          email: user.email,
          phone: {
            number: user.phone || ''
          }
        },
        back_urls: {
          success: `${frontendUrl}/pages/payment-success.html?payment_id={{payment_id}}&status=approved`,
          failure: `${frontendUrl}/pages/payment-failure.html?payment_id={{payment_id}}&status=rejected`,
          pending: `${frontendUrl}/pages/payment-pending.html?payment_id={{payment_id}}&status=pending`
        },
        auto_return: 'approved',
        external_reference: paymentRecord.id.toString(),
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        statement_descriptor: 'Figueroa Trainer',
        metadata: {
          user_id: userId,
          plan_type: planType,
          payment_record_id: paymentRecord.id
        }
      };

      console.log('🔵 Creando preferencia en Mercado Pago...');
      const mpPreference = await preference.create({ body: preferenceData });
      
      console.log('✅ Preferencia creada:', mpPreference.id);

      // Actualizar registro con el ID de preferencia
      await Payment.updateWithMPData(paymentRecord.id, {
        paymentId: null,
        merchantOrderId: null,
        status: 'pending',
        paymentMethod: null,
        paymentType: null,
        transactionDetails: null,
        payerInfo: null
      });

      await Payment.create({
        ...paymentRecord,
        mpPreferenceId: mpPreference.id
      });

      res.json({
        success: true,
        preferenceId: mpPreference.id,
        initPoint: mpPreference.init_point,
        sandboxInitPoint: mpPreference.sandbox_init_point
      });

    } catch (error) {
      console.error('❌ Error al crear preferencia:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear preferencia de pago',
        error: error.message 
      });
    }
  },

  /**
   * Webhook de Mercado Pago para notificaciones de pago
   */
  webhook: async (req, res) => {
    try {
      const { type, data } = req.body;

      console.log('🔔 [WEBHOOK] Tipo:', type, 'Data:', JSON.stringify(data));

      // Responder rápido a Mercado Pago
      res.status(200).send('OK');

      // Procesar solo notificaciones de pago
      if (type !== 'payment') {
        console.log('⚠️ Tipo de notificación no procesado:', type);
        return;
      }

      const paymentId = data.id;
      console.log('💳 Consultando pago:', paymentId);

      // Obtener información del pago
      const paymentInfo = await payment.get({ id: paymentId });
      console.log('📄 Info del pago:', JSON.stringify(paymentInfo, null, 2));

      const externalReference = paymentInfo.external_reference;
      const status = paymentInfo.status;

      console.log('🔍 External Reference:', externalReference);
      console.log('📊 Estado del pago:', status);

      // Buscar el registro en nuestra base de datos
      let paymentRecord = await Payment.findByPaymentId(paymentId.toString());
      
      if (!paymentRecord && externalReference) {
        // Si no existe por payment_id, buscar por external_reference (nuestro ID)
        const text = 'SELECT * FROM payments WHERE id = $1';
        const { query } = require('../config/database');
        const result = await query(text, [parseInt(externalReference)]);
        paymentRecord = result.rows[0];
      }

      if (!paymentRecord) {
        console.error('❌ No se encontró el registro de pago');
        return;
      }

      console.log('💾 Registro encontrado:', paymentRecord.id);

      // Actualizar el registro con la información de MP
      const updatedPayment = await Payment.updateWithMPData(paymentRecord.mp_preference_id || paymentRecord.id, {
        paymentId: paymentId.toString(),
        merchantOrderId: paymentInfo.order?.id?.toString() || null,
        status: status,
        paymentMethod: paymentInfo.payment_method_id,
        paymentType: paymentInfo.payment_type_id,
        transactionDetails: {
          net_received_amount: paymentInfo.transaction_details?.net_received_amount,
          total_paid_amount: paymentInfo.transaction_details?.total_paid_amount,
          installments: paymentInfo.installments
        },
        payerInfo: {
          email: paymentInfo.payer?.email,
          identification: paymentInfo.payer?.identification
        }
      });

      console.log('✅ Pago actualizado:', updatedPayment?.status);

      // Si el pago fue aprobado, asignar plan y enviar emails
      if (status === 'approved') {
        console.log('🎉 Pago aprobado! Procesando...');

        // Obtener datos del usuario
        const userResult = await require('../config/database').query(
          'SELECT * FROM users WHERE id = $1',
          [paymentRecord.user_id]
        );
        const user = userResult.rows[0];

        if (user) {
          // Asignar plan al usuario (si tienes lógica de asignación)
          console.log(`✅ Usuario ${user.email} tiene acceso al plan: ${paymentRecord.plan_type}`);

          // Enviar email al administrador con todos los detalles
          try {
            await sendPaymentNotificationToAdmin({
              userName: `${user.name} ${user.surname || ''}`.trim(),
              userEmail: user.email,
              userPhone: user.phone,
              planType: paymentRecord.plan_type,
              amount: paymentRecord.amount,
              currency: paymentRecord.currency,
              paymentId: paymentId.toString(),
              paymentMethod: paymentInfo.payment_method_id,
              paymentType: paymentInfo.payment_type_id,
              status: status,
              createdAt: paymentInfo.date_created
            });
            console.log('✅ Email enviado al administrador');
          } catch (emailError) {
            console.error('❌ Error al enviar email al admin:', emailError);
          }

          // Enviar email de confirmación al cliente
          try {
            await sendPaymentConfirmationToClient({
              userName: `${user.name} ${user.surname || ''}`.trim(),
              userEmail: user.email,
              planType: paymentRecord.plan_type,
              amount: paymentRecord.amount,
              currency: paymentRecord.currency,
              paymentId: paymentId.toString()
            });
            console.log('✅ Email de confirmación enviado al cliente');
          } catch (emailError) {
            console.error('❌ Error al enviar email al cliente:', emailError);
          }
        }
      } else {
        console.log(`⚠️ Pago en estado: ${status}`);
      }

    } catch (error) {
      console.error('❌ Error en webhook:', error);
      // No devolver error al webhook para evitar reintentos
    }
  },

  /**
   * Obtener estado de un pago
   */
  getPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      console.log('🔍 Consultando estado del pago:', paymentId);

      const paymentRecord = await Payment.findByPaymentId(paymentId);

      if (!paymentRecord) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pago no encontrado' 
        });
      }

      // Verificar que el pago pertenece al usuario (excepto admin)
      if (req.user?.role !== 'admin' && paymentRecord.user_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'No autorizado' 
        });
      }

      res.json({
        success: true,
        payment: {
          id: paymentRecord.id,
          planType: paymentRecord.plan_type,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          status: paymentRecord.status,
          paymentMethod: paymentRecord.payment_method,
          createdAt: paymentRecord.created_at
        }
      });

    } catch (error) {
      console.error('❌ Error al consultar pago:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al consultar pago',
        error: error.message 
      });
    }
  },

  /**
   * Obtener historial de pagos del usuario
   */
  getUserPayments: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
      }

      const payments = await Payment.findByUserId(userId);

      res.json({
        success: true,
        payments: payments.map(p => ({
          id: p.id,
          planType: p.plan_type,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paymentMethod: p.payment_method,
          createdAt: p.created_at
        }))
      });

    } catch (error) {
      console.error('❌ Error al obtener pagos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener pagos',
        error: error.message 
      });
    }
  },

  /**
   * Obtener todos los pagos (solo admin)
   */
  getAllPayments: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const payments = await Payment.findAll(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        payments: payments,
        page: parseInt(page),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('❌ Error al obtener todos los pagos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener pagos',
        error: error.message 
      });
    }
  }
};

module.exports = paymentController;
