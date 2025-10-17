# 🏋️ Figueroa Trainer - Backend API

Backend profesional con Node.js + Express + PostgreSQL para la plataforma Figueroa Trainer.

## 📋 Características

- ✅ Arquitectura MVC organizada
- ✅ PostgreSQL como base de datos
- ✅ Autenticación con JWT
- ✅ Validación de datos con express-validator
- ✅ Seguridad con Helmet y CORS
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Listo para desplegar en Railway

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tu_clave_secreta_super_segura
DATABASE_URL=postgresql://usuario:password@localhost:5432/figueroatrainer
```

### 3. Inicializar la base de datos

Ejecuta el script SQL en tu base de datos PostgreSQL:

```bash
# Opción 1: Desde psql
psql -U tu_usuario -d figueroatrainer -f src/config/init.sql

# Opción 2: Usar el script de Node.js (próximamente)
node src/utils/initDb.js
```

### 4. Iniciar el servidor

```bash
# Desarrollo
npm start

# O directamente con node
node server.js
```

## 📁 Estructura del Proyecto

```
figueroatrainer/
├── server.js                 # Entrada principal del servidor
├── .env                      # Variables de entorno (no subir a git)
├── .env.example              # Ejemplo de variables de entorno
├── package.json
├── public/                   # Archivos estáticos (HTML, CSS, JS)
└── src/
    ├── config/
    │   ├── database.js       # Configuración de PostgreSQL
    │   └── init.sql          # Script de inicialización de DB
    ├── controllers/
    │   ├── authController.js # Lógica de autenticación
    │   ├── userController.js # Lógica de usuarios
    │   └── contactController.js
    ├── middleware/
    │   ├── auth.js           # Middleware de autenticación
    │   ├── validate.js       # Middleware de validación
    │   └── errorHandler.js   # Manejo de errores
    ├── models/
    │   ├── User.js           # Modelo de usuario
    │   └── Contact.js        # Modelo de contacto
    ├── routes/
    │   ├── authRoutes.js     # Rutas de autenticación
    │   ├── userRoutes.js     # Rutas de usuarios
    │   └── contactRoutes.js  # Rutas de contacto
    └── utils/
        └── initDb.js         # Utilidades de base de datos
```

## 🔌 API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/recover` - Recuperar contraseña
- `GET /api/auth/me` - Obtener usuario actual (requiere auth)

### Usuarios

- `GET /api/users/profile` - Obtener perfil (requiere auth)
- `PUT /api/users/profile` - Actualizar perfil (requiere auth)
- `DELETE /api/users/account` - Eliminar cuenta (requiere auth)
- `GET /api/users/all` - Listar todos los usuarios (requiere auth)

### Contacto

- `POST /api/contact` - Enviar mensaje de contacto
- `GET /api/contact` - Listar mensajes (requiere auth)
- `GET /api/contact/:id` - Obtener mensaje (requiere auth)
- `DELETE /api/contact/:id` - Eliminar mensaje (requiere auth)

### Utilidades

- `GET /api/health` - Health check del servidor

## 🚂 Despliegue en Railway

### 1. Crear proyecto en Railway

1. Ve a [Railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Agrega un servicio PostgreSQL

### 2. Configurar variables de entorno en Railway

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_clave_super_segura_para_produccion
DATABASE_URL=${DATABASE_URL}  # Railway lo inyecta automáticamente
COOKIE_SECURE=true
CORS_ORIGINS=https://tu-dominio.com
```

### 3. Inicializar base de datos en Railway

Conecta al CLI de Railway y ejecuta:

```bash
railway connect
railway run psql $DATABASE_URL -f src/config/init.sql
```

### 4. Deploy

Railway desplegará automáticamente cuando hagas push a tu rama principal.

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno

## 📝 Scripts NPM

```bash
npm start       # Iniciar servidor
npm run dev     # Iniciar servidor (alias)
```

## 🔐 Seguridad

- Las contraseñas se encriptan con bcrypt (10 rounds)
- JWT para autenticación stateless
- Helmet para headers de seguridad
- CORS configurado
- Validación de datos en todas las entradas
- SQL injection prevención con queries parametrizadas

## 📄 Licencia

ISC

---

Desarrollado con ❤️ para Figueroa Trainer
