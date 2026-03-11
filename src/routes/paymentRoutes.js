const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Endpoint de diagnóstico (sin autenticación)
router.get('/debug/credentials', (req, res) => {
  res.json({
    hasMercadopagoAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    hasMercadopagoPublicKey: !!process.env.MERCADOPAGO_PUBLIC_KEY,
    accessTokenLength: process.env.MERCADOPAGO_ACCESS_TOKEN?.length || 0,
    publicKeyLength: process.env.MERCADOPAGO_PUBLIC_KEY?.length || 0,
    accessTokenPrefix: process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) || 'UNDEFINED'
  });
});

// Crear preferencia de pago (requiere autenticación)
router.post('/create-preference', requireAuth, paymentController.createPreference);

// Webhook de Mercado Pago (público, sin autenticación)
router.post('/webhook', paymentController.webhook);

// Consultar estado de un pago (requiere autenticación)
router.get('/status/:paymentId', requireAuth, paymentController.getPaymentStatus);

// Obtener pagos del usuario actual
router.get('/my-payments', requireAuth, paymentController.getUserPayments);

// Obtener todos los pagos (solo admin)
router.get('/all', requireAuth, requireAdmin, paymentController.getAllPayments);

module.exports = router;
