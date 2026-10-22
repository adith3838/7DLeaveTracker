-- Seed data for Leave Service

-- Insert leave types
INSERT INTO leave_type (name, default_allowance, carry_forward) VALUES ('PLANNED', 15, true) ON CONFLICT DO NOTHING;
INSERT INTO leave_type (name, default_allowance, carry_forward) VALUES ('SICK', 10, false) ON CONFLICT DO NOTHING;
INSERT INTO leave_type (name, default_allowance, carry_forward) VALUES ('CASUAL', 7, false) ON CONFLICT DO NOTHING;
INSERT INTO leave_type (name, default_allowance, carry_forward) VALUES ('UNPAID', 365, false) ON CONFLICT DO NOTHING;
