const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
