const { query } = require('../config/database');

const Payment = {
  // Crear un nuevo pago
  create: async (paymentData) => {
    const {
      userId,
      planType,
      amount,
      currency = 'ARS',
      mpPreferenceId = null,
      status = 'pending'
    } = paymentData;

    const text = `
      INSERT INTO payments (user_id, plan_type, amount, currency, mp_preference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [userId, planType, amount, currency, mpPreferenceId, status];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Actualizar pago con información de Mercado Pago
  updateWithMPData: async (preferenceId, mpData) => {
    const {
      paymentId,
      merchantOrderId,
      status,
      paymentMethod,
      paymentType,
      transactionDetails,
      payerInfo
    } = mpData;

    const text = `
      UPDATE payments
      SET 
        mp_payment_id = $1,
        mp_merchant_order_id = $2,
        status = $3,
        payment_method = $4,
        payment_type = $5,
        transaction_details = $6,
        payer_info = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE mp_preference_id = $8
      RETURNING *
    `;
    const values = [
      paymentId,
      merchantOrderId,
      status,
      paymentMethod,
      paymentType,
      transactionDetails ? JSON.stringify(transactionDetails) : null,
      payerInfo ? JSON.stringify(payerInfo) : null,
      preferenceId
    ];
    const result = await query(text, values);
    return result.rows[0];
  },

  // Buscar por ID de preferencia de Mercado Pago
  findByPreferenceId: async (preferenceId) => {
    const text = `
      SELECT p.*, u.email, u.name, u.surname
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.mp_preference_id = $1
    `;
    const result = await query(text, [preferenceId]);
    return result.rows[0];
  },

  // Buscar por ID de pago de Mercado Pago
  findByPaymentId: async (paymentId) => {
    const text = `
      SELECT p.*, u.email, u.name, u.surname
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.mp_payment_id = $1
    `;
    const result = await query(text, [paymentId]);
    return result.rows[0];
  },

  // Obtener todos los pagos de un usuario
  findByUserId: async (userId) => {
    const text = `
      SELECT *
      FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
  },

  // Obtener todos los pagos (para admin)
  findAll: async (limit = 50, offset = 0) => {
    const text = `
      SELECT p.*, u.email, u.name, u.surname
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(text, [limit, offset]);
    return result.rows;
  },

  // Contar pagos por estado
  countByStatus: async (status) => {
    const text = 'SELECT COUNT(*)::int AS count FROM payments WHERE status = $1';
    const result = await query(text, [status]);
    return result.rows[0]?.count || 0;
  },

  // Actualizar estado del pago
  updateStatus: async (paymentId, status) => {
    const text = `
      UPDATE payments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE mp_payment_id = $2
      RETURNING *
    `;
    const result = await query(text, [status, paymentId]);
    return result.rows[0];
  }
};

module.exports = Payment;
