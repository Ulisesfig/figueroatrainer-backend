const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { query } = require('../config/database');
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

const PLAN_DISCOUNTS = {
  1: 0,
  3: 0.05,
  6: 0.10,
  12: 0.15
};

const PENDING_REJECTED_VISIBLE_MINUTES = 15;

const extractPlanMonths = (planType) => {
  const text = String(planType || '');
  const match = text.match(/\((\d+)\s*mes(?:es)?\)/i);
  if (!match) return 1;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const addMonths = (dateValue, monthsToAdd) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + monthsToAdd);
  return date;
};

const resolveChargeAmount = (defaultAmount) => {
  const isTestAmountEnabled = process.env.PAYMENT_FORCE_TEST_AMOUNT === 'true';
  const testAmount = Number(process.env.PAYMENT_TEST_AMOUNT_ARS || 0);

  if (!isTestAmountEnabled) return defaultAmount;
  if (!Number.isFinite(testAmount) || testAmount <= 0) return defaultAmount;

  return testAmount;
};

const paymentController = {
  /**
   * Crear preferencia de pago en Mercado Pago
   */
  createPreference: async (req, res) => {
    try {
      const { planType, months = 1 } = req.body;
      const userId = req.user?.id;
      const selectedMonths = Number(months);

      console.log('🔵 [CREATE PREFERENCE] Usuario:', userId, 'Plan:', planType, 'Meses:', selectedMonths);

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

      if (!Number.isInteger(selectedMonths) || !Object.prototype.hasOwnProperty.call(PLAN_DISCOUNTS, selectedMonths)) {
        return res.status(400).json({
          success: false,
          message: 'Duracion invalida. Opciones permitidas: 1, 3, 6 o 12 meses'
        });
      }

      const planData = PLAN_PRICES[planType];
      const discountRate = PLAN_DISCOUNTS[selectedMonths];
      const subtotalAmount = planData.amount * selectedMonths;
      const discountedAmount = Math.round(subtotalAmount * (1 - discountRate));
      const chargeAmount = resolveChargeAmount(discountedAmount);
      const durationLabel = `${selectedMonths} ${selectedMonths === 1 ? 'mes' : 'meses'}`;
      const paymentPlanTitle = `${planData.title} (${durationLabel})`;

      if (chargeAmount !== discountedAmount) {
        console.log(`⚠️ Monto de prueba activo. Plan: ${planType}, Original con descuento: ${discountedAmount}, Cobro: ${chargeAmount}`);
      }

      if (chargeAmount === 0) {
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

      // Evitar pendientes duplicados por múltiples clics consecutivos
      const existingPending = await Payment.findRecentOpenPendingByUserAndPlan(userId, paymentPlanTitle, 15);
      if (existingPending) {
        if (existingPending.mp_preference_id) {
          console.log('♻️ Reutilizando preferencia existente:', existingPending.mp_preference_id);
          return res.json({
            success: true,
            preferenceId: existingPending.mp_preference_id,
            chargedAmount: Number(existingPending.amount),
            reused: true
          });
        }

        return res.status(429).json({
          success: false,
          message: 'Ya estamos generando tu pago. Espera unos segundos e intenta nuevamente.'
        });
      }

      // Crear registro de pago en la base de datos
      const paymentRecord = await Payment.create({
        userId,
        planType: paymentPlanTitle,
        amount: chargeAmount,
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
            title: paymentPlanTitle,
            description: `Plan por ${durationLabel} - ${planData.title}`,
            quantity: 1,
            unit_price: chargeAmount,
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
          success: `${frontendUrl}/pages/payment-success.html`,
          failure: `${frontendUrl}/pages/payment-failure.html`,
          pending: `${frontendUrl}/pages/payment-pending.html`
        },
        auto_return: 'approved',
        external_reference: paymentRecord.id.toString(),
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        statement_descriptor: 'Figueroa Trainer',
        metadata: {
          user_id: userId,
          plan_type: planType,
          months: selectedMonths,
          discount_rate: discountRate,
          payment_record_id: paymentRecord.id,
          original_amount: planData.amount,
          subtotal_amount: subtotalAmount,
          charged_amount: chargeAmount
        }
      };

      console.log('🔵 Creando preferencia en Mercado Pago...');
      const mpPreference = await preference.create({ body: preferenceData });
      
      console.log('✅ Preferencia creada:', mpPreference.id);

      // Actualizar registro inicial con el ID de preferencia de MP
      await query(
        `
          UPDATE payments
          SET mp_preference_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [mpPreference.id, paymentRecord.id]
      );

      res.json({
        success: true,
        preferenceId: mpPreference.id,
        initPoint: mpPreference.init_point,
        sandboxInitPoint: mpPreference.sandbox_init_point,
        chargedAmount: chargeAmount
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
      const now = new Date();

      const visiblePayments = payments.filter((payment) => {
        const status = String(payment.status || '').toLowerCase();
        const createdAt = new Date(payment.created_at);

        if (Number.isNaN(createdAt.getTime())) {
          return false;
        }

        if (status === 'pending' || status === 'rejected') {
          const ageMs = now.getTime() - createdAt.getTime();
          return ageMs <= PENDING_REJECTED_VISIBLE_MINUTES * 60 * 1000;
        }

        if (status === 'approved') {
          const months = extractPlanMonths(payment.plan_type);
          const approvedReferenceDate = payment.updated_at || payment.created_at;
          const expiresAt = addMonths(approvedReferenceDate, months);
          if (!expiresAt) return false;
          return now.getTime() < expiresAt.getTime();
        }

        return true;
      });

      res.json({
        success: true,
        payments: visiblePayments.map(p => ({
          id: p.id,
          planType: p.plan_type,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paymentMethod: p.payment_method,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          months: extractPlanMonths(p.plan_type)
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
