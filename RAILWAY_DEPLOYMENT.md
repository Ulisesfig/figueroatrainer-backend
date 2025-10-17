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
CORS_ORIGINS=https://tu-frontend.vercel.app
```

**Importante:**
- `DATABASE_URL` ya estará configurada automáticamente
- Cambia `JWT_SECRET` por algo único y seguro
- Actualiza `CORS_ORIGINS` con la URL de tu frontend cuando lo despliegues

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
3. Actualiza `CORS_ORIGINS` con la URL de tu frontend:
```
CORS_ORIGINS=https://tu-frontend.vercel.app,https://otro-dominio.com
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
- Incluye tanto http como https si es necesario

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
