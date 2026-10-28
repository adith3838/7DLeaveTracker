-- Seed data for the Docker PostgreSQL database.
-- Run with: docker exec -i elms-postgres psql -U postgres -d postgres < docker/seed-data.sql

INSERT INTO roles (name) VALUES
    ('EMPLOYEE'),
    ('MANAGER'),
    ('HR'),
    ('ADMIN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (email, password_hash, name, is_active, role_id)
VALUES
    ('sarah.manager@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah Manager', true, (SELECT id FROM roles WHERE name = 'MANAGER')),
    ('michael.hr@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Michael HR', true, (SELECT id FROM roles WHERE name = 'HR')),
    ('david.admin@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'David Admin', true, (SELECT id FROM roles WHERE name = 'ADMIN')),
    ('john.doe@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John Doe', true, (SELECT id FROM roles WHERE name = 'EMPLOYEE')),
    ('emily.employee@elms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Emily Employee', true, (SELECT id FROM roles WHERE name = 'EMPLOYEE'))
ON CONFLICT (email) DO NOTHING;

INSERT INTO employee (user_id, full_name, department, manager_id, join_date)
SELECT u.id, 'Sarah Manager', 'Engineering', NULL, DATE '2020-05-15'
FROM users u WHERE u.email = 'sarah.manager@elms.com'
  AND NOT EXISTS (SELECT 1 FROM employee e WHERE e.user_id = u.id);

INSERT INTO employee (user_id, full_name, department, manager_id, join_date)
SELECT u.id, 'Michael HR', 'Human Resources', NULL, DATE '2019-03-20'
FROM users u WHERE u.email = 'michael.hr@elms.com'
  AND NOT EXISTS (SELECT 1 FROM employee e WHERE e.user_id = u.id);

INSERT INTO employee (user_id, full_name, department, manager_id, join_date)
SELECT u.id, 'David Admin', 'Administration', NULL, DATE '2018-07-01'
FROM users u WHERE u.email = 'david.admin@elms.com'
  AND NOT EXISTS (SELECT 1 FROM employee e WHERE e.user_id = u.id);

INSERT INTO employee (user_id, full_name, department, manager_id, join_date)
SELECT u.id, 'John Doe', 'Engineering', manager.id, DATE '2022-01-10'
FROM users u
JOIN users manager_user ON manager_user.email = 'sarah.manager@elms.com'
JOIN employee manager ON manager.user_id = manager_user.id
WHERE u.email = 'john.doe@elms.com'
  AND NOT EXISTS (SELECT 1 FROM employee e WHERE e.user_id = u.id);

INSERT INTO employee (user_id, full_name, department, manager_id, join_date)
SELECT u.id, 'Emily Employee', 'Engineering', manager.id, DATE '2023-08-21'
FROM users u
JOIN users manager_user ON manager_user.email = 'sarah.manager@elms.com'
JOIN employee manager ON manager.user_id = manager_user.id
WHERE u.email = 'emily.employee@elms.com'
  AND NOT EXISTS (SELECT 1 FROM employee e WHERE e.user_id = u.id);


-- Seed standard leave balances for all employees for 2026
INSERT INTO leave_balance (employee_id, leave_type_id, remaining_balance, balance_year)
SELECT e.id, lt.id, lt.default_allowance, 2026
FROM employee e
CROSS JOIN leave_type lt
WHERE lt.name IN ('SICK', 'ANNUAL LEAVE', 'COMP_OFF')
ON CONFLICT (employee_id, leave_type_id, balance_year) DO NOTHING;
