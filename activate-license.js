const crypto = require('crypto');
const mysql = require('mysql2/promise');
const secretConfig = require('./secret-config.json');

async function activateLicense() {
  const conn = await mysql.createConnection({
    host: secretConfig.DB_HOST,
    user: secretConfig.DB_USER,
    password: secretConfig.DB_PASSWORD,
    database: secretConfig.DB_NAME
  });

  var user_id = process.argv[2];
  var license_key = process.argv[3];

  if (!user_id || !license_key) {
    console.error('Usage: node activate-license.js <user_id> <license_key>');
    process.exit(1);
  }

  try {
    await conn.beginTransaction();

    // Lock license row
    const [licenses] = await conn.execute(
      `SELECT *
       FROM licenses
       WHERE license_key = ?
       FOR UPDATE`,
      [license_key]
    );

    if (licenses.length === 0) {
      throw new Error('Invalid license key');
    }

    const license = licenses[0];

    if (license.used_at) {
      throw new Error('License already used');
    }

    if (new Date(license.expires_at) < new Date()) {
      throw new Error('License expired');
    }

    // Create user
    const [result] = await conn.execute(
      `UPDATE users SET license_key = ?, license_expires = ? WHERE id = ?`,
      [license.license_key, license.expires_at, user_id]
    );

    // Mark license as used
    await conn.execute(
      `UPDATE licenses
       SET used_at = NOW(), used_by_user_id = ?
       WHERE id = ?`,
      [user_id, license.id]
    );

    await conn.commit();

    console.log('License activated for user ID:', user_id);

  } catch (err) {
    await conn.rollback();
    console.error('Error activating license:', err.message);
  } finally {
    conn.end()
  }
  process.exit(0);
}

activateLicense().catch(console.error);