# Migración de Base de Datos - Registro con Documento

## 🎯 Cambios implementados

### Backend
- ✅ Agregado campo `username` (número de documento) con constraint UNIQUE
- ✅ Agregado campo `documentType` (tipo de documento: DNI, Pasaporte, etc.)
- ✅ Agregado constraint UNIQUE para `phone`
- ✅ Validación de duplicados con respuesta HTTP 409 Conflict
- ✅ Respuesta estructurada con campo `field` para identificar duplicados

### Respuestas de error mejoradas
```json
// Email duplicado
{
  "success": false,
  "message": "Este email ya está registrado",
  "field": "email"
}

// Teléfono duplicado
{
  "success": false,
  "message": "Este teléfono ya está registrado",
  "field": "phone"
}

// Documento duplicado
{
  "success": false,
  "message": "Este documento ya está registrado",
  "field": "username"
}
```

## 🔧 Cómo aplicar la migración

### Opción 1: Base de datos NUEVA (sin datos)
Si estás creando la base de datos desde cero, simplemente ejecuta:

```bash
psql -U tu_usuario -d tu_database -f src/config/init.sql
```

O usa el script de inicialización:
```bash
npm run init-db
```

### Opción 2: Base de datos EXISTENTE (con datos)
Si ya tienes usuarios registrados, ejecuta la migración:

```bash
psql -U tu_usuario -d tu_database -f src/config/migration_add_username.sql
```

**⚠️ IMPORTANTE:** Después de ejecutar la migración, los usuarios existentes tendrán valores temporales:
- `username`: `temp_1`, `temp_2`, etc.
- `document_type`: `DNI` (por defecto)

Deberás actualizar estos valores manualmente o solicitar a los usuarios que actualicen su perfil.

### En Railway/Producción

1. Conéctate a tu base de datos PostgreSQL desde Railway:
```bash
railway login
railway link
railway connect postgres
```

2. Ejecuta el script de migración:
```sql
-- Copia y pega el contenido de migration_add_username.sql
```

O usa psql directamente con la URL de conexión:
```bash
psql "postgresql://usuario:password@host:puerto/database" -f src/config/migration_add_username.sql
```

## 🧪 Testing

### Probar registro nuevo
```bash
curl -X POST https://tu-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan",
    "surname": "Pérez",
    "phone": "+34612345678",
    "email": "juan@example.com",
    "username": "12345678X",
    "documentType": "DNI",
    "password": "123456"
  }'
```

### Probar duplicado
```bash
# Intentar registrar el mismo email
curl -X POST https://tu-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María",
    "surname": "García",
    "phone": "+34698765432",
    "email": "juan@example.com",
    "username": "87654321Y",
    "documentType": "DNI",
    "password": "654321"
  }'

# Respuesta esperada:
# {
#   "success": false,
#   "message": "Este email ya está registrado",
#   "field": "email"
# }
```

## 📋 Checklist de despliegue

- [ ] Ejecutar migración en base de datos
- [ ] Verificar que los índices se crearon correctamente
- [ ] Probar registro con datos nuevos
- [ ] Probar validación de duplicados (email, phone, username)
- [ ] Verificar que el frontend muestra los mensajes correctamente
- [ ] Actualizar usuarios existentes si los hay

## 🔍 Verificar la estructura

```sql
-- Ver estructura de la tabla users
\d users

-- Ver constraints únicos
SELECT conname, contype, conkey 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Ver índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';
```

## 🚨 Rollback (si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- Eliminar constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Eliminar columnas
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS document_type;

-- Eliminar índices
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_username;
```
