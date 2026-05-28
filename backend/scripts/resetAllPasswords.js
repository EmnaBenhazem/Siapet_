require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

const accounts = [
  { email: 'admin@siapet.rnu.tn',              password: 'Admin2024',      role: 'ADMIN_MESRS' },
  { email: 'gsebteoui@gmail.com',              password: 'Recteur2024',    role: 'RECTEUR (DGET)' },
  { email: 'adel.louhichi.dir@iset.rnu.tn',   password: 'Directeur2024',  role: 'DIRECTEUR ISET Rades' },
  { email: 'ahmed.trabelsi@isetrades.tn',      password: 'Enseignant2024', role: 'ENSEIGNANT ISET Rades' },
];

async function resetAll() {
  const client = await pool.connect();
  try {
    console.log('Resetting passwords...\n');
    for (const acc of accounts) {
      const hash = await bcrypt.hash(acc.password, 10);
      const res = await client.query(
        'UPDATE utilisateur SET mot_de_passe = $1 WHERE email = $2',
        [hash, acc.email]
      );
      if (res.rowCount > 0) {
        console.log(`✓ ${acc.role}`);
        console.log(`  Email:    ${acc.email}`);
        console.log(`  Password: ${acc.password}\n`);
      } else {
        console.log(`✗ Not found: ${acc.email}\n`);
      }
    }
  } finally {
    client.release();
    pool.end();
  }
}

resetAll();
