-- Seed default admin user if not exists
-- Password: Admin123! (bcrypt hashed)
-- Change the password immediately after first login!

DO $$
BEGIN
    -- Check if admin user already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@finflowapp.ch') THEN
        INSERT INTO users (id, email, password_hash, name, role, is_active, created_at)
        VALUES (
            gen_random_uuid(),
            'admin@finflowapp.ch',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.T/V/XvCPBxO/Oi', -- Admin123!
            'System Administrator',
            'admin',
            true,
            NOW()
        );
        RAISE NOTICE '✅ Default admin user created: admin@finflowapp.ch';
    ELSE
        RAISE NOTICE '⏭️ Admin user already exists, skipping seed';
    END IF;
END $$;
