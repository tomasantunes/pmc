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

    if (new Date(license.expires_at) < new Date()) {
      throw new Error('License expired');
    }

    const [organizationRows] = await conn.execute(
      'SELECT id FROM organizations WHERE license_id = ? FOR UPDATE',
      [license.id]
    );
    let organizationId;
    if (organizationRows.length) {
      organizationId = organizationRows[0].id;
    } else {
      const [organization] = await conn.execute(
        'INSERT INTO organizations (license_id, name) VALUES (?, ?)',
        [license.id, `Organization ${license.id}`]
      );
      organizationId = organization.insertId;
    }
    const [[membership]] = await conn.execute(
      'SELECT COUNT(*) AS total FROM users WHERE organization_id = ?',
      [organizationId]
    );
    if (membership.total >= license.max_users) throw new Error('License user limit reached');

    const [result] = await conn.execute(
      `UPDATE users SET license_key = ?, license_expires = ?, organization_id = ? WHERE id = ?`,
      [license.license_key, license.expires_at, organizationId, user_id]
    );

    // Mark license as used
    await conn.execute(
      `UPDATE licenses
       SET used_at = COALESCE(used_at, NOW()), used_by_user_id = COALESCE(used_by_user_id, ?)
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
