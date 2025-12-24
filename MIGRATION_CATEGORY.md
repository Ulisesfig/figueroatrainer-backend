# Migración: Agregar Campo de Categoría a Ejercicios

## Descripción

Esta migración agrega un campo `category` (categoría) a la tabla `exercises` para clasificar ejercicios por grupo muscular (pecho, espalda, pierna, hombro, brazo, core, cardio, otro).

## Fecha
2024-01-XX

## Archivos Modificados

### Backend
- `src/models/Exercise.js` - Actualizado `create` y `update` para incluir `category`
- `src/controllers/exerciseController.js` - Actualizado `create` y `update` para manejar `category`
- `src/config/migration_add_category.sql` - Script SQL para agregar columna
- `src/utils/runMigrations.js` - Agregado `migration_add_category.sql` a la lista
- `scripts/apply-migration-category.js` - Script independiente para aplicar migración

### Frontend
- `public/pages/admin.html`:
  - Agregado select de categoría en formulario de ejercicios (línea ~455)
  - Actualizado `renderExercises` para mostrar `[CATEGORIA]` antes del nombre
  - Actualizado `editExercise` para cargar valor de categoría
  - Actualizado guardado de ejercicio para incluir categoría en payload
  - Actualizado selects de ejercicios en constructor de planes para mostrar "[CATEGORIA] nombre"

## Cómo Aplicar la Migración

### Opción 1: Migración Automática (Recomendada)
La migración se aplicará automáticamente al iniciar el servidor si usas `runMigrations.js`:

```bash
cd figueroatrainer-backend-main
npm start
```

El servidor ejecutará todas las migraciones pendientes, incluyendo `migration_add_category.sql`.

### Opción 2: Script Manual
Si prefieres aplicar solo esta migración:

```bash
cd figueroatrainer-backend-main
node scripts/apply-migration-category.js
```

### Opción 3: SQL Directo
Conéctate a tu base de datos PostgreSQL y ejecuta:

```sql
-- Agregar columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'category'
    ) THEN
        ALTER TABLE exercises ADD COLUMN category VARCHAR(50);
    END IF;
END $$;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
```

## Valores de Categoría

Las categorías disponibles son:
- `pecho` - Ejercicios de pecho
- `espalda` - Ejercicios de espalda
- `pierna` - Ejercicios de piernas
- `hombro` - Ejercicios de hombros
- `biceps` - Ejercicios de bíceps
- `triceps` - Ejercicios de tríceps
- `core` - Ejercicios de abdomen/core
- `cardio` - Ejercicios cardiovasculares
- `otro` - Otros ejercicios

## Retrocompatibilidad

✅ **Esta migración es retrocompatible**:
- La columna `category` acepta valores NULL
- Los ejercicios existentes tendrán `category = NULL` hasta que se editen
- El frontend muestra solo el nombre si no hay categoría
- No se requiere migración de datos existentes

## Funcionalidad Frontend

Después de actualizar el frontend:

1. **Formulario de ejercicios**: Nuevo select obligatorio con categorías
2. **Lista de ejercicios**: Muestra `[CATEGORIA]` en dorado antes del nombre
3. **Constructor de planes**: Los ejercicios se muestran con formato `[CATEGORIA] nombre • 3x12`
4. **Búsqueda futura**: El índice permite filtrar ejercicios por categoría eficientemente

## Testing

Para verificar que la migración funcionó:

```sql
-- Ver estructura de tabla
\d exercises

-- Verificar que la columna existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'category';

-- Ver ejercicios con/sin categoría
SELECT id, name, category FROM exercises LIMIT 10;
```

## Rollback (Deshacer)

Si necesitas revertir esta migración:

```sql
-- Eliminar índice
DROP INDEX IF EXISTS idx_exercises_category;

-- Eliminar columna
ALTER TABLE exercises DROP COLUMN IF EXISTS category;
```

**⚠️ Advertencia**: Esto eliminará todas las categorías asignadas a ejercicios.

## Siguiente Paso Recomendado

Después de aplicar la migración, considera:

1. **Agregar filtro por categoría** en la interfaz de administración
2. **Pre-popular categorías** para ejercicios existentes vía script
3. **Agregar validación** de categorías permitidas en el backend
4. **Permitir categorías personalizadas** si los usuarios lo necesitan

## Soporte

Si encuentras problemas con la migración:
1. Verifica que PostgreSQL esté corriendo
2. Revisa los logs del servidor: `npm start`
3. Verifica permisos de la base de datos
4. Contacta al administrador del sistema
