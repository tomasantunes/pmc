const crypto = require('crypto');
const mysql = require('mysql2/promise');
const secretConfig = require('./secret-config.json');

async function generateLicense() {
  const tier = (process.argv[2] || 'individual').toLowerCase();
  const tiers = {
    individual: { maxUsers: 1, label: 'Individual' },
    small_teams: { maxUsers: 10, label: 'Small Teams' },
    enterprise: { maxUsers: 100, label: 'Enterprise' }
  };
  if (!tiers[tier]) {
    console.error('Usage: node generate-license.js [individual|small_teams|enterprise]');
    process.exit(1);
  }
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
    `INSERT INTO licenses (license_key, expires_at, tier, max_users)
     VALUES (?, ?, ?, ?)`,
    [licenseKey, expiresAt, tier, tiers[tier].maxUsers]
  );

  console.log(`${tiers[tier].label} license generated (${tiers[tier].maxUsers} user${tiers[tier].maxUsers === 1 ? '' : 's'}):`, licenseKey);
  process.exit(0);
}

generateLicense().catch(console.error);
