# 🚂 Guía de Deployment en Railway - Figueroa Trainer Backend

## 📋 Requisitos Previos

- ✅ Cuenta en [Railway.app](https://railway.app)
- ✅ Cuenta en [GitHub.com](https://github.com)
- ✅ Código del backend subido a GitHub

---

## 🚀 Paso a Paso

### **PASO 1: Subir Backend a GitHub**

```bash
# Navegar a la carpeta backend
cd C:\Users\Ulises\Desktop\backup\ZZZ\figueroatrainer\backend

# Inicializar git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Backend inicial - Node.js + Express + PostgreSQL"

# Crear repositorio en GitHub:
# 1. Ve a https://github.com/new
# 2. Nombre: figueroatrainer-backend
# 3. Privado o público (tu elección)
# 4. NO agregues README, .gitignore ni licencia (ya los tienes)
# 5. Click en "Create repository"

# Conectar con GitHub (reemplaza con tu usuario)
git remote add origin https://github.com/Ulisesfig/figueroatrainer-backend.git

# Subir código
git branch -M main
git push -u origin main
```

---

### **PASO 2: Crear Proyecto en Railway**

1. **Ir a Railway:**
   - Ve a [https://railway.app](https://railway.app)
   - Click en **"Login"** y accede con GitHub

2. **Nuevo Proyecto:**
   - Click en **"New Project"**
   - Selecciona **"Deploy from GitHub repo"**

3. **Autorizar Railway:**
   - Si es tu primera vez, Railway pedirá permisos para acceder a tus repositorios
   - Click en **"Configure GitHub App"**
   - Autoriza todos los repositorios o solo el de backend

4. **Seleccionar Repositorio:**
   - Busca y selecciona **"figueroatrainer-backend"**
   - Railway comenzará a analizar el proyecto

---

### **PASO 3: Agregar PostgreSQL**

1. En tu proyecto de Railway, verás tu servicio backend
2. Click en **"New"** (botón superior derecho)
3. Selecciona **"Database"** → **"Add PostgreSQL"**
4. Railway creará automáticamente:
   - Una base de datos PostgreSQL
   - La variable de entorno `DATABASE_URL` conectada a tu backend

---

### **PASO 4: Configurar Variables de Entorno**

1. Click en tu servicio **backend** (no en PostgreSQL)
2. Ve a la pestaña **"Variables"**
3. Click en **"New Variable"** y agrega estas:

```env
NODE_ENV=production
JWT_SECRET=cambia_esto_por_una_clave_super_segura_unica_123456789
COOKIE_SECURE=true
PORT=3000
CORS_ORIGINS=https://tu-frontend.netlify.app,https://tu-frontend.vercel.app
```

**Importante:**
- `DATABASE_URL` ya estará configurada automáticamente
- Cambia `JWT_SECRET` por algo único y seguro
- Actualiza `CORS_ORIGINS` con la URL de tu frontend cuando lo despliegues

#### **PASO 4.1: Configurar SMTP (Recuperación de contraseña)**

Para que los correos de recuperación lleguen a los usuarios, configurá un proveedor SMTP (SMTP2GO, Brevo/Sendinblue, Mailgun, etc.). Cualquiera de estos funciona con las mismas variables:

```env
SMTP_HOST= # p. ej. mail.smtp2go.com o smtp-relay.sendinblue.com
SMTP_PORT=587 # 465 si usás TLS estricto (secure)
SMTP_USER= # usuario/clave API segun proveedor
SMTP_PASS= # contraseña o API key
SMTP_SECURE=false # true si usás puerto 465
FROM_EMAIL=no-reply@tu-dominio.com
```

Proveedores sugeridos:
- SMTP2GO (simple de configurar y con credenciales SMTP estándar)
- Brevo/Sendinblue (plan gratis, buen deliverability)
- Mailgun (estable, requiere dominio verificado)

Pasos generales en el panel del proveedor:
1) Crear cuenta y verificar tu email.
2) Si es posible, verificar dominio (mejora deliverability). Opcional para empezar.
3) Crear una API Key o credenciales SMTP.
4) Copiar host/puerto/usuario/contraseña.
5) Ir a Railway → servicio backend → Variables → agregar las variables anteriores.

Guía rápida: SMTP2GO en 5 minutos
1) Crear cuenta en https://www.smtp2go.com
2) Ir a la sección de SMTP credentials y crear usuario/clave.
3) SMTP2GO usa:
   - SMTP_HOST = mail.smtp2go.com
   - SMTP_PORT = 587
   - SMTP_USER = tu usuario SMTP2GO
   - SMTP_PASS = tu password o API key
   - SMTP_SECURE = false
   - FROM_EMAIL = el remitente verificado
4) Agregar estas variables en Railway (servicio backend) y redeploy automático.

Guía rápida: Brevo (Sendinblue)
1) Crear cuenta en https://brevo.com
2) Ir a Transaccional → SMTP & API → Generar SMTP Key.
3) Usar:
   - SMTP_HOST = smtp-relay.brevo.com
   - SMTP_PORT = 587
   - SMTP_USER = el "SMTP username" que muestra Brevo
   - SMTP_PASS = la "SMTP key" generada
   - SMTP_SECURE = false
   - FROM_EMAIL = dirección validada en Brevo

Cómo probar en Railway (sin tocar código):
```bash
# En tu máquina (requiere Railway CLI vinculado al proyecto)
railway run npm run test-email -- tu-email@ejemplo.com
```
Salida esperada:
- Si falta SMTP: "Envío SIMULADO" (configurá las variables)
- Si está bien configurado: mostrará un messageId de nodemailer y te llegará el correo

Nota: El backend ya tiene fallback; si SMTP no está configurado, el endpoint /api/auth/recover devolverá el código en la respuesta para no bloquear a los usuarios.

---

### **PASO 5: Deploy Inicial**

Railway hará el deploy automáticamente. Verás:
- ✅ Instalando dependencias (npm install)
- ✅ Iniciando servidor (npm start)
- ✅ Deploy completado

En la pestaña **"Deployments"** verás el progreso.

---

### **PASO 6: Inicializar la Base de Datos**

Ahora necesitas crear las tablas en PostgreSQL.

#### **Opción A: Usar Railway CLI (Recomendada)**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Iniciar sesión
railway login

# 3. Navegar a tu carpeta backend
cd C:\Users\Ulises\Desktop\backup\ZZZ\figueroatrainer\backend

# 4. Conectar al proyecto
railway link

# 5. Ejecutar el script SQL
railway run psql $DATABASE_URL -f src/config/init.sql
```

#### **Opción B: Desde la Consola de Railway**

1. Ve a tu servicio **PostgreSQL** en Railway
2. Click en la pestaña **"Data"**
3. Click en **"Query"**
4. Abre el archivo `backend/src/config/init.sql` en tu editor
5. Copia todo el contenido
6. Pégalo en la consola de Query de Railway
7. Click en **"Run"** o presiona Ctrl+Enter

---

### **PASO 7: Obtener URL del Backend**

1. Ve a tu servicio **backend** en Railway
2. Click en la pestaña **"Settings"**
3. En la sección **"Domains"**, verás algo como:
   ```
   https://figueroatrainer-backend-production.up.railway.app
   ```
4. **¡Copia esta URL!** La necesitarás para el frontend

---

### **PASO 8: Probar el Backend**

Prueba que tu API esté funcionando:

```bash
# Health check
curl https://tu-backend.up.railway.app/api/health

# Deberías ver algo como:
# {"success":true,"message":"Server is running","timestamp":"...","environment":"production"}
```

O abre en tu navegador:
```
https://tu-backend.up.railway.app/api/health
```

---

### **PASO 9: Actualizar Frontend**

En tu repositorio frontend, necesitas actualizar la URL del API:

#### Si creaste `config.js` (recomendado):

1. Edita `frontend/public/config.js`:
```javascript
// Cambiar de:
const API_URL = 'http://localhost:3000';

// A:
const API_URL = 'https://tu-backend.up.railway.app';
```

#### Si no tienes `config.js`:

Necesitas actualizar manualmente cada archivo que haga llamadas al API:
- `public/script.js`
- `public/pages/login.html`
- `public/pages/registro.html`
- `public/pages/dashboard.html`
- `public/pages/recuperar.html`

Cambia todas las llamadas de:
```javascript
fetch('/api/...')
```

A:
```javascript
fetch('https://tu-backend.up.railway.app/api/...')
```

---

### **PASO 10: Actualizar CORS en Backend**

1. Ve a tu proyecto Railway
2. Click en el servicio backend → Variables
3. Actualiza `CORS_ORIGINS` con la URL de tu frontend (puedes listar varias separadas por coma). Si tu frontend está en Netlify y usas cookies HTTPOnly, necesitas SameSite=None;Secure (ya configurado en producción) y el dominio exacto de Netlify:
```
CORS_ORIGINS=https://tu-frontend.netlify.app,https://tu-frontend.vercel.app
```

4. Railway hará redeploy automáticamente

---

## 🔧 Comandos Útiles Railway CLI

```bash
# Ver logs en tiempo real
railway logs

# Abrir en navegador
railway open

# Ver variables de entorno
railway variables

# Ejecutar comando en el servidor
railway run node --version

# Conectar a PostgreSQL
railway connect
```

---

## 📊 Monitoreo

En Railway puedes ver:
- **Deployments:** Historial de deploys
- **Metrics:** Uso de CPU, RAM, Network
- **Logs:** Logs de la aplicación en tiempo real
- **Settings:** Configuración del servicio

---

## 🐛 Solución de Problemas

### Error: "Application failed to respond"
- Verifica que `PORT` esté configurado correctamente
- Revisa los logs: `railway logs`

### Error: "Database connection failed"
- Verifica que PostgreSQL esté ejecutándose
- Confirma que `DATABASE_URL` esté configurada
- Ejecuta el script `init.sql`

### Error: CORS
- Actualiza `CORS_ORIGINS` con la URL correcta del frontend
- Incluye tanto http como https si es necesario (solo para desarrollo). En producción, usa https.
- Para que el login funcione con cookies entre dominios (Railway + Netlify), asegúrate de que:
   - `NODE_ENV=production`
   - Cookies de auth usan `SameSite=None; Secure` (ya lo hace el backend en producción)
   - El dominio de Netlify esté en `CORS_ORIGINS`

### Ver logs:
```bash
railway logs --tail
```

---

## 💰 Costos

Railway tiene un plan gratuito que incluye:
- ✅ 500 horas de ejecución/mes
- ✅ $5 de crédito gratuito
- ✅ PostgreSQL incluido

Para proyectos personales es más que suficiente.

---

## 🎉 ¡Listo!

Tu backend está desplegado en Railway con:
- ✅ Node.js + Express
- ✅ PostgreSQL
- ✅ JWT Authentication
- ✅ HTTPS automático
- ✅ Deploy continuo desde GitHub

Cada vez que hagas `git push` a tu repositorio, Railway hará deploy automáticamente.

---

## 📝 Checklist Final

- [ ] Backend subido a GitHub
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregado
- [ ] Variables de entorno configuradas
- [ ] Script SQL ejecutado (tablas creadas)
- [ ] URL del backend obtenida
- [ ] Frontend actualizado con URL del backend
- [ ] CORS configurado correctamente
- [ ] API funcionando (probado con /api/health)

---

¿Necesitas ayuda? Revisa los logs con `railway logs` o contacta soporte de Railway.
