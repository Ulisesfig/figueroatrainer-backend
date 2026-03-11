const { query } = require('../src/config/database');

function parseArgs(argv) {
  const options = {
    all: false,
    confirmDelete: false,
    ids: null,
    status: null,
    before: null,
    amountLte: null,
    withoutMpPaymentId: false,
    dryRun: true
  };

  for (const arg of argv) {
    if (arg === '--all') options.all = true;
    if (arg === '--confirm-delete') options.confirmDelete = true;
    if (arg === '--without-mp-payment-id') options.withoutMpPaymentId = true;

    if (arg.startsWith('--status=')) {
      options.status = arg.replace('--status=', '').split(',').map(s => s.trim()).filter(Boolean);
    }

    if (arg.startsWith('--ids=')) {
      options.ids = arg
        .replace('--ids=', '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isInteger(n) && n > 0);
    }

    if (arg.startsWith('--before=')) {
      options.before = arg.replace('--before=', '').trim();
    }

    if (arg.startsWith('--amount-lte=')) {
      const value = Number(arg.replace('--amount-lte=', '').trim());
      if (Number.isFinite(value)) options.amountLte = value;
    }

    if (arg === '--no-dry-run') {
      options.dryRun = false;
    }
  }

  return options;
}

function buildWhereClause(options) {
  const where = [];
  const values = [];
  let idx = 1;

  if (options.ids && options.ids.length > 0) {
    where.push(`id = ANY($${idx})`);
    values.push(options.ids);
    idx += 1;
  }

  if (options.status && options.status.length > 0) {
    where.push(`status = ANY($${idx})`);
    values.push(options.status);
    idx += 1;
  }

  if (options.before) {
    where.push(`created_at < $${idx}`);
    values.push(options.before);
    idx += 1;
  }

  if (options.amountLte !== null) {
    where.push(`amount <= $${idx}`);
    values.push(options.amountLte);
    idx += 1;
  }

  if (options.withoutMpPaymentId) {
    where.push('(mp_payment_id IS NULL OR mp_payment_id = \'\')');
  }

  if (options.all) {
    return { clause: '', values };
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.all && !options.ids && !options.status && !options.before && options.amountLte === null && !options.withoutMpPaymentId) {
    console.log('Uso:');
    console.log('  Simular borrado por IDs:    node scripts/cleanup-payments.js --ids=76,77,78');
    console.log('  Simular borrado por estado: node scripts/cleanup-payments.js --status=pending,rejected');
    console.log('  Simular borrado por fecha:  node scripts/cleanup-payments.js --before=2026-03-11');
    console.log('  Simular borrado por monto:  node scripts/cleanup-payments.js --amount-lte=100');
    console.log('  Borrar todos:              node scripts/cleanup-payments.js --all --no-dry-run --confirm-delete');
    console.log('');
    console.log('Por seguridad el script corre en modo simulacion por defecto.');
    process.exit(0);
  }

  const { clause, values } = buildWhereClause(options);

  try {
    const countResult = await query(
      `SELECT COUNT(*)::int AS count FROM payments ${clause}`,
      values
    );

    const total = countResult.rows[0].count;
    console.log(`Pagos que coinciden con el filtro: ${total}`);

    const sampleResult = await query(
      `
      SELECT id, user_id, plan_type, amount, status, mp_payment_id, created_at
      FROM payments
      ${clause}
      ORDER BY created_at DESC
      LIMIT 20
      `,
      values
    );

    if (sampleResult.rows.length > 0) {
      console.table(sampleResult.rows);
    } else {
      console.log('No hay pagos para borrar con ese filtro.');
      process.exit(0);
    }

    if (options.dryRun) {
      console.log('Simulacion completada (dry-run). No se borro ningun registro.');
      console.log('Para ejecutar borrado real agrega: --no-dry-run --confirm-delete');
      process.exit(0);
    }

    if (!options.confirmDelete) {
      console.log('Falta confirmacion explicita. Agrega --confirm-delete para borrar.');
      process.exit(1);
    }

    await query('BEGIN');

    const deleteResult = await query(
      `DELETE FROM payments ${clause}`,
      values
    );

    await query(
      `SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM payments), 1), false)`
    );

    await query('COMMIT');

    console.log(`Registros eliminados: ${deleteResult.rowCount}`);
    console.log('Limpieza completada.');
    process.exit(0);
  } catch (error) {
    try {
      await query('ROLLBACK');
    } catch (_) {
      // ignore rollback errors
    }

    console.error('Error al limpiar pagos:', error.message);
    process.exit(1);
  }
}

main();
