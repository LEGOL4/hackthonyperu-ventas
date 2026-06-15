const { Pool } = require('pg');

// DEBUG: Ver qué variables están cargadas
console.log('=== DEBUG DATABASE CONNECTION ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 30) + '...');
}
console.log('DB_USER (old):', process.env.DB_USER || 'NOT SET');
console.log('DB_HOST (old):', process.env.DB_HOST || 'NOT SET');
console.log('=================================');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('✅ Conexión a PostgreSQL exitosa'))
  .catch((err) => console.error('❌ Error de conexión:', err.message));

module.exports = pool;
