# 🔄 Resetear Base de Datos en Railway

## 🎯 Opción 1: Desde Railway Dashboard (RECOMENDADO - Más fácil)

### Paso 1: Acceder a Railway
1. Ve a [Railway](https://railway.app)
2. Inicia sesión y selecciona tu proyecto
3. Haz clic en tu servicio **PostgreSQL**

### Paso 2: Eliminar datos existentes
En la pestaña **Data**, ejecuta estos comandos SQL uno por uno:

```sql
-- Eliminar todas las tablas
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Paso 3: Crear tablas nuevas con los nuevos campos
Copia y pega TODO el contenido del archivo `src/config/init.sql`:

```sql
-- Script de inicialización de la base de datos
-- Ejecutar este script en tu base de datos PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tabla de usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  document_type VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de contactos/mensajes
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'Tabla de usuarios registrados en la plataforma';
COMMENT ON TABLE contacts IS 'Tabla de mensajes de contacto recibidos';
```

### Paso 4: Verificar
Ejecuta este comando para verificar que todo está bien:

```sql
-- Ver estructura de la tabla users
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Deberías ver estas columnas:
- ✅ id
- ✅ name
- ✅ surname
- ✅ phone (con UNIQUE)
- ✅ email (con UNIQUE)
- ✅ username (con UNIQUE) ← NUEVO
- ✅ document_type ← NUEVO
- ✅ password
- ✅ created_at
- ✅ updated_at

---

## 🎯 Opción 2: Usando Railway CLI

### Paso 1: Instalar Railway CLI (si no lo tienes)
```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex
```

### Paso 2: Autenticarse y conectar
```bash
railway login
railway link
```

### Paso 3: Conectar a la base de datos
```bash
railway connect postgres
```

### Paso 4: En la terminal de PostgreSQL, ejecutar
```sql
-- Copiar y pegar el contenido completo de src/config/init.sql
```

Presiona `Ctrl+D` o escribe `\q` para salir.

---

## 🎯 Opción 3: Usando psql directamente

### Paso 1: Obtener la URL de conexión
En Railway Dashboard:
1. Selecciona tu servicio PostgreSQL
2. Pestaña **Connect**
3. Copia la **Database Connection URL** (algo como: `postgresql://postgres:password@host:port/railway`)

### Paso 2: Conectar con psql
```bash
psql "postgresql://postgres:TU_PASSWORD@containers-us-west-XXX.railway.app:XXXX/railway"
```

### Paso 3: Ejecutar el script
```bash
\i src/config/init.sql
```

O directamente desde PowerShell:
```powershell
psql "postgresql://..." -f src/config/init.sql
```

---

## ✅ Verificación Final

Después de resetear, prueba tu endpoint de registro:

```bash
# Windows PowerShell
$body = @{
    name = "Test"
    surname = "User"
    phone = "+34612345678"
    email = "test@example.com"
    username = "12345678X"
    documentType = "DNI"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://figueroatrainer-backend-production.up.railway.app/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Respuesta esperada:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "name": "Test",
    "surname": "User",
    "email": "test@example.com",
    "phone": "+34612345678",
    "username": "12345678X"
  }
}
```

---

## 🚨 ¿Algo salió mal?

### Ver logs de errores
```bash
railway logs
```

### Verificar conexión a DB
```bash
railway variables
# Busca DATABASE_URL
```

### Verificar estructura de tabla
```sql
\d users
```

### Ver constraints
```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
```

---

## 💡 Consejo

Si prefieres empezar completamente de cero:

1. **En Railway Dashboard:**
   - Ve a tu servicio PostgreSQL
   - Pestaña **Settings**
   - Scroll down y haz clic en **Remove Service**
   - Confirma la eliminación

2. **Agregar nueva base de datos:**
   - En tu proyecto, haz clic en **+ New**
   - Selecciona **Database → PostgreSQL**
   - Espera a que se cree (1-2 minutos)

3. **Ejecutar init.sql:**
   - Sigue la Opción 1 desde el Paso 3

¡Listo! Tu base de datos estará fresca con los nuevos campos.
