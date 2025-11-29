/**
 * Seed default admin user
 * This script runs on startup to ensure an admin user exists
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function seedAdmin() {
  const adminEmail = 'admin@finflowapp.ch';
  const adminPassword = 'Admin123!';
  const adminName = 'System Administrator';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkResult.rows.length > 0) {
      console.log('⏭️  Admin user already exists, skipping seed');
      return;
    }

    // Hash the password using bcryptjs (same library as the app)
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Insert admin user
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'admin', true, NOW())`,
      [adminEmail, passwordHash, adminName]
    );

    console.log('✅ Default admin user created: ' + adminEmail);
    console.log('⚠️  IMPORTANT: Change the password immediately after first login!');
  } catch (error) {
    // Table might not exist yet, that's okay
    if (error.code === '42P01') {
      console.log('⏭️  Users table does not exist yet, skipping admin seed');
    } else {
      console.error('❌ Error seeding admin:', error.message);
    }
  } finally {
    await pool.end();
  }
}

seedAdmin();
