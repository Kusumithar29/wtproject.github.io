/**
 * Ensure every user has plainPassword + bcrypt password in db.json.
 * Run: npm run fix-passwords
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

const inferPlainPassword = (user) => {
  const flat = String(user.flatNumber || '').trim();
  const emailNum = (user.email || '').match(/(\d{3})/)?.[1];
  const digits = flat || emailNum || '123456';

  switch (user.role) {
    case 'admin':
      return 'ADM123456';
    case 'manager':
      return 'MNG123456';
    case 'owner':
      return `OWN${digits}${digits}`;
    case 'tenant':
      return `TEN${digits}${digits}`;
    default:
      return `ADM${digits}`;
  }
};

async function main() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!db.User?.length) {
    console.error('No users in db.json');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(12);
  let updated = 0;

  for (const user of db.User) {
    let plain = user.plainPassword;
    if (!plain || !String(plain).trim()) {
      plain = inferPlainPassword(user);
      user.plainPassword = plain;
      console.log(`Added plainPassword for ${user.email}: ${plain}`);
      updated++;
    }

    if (!user.password || !String(user.password).startsWith('$2')) {
      user.password = await bcrypt.hash(plain, salt);
      console.log(`Added password hash for ${user.email}`);
      updated++;
    } else {
      user.password = await bcrypt.hash(plain, salt);
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Done. ${updated} field(s) added; all ${db.User.length} users have plainPassword + bcrypt hash.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
