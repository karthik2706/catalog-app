-- Production Database Backup
-- Generated: 2025-11-04T17:41:42.533Z
-- Tables: 16

BEGIN;

-- Table: api_keys
-- Records: 2

INSERT INTO "api_keys" ("id", "name", "key", "secret", "clientId", "isActive", "permissions", "lastUsedAt", "expiresAt", "createdAt", "updatedAt") VALUES
  ('api-key-1758934761629', 'Default Company Integration', 'cat_sk_2e73e44dd9adad12a36fb1e293b485f76e56ee262bc91dea824fc62d5e68c932', NULL, 'cmg1fnate0000y7jhvtmfha19', TRUE, '["inventory:read","inventory:write","products:read","products:write"]'::jsonb, NULL, NULL, '"2025-09-27T00:59:21.629Z"'::jsonb, '"2025-09-27T00:59:21.629Z"'::jsonb),
  ('api-key-1759167330505', 'Yoshitha Integration', 'cat_sk_26af78751ba81f611736879c0f18905138de7be06c5df6cc7907c28fed1c28bc', NULL, 'cmg1srt900001l5049x26l2cp', TRUE, '["inventory:read","inventory:write","products:read","products:write"]'::jsonb, NULL, NULL, '"2025-09-29T17:35:30.505Z"'::jsonb, '"2025-09-29T17:35:30.505Z"'::jsonb);

-- Table: categories
-- Records: 14

INSERT INTO "categories" ("id", "name", "description", "isActive", "clientId", "parentId", "sortOrder", "createdAt", "updatedAt") VALUES
  ('cmg5f3d7o0003l804vmxh5d2y', 'Bangles', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-09-29T17:43:29.701Z"'::jsonb, '"2025-09-29T17:43:29.701Z"'::jsonb),
  ('cmhgcpq4f0001l10491v94f1j', 'Black Beads', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T14:02:04.288Z"'::jsonb, '"2025-11-01T14:02:04.288Z"'::jsonb),
  ('cmhgcq6pu0001kz04mlans2xj', 'GJ Bangles', NULL, FALSE, 'cmg1srt900001l5049x26l2cp', 'cmg5f3d7o0003l804vmxh5d2y', 0, '"2025-11-01T14:02:25.794Z"'::jsonb, '"2025-11-01T14:02:37.568Z"'::jsonb),
  ('cmhgd8l2q0004ky04uwi0a2pv', 'Jumkas', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T14:16:44.211Z"'::jsonb, '"2025-11-01T17:43:08.302Z"'::jsonb),
  ('cmg5f33zu0001l804s1wrqr5t', 'CZ Necklaces', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-09-29T17:43:17.754Z"'::jsonb, '"2025-11-01T17:43:43.460Z"'::jsonb),
  ('cmhgknb5p0001js04qvasnpzo', 'GJ Necklaces', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:44:08.509Z"'::jsonb, '"2025-11-01T17:44:08.509Z"'::jsonb),
  ('cmhgkntwx0001ib04a4y9dxou', 'Mat haram', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:44:32.817Z"'::jsonb, '"2025-11-01T17:44:32.817Z"'::jsonb),
  ('cmhgkoax60003js04bp3l0c36', 'Aravanki', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:44:54.858Z"'::jsonb, '"2025-11-01T17:44:54.858Z"'::jsonb),
  ('cmhgkonzs0001l504aofu3gyj', 'CHAMPASWARALU', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:45:11.800Z"'::jsonb, '"2025-11-01T17:45:11.800Z"'::jsonb),
  ('cmhgkox8n0003ib0427athu89', 'Jada set', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:45:23.783Z"'::jsonb, '"2025-11-01T17:45:23.783Z"'::jsonb),
  ('cmhgkplzd0005js04tn9fghob', 'Sun & Moon', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:45:55.850Z"'::jsonb, '"2025-11-01T17:45:55.850Z"'::jsonb),
  ('cmhgkpywb0005ib04ymz2zgwk', 'Combo Set', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:46:12.587Z"'::jsonb, '"2025-11-01T17:46:12.587Z"'::jsonb),
  ('cmhgkqq830001l8047ev8tmz7', 'BRACELET', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:46:48.004Z"'::jsonb, '"2025-11-01T17:46:48.004Z"'::jsonb),
  ('cmhgkr6uf0003l804bzsy4f16', 'CHOKERS', NULL, TRUE, 'cmg1srt900001l5049x26l2cp', NULL, 0, '"2025-11-01T17:47:09.544Z"'::jsonb, '"2025-11-01T17:47:09.544Z"'::jsonb);

-- Table: client_settings
-- Records: 2

INSERT INTO "client_settings" ("id", "clientId", "companyName", "email", "phone", "address", "timezone", "lowStockThreshold", "autoReorder", "emailNotifications", "smsNotifications", "createdAt", "updatedAt") VALUES
  ('cmg1srtao0003l504o1i6kqz5', 'cmg1srt900001l5049x26l2cp', 'Yoshita Fashion Jewellery', 'yoshita@stockmind.in', '9951733377', '27, 21-65, Kaleswararao Rd, Governor Peta, Vijayawada, Andhra Pradesh 520002', 'America/New_York', 10, FALSE, TRUE, FALSE, '"2025-09-27T04:55:20.592Z"'::jsonb, '"2025-09-27T04:55:20.592Z"'::jsonb),
  ('cmgya2gpg0003jm047en03ivq', 'cmgya2gn30001jm04l9nho4y1', 'Vanitha Fashion Jewelry', 'vanithafashionjewellery.usa@gmail.com', '2408699718', '325 WEST SIDE DR APT 201 
Gaithersburg, Maryland 20878', 'America/New_York', 10, FALSE, TRUE, FALSE, '"2025-10-19T22:28:08.596Z"'::jsonb, '"2025-10-19T22:28:08.596Z"'::jsonb);

-- Table: clients
-- Records: 3

INSERT INTO "clients" ("id", "name", "slug", "domain", "email", "phone", "address", "logo", "countryId", "currencyId", "isActive", "plan", "createdAt", "updatedAt", "guestAccessEnabled", "guestPassword") VALUES
  ('cmg1fnate0000y7jhvtmfha19', 'Default Client', 'default-client', NULL, 'admin@example.com', NULL, NULL, NULL, NULL, NULL, TRUE, 'STARTER', '"2025-09-26T22:47:55.011Z"'::jsonb, '"2025-09-26T22:47:55.011Z"'::jsonb, FALSE, NULL),
  ('cmgya2gn30001jm04l9nho4y1', 'Vanitha Fashion Jewelry', 'vanitha-fashion-jewelry', NULL, 'vanithafashionjewellery.usa@gmail.com', '2408699718', '325 WEST SIDE DR APT 201 
Gaithersburg, Maryland 20878', NULL, 'cty_us', 'cur_usd', TRUE, 'ENTERPRISE', '"2025-10-19T22:28:08.511Z"'::jsonb, '"2025-10-19T22:28:08.511Z"'::jsonb, FALSE, NULL),
  ('cmg1srt900001l5049x26l2cp', 'Yoshita Fashion Jewellery', 'yoshita-fashion-jewellery', NULL, 'yoshita@stockmind.in', '9951733377', '27, 21-65, Kaleswararao Rd, Governor Peta, Vijayawada, Andhra Pradesh 520002', NULL, 'cty_in', 'cur_inr', TRUE, 'STARTER', '"2025-09-27T04:55:20.533Z"'::jsonb, '"2025-11-01T20:39:01.660Z"'::jsonb, TRUE, 'guest123');

-- Table: countries
-- Records: 13

INSERT INTO "countries" ("id", "name", "code", "currencyId", "isActive", "createdAt", "updatedAt") VALUES
  ('cty_us', 'United States', 'US', 'cur_usd', TRUE, '"2025-09-17T20:11:40.701Z"'::jsonb, '"2025-09-17T20:11:40.701Z"'::jsonb),
  ('cty_in', 'India', 'IN', 'cur_inr', TRUE, '"2025-09-17T20:11:40.862Z"'::jsonb, '"2025-09-17T20:11:40.862Z"'::jsonb),
  ('cty_ca', 'Canada', 'CA', 'cur_cad', TRUE, '"2025-10-03T22:14:04.454Z"'::jsonb, '"2025-10-03T22:14:04.454Z"'::jsonb),
  ('cty_gb', 'United Kingdom', 'GB', 'cur_gbp', TRUE, '"2025-10-03T22:14:04.508Z"'::jsonb, '"2025-10-03T22:14:04.508Z"'::jsonb),
  ('cty_de', 'Germany', 'DE', 'cur_eur', TRUE, '"2025-10-03T22:14:04.537Z"'::jsonb, '"2025-10-03T22:14:04.537Z"'::jsonb),
  ('cty_fr', 'France', 'FR', 'cur_eur', TRUE, '"2025-10-03T22:14:04.564Z"'::jsonb, '"2025-10-03T22:14:04.564Z"'::jsonb),
  ('cty_it', 'Italy', 'IT', 'cur_eur', TRUE, '"2025-10-03T22:14:04.591Z"'::jsonb, '"2025-10-03T22:14:04.591Z"'::jsonb),
  ('cty_es', 'Spain', 'ES', 'cur_eur', TRUE, '"2025-10-03T22:14:04.622Z"'::jsonb, '"2025-10-03T22:14:04.622Z"'::jsonb),
  ('cty_au', 'Australia', 'AU', 'cur_aud', TRUE, '"2025-10-03T22:14:04.650Z"'::jsonb, '"2025-10-03T22:14:04.650Z"'::jsonb),
  ('cty_jp', 'Japan', 'JP', 'cur_jpy', TRUE, '"2025-10-03T22:14:04.715Z"'::jsonb, '"2025-10-03T22:14:04.715Z"'::jsonb),
  ('cty_cn', 'China', 'CN', 'cur_cny', TRUE, '"2025-10-03T22:14:04.792Z"'::jsonb, '"2025-10-03T22:14:04.792Z"'::jsonb),
  ('cty_br', 'Brazil', 'BR', 'cur_brl', TRUE, '"2025-10-03T22:14:04.816Z"'::jsonb, '"2025-10-03T22:14:04.816Z"'::jsonb),
  ('cty_mx', 'Mexico', 'MX', 'cur_mxn', TRUE, '"2025-10-03T22:14:04.840Z"'::jsonb, '"2025-10-03T22:14:04.840Z"'::jsonb);

-- Table: currencies
-- Records: 10

INSERT INTO "currencies" ("id", "name", "code", "symbol", "decimalPlaces", "isActive", "createdAt", "updatedAt") VALUES
  ('cur_usd', 'US Dollar', 'USD', '$', 2, TRUE, '"2025-09-17T20:11:40.417Z"'::jsonb, '"2025-09-17T20:11:40.417Z"'::jsonb),
  ('cur_inr', 'Indian Rupee', 'INR', '₹', 2, TRUE, '"2025-09-17T20:11:40.600Z"'::jsonb, '"2025-09-17T20:11:40.600Z"'::jsonb),
  ('cur_eur', 'Euro', 'EUR', '€', 2, TRUE, '"2025-10-03T22:13:40.808Z"'::jsonb, '"2025-10-03T22:13:40.808Z"'::jsonb),
  ('cur_gbp', 'British Pound', 'GBP', '£', 2, TRUE, '"2025-10-03T22:13:41.019Z"'::jsonb, '"2025-10-03T22:13:41.019Z"'::jsonb),
  ('cur_cad', 'Canadian Dollar', 'CAD', 'C$', 2, TRUE, '"2025-10-03T22:13:41.409Z"'::jsonb, '"2025-10-03T22:13:41.409Z"'::jsonb),
  ('cur_aud', 'Australian Dollar', 'AUD', 'A$', 2, TRUE, '"2025-10-03T22:13:41.544Z"'::jsonb, '"2025-10-03T22:13:41.544Z"'::jsonb),
  ('cur_jpy', 'Japanese Yen', 'JPY', '¥', 0, TRUE, '"2025-10-03T22:13:41.729Z"'::jsonb, '"2025-10-03T22:13:41.729Z"'::jsonb),
  ('cur_cny', 'Chinese Yuan', 'CNY', '¥', 2, TRUE, '"2025-10-03T22:13:41.935Z"'::jsonb, '"2025-10-03T22:13:41.935Z"'::jsonb),
  ('cur_brl', 'Brazilian Real', 'BRL', 'R$', 2, TRUE, '"2025-10-03T22:13:42.166Z"'::jsonb, '"2025-10-03T22:13:42.166Z"'::jsonb),
  ('cur_mxn', 'Mexican Peso', 'MXN', '$', 2, TRUE, '"2025-10-03T22:13:42.344Z"'::jsonb, '"2025-10-03T22:13:42.344Z"'::jsonb);

-- Table: media
-- Records: 131

INSERT INTO "media" ("id", "productId", "kind", "s3Key", "originalName", "mimeType", "fileSize", "width", "height", "durationMs", "altText", "caption", "sortOrder", "isPrimary", "status", "error", "createdAt", "updatedAt") VALUES
  ('cmhgdgqwd0000jp0492ymf93u', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762006984523-0e31a6f8-IMG-20251101-WA0182.jpg', 'IMG-20251101-WA0182.jpg', 'image/jpeg', 139835, 1290, 1535, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T14:23:04.932Z"'::jsonb, '"2025-11-01T14:23:04.932Z"'::jsonb),
  ('cmhglayg00000l704l4pmyjp9', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762020151187-4bef670a-IMG-20251101-WA0289.jpg', 'IMG-20251101-WA0289.jpg', 'image/jpeg', 1563809, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T18:02:31.643Z"'::jsonb, '"2025-11-01T18:02:31.643Z"'::jsonb),
  ('cmhglayjb0001l704ludk5yqd', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762020151808-b0851769-IMG-20251101-WA0290.jpg', 'IMG-20251101-WA0290.jpg', 'image/jpeg', 1744940, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T18:02:31.895Z"'::jsonb, '"2025-11-01T18:02:31.895Z"'::jsonb),
  ('cmhgq1tz40000l204uf8vq0hc', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028123627-28cc2e6d-IMG-20251030-WA0366.jpg', 'IMG-20251030-WA0366.jpg', 'image/jpeg', 1527170, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:15:24.055Z"'::jsonb, '"2025-11-01T20:15:24.055Z"'::jsonb),
  ('cmhgq2ln60001l204vzyyq1ac', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028159668-4c2bb061-IMG-20251030-WA0364-1.jpg', 'IMG-20251030-WA0364(1).jpg', 'image/jpeg', 1342205, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:15:59.929Z"'::jsonb, '"2025-11-01T20:15:59.929Z"'::jsonb),
  ('cmhgq3pqo0002l204w969uslv', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028211575-fef07727-IMG-20251030-WA0363-1.jpg', 'IMG-20251030-WA0363(1).jpg', 'image/jpeg', 1665991, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:16:51.895Z"'::jsonb, '"2025-11-01T20:16:51.895Z"'::jsonb),
  ('cmhgq4aqd0003l204ssghm53o', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028238890-fadd57c9-IMG-20251030-WA0353.jpg', 'IMG-20251030-WA0353.jpg', 'image/jpeg', 1001552, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:17:19.083Z"'::jsonb, '"2025-11-01T20:17:19.083Z"'::jsonb),
  ('cmhgq4ttw0004l204y4ipwqqr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028263593-aad123ed-IMG-20251101-WA0290.jpg', 'IMG-20251101-WA0290.jpg', 'image/jpeg', 1744940, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:17:43.852Z"'::jsonb, '"2025-11-01T20:17:43.852Z"'::jsonb),
  ('cmhgq59bj0005l2040tl52fvx', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028283713-2a40d70e-IMG-20251101-WA0289.jpg', 'IMG-20251101-WA0289.jpg', 'image/jpeg', 1563809, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:18:03.929Z"'::jsonb, '"2025-11-01T20:18:03.929Z"'::jsonb),
  ('cmhgq5qh80006l204nj2ek1vg', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028305928-3bc85e52-IMG-20251029-WA0171-1.jpg', 'IMG-20251029-WA0171(1).jpg', 'image/jpeg', 1739881, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:18:26.156Z"'::jsonb, '"2025-11-01T20:18:26.156Z"'::jsonb),
  ('cmhgq66l70007l204b7xspgwz', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028326855-aeacc6f0-IMG-20251029-WA0173.jpg', 'IMG-20251029-WA0173.jpg', 'image/jpeg', 1592467, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:18:47.041Z"'::jsonb, '"2025-11-01T20:18:47.041Z"'::jsonb),
  ('cmhgq7t0d0008l204l1n3ylkx', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028402433-57042085-IMG-20251029-WA0174.jpg', 'IMG-20251029-WA0174.jpg', 'image/jpeg', 1924648, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:20:02.735Z"'::jsonb, '"2025-11-01T20:20:02.735Z"'::jsonb),
  ('cmhgq7t4d0009l204hx138yny', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028402881-b084b3a8-IMG-20251029-WA0178.jpg', 'IMG-20251029-WA0178.jpg', 'image/jpeg', 2006449, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:20:02.990Z"'::jsonb, '"2025-11-01T20:20:02.990Z"'::jsonb),
  ('cmhgq88e6000al204vfg9evyi', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028422490-0e162015-IMG-20251029-WA0176.jpg', 'IMG-20251029-WA0176.jpg', 'image/jpeg', 1214767, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:20:22.675Z"'::jsonb, '"2025-11-01T20:20:22.675Z"'::jsonb),
  ('cmhgq8q3d000bl204ggvidfuu', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028445450-15b9b3cb-IMG-20251029-WA0214-1.jpg', 'IMG-20251029-WA0214(1).jpg', 'image/jpeg', 1390790, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:20:45.631Z"'::jsonb, '"2025-11-01T20:20:45.631Z"'::jsonb),
  ('cmhgq8q6l000cl2044la5ct9n', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028445737-173b7ba4-IMG-20251029-WA0218-1.jpg', 'IMG-20251029-WA0218(1).jpg', 'image/jpeg', 1118873, 2160, 3840, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:20:45.837Z"'::jsonb, '"2025-11-01T20:20:45.837Z"'::jsonb),
  ('cmhgq95og000dl204r99yxo4g', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028465659-e48a8d2a-IMG-20251029-WA0222.jpg', 'IMG-20251029-WA0222.jpg', 'image/jpeg', 1599562, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:21:05.828Z"'::jsonb, '"2025-11-01T20:21:05.828Z"'::jsonb),
  ('cmhgq9hyp000el204kc0psk8f', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028481580-ee06cc6e-IMG-20251029-WA0224.jpg', 'IMG-20251029-WA0224.jpg', 'image/jpeg', 1347643, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:21:21.751Z"'::jsonb, '"2025-11-01T20:21:21.751Z"'::jsonb),
  ('cmhgq9wg0000fl204c4j7roo4', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028500323-4c5588ee-IMG-20251030-WA0004.jpg', 'IMG-20251030-WA0004.jpg', 'image/jpeg', 1433131, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:21:40.517Z"'::jsonb, '"2025-11-01T20:21:40.517Z"'::jsonb),
  ('cmhgq9wj3000gl204nu2ew57b', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028500625-ce830ffb-IMG-20251030-WA0002.jpg', 'IMG-20251030-WA0002.jpg', 'image/jpeg', 1525622, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:21:40.720Z"'::jsonb, '"2025-11-01T20:21:40.720Z"'::jsonb),
  ('cmhgqaeja000hl2044qnzeaay', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028523778-032a5434-IMG-20251030-WA0491-1.jpg', 'IMG-20251030-WA0491(1).jpg', 'image/jpeg', 1402518, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:03.949Z"'::jsonb, '"2025-11-01T20:22:03.949Z"'::jsonb),
  ('cmhgqaelz000il204bpz4pv3l', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028524068-0c2c5d1c-IMG-20251030-WA0494.jpg', 'IMG-20251030-WA0494.jpg', 'image/jpeg', 1169514, 2160, 3840, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:04.151Z"'::jsonb, '"2025-11-01T20:22:04.151Z"'::jsonb),
  ('cmhgqaeoi000jl204kuvlo7sd', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028524160-b9610a79-IMG-20251030-WA0495.jpg', 'IMG-20251030-WA0495.jpg', 'image/jpeg', 149657, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:04.242Z"'::jsonb, '"2025-11-01T20:22:04.242Z"'::jsonb),
  ('cmhgqb0l4000kl2049m7qcezg', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028552440-c1445c27-IMG-20251030-WA0498-1.jpg', 'IMG-20251030-WA0498(1).jpg', 'image/jpeg', 130906, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:32.542Z"'::jsonb, '"2025-11-01T20:22:32.542Z"'::jsonb),
  ('cmhgqb0oa000ll204gzu2kizb', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028552650-5227b766-IMG-20251030-WA0501.jpg', 'IMG-20251030-WA0501.jpg', 'image/jpeg', 176343, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:32.747Z"'::jsonb, '"2025-11-01T20:22:32.747Z"'::jsonb),
  ('cmhgqb0qm000ml204z6j0cb2t', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028552756-565e8ca5-IMG-20251030-WA0499.jpg', 'IMG-20251030-WA0499.jpg', 'image/jpeg', 136668, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:32.830Z"'::jsonb, '"2025-11-01T20:22:32.830Z"'::jsonb),
  ('cmhgqbcm2000nl20435wqs437', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028568007-e931a0ab-IMG-20251030-WA0502.jpg', 'IMG-20251030-WA0502.jpg', 'image/jpeg', 164970, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:48.125Z"'::jsonb, '"2025-11-01T20:22:48.125Z"'::jsonb),
  ('cmhgqbco7000ol204foddb42d', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028568234-1b274a69-IMG-20251030-WA0500.jpg', 'IMG-20251030-WA0500.jpg', 'image/jpeg', 132752, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:22:48.296Z"'::jsonb, '"2025-11-01T20:22:48.296Z"'::jsonb),
  ('cmhgqbpcp000pl204qk2oo389', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028584543-3daf8cb9-IMG-20251030-WA0504-1.jpg', 'IMG-20251030-WA0504(1).jpg', 'image/jpeg', 107874, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:23:04.643Z"'::jsonb, '"2025-11-01T20:23:04.643Z"'::jsonb),
  ('cmhgqbpes000ql2040z8qgt21', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762028584746-7986ded9-IMG-20251030-WA0503.jpg', 'IMG-20251030-WA0503.jpg', 'image/jpeg', 114979, 720, 1280, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-01T20:23:04.805Z"'::jsonb, '"2025-11-01T20:23:04.805Z"'::jsonb),
  ('cmhiwmws60000l504bsikoww9', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762160117077-222dfd3c-image.jpg', 'image.jpg', 'image/jpeg', 2043028, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T08:55:17.518Z"'::jsonb, '"2025-11-03T08:55:17.518Z"'::jsonb),
  ('cmhix2ap80000l504hzzazg7k', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/products/image/l2cp-products-image-1762160834804-5cb94a49-19fed7ca-338b-4313-8f1f-ec7bceb6f9a5.jpeg', '19fed7ca-338b-4313-8f1f-ec7bceb6f9a5.jpeg', 'image/jpeg', 2177131, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T09:07:15.335Z"'::jsonb, '"2025-11-03T09:07:15.335Z"'::jsonb),
  ('cmhiypnnz0000l4044cyiou4g', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762163604577-457f018c-IMG_20251103_152254.jpg', 'IMG_20251103_152254.jpg', 'image/jpeg', 67989, 702, 745, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T09:53:24.915Z"'::jsonb, '"2025-11-03T09:53:24.915Z"'::jsonb),
  ('cmhj1j5l30000jm04lfbnzace', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762168339906-f62fee14-IMG_6714.jpeg', 'IMG_6714.jpeg', 'image/jpeg', 1770687, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:12:20.338Z"'::jsonb, '"2025-11-03T11:12:20.338Z"'::jsonb),
  ('cmhj1j5ps0001jm04z0w3ente', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762168340514-ce05e6a7-IMG_6713.jpeg', 'IMG_6713.jpeg', 'image/jpeg', 2110129, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:12:20.657Z"'::jsonb, '"2025-11-03T11:12:20.657Z"'::jsonb),
  ('cmhj1xzju0002jm043q0rnxw6', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169032046-9b35194f-IMG_6725.jpeg', 'IMG_6725.jpeg', 'image/jpeg', 3077291, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:23:52.405Z"'::jsonb, '"2025-11-03T11:23:52.405Z"'::jsonb),
  ('cmhj1ydsa0003jm04wsqaaylt', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169050646-2306c765-IMG_6724.jpeg', 'IMG_6724.jpeg', 'image/jpeg', 3097458, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:24:10.858Z"'::jsonb, '"2025-11-03T11:24:10.858Z"'::jsonb),
  ('cmhj1ymtp0004jm0417a3zkn0', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169062455-3dce9506-IMG_6723.jpeg', 'IMG_6723.jpeg', 'image/jpeg', 2818082, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:24:22.669Z"'::jsonb, '"2025-11-03T11:24:22.669Z"'::jsonb),
  ('cmhj1yw3q0005jm046qa0qoxb', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169074399-792abefa-IMG_6721.jpeg', 'IMG_6721.jpeg', 'image/jpeg', 2902021, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:24:34.609Z"'::jsonb, '"2025-11-03T11:24:34.609Z"'::jsonb),
  ('cmhj1z4zs0006jm04ueb1xeqp', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169085998-c9008453-IMG_6720.jpeg', 'IMG_6720.jpeg', 'image/jpeg', 2977465, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:24:46.216Z"'::jsonb, '"2025-11-03T11:24:46.216Z"'::jsonb),
  ('cmhj1zcxq0007jm04q0afwsd7', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169096223-731675a8-IMG_6719.jpeg', 'IMG_6719.jpeg', 'image/jpeg', 2443229, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:24:56.414Z"'::jsonb, '"2025-11-03T11:24:56.414Z"'::jsonb),
  ('cmhj1zo2g0008jm04pzonfbdn', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169110692-9ca6a611-IMG_6718.jpeg', 'IMG_6718.jpeg', 'image/jpeg', 2401742, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:25:10.936Z"'::jsonb, '"2025-11-03T11:25:10.936Z"'::jsonb),
  ('cmhj1zwpa0009jm048wlzeucl', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169121845-e09467d2-IMG_6717.jpeg', 'IMG_6717.jpeg', 'image/jpeg', 2610061, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:25:22.024Z"'::jsonb, '"2025-11-03T11:25:22.024Z"'::jsonb),
  ('cmhj204tz000ajm04074qly5z', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169132467-5a1f40fd-IMG_6716.jpeg', 'IMG_6716.jpeg', 'image/jpeg', 2660043, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:25:32.664Z"'::jsonb, '"2025-11-03T11:25:32.664Z"'::jsonb),
  ('cmhj20eux000bjm04a14lrzxe', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169145373-ca81122e-IMG_6715.jpeg', 'IMG_6715.jpeg', 'image/jpeg', 2773074, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:25:45.559Z"'::jsonb, '"2025-11-03T11:25:45.559Z"'::jsonb),
  ('cmhj23ifl000cjm04nq9lfojr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169289913-408e8444-IMG_6727.jpeg', 'IMG_6727.jpeg', 'image/jpeg', 2706942, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:28:10.158Z"'::jsonb, '"2025-11-03T11:28:10.158Z"'::jsonb),
  ('cmhj23seg000djm04c76hy2ek', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169302986-c5b2b416-IMG_6726.jpeg', 'IMG_6726.jpeg', 'image/jpeg', 2866120, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:28:23.177Z"'::jsonb, '"2025-11-03T11:28:23.177Z"'::jsonb),
  ('cmhj25nw7000ejm04ocvjyic9', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762169390153-23791e8f-IMG_6728.jpeg', 'IMG_6728.jpeg', 'image/jpeg', 2485511, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:29:50.556Z"'::jsonb, '"2025-11-03T11:29:50.556Z"'::jsonb),
  ('cmhj2vocf0000ju04jd60amzh', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762170603607-9ca0ff1f-IMG_6748.jpeg', 'IMG_6748.jpeg', 'image/jpeg', 2404606, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:50:04.191Z"'::jsonb, '"2025-11-03T11:50:04.191Z"'::jsonb),
  ('cmhj314do0001ju04w6jdjehf', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762170857948-0d0941d5-IMG_6744.jpeg', 'IMG_6744.jpeg', 'image/jpeg', 2447605, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:54:18.260Z"'::jsonb, '"2025-11-03T11:54:18.260Z"'::jsonb),
  ('cmhj31yf30002ju04c2h2i62s', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762170896898-17b57720-IMG_6743.jpeg', 'IMG_6743.jpeg', 'image/jpeg', 2364440, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:54:57.175Z"'::jsonb, '"2025-11-03T11:54:57.175Z"'::jsonb),
  ('cmhj32riv0003ju042i4b5ocx', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762170934702-b7a59fb1-IMG_6742.jpeg', 'IMG_6742.jpeg', 'image/jpeg', 2560279, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:55:34.915Z"'::jsonb, '"2025-11-03T11:55:34.915Z"'::jsonb),
  ('cmhj36k5t0004ju040kghseeg', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171111653-a867bf7d-IMG_6741.jpeg', 'IMG_6741.jpeg', 'image/jpeg', 2467889, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:58:31.987Z"'::jsonb, '"2025-11-03T11:58:31.987Z"'::jsonb),
  ('cmhj37qnk0005ju04rncawo8z', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171166789-b0eda45a-IMG_6741.jpeg', 'IMG_6741.jpeg', 'image/jpeg', 2467889, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T11:59:27.037Z"'::jsonb, '"2025-11-03T11:59:27.037Z"'::jsonb),
  ('cmhj394gr0006ju04if4r48ea', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171231318-a4a6ac05-IMG_6739.jpeg', 'IMG_6739.jpeg', 'image/jpeg', 2687354, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:00:31.605Z"'::jsonb, '"2025-11-03T12:00:31.605Z"'::jsonb),
  ('cmhj3b7we0007ju045ae2zmik', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171329092-bea780e3-IMG_6738.jpeg', 'IMG_6738.jpeg', 'image/jpeg', 2691217, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:02:09.377Z"'::jsonb, '"2025-11-03T12:02:09.377Z"'::jsonb),
  ('cmhj3bqw00008ju04m4kprm57', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171353797-4516d1b9-IMG_6736.jpeg', 'IMG_6736.jpeg', 'image/jpeg', 2540788, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:02:33.980Z"'::jsonb, '"2025-11-03T12:02:33.980Z"'::jsonb),
  ('cmhj3c8ts0009ju045gmq5z4t', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171377079-b0cbb3f0-IMG_6735.jpeg', 'IMG_6735.jpeg', 'image/jpeg', 2349377, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:02:57.233Z"'::jsonb, '"2025-11-03T12:02:57.233Z"'::jsonb),
  ('cmhj3p29c0000jx04zxtfpgxg', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762171974830-11aa8d02-IMG_6735.jpeg', 'IMG_6735.jpeg', 'image/jpeg', 2349377, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:12:55.207Z"'::jsonb, '"2025-11-03T12:12:55.207Z"'::jsonb),
  ('cmhj3q0330001jx04an0yv9zs', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172018733-3758242c-IMG_6734.jpeg', 'IMG_6734.jpeg', 'image/jpeg', 2574354, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:13:39.083Z"'::jsonb, '"2025-11-03T12:13:39.083Z"'::jsonb),
  ('cmhj3qlk4000aju04acjee82a', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172046748-1966a22a-IMG_6733.jpeg', 'IMG_6733.jpeg', 'image/jpeg', 2707958, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:14:07.012Z"'::jsonb, '"2025-11-03T12:14:07.012Z"'::jsonb),
  ('cmhj3rjy7000bju04ccnatc2d', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172091355-d39e6dbc-IMG_6732.jpeg', 'IMG_6732.jpeg', 'image/jpeg', 2817539, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:14:51.584Z"'::jsonb, '"2025-11-03T12:14:51.584Z"'::jsonb),
  ('cmhj3rzyz000cju04sydwdjhn', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172112055-d7784019-IMG_6731.jpeg', 'IMG_6731.jpeg', 'image/jpeg', 2524885, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:15:12.240Z"'::jsonb, '"2025-11-03T12:15:12.240Z"'::jsonb),
  ('cmhj3sf8q000dju04r8knofjj', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172131875-592522a0-IMG_6730.jpeg', 'IMG_6730.jpeg', 'image/jpeg', 2449593, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:15:32.045Z"'::jsonb, '"2025-11-03T12:15:32.045Z"'::jsonb),
  ('cmhj3stde000eju04vm22h5jj', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172150028-99d03b85-IMG_6729.jpeg', 'IMG_6729.jpeg', 'image/jpeg', 2369258, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:15:50.181Z"'::jsonb, '"2025-11-03T12:15:50.181Z"'::jsonb),
  ('cmhj3w13k000fju044fjh7a2e', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762172300061-bd0940c5-IMG_6746.jpeg', 'IMG_6746.jpeg', 'image/jpeg', 2643174, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-03T12:18:20.331Z"'::jsonb, '"2025-11-03T12:18:20.331Z"'::jsonb),
  ('cmhk4fx620000l50485uk1tdd', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762233694184-b647a8c5-IMG_6744.jpeg', 'IMG_6744.jpeg', 'image/jpeg', 2447605, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:21:34.540Z"'::jsonb, '"2025-11-04T05:21:34.540Z"'::jsonb),
  ('cmhk5d3zj0000ky04ne7by2m0', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762235242358-43a9f8a7-IMG-20251101-WA0287.jpg', 'IMG-20251101-WA0287.jpg', 'image/jpeg', 1832303, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:47:22.811Z"'::jsonb, '"2025-11-04T05:47:22.811Z"'::jsonb),
  ('cmhk5d43e0001ky04h2k5jpdv', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762235243151-16a133e7-IMG-20251101-WA0291.jpg', 'IMG-20251101-WA0291.jpg', 'image/jpeg', 1603399, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:47:23.258Z"'::jsonb, '"2025-11-04T05:47:23.258Z"'::jsonb),
  ('cmhk5dmxa0000i504rsmd8cha', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762235267196-0d0fe754-IMG-20251101-WA0286.jpg', 'IMG-20251101-WA0286.jpg', 'image/jpeg', 1874466, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:47:47.662Z"'::jsonb, '"2025-11-04T05:47:47.662Z"'::jsonb),
  ('cmhk5dn1z0001i504sb8dooje', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762235267692-e957d4f8-IMG-20251101-WA0288.jpg', 'IMG-20251101-WA0288.jpg', 'image/jpeg', 1552053, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:47:47.831Z"'::jsonb, '"2025-11-04T05:47:47.831Z"'::jsonb),
  ('cmhk5e5x10002i504sogrhwhr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762235292029-f719518b-IMG-20251101-WA0292.jpg', 'IMG-20251101-WA0292.jpg', 'image/jpeg', 1863579, 3024, 4032, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T05:48:12.263Z"'::jsonb, '"2025-11-04T05:48:12.263Z"'::jsonb),
  ('cmhk9pr8y0000jo040k2xjno1', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242551077-41d00fbb-IMG_6765.jpeg', 'IMG_6765.jpeg', 'image/jpeg', 2589627, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:49:11.494Z"'::jsonb, '"2025-11-04T07:49:11.494Z"'::jsonb),
  ('cmhk9q9r50001jo04a1axnmtt', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242575284-3f6c4af0-IMG_6766.jpeg', 'IMG_6766.jpeg', 'image/jpeg', 2430931, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:49:35.488Z"'::jsonb, '"2025-11-04T07:49:35.488Z"'::jsonb),
  ('cmhk9qmhx0002jo04xslqmqrs', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242591781-b93acb93-IMG_6764.jpeg', 'IMG_6764.jpeg', 'image/jpeg', 2582445, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:49:52.005Z"'::jsonb, '"2025-11-04T07:49:52.005Z"'::jsonb),
  ('cmhk9qz0e0003jo046onht30m', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242608013-1c49ebf5-IMG_6763.jpeg', 'IMG_6763.jpeg', 'image/jpeg', 2601237, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:50:08.207Z"'::jsonb, '"2025-11-04T07:50:08.207Z"'::jsonb),
  ('cmhk9t9qs0000l80470joxzn6', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242714749-1cd729f9-IMG_6762.jpeg', 'IMG_6762.jpeg', 'image/jpeg', 2423524, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:51:55.241Z"'::jsonb, '"2025-11-04T07:51:55.241Z"'::jsonb),
  ('cmhk9tra10001l8045iutqh2p', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242737961-b3a65ed4-IMG_6761.jpeg', 'IMG_6761.jpeg', 'image/jpeg', 2508207, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:52:18.169Z"'::jsonb, '"2025-11-04T07:52:18.169Z"'::jsonb),
  ('cmhk9u5160002l804t9dwebcc', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242755564-37c99f98-IMG_6760.jpeg', 'IMG_6760.jpeg', 'image/jpeg', 2493382, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:52:35.795Z"'::jsonb, '"2025-11-04T07:52:35.795Z"'::jsonb),
  ('cmhk9v87g0003l804cya0qhu3', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242806245-e782b029-IMG_6759.jpeg', 'IMG_6759.jpeg', 'image/jpeg', 2465881, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:53:26.766Z"'::jsonb, '"2025-11-04T07:53:26.766Z"'::jsonb),
  ('cmhk9wyrz0004l804xbepo2oc', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242887636-abc3a158-IMG_6758.jpeg', 'IMG_6758.jpeg', 'image/jpeg', 2646417, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:54:47.861Z"'::jsonb, '"2025-11-04T07:54:47.861Z"'::jsonb),
  ('cmhk9xiql0005l804gu9wpfez', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242913478-d2336957-IMG_6757.jpeg', 'IMG_6757.jpeg', 'image/jpeg', 2611399, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:55:13.693Z"'::jsonb, '"2025-11-04T07:55:13.693Z"'::jsonb),
  ('cmhk9y4c50006l804ax4i8uwc', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242941550-5d946d7b-IMG_6756.jpeg', 'IMG_6756.jpeg', 'image/jpeg', 2922369, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:55:41.726Z"'::jsonb, '"2025-11-04T07:55:41.726Z"'::jsonb),
  ('cmhk9yhrw0007l804n622m5c1', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762242958952-6c4f3e62-IMG_6755.jpeg', 'IMG_6755.jpeg', 'image/jpeg', 2788621, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:55:59.132Z"'::jsonb, '"2025-11-04T07:55:59.132Z"'::jsonb),
  ('cmhka1mvm0004jo041ab3qy12', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762243105437-067dc59c-IMG_6754.jpeg', 'IMG_6754.jpeg', 'image/jpeg', 2642504, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T07:58:25.699Z"'::jsonb, '"2025-11-04T07:58:25.699Z"'::jsonb),
  ('cmhkedu850000jl04l5jnpyr5', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250393154-da8c8120-IMG_6775.jpeg', 'IMG_6775.jpeg', 'image/jpeg', 2345782, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T09:59:53.548Z"'::jsonb, '"2025-11-04T09:59:53.548Z"'::jsonb),
  ('cmhkeeaag0001jl045yevcmfm', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250414190-2ad8efec-IMG_6774.jpeg', 'IMG_6774.jpeg', 'image/jpeg', 2201638, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:00:14.347Z"'::jsonb, '"2025-11-04T10:00:14.347Z"'::jsonb),
  ('cmhkeemq40002jl041ee3lgb3', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250430306-1e530f4a-IMG_6776.jpeg', 'IMG_6776.jpeg', 'image/jpeg', 2064510, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:00:30.494Z"'::jsonb, '"2025-11-04T10:00:30.494Z"'::jsonb),
  ('cmhkeeylo0003jl04he0kkf0g', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250445716-1dddab71-IMG_6777.jpeg', 'IMG_6777.jpeg', 'image/jpeg', 1892340, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:00:45.871Z"'::jsonb, '"2025-11-04T10:00:45.871Z"'::jsonb),
  ('cmhkefehi0004jl04pymnb5rr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250466276-45db27fe-IMG_6777.jpeg', 'IMG_6777.jpeg', 'image/jpeg', 1892340, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:01:06.474Z"'::jsonb, '"2025-11-04T10:01:06.474Z"'::jsonb),
  ('cmhkehdkn0000jp046gw4qe63', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762250558152-3523434e-IMG_6778.jpeg', 'IMG_6778.jpeg', 'image/jpeg', 2202315, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:02:38.587Z"'::jsonb, '"2025-11-04T10:02:38.587Z"'::jsonb),
  ('cmhkfzm980000kz04fbcgg2c4', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253088812-38376f85-IMG_6800.jpeg', 'IMG_6800.jpeg', 'image/jpeg', 2387697, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:44:49.287Z"'::jsonb, '"2025-11-04T10:44:49.287Z"'::jsonb),
  ('cmhkfzz1h0001kz04k3rbxawr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253105691-d2ca745f-IMG_6799.jpeg', 'IMG_6799.jpeg', 'image/jpeg', 2327712, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:45:05.866Z"'::jsonb, '"2025-11-04T10:45:05.866Z"'::jsonb),
  ('cmhkg0cn90002kz04cmawm0s9', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253123330-d294d707-IMG_6798.jpeg', 'IMG_6798.jpeg', 'image/jpeg', 1921382, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:45:23.496Z"'::jsonb, '"2025-11-04T10:45:23.496Z"'::jsonb),
  ('cmhkg0shm0003kz04hwu96h1g', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253143852-ec189920-IMG_6797.jpeg', 'IMG_6797.jpeg', 'image/jpeg', 2139776, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:45:44.024Z"'::jsonb, '"2025-11-04T10:45:44.024Z"'::jsonb),
  ('cmhkg1hee0005kz04dsqj13k2', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253176134-dfb2f2dd-IMG_6795.jpeg', 'IMG_6795.jpeg', 'image/jpeg', 2162370, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:46:16.306Z"'::jsonb, '"2025-11-04T10:46:16.306Z"'::jsonb),
  ('cmhkg1ufp0006kz042fqlx3sg', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253193011-a280f47c-IMG_6794.jpeg', 'IMG_6794.jpeg', 'image/jpeg', 2016816, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:46:33.204Z"'::jsonb, '"2025-11-04T10:46:33.204Z"'::jsonb),
  ('cmhkg27ui0007kz04liiy4mo6', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253210326-7dffd372-IMG_6793.jpeg', 'IMG_6793.jpeg', 'image/jpeg', 1933128, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:46:50.505Z"'::jsonb, '"2025-11-04T10:46:50.505Z"'::jsonb),
  ('cmhkg2j5y0008kz04uz38dwv1', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253225148-76319c43-IMG_6792.jpeg', 'IMG_6792.jpeg', 'image/jpeg', 2245262, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:47:05.350Z"'::jsonb, '"2025-11-04T10:47:05.350Z"'::jsonb),
  ('cmhkg2v3j0009kz04gri0wd1t', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253240351-e3350e47-IMG_6790.jpeg', 'IMG_6790.jpeg', 'image/jpeg', 1843432, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:47:20.527Z"'::jsonb, '"2025-11-04T10:47:20.527Z"'::jsonb),
  ('cmhkg39e5000akz04nsw3i16d', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253259056-360b3a1f-IMG_6789.jpeg', 'IMG_6789.jpeg', 'image/jpeg', 2237370, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:47:39.240Z"'::jsonb, '"2025-11-04T10:47:39.240Z"'::jsonb),
  ('cmhkg3nig000bkz04l2qexhba', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253277356-67bb97bb-IMG_6788.jpeg', 'IMG_6788.jpeg', 'image/jpeg', 2376277, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:47:57.540Z"'::jsonb, '"2025-11-04T10:47:57.540Z"'::jsonb),
  ('cmhkg43ex000ckz041j71m60e', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253297779-163b23f5-IMG_6787.jpeg', 'IMG_6787.jpeg', 'image/jpeg', 2252254, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:48:17.951Z"'::jsonb, '"2025-11-04T10:48:17.951Z"'::jsonb),
  ('cmhkg4gi70005jl04kkqxubfn', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253314840-0995225b-IMG_6785.jpeg', 'IMG_6785.jpeg', 'image/jpeg', 2217723, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:48:35.091Z"'::jsonb, '"2025-11-04T10:48:35.091Z"'::jsonb),
  ('cmhkg4rcg0006jl04skgs0ud8', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253329098-48aa79ea-IMG_6784.jpeg', 'IMG_6784.jpeg', 'image/jpeg', 1799352, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:48:49.264Z"'::jsonb, '"2025-11-04T10:48:49.264Z"'::jsonb),
  ('cmhkg5b070007jl045y3eobc8', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253354560-bb630006-IMG_6783.jpeg', 'IMG_6783.jpeg', 'image/jpeg', 2176979, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:49:14.734Z"'::jsonb, '"2025-11-04T10:49:14.734Z"'::jsonb),
  ('cmhkg5p8j0008jl04rk1rnyy2', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253372930-1be30d40-IMG_6782.jpeg', 'IMG_6782.jpeg', 'image/jpeg', 1806845, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:49:33.089Z"'::jsonb, '"2025-11-04T10:49:33.089Z"'::jsonb),
  ('cmhkg5zwh0009jl04r1btfuk2', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253386815-370cb2a1-IMG_6781.jpeg', 'IMG_6781.jpeg', 'image/jpeg', 2092369, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:49:47.010Z"'::jsonb, '"2025-11-04T10:49:47.010Z"'::jsonb),
  ('cmhkg6i0a000ajl04ih40dq25', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253410217-eac8d05e-IMG_6780.jpeg', 'IMG_6780.jpeg', 'image/jpeg', 1807495, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:50:10.380Z"'::jsonb, '"2025-11-04T10:50:10.380Z"'::jsonb),
  ('cmhkg6xjf000bjl04mgw38ubj', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253430307-1a5c6530-IMG_6779.jpeg', 'IMG_6779.jpeg', 'image/jpeg', 2368728, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T10:50:30.507Z"'::jsonb, '"2025-11-04T10:50:30.507Z"'::jsonb),
  ('cmhkhpjey0000l7044f2go8sd', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762255977926-4230e4dc-IMG_6801.jpeg', 'IMG_6801.jpeg', 'image/jpeg', 2134424, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T11:32:58.370Z"'::jsonb, '"2025-11-04T11:32:58.370Z"'::jsonb),
  ('cmhkkoev20014ii04z66ew7t7', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762260964274-9edd166b-Screenshot_20251104-175437.png', 'Screenshot_20251104-175437.png', 'image/png', 90435, 720, 923, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T12:56:04.577Z"'::jsonb, '"2025-11-04T12:56:04.577Z"'::jsonb),
  ('cmhkkrica001dii04grt874ic', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261108836-cc6cd3c5-IMG_20251104_181430.png', 'IMG_20251104_181430.png', 'image/png', 552662, 720, 939, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T12:58:29.048Z"'::jsonb, '"2025-11-04T12:58:29.048Z"'::jsonb),
  ('cmhkkt5d8001eii04kqf864da', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261185338-080ebc90-IMG_20251104_180502.png', 'IMG_20251104_180502.png', 'image/png', 850020, 720, 972, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T12:59:45.542Z"'::jsonb, '"2025-11-04T12:59:45.542Z"'::jsonb),
  ('cmhkktn8z001fii04vluhvno0', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261208511-9bed5a34-IMG_20251104_180344.png', 'IMG_20251104_180344.png', 'image/png', 763815, 720, 899, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:00:08.716Z"'::jsonb, '"2025-11-04T13:00:08.716Z"'::jsonb),
  ('cmhkku4xs001gii04mwu8i1ij', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261231564-854515b5-IMG_20251104_180007.png', 'IMG_20251104_180007.png', 'image/png', 1076599, 717, 1012, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:00:31.732Z"'::jsonb, '"2025-11-04T13:00:31.732Z"'::jsonb),
  ('cmhkkuewv001hii0457e5z287', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261244519-230fbc60-IMG_20251104_175929.png', 'IMG_20251104_175929.png', 'image/png', 819945, 720, 995, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:00:44.672Z"'::jsonb, '"2025-11-04T13:00:44.672Z"'::jsonb),
  ('cmhkkuryo001iii04pmry10kd', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261261301-962e422f-IMG_20251104_175853.png', 'IMG_20251104_175853.png', 'image/png', 808803, 720, 901, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:01:01.488Z"'::jsonb, '"2025-11-04T13:01:01.488Z"'::jsonb),
  ('cmhkkv2hu001jii04xutytmc1', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261275050-6bfed4b9-IMG_20251104_175809.png', 'IMG_20251104_175809.png', 'image/png', 761922, 720, 958, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:01:15.234Z"'::jsonb, '"2025-11-04T13:01:15.234Z"'::jsonb),
  ('cmhkkvcr0001kii04e8xryny4', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261288276-f7864ff4-IMG_20251104_175718.png', 'IMG_20251104_175718.png', 'image/png', 756539, 719, 945, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:01:28.435Z"'::jsonb, '"2025-11-04T13:01:28.435Z"'::jsonb),
  ('cmhkkvn5m001lii04qyehwcwm', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261301924-4d7c5952-Screenshot_20251104-173732.png', 'Screenshot_20251104-173732.png', 'image/png', 79852, 708, 772, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:01:42.010Z"'::jsonb, '"2025-11-04T13:01:42.010Z"'::jsonb),
  ('cmhkkvw1u001mii0424xlrclr', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261313448-06c6e40e-Screenshot_20251104-173654.png', 'Screenshot_20251104-173654.png', 'image/png', 87214, 720, 939, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:01:53.538Z"'::jsonb, '"2025-11-04T13:01:53.538Z"'::jsonb),
  ('cmhkkwad0001nii04z6xtspoa', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261331848-808964e1-Screenshot_20251104-173547.png', 'Screenshot_20251104-173547.png', 'image/png', 633642, 720, 1600, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:02:11.986Z"'::jsonb, '"2025-11-04T13:02:11.986Z"'::jsonb),
  ('cmhkkwjx3001oii04l88gvoa4', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261344386-94b0cdeb-Screenshot_20251104-173444.png', 'Screenshot_20251104-173444.png', 'image/png', 79109, 720, 729, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:02:24.471Z"'::jsonb, '"2025-11-04T13:02:24.471Z"'::jsonb),
  ('cmhkkwvi1001pii04p1eli1l8', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762261359235-bb8c2697-IMG_20251104_173301.png', 'IMG_20251104_173301.png', 'image/png', 508344, 713, 838, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:02:39.378Z"'::jsonb, '"2025-11-04T13:02:39.378Z"'::jsonb),
  ('cmhkg15940004kz04xq925ajm', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762253160374-09b4827e-IMG_6796.jpeg', 'IMG_6796.jpeg', 'image/jpeg', 1871363, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'failed', 'fetch failed', '"2025-11-04T10:46:00.566Z"'::jsonb, '"2025-11-04T13:25:08.899Z"'::jsonb),
  ('cmhklzcuf0020ii043d2l7ice', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762263154468-7a3794aa-IMG_6802.jpeg', 'IMG_6802.jpeg', 'image/jpeg', 1996106, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:32:34.766Z"'::jsonb, '"2025-11-04T13:32:34.766Z"'::jsonb),
  ('cmhklznbx0021ii04d4tf79iq', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762263168284-c0684273-IMG_6803.jpeg', 'IMG_6803.jpeg', 'image/jpeg', 2119491, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:32:48.477Z"'::jsonb, '"2025-11-04T13:32:48.477Z"'::jsonb),
  ('cmhkm00mj0022ii04v6ib56xw', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762263185424-693865aa-IMG_6804.jpeg', 'IMG_6804.jpeg', 'image/jpeg', 1719240, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:33:05.605Z"'::jsonb, '"2025-11-04T13:33:05.605Z"'::jsonb),
  ('cmhkm0dgy0023ii04z8203uy7', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762263202094-2e783308-IMG_6805.jpeg', 'IMG_6805.jpeg', 'image/jpeg', 2316254, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:33:22.267Z"'::jsonb, '"2025-11-04T13:33:22.267Z"'::jsonb),
  ('cmhkmrqzc0008jo04gfxaphaq', NULL, 'image', 'clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762264479061-026c7584-IMG_6807.jpeg', 'IMG_6807.jpeg', 'image/jpeg', 2225819, 4032, 3024, NULL, NULL, NULL, 0, FALSE, 'completed', NULL, '"2025-11-04T13:54:39.468Z"'::jsonb, '"2025-11-04T13:54:39.468Z"'::jsonb);

-- Table: product_categories
-- Records: 97

INSERT INTO "product_categories" ("id", "productId", "categoryId", "createdAt") VALUES
  ('cmhgdnfv80003jp040gskzs5j', 'cmhgdnfv80001jp04u7fjbz2r', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-01T14:28:17.301Z"'::jsonb),
  ('cmhgqjmom0003kv04o4nkhkjf', 'cmhgqjmom0001kv04nt45wiuo', 'cmhgkoax60003js04bp3l0c36', '"2025-11-01T20:29:14.518Z"'::jsonb),
  ('cmhhla4sh0003ju045rtp21vb', 'cmhhla4sh0001ju04tfevrug1', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-02T10:49:39.522Z"'::jsonb),
  ('cmhiwu6jq0003l504dkcm1zx4', 'cmhiwu6jq0001l5040mjz1wb3', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T09:00:56.870Z"'::jsonb),
  ('cmhixe3ld0003l704646jc8b3', 'cmhixe3ld0001l704eey6yd6o', 'cmhgkplzd0005js04tn9fghob', '"2025-11-03T09:16:26.162Z"'::jsonb),
  ('cmhiyvlbi0003la04b7m4ypf7', 'cmhiyvlbh0001la045johq640', 'cmhgkplzd0005js04tn9fghob', '"2025-11-03T09:58:01.902Z"'::jsonb),
  ('cmhj4fuhd000jju04kr347s1c', 'cmhj4fuhd000hju04ppowlam2', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T12:33:44.977Z"'::jsonb),
  ('cmhj4v72v0003if04azplaf3f', 'cmhj4v72v0001if04itzeg4cf', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T12:45:41.143Z"'::jsonb),
  ('cmhj51guh0003ic04f4d136o9', 'cmhj51guh0001ic04y19u1rxs', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T12:50:33.737Z"'::jsonb),
  ('cmhj58iwd0003kz04kran33np', 'cmhj58iwc0001kz04brfuuzjd', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T12:56:02.989Z"'::jsonb),
  ('cmhj5g7fv000bif04pjgzve49', 'cmhj5g7fv0009if04pizuf30f', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T13:02:01.387Z"'::jsonb),
  ('cmhj5m9280003ik04ig1trkwq', 'cmhj5m9280001ik04vm9s3egk', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T13:06:43.424Z"'::jsonb),
  ('cmhj5z56t000rju04b1uopgyb', 'cmhj5z56t000pju04ui5hjxh8', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T13:16:44.934Z"'::jsonb),
  ('cmhj649c70003jo04xn10b4o3', 'cmhj649c70001jo04bh5lp6rk', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-03T13:20:43.591Z"'::jsonb),
  ('cmhk4jxtg0004l504uqr687zc', 'cmhk4jxtg0002l504czwayg6g', 'cmhgkoax60003js04bp3l0c36', '"2025-11-04T05:24:42.100Z"'::jsonb),
  ('cmhk4m8c50003la04h79xwace', 'cmhk4m8c50001la043tk9b9fb', 'cmhgkoax60003js04bp3l0c36', '"2025-11-04T05:26:29.045Z"'::jsonb),
  ('cmhk4o2g50003l404y6dsm18n', 'cmhk4o2g50001l4048pvm0wg5', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:27:54.725Z"'::jsonb),
  ('cmhk4obvm000cl504g8xska30', 'cmhk4obvm000al50401itq9tz', 'cmhgkoax60003js04bp3l0c36', '"2025-11-04T05:28:06.947Z"'::jsonb),
  ('cmhk4y3s60003le0494le87v3', 'cmhk4y3s60001le04ny0qgo0g', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:35:43.015Z"'::jsonb),
  ('cmhk50x7y0003l8046c3auvy1', 'cmhk50x7y0001l804k5e45bn7', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T05:37:54.478Z"'::jsonb),
  ('cmhk51mav0003l504kw3q1joe', 'cmhk51mau0001l504ug28ubca', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:38:26.983Z"'::jsonb),
  ('cmhk54pky000bla04jd5urn84', 'cmhk54pkx0009la04p9ut00rg', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T05:40:51.202Z"'::jsonb),
  ('cmhk57n4x000bl50496ca7a80', 'cmhk57n4x0009l504oxp9q46x', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T05:43:08.001Z"'::jsonb),
  ('cmhk5ael20003kw04baa9dej5', 'cmhk5ael20001kw044bjmoyfy', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:45:16.886Z"'::jsonb),
  ('cmhk5k9xz0005ky04ad7k2q41', 'cmhk5k9xz0003ky04xny80dta', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:52:57.431Z"'::jsonb),
  ('cmhk5o8kf0003kz04kk1p3qrn', 'cmhk5o8kf0001kz04y3cutjko', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T05:56:02.271Z"'::jsonb),
  ('cmhk5qajg0003if04ewm9u5aj', 'cmhk5qajg0001if04eouue6vm', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T05:57:38.140Z"'::jsonb),
  ('cmhk5t0aw0003l704y6jjx6ce', 'cmhk5t0aw0001l7048lvwsf5w', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T05:59:44.840Z"'::jsonb),
  ('cmhk5usp0000dl704y8k3q929', 'cmhk5usp0000bl704v6zs0gut', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:01:08.292Z"'::jsonb),
  ('cmhk5x3qb000bif045ma51ply', 'cmhk5x3qb0009if04cyafn1vg', 'cmhgknb5p0001js04qvasnpzo', '"2025-11-04T06:02:55.908Z"'::jsonb),
  ('cmhk5xs0v000dky044p5qbwbf', 'cmhk5xs0v000bky043x5nsmp4', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:03:27.392Z"'::jsonb),
  ('cmhk62d0i000bkz04kvm5la8m', 'cmhk62d0i0009kz04q7ouk6kl', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:07:01.218Z"'::jsonb),
  ('cmhk65h64000lif04ekn6v8al', 'cmhk65h64000jif04sqowm0gr', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:09:26.572Z"'::jsonb),
  ('cmhk6airt0003l404imhduz07', 'cmhk6airt0001l404m4xr3hpm', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:13:21.929Z"'::jsonb),
  ('cmhk6dd7v0003l5046so54q6z', 'cmhk6dd7v0001l504prshi03u', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:15:34.700Z"'::jsonb),
  ('cmhk6ivwh000lky04kbl1u1gj', 'cmhk6ivwh000jky04i4i8pm17', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:19:52.193Z"'::jsonb),
  ('cmhk6lpsx000tif04nh7ruelj', 'cmhk6lpsx000rif04yxu1l4wi', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:22:04.258Z"'::jsonb),
  ('cmhk6r3im000tky04oqflmx9s', 'cmhk6r3im000rky04cdbynudr', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:26:15.310Z"'::jsonb),
  ('cmhk6uob1000bl504n86izdho', 'cmhk6uob10009l50417l9nul3', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:29:02.222Z"'::jsonb),
  ('cmhk73xkd0011if04fzg9ljzp', 'cmhk73xkc000zif04epwaoz6z', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:36:14.125Z"'::jsonb),
  ('cmhk78xn40003jy041dr80hqr', 'cmhk78xn40001jy04d0de6uvh', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T06:40:07.505Z"'::jsonb),
  ('cmhka7qdc0008jo048xdojor5', 'cmhka7qdc0006jo04v8bod63d', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:03:10.272Z"'::jsonb),
  ('cmhkae49t0003jp04f321b7oy', 'cmhkae49t0001jp040u9xz5z9', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:08:08.225Z"'::jsonb),
  ('cmhkaj4gy0003ju04z1rp9sx2', 'cmhkaj4gy0001ju04zfup4jpf', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:12:01.763Z"'::jsonb),
  ('cmhkaptk4000gjo04gi1ib5hf', 'cmhkaptk4000ejo042mn5cn6x', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:17:14.212Z"'::jsonb),
  ('cmhkau2ml0003l704tqxjklbd', 'cmhkau2mk0001l704hs5bcbfh', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:20:32.589Z"'::jsonb),
  ('cmhkazcyp000bl804nx0i2zhh', 'cmhkazcyp0009l804betfxk6g', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:24:39.266Z"'::jsonb),
  ('cmhkb46bt0003jv04npastfqa', 'cmhkb46bt0001jv0496erukox', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:28:23.945Z"'::jsonb),
  ('cmhkb6z1z0003l404cs7qqwef', 'cmhkb6z1z0001l404o9sl06yc', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:30:34.488Z"'::jsonb),
  ('cmhkbddrz000bl404vv0ntpme', 'cmhkbddrz0009l4049wwue056', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:35:33.503Z"'::jsonb),
  ('cmhkbgopk000bjv04jtvnmy3c', 'cmhkbgopk0009jv04nvbq3tac', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:38:07.641Z"'::jsonb),
  ('cmhkbjhhj000jl4040yejtifq', 'cmhkbjhhj000hl404msjvjns1', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:40:18.247Z"'::jsonb),
  ('cmhkbodig000bl704945f99sn', 'cmhkbodig0009l704qr98kfya', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:44:06.377Z"'::jsonb),
  ('cmhkbr4mn000rl404rksd104k', 'cmhkbr4mn000pl4046a4zcd7a', 'cmhgd8l2q0004ky04uwi0a2pv', '"2025-11-04T08:46:14.831Z"'::jsonb),
  ('cmhkhstfi0004l704tuksd691', 'cmhkhstfi0002l704wp7cauee', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:35:31.326Z"'::jsonb),
  ('cmhkhzvom0003l504nqh9jswx', 'cmhkhzvom0001l504223o4koj', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:41:00.838Z"'::jsonb),
  ('cmhki0uwz0003i504pxbc3b94', 'cmhki0uwz0001i5049i4n4djc', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:41:46.499Z"'::jsonb),
  ('cmhki5mpu000bl5042s81izoe', 'cmhki5mpt0009l504xh1vxpt6', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:45:29.154Z"'::jsonb),
  ('cmhkicgag0003jr04ni8xslfs', 'cmhkicgag0001jr04785s8bym', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:50:47.417Z"'::jsonb),
  ('cmhkiisbh0003ii04pps63caa', 'cmhkiisbh0001ii04zkbo4n6i', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T11:55:42.941Z"'::jsonb),
  ('cmhkioorp0003jm04753fkd7k', 'cmhkioorp0001jm04lb642w0h', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:00:18.277Z"'::jsonb),
  ('cmhkiv9w40003ky04fh1fob3e', 'cmhkiv9w40001ky04ayrfh8u0', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:05:25.588Z"'::jsonb),
  ('cmhkizrtu000bii04mgihsi46', 'cmhkizrtu0009ii04njl94ev5', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:08:55.459Z"'::jsonb),
  ('cmhkj4k14000nl504z09vzi8j', 'cmhkj4k14000ll5042hsnftz4', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:12:38.632Z"'::jsonb),
  ('cmhkj8ivz000bky04x2gjy62z', 'cmhkj8ivz0009ky04dydo64ew', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:15:43.775Z"'::jsonb),
  ('cmhkjf92g000jii048jo6gx4w', 'cmhkjf92g000hii04n8srz3v0', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:20:57.641Z"'::jsonb),
  ('cmhkjijau000bjm04j6cb8oq6', 'cmhkjijau0009jm04wtqoae54', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:23:30.871Z"'::jsonb),
  ('cmhkjoy52000jjm042lra5pta', 'cmhkjoy52000hjm04knqzmn1s', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:28:30.039Z"'::jsonb),
  ('cmhkjsmtg000rii04w2dj9hda', 'cmhkjsmtg000pii04kaf8fohg', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:31:21.988Z"'::jsonb),
  ('cmhkk5hkj0003jv046nnyaufs', 'cmhkk5hkj0001jv04r9z4bf7p', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:41:21.716Z"'::jsonb),
  ('cmhkk8yfx000zii04i8duv0co', 'cmhkk8yfx000xii04lp57djki', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:44:03.550Z"'::jsonb),
  ('cmhkkgyg00013l504kz7tog8g', 'cmhkkgyg00011l5046ekedizk', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:50:16.800Z"'::jsonb),
  ('cmhkkkx7i0003jm047vryxvnc', 'cmhkkkx7i0001jm047127s3yx', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:53:21.822Z"'::jsonb),
  ('cmhkkpa3n0018ii043bgmp6bj', 'cmhkkpa3n0016ii04c4d5on9m', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T12:56:45.155Z"'::jsonb),
  ('cmhkkxnqo001bl504wdak3izh', 'cmhkkxnqo0019l5044pe9bd9k', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:03:16.080Z"'::jsonb),
  ('cmhkl2yzp0003i6043phaqkbv', 'cmhkl2yzp0001i6040kf8lut7', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:07:23.942Z"'::jsonb),
  ('cmhkl5djd0003l104y2ikaegc', 'cmhkl5djd0001l104jrt7vpkt', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:09:16.105Z"'::jsonb),
  ('cmhkl7drl001tii04uzokhzgx', 'cmhkl7drl001rii04gi3c9vad', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:10:49.713Z"'::jsonb),
  ('cmhkl7jb3000bl104m9lnej2f', 'cmhkl7jb20009l104lkhsyx03', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:10:56.895Z"'::jsonb),
  ('cmhkla4lr0003ky04rzkwusls', 'cmhkla4lr0001ky04zhwwis10', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:12:57.807Z"'::jsonb),
  ('cmhklbwe2000bi604iz3sfgkm', 'cmhklbwe20009i60437cn9wkb', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:14:20.474Z"'::jsonb),
  ('cmhkldsdl001zii04fsd9iows', 'cmhkjybgs000tl50465996wsb', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:15:48.585Z"'::jsonb),
  ('cmhklpmco000jl104sfgx1s3a', 'cmhklpmco000hl104wza7ztcr', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:25:00.648Z"'::jsonb),
  ('cmhkm65ic000rl104m9j2ptzo', 'cmhkm65ic000pl1040ejkwdfo', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:37:51.973Z"'::jsonb),
  ('cmhkma4b80003jr041dx3hu3j', 'cmhkma4b80001jr04evqnnvo9', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:40:57.044Z"'::jsonb),
  ('cmhkmbjyf0003l504qpwbg71q', 'cmhkmbjyf0001l504dj38t6h0', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:42:03.975Z"'::jsonb),
  ('cmhkmhnfh0027ii04lrpxgygr', 'cmhkmhnfh0025ii04cyhzxftq', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:46:48.413Z"'::jsonb),
  ('cmhkmkygt0003l1044bi5i61g', 'cmhkmkygs0001l104y49z4o1e', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:49:22.685Z"'::jsonb),
  ('cmhkmpkdo0003jo04qv5mv1qt', 'cmhkmpkdo0001jo04k5z9xwxi', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:52:57.709Z"'::jsonb),
  ('cmhkmwx41000cjo04id3zdf14', 'cmhkmwx41000ajo04yffw87hn', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T13:58:40.801Z"'::jsonb),
  ('cmhkmxjdm0003js04fa00pj05', 'cmhkmxjdm0001js04bdtko1r4', 'cmg5f3d7o0003l804vmxh5d2y', '"2025-11-04T13:59:09.658Z"'::jsonb),
  ('cmhkn0e8a0003jv04hp6dddnd', 'cmhkn0e8a0001jv04f2kx9x3b', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:01:22.954Z"'::jsonb),
  ('cmhkn3v3c000bjv04i73na3hh', 'cmhkn3v3c0009jv04p7bs5plh', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:04:04.776Z"'::jsonb),
  ('cmhkoai4f0003kz045rgsghwa', 'cmhkoai4f0001kz04cx1voqui', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:37:14.175Z"'::jsonb),
  ('cmhkocw9i000bkz04u38bbrmh', 'cmhkocw9i0009kz043eqey29r', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:39:05.815Z"'::jsonb),
  ('cmhkoezv40003kz040yxsa979', 'cmhkoezv40001kz04lli2hwx7', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:40:43.792Z"'::jsonb),
  ('cmhkoguim000bkz04w1mskben', 'cmhkoguim0009kz04wnkby8o6', 'cmhgkqq830001l8047ev8tmz7', '"2025-11-04T14:42:10.174Z"'::jsonb);

-- Table: product_media
-- Records: 100

INSERT INTO "product_media" ("id", "productId", "mediaId", "isPrimary", "sortOrder", "createdAt", "updatedAt") VALUES
  ('cmhk5kagq0007ky04hc6svdn8', 'cmhk5k9xz0003ky04xny80dta', 'cmhj1j5ps0001jm04z0w3ente', TRUE, 0, '"2025-11-04T05:52:58.106Z"'::jsonb, '"2025-11-04T05:52:58.549Z"'::jsonb),
  ('cmhk5o91o0005kz0428dpfsou', 'cmhk5o8kf0001kz04y3cutjko', 'cmhk5e5x10002i504sogrhwhr', TRUE, 0, '"2025-11-04T05:56:02.892Z"'::jsonb, '"2025-11-04T05:56:03.828Z"'::jsonb),
  ('cmhgdngdb0005jp04lewech2n', 'cmhgdnfv80001jp04u7fjbz2r', 'cmhgdgqwd0000jp0492ymf93u', TRUE, 0, '"2025-11-01T14:28:17.951Z"'::jsonb, '"2025-11-01T14:28:18.336Z"'::jsonb),
  ('cmhgqjncb0005kv04hg0z9ods', 'cmhgqjmom0001kv04nt45wiuo', 'cmhgqbco7000ol204foddb42d', TRUE, 0, '"2025-11-01T20:29:15.371Z"'::jsonb, '"2025-11-01T20:29:15.918Z"'::jsonb),
  ('cmhhla5790005ju046mp11d7w', 'cmhhla4sh0001ju04tfevrug1', 'cmhgq4aqd0003l204ssghm53o', TRUE, 0, '"2025-11-02T10:49:40.054Z"'::jsonb, '"2025-11-02T10:49:40.497Z"'::jsonb),
  ('cmhiwu7at0005l504lfzwx1dz', 'cmhiwu6jq0001l5040mjz1wb3', 'cmhiwmws60000l504bsikoww9', TRUE, 0, '"2025-11-03T09:00:57.846Z"'::jsonb, '"2025-11-03T09:00:58.382Z"'::jsonb),
  ('cmhixe40s0005l704a44mle1p', 'cmhixe3ld0001l704eey6yd6o', 'cmhix2ap80000l504hzzazg7k', TRUE, 0, '"2025-11-03T09:16:26.716Z"'::jsonb, '"2025-11-03T09:16:27.120Z"'::jsonb),
  ('cmhiyvlpm0005la048thfrvt0', 'cmhiyvlbh0001la045johq640', 'cmhiypnnz0000l4044cyiou4g', TRUE, 0, '"2025-11-03T09:58:02.410Z"'::jsonb, '"2025-11-03T09:58:02.812Z"'::jsonb),
  ('cmhj4fuxc000lju048g0zv5zj', 'cmhj4fuhd000hju04ppowlam2', 'cmhj3w13k000fju044fjh7a2e', TRUE, 0, '"2025-11-03T12:33:45.552Z"'::jsonb, '"2025-11-03T12:33:46.095Z"'::jsonb),
  ('cmhj4v8670005if04w1boin28', 'cmhj4v72v0001if04itzeg4cf', 'cmhj3stde000eju04vm22h5jj', TRUE, 0, '"2025-11-03T12:45:42.559Z"'::jsonb, '"2025-11-03T12:45:43.330Z"'::jsonb),
  ('cmhj51hav0005ic040levlymf', 'cmhj51guh0001ic04y19u1rxs', 'cmhj3sf8q000dju04r8knofjj', TRUE, 0, '"2025-11-03T12:50:34.328Z"'::jsonb, '"2025-11-03T12:50:34.830Z"'::jsonb),
  ('cmhj58jdm0005kz04qkn13t61', 'cmhj58iwc0001kz04brfuuzjd', 'cmhj3rzyz000cju04sydwdjhn', TRUE, 0, '"2025-11-03T12:56:03.610Z"'::jsonb, '"2025-11-03T12:56:04.178Z"'::jsonb),
  ('cmhj5g7v9000dif04327w9ih8', 'cmhj5g7fv0009if04pizuf30f', 'cmhj3rjy7000bju04ccnatc2d', TRUE, 0, '"2025-11-03T13:02:01.942Z"'::jsonb, '"2025-11-03T13:02:02.351Z"'::jsonb),
  ('cmhj5m9jw0005ik04h1ls2chn', 'cmhj5m9280001ik04vm9s3egk', 'cmhj3qlk4000aju04acjee82a', TRUE, 0, '"2025-11-03T13:06:44.060Z"'::jsonb, '"2025-11-03T13:06:44.586Z"'::jsonb),
  ('cmhj5z5ok000tju04lnt30alt', 'cmhj5z56t000pju04ui5hjxh8', 'cmhj3q0330001jx04an0yv9zs', TRUE, 0, '"2025-11-03T13:16:45.572Z"'::jsonb, '"2025-11-03T13:16:46.045Z"'::jsonb),
  ('cmhj649pn0005jo04yc49cqsg', 'cmhj649c70001jo04bh5lp6rk', 'cmhj3p29c0000jx04zxtfpgxg', TRUE, 0, '"2025-11-03T13:20:44.075Z"'::jsonb, '"2025-11-03T13:20:44.518Z"'::jsonb),
  ('cmhk4jya00006l504vt6tqj4q', 'cmhk4jxtg0002l504czwayg6g', 'cmhgqbpes000ql2040z8qgt21', TRUE, 0, '"2025-11-04T05:24:42.696Z"'::jsonb, '"2025-11-04T05:24:43.252Z"'::jsonb),
  ('cmhk4m8v30005la04u3406c59', 'cmhk4m8c50001la043tk9b9fb', 'cmhgqbco7000ol204foddb42d', TRUE, 0, '"2025-11-04T05:26:29.727Z"'::jsonb, '"2025-11-04T05:26:30.287Z"'::jsonb),
  ('cmhk4o2t00005l404mmlc8y0u', 'cmhk4o2g50001l4048pvm0wg5', 'cmhk4fx620000l50485uk1tdd', TRUE, 0, '"2025-11-04T05:27:55.188Z"'::jsonb, '"2025-11-04T05:27:55.723Z"'::jsonb),
  ('cmhk4ocak000el504m4j41xbb', 'cmhk4obvm000al50401itq9tz', 'cmhgqbpcp000pl204qk2oo389', TRUE, 0, '"2025-11-04T05:28:07.484Z"'::jsonb, '"2025-11-04T05:28:07.998Z"'::jsonb),
  ('cmhk4y47u0005le04kokw26nh', 'cmhk4y3s60001le04ny0qgo0g', 'cmhj3bqw00008ju04m4kprm57', TRUE, 0, '"2025-11-04T05:35:43.578Z"'::jsonb, '"2025-11-04T05:35:43.982Z"'::jsonb),
  ('cmhk50xll0007l804liry1ng3', 'cmhk50x7y0001l804k5e45bn7', 'cmhglayjb0001l704ludk5yqd', FALSE, 1, '"2025-11-04T05:37:54.961Z"'::jsonb, '"2025-11-04T05:37:54.961Z"'::jsonb),
  ('cmhk50xlc0005l804bfmnou6a', 'cmhk50x7y0001l804k5e45bn7', 'cmhglayg00000l704l4pmyjp9', TRUE, 0, '"2025-11-04T05:37:54.961Z"'::jsonb, '"2025-11-04T05:37:55.408Z"'::jsonb),
  ('cmhk51mpv0005l504nqxkr3sg', 'cmhk51mau0001l504ug28ubca', 'cmhj394gr0006ju04if4r48ea', TRUE, 0, '"2025-11-04T05:38:27.523Z"'::jsonb, '"2025-11-04T05:38:27.901Z"'::jsonb),
  ('cmhk54q7y000dla0463xnl0lu', 'cmhk54pkx0009la04p9ut00rg', 'cmhglayjb0001l704ludk5yqd', TRUE, 0, '"2025-11-04T05:40:52.031Z"'::jsonb, '"2025-11-04T05:40:52.449Z"'::jsonb),
  ('cmhk57nj7000dl504f12aouqb', 'cmhk57n4x0009l504oxp9q46x', 'cmhgq1tz40000l204uf8vq0hc', TRUE, 0, '"2025-11-04T05:43:08.516Z"'::jsonb, '"2025-11-04T05:43:09.033Z"'::jsonb),
  ('cmhk5af3b0005kw04ocxiq3t0', 'cmhk5ael20001kw044bjmoyfy', 'cmhj3b7we0007ju045ae2zmik', TRUE, 0, '"2025-11-04T05:45:17.543Z"'::jsonb, '"2025-11-04T05:45:18.040Z"'::jsonb),
  ('cmhk5qazg0005if049c4svv3b', 'cmhk5qajg0001if04eouue6vm', 'cmhj1ymtp0004jm0417a3zkn0', TRUE, 0, '"2025-11-04T05:57:38.716Z"'::jsonb, '"2025-11-04T05:57:39.110Z"'::jsonb),
  ('cmhk5t0pz0005l704h459dmuw', 'cmhk5t0aw0001l7048lvwsf5w', 'cmhk5dmxa0000i504rsmd8cha', FALSE, 0, '"2025-11-04T05:59:45.384Z"'::jsonb, '"2025-11-04T05:59:45.384Z"'::jsonb),
  ('cmhk5t0qe0007l704jlnd1lnd', 'cmhk5t0aw0001l7048lvwsf5w', 'cmhk5dn1z0001i504sb8dooje', TRUE, 0, '"2025-11-04T05:59:45.384Z"'::jsonb, '"2025-11-04T05:59:45.854Z"'::jsonb),
  ('cmhk5ut3p000fl704vbfubtm0', 'cmhk5usp0000bl704v6zs0gut', 'cmhj1ydsa0003jm04wsqaaylt', TRUE, 0, '"2025-11-04T06:01:08.821Z"'::jsonb, '"2025-11-04T06:01:09.275Z"'::jsonb),
  ('cmhk5x4c0000dif04iwsitqix', 'cmhk5x3qb0009if04cyafn1vg', 'cmhk5d3zj0000ky04ne7by2m0', FALSE, 0, '"2025-11-04T06:02:56.688Z"'::jsonb, '"2025-11-04T06:02:56.688Z"'::jsonb),
  ('cmhk5x4ce000fif04i9s42ksg', 'cmhk5x3qb0009if04cyafn1vg', 'cmhk5d43e0001ky04h2k5jpdv', TRUE, 0, '"2025-11-04T06:02:56.688Z"'::jsonb, '"2025-11-04T06:02:57.237Z"'::jsonb),
  ('cmhk5xsdw000fky04py14exdy', 'cmhk5xs0v000bky043x5nsmp4', 'cmhj1xzju0002jm043q0rnxw6', TRUE, 0, '"2025-11-04T06:03:27.861Z"'::jsonb, '"2025-11-04T06:03:28.248Z"'::jsonb),
  ('cmhk62dh3000dkz04sw7dfhu3', 'cmhk62d0i0009kz04q7ouk6kl', 'cmhj1z4zs0006jm04ueb1xeqp', TRUE, 0, '"2025-11-04T06:07:01.815Z"'::jsonb, '"2025-11-04T06:07:02.277Z"'::jsonb),
  ('cmhk65hor000nif04e6xxodz4', 'cmhk65h64000jif04sqowm0gr', 'cmhj1yw3q0005jm046qa0qoxb', TRUE, 0, '"2025-11-04T06:09:27.244Z"'::jsonb, '"2025-11-04T06:09:27.828Z"'::jsonb),
  ('cmhk6aj9j0005l404n25vzqq2', 'cmhk6airt0001l404m4xr3hpm', 'cmhj204tz000ajm04074qly5z', TRUE, 0, '"2025-11-04T06:13:22.567Z"'::jsonb, '"2025-11-04T06:13:23.007Z"'::jsonb),
  ('cmhk6ddmu0005l5049lhwcp9i', 'cmhk6dd7v0001l504prshi03u', 'cmhj1zwpa0009jm048wlzeucl', TRUE, 0, '"2025-11-04T06:15:35.239Z"'::jsonb, '"2025-11-04T06:15:35.682Z"'::jsonb),
  ('cmhk6iwf6000nky04bz4h3ou6', 'cmhk6ivwh000jky04i4i8pm17', 'cmhj32riv0003ju042i4b5ocx', TRUE, 0, '"2025-11-04T06:19:52.867Z"'::jsonb, '"2025-11-04T06:19:53.328Z"'::jsonb),
  ('cmhk6lq84000vif040rtw7f3a', 'cmhk6lpsx000rif04yxu1l4wi', 'cmhj31yf30002ju04c2h2i62s', TRUE, 0, '"2025-11-04T06:22:04.804Z"'::jsonb, '"2025-11-04T06:22:05.299Z"'::jsonb),
  ('cmhk6r3va000vky04e511a3lx', 'cmhk6r3im000rky04cdbynudr', 'cmhj1zo2g0008jm04pzonfbdn', TRUE, 0, '"2025-11-04T06:26:15.766Z"'::jsonb, '"2025-11-04T06:26:16.186Z"'::jsonb),
  ('cmhk6uoqn000dl504eigomwak', 'cmhk6uob10009l50417l9nul3', 'cmhj1zcxq0007jm04q0afwsd7', TRUE, 0, '"2025-11-04T06:29:02.783Z"'::jsonb, '"2025-11-04T06:29:03.215Z"'::jsonb),
  ('cmhk73xxk0013if04lgty8lpq', 'cmhk73xkc000zif04epwaoz6z', 'cmhj2vocf0000ju04jd60amzh', TRUE, 0, '"2025-11-04T06:36:14.600Z"'::jsonb, '"2025-11-04T06:36:15.000Z"'::jsonb),
  ('cmhk78y130005jy04snkka0h1', 'cmhk78xn40001jy04d0de6uvh', 'cmhj25nw7000ejm04ocvjyic9', TRUE, 0, '"2025-11-04T06:40:08.008Z"'::jsonb, '"2025-11-04T06:40:08.632Z"'::jsonb),
  ('cmhka7qs0000ajo04kcymu69z', 'cmhka7qdc0006jo04v8bod63d', 'cmhka1mvm0004jo041ab3qy12', TRUE, 0, '"2025-11-04T08:03:10.800Z"'::jsonb, '"2025-11-04T08:03:11.224Z"'::jsonb),
  ('cmhkae4t20005jp04jlxfoyr3', 'cmhkae49t0001jp040u9xz5z9', 'cmhk9yhrw0007l804n622m5c1', TRUE, 0, '"2025-11-04T08:08:08.919Z"'::jsonb, '"2025-11-04T08:08:09.434Z"'::jsonb),
  ('cmhkaj50l0005ju04j2xatwbx', 'cmhkaj4gy0001ju04zfup4jpf', 'cmhk9y4c50006l804ax4i8uwc', TRUE, 0, '"2025-11-04T08:12:02.469Z"'::jsonb, '"2025-11-04T08:12:02.910Z"'::jsonb),
  ('cmhkapu0m000ijo0418bdy2mi', 'cmhkaptk4000ejo042mn5cn6x', 'cmhk9xiql0005l804gu9wpfez', TRUE, 0, '"2025-11-04T08:17:14.807Z"'::jsonb, '"2025-11-04T08:17:15.272Z"'::jsonb),
  ('cmhkau31x0005l704whjeyu5x', 'cmhkau2mk0001l704hs5bcbfh', 'cmhk9wyrz0004l804xbepo2oc', TRUE, 0, '"2025-11-04T08:20:33.142Z"'::jsonb, '"2025-11-04T08:20:33.555Z"'::jsonb),
  ('cmhkazdff000dl804aule489m', 'cmhkazcyp0009l804betfxk6g', 'cmhk9v87g0003l804cya0qhu3', TRUE, 0, '"2025-11-04T08:24:39.867Z"'::jsonb, '"2025-11-04T08:24:40.338Z"'::jsonb),
  ('cmhkb46v20005jv04vidfufvd', 'cmhkb46bt0001jv0496erukox', 'cmhk9u5160002l804t9dwebcc', TRUE, 0, '"2025-11-04T08:28:24.639Z"'::jsonb, '"2025-11-04T08:28:25.189Z"'::jsonb),
  ('cmhkb6zgg0005l404gexd9p5u', 'cmhkb6z1z0001l404o9sl06yc', 'cmhk9tra10001l8045iutqh2p', TRUE, 0, '"2025-11-04T08:30:35.008Z"'::jsonb, '"2025-11-04T08:30:35.419Z"'::jsonb),
  ('cmhkbde8m000dl404djqi072u', 'cmhkbddrz0009l4049wwue056', 'cmhk9t9qs0000l80470joxzn6', TRUE, 0, '"2025-11-04T08:35:34.102Z"'::jsonb, '"2025-11-04T08:35:34.636Z"'::jsonb),
  ('cmhkbgp2h000djv044n9zxsow', 'cmhkbgopk0009jv04nvbq3tac', 'cmhk9qz0e0003jo046onht30m', TRUE, 0, '"2025-11-04T08:38:08.106Z"'::jsonb, '"2025-11-04T08:38:08.599Z"'::jsonb),
  ('cmhkbji6w000ll4048dvvhm3s', 'cmhkbjhhj000hl404msjvjns1', 'cmhk9qmhx0002jo04xslqmqrs', TRUE, 0, '"2025-11-04T08:40:19.161Z"'::jsonb, '"2025-11-04T08:40:19.737Z"'::jsonb),
  ('cmhkbodzj000dl7046kji1edp', 'cmhkbodig0009l704qr98kfya', 'cmhk9q9r50001jo04a1axnmtt', TRUE, 0, '"2025-11-04T08:44:06.992Z"'::jsonb, '"2025-11-04T08:44:07.419Z"'::jsonb),
  ('cmhkbr52q000tl404a8y5tgho', 'cmhkbr4mn000pl4046a4zcd7a', 'cmhk9pr8y0000jo040k2xjno1', TRUE, 0, '"2025-11-04T08:46:15.410Z"'::jsonb, '"2025-11-04T08:46:15.827Z"'::jsonb),
  ('cmhkhstv90006l704lmkj5nm7', 'cmhkhstfi0002l704wp7cauee', 'cmhkhpjey0000l7044f2go8sd', TRUE, 0, '"2025-11-04T11:35:31.893Z"'::jsonb, '"2025-11-04T11:35:32.429Z"'::jsonb),
  ('cmhkhzw660005l504vd26zxik', 'cmhkhzvom0001l504223o4koj', 'cmhkg6xjf000bjl04mgw38ubj', TRUE, 0, '"2025-11-04T11:41:01.470Z"'::jsonb, '"2025-11-04T11:41:02.198Z"'::jsonb),
  ('cmhki0v9l0005i504v2mqr013', 'cmhki0uwz0001i5049i4n4djc', 'cmhkg6i0a000ajl04ih40dq25', TRUE, 0, '"2025-11-04T11:41:46.953Z"'::jsonb, '"2025-11-04T11:41:47.392Z"'::jsonb),
  ('cmhki5n2j000dl50489gbcops', 'cmhki5mpt0009l504xh1vxpt6', 'cmhkg5p8j0008jl04rk1rnyy2', TRUE, 0, '"2025-11-04T11:45:29.611Z"'::jsonb, '"2025-11-04T11:45:30.020Z"'::jsonb),
  ('cmhkicgpl000hl504jv4e9qec', 'cmhkicgag0001jr04785s8bym', 'cmhkg5b070007jl045y3eobc8', TRUE, 0, '"2025-11-04T11:50:47.961Z"'::jsonb, '"2025-11-04T11:50:48.503Z"'::jsonb),
  ('cmhkiisrv0005ii042t1nlixv', 'cmhkiisbh0001ii04zkbo4n6i', 'cmhkg4rcg0006jl04skgs0ud8', TRUE, 0, '"2025-11-04T11:55:43.531Z"'::jsonb, '"2025-11-04T11:55:44.124Z"'::jsonb),
  ('cmhkiop8s0005jm0406b7n8a9', 'cmhkioorp0001jm04lb642w0h', 'cmhkg4gi70005jl04kkqxubfn', TRUE, 0, '"2025-11-04T12:00:18.893Z"'::jsonb, '"2025-11-04T12:00:19.401Z"'::jsonb),
  ('cmhkivag20005ky04l8hk24hb', 'cmhkiv9w40001ky04ayrfh8u0', 'cmhkg43ex000ckz041j71m60e', TRUE, 0, '"2025-11-04T12:05:26.306Z"'::jsonb, '"2025-11-04T12:05:27.088Z"'::jsonb),
  ('cmhkizs8d000dii044w9ol2my', 'cmhkizrtu0009ii04njl94ev5', 'cmhkg3nig000bkz04l2qexhba', TRUE, 0, '"2025-11-04T12:08:55.982Z"'::jsonb, '"2025-11-04T12:08:56.380Z"'::jsonb),
  ('cmhkj4kik000pl5041irzeqxa', 'cmhkj4k14000ll5042hsnftz4', 'cmhkg39e5000akz04nsw3i16d', TRUE, 0, '"2025-11-04T12:12:39.260Z"'::jsonb, '"2025-11-04T12:12:39.833Z"'::jsonb),
  ('cmhkj8jww000dky04gv0am6pv', 'cmhkj8ivz0009ky04dydo64ew', 'cmhkg2v3j0009kz04gri0wd1t', TRUE, 0, '"2025-11-04T12:15:45.104Z"'::jsonb, '"2025-11-04T12:15:45.955Z"'::jsonb),
  ('cmhkjf9fx000lii04npzrglct', 'cmhkjf92g000hii04n8srz3v0', 'cmhkg2j5y0008kz04uz38dwv1', TRUE, 0, '"2025-11-04T12:20:58.125Z"'::jsonb, '"2025-11-04T12:20:58.547Z"'::jsonb),
  ('cmhkjijqt000djm046om3ab6n', 'cmhkjijau0009jm04wtqoae54', 'cmhkg27ui0007kz04liiy4mo6', TRUE, 0, '"2025-11-04T12:23:31.446Z"'::jsonb, '"2025-11-04T12:23:31.945Z"'::jsonb),
  ('cmhkjoyjs000ljm04yrghvcw4', 'cmhkjoy52000hjm04knqzmn1s', 'cmhkg1ufp0006kz042fqlx3sg', TRUE, 0, '"2025-11-04T12:28:30.568Z"'::jsonb, '"2025-11-04T12:28:30.959Z"'::jsonb),
  ('cmhkjsndc000tii04edlbnz4t', 'cmhkjsmtg000pii04kaf8fohg', 'cmhkg1hee0005kz04dsqj13k2', TRUE, 0, '"2025-11-04T12:31:22.704Z"'::jsonb, '"2025-11-04T12:31:23.222Z"'::jsonb),
  ('cmhkjyc4u000xl5043i50vu08', 'cmhkjybgs000tl50465996wsb', 'cmhkg15940004kz04xq925ajm', TRUE, 0, '"2025-11-04T12:35:48.078Z"'::jsonb, '"2025-11-04T12:35:48.627Z"'::jsonb),
  ('cmhkk5hz40005jv047lq64tt9', 'cmhkk5hkj0001jv04r9z4bf7p', 'cmhkg0shm0003kz04hwu96h1g', TRUE, 0, '"2025-11-04T12:41:22.240Z"'::jsonb, '"2025-11-04T12:41:22.777Z"'::jsonb),
  ('cmhkk8yvs0011ii04awrfq6uo', 'cmhkk8yfx000xii04lp57djki', 'cmhkg0cn90002kz04cmawm0s9', TRUE, 0, '"2025-11-04T12:44:04.121Z"'::jsonb, '"2025-11-04T12:44:04.527Z"'::jsonb),
  ('cmhkkgyvx0015l50452z6ab8v', 'cmhkkgyg00011l5046ekedizk', 'cmhkfzz1h0001kz04k3rbxawr', TRUE, 0, '"2025-11-04T12:50:17.374Z"'::jsonb, '"2025-11-04T12:50:17.915Z"'::jsonb),
  ('cmhkkkxon0005jm04ghj3ozbh', 'cmhkkkx7i0001jm047127s3yx', 'cmhkfzm980000kz04fbcgg2c4', TRUE, 0, '"2025-11-04T12:53:22.440Z"'::jsonb, '"2025-11-04T12:53:22.834Z"'::jsonb),
  ('cmhkkpajf001aii04hdpe49nd', 'cmhkkpa3n0016ii04c4d5on9m', 'cmhkehdkn0000jp046gw4qe63', TRUE, 0, '"2025-11-04T12:56:45.724Z"'::jsonb, '"2025-11-04T12:56:46.196Z"'::jsonb),
  ('cmhkkxo9m001dl504x2lv9kxo', 'cmhkkxnqo0019l5044pe9bd9k', 'cmhkefehi0004jl04pymnb5rr', TRUE, 0, '"2025-11-04T13:03:16.762Z"'::jsonb, '"2025-11-04T13:03:17.242Z"'::jsonb),
  ('cmhkl2zhj0005i604eakzq2b0', 'cmhkl2yzp0001i6040kf8lut7', 'cmhkeemq40002jl041ee3lgb3', TRUE, 0, '"2025-11-04T13:07:24.584Z"'::jsonb, '"2025-11-04T13:07:25.283Z"'::jsonb),
  ('cmhkl5e060005l104os2lmi82', 'cmhkl5djd0001l104jrt7vpkt', 'cmhkkoev20014ii04z66ew7t7', TRUE, 0, '"2025-11-04T13:09:16.710Z"'::jsonb, '"2025-11-04T13:09:17.201Z"'::jsonb),
  ('cmhkl7e4d001vii04hmo5ico0', 'cmhkl7drl001rii04gi3c9vad', 'cmhkkrica001dii04grt874ic', TRUE, 0, '"2025-11-04T13:10:50.173Z"'::jsonb, '"2025-11-04T13:10:50.606Z"'::jsonb),
  ('cmhkl7jq3000dl104mvxo98zs', 'cmhkl7jb20009l104lkhsyx03', 'cmhkeeaag0001jl045yevcmfm', TRUE, 0, '"2025-11-04T13:10:57.436Z"'::jsonb, '"2025-11-04T13:10:57.846Z"'::jsonb),
  ('cmhkla55q0005ky04e5vaqtob', 'cmhkla4lr0001ky04zhwwis10', 'cmhkkt5d8001eii04kqf864da', TRUE, 0, '"2025-11-04T13:12:58.527Z"'::jsonb, '"2025-11-04T13:12:59.374Z"'::jsonb),
  ('cmhklbwr5000di604vztwjvnh', 'cmhklbwe20009i60437cn9wkb', 'cmhkedu850000jl04l5jnpyr5', TRUE, 0, '"2025-11-04T13:14:20.946Z"'::jsonb, '"2025-11-04T13:14:21.358Z"'::jsonb),
  ('cmhklpn2b000ll104jzzkyrs9', 'cmhklpmco000hl104wza7ztcr', 'cmhkktn8z001fii04vluhvno0', TRUE, 0, '"2025-11-04T13:25:01.571Z"'::jsonb, '"2025-11-04T13:25:02.002Z"'::jsonb),
  ('cmhkm65xk000tl104coolgwgr', 'cmhkm65ic000pl1040ejkwdfo', 'cmhkm0dgy0023ii04z8203uy7', TRUE, 0, '"2025-11-04T13:37:52.521Z"'::jsonb, '"2025-11-04T13:37:52.952Z"'::jsonb),
  ('cmhkma4s70005jr04xk2ko05a', 'cmhkma4b80001jr04evqnnvo9', 'cmhkm00mj0022ii04v6ib56xw', TRUE, 0, '"2025-11-04T13:40:57.655Z"'::jsonb, '"2025-11-04T13:40:58.186Z"'::jsonb),
  ('cmhkmbkc40005l504eoy57nyz', 'cmhkmbjyf0001l504dj38t6h0', 'cmhkku4xs001gii04mwu8i1ij', TRUE, 0, '"2025-11-04T13:42:04.469Z"'::jsonb, '"2025-11-04T13:42:05.052Z"'::jsonb),
  ('cmhkmhnvq0029ii046trnb1r1', 'cmhkmhnfh0025ii04cyhzxftq', 'cmhklznbx0021ii04d4tf79iq', TRUE, 0, '"2025-11-04T13:46:48.998Z"'::jsonb, '"2025-11-04T13:46:49.410Z"'::jsonb),
  ('cmhkmkywc0005l104s46n27ih', 'cmhkmkygs0001l104y49z4o1e', 'cmhklzcuf0020ii043d2l7ice', TRUE, 0, '"2025-11-04T13:49:23.245Z"'::jsonb, '"2025-11-04T13:49:23.729Z"'::jsonb),
  ('cmhkmpku50005jo04juq4nqh2', 'cmhkmpkdo0001jo04k5z9xwxi', 'cmhkkuryo001iii04pmry10kd', TRUE, 0, '"2025-11-04T13:52:58.301Z"'::jsonb, '"2025-11-04T13:52:58.707Z"'::jsonb),
  ('cmhkmwxgi000ejo04lvam89q0', 'cmhkmwx41000ajo04yffw87hn', 'cmhkkv2hu001jii04xutytmc1', TRUE, 0, '"2025-11-04T13:58:41.251Z"'::jsonb, '"2025-11-04T13:58:41.662Z"'::jsonb),
  ('cmhkmxjrw0005js0456i4fqfy', 'cmhkmxjdm0001js04bdtko1r4', 'cmhkmrqzc0008jo04gfxaphaq', TRUE, 0, '"2025-11-04T13:59:10.173Z"'::jsonb, '"2025-11-04T13:59:10.597Z"'::jsonb),
  ('cmhkn0epq0005jv04rhzv2njk', 'cmhkn0e8a0001jv04f2kx9x3b', 'cmhkkvcr0001kii04e8xryny4', TRUE, 0, '"2025-11-04T14:01:23.583Z"'::jsonb, '"2025-11-04T14:01:24.031Z"'::jsonb),
  ('cmhkn3vev000djv04eykiwp5g', 'cmhkn3v3c0009jv04p7bs5plh', 'cmhkkvn5m001lii04qyehwcwm', TRUE, 0, '"2025-11-04T14:04:05.192Z"'::jsonb, '"2025-11-04T14:04:05.566Z"'::jsonb),
  ('cmhkoaigx0005kz048fchxo5j', 'cmhkoai4f0001kz04cx1voqui', 'cmhkkvw1u001mii0424xlrclr', TRUE, 0, '"2025-11-04T14:37:14.626Z"'::jsonb, '"2025-11-04T14:37:15.108Z"'::jsonb),
  ('cmhkocwqd000dkz04n1h5minl', 'cmhkocw9i0009kz043eqey29r', 'cmhkkwad0001nii04z6xtspoa', TRUE, 0, '"2025-11-04T14:39:06.421Z"'::jsonb, '"2025-11-04T14:39:06.968Z"'::jsonb),
  ('cmhkof0cv0005kz04exlq7llt', 'cmhkoezv40001kz04lli2hwx7', 'cmhkkwjx3001oii04l88gvoa4', TRUE, 0, '"2025-11-04T14:40:44.432Z"'::jsonb, '"2025-11-04T14:40:44.892Z"'::jsonb),
  ('cmhkogv9c000dkz048hs4sbn3', 'cmhkoguim0009kz04wnkby8o6', 'cmhkkwvi1001pii04p1eli1l8', TRUE, 0, '"2025-11-04T14:42:11.136Z"'::jsonb, '"2025-11-04T14:42:11.595Z"'::jsonb);

-- Table: products
-- Records: 97

INSERT INTO "products" ("id", "name", "sku", "description", "price", "category", "categoryId", "variations", "stockLevel", "minStock", "isActive", "clientId", "images", "videos", "thumbnailUrl", "createdAt", "updatedAt", "allowPreorder") VALUES
  ('cmhgdnfv80001jp04u7fjbz2r', 'Jadu kundan hangings ', 'Ys erng 1', 'Matt polish 
Primiam quality.', '"620"'::jsonb, 'Jumkys', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 6, 1, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-01T14:28:17.301Z"'::jsonb, '"2025-11-01T14:28:17.301Z"'::jsonb, FALSE),
  ('cmhgqjmom0001kv04nt45wiuo', 'BALAJI VANKI', '$CZ VANKI-189', 'HC:198', '"1230"'::jsonb, 'Aravanki', 'cmhgkoax60003js04bp3l0c36', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-01T20:29:14.518Z"'::jsonb, '"2025-11-01T20:29:14.518Z"'::jsonb, FALSE),
  ('cmhhla4sh0001ju04tfevrug1', 'Jadav kundan chand bali', 'Ys hng 02', 'Jadav kundan hangings.
Hc  : 69', '"600"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 6, 1, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-02T10:49:39.522Z"'::jsonb, '"2025-11-02T10:49:39.522Z"'::jsonb, FALSE),
  ('cmhiwu6jq0001l5040mjz1wb3', 'JADAU JUMKA', 'CZ JUMKA-177', 'HC:186', '"1289"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 7, 1, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T09:00:56.870Z"'::jsonb, '"2025-11-03T09:00:56.870Z"'::jsonb, FALSE),
  ('cmhixe3ld0001l704eey6yd6o', 'Gold replic ', 'Sun moon - 42', 'Hc 45', '"350"'::jsonb, 'Sun & Moon', 'cmhgkplzd0005js04tn9fghob', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T09:16:26.162Z"'::jsonb, '"2025-11-03T09:16:26.162Z"'::jsonb, FALSE),
  ('cmhiyvlbh0001la045johq640', 'Jadav kundan.gold replica.sun and moon.', 'Sun moon - 56', 'Hc 60', '"520"'::jsonb, 'Sun & Moon', 'cmhgkplzd0005js04tn9fghob', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T09:58:01.902Z"'::jsonb, '"2025-11-03T09:58:01.902Z"'::jsonb, FALSE),
  ('cmhj4fuhd000hju04ppowlam2', 'Matt JUMKA', 'CZ JUMKA - 44', '48', '"390"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T12:33:44.977Z"'::jsonb, '"2025-11-03T12:33:44.977Z"'::jsonb, FALSE),
  ('cmhj4v72v0001if04itzeg4cf', 'Premium Gold Jumka', 'CZ JUMKA-45', 'HC-49', '"380"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T12:45:41.143Z"'::jsonb, '"2025-11-03T12:45:41.143Z"'::jsonb, FALSE),
  ('cmhj51guh0001ic04y19u1rxs', 'Premium Gold Jumka', 'CZ JUMKA-48', 'HC-49', '"380"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T12:50:33.737Z"'::jsonb, '"2025-11-03T12:50:33.737Z"'::jsonb, FALSE),
  ('cmhj58iwc0001kz04brfuuzjd', 'MAT JUMKA', 'CZ JUMKA-38', 'HC-41', '"330"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 10, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T12:56:02.989Z"'::jsonb, '"2025-11-03T12:56:02.989Z"'::jsonb, FALSE),
  ('cmhj5g7fv0009if04pizuf30f', 'MAT JUMKA', 'JUMKA-78', 'HC-85', '"580"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T13:02:01.387Z"'::jsonb, '"2025-11-03T13:02:01.387Z"'::jsonb, FALSE),
  ('cmhj5m9280001ik04vm9s3egk', 'MAT JUMKA', 'JUMKA-78#1', 'HC-85', '"580"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T13:06:43.424Z"'::jsonb, '"2025-11-03T13:06:43.424Z"'::jsonb, FALSE),
  ('cmhj5z56t000pju04ui5hjxh8', 'GOLD JUMKA', 'YGH-24', 'HC', '"270"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 8, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T13:16:44.934Z"'::jsonb, '"2025-11-03T13:16:44.934Z"'::jsonb, FALSE),
  ('cmhj649c70001jo04bh5lp6rk', 'GOLD JUMKA', 'YGH-24#1', 'HC', '"270"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 8, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-03T13:20:43.591Z"'::jsonb, '"2025-11-03T13:20:43.591Z"'::jsonb, FALSE),
  ('cmhk4jxtg0002l504czwayg6g', 'JADAU ARAVANKI', 'CZ VANKI-213', 'HC:225', '"1390"'::jsonb, 'Aravanki', 'cmhgkoax60003js04bp3l0c36', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:24:42.100Z"'::jsonb, '"2025-11-04T05:24:42.100Z"'::jsonb, FALSE),
  ('cmhk4m8c50001la043tk9b9fb', 'MAT VANKI', 'MAT VANKI-189', 'HC:198', '"1230"'::jsonb, 'Aravanki', 'cmhgkoax60003js04bp3l0c36', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:26:29.045Z"'::jsonb, '"2025-11-04T05:26:29.045Z"'::jsonb, FALSE),
  ('cmhk4o2g50001l4048pvm0wg5', 'GOLD PREMIUM JUMKA', 'CZ-JUMKA-63', 'HC-', '"490"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:27:54.725Z"'::jsonb, '"2025-11-04T05:27:54.725Z"'::jsonb, FALSE),
  ('cmhk4obvm000al50401itq9tz', 'MAT VANKI', 'MAT VANKI-216', 'HC:227', '"1399"'::jsonb, 'Aravanki', 'cmhgkoax60003js04bp3l0c36', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:28:06.947Z"'::jsonb, '"2025-11-04T05:28:06.947Z"'::jsonb, FALSE),
  ('cmhk4y3s60001le04ny0qgo0g', 'PREMIUM GOLD JUMKA ', 'CZ JUMKA-51', 'HC-', '"400"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:35:43.015Z"'::jsonb, '"2025-11-04T05:35:43.015Z"'::jsonb, FALSE),
  ('cmhk50x7y0001l804k5e45bn7', 'GJ NECKLACE ', 'GJ NECKLACE-225', 'HC:236', '"1440"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:37:54.478Z"'::jsonb, '"2025-11-04T05:37:54.478Z"'::jsonb, FALSE),
  ('cmhk51mau0001l504ug28ubca', 'GOLD PREMIUM JUMKA ', 'CZ JUMKA-51#1', 'HC-', '"400"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:38:26.983Z"'::jsonb, '"2025-11-04T05:38:26.983Z"'::jsonb, FALSE),
  ('cmhk54pkx0009la04p9ut00rg', 'GJ NECKLACE ', 'GJ NECKLACE-225#1', 'HC:236', '"1440"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:40:51.202Z"'::jsonb, '"2025-11-04T05:40:51.202Z"'::jsonb, FALSE),
  ('cmhk57n4x0009l504oxp9q46x', 'GJ NECKLACE ', 'GJ NECKLACE-308', 'HC:324', '"1950"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[]'::jsonb, 0, 6, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:43:08.001Z"'::jsonb, '"2025-11-04T05:43:08.001Z"'::jsonb, FALSE),
  ('cmhk5ael20001kw044bjmoyfy', 'GOLD PREMIUM JUMKA', 'JUMKA-65', 'HC-', '"499"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 1, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:45:16.886Z"'::jsonb, '"2025-11-04T05:45:16.886Z"'::jsonb, FALSE),
  ('cmhk5k9xz0003ky04xny80dta', 'PREMIUM GOLD JUMKA', 'CZ JUMKA-38#1', 'HC-', '"350"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:52:57.431Z"'::jsonb, '"2025-11-04T05:52:57.431Z"'::jsonb, FALSE),
  ('cmhk5o8kf0001kz04y3cutjko', 'GJ NECKLACE ', 'GJ NECKLACE-270', 'HC:283', '"1710"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:56:02.271Z"'::jsonb, '"2025-11-04T05:56:02.271Z"'::jsonb, FALSE),
  ('cmhk5qajg0001if04eouue6vm', 'MAT LAKSHMI HANGINGS', 'CZ STUDS-65', 'HC-', '"499"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 1, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:57:38.140Z"'::jsonb, '"2025-11-04T05:57:38.140Z"'::jsonb, FALSE),
  ('cmhk5t0aw0001l7048lvwsf5w', 'GJ NECKLACE ', 'GJ NECKLACE-270#1', 'HC:283', '"1710"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[{"id":"1762235975281","name":"GJ POLISH ","value":"Ruby,green,purple ","priceAdjustment":0}]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T05:59:44.840Z"'::jsonb, '"2025-11-04T05:59:44.840Z"'::jsonb, FALSE),
  ('cmhk5usp0000bl704v6zs0gut', 'MAT PREMIUM JUMKA ', 'CZ HANGINGS-72', 'HC-', '"540"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:01:08.292Z"'::jsonb, '"2025-11-04T06:01:08.292Z"'::jsonb, FALSE),
  ('cmhk5x3qb0009if04cyafn1vg', 'GJ NECKLACE ', 'GJ NECKLACE-247', 'HC:260', '"1660"'::jsonb, 'GJ Necklaces', 'cmhgknb5p0001js04qvasnpzo', '[{"id":"1762236100267","name":"GJ POLISH ","value":"Ruby,green","priceAdjustment":0}]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:02:55.908Z"'::jsonb, '"2025-11-04T06:02:55.908Z"'::jsonb, FALSE),
  ('cmhk5xs0v000bky043x5nsmp4', 'MAT PREMIUM JUMKA', 'CZ HANGINGS-72#1', 'HC-', '"540"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 1, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:03:27.392Z"'::jsonb, '"2025-11-04T06:03:27.392Z"'::jsonb, FALSE),
  ('cmhk62d0i0009kz04q7ouk6kl', 'GOLD PREMIUM HANGINGS ', 'CZ EARRINGS-63', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:07:01.218Z"'::jsonb, '"2025-11-04T06:07:01.218Z"'::jsonb, FALSE),
  ('cmhk65h64000jif04sqowm0gr', 'GOLD PREMIUM HANGINGS ', 'CZ EARRINGS-63#1', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:09:26.572Z"'::jsonb, '"2025-11-04T06:09:26.572Z"'::jsonb, FALSE),
  ('cmhk6airt0001l404m4xr3hpm', 'MAT JUMKA ', 'JUMKA-60', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:13:21.929Z"'::jsonb, '"2025-11-04T06:13:21.929Z"'::jsonb, FALSE),
  ('cmhk6dd7v0001l504prshi03u', 'MAT JUMKA', 'JUMKA-60#1', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 12, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:15:34.700Z"'::jsonb, '"2025-11-04T06:15:34.700Z"'::jsonb, FALSE),
  ('cmhk6ivwh000jky04i4i8pm17', 'GOLD PREMIUM JUMKA', 'CZ JUMKA-24', 'HC-', '"360"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:19:52.193Z"'::jsonb, '"2025-11-04T06:19:52.193Z"'::jsonb, FALSE),
  ('cmhk6lpsx000rif04yxu1l4wi', 'GOLD PREMIUM JUMKA ', 'JUMKA-40', 'HC-', '"360"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 1, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:22:04.258Z"'::jsonb, '"2025-11-04T06:22:04.258Z"'::jsonb, FALSE),
  ('cmhk6r3im000rky04cdbynudr', 'CZ JUMKA', 'JUMKA-65#1', 'HC-', '"499"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:26:15.310Z"'::jsonb, '"2025-11-04T06:26:15.310Z"'::jsonb, FALSE),
  ('cmhk6uob10009l50417l9nul3', 'CZ JUMKA', 'JUMKA-65#-1', 'HC-', '"499"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:29:02.222Z"'::jsonb, '"2025-11-04T06:29:02.222Z"'::jsonb, FALSE),
  ('cmhk73xkc000zif04epwaoz6z', 'GOLD PREMIUM JUMKA', 'JUMKA-47', 'HC-', '"400"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:36:14.125Z"'::jsonb, '"2025-11-04T06:36:14.125Z"'::jsonb, FALSE),
  ('cmhk78xn40001jy04d0de6uvh', 'GOLD PREMIUM JUMKA ', 'CZ JUMKA-45#1', 'HC-', '"360"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 7, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T06:40:07.505Z"'::jsonb, '"2025-11-04T06:40:07.505Z"'::jsonb, FALSE),
  ('cmhka7qdc0006jo04v8bod63d', 'MAT LAKHMI JUMKA', 'CZ MAT JUMKA-58', 'HC-', '"560"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:03:10.272Z"'::jsonb, '"2025-11-04T08:03:10.272Z"'::jsonb, FALSE),
  ('cmhkae49t0001jp040u9xz5z9', 'MAT LAKSHMI JUMKA', 'CZ MAT JUMKA-58#1', 'HC-', '"560"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 8, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:08:08.225Z"'::jsonb, '"2025-11-04T08:08:08.225Z"'::jsonb, FALSE),
  ('cmhkaj4gy0001ju04zfup4jpf', 'GOLD PREMIUM JUMKA', 'JUMKA-47#1', 'HC/51', '"400"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 9, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:12:01.763Z"'::jsonb, '"2025-11-04T08:12:01.763Z"'::jsonb, FALSE),
  ('cmhkaptk4000ejo042mn5cn6x', 'GOLD PREMIUM LAKSHMI JUMKA', 'JUMKA-54', 'HC-', '"400"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:17:14.212Z"'::jsonb, '"2025-11-04T08:17:14.212Z"'::jsonb, FALSE),
  ('cmhkau2mk0001l704hs5bcbfh', 'PREMIUM GOLD LAKSHMI JUMKA', 'CZ EARRINGS-63#2', 'HC-', '"499"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:20:32.589Z"'::jsonb, '"2025-11-04T08:20:32.589Z"'::jsonb, FALSE),
  ('cmhkazcyp0009l804betfxk6g', 'PREMIUM GJ STUDS', 'GJ STUDS-58', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:24:39.266Z"'::jsonb, '"2025-11-04T08:24:39.266Z"'::jsonb, FALSE),
  ('cmhkb46bt0001jv0496erukox', 'PREMIUM GJ STUDS', 'GJ STUDS -58', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:28:23.945Z"'::jsonb, '"2025-11-04T08:28:23.945Z"'::jsonb, FALSE),
  ('cmhkb6z1z0001l404o9sl06yc', 'PREMIUM GJ STUDS', 'GJ STUDS-58#1', 'HC-', '"470"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 1, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:30:34.488Z"'::jsonb, '"2025-11-04T08:30:34.488Z"'::jsonb, FALSE),
  ('cmhkbddrz0009l4049wwue056', 'PREMIUM GJ STUDS', 'GJ STUDS-54', 'HC-', '"440"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:35:33.503Z"'::jsonb, '"2025-11-04T08:35:33.503Z"'::jsonb, FALSE),
  ('cmhkbgopk0009jv04nvbq3tac', 'PREMIUM GJ STUDS', 'CZ STUDS-35', 'HC-', '"290"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:38:07.641Z"'::jsonb, '"2025-11-04T08:38:07.641Z"'::jsonb, FALSE),
  ('cmhkbjhhj000hl404msjvjns1', 'GJ PREMIUM STUDS', 'GJ STUDS-54#1', 'HC-', '"440"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:40:18.247Z"'::jsonb, '"2025-11-04T08:40:18.247Z"'::jsonb, FALSE),
  ('cmhkbodig0009l704qr98kfya', 'PREMIUM CZ STUDS', 'CZ STUDS-20', 'HC-', '"270"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:44:06.377Z"'::jsonb, '"2025-11-04T08:44:06.377Z"'::jsonb, FALSE),
  ('cmhkbr4mn000pl4046a4zcd7a', 'PREMIUM CZ STUDS', 'CZ STUDS-20#1', 'HC-1', '"270"'::jsonb, 'Jumkas', 'cmhgd8l2q0004ky04uwi0a2pv', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T08:46:14.831Z"'::jsonb, '"2025-11-04T08:46:14.831Z"'::jsonb, FALSE),
  ('cmhkhstfi0002l704wp7cauee', 'Full silver coated bangils.', 'Gj bangles - 87', 'Hc -
Available sizes :-
2.8.
2.6.
2.4.', '"670"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:35:31.326Z"'::jsonb, '"2025-11-04T11:35:31.326Z"'::jsonb, FALSE),
  ('cmhkhzvom0001l504223o4koj', 'MAT PREMIUM BANGLES', 'CZ BANGLES-103', 'HC
AVAILABLE SIZES:-
2.4
2.6
2.8', '"760"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:41:00.838Z"'::jsonb, '"2025-11-04T11:41:00.838Z"'::jsonb, FALSE),
  ('cmhki0uwz0001i5049i4n4djc', 'Premium gold replica bangles.', 'Cz bangles - 83', 'Hc - 87
Available sizes 
2.8
26
2.4', '"600"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:41:46.499Z"'::jsonb, '"2025-11-04T11:41:46.499Z"'::jsonb, FALSE),
  ('cmhki5mpt0009l504xh1vxpt6', 'MAT PREMIUM BANGLES ', 'CZ MAT BANGLES-135', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"960"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:45:29.154Z"'::jsonb, '"2025-11-04T11:45:29.154Z"'::jsonb, FALSE),
  ('cmhkicgag0001jr04785s8bym', 'VICTORIAN BANGLES ', 'CZ VIC BANGLES-144', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"990"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:50:47.417Z"'::jsonb, '"2025-11-04T11:50:47.417Z"'::jsonb, FALSE),
  ('cmhkiisbh0001ii04zkbo4n6i', 'PREMIUM KADA BANGLE ', 'BANGLE-96', 'HC
KADA BANGLE 
', '"690"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T11:55:42.941Z"'::jsonb, '"2025-11-04T11:55:42.941Z"'::jsonb, FALSE),
  ('cmhkioorp0001jm04lb642w0h', 'PREMIUM CZ BANGLES', 'CZ BANGLES-105', 'HC
SIZES AVAILABLE:-
2.4 
2.6
2.8', '"699"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:00:18.277Z"'::jsonb, '"2025-11-04T12:00:18.277Z"'::jsonb, FALSE),
  ('cmhkiv9w40001ky04ayrfh8u0', 'PREMIUM MAT BANGLES ', 'CZ MAT BANGLES-139', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"980"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:05:25.588Z"'::jsonb, '"2025-11-04T12:05:25.588Z"'::jsonb, FALSE),
  ('cmhkizrtu0009ii04njl94ev5', 'PREMIUM SILVER COATED BANGLES', 'GJ BANGLES-99', 'HC
SIZES AVAILABLE:-
2.6
2.4
2.8', '"740"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:08:55.459Z"'::jsonb, '"2025-11-04T12:08:55.459Z"'::jsonb, FALSE),
  ('cmhkj4k14000ll5042hsnftz4', 'MAT PREMIUM BANGLES', 'CZ BANGLES-49#1', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"389"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:12:38.632Z"'::jsonb, '"2025-11-04T12:12:38.632Z"'::jsonb, FALSE),
  ('cmhkj8ivz0009ky04dydo64ew', 'VICTORIAN BANGLES ', 'CZ VIC BANGLES ', 'HC
SIZES AVAILABLE:-
2.6
2.8
2.10', '"990"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:15:43.775Z"'::jsonb, '"2025-11-04T12:15:43.775Z"'::jsonb, FALSE),
  ('cmhkjf92g000hii04n8srz3v0', 'PREMIUM SILVER COATED BANGLES ', 'GJ BANGLES- 189', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"1280"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:20:57.641Z"'::jsonb, '"2025-11-04T12:20:57.641Z"'::jsonb, FALSE),
  ('cmhkjijau0009jm04wtqoae54', 'SILVER COATED PREMIUM BANGLES ', 'GJ BANGLES-189', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"1280"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:23:30.871Z"'::jsonb, '"2025-11-04T12:23:30.871Z"'::jsonb, FALSE),
  ('cmhkjoy52000hjm04knqzmn1s', 'KABA CZ BANGLE', 'CZ BANGLES-189', 'HC
CHANGEABLE LOCKET 
COLOURS AVAILABLE 
', '"1296"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:28:30.039Z"'::jsonb, '"2025-11-04T12:28:30.039Z"'::jsonb, FALSE),
  ('cmhkjsmtg000pii04kaf8fohg', 'PREMIUM VICTORIAN BANGLES', 'CZ VIC BANGLES-108', 'HC
SIZES AVAILABLE:-
2.6
2.4
2.8', '"800"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:31:21.988Z"'::jsonb, '"2025-11-04T12:31:21.988Z"'::jsonb, FALSE),
  ('cmhkk5hkj0001jv04r9z4bf7p', 'PREMIUM MAT BANGLES ', 'CZ MAT BANGLES-80', 'HC
SIZES AVAILABLE:-
2.6
2.8
2.4', '"630"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:41:21.716Z"'::jsonb, '"2025-11-04T12:41:21.716Z"'::jsonb, FALSE),
  ('cmhkk8yfx000xii04lp57djki', 'PREMIUM MAT BANGLES ', 'CZ VIC BANGLES-108#1', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"800"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:44:03.550Z"'::jsonb, '"2025-11-04T12:44:03.550Z"'::jsonb, FALSE),
  ('cmhkkgyg00011l5046ekedizk', 'PREMIUM GOLD BANGLES ', 'CZ BANGLES-126', 'HC
SIZES AVAILABLE:-
2.4 
2.6', '"890"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:50:16.800Z"'::jsonb, '"2025-11-04T12:50:16.800Z"'::jsonb, FALSE),
  ('cmhkkkx7i0001jm047127s3yx', 'GOLD PREMIUM BANGLES ', 'CZ BANGLES-103#1', 'HC
SIZES AVAILABLE:-
2.4
2.8', '"780"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:53:21.822Z"'::jsonb, '"2025-11-04T12:53:21.822Z"'::jsonb, FALSE),
  ('cmhkkpa3n0016ii04c4d5on9m', 'MAT PREMIUM BANGLES', 'CZ MAT BANGLES-58', 'HC
SIZES AVAILABLE:-
2.4
2.6', '"600"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:56:45.155Z"'::jsonb, '"2025-11-04T12:56:45.155Z"'::jsonb, FALSE),
  ('cmhkkxnqo0019l5044pe9bd9k', 'PREMIUM MAT BANGLE', 'BNGL-87', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"630"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:03:16.080Z"'::jsonb, '"2025-11-04T13:03:16.080Z"'::jsonb, FALSE),
  ('cmhkl2yzp0001i6040kf8lut7', 'GOLD PREMIUM CZ BANGLES', 'CZ BANGLES-72', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"499"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:07:23.942Z"'::jsonb, '"2025-11-04T13:07:23.942Z"'::jsonb, FALSE),
  ('cmhkl5djd0001l104jrt7vpkt', 'Cz primium kada bracelet.', '$bracelet-38', 'Hc - 42', '"350"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:09:16.105Z"'::jsonb, '"2025-11-04T13:09:16.105Z"'::jsonb, FALSE),
  ('cmhkl7drl001rii04gi3c9vad', 'Primium kada bracelet.', '$bracelet-44', 'Hc ', '"360"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 4, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:10:49.713Z"'::jsonb, '"2025-11-04T13:10:49.713Z"'::jsonb, FALSE),
  ('cmhkl7jb20009l104lkhsyx03', 'CZ MAT BANGLES ', 'CZ BANGLES-92', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"630"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:10:56.895Z"'::jsonb, '"2025-11-04T13:10:56.895Z"'::jsonb, FALSE),
  ('cmhkla4lr0001ky04zhwwis10', 'Cz primium kada bracelet.', 'Cz bracelet - 58', 'Hc', '"450"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:12:57.807Z"'::jsonb, '"2025-11-04T13:12:57.807Z"'::jsonb, FALSE),
  ('cmhklbwe20009i60437cn9wkb', 'CZ MAT PREMIUM BANGLES ', 'BNGL-72', 'HC
SIZES AVAILABLE:-
2.4
2.6
2.8', '"540"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:14:20.474Z"'::jsonb, '"2025-11-04T13:14:20.474Z"'::jsonb, FALSE),
  ('cmhkjybgs000tl50465996wsb', ' PANCHALOHAM BANGLES ', 'BNGL-108', 'HC
SIZES AND COLOURS AVAILABLE:-
2.4
2.6
2.8', '"760"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T12:35:47.212Z"'::jsonb, '"2025-11-04T13:15:48.583Z"'::jsonb, FALSE),
  ('cmhklpmco000hl104wza7ztcr', 'Primiam cz kada bracelet.', 'Cz bracelet - 38', 'Hc', '"360"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:25:00.648Z"'::jsonb, '"2025-11-04T13:25:00.648Z"'::jsonb, FALSE),
  ('cmhkm65ic000pl1040ejkwdfo', 'PREMIUM SILVER COATED BANGLES ', 'GJ BANGLES-189#1', 'HC
SIZES AVAILABLE:-
2.6
2.8', '"1280"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:37:51.973Z"'::jsonb, '"2025-11-04T13:37:51.973Z"'::jsonb, FALSE),
  ('cmhkma4b80001jr04evqnnvo9', 'MAT PREMIUM BANGLES', 'CZ MAT BANGLES-135#1', 'HC
SIZES AVAILABLE:-
2.8
', '"960"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:40:57.044Z"'::jsonb, '"2025-11-04T13:40:57.044Z"'::jsonb, FALSE),
  ('cmhkmbjyf0001l504dj38t6h0', 'Chain bracelet.', 'Bracelet - 27', 'Hc', '"270"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 12, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:42:03.975Z"'::jsonb, '"2025-11-04T13:42:03.975Z"'::jsonb, FALSE),
  ('cmhkmhnfh0025ii04cyhzxftq', 'SILVER COATED PREMIUM BANGLES ', 'GJ BANGLES-87', 'HC
SIZES AVAILABLE:-
2.6
2.8', '"670"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 3, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:46:48.413Z"'::jsonb, '"2025-11-04T13:46:48.413Z"'::jsonb, FALSE),
  ('cmhkmkygs0001l104y49z4o1e', 'MAT PREMIUM BANGLES-74', 'CZ MAT BANGLES-74', 'HC
SIZES AVAILABLE:-
2.4
2.6', '"540"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 5, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:49:22.685Z"'::jsonb, '"2025-11-04T13:49:22.685Z"'::jsonb, FALSE),
  ('cmhkmpkdo0001jo04k5z9xwxi', 'Cz primium kada bracelet.', 'Cz bracelet - 116', 'Hc', '"750"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:52:57.709Z"'::jsonb, '"2025-11-04T13:52:57.709Z"'::jsonb, FALSE),
  ('cmhkmwx41000ajo04yffw87hn', 'Matt Lakshmi kada bracelet.', 'Cz bracelet - 96', 'Hc', '"699"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 0, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:58:40.801Z"'::jsonb, '"2025-11-04T13:58:40.801Z"'::jsonb, FALSE),
  ('cmhkmxjdm0001js04bdtko1r4', 'PREMIUM SILVER COATED BANGLES ', 'GJ BANGLES-98#1', 'HC
SIZES AVAILABLE:-
2.6
2.8', '"720"'::jsonb, 'Bangles', 'cmg5f3d7o0003l804vmxh5d2y', '[]'::jsonb, 2, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T13:59:09.658Z"'::jsonb, '"2025-11-04T13:59:09.658Z"'::jsonb, FALSE),
  ('cmhkn0e8a0001jv04f2kx9x3b', 'Matt Lakshmi bracelet.', 'Cz bracelet - 44', 'Hc', '"380"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 0, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:01:22.954Z"'::jsonb, '"2025-11-04T14:01:22.954Z"'::jsonb, FALSE),
  ('cmhkn3v3c0009jv04p7bs5plh', 'Cz kada bracelet ', '$bracelet - 29', 'Hc', '"270"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:04:04.776Z"'::jsonb, '"2025-11-04T14:04:04.776Z"'::jsonb, FALSE),
  ('cmhkoai4f0001kz04cx1voqui', 'Cz lakshmi primium kada bracelet.', '$bracelet - 44', 'Hc', '"360"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:37:14.175Z"'::jsonb, '"2025-11-04T14:37:14.175Z"'::jsonb, FALSE),
  ('cmhkocw9i0009kz043eqey29r', 'Cz chain type bracelet.', 'Cz bracelet - 36', 'Hc - 40', '"350"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 12, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:39:05.815Z"'::jsonb, '"2025-11-04T14:39:05.815Z"'::jsonb, FALSE),
  ('cmhkoezv40001kz04lli2hwx7', 'Cz kada bracelet.', 'bracelet - 38', 'Hc-42', '"350"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:40:43.792Z"'::jsonb, '"2025-11-04T14:40:43.792Z"'::jsonb, FALSE),
  ('cmhkoguim0009kz04wnkby8o6', 'Cz kada bracelet ', 'Bracelet - 38 # 2', 'Hc - 42', '"350"'::jsonb, 'BRACELET', 'cmhgkqq830001l8047ev8tmz7', '[]'::jsonb, 6, 0, TRUE, 'cmg1srt900001l5049x26l2cp', '[]'::jsonb, '[]'::jsonb, NULL, '"2025-11-04T14:42:10.174Z"'::jsonb, '"2025-11-04T14:42:10.174Z"'::jsonb, FALSE);

-- Table: users
-- Records: 6

INSERT INTO "users" ("id", "email", "password", "name", "role", "clientId", "isActive", "createdAt", "updatedAt") VALUES
  ('cmg1fahe50001y7q2d6al5e4b', 'karthik@scan2ship.in', '$2b$10$jRPfPVg2azFOPgZcparTOuc/LoOPi2jbYDy18F3bQi5yvmFijj32y', 'Karthik Dintakurthi', 'MASTER_ADMIN', NULL, TRUE, '"2025-09-26T22:37:57.005Z"'::jsonb, '"2025-09-26T22:39:29.387Z"'::jsonb),
  ('cmg1srtcz0005l504j6ofsics', 'yoshita@stockmind.in', '$2b$10$v8Hv7qnhhUspy6q060ffVuzgPZ/MDs6x71EL4KvE6onh80VztSwt2', 'Yoshita Fashion Jewellery', 'ADMIN', 'cmg1srt900001l5049x26l2cp', TRUE, '"2025-09-27T04:55:20.676Z"'::jsonb, '"2025-09-27T04:56:29.327Z"'::jsonb),
  ('cmg5evtyt0001ld04lehpg7b2', 'yoga@stockmind.in', '$2b$10$yaojdG6Q334.wDf0uj5.P.UpIQEfv.fM32nC1Bfh.WXnVG1pvnKFG', 'Yoganand Ch', 'USER', 'cmg1srt900001l5049x26l2cp', TRUE, '"2025-09-29T17:37:38.166Z"'::jsonb, '"2025-10-11T10:56:43.899Z"'::jsonb),
  ('cmgya2grr0005jm04zaywejzu', 'vanithafashionjewellery.usa@gmail.com', '$2b$10$KcHWczT0ujZBY633mbZVquZM35Cg0j334n9NMQelI9iweSAgOdN7y', 'Vanitha Fashion Jewelry Admin', 'ADMIN', 'cmgya2gn30001jm04l9nho4y1', TRUE, '"2025-10-19T22:28:08.679Z"'::jsonb, '"2025-10-19T22:28:08.679Z"'::jsonb),
  ('cmgya3dzq0001lb04n422zd1g', 'sailaja@vanitha.com', '$2b$10$NEAaUXfinxHBTlJG25ll7OG8b64AUVZnQXnwu2.b4/yUFdqitdQbm', 'Sailaja Dintakurthi', 'USER', 'cmgya2gn30001jm04l9nho4y1', TRUE, '"2025-10-19T22:28:51.735Z"'::jsonb, '"2025-10-19T22:28:51.735Z"'::jsonb),
  ('cmhgbmghy0001jy04m0iaivdr', 'shop@yoshita.com', '$2b$10$8McHUBMGga2r9vb31JK90.6VINjkA7LrRvut90uG3YUuvfbgDzD9y', 'Vijayawada Shop', 'USER', 'cmg1srt900001l5049x26l2cp', TRUE, '"2025-11-01T13:31:32.230Z"'::jsonb, '"2025-11-01T13:31:32.230Z"'::jsonb);

COMMIT;

-- Backup complete
