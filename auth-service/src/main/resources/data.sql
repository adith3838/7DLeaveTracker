-- Seed data for ELMS Auth Service

-- Insert roles
INSERT INTO roles (name) VALUES ('EMPLOYEE') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('MANAGER') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('HR') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
-- BCrypt hash for "admin123"
INSERT INTO users (email, password_hash, name, is_active, role_id)
VALUES ('admin@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Admin', true, (SELECT id FROM roles WHERE name = 'ADMIN'))
ON CONFLICT (email) DO NOTHING;
