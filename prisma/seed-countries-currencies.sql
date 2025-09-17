-- Seed Countries and Currencies
-- This script will be run before updating the clients table

-- Insert Currencies
INSERT INTO currencies (id, name, code, symbol, "decimalPlaces", "isActive", "createdAt", "updatedAt") VALUES
('cur_usd', 'US Dollar', 'USD', '$', 2, true, NOW(), NOW()),
('cur_eur', 'Euro', 'EUR', '€', 2, true, NOW(), NOW()),
('cur_gbp', 'British Pound', 'GBP', '£', 2, true, NOW(), NOW()),
('cur_inr', 'Indian Rupee', 'INR', '₹', 2, true, NOW(), NOW()),
('cur_cad', 'Canadian Dollar', 'CAD', 'C$', 2, true, NOW(), NOW()),
('cur_aud', 'Australian Dollar', 'AUD', 'A$', 2, true, NOW(), NOW()),
('cur_jpy', 'Japanese Yen', 'JPY', '¥', 0, true, NOW(), NOW()),
('cur_cny', 'Chinese Yuan', 'CNY', '¥', 2, true, NOW(), NOW()),
('cur_brl', 'Brazilian Real', 'BRL', 'R$', 2, true, NOW(), NOW()),
('cur_mxn', 'Mexican Peso', 'MXN', '$', 2, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Countries
INSERT INTO countries (id, name, code, "currencyId", "isActive", "createdAt", "updatedAt") VALUES
('ctry_us', 'United States', 'US', 'cur_usd', true, NOW(), NOW()),
('ctry_ca', 'Canada', 'CA', 'cur_cad', true, NOW(), NOW()),
('ctry_gb', 'United Kingdom', 'GB', 'cur_gbp', true, NOW(), NOW()),
('ctry_de', 'Germany', 'DE', 'cur_eur', true, NOW(), NOW()),
('ctry_fr', 'France', 'FR', 'cur_eur', true, NOW(), NOW()),
('ctry_it', 'Italy', 'IT', 'cur_eur', true, NOW(), NOW()),
('ctry_es', 'Spain', 'ES', 'cur_eur', true, NOW(), NOW()),
('ctry_in', 'India', 'IN', 'cur_inr', true, NOW(), NOW()),
('ctry_au', 'Australia', 'AU', 'cur_aud', true, NOW(), NOW()),
('ctry_jp', 'Japan', 'JP', 'cur_jpy', true, NOW(), NOW()),
('ctry_cn', 'China', 'CN', 'cur_cny', true, NOW(), NOW()),
('ctry_br', 'Brazil', 'BR', 'cur_brl', true, NOW(), NOW()),
('ctry_mx', 'Mexico', 'MX', 'cur_mxn', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
