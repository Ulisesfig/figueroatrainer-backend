const { pool } = require('../src/config/database');

async function resetUserWeights() {
  const client = await pool.connect();

  try {
    console.log('Iniciando reinicio global de pesos de usuarios...');

    await client.query('BEGIN');

    const historyDelete = await client.query('DELETE FROM user_exercise_history');
    const exercisesDelete = await client.query('DELETE FROM user_exercises');

    await client.query('COMMIT');

    console.log('Reinicio completado correctamente.');
    console.log(`Registros eliminados en user_exercise_history: ${historyDelete.rowCount}`);
    console.log(`Registros eliminados en user_exercises: ${exercisesDelete.rowCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al reiniciar pesos de usuarios:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

resetUserWeights();
