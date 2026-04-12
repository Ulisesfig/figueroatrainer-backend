# 📧 Configuración de Email para Recuperación de Contraseña

## Problema Identificado
El sistema **NO envía emails** porque faltan las variables de entorno SMTP en Railway.

## ✅ Solución: Configurar SMTP en Railway

### Opción 1: Usar Gmail (Recomendado para pruebas)

1. **Habilitar verificación en 2 pasos**
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Generar contraseña de aplicación**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro dispositivo"
   - Copia la contraseña de 16 caracteres generada

3. **Configurar variables en Railway**
   - Ve a tu proyecto en Railway
   - Click en "Variables"
   - Agrega estas variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  (contraseña de aplicación generada)
FROM_EMAIL=tu-email@gmail.com
```

4. **Redeploy**
   - Railway re-desplegará automáticamente con las nuevas variables

### Opción 2: Usar SMTP2GO (Recomendado para producción)

SMTP2GO ofrece un plan gratuito útil para validación y producción liviana.

1. **Crear cuenta en SMTP2GO**
   - Regístrate en https://www.smtp2go.com/

2. **Generar credenciales SMTP**
   - Ve a la sección de SMTP / Users / Credentials
   - Crea un usuario SMTP y copia la contraseña o API key

3. **Configurar en Railway**
```
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=TU_USUARIO_SMTP2GO
SMTP_PASS=TU_PASSWORD_O_API_KEY_SMTP2GO
FROM_EMAIL=tu-email-verificado@tudominio.com
```

### Opción 3: Otros Proveedores

**Outlook/Hotmail:**
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
FROM_EMAIL=tu-email@outlook.com
```

**Yahoo:**
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@yahoo.com
SMTP_PASS=contraseña-de-aplicacion
FROM_EMAIL=tu-email@yahoo.com
```

## 🧪 Verificar la Configuración

Una vez configuradas las variables en Railway, puedes probar el envío:

```bash
# Conectarte a Railway y probar
railway run npm run test-email -- tu-email@ejemplo.com
```

O desde el dashboard de Railway, ve a los logs después de intentar recuperar contraseña. Ahora verás:
- ✅ "SMTP configurado" si las variables están bien
- ❌ "SMTP NO CONFIGURADO - Faltan variables" si falta algo
- 📧 "Email enviado exitosamente" si funcionó
- ❌ Detalles del error si algo falló

## 📝 Mejoras Implementadas

1. **Logs detallados**: Ahora el sistema indica exactamente qué variable falta
2. **Timeout aumentado**: De 8 a 15 segundos para conexiones lentas
3. **Mejor manejo de errores**: Información específica sobre qué salió mal
4. **Documentación**: `.env.example` actualizado con todas las variables SMTP

## 🔍 Cómo Verificar si Funciona

1. Intenta recuperar tu contraseña desde el frontend
2. Ve a los logs de Railway
3. Busca estos mensajes:
   - `✓ SMTP configurado` → Todo bien
   - `📧 Email enviado exitosamente` → Funcionó
   - `❌ SMTP NO CONFIGURADO` → Faltan variables
   - `❌ Error al enviar email` → Revisa credenciales

## ⚠️ Notas Importantes

- Las contraseñas de aplicación son diferentes de tu contraseña de Gmail
- Nunca compartas tu contraseña de aplicación públicamente
- Gmail tiene límite de 500 emails por día
- Para producción, usa servicios como SMTP2GO, Mailgun o Amazon SES
- Siempre verifica que `FROM_EMAIL` esté correctamente configurado

## 🆘 Problemas Comunes

**"Invalid login"**: Contraseña incorrecta o no es contraseña de aplicación
**"Connection timeout"**: Verifica SMTP_HOST y SMTP_PORT
**"Authentication failed"**: Usuario o contraseña incorrectos
**"Simulated"**: Variables SMTP no configuradas en Railway
