const crypto = require('crypto');
const mysql = require('mysql2/promise');
const secretConfig = require('./secret-config.json');

async function generateLicense() {
  const db = await mysql.createConnection({
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME
  });

  // 256-bit random key
  const licenseKey = crypto.randomBytes(32).toString('hex');

  // Expires in 1 year
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.execute(
    `INSERT INTO licenses (license_key, expires_at)
     VALUES (?, ?)`,
    [licenseKey, expiresAt]
  );

  console.log('License generated:', licenseKey);
  process.exit(0);
}

generateLicense().catch(console.error);
