-- Crear tabla de pagos con Mercado Pago
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  mp_payment_id VARCHAR(100) UNIQUE,
  mp_preference_id VARCHAR(100),
  mp_merchant_order_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_type VARCHAR(50),
  transaction_details JSONB,
  payer_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_update_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();
