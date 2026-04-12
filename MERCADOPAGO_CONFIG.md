# 💳 Configuración de Mercado Pago - Figueroa Trainer

## 📋 Guía Completa de Implementación

Esta guía te ayudará a configurar Mercado Pago en tu aplicación de Figueroa Trainer para aceptar pagos de planes.

---

## 🎯 ¿Qué se implementó?

✅ **Backend (Node.js + Express)**
- SDK de Mercado Pago instalado
- Modelo `Payment` para gestionar pagos en PostgreSQL
- Controlador para crear preferencias de pago
- Webhook para recibir notificaciones de Mercado Pago
- Sistema de emails automáticos (admin + cliente)
- Rutas de API `/api/payments/*`

✅ **Frontend (HTML + JavaScript)**
- Botones de pago integrados en la página de planes
- SDK de Mercado Pago para checkout
- Páginas de respuesta (éxito, fallo, pendiente)
- Verificación de autenticación antes de pagar

---

## 🚀 Pasos para Activar Mercado Pago

### **1. Crear/Configurar Cuenta de Mercado Pago** (10 minutos)

1. **Accede a Mercado Pago:**
   - Ve a: https://www.mercadopago.com.ar
   - Inicia sesión o crea una cuenta

2. **Obtén tus credenciales:**
   - Ve a: **"Tu negocio" → "Configuración" → "Credenciales"**
   - Verás dos tipos de credenciales:
     - **Modo Prueba (TEST)**: Para desarrollo
     - **Modo Producción (PROD)**: Para ventas reales

3. **Copia las credenciales:**
   ```
   Access Token (backend):
   TEST-1234567890-xxxxx-xxxxxxxxxxxxxxxx
   
   Public Key (frontend):
   TEST-12345678-1234-1234-1234-123456789012
   ```

**⚠️ IMPORTANTE:** En producción, usa las credenciales de **Modo Producción** (sin el prefijo TEST-)

---

### **2. Configurar Variables de Entorno en Railway** (5 minutos)

En tu proyecto de Railway (backend), agrega estas variables de entorno:

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-aqui

# URLs
FRONTEND_URL=https://figueroatrainer.netlify.app
BACKEND_URL=https://figueroatrainer-backend-production.up.railway.app

# Email del administrador
ADMIN_EMAIL=ulefigueroa@gmail.com

# Panel de admin (opcional)
ADMIN_PANEL_URL=https://figueroatrainer.netlify.app/pages/admin.html
```

**Notas:**
- Reemplaza `TEST-tu-access-token-aqui` con tu Access Token real
- `ADMIN_EMAIL` es donde llegarán las notificaciones de compra
- Las demás variables ya deberían estar configuradas (SMTP_HOST, SMTP_USER, SMTP_PASS, etc.)

---

### **3. Configurar Public Key en el Frontend** (2 minutos)

Edita el archivo: `figueroatrainer-frontend-4d1000023c1c3e76c7d515f1abf13a8edc8069db/public/config.js`

```javascript
// Reemplaza esta línea:
const MERCADOPAGO_PUBLIC_KEY = 'TEST-tu-public-key-aqui';

// Con tu Public Key real:
const MERCADOPAGO_PUBLIC_KEY = 'TEST-12345678-1234-1234-1234-123456789012';
```

---

### **4. Aplicar Migración de Base de Datos** (2 minutos)

Ejecuta este comando en tu terminal (carpeta backend):

```bash
cd figueroatrainer-backend-main
node scripts/apply-migration-payments.js
```

Esto creará la tabla `payments` en tu base de datos PostgreSQL.

**Verificación:**
```bash
# Conéctate a tu base de datos y verifica:
SELECT * FROM payments LIMIT 1;
```

---

### **5. Configurar Webhooks en Mercado Pago** (5 minutos)

**⚠️ ESTO SE HACE DESPUÉS DE HACER DEPLOY DEL BACKEND**

1. Ve a: **Mercado Pago → "Tu negocio" → "Configuración" → "Notificaciones"**

2. Agrega una nueva URL de webhook:
   ```
   https://figueroatrainer-backend-production.up.railway.app/api/payments/webhook
   ```

3. Selecciona los eventos:
   - ✅ **Pagos** (payment)
   - ✅ **Merchant Orders** (opcional)

4. Guarda la configuración

**¿Por qué es importante?**
El webhook permite que Mercado Pago notifique a tu backend cuando un pago se aprueba, rechaza o queda pendiente.

---

### **6. Hacer Deploy del Backend** (Ya lo tienes en Railway)

1. **Commit y push de los cambios:**
   ```bash
   cd figueroatrainer-backend-main
   git add .
   git commit -m "feat: integración de Mercado Pago"
   git push origin main
   ```

2. Railway automáticamente hará el deploy

3. **Verifica que funcione:**
   ```bash
   curl https://figueroatrainer-backend-production.up.railway.app/api/health
   ```

---

### **7. Hacer Deploy del Frontend** (Ya lo tienes en Netlify)

1. **Commit y push de los cambios:**
   ```bash
   cd figueroatrainer-frontend-4d1000023c1c3e76c7d515f1abf13a8edc8069db
   git add .
   git commit -m "feat: botones de pago con Mercado Pago"
   git push origin main
   ```

2. Netlify automáticamente hará el deploy

---

## ✅ **Verificar que Todo Funcione**

### **Prueba 1: Verificar credenciales**
Abre la consola del navegador en tu sitio y ejecuta:
```javascript
console.log(window.MERCADOPAGO_PUBLIC_KEY);
// Debe mostrar: TEST-12345678-1234-1234-1234-123456789012
```

### **Prueba 2: Probar un pago de prueba**
1. Ve a: `https://figueroatrainer.netlify.app/pages/planes.html`
2. Haz clic en **"💳 Pagar con Mercado Pago"** en cualquier plan
3. Deberías ver el checkout de Mercado Pago
4. Usa una tarjeta de prueba:
   - **Tarjeta aprobada:**
     - Número: `5031 7557 3453 0604`
     - CVV: `123`
     - Vencimiento: `11/25`
     - Nombre: `APRO` (IMPORTANTE)

### **Prueba 3: Verificar email**
Después de un pago exitoso, deberías recibir un email en `ADMIN_EMAIL` con:
- ✅ Datos del cliente
- ✅ Plan adquirido
- ✅ Monto pagado
- ✅ ID de transacción

---

## 🧪 Tarjetas de Prueba de Mercado Pago

### Tarjetas que APRUEBAN:
```
Visa: 4509 9535 6623 3704
Mastercard: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: APRO
```

### Tarjetas que RECHAZAN:
```
Nombre: OCHO (fondos insuficientes)
Nombre: CONT (rechazada por datos incorrectos)
```

**Más tarjetas de prueba:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 📂 Archivos Creados/Modificados

### Backend:
```
✅ src/models/Payment.js                      (nuevo)
✅ src/controllers/paymentController.js       (nuevo)
✅ src/routes/paymentRoutes.js                (nuevo)
✅ src/config/migration_add_payments.sql      (nuevo)
✅ scripts/apply-migration-payments.js        (nuevo)
✅ src/utils/mailer.js                        (modificado - agregado emails de pago)
✅ server.js                                  (modificado - ruta de pagos)
✅ package.json                               (modificado - mercadopago instalado)
```

### Frontend:
```
✅ public/config.js                           (modificado - public key)
✅ public/pages/planes.html                   (modificado - botones de pago)
✅ public/pages/payment-success.html          (nuevo)
✅ public/pages/payment-failure.html          (nuevo)
✅ public/pages/payment-pending.html          (nuevo)
```

---

## 💰 Precios Configurados

Los precios están hardcodeados en el backend (`src/controllers/paymentController.js`):

```javascript
const PLAN_PRICES = {
  'rutina-personalizada': { amount: 20000, title: 'Rutina Personalizada' },
  'rutina-seguimiento': { amount: 30000, title: 'Rutina + Seguimiento' },
  'entrenamiento-presencial': { amount: 0, title: 'Entrenamiento Presencial' }
};
```

**Para cambiar precios:** Edita ese objeto y haz deploy nuevamente.

---

## 🔄 Flujo Completo de Pago

```
1. Usuario hace clic en "Pagar con Mercado Pago"
   ↓
2. Frontend verifica autenticación (token JWT)
   ↓
3. Frontend llama a /api/payments/create-preference
   ↓
4. Backend crea registro en DB y preferencia en MP
   ↓
5. Frontend recibe preferenceId y abre checkout de MP
   ↓
6. Usuario completa el pago en MP
   ↓
7. MP envía webhook a /api/payments/webhook
   ↓
8. Backend actualiza estado del pago en DB
   ↓
9. Backend envía emails a admin y cliente
   ↓
10. Usuario es redirigido a página de éxito
```

---

## 🛠️ Solución de Problemas

### ❌ Error: "MERCADOPAGO_PUBLIC_KEY is not defined"
**Solución:** Edita `public/config.js` y agrega tu Public Key

### ❌ Error: "Usuario no autenticado"
**Solución:** El usuario debe hacer login antes de comprar. El sistema redirige automáticamente.

### ❌ Error: "Error al crear preferencia"
**Solución:** Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté configurado en Railway

### ❌ No llegan emails
**Solución:** 
1. Verifica que `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` estén configurados
2. Verifica que `ADMIN_EMAIL` sea correcto
3. Revisa logs en Railway: `railway logs`

### ❌ Webhook no funciona
**Solución:**
1. Verifica la URL del webhook en Mercado Pago
2. Debe ser: `https://tu-backend.railway.app/api/payments/webhook`
3. Verifica logs: `railway logs --filter=WEBHOOK`

---

## 📊 Monitoreo de Pagos

### Ver todos los pagos (como admin):
```bash
curl -X GET https://tu-backend.railway.app/api/payments/all \
  -H "Authorization: Bearer TU_TOKEN_DE_ADMIN"
```

### Ver pagos de un usuario:
```bash
curl -X GET https://tu-backend.railway.app/api/payments/my-payments \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"
```

### Ver estado de un pago:
```bash
curl -X GET https://tu-backend.railway.app/api/payments/status/PAYMENT_ID \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## 🔐 Seguridad

✅ **Token JWT requerido** para crear pagos
✅ **Webhook público** (Mercado Pago no envía autenticación)
✅ **Validación de external_reference** para evitar manipulación
✅ **Emails solo al admin** configurado en variables de entorno

---

## 💡 Próximos Pasos Sugeridos

1. **Implementar suscripciones recurrentes** (mensual automático)
2. **Panel de admin** para ver histórico de pagos
3. **Descuentos y cupones** de descuento
4. **Métricas de conversión** (Google Analytics)
5. **Recordatorios de renovación** automáticos

---

## 📞 Soporte

**Documentación de Mercado Pago:**
- https://www.mercadopago.com.ar/developers/es/docs

**Tarjetas de prueba:**
- https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

**Centro de ayuda:**
- https://www.mercadopago.com.ar/ayuda

---

## ✅ Checklist Final

Antes de lanzar a producción, verifica:

- [ ] Credenciales de **PRODUCCIÓN** configuradas (sin TEST-)
- [ ] `ADMIN_EMAIL` configurado correctamente
- [ ] `FRONTEND_URL` apunta a tu dominio real
- [ ] Webhook configurado en Mercado Pago
- [ ] Migración de `payments` aplicada en DB producción
- [ ] Emails llegando correctamente (prueba real)
- [ ] Pago de prueba completo exitoso
- [ ] Páginas de éxito/fallo funcionando
- [ ] Logs de Railway sin errores

---

**🎉 ¡Listo! Ahora tu aplicación puede recibir pagos con Mercado Pago.**

Si tenés dudas, revisá la documentación o contactá soporte de Mercado Pago.
