--
-- PostgreSQL database dump
--

\restrict WponN6rjqATwmHv3NBQljd9ZxtyHZJJMf8Vr1Ier0hfwuliog8EwSQZxbEd4ATU

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: InventoryType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InventoryType" AS ENUM (
    'PURCHASE',
    'SALE',
    'ADJUSTMENT',
    'RETURN',
    'DAMAGE',
    'TRANSFER'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);


--
-- Name: Plan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Plan" AS ENUM (
    'STARTER',
    'PROFESSIONAL',
    'ENTERPRISE'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'MASTER_ADMIN',
    'ADMIN',
    'MANAGER',
    'USER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id text NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    secret text,
    "clientId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    permissions text[] DEFAULT ARRAY[]::text[],
    "lastUsedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "clientId" text NOT NULL,
    "parentId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: client_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_settings (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "companyName" text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    timezone text DEFAULT 'America/New_York'::text NOT NULL,
    "lowStockThreshold" integer DEFAULT 10 NOT NULL,
    "autoReorder" boolean DEFAULT false NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "smsNotifications" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    email text NOT NULL,
    phone text,
    address text,
    logo text,
    "countryId" text,
    "currencyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    plan public."Plan" DEFAULT 'STARTER'::public."Plan" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "guestAccessEnabled" boolean DEFAULT false NOT NULL,
    "guestPassword" text
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "currencyId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    symbol text NOT NULL,
    "decimalPlaces" integer DEFAULT 2 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: frame_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frame_embeddings (
    id text NOT NULL,
    "frameId" text NOT NULL,
    embedding public.vector(512) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: image_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_embeddings (
    id text NOT NULL,
    "mediaId" text NOT NULL,
    embedding public.vector(512) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: inventory_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_history (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    type public."InventoryType" NOT NULL,
    reason text,
    "userId" text,
    "clientId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id text NOT NULL,
    "productId" text,
    kind text NOT NULL,
    "s3Key" text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    width integer,
    height integer,
    "durationMs" integer,
    "altText" text,
    caption text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    "productSku" text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "clientId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text NOT NULL,
    "shippingAddress" jsonb NOT NULL,
    "billingAddress" jsonb,
    notes text,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    shipping numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymentUTR" text,
    "paymentTransactionNumber" text,
    "paymentProofUrl" text
);


--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_metrics (
    id text NOT NULL,
    url text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    fcp double precision,
    lcp double precision,
    fid double precision,
    cls double precision,
    ttfb double precision,
    fmp double precision,
    tti double precision,
    "userAgent" text,
    "connectionType" text,
    "deviceMemory" integer,
    "hardwareConcurrency" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_media (
    id text NOT NULL,
    "productId" text NOT NULL,
    "mediaId" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category text NOT NULL,
    "categoryId" text,
    variations jsonb,
    "stockLevel" integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "clientId" text NOT NULL,
    images jsonb,
    videos jsonb,
    "thumbnailUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "allowPreorder" boolean DEFAULT false NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    role public."Role" DEFAULT 'ADMIN'::public."Role" NOT NULL,
    "clientId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: video_frames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_frames (
    id text NOT NULL,
    "mediaId" text NOT NULL,
    "frameS3Key" text NOT NULL,
    "tsMs" integer NOT NULL,
    width integer,
    height integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5bd8a574-9c05-473c-b68f-587c3ed00f76	036385e4cd0e7c7457c894c14dc68acf86c37b2d78bf56573982314b57bb9426	2025-09-21 22:47:58.813099+00	0_init		\N	2025-09-21 22:47:58.813099+00	0
2859c478-b827-497f-aeda-5366d4961054	29a3de9d37f5101c43dd7cc8c7c79a4afa2028375dc3da77d014e3fc74b4a132	2025-09-25 21:02:00.13621+00	20250823221623_init_postgresql	\N	\N	2025-09-25 21:01:59.992013+00	1
228083ee-e704-4d0f-ab4d-e044350938a2	1139b748f6b6018d9397b3a59b2b4a738174cf880cf7cf5ac8c56a56af9a0d4d	2025-09-25 21:02:00.288704+00	20250824132703_add_phone_field	\N	\N	2025-09-25 21:02:00.180029+00	1
23dbf40e-4384-4ce3-83fc-616e21b85a93	4f1475e78f88c0910833189737cdd98c53db4bcd0177dd81ddaaa993466099ad	2025-09-25 21:02:48.706085+00	20250825160047_add_config_tables	\N	\N	2025-09-25 21:02:48.582895+00	1
e61b20f7-2845-4e4b-84e0-a10add439983	b16ff4c733c3d55028fe5c9145aca092f27a6b3393ac63493f0da13d1e0f88ca	\N	20250825124922_add_saas_tables	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250825124922_add_saas_tables\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "clients" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"clients\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1159), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250825124922_add_saas_tables"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250825124922_add_saas_tables"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-09-25 21:02:29.648977+00	2025-09-25 21:02:00.332429+00	0
ad10da91-c34a-4630-9f3b-8222f02c1d34	b16ff4c733c3d55028fe5c9145aca092f27a6b3393ac63493f0da13d1e0f88ca	\N	20250825124922_add_saas_tables	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250825124922_add_saas_tables\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "clients" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"clients\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1159), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250825124922_add_saas_tables"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250825124922_add_saas_tables"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-09-25 21:02:43.947504+00	2025-09-25 21:02:34.954733+00	0
1e911891-eae6-4c49-9922-b8546d5f6fcd	b16ff4c733c3d55028fe5c9145aca092f27a6b3393ac63493f0da13d1e0f88ca	2025-09-25 21:02:43.995453+00	20250825124922_add_saas_tables		\N	2025-09-25 21:02:43.995453+00	0
9cb71cd7-63bf-4ec5-927c-73ad6d333831	f653d1385fe6d6bc0af0e5844ab7d1e58fecfde1a2107ad8e1a20b1637022788	2025-09-25 21:02:48.868454+00	20250825165623_add_client_order_config	\N	\N	2025-09-25 21:02:48.741734+00	1
d1b28eab-b40d-4dea-bbfb-0cd53b89f12a	b30972c16a4910f7fc8b9bb62480d2b79fa2ef8a0f1c7f81d432b4d757948985	\N	20250826131841_add_analytics_tables	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250826131841_add_analytics_tables\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "public.orders" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"public.orders\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(631), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250826131841_add_analytics_tables"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250826131841_add_analytics_tables"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-10-09 13:10:45.744634+00	2025-09-25 21:02:48.909778+00	0
412400aa-8c2d-4ce1-b0a8-0caf6ae4a40e	a42b79777f711725e6e3b864f7737054749b9a645608612c0b2d4bcf4e4e5954	\N	20250926220000_update_role_enum	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250926220000_update_role_enum\n\nDatabase error code: 22023\n\nDatabase error:\nERROR: "SUPER_ADMIN" is not an existing enum label\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E22023), message: "\\"SUPER_ADMIN\\" is not an existing enum label", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("pg_enum.c"), line: Some(661), routine: Some("RenameEnumLabel") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250926220000_update_role_enum"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250926220000_update_role_enum"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-10-09 13:11:30.254291+00	2025-10-09 13:10:54.080877+00	0
65b3cfa6-bdad-4f72-b87a-83a095f0ed45	a42b79777f711725e6e3b864f7737054749b9a645608612c0b2d4bcf4e4e5954	2025-10-09 13:11:30.298488+00	20250926220000_update_role_enum		\N	2025-10-09 13:11:30.298488+00	0
b9cb547a-6688-4d76-8c19-23a912d5e522	5bf02fe51c92f4b42885d8d7e8d94a245a083ec9d13c9152cb58221c68366de5	2025-10-09 13:11:32.549972+00	20251009022100_add_product_media_and_guest_access		\N	2025-10-09 13:11:32.549972+00	0
cd7af922ebd83cf6045010852	d3b2bb11cce7130c5fb4d6618a24fb2fc795efe3e4dea6ab8edab9d94432a896	2025-12-31 10:37:19.964543+00	20251230120000_add_orders_and_order_items	\N	\N	2025-12-31 10:37:19.964543+00	13
cebcb350c33e9e9553c0fa03b	f591abd7caef8439127fdf0eb6ca5028e94dd18d9cd7d2d9ea52a85cbbada013	2025-12-31 10:37:20.022941+00	20250101000000_add_payment_fields_to_orders	\N	\N	2025-12-31 10:37:20.022941+00	1
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, name, key, secret, "clientId", "isActive", permissions, "lastUsedAt", "expiresAt", "createdAt", "updatedAt") FROM stdin;
api-key-1758934761629	Default Company Integration	cat_sk_2e73e44dd9adad12a36fb1e293b485f76e56ee262bc91dea824fc62d5e68c932	\N	cmg1fnate0000y7jhvtmfha19	t	{inventory:read,inventory:write,products:read,products:write}	\N	\N	2025-09-27 00:59:21.629	2025-09-27 00:59:21.629
api-key-1759167330505	Yoshitha Integration	cat_sk_26af78751ba81f611736879c0f18905138de7be06c5df6cc7907c28fed1c28bc	\N	cmg1srt900001l5049x26l2cp	t	{inventory:read,inventory:write,products:read,products:write}	\N	\N	2025-09-29 17:35:30.505	2025-09-29 17:35:30.505
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, "isActive", "clientId", "parentId", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmg5f3d7o0003l804vmxh5d2y	Bangles	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-09-29 17:43:29.701	2025-09-29 17:43:29.701
cmhgcpq4f0001l10491v94f1j	Black Beads	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 14:02:04.288	2025-11-01 14:02:04.288
cmhgcq6pu0001kz04mlans2xj	GJ Bangles	\N	f	cmg1srt900001l5049x26l2cp	cmg5f3d7o0003l804vmxh5d2y	0	2025-11-01 14:02:25.794	2025-11-01 14:02:37.568
cmhgd8l2q0004ky04uwi0a2pv	Jumkas	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 14:16:44.211	2025-11-01 17:43:08.302
cmg5f33zu0001l804s1wrqr5t	CZ Necklaces	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-09-29 17:43:17.754	2025-11-01 17:43:43.46
cmhgknb5p0001js04qvasnpzo	GJ Necklaces	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:44:08.509	2025-11-01 17:44:08.509
cmhgkntwx0001ib04a4y9dxou	Mat haram	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:44:32.817	2025-11-01 17:44:32.817
cmhgkoax60003js04bp3l0c36	Aravanki	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:44:54.858	2025-11-01 17:44:54.858
cmhgkonzs0001l504aofu3gyj	CHAMPASWARALU	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:45:11.8	2025-11-01 17:45:11.8
cmhgkox8n0003ib0427athu89	Jada set	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:45:23.783	2025-11-01 17:45:23.783
cmhgkplzd0005js04tn9fghob	Sun & Moon	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:45:55.85	2025-11-01 17:45:55.85
cmhgkpywb0005ib04ymz2zgwk	Combo Set	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:46:12.587	2025-11-01 17:46:12.587
cmhgkqq830001l8047ev8tmz7	BRACELET	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:46:48.004	2025-11-01 17:46:48.004
cmhgkr6uf0003l804bzsy4f16	CHOKERS	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-01 17:47:09.544	2025-11-01 17:47:09.544
cmho3fsxp0001ju04hzwllaw8	KASULA HARAM	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-07 00:04:34.237	2025-11-07 00:04:34.237
cmhq0p02k0001kw04yw2jjlgu	VADDANAM	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-08 08:23:16.893	2025-11-08 08:23:16.893
cmht6sb1g0001js041506z3hz	MAT NECKLACE	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-10 13:37:07.301	2025-11-10 13:37:07.301
cmi46y9du0001l204herkdh6w	Fancy mala	Crestal beads	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-18 06:27:13.026	2025-11-18 06:27:13.026
cmi71914t0001l704tgh2kfn8	Thali chains	24 Inch+ 30 inch 	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-20 06:10:56.381	2025-11-20 06:10:56.381
cmi9zuxwu000dl404up390ywb	Puli goru lockets	Mala + locketes separate available.	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-22 07:55:17.934	2025-11-22 07:55:17.934
cmictwptb0001l2041xf5mh56	Tikhas (papidi chain)	Matt + nakshi + cz	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-24 07:32:01.584	2025-11-24 07:32:32.707
cmih2it88000fkz043nf8vfcc	Earrcuffs	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-27 06:44:14.073	2025-11-27 06:44:14.073
cmih992ry0001la04z66nrpok	Ear studs	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-27 09:52:37.198	2025-11-27 09:52:37.198
cmih9kzf70001i904tu7iuf6z	Chain Necklace	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-27 10:01:52.723	2025-11-27 10:01:52.723
cmiiok42a0001jr04mqm2lgu1	Hangings	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-11-28 09:48:52.498	2025-11-28 09:48:52.498
cmirh03xp0001l104sjizl4v4	Matti	\N	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-04 13:27:17.478	2025-12-04 13:27:17.478
cmitygf3c0001jl0465c0k3t9	ChandraHaram.	.	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-06 07:11:24.264	2025-12-06 07:11:24.264
cmj2snjep0001le04djqr3fqd	Invisible Chains	.	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-12 11:38:54.337	2025-12-12 11:38:54.337
cmjo0ynz8000al704riezevpo	PANCHALOHAM NECKLACE	.	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-27 08:14:40.101	2025-12-27 08:14:40.101
cmjqt79cq0001l4049v3q222u	ONE GRAM BANGLES	.	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-29 07:00:42.65	2025-12-29 07:00:42.65
cmjtocyyb000pjj04i2gu0qwu	18 inches short chains.	Baby Chains 	t	cmg1srt900001l5049x26l2cp	\N	0	2025-12-31 07:08:29.555	2025-12-31 07:08:29.555
\.


--
-- Data for Name: client_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_settings (id, "clientId", "companyName", email, phone, address, timezone, "lowStockThreshold", "autoReorder", "emailNotifications", "smsNotifications", "createdAt", "updatedAt") FROM stdin;
cmg1srtao0003l504o1i6kqz5	cmg1srt900001l5049x26l2cp	Yoshita Fashion Jewellery	yoshita@stockmind.in	9951733377	27, 21-65, Kaleswararao Rd, Governor Peta, Vijayawada, Andhra Pradesh 520002	America/New_York	10	f	t	f	2025-09-27 04:55:20.592	2025-09-27 04:55:20.592
cmgya2gpg0003jm047en03ivq	cmgya2gn30001jm04l9nho4y1	Vanitha Fashion Jewelry	vanithafashionjewellery.usa@gmail.com	2408699718	325 WEST SIDE DR APT 201 \nGaithersburg, Maryland 20878	America/New_York	10	f	t	f	2025-10-19 22:28:08.596	2025-10-19 22:28:08.596
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, slug, domain, email, phone, address, logo, "countryId", "currencyId", "isActive", plan, "createdAt", "updatedAt", "guestAccessEnabled", "guestPassword") FROM stdin;
cmg1fnate0000y7jhvtmfha19	Default Client	default-client	\N	admin@example.com	\N	\N	\N	\N	\N	t	STARTER	2025-09-26 22:47:55.011	2025-09-26 22:47:55.011	f	\N
cmgya2gn30001jm04l9nho4y1	Vanitha Fashion Jewelry	vanitha-fashion-jewelry	\N	vanithafashionjewellery.usa@gmail.com	2408699718	325 WEST SIDE DR APT 201 \nGaithersburg, Maryland 20878	\N	cty_us	cur_usd	t	ENTERPRISE	2025-10-19 22:28:08.511	2025-10-19 22:28:08.511	f	\N
cmg1srt900001l5049x26l2cp	Yoshita Fashion Jewellery	yoshita-fashion-jewellery	\N	yoshita@stockmind.in	9951733377	27, 21-65, Kaleswararao Rd, Governor Peta, Vijayawada, Andhra Pradesh 520002	\N	cty_in	cur_inr	t	STARTER	2025-09-27 04:55:20.533	2025-11-06 04:02:08.997	t	guest123
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, name, code, "currencyId", "isActive", "createdAt", "updatedAt") FROM stdin;
cty_us	United States	US	cur_usd	t	2025-09-17 20:11:40.701	2025-09-17 20:11:40.701
cty_in	India	IN	cur_inr	t	2025-09-17 20:11:40.862	2025-09-17 20:11:40.862
cty_ca	Canada	CA	cur_cad	t	2025-10-03 22:14:04.454	2025-10-03 22:14:04.454
cty_gb	United Kingdom	GB	cur_gbp	t	2025-10-03 22:14:04.508	2025-10-03 22:14:04.508
cty_de	Germany	DE	cur_eur	t	2025-10-03 22:14:04.537	2025-10-03 22:14:04.537
cty_fr	France	FR	cur_eur	t	2025-10-03 22:14:04.564	2025-10-03 22:14:04.564
cty_it	Italy	IT	cur_eur	t	2025-10-03 22:14:04.591	2025-10-03 22:14:04.591
cty_es	Spain	ES	cur_eur	t	2025-10-03 22:14:04.622	2025-10-03 22:14:04.622
cty_au	Australia	AU	cur_aud	t	2025-10-03 22:14:04.65	2025-10-03 22:14:04.65
cty_jp	Japan	JP	cur_jpy	t	2025-10-03 22:14:04.715	2025-10-03 22:14:04.715
cty_cn	China	CN	cur_cny	t	2025-10-03 22:14:04.792	2025-10-03 22:14:04.792
cty_br	Brazil	BR	cur_brl	t	2025-10-03 22:14:04.816	2025-10-03 22:14:04.816
cty_mx	Mexico	MX	cur_mxn	t	2025-10-03 22:14:04.84	2025-10-03 22:14:04.84
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (id, name, code, symbol, "decimalPlaces", "isActive", "createdAt", "updatedAt") FROM stdin;
cur_usd	US Dollar	USD	$	2	t	2025-09-17 20:11:40.417	2025-09-17 20:11:40.417
cur_inr	Indian Rupee	INR	₹	2	t	2025-09-17 20:11:40.6	2025-09-17 20:11:40.6
cur_eur	Euro	EUR	€	2	t	2025-10-03 22:13:40.808	2025-10-03 22:13:40.808
cur_gbp	British Pound	GBP	£	2	t	2025-10-03 22:13:41.019	2025-10-03 22:13:41.019
cur_cad	Canadian Dollar	CAD	C$	2	t	2025-10-03 22:13:41.409	2025-10-03 22:13:41.409
cur_aud	Australian Dollar	AUD	A$	2	t	2025-10-03 22:13:41.544	2025-10-03 22:13:41.544
cur_jpy	Japanese Yen	JPY	¥	0	t	2025-10-03 22:13:41.729	2025-10-03 22:13:41.729
cur_cny	Chinese Yuan	CNY	¥	2	t	2025-10-03 22:13:41.935	2025-10-03 22:13:41.935
cur_brl	Brazilian Real	BRL	R$	2	t	2025-10-03 22:13:42.166	2025-10-03 22:13:42.166
cur_mxn	Mexican Peso	MXN	$	2	t	2025-10-03 22:13:42.344	2025-10-03 22:13:42.344
\.


--
-- Data for Name: frame_embeddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.frame_embeddings (id, "frameId", embedding, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: image_embeddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.image_embeddings (id, "mediaId", embedding, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventory_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_history (id, "productId", quantity, type, reason, "userId", "clientId", "createdAt") FROM stdin;
cmjtwv3fs0001l204wyi1xmaj	cmi1va3vp0001kt040b4c9hhv	-1	SALE	Order ORD-MJTW5MT6-JJNF - Status changed to CONFIRMED	cmjsu1k980001k104wdwf3n3l	cmg1srt900001l5049x26l2cp	2025-12-31 11:06:32.105
cmjtwwiky0003l204v0759of1	cmi1va3vp0001kt040b4c9hhv	1	RETURN	Order ORD-MJTW5MT6-JJNF - Status changed from CONFIRMED to CANCELLED	cmjsu1k980001k104wdwf3n3l	cmg1srt900001l5049x26l2cp	2025-12-31 11:07:38.386
cmk51x1vu0001kw04mxtmf3h6	cmishpz7t000hlb0479yzcqnq	-1	SALE	Order ORD-MK2I4GHF-UAUO - Status changed to CONFIRMED	cmjsu0xp60001l204s7denxpj	cmg1srt900001l5049x26l2cp	2026-01-08 06:13:29.418
cmk7w2exg0001if04jjfqtiqv	cmjmj4jkx000mjr04jmtfcny9	-1	SALE	Order ORD-MK7T93IR-3AFL - Status changed to CONFIRMED	cmjsu0xp60001l204s7denxpj	cmg1srt900001l5049x26l2cp	2026-01-10 05:53:00.436
cmk7w2eyh0003if048guo4zb3	cmji9a8090009kz04e15uul13	-1	SALE	Order ORD-MK7T93IR-3AFL - Status changed to CONFIRMED	cmjsu0xp60001l204s7denxpj	cmg1srt900001l5049x26l2cp	2026-01-10 05:53:00.474
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, "productId", kind, "s3Key", "originalName", "mimeType", "fileSize", width, height, "durationMs", "altText", caption, "sortOrder", "isPrimary", status, error, "createdAt", "updatedAt") FROM stdin;
cmjwdab9e0007i20457lmrxzw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767327708090-b5b0489d-Mat-haram-2-1.jpg	Mat haram 2-1.jpg	image/jpeg	562730	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-02 04:21:48.29	2026-01-02 04:21:48.29
cmiwqo6i70001l104x67jdckn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173407804-5d780a96-IMG_9174.jpeg	IMG_9174.jpeg	image/jpeg	981907	2138	2014	\N	\N	\N	0	f	completed	\N	2025-12-08 05:56:47.983	2025-12-08 05:56:47.983
cmifnfm7d0000ju04m9apjul1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764140044196-21571837-IMG-20251126-WA0035.jpg	IMG-20251126-WA0035.jpg	image/jpeg	61468	720	1600	\N	\N	\N	0	f	completed	\N	2025-11-26 06:54:04.486	2025-11-26 06:54:04.486
cmia5ql7q0009l704y8b9r3ys	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992469-461daf96-IMG-20251120-WA0198.jpg	IMG-20251120-WA0198.jpg	image/jpeg	291872	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.55	2026-01-05 07:15:33.012
cmiwqo6nz0002l104vqyo9klv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173408105-1e9ae8af-IMG_9177.jpeg	IMG_9177.jpeg	image/jpeg	849871	1844	2198	\N	\N	\N	0	f	completed	\N	2025-12-08 05:56:48.191	2025-12-08 05:56:48.191
cmiwqokos0003l104143lxdse	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173426087-3ebd745f-IMG_9178.jpeg	IMG_9178.jpeg	image/jpeg	1048250	2203	2005	\N	\N	\N	0	f	completed	\N	2025-12-08 05:57:06.245	2025-12-08 05:57:06.245
cmiwqokrr0004l104lipk6ody	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173426388-653145a8-IMG_9184.jpeg	IMG_9184.jpeg	image/jpeg	1057934	2065	2102	\N	\N	\N	0	f	completed	\N	2025-12-08 05:57:06.471	2025-12-08 05:57:06.471
cmih7xnxc0001jm04g8uq1nso	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764234944865-cb7e028b-IMG-20251126-WA0167.jpg	IMG-20251126-WA0167.jpg	image/jpeg	201824	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-27 09:15:45.027	2025-11-27 09:15:45.027
cmih7z1sr0002jm04f9uwua1v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764235009482-0464f91f-IMG-20251126-WA0168.jpg	IMG-20251126-WA0168.jpg	image/jpeg	202950	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-27 09:16:49.662	2025-11-27 09:16:49.662
cmiwqoku80005l104fwrcavxl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173426480-efcbcc65-IMG_9195.jpeg	IMG_9195.jpeg	image/jpeg	937362	2258	1843	\N	\N	\N	0	f	completed	\N	2025-12-08 05:57:06.56	2025-12-08 05:57:06.56
cmk3xxo1w0009js04mu0vyfao	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767785653256-f202c746-Gold-balls.jpg	Gold balls.jpg	image/jpeg	573677	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 11:34:13.508	2026-01-07 11:34:13.508
cmk0rt3ny0005kt04rwgrk0sg	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593964160-9d0deaf4-0921f0d7-730c-46bd-a2a9-c932366f3666.jpeg	0921f0d7-730c-46bd-a2a9-c932366f3666.jpeg	image/jpeg	356180	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:24.239	2026-01-05 07:06:51.034
cmizrp9an000kjv04h7afprib	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356536338-18e3b878-IMG_9688.jpeg	IMG_9688.jpeg	image/jpeg	716439	1450	1482	\N	\N	\N	0	f	completed	\N	2025-12-10 08:48:56.399	2025-12-10 08:48:56.399
cmia5qlad000al7041tpkrw17	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992558-6bd19f0a-IMG-20251120-WA0199.jpg	IMG-20251120-WA0199.jpg	image/jpeg	295484	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.646	2026-01-05 07:16:20.011
cmizrpl4l000ljv04nxwchrk8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356551272-b0c58777-IMG_9694.jpeg	IMG_9694.jpeg	image/jpeg	333916	1294	1424	\N	\N	\N	0	f	failed	fetch failed	2025-12-10 08:49:11.411	2025-12-10 12:22:04.777
cmk231dbu000ll404j0jzab2h	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673291796-c0ed8761-Ring-5-11.jpg	Ring 5-11.jpg	image/jpeg	247350	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:21:31.963	2026-01-06 04:21:31.963
cmj2sletv0000le044f1f04zh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765539434521-990c43fa-IMG-20251208-WA0085.jpg	IMG-20251208-WA0085.jpg	image/jpeg	269817	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 11:37:14.891	2025-12-12 11:37:14.891
cmk2dw62i0000jl0544vu3oyl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767691524588-fa23625e-Ring-3-1.jpg	Ring 3 (1).jpg	image/jpeg	265834	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 09:25:25.051	2026-01-06 09:25:25.051
cmiwqnwt60000l1043tpob1nv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765173394928-26c7baf6-IMG_9171.jpeg	IMG_9171.jpeg	image/jpeg	771337	1330	2376	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 05:56:35.417	2026-01-07 14:33:27.485
cmj2slexi0001le046fvx7uko	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765539435125-e28ae347-IMG-20251208-WA0086.jpg	IMG-20251208-WA0086.jpg	image/jpeg	292936	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 11:37:15.222	2025-12-12 11:37:15.222
cmj2slezd0002le04pqeu01i4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765539435231-257e3c2b-IMG-20251208-WA0089.jpg	IMG-20251208-WA0089.jpg	image/jpeg	264532	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 11:37:15.29	2025-12-12 11:37:15.29
cmia5ql370007l704lml50v0k	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992312-a9d2279a-IMG-20251120-WA0197.jpg	IMG-20251120-WA0197.jpg	image/jpeg	292116	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.387	2025-12-31 07:31:54.512
cmia5ql0v0006l704bj1notli	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992222-888c8119-IMG-20251120-WA0202.jpg	IMG-20251120-WA0202.jpg	image/jpeg	291593	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.303	2025-12-31 07:34:04.363
cmia5ql590008l7046lc4s5dx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992396-53840176-IMG-20251120-WA0196.jpg	IMG-20251120-WA0196.jpg	image/jpeg	267664	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.461	2025-12-31 07:35:04.213
cmia5qkye0005l704mxaeq7vq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992132-312053ae-IMG-20251120-WA0201.jpg	IMG-20251120-WA0201.jpg	image/jpeg	278919	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.214	2025-12-31 07:35:36.299
cmia5qkvv0004l704g4lwzz5g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807992044-3b92f398-IMG-20251120-WA0195.jpg	IMG-20251120-WA0195.jpg	image/jpeg	226272	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:52.124	2025-12-31 07:36:06.32
cmizrldix0001jv04tjycz5x1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356355156-edcb0f4b-IMG_9638.jpeg	IMG_9638.jpeg	image/jpeg	690802	1399	1612	\N	\N	\N	0	f	failed	fetch failed	2025-12-10 08:45:55.257	2025-12-10 10:13:55.157
cmj2slf1n0003le04i1v82rv5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765539435298-e8c7d5e0-IMG-20251208-WA0088.jpg	IMG-20251208-WA0088.jpg	image/jpeg	243846	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 11:37:15.371	2025-12-12 11:37:15.371
cmj2slf3n0004le04loh58u1l	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765539435380-f9733f5c-IMG-20251208-WA0087.jpg	IMG-20251208-WA0087.jpg	image/jpeg	283669	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 11:37:15.444	2025-12-12 11:37:15.444
cmj6u8hhq0001i804jl39xxj4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784055841-549eacb3-IMG_9948.jpeg	IMG_9948.jpeg	image/jpeg	1692999	1879	2911	\N	\N	\N	0	f	completed	\N	2025-12-15 07:34:15.951	2025-12-15 07:34:15.951
cmj6u900w0002i8040bvp6kwv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784079589-31ba3e0f-IMG_9949.jpeg	IMG_9949.jpeg	image/jpeg	1559416	1815	2708	\N	\N	\N	0	f	completed	\N	2025-12-15 07:34:39.777	2025-12-15 07:34:39.777
cmj6u90440003i804xvk3o303	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784079991-77d3ac03-IMG_9956.jpeg	IMG_9956.jpeg	image/jpeg	1100073	1450	2203	\N	\N	\N	0	f	completed	\N	2025-12-15 07:34:40.085	2025-12-15 07:34:40.085
cmiwyqgi30000kv04xhkc9a3a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765186950569-33357baa-IMG_9197.jpeg	IMG_9197.jpeg	image/jpeg	2449126	4032	3024	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:42:31.026	2025-12-08 11:01:17.773
cmj6ubga9000ai804oh898pce	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784193841-d8fa6b36-IMG_9985.jpeg	IMG_9985.jpeg	image/jpeg	1833471	1944	2846	\N	\N	\N	0	f	completed	\N	2025-12-15 07:36:34.169	2025-12-15 07:36:34.169
cmj6u9fav0005i804oqec3buu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784099663-36af0ed8-IMG_9966.jpeg	IMG_9966.jpeg	image/jpeg	1593310	1953	2785	\N	\N	\N	0	f	completed	\N	2025-12-15 07:34:59.767	2025-12-15 07:34:59.767
cmj6u9vuy0006i80448dkmd5e	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784120827-0b41cc66-IMG_9972.jpeg	IMG_9972.jpeg	image/jpeg	1870889	2080	3191	\N	\N	\N	0	f	completed	\N	2025-12-15 07:35:21.029	2025-12-15 07:35:21.029
cmhiypnnz0000l4044cyiou4g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762163604577-457f018c-IMG_20251103_152254.jpg	IMG_20251103_152254.jpg	image/jpeg	67989	702	745	\N	\N	\N	0	f	completed	\N	2025-11-03 09:53:24.915	2025-11-03 09:53:24.915
cmiipqgwy000wlb04wic77vnu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325308635-00e4b031-IMG-20251128-WA0109.jpg	IMG-20251128-WA0109.jpg	image/jpeg	207298	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:21:48.707	2025-11-28 10:21:48.707
cmk0tkzm70000jo04j22yae8d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767596944640-2b0521ac-Green-studs.jpg	Green studs.jpg	image/jpeg	321335	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 07:09:04.975	2026-01-05 07:09:04.975
cmiippt77000tlb040zntcpxl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325277909-4fb88122-IMG-20251128-WA0112.jpg	IMG-20251128-WA0112.jpg	image/jpeg	209183	960	1280	\N	\N	\N	0	f	failed	fetch failed	2025-11-28 10:21:17.971	2026-01-02 12:22:10.417
cmk2343uf001fl504t4kztnkl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673419470-2e6ccb2b-Ring-5-12.jpg	Ring 5-12.jpg	image/jpeg	269498	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:23:39.64	2026-01-06 04:23:39.64
cmk2dzszb0001jl05xat41yge	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767691694484-86c2263b-Ring-1-1.jpg	Ring 1 (1).jpg	image/jpeg	262052	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 09:28:14.711	2026-01-06 09:28:14.711
cmk3y4g3v0009js04zbb2w2dg	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767785969643-add286b2-New-necklace.jpg	New necklace.jpg	image/jpeg	609366	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 11:39:29.804	2026-01-07 11:39:29.804
cmk3yakgd000ajs04yz32fdao	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767786254943-7f0d4116-Combo-2.jpg	Combo 2.jpg	image/jpeg	586234	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 11:44:15.158	2026-01-07 11:44:15.158
cmiipqh18000ylb041rh078w7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325308793-74ade7b8-IMG-20251128-WA0107.jpg	IMG-20251128-WA0107.jpg	image/jpeg	196160	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:21:48.86	2025-11-28 10:21:48.86
cmiipsgnc0014lb0454pfyw73	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325401382-98fb9aab-IMG-20251128-WA0100.jpg	IMG-20251128-WA0100.jpg	image/jpeg	148579	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:23:21.57	2025-11-28 10:23:21.57
cmj6u8hdp0000i804bsjf60iu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784055124-2a55a27d-IMG_9938.jpeg	IMG_9938.jpeg	image/jpeg	1752118	2053	2992	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:34:15.57	2026-01-07 14:34:02.374
cmj6u9vyb0007i804nmc3zoso	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784121249-4639b6ea-IMG_9977.jpeg	IMG_9977.jpeg	image/jpeg	1229557	1678	2360	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:35:21.347	2025-12-16 05:44:20.214
cmj6u9f7c0004i804xxd3j42f	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784099257-a1b18051-IMG_9958.jpeg	IMG_9958.jpeg	image/jpeg	1952696	2288	3031	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:34:59.408	2026-01-10 08:36:01.937
cmk0rt3e90001kt04o2ehektc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593963811-54add0ef-45c65f9c-a097-46bf-aa8c-4f02d87c6af0.jpeg	45c65f9c-a097-46bf-aa8c-4f02d87c6af0.jpeg	image/jpeg	319771	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:23.89	2026-01-05 07:11:13.94
cmk236vzd001ml804laqaywz5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673549261-cc1a9c77-Ring-5-13.jpg	Ring 5-13.jpg	image/jpeg	250798	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:25:49.417	2026-01-06 04:25:49.417
cmk2e3tos0000ld04v4brd13s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767691881627-b02e460e-Ring-2-1.jpg	Ring 2 (1).jpg	image/jpeg	243383	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 09:31:22.048	2026-01-06 09:31:22.048
cmisgmm94000dl7047muo55v9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914673814-ffa57ce9-78d468ea-0841-49cd-8638-d3053952b201.jpeg	78d468ea-0841-49cd-8638-d3053952b201.jpeg	image/jpeg	284630	983	1599	\N	\N	\N	0	f	failed	fetch failed	2025-12-05 06:04:34.023	2026-01-07 15:39:58.979
cmiwys5ps0002kz04iw5l2yjx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187030192-318c7d1d-IMG_9202.jpeg	IMG_9202.jpeg	image/jpeg	2992107	2540	3635	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:43:50.404	2025-12-08 11:04:04.677
cmiwyswng0005kz04e06eeoyc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187065325-b2aae379-IMG_9222.jpeg	IMG_9222.jpeg	image/jpeg	570073	2132	1397	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:25.421	2025-12-08 11:24:12.349
cmiwyswjv0004kz042dxsjzac	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187064830-6a4722ef-IMG_9220.jpeg	IMG_9220.jpeg	image/jpeg	546740	2241	1465	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:24.97	2025-12-08 11:24:11.88
cmiwyr2z60000kz049v28o3j4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765186979619-409a30e5-IMG_9199.jpeg	IMG_9199.jpeg	image/jpeg	3036127	4032	3024	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:43:00.124	2025-12-08 11:01:17.767
cmiwysgdx0003kz04ae7g3u5s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187044134-1411042c-IMG_9208.jpeg	IMG_9208.jpeg	image/jpeg	1493320	1470	3023	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:04.342	2025-12-08 11:04:04.693
cmjxxixv50000l504fg3vgf5d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767422168760-7ef6c55e-Bracelet-5.jpg	Bracelet 5.jpg	image/jpeg	273451	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-03 06:36:09.106	2026-01-03 06:36:09.106
cmk0ug77a0000jp04cyfx1oma	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767598400781-ee610aea-New-neckl-r.jpg	New neckl r.jpg	image/jpeg	524515	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 07:33:21.142	2026-01-05 07:33:21.142
cmk23bvrz000ml404rpcifcsc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673782281-d4fa3489-Ring-5-14.jpg	Ring 5-14.jpg	image/jpeg	237534	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:29:42.431	2026-01-06 04:29:42.431
cmk2ea4lu000ajl05jvroiwza	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767692175860-5d953be0-Ring-4-1.jpg	Ring 4 (1).jpg	image/jpeg	226035	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 09:36:16.124	2026-01-06 09:36:16.124
cmk4z97xd0000ld04z2lbhuiu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767848337920-51876360-Red-stone.jpg	Red stone.jpg	image/jpeg	511228	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 04:58:58.273	2026-01-08 04:58:58.273
cmiwyt9dz0008kz04nq0pm6dp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187081828-0bf7ac77-IMG_9230.jpeg	IMG_9230.jpeg	image/jpeg	680023	2406	1599	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:41.927	2025-12-08 11:24:12.385
cmjxxpqms0000ju04385gjhc4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767422485925-f9cbea32-Bracelet-4.jpg	Bracelet 4.jpg	image/jpeg	269878	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-03 06:41:26.352	2026-01-03 06:41:26.352
cmictb4ii0005l404pe5g8h08	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763968513627-f7b5da74-IMG_7606.jpeg	IMG_7606.jpeg	image/jpeg	524154	561	724	\N	\N	\N	0	f	completed	\N	2025-11-24 07:15:13.876	2025-11-24 07:15:13.876
cmk23frn4001ol504p2qtc3l1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673963316-e0a4ac36-Ring-5-15.jpg	Ring 5-15.jpg	image/jpeg	259511	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:32:43.487	2026-01-06 04:32:43.487
cmk2hhis70000jv04wukg1bhy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767697559550-3c587072-Mat-haram-red.jpg	Mat haram red.jpg	image/jpeg	517434	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 11:05:59.924	2026-01-06 11:05:59.924
cmk526dva0002kw04j5v461pk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767853244391-2e7282ac-8-5.jpg	8-5.jpg	image/jpeg	622955	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:20:44.854	2026-01-08 06:20:44.854
cmictb4lz0006l404dfxcruew	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763968514223-b222bbaa-IMG_7605.jpeg	IMG_7605.jpeg	image/jpeg	701510	567	833	\N	\N	\N	0	f	completed	\N	2025-11-24 07:15:14.327	2025-11-24 07:15:14.327
cmiwytomf000bkz04c36oyc8c	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187101585-0d884fb9-IMG_9237.jpeg	IMG_9237.jpeg	image/jpeg	689861	2295	1388	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:01.671	2025-12-08 10:57:58.534
cmiwytois000akz04w3izp98a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187101267-745751b6-IMG_9234.jpeg	IMG_9234.jpeg	image/jpeg	556140	2164	1414	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:01.438	2025-12-08 10:57:58.533
cmiwytop5000ckz044o4ikpx1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187101680-abdabdfa-IMG_9238.jpeg	IMG_9238.jpeg	image/jpeg	471229	1953	1357	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:01.769	2025-12-08 11:07:56.591
cmjxxuuhl0000lb04a8uducct	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767422724474-0f129bca-Bracelet-2.jpg	Bracelet 2.jpg	image/jpeg	301455	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-03 06:45:24.826	2026-01-03 06:45:24.826
cmk0yi0rt0000l504hk6tswl5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767605203919-3fa0712c-IMG_0996.jpeg	IMG_0996.jpeg	image/jpeg	1728541	2587	2862	\N	\N	\N	0	f	completed	\N	2026-01-05 09:26:44.373	2026-01-05 09:26:44.373
cmk0yi0vf0001l504vftxn8vw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767605204614-dc31d119-IMG_1003.jpeg	IMG_1003.jpeg	image/jpeg	1104873	1727	2268	\N	\N	\N	0	f	completed	\N	2026-01-05 09:26:44.716	2026-01-05 09:26:44.716
cmk240n92001xl504npkr9qx7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767674937558-49c3f2d2-Balaji-chain.jpg	Balaji chain.jpg	image/jpeg	422427	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:48:57.783	2026-01-06 04:48:57.783
cmk2hlib40000js040l0dlq06	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767697745473-5ac388dc-Mat-haram-green-1.jpg	Mat haram green  (1).jpg	image/jpeg	462447	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 11:09:05.95	2026-01-06 11:09:05.95
cmk52aqcd0008ii0452s2c2bt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767853447306-93315eb8-8-2.jpg	8-2.jpg	image/jpeg	612687	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:24:07.645	2026-01-08 06:24:07.645
cmiwyubr2000fkz04h4whrh7l	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187131409-8d77cc7b-IMG_9252.jpeg	IMG_9252.jpeg	image/jpeg	397495	2022	1111	\N	\N	\N	0	f	completed	\N	2025-12-08 09:45:31.538	2025-12-08 09:45:31.538
cmiwyubut000gkz047or7x283	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187131670-69f3876a-IMG_9257.jpeg	IMG_9257.jpeg	image/jpeg	400841	1823	977	\N	\N	\N	0	f	completed	\N	2025-12-08 09:45:31.782	2025-12-08 09:45:31.782
cmiwyv5y0000lkz04r5p4tom6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187170466-5cf57320-IMG_9281.jpeg	IMG_9281.jpeg	image/jpeg	2421349	2481	3573	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:46:10.654	2025-12-08 11:02:33.247
cmiwyutib000jkz04ohmbsctu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187154324-ab57ead2-IMG_9275.jpeg	IMG_9275.jpeg	image/jpeg	1363826	1444	3455	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:54.505	2025-12-08 10:58:31.011
cmiwyutll000kkz044g2nrsk1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187154683-7b782aa8-IMG_9277.jpeg	IMG_9277.jpeg	image/jpeg	2072538	2103	3525	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:54.777	2025-12-08 10:59:52.717
cmiwyv62r000mkz04rli7vevu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187170824-5b15f8e8-IMG_9283.jpeg	IMG_9283.jpeg	image/jpeg	1847772	1929	3339	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:46:10.948	2025-12-08 11:05:33.745
cmiwyubzg000ikz0483w1uqg7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187131875-a48ff511-IMG_9271.jpeg	IMG_9271.jpeg	image/jpeg	296781	1587	930	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:31.949	2025-12-08 10:43:22.036
cmiwyubx5000hkz040n1k860g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187131792-adb9fc17-IMG_9268.jpeg	IMG_9268.jpeg	image/jpeg	478312	2187	1215	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:31.865	2025-12-08 10:51:30.716
cmiwytos3000dkz04bcpio85t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187101779-f49c8f09-IMG_9242.jpeg	IMG_9242.jpeg	image/jpeg	409302	1976	1111	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:01.876	2025-12-08 11:07:56.481
cmiwytovc000ekz04yjcowljw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187101886-63fbd945-IMG_9247.jpeg	IMG_9247.jpeg	image/jpeg	458451	1969	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:45:01.992	2025-12-08 11:10:13.547
cmjxxy38j000hl50435f5b1nh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767422875927-111ad50d-Bracelet-1.jpg	Bracelet 1.jpg	image/jpeg	289824	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-03 06:47:56.132	2026-01-03 06:47:56.132
cmk0ypqew000al504cvlpt0b6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767605564248-299ede5e-Lakshmi-necklace.jpg	Lakshmi necklace.jpg	image/jpeg	526558	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 09:32:44.409	2026-01-05 09:32:44.409
cmk24e044001vl804dsbdi35c	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767675560810-004d24af-Jumka-1.jpg	Jumka 1.jpg	image/jpeg	343743	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:59:20.98	2026-01-06 04:59:20.98
cmk3haolt0000l804wuilkz0u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767757706806-8e7bef1c-2-in-1-necklace.jpg	2 in 1 necklace.jpg	image/jpeg	541298	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 03:48:27.282	2026-01-07 03:48:27.282
cmk52g7y9000hii042r14fxyw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767853703473-265e0a80-8-1.jpg	8-1.jpg	image/jpeg	669609	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:28:23.745	2026-01-08 06:28:23.745
cmiwyvizl000nkz04148n71lm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187187401-1966ffef-IMG_9284.jpeg	IMG_9284.jpeg	image/jpeg	1473875	2012	3228	\N	\N	\N	0	f	processing	fetch failed	2025-12-08 09:46:27.568	2025-12-08 10:39:09.292
cmizxc7b10008l804b00s2kks	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366004472-adb515a9-IMG_9629.jpeg	IMG_9629.jpeg	image/jpeg	601230	1468	1445	\N	\N	\N	0	f	completed	\N	2025-12-10 11:26:44.863	2025-12-10 11:26:44.863
cmiwyvj32000okz04ntem5jwn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187187708-dc4754f9-IMG_9287.jpeg	IMG_9287.jpeg	image/jpeg	1587760	2054	3612	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:46:27.806	2025-12-08 10:40:05.362
cmid2dbyq000hjr04s9s0rauc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763983733371-3271e394-IMG_20251123_175803.jpg	IMG_20251123_175803.jpg	image/jpeg	462148	960	1280	\N	\N	\N	0	f	failed	fetch failed	2025-11-24 11:28:53.612	2026-01-02 12:29:26.084
cmjxy5823000ql504dqncia00	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767423208516-21150780-Bracelet-3.jpg	Bracelet 3.jpg	image/jpeg	290172	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-03 06:53:28.683	2026-01-03 06:53:28.683
cmk10ffxo0000jr044rb9pvx5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767608443165-d7c79e07-Vaddanam-red.jpg	Vaddanam red.jpg	image/jpeg	545375	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 10:20:43.5	2026-01-05 10:20:43.5
cmk24mxae0008jw04rwiui7c8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767675976671-84b2c10e-Jumka-2.jpg	Jumka 2.jpg	image/jpeg	278937	3020	3234	\N	\N	\N	0	f	completed	\N	2026-01-06 05:06:17.012	2026-01-06 05:06:17.012
cmid2bbvq000gjr04kp1uqwqi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763983639871-115c1dcc-IMG_20251124_132049.jpg	IMG_20251124_132049.jpg	image/jpeg	774197	1152	2048	\N	\N	\N	0	f	completed	\N	2025-11-24 11:27:20.199	2025-11-24 11:27:20.199
cmk3i1g1q0000jv04vo6e0lnq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767758955521-cd7df486-7-1.jpg	7-1.jpg	image/jpeg	576809	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2026-01-07 04:09:15.903	2026-01-07 04:13:55.701
cmk52lle10000lb0436rqi8f4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767853953900-c444cf8f-8-3.jpg	8-3.jpg	image/jpeg	612023	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:32:34.241	2026-01-08 06:32:34.241
cmjjo5e6e0004l804mk7lbgsf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559893852-fc6cb3fb-IMG_0404.jpeg	IMG_0404.jpeg	image/jpeg	1234544	1859	2178	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 07:04:54.084	2026-01-08 10:51:33.533
cmhrssxze0000i904zn7hvv3y	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762697875712-4c98ab77-IMG-20251107-WA0125.jpg	IMG-20251107-WA0125.jpg	image/jpeg	1713393	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2025-11-09 14:17:56.132	2026-01-08 13:06:56.301
cmhrssy2r0001i904q7mv82ui	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762697876267-dfd17f1e-IMG-20251107-WA0131.jpg	IMG-20251107-WA0131.jpg	image/jpeg	1814828	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2025-11-09 14:17:56.356	2026-01-08 13:06:57.094
cmid2e72k000ijr04ofno5ukv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763983773794-5cce6c64-IMG-20251123-WA0017.jpg	IMG-20251123-WA0017.jpg	image/jpeg	48194	581	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:29:33.937	2025-11-24 11:29:33.937
cmjy3oio80000l804fp94s6up	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767432506966-38e4ce15-Bracelet-6-1.jpg	Bracelet 6 (1).jpg	image/jpeg	37578	828	1792	\N	\N	\N	0	f	completed	\N	2026-01-03 09:28:27.272	2026-01-03 09:28:27.272
cmk10o2jr0000gy04p3fjghjd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767608845529-48956f91-Vaddanam-gold.jpg	Vaddanam gold.jpg	image/jpeg	547775	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 10:27:25.841	2026-01-05 10:27:25.841
cmk250c9y000hjw04cq1f6qpn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767676603029-520d713d-Jumka-3.jpg	Jumka 3.jpg	image/jpeg	287823	3024	3560	\N	\N	\N	0	f	completed	\N	2026-01-06 05:16:43.174	2026-01-06 05:16:43.174
cmk3jrm490000jm044yo8ky1t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767761856057-96dd9c8a-Plain-green-belt.jpg	Plain green belt.jpg	image/jpeg	467473	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 04:57:36.442	2026-01-07 04:57:36.442
cmj6uboz4000ci804nkmzdhtf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784205458-0ee8bab3-IMG_9999.jpeg	IMG_9999.jpeg	image/jpeg	1400955	1878	2545	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:36:45.616	2026-01-07 14:34:57.309
cmk52ozxz000hlb04f61zz9db	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767854113061-02555178-8-4.jpg	8-4.jpg	image/jpeg	655932	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:35:13.271	2026-01-08 06:35:13.271
cmizxc7k2000bl804mdkleajq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366005221-6cc32d81-IMG_9619.jpeg	IMG_9619.jpeg	image/jpeg	930320	1777	1676	\N	\N	\N	0	f	completed	\N	2025-12-10 11:26:45.315	2025-12-10 11:26:45.315
cmizxcsx8000cl80482reyn0p	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366032725-8e077bd8-IMG_9613.jpeg	IMG_9613.jpeg	image/jpeg	706447	1573	1576	\N	\N	\N	0	f	completed	\N	2025-12-10 11:27:12.894	2025-12-10 11:27:12.894
cmid2faqc0000jy04uwnd5dli	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763983824787-5e9e1a11-IMG_20251123_180244.jpg	IMG_20251123_180244.jpg	image/jpeg	406082	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:30:25.198	2025-11-24 11:30:25.198
cmid2js7z0001jy04tin85e24	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763984034460-102bbfbe-IMG-20251122-WA0101.jpg	IMG-20251122-WA0101.jpg	image/jpeg	181195	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:33:54.628	2025-11-24 11:33:54.628
cmid2kh0a0002jy042p58tdcl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763984066528-eee92bb6-IMG-20251122-WA0100.jpg	IMG-20251122-WA0100.jpg	image/jpeg	161850	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:34:26.756	2025-11-24 11:34:26.756
cmizxct00000dl804fji1efq9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366033026-7bbeddbb-IMG_9609.jpeg	IMG_9609.jpeg	image/jpeg	501053	1265	1369	\N	\N	\N	0	f	completed	\N	2025-12-10 11:27:13.105	2025-12-10 11:27:13.105
cmiwyswpq0006kz048ivz5uaz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187065437-f92188d0-IMG_9224.jpeg	IMG_9224.jpeg	image/jpeg	423344	1784	1159	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:25.503	2025-12-08 11:24:11.862
cmizxct2o000el804nlwb37u9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366033131-e346a01c-IMG_9604.jpeg	IMG_9604.jpeg	image/jpeg	795748	1568	1441	\N	\N	\N	0	f	completed	\N	2025-12-10 11:27:13.2	2025-12-10 11:27:13.2
cmizxct52000fl8041jupg3hc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366033209-e72752d9-IMG_9602.jpeg	IMG_9602.jpeg	image/jpeg	666575	1474	1471	\N	\N	\N	0	f	failed	fetch failed	2025-12-10 11:27:13.286	2025-12-10 13:25:16.145
cmj6ubgdr000bi804ack8q4l6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784194378-f22f5be9-IMG_9995.jpeg	IMG_9995.jpeg	image/jpeg	1809812	1907	3119	\N	\N	\N	0	f	completed	\N	2025-12-15 07:36:34.479	2025-12-15 07:36:34.479
cmj2t40fi000ijr04omh4jo8q	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765540302590-c37a8a95-IMG-20251208-WA0094.jpg	IMG-20251208-WA0094.jpg	image/jpeg	374500	1200	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-12 11:51:42.894	2025-12-12 12:02:25.286
cmj2t4jbx000jjr04nkyx8bup	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765540327119-3638f8c8-IMG-20251208-WA0092.jpg	IMG-20251208-WA0092.jpg	image/jpeg	358773	1200	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-12 11:52:07.223	2025-12-12 12:02:25.289
cmid2pzha0003jy04ohv5jdvs	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763984323802-1a97d6d7-IMG-20251122-WA0102.jpg	IMG-20251122-WA0102.jpg	image/jpeg	168458	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:38:43.952	2025-11-24 11:38:43.952
cmk2618sv000ijw04eiwzgz8z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767678324503-c5ee9274-Krishna-necklace.jpg	Krishna necklace.jpg	image/jpeg	450614	2751	3366	\N	\N	\N	0	f	completed	\N	2026-01-06 05:45:24.731	2026-01-06 05:45:24.731
cmjcjgv5q000gl20429t1c67m	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128767595-180cf0c9-IMG_0276.jpeg	IMG_0276.jpeg	image/jpeg	219604	813	724	\N	\N	\N	0	f	failed	fetch failed	2025-12-19 07:19:28	2026-01-02 12:26:24.082
cmk10tcsh0008i604q8srr5wc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767609092302-c8411d42-Vaddanam-green.jpg	Vaddanam green.jpg	image/jpeg	576067	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 10:31:32.61	2026-01-05 10:31:32.61
cmk3n7pzm0000jl046nmvnss4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767767646460-2283d98a-Plain-red-belt.jpg	Plain red belt.jpg	image/jpeg	442812	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 06:34:06.802	2026-01-07 06:34:06.802
cmk52xvqo0000le04hbuml0q8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767854527397-e82b77f2-New-combo.jpg	New combo.jpg	image/jpeg	571047	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 06:42:07.729	2026-01-08 06:42:07.729
cmj87rz4w0000k404qpporsoc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765867265636-14a63129-IMG_0036.jpeg	IMG_0036.jpeg	image/jpeg	1556387	1888	2521	\N	\N	\N	0	f	failed	fetch failed	2025-12-16 06:41:06.038	2026-01-07 14:37:05.156
cmid2qln90004jy047uod0hep	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763984352573-95558f89-IMG-20251122-WA0103.jpg	IMG-20251122-WA0103.jpg	image/jpeg	166484	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:39:12.672	2025-11-24 11:39:12.672
cmj2t5itr000ale04m48y1xvv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765540372751-13519223-IMG-20251208-WA0093.jpg	IMG-20251208-WA0093.jpg	image/jpeg	298903	1200	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-12 11:52:53.122	2026-01-10 08:33:09.162
cmid2sm400005jy04h2zjp7um	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763984446410-f7d64f10-IMG-20251122-WA0104.jpg	IMG-20251122-WA0104.jpg	image/jpeg	164081	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-24 11:40:46.59	2025-11-24 11:40:46.59
cmiwyt9ai0007kz04jl0chiwu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187081562-2e09b657-IMG_9227.jpeg	IMG_9227.jpeg	image/jpeg	433458	1976	1096	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:41.694	2025-12-08 11:24:11.86
cmizxc7eg0009l804e5g48tp3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765366005021-b9f1d4c7-IMG_9627.jpeg	IMG_9627.jpeg	image/jpeg	687479	1709	1577	\N	\N	\N	0	f	failed	fetch failed	2025-12-10 11:26:45.113	2025-12-10 12:22:05.242
cmj6uaa9n0009i804occ0dp71	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784139789-4ae78467-IMG_9982.jpeg	IMG_9982.jpeg	image/jpeg	2085773	2137	3157	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:35:39.899	2025-12-15 08:21:53.844
cmj8b0vvv000rl204bbqxziza	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765872720625-dfde2190-IMG_0068.jpeg	IMG_0068.jpeg	image/jpeg	1337903	1844	2454	\N	\N	\N	0	f	completed	\N	2025-12-16 08:12:00.811	2025-12-16 08:12:00.811
cmjb3ulog0008jr04pmo9ehii	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766042068420-15a937db-IMG_0169.jpeg	IMG_0169.jpeg	image/jpeg	896912	1857	1414	\N	\N	\N	0	f	completed	\N	2025-12-18 07:14:28.789	2025-12-18 07:14:28.789
cmjb3ulrv0009jr04ifvvbz5x	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766042069090-72e33906-IMG_0170.jpeg	IMG_0170.jpeg	image/jpeg	495804	1241	1028	\N	\N	\N	0	f	completed	\N	2025-12-18 07:14:29.179	2025-12-18 07:14:29.179
cmjb3ulu8000ajr040ioy4m83	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766042069188-1de77643-IMG_0172.jpeg	IMG_0172.jpeg	image/jpeg	395350	1128	927	\N	\N	\N	0	f	completed	\N	2025-12-18 07:14:29.264	2025-12-18 07:14:29.264
cmjb3ulwg000bjr04na3t59t0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766042069273-15a1ffec-IMG_0180.jpeg	IMG_0180.jpeg	image/jpeg	560875	1363	1181	\N	\N	\N	0	f	completed	\N	2025-12-18 07:14:29.344	2025-12-18 07:14:29.344
cmjb6xwlz0004la047zbbt9lw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766047261973-0d89a60a-IMG_0244.jpeg	IMG_0244.jpeg	image/jpeg	292394	954	886	\N	\N	\N	0	f	completed	\N	2025-12-18 08:41:02.039	2025-12-18 08:41:02.039
cmjcgqfmg0000l704symu1ts7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766124175212-f2b11f3a-IMG_0246.jpeg	IMG_0246.jpeg	image/jpeg	643297	1466	1185	\N	\N	\N	0	f	completed	\N	2025-12-19 06:02:55.564	2025-12-19 06:02:55.564
cmjcgqfre0001l704vv3ymzst	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766124175803-59679a8c-IMG_0249.jpeg	IMG_0249.jpeg	image/jpeg	562515	1383	1168	\N	\N	\N	0	f	completed	\N	2025-12-19 06:02:55.946	2025-12-19 06:02:55.946
cmjcgqfu90002l704jfyf7aaq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766124175955-a5157f64-IMG_0250.jpeg	IMG_0250.jpeg	image/jpeg	573500	1483	1194	\N	\N	\N	0	f	completed	\N	2025-12-19 06:02:56.049	2025-12-19 06:02:56.049
cmjcgqfwt0003l704jyrjnjj4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766124176058-ab42db7e-IMG_0256.jpeg	IMG_0256.jpeg	image/jpeg	542571	1322	1150	\N	\N	\N	0	f	completed	\N	2025-12-19 06:02:56.141	2025-12-19 06:02:56.141
cmjchzwr80002ib0466x0hmnj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766126297410-22aa4078-IMG_0265.jpeg	IMG_0265.jpeg	image/jpeg	821630	1536	1550	\N	\N	\N	0	f	completed	\N	2025-12-19 06:38:17.493	2025-12-19 06:38:17.493
cmjchzwtb0003ib0437dc5986	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766126297502-13a5276f-IMG_0268.jpeg	IMG_0268.jpeg	image/jpeg	240538	779	790	\N	\N	\N	0	f	completed	\N	2025-12-19 06:38:17.568	2025-12-19 06:38:17.568
cmjchzwvm0004ib04ctn9j1cz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766126297577-0a9a2780-IMG_0270.jpeg	IMG_0270.jpeg	image/jpeg	290475	897	866	\N	\N	\N	0	f	completed	\N	2025-12-19 06:38:17.651	2025-12-19 06:38:17.651
cmjcjgv9v000hl204un8q9njt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128768224-a1561a9a-IMG_0279.jpeg	IMG_0279.jpeg	image/jpeg	480866	1124	1014	\N	\N	\N	0	f	completed	\N	2025-12-19 07:19:28.34	2025-12-19 07:19:28.34
cmjcjgvcg000il204be1hwr2z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128768350-2d11e2ca-IMG_0283.jpeg	IMG_0283.jpeg	image/jpeg	178843	742	626	\N	\N	\N	0	f	completed	\N	2025-12-19 07:19:28.433	2025-12-19 07:19:28.433
cmjcjgvek000jl204hi0nnoow	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128768442-3392f303-IMG_0289.jpeg	IMG_0289.jpeg	image/jpeg	248765	826	759	\N	\N	\N	0	f	completed	\N	2025-12-19 07:19:28.508	2025-12-19 07:19:28.508
cmk0q8pdu0000l4044regwo7v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767591332452-1f2283a5-Tikka-3.jpg	Tikka 3.jpg	image/jpeg	350295	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 05:35:32.795	2026-01-05 05:35:32.795
cmk11a5fl0000jr04tnesoajp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767609875920-6b70bc4a-Short-necklace-2-1.jpg	Short necklace 2 (1).jpg	image/jpeg	521146	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 10:44:36.226	2026-01-05 10:44:36.226
cmk297cvp0000l504ladnzz3b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767683648098-b4042792-White-harm.jpg	White harm.jpg	image/jpeg	548860	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:14:08.792	2026-01-06 07:14:08.792
cmjb4v8zb0000kw04ngsm722g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766043778337-e8835984-IMG_0191.jpeg	IMG_0191.jpeg	image/jpeg	521875	1321	1131	\N	\N	\N	0	f	completed	\N	2025-12-18 07:42:58.679	2025-12-18 07:42:58.679
cmj2tkfbd000cle04kr0fi2w0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765541068311-0278c70c-IMG-20251208-WA0095.jpg	IMG-20251208-WA0095.jpg	image/jpeg	358681	1200	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-12 12:04:28.519	2025-12-12 12:11:22.029
cmj886wcz0000le0497bbk16z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765867962316-a19d61d3-IMG_0045.jpeg	IMG_0045.jpeg	image/jpeg	1127783	1687	2226	\N	\N	\N	0	f	failed	fetch failed	2025-12-16 06:52:42.708	2026-01-10 08:37:16.084
cmj6yoptq0000lg04x9gmdrjn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765791531103-dbb82c6e-IMG_0005.jpeg	IMG_0005.jpeg	image/jpeg	2093095	2395	3027	\N	\N	\N	0	f	completed	\N	2025-12-15 09:38:51.516	2025-12-15 09:38:51.516
cmie5m1r50002l504ghh1ulxp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764049645093-6cf31ebc-IMG_7679.jpeg	IMG_7679.jpeg	image/jpeg	3167651	4032	3024	\N	\N	\N	0	f	completed	\N	2025-11-25 05:47:25.318	2025-11-25 05:47:25.318
cmie5mcmh0003l504ca3bwc75	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764049659253-87426ed1-IMG_7674.jpeg	IMG_7674.jpeg	image/jpeg	3239372	4032	3024	\N	\N	\N	0	f	completed	\N	2025-11-25 05:47:39.497	2025-11-25 05:47:39.497
cmie5n8ds0004l504l3u4x2mm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764049700297-f4971102-IMG_7666.jpeg	IMG_7666.jpeg	image/jpeg	2379214	4032	3024	\N	\N	\N	0	f	completed	\N	2025-11-25 05:48:20.569	2025-11-25 05:48:20.569
cmj6yoxp30001lg04gq6avcwo	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765791541723-a54c7862-IMG_0014.jpeg	IMG_0014.jpeg	image/jpeg	1799172	2083	2673	\N	\N	\N	0	f	completed	\N	2025-12-15 09:39:01.912	2025-12-15 09:39:01.912
cmj6yp9h90002lg04wlymuhpn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765791556770-cf5fcbb2-IMG_0021.jpeg	IMG_0021.jpeg	image/jpeg	1786800	2125	2742	\N	\N	\N	0	f	completed	\N	2025-12-15 09:39:16.986	2025-12-15 09:39:16.986
cmj6ypjap0003lg04l7a7i5uk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765791569748-10fb2523-IMG_0023.jpeg	IMG_0023.jpeg	image/jpeg	1970447	2082	2875	\N	\N	\N	0	f	completed	\N	2025-12-15 09:39:29.905	2025-12-15 09:39:29.905
cmiwyt9gc0009kz041iub0u4y	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187081937-07e081d5-IMG_9231.jpeg	IMG_9231.jpeg	image/jpeg	493623	1984	1449	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:44:42.013	2025-12-08 11:24:12.36
cmj104yks0000l204vqd0wz6n	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765431171531-269a8c89-IMG_9322.jpeg	IMG_9322.jpeg	image/jpeg	3296639	4032	3024	\N	\N	\N	0	f	completed	\N	2025-12-11 05:32:51.973	2025-12-11 05:32:51.973
cmj105xxe0001l204i8urbrml	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765431217519-88ffa322-IMG_9315.jpeg	IMG_9315.jpeg	image/jpeg	2614087	4032	3024	\N	\N	\N	0	f	completed	\N	2025-12-11 05:33:37.812	2025-12-11 05:33:37.812
cmj2tkff2000dle041qwfe29f	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765541068722-0660e3b5-IMG-20251208-WA0097.jpg	IMG-20251208-WA0097.jpg	image/jpeg	404743	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 12:04:28.814	2025-12-12 12:04:28.814
cmj2tkfhj000ele04wd2ivawf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765541068824-0d33565f-IMG-20251208-WA0096.jpg	IMG-20251208-WA0096.jpg	image/jpeg	418027	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 12:04:28.903	2025-12-12 12:04:28.903
cmj9rnv2l0005l704kmq8z2fc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961132942-e7160f19-IMG_0111.jpeg	IMG_0111.jpeg	image/jpeg	999536	1672	1853	\N	\N	\N	0	f	completed	\N	2025-12-17 08:45:33.069	2025-12-17 08:45:33.069
cmj9rodh70007l704bufi2rr6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961156861-b4b70d6c-IMG_0127.jpeg	IMG_0127.jpeg	image/jpeg	529475	1434	1374	\N	\N	\N	0	f	completed	\N	2025-12-17 08:45:56.924	2025-12-17 08:45:56.924
cmj9roomr0008l7047zk8anq3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961171249-3ea1fa4c-IMG_0131.jpeg	IMG_0131.jpeg	image/jpeg	746994	1571	1549	\N	\N	\N	0	f	completed	\N	2025-12-17 08:46:11.379	2025-12-17 08:46:11.379
cmj9rmtos0001l7047yuq5m6y	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961084502-faf60e75-IMG_0091.jpeg	IMG_0091.jpeg	image/jpeg	1257033	1980	2037	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:44:44.62	2025-12-17 09:58:27.34
cmjb4v92p0001kw04bf988lbh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766043778904-5496e6ca-IMG_0194.jpeg	IMG_0194.jpeg	image/jpeg	564780	1327	1198	\N	\N	\N	0	f	completed	\N	2025-12-18 07:42:58.994	2025-12-18 07:42:58.994
cmj9rnuyh0004l704u1ztqwh8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961132612-756c305c-IMG_0108.jpeg	IMG_0108.jpeg	image/jpeg	902572	1652	1681	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:45:32.736	2025-12-17 09:54:30.474
cmj9rmtky0000l704267qhn0q	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961083827-11c67af2-IMG_0088.jpeg	IMG_0088.jpeg	image/jpeg	1132487	1879	1955	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:44:44.203	2025-12-17 09:55:04.644
cmj9rnd010003l704bbctzj4t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961109573-fe951b65-IMG_0098.jpeg	IMG_0098.jpeg	image/jpeg	526331	1408	1486	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:45:09.649	2025-12-17 09:56:03.232
cmj9rodew0006l704fefqz0x4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961156514-7ea604b6-IMG_0124.jpeg	IMG_0124.jpeg	image/jpeg	668142	1503	1408	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:45:56.644	2025-12-17 10:14:03.428
cmj9rncxe0002l704s1qdbpjz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961109246-c860854b-IMG_0092.jpeg	IMG_0092.jpeg	image/jpeg	840858	1702	1793	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 08:45:09.357	2025-12-17 10:17:11.868
cmjb4v94w0002kw04grbmvz1n	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766043779004-4cd4a4a1-IMG_0195.jpeg	IMG_0195.jpeg	image/jpeg	605546	1513	1231	\N	\N	\N	0	f	completed	\N	2025-12-18 07:42:59.073	2025-12-18 07:42:59.073
cmjb4v97f0003kw04gjxxwwyd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766043779085-f86c98f4-IMG_0201.jpeg	IMG_0201.jpeg	image/jpeg	839269	1727	1419	\N	\N	\N	0	f	completed	\N	2025-12-18 07:42:59.163	2025-12-18 07:42:59.163
cmk29gj2i0000l804lhp4d0uh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767684076259-24830906-Multi-garam-1.jpg	Multi garam (1).jpg	image/jpeg	598116	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:21:16.654	2026-01-06 07:21:16.654
cmi1tv9wp0009k0040lvf65d0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304325899-9495874a-IMG-20251114-WA0225.jpg	IMG-20251114-WA0225.jpg	image/jpeg	1167318	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2025-11-16 14:45:26.178	2026-01-02 12:15:18.835
cmj10iebr0000l7044n1u1zn6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765431798497-f8def531-IMG_9709.jpeg	IMG_9709.jpeg	image/jpeg	3508696	4032	3024	\N	\N	\N	0	f	completed	\N	2025-12-11 05:43:18.928	2025-12-11 05:43:18.928
cmk0qvnys0000li048x35pvg1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767592403734-553830ad-Tikka-2.jpg	Tikka 2.jpg	image/jpeg	502571	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 05:53:24.037	2026-01-05 05:53:24.037
cmk53zvp90003kw04dsce1nvt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767856300358-23074f7e-Cz-neck-1.jpg	Cz neck-1.jpg	image/jpeg	549698	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 07:11:40.606	2026-01-08 07:11:40.606
cmj10j1pm0001l704squkft55	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765431828911-8aec4bc5-IMG_9701.jpeg	IMG_9701.jpeg	image/jpeg	3651316	4032	3024	\N	\N	\N	0	f	completed	\N	2025-12-11 05:43:49.215	2025-12-11 05:43:49.215
cmj10jelw0002l704pagisk6g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765431845746-4bcb1b9c-IMG_9696.jpeg	IMG_9696.jpeg	image/jpeg	3130937	4032	3024	\N	\N	\N	0	f	completed	\N	2025-12-11 05:44:05.965	2025-12-11 05:44:05.965
cmhw3cbm00002ju04p379pgq9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762957441130-07a4dd36-IMG-20251112-WA0164.jpg	IMG-20251112-WA0164.jpg	image/jpeg	1159767	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 14:24:01.225	2025-11-12 14:24:01.225
cmhw3dp190003ju04kwvkorpz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762957504808-0cbb3e04-IMG-20251112-WA0162.jpg	IMG-20251112-WA0162.jpg	image/jpeg	1163244	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 14:25:05.139	2025-11-12 14:25:05.139
cmhw3dp4l0004ju043l49nmau	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762957505309-8d130dbc-IMG-20251112-WA0154.jpg	IMG-20251112-WA0154.jpg	image/jpeg	1066490	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 14:25:05.398	2025-11-12 14:25:05.398
cmjjqdzjd0000js043vp27bzx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563653855-45febb20-IMG_0428.jpeg	IMG_0428.jpeg	image/jpeg	783703	1341	1839	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 08:07:34.214	2026-01-07 06:36:02.389
cmhw4pcms000gky04444baxih	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762959728202-ffc5e2ca-IMG-20251112-WA0199.jpg	IMG-20251112-WA0199.jpg	image/jpeg	1642788	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 15:02:08.567	2025-11-12 15:02:08.567
cmhw4qc31000hky048fxegcmm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762959774254-09d24daf-IMG-20251112-WA0158.jpg	IMG-20251112-WA0158.jpg	image/jpeg	1588484	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 15:02:54.52	2025-11-12 15:02:54.52
cmhw4qxpn0008l804mqp88465	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1762959802227-32b3a6a9-IMG-20251112-WA0160.jpg	IMG-20251112-WA0160.jpg	image/jpeg	1568249	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-12 15:03:22.533	2025-11-12 15:03:22.533
cmi1tpm5o0000k004snfkdsc4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304061752-4c7e7130-IMG-20251114-WA0209.jpg	IMG-20251114-WA0209.jpg	image/jpeg	1651781	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:41:02.201	2025-11-16 14:41:02.201
cmi1tq0m30001k0041y29z6nf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304080766-7849a4d8-IMG-20251114-WA0211.jpg	IMG-20251114-WA0211.jpg	image/jpeg	1341212	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:41:20.945	2025-11-16 14:41:20.945
cmi1tqblq0002k004i17dlm0y	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304095124-bdda8e85-IMG-20251114-WA0213.jpg	IMG-20251114-WA0213.jpg	image/jpeg	1566774	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:41:35.295	2025-11-16 14:41:35.295
cmi1tnko10000lb04a5g1xft7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763303966395-c819cfa2-IMG-20251114-WA0207.jpg	IMG-20251114-WA0207.jpg	image/jpeg	1548704	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2025-11-16 14:39:26.903	2026-01-07 14:29:20.554
cmi1ts7tt0005k004e48sb3h2	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304183449-3a43628f-IMG-20251114-WA0219.jpg	IMG-20251114-WA0219.jpg	image/jpeg	1098324	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:43:03.609	2025-11-16 14:43:03.609
cmiwyrsc00001kz04p9y29grq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765187012765-d22306c4-IMG_9207.jpeg	IMG_9207.jpeg	image/jpeg	1445499	1621	2843	\N	\N	\N	0	f	failed	fetch failed	2025-12-08 09:43:33.055	2025-12-08 11:04:04.702
cmi1tudb00008k004vg7i8qmm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304283948-7599dbac-IMG-20251114-WA0223.jpg	IMG-20251114-WA0223.jpg	image/jpeg	1107125	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:44:44.124	2025-11-16 14:44:44.124
cmi1tw73m000ak004mrltb80d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304369007-44d86935-IMG-20251114-WA0205.jpg	IMG-20251114-WA0205.jpg	image/jpeg	1026004	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:46:09.277	2025-11-16 14:46:09.277
cmi1txldm000bk00427yv3akq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304434190-a711eea7-IMG-20251114-WA0162.jpg	IMG-20251114-WA0162.jpg	image/jpeg	1265660	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:47:14.441	2025-11-16 14:47:14.441
cmi1tybz2000ck0044efvpqu5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304468667-ec1fa475-IMG-20251114-WA0164.jpg	IMG-20251114-WA0164.jpg	image/jpeg	1389157	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:47:48.897	2025-11-16 14:47:48.897
cmj6uaa0s0008i804nq4l37cm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765784139157-82a2d65c-IMG_9981.jpeg	IMG_9981.jpeg	image/jpeg	1584304	1813	2772	\N	\N	\N	0	f	failed	fetch failed	2025-12-15 07:35:39.385	2025-12-16 05:44:20.355
cmj88ze3y0008l204jonvyaf9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765869291419-bd512286-IMG_0050.jpeg	IMG_0050.jpeg	image/jpeg	1577357	1855	2552	\N	\N	\N	0	f	completed	\N	2025-12-16 07:14:51.889	2025-12-16 07:14:51.889
cmj9rv82z0009l7048lf1v8gh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765961476150-a6b82b9d-IMG_0119.jpeg	IMG_0119.jpeg	image/jpeg	475742	1424	1231	\N	\N	\N	0	f	completed	\N	2025-12-17 08:51:16.318	2025-12-17 08:51:16.318
cmjb4v99z0004kw049m4u1ebl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766043779173-d48802ea-IMG_0204.jpeg	IMG_0204.jpeg	image/jpeg	673759	1636	1266	\N	\N	\N	0	f	completed	\N	2025-12-18 07:42:59.255	2025-12-18 07:42:59.255
cmi1tyu3m000dk004mv2d6b5b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763304492244-4ff4ab2e-IMG-20251114-WA0160.jpg	IMG-20251114-WA0160.jpg	image/jpeg	1176730	3024	4032	\N	\N	\N	0	f	completed	\N	2025-11-16 14:48:12.412	2025-11-16 14:48:12.412
cmi470rbs0000jp04q38ro8h8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763447349157-b2133070-IMG-20251117-WA0187.jpg	IMG-20251117-WA0187.jpg	image/jpeg	536440	2092	1582	\N	\N	\N	0	f	completed	\N	2025-11-18 06:29:09.484	2025-11-18 06:29:09.484
cmi71lboy0000jr04kcigbr03	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763619629376-3bdcffb6-20251119_175833-COLLAGE.jpg	20251119_175833-COLLAGE.jpg	image/jpeg	1612331	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:20:29.824	2025-11-20 06:20:29.824
cmi71m5zg0001jr042xphjwp0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763619668811-f3f8d3b2-20251119_175928-COLLAGE.jpg	20251119_175928-COLLAGE.jpg	image/jpeg	1450160	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:21:09.079	2025-11-20 06:21:09.079
cmi71m62l0002jr043rcjmgpp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763619669212-6f453189-20251119_180034-COLLAGE.jpg	20251119_180034-COLLAGE.jpg	image/jpeg	1341695	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:21:09.31	2025-11-20 06:21:09.31
cmi71s7x50003jr04dkj2vat0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763619951182-1892b702-20251119_180114-COLLAGE.jpg	20251119_180114-COLLAGE.jpg	image/jpeg	1452649	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:25:51.42	2025-11-20 06:25:51.42
cmi71t0fb0004jr04q9e54sde	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763619988243-cf88dec8-20251119_180143-COLLAGE.jpg	20251119_180143-COLLAGE.jpg	image/jpeg	1529991	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:26:28.484	2025-11-20 06:26:28.484
cmi71tk730005jr04rmmbp18d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763620013935-e5e1cdfd-20251119_180205-COLLAGE.jpg	20251119_180205-COLLAGE.jpg	image/jpeg	1443802	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:26:54.107	2025-11-20 06:26:54.107
cmi71wox90006jr04ezc78vl8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763620159954-b8b751c8-20251119_180221-COLLAGE.jpg	20251119_180221-COLLAGE.jpg	image/jpeg	1398818	3196	2400	\N	\N	\N	0	f	completed	\N	2025-11-20 06:29:20.199	2025-11-20 06:29:20.199
cmi472teg0001jp04lcl1a36d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763447445073-d808e114-IMG-20251117-WA0196.jpg	IMG-20251117-WA0196.jpg	image/jpeg	514443	1576	2100	\N	\N	\N	0	f	failed	fetch failed	2025-11-18 06:30:45.253	2026-01-03 13:20:12.025
cmk0r9tzy0008l8044ajlxk0u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593064700-98d2deda-Tikka-1-1.jpg	Tikka 1 (1).jpg	image/jpeg	503274	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 06:04:25.011	2026-01-05 06:04:25.011
cmiy9vkdb0001ld0420tj9f38	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266131127-22222385-IMG_9386.jpeg	IMG_9386.jpeg	image/jpeg	2124118	2709	2343	\N	\N	\N	0	f	completed	\N	2025-12-09 07:42:11.31	2025-12-09 07:42:11.31
cmk29jsds000gjo04ikiy0392	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767684228615-7509e93e-White-chain.jpg	White chain.jpg	image/jpeg	403162	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:23:48.977	2026-01-06 07:23:48.977
cmk220xm30008l804jwefkkkt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767671591688-fb2ad8ed-Ring-5-1.jpg	Ring 5-1.jpg	image/jpeg	249721	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 03:53:11.98	2026-01-06 03:53:11.98
cmi4769fa0000jm04793g9cew	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763447605956-8d156e93-IMG-20251117-WA0189.jpg	IMG-20251117-WA0189.jpg	image/jpeg	401646	1576	2100	\N	\N	\N	0	f	processing	\N	2025-11-18 06:33:26.326	2025-11-28 08:50:06.964
cmi473xvh0002jp04y3o4dyec	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763447497780-5a61576d-IMG-20251117-WA0192.jpg	IMG-20251117-WA0192.jpg	image/jpeg	485301	1576	2100	\N	\N	\N	0	f	processing	\N	2025-11-18 06:31:37.942	2025-11-28 08:50:06.964
cmiy9vyhm0002ld04o82shj0j	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266149443-306d2b3d-IMG_9390.jpeg	IMG_9390.jpeg	image/jpeg	2466935	2676	2819	\N	\N	\N	0	f	completed	\N	2025-12-09 07:42:29.612	2025-12-09 07:42:29.612
cmiy9wfqo0004ld04uxp6wfer	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266171809-9145d992-IMG_9401.jpeg	IMG_9401.jpeg	image/jpeg	2052541	2690	2229	\N	\N	\N	0	f	completed	\N	2025-12-09 07:42:51.974	2025-12-09 07:42:51.974
cmiy9x9470005ld04popz74xp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266209770-38ddaeee-IMG_9402.jpeg	IMG_9402.jpeg	image/jpeg	1897494	2594	2252	\N	\N	\N	0	f	completed	\N	2025-12-09 07:43:30.033	2025-12-09 07:43:30.033
cmk3o4e200000lc04bivpwie4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767769170672-4b0a9a1c-7-2.jpg	7-2.jpg	image/jpeg	504332	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 06:59:30.984	2026-01-07 06:59:30.984
cmiy9xun90007ld045qjuromg	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266237738-937a5c01-IMG_9410.jpeg	IMG_9410.jpeg	image/jpeg	2181162	2801	2360	\N	\N	\N	0	f	completed	\N	2025-12-09 07:43:57.943	2025-12-09 07:43:57.943
cmiy9y4r80008ld04f2eb1xgh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266250997-aaee7449-IMG_9416.jpeg	IMG_9416.jpeg	image/jpeg	1784698	2460	2122	\N	\N	\N	0	f	completed	\N	2025-12-09 07:44:11.157	2025-12-09 07:44:11.157
cmk5crq4e0000jq04mw42cefd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767871036351-2f49b391-Diamond-necklace.jpg	Diamond necklace.jpg	image/jpeg	438446	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-08 11:17:16.671	2026-01-08 11:17:16.671
cmiy9w7470003ld0421s65ahz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266160738-0edc6c25-IMG_9391.jpeg	IMG_9391.jpeg	image/jpeg	2159949	2775	2557	\N	\N	\N	0	f	failed	fetch failed	2025-12-09 07:42:40.904	2025-12-09 13:39:36.758
cmiy9v1y60000ld04zoarfw2w	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266107001-1e7933fb-IMG_9380.jpeg	IMG_9380.jpeg	image/jpeg	2664030	2855	2955	\N	\N	\N	0	f	failed	fetch failed	2025-12-09 07:41:47.413	2025-12-09 13:39:38.866
cmj15mfyw0000lb04uw5kifgn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440384214-75e993ba-IMG_9774.jpeg	IMG_9774.jpeg	image/jpeg	897314	1705	1857	\N	\N	\N	0	f	completed	\N	2025-12-11 08:06:24.714	2025-12-11 08:06:24.714
cmj15mg400001lb04vkl2v904	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440385902-74c02939-IMG_9786.jpeg	IMG_9786.jpeg	image/jpeg	1302763	2299	2211	\N	\N	\N	0	f	completed	\N	2025-12-11 08:06:26.064	2025-12-11 08:06:26.064
cmj15mte00002lb046hk012zk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440402952-99a6f71e-IMG_9794.jpeg	IMG_9794.jpeg	image/jpeg	1526072	2314	2352	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 08:06:43.146	2025-12-11 10:49:35.965
cmj15n4620004lb04e7ib4p0f	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440417076-1fb4ffd7-IMG_9799.jpeg	IMG_9799.jpeg	image/jpeg	1113509	2072	2036	\N	\N	\N	0	f	completed	\N	2025-12-11 08:06:57.242	2025-12-11 08:06:57.242
cmj15mtic0003lb04t6undp6v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440403292-7753d108-IMG_9791.jpeg	IMG_9791.jpeg	image/jpeg	1437179	2199	2467	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 08:06:43.428	2025-12-11 10:49:35.962
cmiegw7uu0004jp04bnf5b100	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764068595374-8d9d5083-IMG_7743.jpeg	IMG_7743.jpeg	image/jpeg	2358284	2510	3115	\N	\N	\N	0	f	failed	fetch failed	2025-11-25 11:03:15.565	2026-01-07 14:40:04.988
cmiya0x7g000ald04ty80soqp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266380827-806eb45e-IMG_9419.jpeg	IMG_9419.jpeg	image/jpeg	2158022	2675	2468	\N	\N	\N	0	f	completed	\N	2025-12-09 07:46:21.084	2025-12-09 07:46:21.084
cmia5qkr00002l7041fz3xej6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807991890-5a4dd640-IMG-20251120-WA0193.jpg	IMG-20251120-WA0193.jpg	image/jpeg	274719	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:51.948	2026-01-02 12:42:56.116
cmk226bmz0001l40476ez6l4l	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767671843273-e5e4f0ce-Ring-5-16-1.jpg	Ring 5-16 (1).jpg	image/jpeg	267587	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 03:57:23.435	2026-01-06 03:57:23.435
cmiya1djf000bld043wars1fo	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266402246-d2869aca-IMG_9425.jpeg	IMG_9425.jpeg	image/jpeg	1994689	2510	2434	\N	\N	\N	0	f	completed	\N	2025-12-09 07:46:42.402	2025-12-09 07:46:42.402
cmiya1mkf000cld04g7mknj36	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266414067-b2dd50d6-IMG_9431.jpeg	IMG_9431.jpeg	image/jpeg	1710651	2398	2259	\N	\N	\N	0	f	completed	\N	2025-12-09 07:46:54.207	2025-12-09 07:46:54.207
cmiya2pdq000eld04ubb8yios	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266464419-edfb642f-IMG_9437.jpeg	IMG_9437.jpeg	image/jpeg	1213525	2264	1656	\N	\N	\N	0	f	completed	\N	2025-12-09 07:47:44.51	2025-12-09 07:47:44.51
cmk29ni9w0001l504a19mqnpx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767684402134-028430cd-Pink-chain.jpg	Pink chain.jpg	image/jpeg	423096	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:26:42.5	2026-01-06 07:26:42.5
cmk3oe5ok0001lc04ynsn4b7e	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767769626527-3d6fdf0e-7-3.jpg	7-3.jpg	image/jpeg	499858	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 07:07:06.693	2026-01-07 07:07:06.693
cmiya344y000fld04c0s4duwv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266483343-9c83a73e-IMG_9441.jpeg	IMG_9441.jpeg	image/jpeg	1435461	2429	1780	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:03.516	2025-12-09 07:48:03.516
cmiya348i000gld04cmbxufy4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266483655-457967bf-IMG_9445.jpeg	IMG_9445.jpeg	image/jpeg	1388832	2326	1899	\N	\N	\N	0	f	failed	fetch failed	2025-12-09 07:48:03.762	2025-12-09 12:35:59.044
cmiya2pag000dld048bi9jdim	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266463962-4d372d49-IMG_9435.jpeg	IMG_9435.jpeg	image/jpeg	1418369	2429	1740	\N	\N	\N	0	f	failed	fetch failed	2025-12-09 07:47:44.272	2025-12-09 08:48:00.601
cmiegunat0000jp04fogwzazr	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764068521833-fed2ee13-IMG_7730.jpeg	IMG_7730.jpeg	image/jpeg	1994618	2563	2731	\N	\N	\N	0	f	completed	\N	2025-11-25 11:02:02.255	2025-11-25 11:02:02.255
cmiya3fhq000ild04j81x77ep	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266498273-c4bcab8e-IMG_9451.jpeg	IMG_9451.jpeg	image/jpeg	2230843	2245	3403	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:18.35	2025-12-09 07:48:18.35
cmiegv87z0002jp04r2texy5a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764068549152-a8bf00ce-IMG_7736.jpeg	IMG_7736.jpeg	image/jpeg	2846736	2951	3587	\N	\N	\N	0	f	completed	\N	2025-11-25 11:02:29.382	2025-11-25 11:02:29.382
cmiya3sya000jld04fh2qutqf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266515492-fb45c404-IMG_9454.jpeg	IMG_9454.jpeg	image/jpeg	1838932	2119	2749	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:35.687	2025-12-09 07:48:35.687
cmiya3t0x000kld04ptqyiy8g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266515816-8c2a59a4-IMG_9456.jpeg	IMG_9456.jpeg	image/jpeg	1976120	2232	2947	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:35.889	2025-12-09 07:48:35.889
cmiya43fn000lld04r43zzsoz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266529230-bfbdd073-IMG_9459.jpeg	IMG_9459.jpeg	image/jpeg	1745521	1980	2855	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:49.379	2025-12-09 07:48:49.379
cmiya43m9000mld04cpxjk15z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266529532-495c9619-IMG_9461.jpeg	IMG_9461.jpeg	image/jpeg	1564862	1890	2618	\N	\N	\N	0	f	completed	\N	2025-12-09 07:48:49.618	2025-12-09 07:48:49.618
cmiegunew0001jp04bcbwi9i0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764068522384-05f1e208-IMG_7733.jpeg	IMG_7733.jpeg	image/jpeg	1913765	2096	2841	\N	\N	\N	0	f	failed	fetch failed	2025-11-25 11:02:02.504	2026-01-07 14:40:28.948
cmiya3fc4000hld04w7k7a23n	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266497962-e78ab7d4-IMG_9449.jpeg	IMG_9449.jpeg	image/jpeg	2216910	2229	3099	\N	\N	\N	0	f	failed	fetch failed	2025-12-09 07:48:18.148	2025-12-09 13:32:15.692
cmia5qkp40001l704hjxgvo7u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1763807991775-42ad66dd-IMG-20251120-WA0194.jpg	IMG-20251120-WA0194.jpg	image/jpeg	214198	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-11-22 10:39:51.88	2025-12-31 07:38:50.348
cmiiprh890010lb048a2bisg4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325355655-08d853e1-IMG-20251128-WA0105.jpg	IMG-20251128-WA0105.jpg	image/jpeg	198658	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:22:35.769	2025-11-28 10:22:35.769
cmiiprha30011lb04stzrrjz3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325355778-a4adc79d-IMG-20251128-WA0104.jpg	IMG-20251128-WA0104.jpg	image/jpeg	191016	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:22:35.835	2025-11-28 10:22:35.835
cmiiprheo0013lb04j6708i3q	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325355917-973d7a51-IMG-20251128-WA0102.jpg	IMG-20251128-WA0102.jpg	image/jpeg	150293	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:22:36	2025-11-28 10:22:36
cmiya4l7o000old04w2069vh9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266552329-11d4d769-IMG_9469.jpeg	IMG_9469.jpeg	image/jpeg	1804640	2157	2766	\N	\N	\N	0	f	completed	\N	2025-12-09 07:49:12.421	2025-12-09 07:49:12.421
cmiya4uyd000pld04dl8x3h1v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765266564853-07cfbf83-IMG_9470.jpeg	IMG_9470.jpeg	image/jpeg	1945769	2275	2847	\N	\N	\N	0	f	completed	\N	2025-12-09 07:49:25.046	2025-12-09 07:49:25.046
cmj15n4cb0005lb04b9ftjfo2	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440417377-524cb792-IMG_9806.jpeg	IMG_9806.jpeg	image/jpeg	1031953	2107	1937	\N	\N	\N	0	f	completed	\N	2025-12-11 08:06:57.467	2025-12-11 08:06:57.467
cmj15ng9g0006lb04016aub06	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440432589-7d4f06b4-IMG_9810.jpeg	IMG_9810.jpeg	image/jpeg	1162009	1993	2099	\N	\N	\N	0	f	completed	\N	2025-12-11 08:07:12.805	2025-12-11 08:07:12.805
cmj15ngco0007lb04anxazpix	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440432937-6f65bce7-IMG_9813.jpeg	IMG_9813.jpeg	image/jpeg	1441591	2106	2322	\N	\N	\N	0	f	completed	\N	2025-12-11 08:07:13.032	2025-12-11 08:07:13.032
cmj15ngfd0008lb04nui4gmgj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440433041-efbc2943-IMG_9816.jpeg	IMG_9816.jpeg	image/jpeg	1130034	2079	2097	\N	\N	\N	0	f	completed	\N	2025-12-11 08:07:13.13	2025-12-11 08:07:13.13
cmiiptl4l001blb04ym9zem16	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325454045-b91feb47-IMG-20251128-WA0097.jpg	IMG-20251128-WA0097.jpg	image/jpeg	166555	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:14.134	2025-11-28 10:24:14.134
cmiiptl79001clb04eim79pvg	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325454143-937fd26f-IMG-20251128-WA0096.jpg	IMG-20251128-WA0096.jpg	image/jpeg	164557	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:14.229	2025-11-28 10:24:14.229
cmiiptl9m001dlb04hpjc7m5m	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325454241-60815479-IMG-20251128-WA0095.jpg	IMG-20251128-WA0095.jpg	image/jpeg	176242	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:14.314	2025-11-28 10:24:14.314
cmiipucvr001elb04plfbybdf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325489811-3c05a746-IMG-20251128-WA0088.jpg	IMG-20251128-WA0088.jpg	image/jpeg	181426	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:50.006	2025-11-28 10:24:50.006
cmiipud38001flb04sjytj2uq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325490248-f82f3102-IMG-20251128-WA0093.jpg	IMG-20251128-WA0093.jpg	image/jpeg	166801	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:50.373	2025-11-28 10:24:50.373
cmiipud68001glb04kvzpf6c5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325490381-78b24f55-IMG-20251128-WA0092.jpg	IMG-20251128-WA0092.jpg	image/jpeg	181875	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:50.48	2025-11-28 10:24:50.48
cmiipud8x001hlb04bvmlkj9t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325490489-333af551-IMG-20251128-WA0091.jpg	IMG-20251128-WA0091.jpg	image/jpeg	161254	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:50.578	2025-11-28 10:24:50.578
cmiipudbm001ilb048h0ook3s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764325490586-f10f6c86-IMG-20251128-WA0090.jpg	IMG-20251128-WA0090.jpg	image/jpeg	178520	960	1280	\N	\N	\N	0	f	completed	\N	2025-11-28 10:24:50.674	2025-11-28 10:24:50.674
cmk29tw9l000pjo04kjg3m8pf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767684700096-7930db91-Green-chain.jpg	Green chain.jpg	image/jpeg	508799	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:31:40.363	2026-01-06 07:31:40.363
cmiirsg0a000ul204f6oc8lq8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764328759678-56f98e13-IMG-20251128-WA0146.jpg	IMG-20251128-WA0146.jpg	image/jpeg	190636	960	1280	\N	\N	\N	0	f	failed	fetch failed	2025-11-28 11:19:19.978	2026-01-02 12:22:10.398
cmj15omf3000dlb04h4yuvbwp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440487430-f606cd62-IMG_9845.jpeg	IMG_9845.jpeg	image/jpeg	1453277	2341	2432	\N	\N	\N	0	f	completed	\N	2025-12-11 08:08:07.551	2025-12-11 08:08:07.551
cmk0rio9u0002li04d3zw80pd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593477554-a671cc5e-Tikka-4.jpg	Tikka 4.jpg	image/jpeg	409991	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 06:11:17.73	2026-01-05 06:11:17.73
cmj15ozf2000flb04b2vyssbc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440504250-1e07af21-IMG_9866.jpeg	IMG_9866.jpeg	image/jpeg	3025089	2680	3779	\N	\N	\N	0	f	completed	\N	2025-12-11 08:08:24.399	2025-12-11 08:08:24.399
cmj15qizd000glb04d4756dgp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440575761-e659b4ed-IMG_9860.jpeg	IMG_9860.jpeg	image/jpeg	2931633	2547	3697	\N	\N	\N	0	f	completed	\N	2025-12-11 08:09:36.231	2025-12-11 08:09:36.231
cmj89frvt0009l204a5762ab1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765870055995-b3042125-IMG_0053.jpeg	IMG_0053.jpeg	image/jpeg	1323095	1767	2349	\N	\N	\N	0	f	completed	\N	2025-12-16 07:27:36.223	2025-12-16 07:27:36.223
cmj15omb5000clb0450ek4520	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440487025-a0cb2704-IMG_9831.jpeg	IMG_9831.jpeg	image/jpeg	1478566	2107	2438	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 08:08:07.299	2025-12-11 10:47:26.374
cmj2u4uzd001fjr0477nvbvsi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765542021907-fee8258d-IMG-20251212-WA0055.jpg	IMG-20251212-WA0055.jpg	image/jpeg	189332	983	1268	\N	\N	\N	0	f	completed	\N	2025-12-12 12:20:22.105	2025-12-12 12:20:22.105
cmk228si30008l504c73f3d33	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767671958293-b581c48a-Ring-5-2.jpg	Ring 5-2.jpg	image/jpeg	237921	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 03:59:18.603	2026-01-06 03:59:18.603
cmk3oihj10006k0045woxboi0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767769828341-4c1cbe4c-7-5.jpg	7-5.jpg	image/jpeg	522355	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 07:10:28.669	2026-01-07 07:10:28.669
cmjb5utm90008js04ub6pviu1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766045438003-f2e3742c-IMG_0212.jpeg	IMG_0212.jpeg	image/jpeg	606438	1416	1233	\N	\N	\N	0	f	completed	\N	2025-12-18 08:10:38.379	2025-12-18 08:10:38.379
cmj9t83p90000i804xq9nx5sn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765963756388-acaa612c-IMG_0133.jpeg	IMG_0133.jpeg	image/jpeg	711786	1660	1634	\N	\N	\N	0	f	failed	fetch failed	2025-12-17 09:29:16.79	2025-12-17 09:57:02.356
cmj15ny8y000blb04k9pbd23y	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440456143-15c50026-IMG_9825.jpeg	IMG_9825.jpeg	image/jpeg	1376808	2252	2281	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 08:07:36.226	2026-01-07 14:29:59.322
cmjb5utph0009js04c8uhrwbe	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766045438615-1ea94dd9-IMG_0217.jpeg	IMG_0217.jpeg	image/jpeg	442913	1124	992	\N	\N	\N	0	f	completed	\N	2025-12-18 08:10:38.694	2025-12-18 08:10:38.694
cmiymt7y30008jp04ozvfhax8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/documents/image/l2cp-documents-image-1765287856525-96ce9d45-IMG-20251208-WA0069.jpg	IMG-20251208-WA0069.jpg	image/jpeg	217169	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-09 13:44:16.902	2025-12-09 13:44:16.902
cmj15xq5x000hlb04upkdfmhf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765440910779-1b36bb75-IMG_9874.jpeg	IMG_9874.jpeg	image/jpeg	1797911	2209	2847	\N	\N	\N	0	f	completed	\N	2025-12-11 08:15:11.023	2025-12-11 08:15:11.023
cmipkhon70000l704g3a67uk4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764739763436-06e8287e-IMG_8593.jpeg	IMG_8593.jpeg	image/jpeg	1534715	3024	1952	\N	\N	\N	0	f	completed	\N	2025-12-03 05:29:23.856	2025-12-03 05:29:23.856
cmipliuz40009l70453q5alqr	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764741498059-49ed1e7e-IMG_8600.jpeg	IMG_8600.jpeg	image/jpeg	1643493	3016	2017	\N	\N	\N	0	f	completed	\N	2025-12-03 05:58:18.324	2025-12-03 05:58:18.324
cmj2udkos000fle04gngtdugh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765542428453-0779cf7e-IMG-20251208-WA0100.jpg	IMG-20251208-WA0100.jpg	image/jpeg	315608	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 12:27:08.668	2025-12-12 12:27:08.668
cmipm3h600000jx044zuw8x6t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764742459867-4dd663c8-IMG_8606.jpeg	IMG_8606.jpeg	image/jpeg	1534153	2768	1979	\N	\N	\N	0	f	completed	\N	2025-12-03 06:14:20.329	2025-12-03 06:14:20.329
cmj86i1a10000l804dka4cwud	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765865122675-9f60e0c1-IMG_0026.jpeg	IMG_0026.jpeg	image/jpeg	2359327	2272	3316	\N	\N	\N	0	f	completed	\N	2025-12-16 06:05:23.065	2025-12-16 06:05:23.065
cmj8a4py40000js04hr5fx5jl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765871219634-1c2706bc-IMG_0056.jpeg	IMG_0056.jpeg	image/jpeg	1373556	1857	2557	\N	\N	\N	0	f	completed	\N	2025-12-16 07:47:00.094	2025-12-16 07:47:00.094
cmiponebx0000jo042d7cbrap	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764746748591-eb1d8c73-IMG_8617.jpeg	IMG_8617.jpeg	image/jpeg	1546001	2970	1806	\N	\N	\N	0	f	completed	\N	2025-12-03 07:25:49.006	2025-12-03 07:25:49.006
cmk0rt3gd0002kt04cj4ax4td	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593963899-f92def2c-a125edb9-ac78-4d14-8e6b-c6e504ca341f.jpeg	a125edb9-ac78-4d14-8e6b-c6e504ca341f.jpeg	image/jpeg	345801	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:23.965	2026-01-05 07:12:34.522
cmk0rt3ir0003kt04ltbh0wsu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593963974-af59e7ba-21d692c4-cb61-4bbc-b7db-3a589a257931.jpeg	21d692c4-cb61-4bbc-b7db-3a589a257931.jpeg	image/jpeg	324857	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:24.051	2026-01-05 07:13:49.351
cmjb1tdro0000ii04zg7alggr	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766038652608-eaa778b8-IMG_0145.jpeg	IMG_0145.jpeg	image/jpeg	389140	1224	930	\N	\N	\N	0	f	completed	\N	2025-12-18 06:17:32.916	2025-12-18 06:17:32.916
cmk0rt3ba0000kt04fmeax446	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593963268-f887c2bb-e8f9498c-4621-4a1c-a680-a7999ea7f9e6.jpeg	e8f9498c-4621-4a1c-a680-a7999ea7f9e6.jpeg	image/jpeg	328379	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:23.577	2026-01-05 07:21:02.224
cmipqd3dp000hjo04id7ctohr	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764749627262-d64cd18f-IMG_8631.jpeg	IMG_8631.jpeg	image/jpeg	1391320	3024	1860	\N	\N	\N	0	f	completed	\N	2025-12-03 08:13:47.486	2025-12-03 08:13:47.486
cmirh2xpn0000l804zwfzy034	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764854968921-0e2e4e70-IMG-20251129-WA0046.jpg	IMG-20251129-WA0046.jpg	image/jpeg	210891	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-04 13:29:29.265	2025-12-04 13:29:29.265
cmirh2xtb0001l804w9l8dg5s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764854969416-19c1964c-IMG-20251129-WA0052.jpg	IMG-20251129-WA0052.jpg	image/jpeg	279492	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-04 13:29:29.519	2025-12-04 13:29:29.519
cmirh2xvv0002l8042x7rtx2e	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764854969534-2dafcbbe-IMG-20251129-WA0051.jpg	IMG-20251129-WA0051.jpg	image/jpeg	157380	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-04 13:29:29.611	2025-12-04 13:29:29.611
cmirh2xyl0003l804hn2ljsw8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764854969620-9e2d35e6-IMG-20251129-WA0050.jpg	IMG-20251129-WA0050.jpg	image/jpeg	229556	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-04 13:29:29.709	2025-12-04 13:29:29.709
cmirh2y0j0004l804bcw7hip4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764854969718-f262a22c-IMG-20251129-WA0049.jpg	IMG-20251129-WA0049.jpg	image/jpeg	205623	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-04 13:29:29.779	2025-12-04 13:29:29.779
cmjb5utrt000ajs041axchvvx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766045438704-fce9f663-IMG_0219.jpeg	IMG_0219.jpeg	image/jpeg	607246	1239	1261	\N	\N	\N	0	f	completed	\N	2025-12-18 08:10:38.777	2025-12-18 08:10:38.777
cmisgjry70000l704nurezyul	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914541096-af53a2ab-6573bdcb-7f2f-4c1f-b9be-a03144d57d44.jpeg	6573bdcb-7f2f-4c1f-b9be-a03144d57d44.jpeg	image/jpeg	357318	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:02:21.514	2025-12-05 06:02:21.514
cmisgjs120001l704tdmphlym	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914541662-52805eb8-d1550b77-9be6-4683-b4cf-9246f78fb8e3.jpeg	d1550b77-9be6-4683-b4cf-9246f78fb8e3.jpeg	image/jpeg	214256	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-05 06:02:21.735	2025-12-05 06:02:21.735
cmjb5utu5000bjs04u9n3293h	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766045438786-c8626fce-IMG_0221.jpeg	IMG_0221.jpeg	image/jpeg	404549	1180	987	\N	\N	\N	0	f	completed	\N	2025-12-18 08:10:38.861	2025-12-18 08:10:38.861
cmisgknwc0003l704gs3rpkkr	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914582721-d0380493-c18ba829-dc67-4f22-9fcf-7b572e16962b.jpeg	c18ba829-dc67-4f22-9fcf-7b572e16962b.jpeg	image/jpeg	365326	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:02.929	2025-12-05 06:03:02.929
cmjb5utw7000cjs0473yt9xm5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766045438871-a3dce111-IMG_0225.jpeg	IMG_0225.jpeg	image/jpeg	391888	1063	935	\N	\N	\N	0	f	completed	\N	2025-12-18 08:10:38.935	2025-12-18 08:10:38.935
cmjb6xwd10000la04qyr8ppwi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766047261220-15608e25-IMG_0230.jpeg	IMG_0230.jpeg	image/jpeg	494465	1217	1133	\N	\N	\N	0	f	failed	fetch failed	2025-12-18 08:41:01.526	2025-12-18 08:44:22.073
cmjchzwla0000ib04cufsy9jy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766126296677-17cdc2b8-IMG_0257.jpeg	IMG_0257.jpeg	image/jpeg	528611	1274	1183	\N	\N	\N	0	f	completed	\N	2025-12-19 06:38:16.998	2025-12-19 06:38:16.998
cmjchzwon0001ib04ghydjgdv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766126297316-08ee0e92-IMG_0262.jpeg	IMG_0262.jpeg	image/jpeg	594529	1418	1224	\N	\N	\N	0	f	completed	\N	2025-12-19 06:38:17.399	2025-12-19 06:38:17.399
cmisgknzn0004l7047jw46nx5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914583056-c9309f1c-ceacb51d-84a6-451e-aa5b-635051d92879.jpeg	ceacb51d-84a6-451e-aa5b-635051d92879.jpeg	image/jpeg	272259	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:03.156	2025-12-05 06:03:03.156
cmisgko2g0005l704sac6z2bu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914583166-dea44a59-83b9e6a5-4999-416d-8822-a38fbc440af2.jpeg	83b9e6a5-4999-416d-8822-a38fbc440af2.jpeg	image/jpeg	318236	1005	1599	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:03.256	2025-12-05 06:03:03.256
cmisgko500006l704p4fgvevi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914583265-13b40764-52c0d86e-7a7d-455c-a264-64f6470e28d6.jpeg	52c0d86e-7a7d-455c-a264-64f6470e28d6.jpeg	image/jpeg	296764	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:03.348	2025-12-05 06:03:03.348
cmisgko780007l70414iekbm9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914583357-6808cb83-0bfe8041-1510-4ead-93c7-55064d14d3c4.jpeg	0bfe8041-1510-4ead-93c7-55064d14d3c4.jpeg	image/jpeg	294216	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:03.428	2025-12-05 06:03:03.428
cmisglj7g0008l704fhz4g24z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914623121-1adf371a-d8d1d6ac-2998-44ab-b21c-83d30c7bdb7f.jpeg	d8d1d6ac-2998-44ab-b21c-83d30c7bdb7f.jpeg	image/jpeg	342700	1172	1599	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:43.308	2025-12-05 06:03:43.308
cmizkyyet0000ic04wzaagbgp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345231091-df640bf6-IMG-20251208-WA0084-1.jpg	IMG-20251208-WA0084(1).jpg	image/jpeg	185903	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:40:31.422	2025-12-10 05:40:31.422
cmizkzjic0001ic04umrrn9ci	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345258666-26705eaa-IMG-20251208-WA0083-1.jpg	IMG-20251208-WA0083(1).jpg	image/jpeg	188154	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:40:58.775	2025-12-10 05:40:58.775
cmisgljnm000cl7040z909gjp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914624121-b4addc35-20507ed9-f2f2-45dc-8540-701a2c9f0d46.jpeg	20507ed9-f2f2-45dc-8540-701a2c9f0d46.jpeg	image/jpeg	292425	955	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:03:44.194	2025-12-05 06:03:44.194
cmisgmmbg000el704v0vgfj0n	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914674237-b5479d50-acb4d333-3392-4637-81f6-e61636afae24.jpeg	acb4d333-3392-4637-81f6-e61636afae24.jpeg	image/jpeg	300759	1006	1599	\N	\N	\N	0	f	completed	\N	2025-12-05 06:04:34.3	2025-12-05 06:04:34.3
cmisgmmdh000fl704te0u2wlo	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914674309-74948f52-f11eba5e-7120-4ae2-bc9a-b63d482e8210.jpeg	f11eba5e-7120-4ae2-bc9a-b63d482e8210.jpeg	image/jpeg	289134	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:04:34.374	2025-12-05 06:04:34.374
cmizkzy8p0002ic04x4zd381s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345277767-3a605c94-IMG-20251208-WA0082-1.jpg	IMG-20251208-WA0082(1).jpg	image/jpeg	185538	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:41:17.872	2025-12-10 05:41:17.872
cmisgmmhw000hl7041ogu1wob	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914674467-08aefc07-6687ec59-316f-4f51-8fc4-969e0401d783.jpeg	6687ec59-316f-4f51-8fc4-969e0401d783.jpeg	image/jpeg	296965	1007	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:04:34.532	2025-12-05 06:04:34.532
cmizkzyb60003ic04cx4kpgpb	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345277996-384d3911-IMG-20251208-WA0081-1.jpg	IMG-20251208-WA0081(1).jpg	image/jpeg	177295	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:41:18.067	2025-12-10 05:41:18.067
cmizl0z3e0004ic04im5fwnzf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345325015-f96b28a8-IMG-20251208-WA0080-1.jpg	IMG-20251208-WA0080(1).jpg	image/jpeg	184226	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:05.213	2025-12-10 05:42:05.213
cmizl0z720005ic04xhmno1dw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345325757-39b5e4fb-IMG-20251208-WA0079-1.jpg	IMG-20251208-WA0079(1).jpg	image/jpeg	172732	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:05.87	2025-12-10 05:42:05.87
cmizl0z9s0006ic04d28f7ce6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345325879-1b4f6099-IMG-20251208-WA0078-1.jpg	IMG-20251208-WA0078(1).jpg	image/jpeg	217312	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:05.968	2025-12-10 05:42:05.968
cmisgmmss000ml70408h9t4n5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914674843-bbd3e1c0-b6bb6e02-27f6-48c7-81d4-84ec0b36ddc4.jpeg	b6bb6e02-27f6-48c7-81d4-84ec0b36ddc4.jpeg	image/jpeg	313263	1015	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:04:34.925	2025-12-05 06:04:34.925
cmisgmmv5000nl704ya749amp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914674933-2a7cac3a-886e2f18-8cb6-4c6d-9a7b-35bd98a5c95d.jpeg	886e2f18-8cb6-4c6d-9a7b-35bd98a5c95d.jpeg	image/jpeg	274285	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:04:35.01	2025-12-05 06:04:35.01
cmizl0zc00007ic040sc9nwlh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345325976-b63eaa4b-IMG-20251208-WA0077-1.jpg	IMG-20251208-WA0077(1).jpg	image/jpeg	189055	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:06.048	2025-12-10 05:42:06.048
cmizl1h170008ic04dv5ljoq1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345348756-1a9577de-IMG-20251208-WA0076-1.jpg	IMG-20251208-WA0076(1).jpg	image/jpeg	222980	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:28.883	2025-12-10 05:42:28.883
cmizl1h3x0009ic04vv2bsglz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345349004-fba43b27-IMG-20251208-WA0075-1.jpg	IMG-20251208-WA0075(1).jpg	image/jpeg	186294	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:29.085	2025-12-10 05:42:29.085
cmizl1h5v000aic04o2nsy34t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765345349094-5212d9de-IMG-20251208-WA0073-1.jpg	IMG-20251208-WA0073(1).jpg	image/jpeg	325831	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-10 05:42:29.155	2025-12-10 05:42:29.155
cmj19srww000sl50488h4epuc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765447399088-4db46b1c-IMG_9847.jpeg	IMG_9847.jpeg	image/jpeg	1137681	2025	2167	\N	\N	\N	0	f	completed	\N	2025-12-11 10:03:19.633	2025-12-11 10:03:19.633
cmj2uupyq0000kv04e1c5vt30	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765543228291-fd5bac27-IMG-20251209-WA0088.jpg	IMG-20251209-WA0088.jpg	image/jpeg	363669	1199	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 12:40:28.658	2025-12-12 12:40:28.658
cmj19tw5f000tl504wd3x20ry	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765447451312-f51beb66-IMG_9840.jpeg	IMG_9840.jpeg	image/jpeg	2463335	2655	3196	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 10:04:11.603	2026-01-07 14:31:39.728
cmisgljb80009l7047dfzi0gs	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914623637-71217db3-1bf720ba-1b1a-4596-8533-5b6e2663dbbd.jpeg	1bf720ba-1b1a-4596-8533-5b6e2663dbbd.jpeg	image/jpeg	298838	900	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-05 06:03:43.748	2026-01-07 15:36:08.563
cmizll9jz000ajs0402czz17z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765346271971-9239c4be-IMG_9592.jpeg	IMG_9592.jpeg	image/jpeg	219954	828	890	\N	\N	\N	0	f	completed	\N	2025-12-10 05:57:52.288	2025-12-10 05:57:52.288
cmj1b0l7w000ald04udvlxehl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765449443338-5127e620-IMG_9877.jpeg	IMG_9877.jpeg	image/jpeg	2225680	2651	3154	\N	\N	\N	0	f	completed	\N	2025-12-11 10:37:23.84	2025-12-11 10:37:23.84
cmjb6xwjw0003la04xfn5vigl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766047261907-17e1ccc7-IMG_0238.jpeg	IMG_0238.jpeg	image/jpeg	374379	1087	894	\N	\N	\N	0	f	failed	fetch failed	2025-12-18 08:41:01.965	2026-01-02 12:28:05.314
cmisgnx66000yl7044p87nth3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914734951-9a34ffda-2e3f3619-cd5c-48eb-a857-920e8bdce4f4.jpeg	2e3f3619-cd5c-48eb-a857-920e8bdce4f4.jpeg	image/jpeg	308878	1003	1599	\N	\N	\N	0	f	completed	\N	2025-12-05 06:05:35.023	2025-12-05 06:05:35.023
cmisgnx84000zl704rspkp698	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914735032-d28d38ac-9f13df23-94a2-408c-87b9-c5cd5b7bd12f.jpeg	9f13df23-94a2-408c-87b9-c5cd5b7bd12f.jpeg	image/jpeg	378570	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:05:35.092	2025-12-05 06:05:35.092
cmisgnxaz0010l704y7jymd27	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914735102-43225cb7-a91d3dc3-7e37-46bd-a113-f854cdaf2c34.jpeg	a91d3dc3-7e37-46bd-a113-f854cdaf2c34.jpeg	image/jpeg	406684	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:05:35.195	2025-12-05 06:05:35.195
cmisgnxcw0011l704ri9ofz1b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914735204-bdc474a0-e496303e-c237-43e1-9692-21a80f62ec55.jpeg	e496303e-c237-43e1-9692-21a80f62ec55.jpeg	image/jpeg	422986	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:05:35.264	2025-12-05 06:05:35.264
cmisgnxf30012l70467acwb70	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764914735273-6bb70ae9-531a41ce-5424-41b6-bf5c-0caf3e7de0a0.jpeg	531a41ce-5424-41b6-bf5c-0caf3e7de0a0.jpeg	image/jpeg	415943	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 06:05:35.343	2025-12-05 06:05:35.343
cmisgz9ze0002ic0475j3ncpz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764915264768-fefcce8c-97b135f1-b8c9-43d6-8134-7a5f0616e4ec.jpeg	97b135f1-b8c9-43d6-8134-7a5f0616e4ec.jpeg	image/jpeg	239215	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-05 06:14:24.842	2025-12-05 06:14:24.842
cmisinymt0000jm04mgpljik5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1764918095701-d960e2b9-IMG-20251204-WA0123.jpg	IMG-20251204-WA0123.jpg	image/jpeg	308681	1060	1600	\N	\N	\N	0	f	completed	\N	2025-12-05 07:01:36.043	2025-12-05 07:01:36.043
cmj1b14wy000dld04ec8n4ygq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765449469402-e039de0f-IMG_9893.jpeg	IMG_9893.jpeg	image/jpeg	1668611	2176	2681	\N	\N	\N	0	f	completed	\N	2025-12-11 10:37:49.474	2025-12-11 10:37:49.474
cmjb2h7uu0000lb0447grfrll	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766039764167-647dba4e-IMG_0148.jpeg	IMG_0148.jpeg	image/jpeg	542339	1415	1167	\N	\N	\N	0	f	completed	\N	2025-12-18 06:36:04.599	2025-12-18 06:36:04.599
cmk22bcsi000hl504c4409nxu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672078020-9611dd26-Ring-5-3.jpg	Ring 5-3.jpg	image/jpeg	243400	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:01:18.211	2026-01-06 04:01:18.211
cmj1b14ud000cld040gljcpyy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765449469061-ad45d696-IMG_9888.jpeg	IMG_9888.jpeg	image/jpeg	1815024	2375	2791	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 10:37:49.267	2025-12-11 10:47:26.386
cmjb2h7yk0001lb044ii53hji	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766039765029-b4b91e8e-IMG_0156.jpeg	IMG_0156.jpeg	image/jpeg	452181	1458	1423	\N	\N	\N	0	f	completed	\N	2025-12-18 06:36:05.132	2025-12-18 06:36:05.132
cmk0rt3q50006kt04eb2r8y1u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593964249-ed7db293-8c2340fc-65f0-48d8-bef0-54bab0b5ac85.jpeg	8c2340fc-65f0-48d8-bef0-54bab0b5ac85.jpeg	image/jpeg	281018	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:24.317	2026-01-05 07:08:00.483
cmj1b0lc0000bld04iafvluku	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765449443982-119fbca4-IMG_9881.jpeg	IMG_9881.jpeg	image/jpeg	1688412	2482	2650	\N	\N	\N	0	f	failed	fetch failed	2025-12-11 10:37:24.097	2025-12-11 10:49:35.967
cmj2uv6yw0001kv04pvjdrhsb	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765543250392-1af5d7b1-IMG-20251209-WA0090.jpg	IMG-20251209-WA0090.jpg	image/jpeg	369200	1200	1600	\N	\N	\N	0	f	completed	\N	2025-12-12 12:40:50.531	2025-12-12 12:40:50.531
cmk29xql5000al50412qq09wb	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767684879354-b0013d98-Lotus-chain.jpg	Lotus chain .jpg	image/jpeg	381502	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 07:34:39.61	2026-01-06 07:34:39.61
cmk3opl42000alc04gjzjd8fu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767770159702-dd34ca1f-7-4-1.jpg	7-4 (1).jpg	image/jpeg	523311	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 07:15:59.906	2026-01-07 07:15:59.906
cmitwu2c60000ju04h6n974e7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002361198-2ccd0f0f-029a65ec-612b-4c6f-afc3-b64912c6a11d.jpeg	029a65ec-612b-4c6f-afc3-b64912c6a11d.jpeg	image/jpeg	221103	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:01.583	2025-12-06 06:26:01.583
cmitwu2fo0001ju04d2jbdzcn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002361715-d48d98d7-1b473888-cb8c-4172-b71d-31dbfa74e6a4.jpeg	1b473888-cb8c-4172-b71d-31dbfa74e6a4.jpeg	image/jpeg	221873	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:01.812	2025-12-06 06:26:01.812
cmitwu2ip0002ju04spxuth1x	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002361821-a933b4ba-1e7af4ee-9bd8-4b37-ab9a-5ba4b2d4497a.jpeg	1e7af4ee-9bd8-4b37-ab9a-5ba4b2d4497a.jpeg	image/jpeg	212779	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:01.921	2025-12-06 06:26:01.921
cmj874na10000ju04ilnik4wu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765866177598-2331fe96-IMG_0032.jpeg	IMG_0032.jpeg	image/jpeg	1886956	2210	2804	\N	\N	\N	0	f	completed	\N	2025-12-16 06:22:58.01	2025-12-16 06:22:58.01
cmj8al48n000ql204y5vsgpnq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765871984895-7c28911c-IMG_0062.jpeg	IMG_0062.jpeg	image/jpeg	1704550	2055	2830	\N	\N	\N	0	f	completed	\N	2025-12-16 07:59:45.142	2025-12-16 07:59:45.142
cmjb2h8110002lb04t2we85yt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766039765141-ba5ea715-IMG_0162.jpeg	IMG_0162.jpeg	image/jpeg	591747	1501	1347	\N	\N	\N	0	f	completed	\N	2025-12-18 06:36:05.221	2025-12-18 06:36:05.221
cmjb6xwfx0001la04zv8m00j0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766047261749-8c12c726-IMG_0235.jpeg	IMG_0235.jpeg	image/jpeg	624908	1270	1226	\N	\N	\N	0	f	completed	\N	2025-12-18 08:41:01.822	2025-12-18 08:41:01.822
cmjb6xwi10002la0402660ji2	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766047261831-48e7097a-IMG_0237.jpeg	IMG_0237.jpeg	image/jpeg	486310	1218	1138	\N	\N	\N	0	f	completed	\N	2025-12-18 08:41:01.898	2025-12-18 08:41:01.898
cmitwu2kn0003ju045y107w83	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002361930-4f6764d4-0872164e-22d3-4a4b-8af4-6ce880ff626e.jpeg	0872164e-22d3-4a4b-8af4-6ce880ff626e.jpeg	image/jpeg	203334	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:01.992	2025-12-06 06:26:01.992
cmitwu2mn0004ju04xcv438tc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002362001-22d3505a-ce44966f-6dec-4123-be22-b5aa54ab6452.jpeg	ce44966f-6dec-4123-be22-b5aa54ab6452.jpeg	image/jpeg	226733	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:02.063	2025-12-06 06:26:02.063
cmitwu2p10005ju04obd0kqfl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002362073-820280b7-f4f5d190-1beb-4f7c-a63e-d9fd068ae515.jpeg	f4f5d190-1beb-4f7c-a63e-d9fd068ae515.jpeg	image/jpeg	291567	1042	1600	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:02.149	2025-12-06 06:26:02.149
cmitwu2r80006ju04nj5jnj1x	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765002362158-0b399326-23b0475a-8186-45f2-841d-956e1f849c3d.jpeg	23b0475a-8186-45f2-841d-956e1f849c3d.jpeg	image/jpeg	246888	900	1600	\N	\N	\N	0	f	completed	\N	2025-12-06 06:26:02.228	2025-12-06 06:26:02.228
cmizrldf30000jv041ygsc8w4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356354653-a3687589-IMG_9637.jpeg	IMG_9637.jpeg	image/jpeg	648357	1469	1508	\N	\N	\N	0	f	completed	\N	2025-12-10 08:45:55.01	2025-12-10 08:45:55.01
cmitxllw50000l7046allb6dx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765003645192-965ba7f4-713DA0F4-FEC8-4475-A832-E72BF2D107FB.jpeg	713DA0F4-FEC8-4475-A832-E72BF2D107FB.jpeg	image/jpeg	2638433	3840	2160	\N	\N	\N	0	f	completed	\N	2025-12-06 06:47:25.606	2025-12-06 06:47:25.606
cmitxz0vg000gla04s8pey261	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765004272185-f5fb00bf-IMG_8996.jpeg	IMG_8996.jpeg	image/jpeg	986467	1907	2501	\N	\N	\N	0	f	completed	\N	2025-12-06 06:57:52.555	2025-12-06 06:57:52.555
cmitxz0zd000hla049dvyfazw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765004272718-72f564ec-IMG_8998.jpeg	IMG_8998.jpeg	image/jpeg	1972083	2314	2833	\N	\N	\N	0	f	completed	\N	2025-12-06 06:57:52.825	2025-12-06 06:57:52.825
cmk22fefg000al404pppzex31	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672266769-dc8a1cd0-Ring-5-4.jpg	Ring 5-4.jpg	image/jpeg	249559	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:04:26.957	2026-01-06 04:04:26.957
cmk2d2gf10009l804co4kj45r	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767690138302-674acb54-Ring-5.jpg	Ring 5.jpg	image/jpeg	289345	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 09:02:18.565	2026-01-06 09:02:18.565
cmk3otduo0008l4047waloo3m	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767770336813-a041e710-7-6-1.jpg	7-6 (1).jpg	image/jpeg	549423	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 07:18:57.12	2026-01-07 07:18:57.12
cmizrldlo0002jv04rdswhcu6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356355280-1d6f3939-IMG_9640.jpeg	IMG_9640.jpeg	image/jpeg	686751	1477	1639	\N	\N	\N	0	f	completed	\N	2025-12-10 08:45:55.357	2025-12-10 08:45:55.357
cmizrldo20003jv04pncehukk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356355367-0b25bdb8-IMG_9644.jpeg	IMG_9644.jpeg	image/jpeg	852737	1797	1795	\N	\N	\N	0	f	completed	\N	2025-12-10 08:45:55.442	2025-12-10 08:45:55.442
cmizrldqv0004jv04ehoxddim	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356355451-db46fefb-IMG_9647.jpeg	IMG_9647.jpeg	image/jpeg	1206540	2309	1716	\N	\N	\N	0	f	completed	\N	2025-12-10 08:45:55.543	2025-12-10 08:45:55.543
cmizrm0ys0005jv04zaqcecmw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356385144-2077c9f8-IMG_9650.jpeg	IMG_9650.jpeg	image/jpeg	1128762	2057	1950	\N	\N	\N	0	f	completed	\N	2025-12-10 08:46:25.325	2025-12-10 08:46:25.325
cmizrm11u0006jv045or0gqko	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356385654-fb2805b1-IMG_9656.jpeg	IMG_9656.jpeg	image/jpeg	622979	1537	1472	\N	\N	\N	0	f	completed	\N	2025-12-10 08:46:25.747	2025-12-10 08:46:25.747
cmizrm14o0007jv04nium2g4i	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356385755-5bce928a-IMG_9658.jpeg	IMG_9658.jpeg	image/jpeg	594555	1616	1450	\N	\N	\N	0	f	completed	\N	2025-12-10 08:46:25.848	2025-12-10 08:46:25.848
cmizrm1740008jv04y5damudm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356385858-3cb87d31-IMG_9659.jpeg	IMG_9659.jpeg	image/jpeg	816783	1647	1577	\N	\N	\N	0	f	completed	\N	2025-12-10 08:46:25.937	2025-12-10 08:46:25.937
cmizrnyd6000bjv04mftm3ugl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356475244-4c926add-IMG_9668.jpeg	IMG_9668.jpeg	image/jpeg	708960	1558	1673	\N	\N	\N	0	f	completed	\N	2025-12-10 08:47:55.472	2025-12-10 08:47:55.472
cmizrnyg2000cjv043qba3y32	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356475596-0808261d-IMG_9671.jpeg	IMG_9671.jpeg	image/jpeg	968459	1986	1841	\N	\N	\N	0	f	completed	\N	2025-12-10 08:47:55.683	2025-12-10 08:47:55.683
cmizrnyi1000djv04pli3yoxu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356475691-59095f37-IMG_9674.jpeg	IMG_9674.jpeg	image/jpeg	1026636	1911	1933	\N	\N	\N	0	f	completed	\N	2025-12-10 08:47:55.753	2025-12-10 08:47:55.753
cmizrofaq000ejv04036pbrbk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356497270-16791e77-IMG_9676.jpeg	IMG_9676.jpeg	image/jpeg	939177	1965	1741	\N	\N	\N	0	f	completed	\N	2025-12-10 08:48:17.414	2025-12-10 08:48:17.414
cmizrofg4000gjv04m793hmxi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356497630-b7e87422-IMG_9682.jpeg	IMG_9682.jpeg	image/jpeg	972521	1904	1947	\N	\N	\N	0	f	completed	\N	2025-12-10 08:48:17.717	2025-12-10 08:48:17.717
cmizrp91r000hjv04bmhybgau	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356535730-ef51ac09-IMG_9679.jpeg	IMG_9679.jpeg	image/jpeg	1130139	2010	1770	\N	\N	\N	0	f	completed	\N	2025-12-10 08:48:55.974	2025-12-10 08:48:55.974
cmizrp98p000jjv04db6ye6wh	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356536266-22b2c283-IMG_9685.jpeg	IMG_9685.jpeg	image/jpeg	663352	1643	1434	\N	\N	\N	0	f	completed	\N	2025-12-10 08:48:56.33	2025-12-10 08:48:56.33
cmizrmgl5000ajv04zpjlgxpj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765356405616-167ee52a-IMG_9649.jpeg	IMG_9649.jpeg	image/jpeg	1253701	2320	1801	\N	\N	\N	0	f	failed	fetch failed	2025-12-10 08:46:45.768	2025-12-10 10:48:05.442
cmjcjgvgv000kl204pb1xh6pa	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128768517-5cb5d9bc-IMG_0293.jpeg	IMG_0293.jpeg	image/jpeg	216808	767	705	\N	\N	\N	0	f	completed	\N	2025-12-19 07:19:28.592	2025-12-19 07:19:28.592
cmjcjgviu000ll20435364lg3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766128768602-51d2711f-IMG_0297.jpeg	IMG_0297.jpeg	image/jpeg	200910	739	696	\N	\N	\N	0	f	completed	\N	2025-12-19 07:19:28.662	2025-12-19 07:19:28.662
cmjgun5pw0000jo0464uc11cv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389401639-82e4ab21-IMG_0305.jpeg	IMG_0305.jpeg	image/jpeg	1391421	2003	3004	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:22.087	2025-12-22 07:43:22.087
cmjgun5so0001jo04bbuxh4n4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389402322-c9ae31fb-IMG_0312.jpeg	IMG_0312.jpeg	image/jpeg	1310915	1861	3280	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:22.392	2025-12-22 07:43:22.392
cmjgungu70002jo04fk8go714	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389416577-bf106bc6-IMG_0314.jpeg	IMG_0314.jpeg	image/jpeg	899233	1599	2828	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:36.703	2025-12-22 07:43:36.703
cmjgunh2i0003jo049o1u7f1a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389416906-3db49b34-IMG_0322.jpeg	IMG_0322.jpeg	image/jpeg	857427	1436	2408	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:37.002	2025-12-22 07:43:37.002
cmjgunuta0005jo04f3jlxjxd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389434483-a5a47766-IMG_0329.jpeg	IMG_0329.jpeg	image/jpeg	938164	1622	2815	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:54.612	2025-12-22 07:43:54.612
cmjgunuvt0006jo04qghqot6b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389434840-88a5281a-IMG_0332.jpeg	IMG_0332.jpeg	image/jpeg	846506	1745	2724	\N	\N	\N	0	f	completed	\N	2025-12-22 07:43:54.905	2025-12-22 07:43:54.905
cmji86xw00000kz04erqydq27	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472625705-63a5f6fa-IMG_0339.jpeg	IMG_0339.jpeg	image/jpeg	1165936	2533	1582	\N	\N	\N	0	f	completed	\N	2025-12-23 06:50:26.236	2025-12-23 06:50:26.236
cmji86y080001kz04qey4t1go	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472626488-e245f0bd-IMG_0345.jpeg	IMG_0345.jpeg	image/jpeg	1304243	2640	1756	\N	\N	\N	0	f	completed	\N	2025-12-23 06:50:26.601	2025-12-23 06:50:26.601
cmji86y2f0002kz04nmram2md	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472626610-6b593ab9-IMG_0351.jpeg	IMG_0351.jpeg	image/jpeg	1092937	2391	1505	\N	\N	\N	0	f	completed	\N	2025-12-23 06:50:26.68	2025-12-23 06:50:26.68
cmji87iy30003kz042ixnq677	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472653382-36e6b3e0-IMG_0357.jpeg	IMG_0357.jpeg	image/jpeg	1737800	2863	1983	\N	\N	\N	0	f	completed	\N	2025-12-23 06:50:53.51	2025-12-23 06:50:53.51
cmji87j1x0004kz04nekhpou1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472653765-ee604eff-IMG_0366.jpeg	IMG_0366.jpeg	image/jpeg	1789930	2914	2063	\N	\N	\N	0	f	completed	\N	2025-12-23 06:50:53.877	2025-12-23 06:50:53.877
cmji87tyb0005kz04vtrbwtas	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472667831-58f58f09-IMG_0353.jpeg	IMG_0353.jpeg	image/jpeg	1337164	2601	1757	\N	\N	\N	0	f	completed	\N	2025-12-23 06:51:08.003	2025-12-23 06:51:08.003
cmji87u6l0006kz04wvdtgiv7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472668205-326b8b14-IMG_0390.jpeg	IMG_0390.jpeg	image/jpeg	1526242	2694	1802	\N	\N	\N	0	f	completed	\N	2025-12-23 06:51:08.302	2025-12-23 06:51:08.302
cmji883cm0007kz04tvx0eru9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472679855-6ac65fdf-IMG_0374.jpeg	IMG_0374.jpeg	image/jpeg	1440736	2644	1758	\N	\N	\N	0	f	completed	\N	2025-12-23 06:51:19.983	2025-12-23 06:51:19.983
cmji883fr0008kz047mnhmlnp	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472680206-28237a9a-IMG_0376.jpeg	IMG_0376.jpeg	image/jpeg	1439411	2851	1823	\N	\N	\N	0	f	completed	\N	2025-12-23 06:51:20.295	2025-12-23 06:51:20.295
cmji8agdi0009kz04v7wvbuak	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766472789928-d1672cf6-IMG_0368.jpeg	IMG_0368.jpeg	image/jpeg	1403229	2679	1810	\N	\N	\N	0	f	completed	\N	2025-12-23 06:53:10.189	2025-12-23 06:53:10.189
cmjjo42qa0000l80405zc401g	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559832251-d15de6c9-IMG_0393.jpeg	IMG_0393.jpeg	image/jpeg	1683199	2178	2665	\N	\N	\N	0	f	completed	\N	2025-12-24 07:03:52.592	2025-12-24 07:03:52.592
cmjjo42tp0001l804ik674cut	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559832821-646aec17-IMG_0395.jpeg	IMG_0395.jpeg	image/jpeg	1817976	2187	2651	\N	\N	\N	0	f	completed	\N	2025-12-24 07:03:52.909	2025-12-24 07:03:52.909
cmjjo5e9d0005l8045b2l810s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559894297-fe6eaa24-IMG_0408.jpeg	IMG_0408.jpeg	image/jpeg	1258085	1954	2398	\N	\N	\N	0	f	completed	\N	2025-12-24 07:04:54.385	2025-12-24 07:04:54.385
cmjjo5p140006l804gboynv8u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559908182-e886a924-IMG_0413.jpeg	IMG_0413.jpeg	image/jpeg	1427229	2104	2676	\N	\N	\N	0	f	completed	\N	2025-12-24 07:05:08.344	2025-12-24 07:05:08.344
cmjjo5yep0007l804bfngk9q5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559920161-97aad450-IMG_0421.jpeg	IMG_0421.jpeg	image/jpeg	1242437	1724	2767	\N	\N	\N	0	f	completed	\N	2025-12-24 07:05:20.334	2025-12-24 07:05:20.334
cmjjo64xi0008l804xmhy22gd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559928791-73a2c35b-IMG_0426.jpeg	IMG_0426.jpeg	image/jpeg	1071334	1815	2074	\N	\N	\N	0	f	completed	\N	2025-12-24 07:05:28.95	2025-12-24 07:05:28.95
cmk0smawy0000ic04f5hvnl9j	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767595326032-ae834ebc-Kasula-necklace-1.jpg	Kasula necklace 1.jpg	image/jpeg	485223	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 06:42:06.367	2026-01-05 06:42:06.367
cmjjqdznh0001js04vc3svk2p	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563654474-a2d13158-IMG_0433.jpeg	IMG_0433.jpeg	image/jpeg	605417	1168	1502	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 08:07:34.589	2026-01-07 06:40:33.474
cmjjqel770003js04ml25xwjn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563682419-565b9181-IMG_0441.jpeg	IMG_0441.jpeg	image/jpeg	1015672	1654	1906	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 08:08:02.515	2026-01-07 06:49:31.052
cmjgunh4u0004jo04nfqi1b6j	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766389417011-e1b71b65-IMG_0326.jpeg	IMG_0326.jpeg	image/jpeg	1162149	1761	2973	\N	\N	\N	0	f	failed	fetch failed	2025-12-22 07:43:37.086	2026-01-10 08:31:50.41
cmjjo4g9m0003l804ppjsbfx6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559850226-5a5b79bc-IMG_0400.jpeg	IMG_0400.jpeg	image/jpeg	1350050	1946	2359	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 07:04:10.33	2026-01-08 10:51:33.535
cmjjo4g5j0002l8047k4xbfcq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766559849797-6c7b690f-IMG_0398.jpeg	IMG_0398.jpeg	image/jpeg	1227826	1909	2266	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 07:04:09.994	2026-01-08 10:51:33.538
cmjjqelak0004js04t7az3eqj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563682525-e33216e5-IMG_0443.jpeg	IMG_0443.jpeg	image/jpeg	911786	1473	1955	\N	\N	\N	0	f	completed	\N	2025-12-24 08:08:02.636	2025-12-24 08:08:02.636
cmjjqeldr0005js04mgwdm11b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563682646-1e027a21-IMG_0445.jpeg	IMG_0445.jpeg	image/jpeg	1010634	1578	2048	\N	\N	\N	0	f	completed	\N	2025-12-24 08:08:02.752	2025-12-24 08:08:02.752
cmjjqelg20006js04n8kdlfgy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563682761-7e0cfd9c-IMG_0447.jpeg	IMG_0447.jpeg	image/jpeg	991428	1804	1775	\N	\N	\N	0	f	completed	\N	2025-12-24 08:08:02.835	2025-12-24 08:08:02.835
cmjjqf7kz0008js045tjlog8o	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563711413-46613500-IMG_0456.jpeg	IMG_0456.jpeg	image/jpeg	998073	1550	2192	\N	\N	\N	0	f	completed	\N	2025-12-24 08:08:31.523	2025-12-24 08:08:31.523
cmjjqf7nb0009js046igzcd61	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563711533-ace6d93f-IMG_0464.jpeg	IMG_0464.jpeg	image/jpeg	819588	1438	1781	\N	\N	\N	0	f	completed	\N	2025-12-24 08:08:31.607	2025-12-24 08:08:31.607
cmjjxmrgj0001jv04176b0d08	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575821091-b0a6b133-IMG_0470.jpeg	IMG_0470.jpeg	image/jpeg	784929	1712	1043	\N	\N	\N	0	f	completed	\N	2025-12-24 11:30:21.187	2025-12-24 11:30:21.187
cmjjxmrl30002jv046kizhd34	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575821196-ea6c66b2-IMG_0472.jpeg	IMG_0472.jpeg	image/jpeg	1017507	1753	1266	\N	\N	\N	0	f	completed	\N	2025-12-24 11:30:21.352	2025-12-24 11:30:21.352
cmjjxmrod0003jv042m32ausc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575821361-346de89c-IMG_0480.jpeg	IMG_0480.jpeg	image/jpeg	831421	1682	1044	\N	\N	\N	0	f	completed	\N	2025-12-24 11:30:21.469	2025-12-24 11:30:21.469
cmjjxmrre0004jv04ahbgchh3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575821478-48d94936-IMG_0475.jpeg	IMG_0475.jpeg	image/jpeg	1073284	2011	1266	\N	\N	\N	0	f	completed	\N	2025-12-24 11:30:21.579	2025-12-24 11:30:21.579
cmjjxoaln0005jv045ho50m9z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575892163-de627a47-IMG_0482.jpeg	IMG_0482.jpeg	image/jpeg	494233	1321	970	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:32.431	2025-12-24 11:31:32.431
cmjjxoas90006jv04scvj7txm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575892674-2b416243-IMG_0489.jpeg	IMG_0489.jpeg	image/jpeg	953644	1829	1282	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:32.889	2025-12-24 11:31:32.889
cmjjxoauw0007jv048yvv8lpl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575892898-b4e6c4c9-IMG_0485.jpeg	IMG_0485.jpeg	image/jpeg	878580	1806	1135	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:32.984	2025-12-24 11:31:32.984
cmjjxooe70008jv04ioyjcwv4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575910187-d497a2f6-IMG_0492.jpeg	IMG_0492.jpeg	image/jpeg	1411304	2390	1351	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:50.332	2025-12-24 11:31:50.332
cmjjxoohd0009jv04eiso6d88	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575910546-39246e41-IMG_0499.jpeg	IMG_0499.jpeg	image/jpeg	960603	2026	1192	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:50.641	2025-12-24 11:31:50.641
cmjjxoojd000ajv04998j3iua	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575910650-48470b11-IMG_0494.jpeg	IMG_0494.jpeg	image/jpeg	961642	1907	1193	\N	\N	\N	0	f	completed	\N	2025-12-24 11:31:50.713	2025-12-24 11:31:50.713
cmk0ss0vr0001ic04zki6ll2v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767595593415-0df4a061-Kasula-haram-1.jpg	Kasula haram 1.jpg	image/jpeg	541905	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 06:46:33.591	2026-01-05 06:46:33.591
cmjjxmrd20000jv04w198j7nc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766575820481-82f8e172-IMG_0466.jpeg	IMG_0466.jpeg	image/jpeg	665068	1427	939	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 11:30:20.847	2025-12-24 11:47:56.772
cmjjqel3x0002js04j7mue5g7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563682063-d8e4f737-IMG_0437.jpeg	IMG_0437.jpeg	image/jpeg	412708	967	1311	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 08:08:02.195	2026-01-07 06:53:58.261
cmjl390me0001jo04fsa3y0js	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645723652-0b12c0d8-IMG_0507.jpeg	IMG_0507.jpeg	image/jpeg	1520761	2111	2603	\N	\N	\N	0	f	completed	\N	2025-12-25 06:55:23.75	2025-12-25 06:55:23.75
cmjl39bsh0002jo04fy44yryq	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645738064-0f4c4baa-IMG_0511.jpeg	IMG_0511.jpeg	image/jpeg	1552573	2085	2577	\N	\N	\N	0	f	completed	\N	2025-12-25 06:55:38.225	2025-12-25 06:55:38.225
cmjl39c140003jo04qu0oad6d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645738439-1df47a69-IMG_0512.jpeg	IMG_0512.jpeg	image/jpeg	1837963	2363	2903	\N	\N	\N	0	f	completed	\N	2025-12-25 06:55:38.537	2025-12-25 06:55:38.537
cmk22hvuv000vl804tjtlerlk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672382687-677c17dd-Ring-5-5.jpg	Ring 5-5.jpg	image/jpeg	261099	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:06:22.855	2026-01-06 04:06:22.855
cmjl39w8g0006jo04we7f4go1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645764559-614159a0-IMG_0530.jpeg	IMG_0530.jpeg	image/jpeg	1398545	2088	2555	\N	\N	\N	0	f	completed	\N	2025-12-25 06:56:04.72	2025-12-25 06:56:04.72
cmjl3a6e40009jo04tivwto1c	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645777779-c884b112-IMG_0536.jpeg	IMG_0536.jpeg	image/jpeg	1839389	2342	2920	\N	\N	\N	0	f	completed	\N	2025-12-25 06:56:17.884	2025-12-25 06:56:17.884
cmjl3ap6x000ajo04yoiz3w0b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645801867-a0e25e21-IMG_0539.jpeg	IMG_0539.jpeg	image/jpeg	1696267	2222	2871	\N	\N	\N	0	f	completed	\N	2025-12-25 06:56:42.023	2025-12-25 06:56:42.023
cmjl390ip0000jo041h60jihv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645723001-92b73f59-IMG_0501.jpeg	IMG_0501.jpeg	image/jpeg	1289046	2090	2419	\N	\N	\N	0	f	failed	fetch failed	2025-12-25 06:55:23.419	2025-12-25 07:08:39.473
cmjl39lgj0005jo04lzbpj4g6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645750676-2ad8e1c8-IMG_0521.jpeg	IMG_0521.jpeg	image/jpeg	1614100	2191	2678	\N	\N	\N	0	f	failed	fetch failed	2025-12-25 06:55:50.756	2025-12-25 07:27:12.928
cmjl39waz0007jo04u8dnlp05	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645764730-2ce41c05-IMG_0531.jpeg	IMG_0531.jpeg	image/jpeg	2122657	2317	2943	\N	\N	\N	0	f	failed	fetch failed	2025-12-25 06:56:04.812	2025-12-25 07:36:07.829
cmjl3a6aj0008jo04l5uco4kv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645777400-bdaab96a-IMG_0535.jpeg	IMG_0535.jpeg	image/jpeg	2272521	2358	2939	\N	\N	\N	0	f	failed	fetch failed	2025-12-25 06:56:17.563	2025-12-25 08:03:38.92
cmk3p3no7000fk004uhys0hga	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767770815864-289b6c41-IMG_1048.jpeg	IMG_1048.jpeg	image/jpeg	1381884	2529	1668	\N	\N	\N	0	f	completed	\N	2026-01-07 07:26:56.068	2026-01-07 07:26:56.068
cmjjqf7hc0007js04ag2a2a2d	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766563711052-f9625974-IMG_0450.jpeg	IMG_0450.jpeg	image/jpeg	542486	1143	1493	\N	\N	\N	0	f	failed	fetch failed	2025-12-24 08:08:31.198	2026-01-07 06:33:33.244
cmjl3axqj000bjo047ko7qtuc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645813167-43416920-IMG_0538.jpeg	IMG_0538.jpeg	image/jpeg	1764592	2315	2832	\N	\N	\N	0	f	completed	\N	2025-12-25 06:56:53.323	2025-12-25 06:56:53.323
cmjl3axyv000cjo04cteasfr6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766645813535-a1c20216-IMG_0541.jpeg	IMG_0541.jpeg	image/jpeg	1986916	2591	2903	\N	\N	\N	0	f	completed	\N	2025-12-25 06:56:53.623	2025-12-25 06:56:53.623
cmjl5pi0l0000l604m22pq3tg	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766649851426-79f01c64-IMG_0547.jpeg	IMG_0547.jpeg	image/jpeg	2096185	2613	3180	\N	\N	\N	0	f	completed	\N	2025-12-25 08:04:11.832	2025-12-25 08:04:11.832
cmjmigetk0001jr04rkjdfuz4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766731729048-63b05529-4cc5add6-8932-4320-a1ad-42a5aac5ff6c.jpeg	4cc5add6-8932-4320-a1ad-42a5aac5ff6c.jpeg	image/jpeg	283686	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-26 06:48:49.161	2025-12-26 06:48:49.161
cmjmigew20002jr043sa1gafl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766731729170-c090a1a4-acadb261-5f38-44de-a35d-53661bd1d405.jpeg	acadb261-5f38-44de-a35d-53661bd1d405.jpeg	image/jpeg	226107	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-26 06:48:49.251	2025-12-26 06:48:49.251
cmk0t0gou0008gv04uz3q6e7z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767595986980-6dc7344f-Short-haram-2.jpg	Short haram 2.jpg	image/jpeg	542319	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 06:53:07.327	2026-01-05 06:53:07.327
cmk22klqs000bl404caoy0o39	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672509541-10d45c45-Ring-5-6.jpg	Ring 5-6.jpg	image/jpeg	255544	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:08:29.717	2026-01-06 04:08:29.717
cmjmigepu0000jr045sa86knk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766731728304-ed7832f9-cb925071-6aa5-4eb2-8c52-56c05ac250b5.jpeg	cb925071-6aa5-4eb2-8c52-56c05ac250b5.jpeg	image/jpeg	206745	960	1280	\N	\N	\N	0	f	failed	fetch failed	2025-12-26 06:48:48.645	2025-12-26 06:56:46.367
cmjmj2egs0008jp04972f036w	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766732754588-4c7df901-78dab1e1-44fe-4e09-b717-72e7178ee89e.jpeg	78dab1e1-44fe-4e09-b717-72e7178ee89e.jpeg	image/jpeg	216706	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-26 07:05:54.93	2025-12-26 07:05:54.93
cmjmj2els0009jp041riesdc4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766732755173-efa91c40-46cf0987-68a3-4ae4-91c2-588b43b8353d.jpeg	46cf0987-68a3-4ae4-91c2-588b43b8353d.jpeg	image/jpeg	243100	960	1280	\N	\N	\N	0	f	completed	\N	2025-12-26 07:05:55.313	2025-12-26 07:05:55.313
cmjnw50gj0000jp04k1mdemto	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766815177559-92097e82-IMG_0577.jpeg	IMG_0577.jpeg	image/jpeg	931282	1277	1867	\N	\N	\N	0	f	completed	\N	2025-12-27 05:59:37.934	2025-12-27 05:59:37.934
cmjnw5ar20001jp04qk2e60ul	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766815191283-e5c431a9-IMG_0582.jpeg	IMG_0582.jpeg	image/jpeg	1799811	1581	2282	\N	\N	\N	0	f	completed	\N	2025-12-27 05:59:51.471	2025-12-27 05:59:51.471
cmjnw5b0b0002jp04i95drv31	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766815191718-a02e5703-IMG_0585.jpeg	IMG_0585.jpeg	image/jpeg	2113760	1742	2640	\N	\N	\N	0	f	completed	\N	2025-12-27 05:59:51.803	2025-12-27 05:59:51.803
cmjnw5j370003jp045crgbjqn	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766815201869-12860644-IMG_0587.jpeg	IMG_0587.jpeg	image/jpeg	1934491	1604	2609	\N	\N	\N	0	f	completed	\N	2025-12-27 06:00:02.078	2025-12-27 06:00:02.078
cmjnx1si10000jz04wpbul2m5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766816706823-f0a478ff-IMG_0603.jpeg	IMG_0603.jpeg	image/jpeg	1230842	1428	2033	\N	\N	\N	0	f	completed	\N	2025-12-27 06:25:07.237	2025-12-27 06:25:07.237
cmjnx1slx0001jz04br53aiqx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766816707500-3f0aac9d-IMG_0606.jpeg	IMG_0606.jpeg	image/jpeg	2476248	1957	2731	\N	\N	\N	0	f	completed	\N	2025-12-27 06:25:07.605	2025-12-27 06:25:07.605
cmjny65fc0008jj04nkprtrbu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766818589873-42b01057-IMG_0608.jpeg	IMG_0608.jpeg	image/jpeg	407153	1086	876	\N	\N	\N	0	f	completed	\N	2025-12-27 06:56:30.262	2025-12-27 06:56:30.262
cmjny65k80009jj04wur9qqp6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766818590485-84436cd5-IMG_0611.jpeg	IMG_0611.jpeg	image/jpeg	558217	1297	898	\N	\N	\N	0	f	completed	\N	2025-12-27 06:56:30.632	2025-12-27 06:56:30.632
cmjny65mw000ajj04b4pd1sgk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766818590641-43235fb4-IMG_0616.jpeg	IMG_0616.jpeg	image/jpeg	213050	914	545	\N	\N	\N	0	f	completed	\N	2025-12-27 06:56:30.728	2025-12-27 06:56:30.728
cmjny65pa000bjj04qtcu9brw	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766818590737-eaac2e0e-IMG_0619.jpeg	IMG_0619.jpeg	image/jpeg	605303	1348	1072	\N	\N	\N	0	f	completed	\N	2025-12-27 06:56:30.815	2025-12-27 06:56:30.815
cmjny6l4d000djj04pepupr7v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766818610707-d80646fc-IMG_0636.jpeg	IMG_0636.jpeg	image/jpeg	486411	1337	793	\N	\N	\N	0	f	completed	\N	2025-12-27 06:56:50.797	2025-12-27 06:56:50.797
cmjnygkmz0008lb04qrs25461	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766819076203-c081356a-IMG_0625.jpeg	IMG_0625.jpeg	image/jpeg	579363	1435	872	\N	\N	\N	0	f	completed	\N	2025-12-27 07:04:36.536	2025-12-27 07:04:36.536
cmjo0t5uf0000kz04vfp696u9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823022733-591d336c-IMG_0644.jpeg	IMG_0644.jpeg	image/jpeg	1366146	2667	1811	\N	\N	\N	0	f	completed	\N	2025-12-27 08:10:23.113	2025-12-27 08:10:23.113
cmjo0t5y20001kz046psnk801	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823023351-5e3dff95-IMG_0649.jpeg	IMG_0649.jpeg	image/jpeg	1149937	2666	1546	\N	\N	\N	0	f	completed	\N	2025-12-27 08:10:23.45	2025-12-27 08:10:23.45
cmjo0tyq80002kz04fs5c0ipz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823060313-b474bec4-IMG_0654.jpeg	IMG_0654.jpeg	image/jpeg	1627715	2910	2042	\N	\N	\N	0	f	completed	\N	2025-12-27 08:11:00.56	2025-12-27 08:11:00.56
cmjo0tytk0003kz0423qb706a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823060777-aa559476-IMG_0669.jpeg	IMG_0669.jpeg	image/jpeg	1954788	2199	2534	\N	\N	\N	0	f	completed	\N	2025-12-27 08:11:00.873	2025-12-27 08:11:00.873
cmjo0uowz0004kz04652h3rrx	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823094267-a9b7bbd7-IMG_0679.jpeg	IMG_0679.jpeg	image/jpeg	1551198	3009	1884	\N	\N	\N	0	f	completed	\N	2025-12-27 08:11:34.504	2025-12-27 08:11:34.504
cmjo0w4zj0006kz0425kexple	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823161814-cb9a7887-IMG_0687.jpeg	IMG_0687.jpeg	image/jpeg	1942261	2199	2485	\N	\N	\N	0	f	completed	\N	2025-12-27 08:12:41.984	2025-12-27 08:12:41.984
cmjo1mbrc000gl804jyhm9ac3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766824383338-99ef6251-IMG_0692.jpeg	IMG_0692.jpeg	image/jpeg	2306845	2098	3472	\N	\N	\N	0	f	completed	\N	2025-12-27 08:33:03.763	2025-12-27 08:33:03.763
cmjqt60zr0003jy04oh3mjl3m	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991584770-28d8fc93-IMG_0708.jpeg	IMG_0708.jpeg	image/jpeg	1043389	1760	2193	\N	\N	\N	0	f	completed	\N	2025-12-29 06:59:44.923	2025-12-29 06:59:44.923
cmjqt612t0004jy04b1ar4xk5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991585181-8fa52498-IMG_0713.jpeg	IMG_0713.jpeg	image/jpeg	781698	1525	1881	\N	\N	\N	0	f	completed	\N	2025-12-29 06:59:45.27	2025-12-29 06:59:45.27
cmjqt61560005jy04cretvzc1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991585280-8d730752-IMG_0715.jpeg	IMG_0715.jpeg	image/jpeg	921592	1701	2174	\N	\N	\N	0	f	completed	\N	2025-12-29 06:59:45.354	2025-12-29 06:59:45.354
cmjqt6ju10006jy04k3pn1n3i	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991609255-c5ce908b-IMG_0719.jpeg	IMG_0719.jpeg	image/jpeg	1186216	1994	2592	\N	\N	\N	0	f	completed	\N	2025-12-29 07:00:09.391	2025-12-29 07:00:09.391
cmjqt6jwv0007jy044t1w51qu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991609599-7187ed3c-IMG_0721.jpeg	IMG_0721.jpeg	image/jpeg	803260	1563	1771	\N	\N	\N	0	f	completed	\N	2025-12-29 07:00:09.68	2025-12-29 07:00:09.68
cmjqt6jzd0008jy042e3mojmj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991609689-c70b29aa-IMG_0726.jpeg	IMG_0726.jpeg	image/jpeg	777494	1591	2176	\N	\N	\N	0	f	completed	\N	2025-12-29 07:00:09.769	2025-12-29 07:00:09.769
cmjqt5o150000jy04861d12mu	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991567735-9d7dde0b-IMG_0697.jpeg	IMG_0697.jpeg	image/jpeg	765867	1646	1798	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 06:59:28.098	2025-12-29 07:24:35.103
cmjr1z6f00009kz049st2vr4z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006382048-2b0d101c-IMG_0758.jpeg	IMG_0758.jpeg	image/jpeg	1803289	2135	2860	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:06:22.14	2025-12-30 08:18:00.347
cmjqt5o6n0002jy04z4lpbjsi	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991568494-1b245fb4-IMG_0705.jpeg	IMG_0705.jpeg	image/jpeg	730979	1277	1822	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 06:59:28.559	2025-12-29 07:25:50.455
cmjr1wwmo0003kz04rqsdzfbk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006276053-c9a8bd85-IMG_0737.jpeg	IMG_0737.jpeg	image/jpeg	2100693	2118	3390	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:04:36.145	2025-12-30 08:17:23.3
cmjr1xjm50007kz04hbht3nfs	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006305843-0cf3cf5c-IMG_0752.jpeg	IMG_0752.jpeg	image/jpeg	1885808	1972	3165	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:05:05.933	2025-12-30 08:17:23.67
cmjqt5o4j0001jy04ts1q0m1a	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766991568382-10ab5e5a-IMG_0701.jpeg	IMG_0701.jpeg	image/jpeg	728051	1450	1835	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 06:59:28.483	2025-12-29 07:27:36.781
cmjr1wlxl0001kz04c31cz2f7	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006262195-4091c962-IMG_0729.jpeg	IMG_0729.jpeg	image/jpeg	1682218	1957	2931	\N	\N	\N	0	f	completed	\N	2025-12-29 11:04:22.281	2025-12-29 11:04:22.281
cmjr1wwdu0002kz04rsypguu9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006275665-27ae3d2e-IMG_0732.jpeg	IMG_0732.jpeg	image/jpeg	2248430	2202	3362	\N	\N	\N	0	f	completed	\N	2025-12-29 11:04:35.826	2025-12-29 11:04:35.826
cmjr1x8g40005kz04xfuq29by	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006291376-e71ed858-IMG_0743.jpeg	IMG_0743.jpeg	image/jpeg	2065249	2116	3155	\N	\N	\N	0	f	completed	\N	2025-12-29 11:04:51.461	2025-12-29 11:04:51.461
cmjr1xjdx0006kz04ig728d9v	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006305446-1738ac45-IMG_0748.jpeg	IMG_0748.jpeg	image/jpeg	2379584	2303	3579	\N	\N	\N	0	f	completed	\N	2025-12-29 11:05:05.637	2025-12-29 11:05:05.637
cmjr1z6bs0008kz04o0hwf70c	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006381574-fd9e32ba-IMG_0755.jpeg	IMG_0755.jpeg	image/jpeg	1789143	2072	2679	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:06:21.826	2025-12-30 08:18:00.345
cmj2uv7220002kv04gybz2r81	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1765543250723-ae2d850b-IMG-20251209-WA0089.jpg	IMG-20251209-WA0089.jpg	image/jpeg	304163	1200	1600	\N	\N	\N	0	f	failed	fetch failed	2025-12-12 12:40:50.81	2026-01-07 07:59:39.922
cmjr1wluc0000kz04nripoipc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006261620-33bf9d65-IMG_0728.jpeg	IMG_0728.jpeg	image/jpeg	1419209	1806	2656	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:04:21.964	2025-12-30 08:23:42.211
cmjr1x8d10004kz04vf16832e	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006290969-6cf60d46-IMG_0738.jpeg	IMG_0738.jpeg	image/jpeg	1919753	2107	2804	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:04:51.145	2025-12-30 08:25:22.196
cmk0t4bbk0013li04aktrs55r	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767596166708-35cfa5ff-IMG_0902.jpeg	IMG_0902.jpeg	image/jpeg	3059410	4032	3024	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:56:06.992	2026-01-05 07:09:57.561
cmk22n8aw000yl504gvnm0mz9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672631893-f9c3ce87-Ring-5-7.jpg	Ring 5-7.jpg	image/jpeg	258793	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:10:32.052	2026-01-06 04:10:32.052
cmjo0vnzw0005kz04b0t57ke5	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1766823139633-b186c3fb-IMG_0683.jpeg	IMG_0683.jpeg	image/jpeg	1877167	1836	2891	\N	\N	\N	0	f	failed	fetch failed	2025-12-27 08:12:19.968	2026-01-10 08:34:51.647
cmjr1zjmq000bkz04kdyxivyy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006399175-3c0c921f-IMG_0766.jpeg	IMG_0766.jpeg	image/jpeg	1983324	2140	3001	\N	\N	\N	0	f	completed	\N	2025-12-29 11:06:39.267	2025-12-29 11:06:39.267
cmk0t4u9k0009gv04iojswd1z	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767596191004-cc71c2c1-IMG_0910.jpeg	IMG_0910.jpeg	image/jpeg	3645581	4032	3024	\N	\N	\N	0	f	completed	\N	2026-01-05 06:56:31.249	2026-01-05 06:56:31.249
cmk22ps9f0014l804efmfa7a4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672751277-55e83d14-Ring-5-8.jpg	Ring 5-8.jpg	image/jpeg	261487	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:12:31.443	2026-01-06 04:12:31.443
cmjr21hy2000fkz04onbgvuen	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006490236-b9f67434-IMG_0773.jpeg	IMG_0773.jpeg	image/jpeg	2346793	2395	3090	\N	\N	\N	0	f	completed	\N	2025-12-29 11:08:10.394	2025-12-29 11:08:10.394
cmjr22qem000kkz04hyomh53e	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006547564-350f577d-IMG_0803.jpeg	IMG_0803.jpeg	image/jpeg	2470204	2199	3180	\N	\N	\N	0	f	completed	\N	2025-12-29 11:09:07.742	2025-12-29 11:09:07.742
cmjr23prw000qkz04r0739fep	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006593485-bcbedd17-IMG_0823.jpeg	IMG_0823.jpeg	image/jpeg	1608535	1912	2700	\N	\N	\N	0	f	completed	\N	2025-12-29 11:09:53.638	2025-12-29 11:09:53.638
cmjr23pvf000rkz04nfugfkvj	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006593887-1fa1ca93-IMG_0828.jpeg	IMG_0828.jpeg	image/jpeg	2029828	2102	2849	\N	\N	\N	0	f	completed	\N	2025-12-29 11:09:53.979	2025-12-29 11:09:53.979
cmjr24026000skz04tyfk9xt2	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006607030-ccd236d9-IMG_0833.jpeg	IMG_0833.jpeg	image/jpeg	1688070	2060	2401	\N	\N	\N	0	f	completed	\N	2025-12-29 11:10:07.183	2025-12-29 11:10:07.183
cmjsaetqx0008jo04d78cb90q	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767081014751-691cc68c-IMG_0841.jpeg	IMG_0841.jpeg	image/jpeg	2440751	2268	4032	\N	\N	\N	0	f	completed	\N	2025-12-30 07:50:15.114	2025-12-30 07:50:15.114
cmjsalwcv0000lg04lk1qvb5u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767081344667-f960c3f7-39046844-6272-4104-ba9c-6443d8c369f0.jpeg	39046844-6272-4104-ba9c-6443d8c369f0.jpeg	image/jpeg	1794527	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-30 07:55:45.061	2025-12-30 07:55:45.061
cmjsalwga0001lg04kxwe62gv	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767081345328-ea45fab6-bab00af6-ec15-4d9b-b87b-2d2d2d5dbe93.jpeg	bab00af6-ec15-4d9b-b87b-2d2d2d5dbe93.jpeg	image/jpeg	1916238	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-30 07:55:45.418	2025-12-30 07:55:45.418
cmjsaf40u0000l104czqy7g6n	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767081028139-75a8778a-IMG_0839.jpeg	IMG_0839.jpeg	image/jpeg	2508956	2268	4032	\N	\N	\N	0	f	failed	fetch failed	2025-12-30 07:50:28.636	2025-12-30 08:15:06.579
cmjr22ef7000jkz04o8sg3rcm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006532386-a4429fa2-IMG_0794.jpeg	IMG_0794.jpeg	image/jpeg	1540952	1988	2329	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:08:52.484	2025-12-30 08:20:16.318
cmjr2356j000nkz04nl9rtpp9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006567073-f6facc16-IMG_0813.jpeg	IMG_0813.jpeg	image/jpeg	1824615	2127	2801	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:09:27.163	2025-12-30 08:18:00.364
cmjsafl8l0002l104v2bjli3b	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767081050733-a146c043-IMG_0840.jpeg	IMG_0840.jpeg	image/jpeg	2669014	4032	3024	\N	\N	\N	0	f	failed	fetch failed	2025-12-30 07:50:50.941	2025-12-30 08:15:39.66
cmjr218cz000ekz04mh4txpz8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006477503-2fd6eb42-IMG_0768.jpeg	IMG_0768.jpeg	image/jpeg	2760666	2199	3419	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:07:57.781	2025-12-30 08:22:22.035
cmjr234ws000mkz04u1jdfaiy	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006566421-feb47107-IMG_0808.jpeg	IMG_0808.jpeg	image/jpeg	1703113	1914	2741	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:09:26.627	2025-12-30 08:18:39.541
cmjr2404w000tkz04bqih2mg9	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006607202-09fea4d8-IMG_0838.jpeg	IMG_0838.jpeg	image/jpeg	1500022	1746	2474	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:10:07.28	2025-12-30 08:18:39.566
cmjr22ebu000ikz049jeqol9h	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006531993-8e203b78-IMG_0788.jpeg	IMG_0788.jpeg	image/jpeg	1076134	1620	1976	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:08:52.154	2025-12-30 08:20:15.758
cmjr22qho000lkz04331ptsl3	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006548039-34ef67a9-IMG_0807.jpeg	IMG_0807.jpeg	image/jpeg	1811270	2149	2782	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:09:08.124	2025-12-30 08:25:21.828
cmjr21w2r000hkz041dwb15b1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006508615-55440c69-IMG_0785.jpeg	IMG_0785.jpeg	image/jpeg	1188278	1762	2235	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:08:28.707	2025-12-30 08:20:16.222
cmjr21vvu000gkz04gj5bpc48	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006508082-04463884-IMG_0782.jpeg	IMG_0782.jpeg	image/jpeg	1343109	1919	2243	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:08:28.258	2025-12-30 08:20:15.76
cmjr23g2h000pkz04r01nd1ov	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006581137-8a2e67cf-IMG_0818.jpeg	IMG_0818.jpeg	image/jpeg	1294708	1684	2440	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:09:41.273	2025-12-30 08:22:21.815
cmjr23fsz000okz0451qpya6u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006580763-7584748d-IMG_0815.jpeg	IMG_0815.jpeg	image/jpeg	1954476	2068	3080	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:09:40.931	2025-12-30 08:22:21.976
cmjr1zjjg000akz04azeacgw8	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767006398588-2ba21214-IMG_0764.jpeg	IMG_0764.jpeg	image/jpeg	1612861	1938	2812	\N	\N	\N	0	f	failed	fetch failed	2025-12-29 11:06:38.753	2025-12-30 08:23:42.213
cmk3ub7ep0000js0465a29lqf	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767779566307-38d694ba-Combo-1-1.jpg	Combo 1 (1).jpg	image/jpeg	521492	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 09:52:46.658	2026-01-07 09:52:46.658
cmjtlq3sp0001l80468y2rri4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767160483322-fc71c3f8-IMG_0883.jpeg	IMG_0883.jpeg	image/jpeg	3341776	3896	2922	\N	\N	\N	0	f	completed	\N	2025-12-31 05:54:43.513	2025-12-31 05:54:43.513
cmjtlpumc0000l804zbmrw43t	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767160470980-7ab01952-IMG_0884.jpeg	IMG_0884.jpeg	image/jpeg	3399725	4032	3024	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 05:54:31.401	2025-12-31 05:57:10.078
cmjtm3p6q0001l204ta10rzk1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161117649-0916bd84-48cb37bc-fe26-4b42-b500-93d8afd70133.jpeg	48cb37bc-fe26-4b42-b500-93d8afd70133.jpeg	image/jpeg	429770	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:17.762	2025-12-31 07:31:19.365
cmjtm501c0006l204kiwwiitb	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161178178-467aaac1-8b41c698-945f-4e60-b36b-29fb1d522a06.jpeg	8b41c698-945f-4e60-b36b-29fb1d522a06.jpeg	image/jpeg	399279	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:06:18.282	2025-12-31 06:06:18.282
cmjtm503x0007l204dq6vvasm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161178505-1921e59a-425f62d0-52ad-480c-b687-390e0f5aac6d.jpeg	425f62d0-52ad-480c-b687-390e0f5aac6d.jpeg	image/jpeg	403302	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:06:18.573	2025-12-31 06:06:18.573
cmjtm6dy80008l204sy13ecjc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161242764-96dc9a22-50a46296-ced3-4230-adc3-b20e984ff85d.jpeg	50a46296-ced3-4230-adc3-b20e984ff85d.jpeg	image/jpeg	416608	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:07:22.953	2025-12-31 06:07:22.953
cmjtm6e3p000al2047dswmibt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161243294-c3c14e78-04fa052b-768a-4cad-b35c-f3985b4dbbfd.jpeg	04fa052b-768a-4cad-b35c-f3985b4dbbfd.jpeg	image/jpeg	337335	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:07:23.365	2025-12-31 06:07:23.365
cmjtm884z000bl204rxgkqrzd	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161328558-bb9cd409-a4d6fc89-003a-4e27-bd25-27095db59d74.jpeg	a4d6fc89-003a-4e27-bd25-27095db59d74.jpeg	image/jpeg	340833	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:08:48.735	2025-12-31 06:08:48.735
cmjtm888f000cl204ouquv7mo	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161328973-a7871f6c-a572237d-cc85-4d3d-a2ea-8b8c1d5bad1d.jpeg	a572237d-cc85-4d3d-a2ea-8b8c1d5bad1d.jpeg	image/jpeg	351056	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 06:08:49.071	2025-12-31 06:08:49.071
cmk0tdr7n0000l204xyiw78ai	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767596607118-d8c75613-Red-studs.jpg	Red studs.jpg	image/jpeg	315782	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-05 07:03:27.491	2026-01-05 07:03:27.491
cmjtm6e1g0009l204mewqyxru	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161243196-ca91bc81-6afdcc71-3ce8-4467-bd74-47cb4cf6f4e6.jpeg	6afdcc71-3ce8-4467-bd74-47cb4cf6f4e6.jpeg	image/jpeg	365108	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:07:23.284	2025-12-31 11:53:17.625
cmjtnaudp0000jr04mym5zqmk	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767163129888-5cc99eb1-Necklace.heif	Necklace.heif	image/heif	1630805	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 06:38:50.255	2025-12-31 06:38:50.255
cmjtm476w0003l2043s825vew	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161141006-0a1a1bd4-5e9ad196-338d-4745-86c9-437da154edc1.jpeg	5e9ad196-338d-4745-86c9-437da154edc1.jpeg	image/jpeg	387453	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:41.096	2025-12-31 07:03:16.934
cmjuxk5rh0000l40473fcxinc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767240827137-1f206fdc-Necklace-1-1-26.jpg	Necklace 1-1-26.jpg	image/jpeg	583865	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-01 04:13:47.492	2026-01-01 04:13:47.492
cmjtowos3000yjj04vp64vyhz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767165828853-6b3e128a-Necklace.jpg	Necklace.jpg	image/jpeg	563796	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 07:23:49.228	2025-12-31 07:23:49.228
cmjtm473z0002l2040kbxxxx6	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161140868-2e13b745-ed589d13-26f3-4397-8e71-c29ebe1ae638.jpeg	ed589d13-26f3-4397-8e71-c29ebe1ae638.jpeg	image/jpeg	453196	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:40.981	2025-12-31 06:59:39.754
cmjtozogf000yjl04cm40u2qs	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767165968486-133407dd-2b05558e-967b-4e1b-9d3e-de7952120833.jpeg	2b05558e-967b-4e1b-9d3e-de7952120833.jpeg	image/jpeg	371775	1598	1200	\N	\N	\N	0	f	completed	\N	2025-12-31 07:26:08.836	2025-12-31 07:26:08.836
cmjtm4l3b0004l204lkx55unm	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161158808-d1993f35-83551f04-039d-4524-8bea-f156a7899b8c.jpeg	83551f04-039d-4524-8bea-f156a7899b8c.jpeg	image/jpeg	426033	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:58.907	2025-12-31 07:02:06.391
cmk22t66v000cl4042ysayspt	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767672909081-6540ab8c-Ring-5-9.jpg	Ring 5-9.jpg	image/jpeg	252898	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:15:09.261	2026-01-06 04:15:09.261
cmjtm4l6f0005l2048co8qugl	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161159139-40b9c046-44fc99d8-c9c6-420e-be98-8f070f031e86.jpeg	44fc99d8-c9c6-420e-be98-8f070f031e86.jpeg	image/jpeg	383084	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:59.223	2025-12-31 07:02:41.202
cmjv0bros0001jr04wl0w9i2s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767245474536-7ca235f0-Kempu-necklace-1-1-26-1.jpg	Kempu necklace 1-1-26 -1.jpg	image/jpeg	446706	2812	3750	\N	\N	\N	0	f	completed	\N	2026-01-01 05:31:14.708	2026-01-01 05:31:14.708
cmjtm3g1k0000l2045r9k4056	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767161105372-e8d99f5c-f5f97977-b6cb-4b73-8f49-47b736ce77bc.jpeg	f5f97977-b6cb-4b73-8f49-47b736ce77bc.jpeg	image/jpeg	335324	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2025-12-31 06:05:05.703	2025-12-31 07:32:33.221
cmjtp8h69000ejp04yi98cix4	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767166379185-91ea0784-Necklace-2.jpg	Necklace 2.jpg	image/jpeg	537741	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 07:32:59.497	2025-12-31 07:32:59.497
cmjtujvo30000l704gux5sp3u	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767175309020-2e1f1d86-Haram-1.jpg	Haram  (1).jpg	image/jpeg	567433	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 10:01:49.383	2025-12-31 10:01:49.383
cmjtv2r3j0000l804kmr8q93r	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767176189451-327a7437-Haram-2.jpg	Haram 2.jpg	image/jpeg	583314	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 10:16:29.812	2025-12-31 10:16:29.812
cmjtvmev90001l804c4fdzblo	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767177106975-1d343a1e-Necklace-3.jpg	Necklace 3.jpg	image/jpeg	592525	3024	4032	\N	\N	\N	0	f	completed	\N	2025-12-31 10:31:47.187	2025-12-31 10:31:47.187
cmjv2u2dd0009lb041gau6o3k	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767249687544-82cadb3d-Balaji-chain-green.jpg	Balaji chain green.jpg	image/jpeg	339178	2596	3461	\N	\N	\N	0	f	completed	\N	2026-01-01 06:41:27.721	2026-01-01 06:41:27.721
cmjv2khob0000lb04e68pfp96	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767249240628-88e1af0a-Balaji-chain-red.jpg	Balaji chain red.jpg	image/jpeg	370550	2715	3620	\N	\N	\N	0	f	completed	\N	2026-01-01 06:34:00.991	2026-01-01 06:34:00.991
cmjv2zhg60000lc04pyqzfnun	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767249940222-75c35446-Multi-necklace-1-1-26-2.jpg	Multi necklace 1-1-26-2.jpg	image/jpeg	481359	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-01 06:45:40.558	2026-01-01 06:45:40.558
cmjv3sonk0000kw04yg19tuh1	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767251302507-d2fc7b67-Necklace-3-1.jpg	Necklace 3 (1).jpg	image/jpeg	474370	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-01 07:08:22.867	2026-01-01 07:08:22.867
cmjv5ieky0001kw0445lutje0	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767254182163-33428255-Short-chain-1-1-26-3.jpg	Short chain 1-1-26-3.jpg	image/jpeg	517542	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-01 07:56:22.428	2026-01-01 07:56:22.428
cmjwch6oq0000l704hdjt3pld	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767326348747-efbe4941-Green-neck.jpg	Green neck .jpg	image/jpeg	603018	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-02 03:59:09.123	2026-01-02 03:59:09.123
cmk0rt3lj0004kt04gm3s2ihc	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767593964060-81c6e25b-a4085120-8ba2-452c-8f89-6bacac100317.jpeg	a4085120-8ba2-452c-8f89-6bacac100317.jpeg	image/jpeg	320508	1598	1200	\N	\N	\N	0	f	failed	fetch failed	2026-01-05 06:19:24.151	2026-01-05 07:05:24.956
cmk22yb64001dl804oxiatt4l	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767673149037-501625a8-Ring-5-10.jpg	Ring 5-10.jpg	image/jpeg	237619	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-06 04:19:09.196	2026-01-06 04:19:09.196
cmk3xu5wc0000js04l2aeohgz	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767785489665-5c2487fe-Green-balls.jpg	Green balls.jpg	image/jpeg	566484	3024	4032	\N	\N	\N	0	f	completed	\N	2026-01-07 11:31:30.013	2026-01-07 11:31:30.013
cmjv5r8nr0000jo04vp3mnn6s	\N	image	clients/cmg1srt900001l5049x26l2cp/media/general/image/l2cp-general-image-1767254594382-8ffd2910-Red-neck.jpg	Red neck.jpg	image/jpeg	582028	3024	4032	\N	\N	\N	0	f	failed	fetch failed	2026-01-01 08:03:14.761	2026-01-02 04:19:51.064
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, "orderId", "productId", "productName", "productSku", price, quantity, subtotal, "createdAt") FROM stdin;
cmjtw5mu0000bl8048wpgxasy	cmjtw5mu00009l8047nkto0kr	cmi1va3vp0001kt040b4c9hhv	1 gram bangles primiam quality 	Bangles -  85	625.00	1	625.00	2025-12-31 10:46:44.185
cmjtx5jed0007l204mwdbn148	cmjtx5jed0005l204a13f224h	cmi1ur4uy0001ju04q2ovbxwi	1 gram bangles primiam quality.	Banglse - 85	625.00	1	625.00	2025-12-31 11:14:39.349
cmjtx5jed0008l204bdbwv2sx	cmjtx5jed0005l204a13f224h	cmjgv6a4d0001ih04eb0i7ven	 3 STEP CHANDRA HARAM PREMIUM QUALITY 	3 STEP CHAIN-40	360.00	1	360.00	2025-12-31 11:14:39.349
cmjtx6ppt0003le046dilgbgt	cmjtx6ppt0001le04mo09tk3b	cmjgv6a4d0001ih04eb0i7ven	 3 STEP CHANDRA HARAM PREMIUM QUALITY 	3 STEP CHAIN-40	360.00	1	360.00	2025-12-31 11:15:34.193
cmjty7pp70003jm0401kbqd8u	cmjty7pp70001jm04eibvdgcj	cmi1vpqki000vk0045nskax3p	 Matt primium nackles 	Nackles - 252	1590.00	1	1590.00	2025-12-31 11:44:20.443
cmjzxrbne0003la04lppck4fv	cmjzxrbne0001la04eqykfitj	cmiyiivm20009jv04fkbv8tfl	CZ BLACK BEADS 24"INCHES 	BLACK BEAT-63	499.00	1	499.00	2026-01-04 16:18:12.794
cmk2i4gsv0004jv04iqhfooou	cmk2i4gsu0002jv04l2xzt2ub	cmishpz7t000hlb0479yzcqnq	GOLD REPLICA MAT PREMIUM QUALITY NECKLACE 	NECKLACE -153	1030.00	1	1030.00	2026-01-06 11:23:50.671
cmk5pgqh60003jl040c4gmd0v	cmk5pgqh60001jl04rmv6x4dq	cmk0sb0ec0001k104gz0kpd9m	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI -BI-107	760.00	1	760.00	2026-01-08 17:12:38.922
cmk5pgqh60004jl04d9haoi9i	cmk5pgqh60001jl04rmv6x4dq	cmjtnlto60001jl04rcv1k31v	THALI CHAIN PREMIUM QUALITY 	CHAIN-33	330.00	1	330.00	2026-01-08 17:12:38.922
cmk7t93rl0003l5048soa5n7q	cmk7t93rk0001l504kjgrxiwv	cmjmj4jkx000mjr04jmtfcny9	CZ JADA PREMIUM QUALITY 	CZ JADA-85	630.00	1	630.00	2026-01-10 04:34:13.713
cmk7t93rl0004l504ucngmul5	cmk7t93rk0001l504kjgrxiwv	cmji9a8090009kz04e15uul13	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-308	1950.00	1	1950.00	2026-01-10 04:34:13.713
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, "orderNumber", "clientId", status, "customerName", "customerEmail", "customerPhone", "shippingAddress", "billingAddress", notes, subtotal, tax, shipping, total, "createdAt", "updatedAt", "paymentUTR", "paymentTransactionNumber", "paymentProofUrl") FROM stdin;
cmjtx5jed0005l204a13f224h	ORD-MJTX5J7E-KHU6	cmg1srt900001l5049x26l2cp	CANCELLED	Karthik Dintakurthi		9948660666	{"city": "Hyderabad", "state": "Telangana", "country": "India", "zipCode": "500084", "lastName": "Dintakurthi", "firstName": "Karthik", "addressLine1": "G1602, Aparna Serene Park", "addressLine2": "Kodapur"}	{"city": "Hyderabad", "email": "", "phone": "9948660666", "state": "Telangana", "country": "India", "zipCode": "500084", "lastName": "Dintakurthi", "firstName": "Karthik", "addressLine1": "G1602, Aparna Serene Park", "addressLine2": "Kodapur"}	Pls speed post	985.00	0.00	0.00	985.00	2025-12-31 11:14:39.349	2025-12-31 11:16:41.973	\N	\N	\N
cmjtx6ppt0001le04mo09tk3b	ORD-MJTX6PIU-G8LK	cmg1srt900001l5049x26l2cp	CANCELLED	KN Collections		9701202706	{"city": "Krishna", "state": "Andhra Pradesh", "country": "India", "zipCode": "521001", "lastName": "", "firstName": "KN Collections", "addressLine1": "7/364, Godugupet", "addressLine2": "Machilipatnam"}	{"city": "Krishna", "email": "", "phone": "9701202706", "state": "Andhra Pradesh", "country": "India", "zipCode": "521001", "lastName": "", "firstName": "KN Collections", "addressLine1": "7/364, Godugupet", "addressLine2": "Machilipatnam"}	\N	360.00	0.00	0.00	360.00	2025-12-31 11:15:34.193	2025-12-31 11:17:01.159	\N	\N	\N
cmjtw5mu00009l8047nkto0kr	ORD-MJTW5MT6-JJNF	cmg1srt900001l5049x26l2cp	CANCELLED	Testing Dintakurthi	d.karthiknaidu@gmail.com	9948660666	{"city": "Hyderabad", "state": "Telangana", "country": "India", "zipCode": "500084", "lastName": "Dintakurthi", "firstName": "Testing", "addressLine1": "F.no 402, Sri Balaji Pride, Sriram Nagar Colony", "addressLine2": "Street 10, B block, Kondapur"}	{"city": "Hyderabad", "email": "d.karthiknaidu@gmail.com", "phone": "9948660666", "state": "Telangana", "country": "India", "zipCode": "500084", "lastName": "Dintakurthi", "firstName": "Testing", "addressLine1": "F.no 402, Sri Balaji Pride, Sriram Nagar Colony", "addressLine2": "Street 10, B block, Kondapur"}	order testing	625.00	0.00	0.00	625.00	2025-12-31 10:46:44.185	2025-12-31 11:07:38.405	12323	123123	clients/cmg1srt900001l5049x26l2cp/orders/ORD-MJTW5MT6-JJNF/payment-proof/payment-proof-ORD-MJTW5MT6-JJNF-1767179184241.png
cmjty7pp70001jm04eibvdgcj	ORD-MJTY7PI9-3GZN	cmg1srt900001l5049x26l2cp	CANCELLED	Vishal  .	vishal.dhanikonda@gmail.com	8143199958	{"city": "Vijayawada ", "state": "Andhra Pradesh", "country": "India", "zipCode": "516329", "lastName": ".", "firstName": "Vishal ", "addressLine1": "Yoshita ..", "addressLine2": "Basant road"}	{"city": "Vijayawada ", "email": "vishal.dhanikonda@gmail.com", "phone": "8143199958", "state": "Andhra Pradesh", "country": "India", "zipCode": "516329", "lastName": ".", "firstName": "Vishal ", "addressLine1": "Yoshita ..", "addressLine2": "Basant road"}	\N	1590.00	0.00	0.00	1590.00	2025-12-31 11:44:20.443	2025-12-31 11:48:41.744	\N	\N	\N
cmjzxrbne0001la04eqykfitj	ORD-MJZXRBMI-AC1A	cmg1srt900001l5049x26l2cp	PENDING	Naresh  Bhatia	nareshbatiya869@gmail.com	6304757929	{"city": "Kadapa ", "state": "Andhra Pradesh ", "country": "India", "zipCode": "516004", "lastName": "Bhatia", "firstName": "Naresh ", "addressLine1": "Walkaroo foot wear company ", "addressLine2": "Industrial estate, rims road "}	{"city": "Kadapa ", "email": "nareshbatiya869@gmail.com", "phone": "6304757929", "state": "Andhra Pradesh ", "country": "India", "zipCode": "516004", "lastName": "Bhatia", "firstName": "Naresh ", "addressLine1": "Walkaroo foot wear company ", "addressLine2": "Industrial estate, rims road "}	\N	499.00	0.00	0.00	499.00	2026-01-04 16:18:12.794	2026-01-04 16:18:12.794	\N	\N	\N
cmk2i4gsu0002jv04l2xzt2ub	ORD-MK2I4GHF-UAUO	cmg1srt900001l5049x26l2cp	DELIVERED	Jhilik Haldar		91177330987	{"city": "Chennai ", "state": "Tamil nadu", "country": "India", "zipCode": "600044", "lastName": "Haldar", "firstName": "Jhilik", "addressLine1": "Door no.7/4 ,Indira Gandhi main streey", "addressLine2": "Radha nagarchrompet Chennai Tamil Nadu 600044"}	{"city": "Chennai ", "email": "", "phone": "91177330987", "state": "Tamil nadu", "country": "India", "zipCode": "600044", "lastName": "Haldar", "firstName": "Jhilik", "addressLine1": "Door no.7/4 ,Indira Gandhi main streey", "addressLine2": "Radha nagarchrompet Chennai Tamil Nadu 600044"}	\N	1030.00	0.00	0.00	1030.00	2026-01-06 11:23:50.671	2026-01-08 06:13:35.801	\N	\N	\N
cmk5pgqh60001jl04rmv6x4dq	ORD-MK5PGQ9S-KVYS	cmg1srt900001l5049x26l2cp	PENDING	Jyothsna 		9121671521	{"city": "P.kannapuram", "state": "Andhra Pradesh ", "country": "India", "zipCode": "534401", "lastName": "", "firstName": "Jyothsna ", "addressLine1": "1-99 near old school ", "addressLine2": ""}	{"city": "P.kannapuram", "email": "", "phone": "9121671521", "state": "Andhra Pradesh ", "country": "India", "zipCode": "534401", "lastName": "", "firstName": "Jyothsna ", "addressLine1": "1-99 near old school ", "addressLine2": ""}	\N	1090.00	0.00	0.00	1090.00	2026-01-08 17:12:38.922	2026-01-08 17:12:38.922	\N	\N	\N
cmk7t93rk0001l504kjgrxiwv	ORD-MK7T93IR-3AFL	cmg1srt900001l5049x26l2cp	CONFIRMED	Gayathri  Murugavel 	gayathrimurugavel305@gmail.com	9148446501	{"city": "Bengaluru ", "phone": "9148446501", "state": "Karnataka ", "country": "India", "zipCode": "560043", "lastName": "Murugavel ", "firstName": "Gayathri ", "addressLine1": "SV paradise no:88 flat no 203 3rd floor ,4th cross, behind East point school, PNS layout, Kalyan nagar", "addressLine2": " Kamanahalli om Shakthi temple"}	{"city": "Bengaluru ", "email": "gayathrimurugavel305@gmail.com", "phone": "9148446501", "state": "Karnataka ", "country": "India", "zipCode": "560043", "lastName": "Murugavel ", "firstName": "Gayathri ", "addressLine1": "SV paradise no:88 flat no 203 3rd floor ,4th cross, behind East point school, PNS layout, Kalyan nagar Bengaluru-560043,Kamanahalli om Shakthi temple", "addressLine2": "SV paradise no:88 flat no 203 3rd floor ,4th cross, behind East point school, PNS layout, Kalyan nagar Bengaluru-560043,Kamanahalli om Shakthi temple"}	\N	2580.00	0.00	0.00	2580.00	2026-01-10 04:34:13.713	2026-01-10 12:56:03.309	\N	\N	\N
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.performance_metrics (id, url, "timestamp", fcp, lcp, fid, cls, ttfb, fmp, tti, "userAgent", "connectionType", "deviceMemory", "hardwareConcurrency", "createdAt") FROM stdin;
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_categories (id, "productId", "categoryId", "createdAt") FROM stdin;
cmix175lz0026kz043v1nm8uh	cmiwzsei5000ykz04dc9yp1ud	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:51:29.447
cmix1qcwz003ekz04jgh7etli	cmiwzb0ei000bk304zhdiug18	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:06:25.379
cmiyb209u000hjs04izq88frk	cmiyb209u000fjs04u8y05yo6	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:15:11.586
cmiyc6tsk000bjr04h9cmkwv8	cmiyc6tsj0009jr04qxccoypf	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:46:56.084
cmiyc86m7000hjr04b5uc3fto	cmiybyvw6000jl804usz052ug	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:47:59.36
cmiycb0rs000pjr049t3pr0wy	cmiycb0rs000njr04p1oejn2e	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:50:11.752
cmiyj2fuu000bjx042zt15d4m	cmiyj2fuu0009jx047ac3ny48	cmhgcpq4f0001l10491v94f1j	2025-12-09 11:59:28.71
cmiztw6fm0003jx043974hlzt	cmiztw6fm0001jx045mgbe7wn	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 09:50:18.514
cmizuloym000rjx04mc6yr2da	cmizuloym000pjx04ky7ewg7t	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:10:08.927
cmizwfoqs0003l804rdt1sx08	cmizwfoqs0001l804clgfaweq	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:01:27.94
cmizxgz5x000bl204pvf1np56	cmizxgz5x0009l2041cpwyird	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:30:27.717
cmizz6bo20003jy04sgwcd0ku	cmizz6bo20001jy04fhjeap5n	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 12:18:09.938
cmj191q4k0003l5045xmo68gf	cmj191q4j0001l504vqd4658n	cmg5f33zu0001l804s1wrqr5t	2025-12-11 09:42:17.732
cmj19y2ak0003ld046gfsf15v	cmj19y2ak0001ld04knippgnd	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:07:26.493
cmj1bg8pp000tld04sb9rji16	cmj1954vl0001jv04teoxuvj1	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:49:34.237
cmhiyvlbi0003la04b7m4ypf7	cmhiyvlbh0001la045johq640	cmhgkplzd0005js04tn9fghob	2025-11-03 09:58:01.902
cmj2uliok001ele042s5k8py1	cmj2ulioj001cle04pkvi7iot	cmhgkntwx0001ib04a4y9dxou	2025-12-12 12:33:19.316
cmj6uo0u70003le04fo2af6n7	cmj6uo0u70001le04rtcrxs2v	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 07:46:20.863
cmj85gbkc0003jl046j0qcs7y	cmj85gbkc0001jl04um7cx0lc	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 05:36:03.468
cmj8b6gbp0003jo046f2x39up	cmj8b6gbp0001jo04k30qq3zd	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 08:16:20.773
cmj9u58qx0001jv04hw6yu9v3	cmj9tcu400001l104aoig665o	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:55:03.177
cmj9u9lbu0007jv041vpogxrz	cmj9tgrr20007l804x8t834jb	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:58:26.106
cmj9uxp09000nl104h6grqwwd	cmj9tl56y0001l4043enqfgt8	cmhgknb5p0001js04qvasnpzo	2025-12-17 10:17:10.617
cmjb3zn6j0003jr04et6np5e3	cmjb3zn6i0001jr04deeirohk	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:18:24.283
cmjb5577u000gkw04cak6or9a	cmjb5577u000ekw04kt9440e5	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:50:43.147
cmjb68b3i000jie04y4dcvr2l	cmjb68b3i000hie04y29949g0	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:21:07.759
cmjcgvm610003k104dmp77j70	cmjcgvm610001k10496673wsi	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:06:57.529
cmjci8gcb0003js04mrcqdhok	cmjci8gcb0001js04vyuwhdxd	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:44:56.123
cmjcjpmgg0003ji04zzi6c0dl	cmjcjpmgf0001ji04oqe4aygh	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 07:26:16.816
cmjguwa7u000ijo049t1upf42	cmjguwa7u000gjo04d4sks137	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:50:28.026
cmji8fyvc0003kw04rzfm4jkw	cmji8fyvc0001kw04fnt0law6	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 06:57:27.624
cmji8z610000tkz04lknvn7ej	cmji8z610000rkz04dkma3mhh	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:12:23.364
cmji9a809000bkz043o731y6s	cmji9a8090009kz04e15uul13	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:20:59.146
cmjjook2t000dkt04992vcvbc	cmjjook2t000bkt04wg6oqo5y	cmih9kzf70001i904tu7iuf6z	2025-12-24 07:19:48.389
cmjjrddxa0003l704ztp9ifxc	cmjjrddxa0001l70489frh9xg	cmg5f3d7o0003l804vmxh5d2y	2025-12-24 08:35:06.046
cmjjyflvy0003l404811hclgn	cmjjyflvy0001l4041djfubuw	cmhgkplzd0005js04tn9fghob	2025-12-24 11:52:46.991
cmjjyzc7f0003kz049smd18bb	cmjjyzc7f0001kz04iotkptss	cmhgkplzd0005js04tn9fghob	2025-12-24 12:08:07.563
cmjl3q1kz0009jm04j28zu85r	cmjl3jwdq0001jm04kocjalgg	cmi9zuxwu000dl404up390ywb	2025-12-25 07:08:38.148
cmjl4pdf60007l204w49w1cdm	cmjl4k6w10009ks04hps5omnq	cmi9zuxwu000dl404up390ywb	2025-12-25 07:36:06.45
cmjl50ck2000xks04fr4j85sf	cmjl50ck1000vks04rg1ovash	cmi9zuxwu000dl404up390ywb	2025-12-25 07:44:38.546
cmjl5or8o0009jl04249f9pf3	cmjl4sp46000hks046gcg5fy0	cmi9zuxwu000dl404up390ywb	2025-12-25 08:03:37.32
cmjmiqlzs0001k004ou38w1af	cmjmiiv9k0006jr04vbtcud68	cmhgkox8n0003ib0427athu89	2025-12-26 06:56:45.017
cmjnwaxay0003l704ji2z6bzi	cmjnwaxay0001l704hsxh6ii2	cmictwptb0001l2041xf5mh56	2025-12-27 06:04:13.978
cmjnx3rb90005jz04h62568wo	cmjnx3rb90003jz04imm7k71j	cmictwptb0001l2041xf5mh56	2025-12-27 06:26:39.237
cmjnybz7g0003l704j0puqocw	cmjnybz7g0001l7044288boh8	cmih992ry0001la04z66nrpok	2025-12-27 07:01:02.332
cmjo12p160003jl0438h079df	cmjo12p160001jl04bf7gx0xq	cmjo0ynz8000al704riezevpo	2025-12-27 08:17:48.09
cmjo1cdsr000el704kbrnt3br	cmjo1cdsr000cl7042ijbpvrc	cmjo0ynz8000al704riezevpo	2025-12-27 08:25:20.091
cmjqtpejk000ble04w28cpmy2	cmjqtpejk0009le04v6s3ukku	cmjqt79cq0001l4049v3q222u	2025-12-29 07:14:49.184
cmjqu0how000dl404m407mq46	cmjqu0how000bl4044wnewdsd	cmjqt79cq0001l4049v3q222u	2025-12-29 07:23:26.48
cmjs93htq000vl9040v1p6zxw	cmjs93htq000tl904jr4lb1tf	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:13:27.038
cmjsa11gb0003jo04thpro3qt	cmjsa11gb0001jo04ctf4nom4	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:39:32.123
cmjsabie4000pl5047c2z4vol	cmjsabie4000nl5047neriisy	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:47:40.636
cmjsbbgt4000sl104w16rczsd	cmjsb7u190003lg04ks3wxxe8	cmitygf3c0001jl0465c0k3t9	2025-12-30 08:15:38.2
cmjsbk3gu000lla04u2eovzqx	cmjs9ddzv0009l7040uzoq6md	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:22:20.814
cmjtnoakf000jjj046l6txqmi	cmjtnoakf000hjj049jqsvnrn	cmi71914t0001l704tgh2kfn8	2025-12-31 06:49:18.207
cmjto1l6b000fjl04j5nxsu42	cmjtmpg5z0007jr04a33uj4ud	cmi71914t0001l704tgh2kfn8	2025-12-31 06:59:38.484
cmjtog8g1000kjr04tdya4cwn	cmjtog8g1000ijr04r10x2m7o	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 07:11:01.825
cmjtoxolk000tjl04mfs5itkc	cmjtoxolk000rjl04mgo14jw4	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 07:24:35.913
cmjtp7vua0009jp04idx59n7a	cmjtmdpvo000fl204u309ut89	cmi71914t0001l704tgh2kfn8	2025-12-31 07:32:31.858
cmjtp9u90000sjp04tkg69fcl	cmiabha3b000hlb04uca1j0qb	cmi71914t0001l704tgh2kfn8	2025-12-31 07:34:03.108
cmjtpb48w0007l204tozsqqwz	cmiabp5do000plb04qiw2ivv5	cmi71914t0001l704tgh2kfn8	2025-12-31 07:35:02.72
cmjtpf62g001ejj040jxsc5h1	cmjtpf62g001cjj04w7160ys8	cmg5f33zu0001l804s1wrqr5t	2025-12-31 07:38:11.704
cmjtupa6w0004l7047sl1x7ku	cmjtupa6w0002l704hn7sr0p9	cmho3fsxp0001ju04hzwllaw8	2025-12-31 10:06:01.689
cmjtvvdux0005l804rowm0ya6	cmjtvvdux0003l8042si4fiqt	cmhgknb5p0001js04qvasnpzo	2025-12-31 10:38:45.993
cmjuxrysv0003l504srs4jo0h	cmjuxrysv0001l504lhrbodsw	cmht6sb1g0001js041506z3hz	2026-01-01 04:19:51.919
cmid3b8y20003ky04nrdsu1o8	cmid3b8y10001ky041oqfpu1g	cmhgd8l2q0004ky04uwi0a2pv	2025-11-24 11:55:16.106
cmiwr03l60003l704w7lo476v	cmiwr03l60001l704ithbg3pv	cmhgkoax60003js04bp3l0c36	2025-12-08 06:06:04.074
cmiwzolz7000skz04v8gnq49k	cmiwzolz7000qkz04bg36n1ef	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:09:04.579
cmid3qazo000bld04hftsyjz9	cmid3qazo0009ld04qjijkzd2	cmg5f3d7o0003l804vmxh5d2y	2025-11-24 12:06:58.596
cmix1lcua0027jm04rwchgqjd	cmix074qv001mkz04rx4o0i64	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:02:32.002
cmiybazux0003l804z30vesyk	cmiybazux0001l804998w52hb	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:22:10.953
cmiyjcmsg0003jj04ag0t3cfx	cmiyjcmsg0001jj04sctno10h	cmhgcpq4f0001l10491v94f1j	2025-12-09 12:07:24.256
cmizuowmb000bjo045dsk2svz	cmizuowmb0009jo04zln9bc1h	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:12:38.82
cmizwkd3m0003jp04obu9vwt1	cmizwkd3m0001jp0466f99oue	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:05:06.13
cmj1a3gap000xl504x3bngpe0	cmj1a3gap000vl504g82yuqhm	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:11:37.921
cmj2ssgso0003jr04fk1z3hut	cmj2ssgso0001jr042y4xkjyr	cmj2snjep0001le04djqr3fqd	2025-12-12 11:42:44.232
cmj2thqyu000ole04twuiccu7	cmj2tghea000ele04orwgqrfg	cmitygf3c0001jl0465c0k3t9	2025-12-12 12:02:23.814
cmj2v1kr70003l104kv427ph3	cmj2v1kr70001l104133vk53b	cmht6sb1g0001js041506z3hz	2025-12-12 12:45:48.499
cmj6uqw3r000oi804wk2y7zw9	cmj6uqw3r000mi804n2xdqxeq	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 07:48:34.695
cmj85jyca0003jm04rqivoc2y	cmj85jyca0001jm04xw0av2n4	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 05:38:52.954
cmie6g1e20003jg04l1ddybw0	cmie6g1e20001jg04v7j9fx1d	cmg5f3d7o0003l804vmxh5d2y	2025-11-25 06:10:44.618
cmieh2t1e0003l404iggfrgya	cmieh2t1e0001l404chnd2ien	cmhgkr6uf0003l804bzsy4f16	2025-11-25 11:08:23.042
cmiehg73m0003kz04xxt8crz5	cmiehg73m0001kz04fkg2pt90	cmhgkr6uf0003l804bzsy4f16	2025-11-25 11:18:47.794
cmifnxnl50003jr0420g15x0r	cmifnxnl50001jr04om6aohjs	cmhgd8l2q0004ky04uwi0a2pv	2025-11-26 07:08:06.185
cmjb2kh5r0003jr04n4qd3iha	cmjb2kh5q0001jr04ck2wo6p6	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 06:38:37.023
cmjb41isn000gjr04nszhssai	cmjb41isn000ejr04dmv3ny4k	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:19:51.911
cmjb57ra0000bjm04dx6y31en	cmjb57ra00009jm04tryz3oju	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:52:42.457
cmjcgxaiy0003ky0481rg5e00	cmjcgxaiy0001ky041a89u8ep	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:08:15.754
cmjcial900008ib04yln8j1i5	cmjcial900006ib04melolbmn	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:46:35.796
cmjcjtl5j000xl204tntclvmh	cmjcjtl5j000vl204wzc6bmnr	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 07:29:21.751
cmjguyc010003i1047n6gl90i	cmjguyc010001i104y5e30pcr	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:52:03.649
cmji8jdpw000dkz04wov89nl0	cmji8jdpw000bkz04pmmgnx1y	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:00:06.837
cmji91ueg0003kw04u3uqssqw	cmji91ueg0001kw0447gr2wq4	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:14:28.265
cmjjocom20003kt04d5p1l70i	cmjjocom20001kt04c4pbtpqr	cmht6sb1g0001js041506z3hz	2025-12-24 07:10:34.395
cmjjorw4u0003lb044cdqmn40	cmjjorw4u0001lb04kh2xte2s	cmitygf3c0001jl0465c0k3t9	2025-12-24 07:22:23.982
cmjjy34gs0003i204fthvts37	cmjjy34gs0001i204jpoc69uf	cmhgkplzd0005js04tn9fghob	2025-12-24 11:43:04.54
cmjjyizmq0003l304rupwfbxw	cmjjyizmp0001l304dcxortjl	cmhgkplzd0005js04tn9fghob	2025-12-24 11:55:24.77
cmjjz3hao000bl304mq1v853j	cmjjz3hao0009l3045y4nqoeq	cmhgkplzd0005js04tn9fghob	2025-12-24 12:11:20.784
cmjl3o8rm0003kz0400ub8wwk	cmjl3o8rm0001kz0467mz3iva	cmi9zuxwu000dl404up390ywb	2025-12-25 07:07:14.146
cmjl4dwku0001l204qnnlvulf	cmjl473mp0001ks043muuh9ce	cmi9zuxwu000dl404up390ywb	2025-12-25 07:27:11.406
cmjl55oag0003jw04lp1b39rv	cmjl55oag0001jw04ubz2icjn	cmi9zuxwu000dl404up390ywb	2025-12-25 07:48:47.031
cmjl5scwj0003ky04rxbtn3br	cmjl5scwi0001ky040idt0vh6	cmi9zuxwu000dl404up390ywb	2025-12-25 08:06:25.363
cmjmisu7v000gjr042r3d8nkf	cmjmisu7v000ejr04xb7t80g0	cmhgkox8n0003ib0427athu89	2025-12-26 06:58:28.987
cmjnwd3hy0003jj042846bzc7	cmjnwd3hy0001jj04k1z9fj65	cmictwptb0001l2041xf5mh56	2025-12-27 06:05:55.319
cmjnx5oie0003la04d1zmd5ef	cmjnx5oie0001la042cm9pcti	cmictwptb0001l2041xf5mh56	2025-12-27 06:28:08.918
cmjnydvs60003lb041r5hr3kw	cmjnydvs60001lb04mes6ro5n	cmih992ry0001la04z66nrpok	2025-12-27 07:02:31.206
cmjo14s840003l404lpbjb5wq	cmjo14s840001l404qx6aoqy3	cmjo0ynz8000al704riezevpo	2025-12-27 08:19:25.541
cmjqtsvjs000kjy04hkjp67yy	cmjqtsvjs000ijy04vsk72cez	cmjqt79cq0001l4049v3q222u	2025-12-29 07:17:31.192
cmjqu1xmd000jl404wv95ho7n	cmjqtbi6j0001l504vqav98rh	cmjqt79cq0001l4049v3q222u	2025-12-29 07:24:33.781
cmjs8fa490003kz044s0h6i82	cmjs8fa490001kz04tbitluof	cmg5f33zu0001l804s1wrqr5t	2025-12-30 06:54:37.305
cmjs8r3ae0003jv046ilwy8cb	cmjs8r3ae0001jv0440by6i7a	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:03:48.326
cmjsa319i0003l504eahz6aih	cmjsa319i0001l50471nsxe57	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:41:05.19
cmjsaqxme0006l104okmg9eh9	cmjsaqxme0004l104hw0ecx84	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:59:40.215
cmjsbdp5u000blg049p1cxwgu	cmjs8l7ul0001l904o9uuo7ve	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:17:22.339
cmjsblt92000vla04hqhmxftj	cmjs88cs50001jp04q6z468hr	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:23:40.886
cmjtlt7sy0001jz04dooh53il	cmjtlsbz60001jj04uj1r1219	cmhgkonzs0001l504aofu3gyj	2025-12-31 05:57:08.675
cmjtnejxj0004jr04fxlcyubd	cmjtnejxj0002jr04xo079ktw	cmhgkr6uf0003l804bzsy4f16	2025-12-31 06:41:43.783
cmjtnssyi000bjj04srzxqwyh	cmjtnssyi0009jj04xdq4mhqt	cmi71914t0001l704tgh2kfn8	2025-12-31 06:52:48.667
cmjto4q7j0009jl04vewiv65p	cmjtnab660001jl04cbowblqq	cmi71914t0001l704tgh2kfn8	2025-12-31 07:02:04.975
cmjto68u0000ljl04brdphtaa	cmjtn23w70001l904vlphaw2a	cmi71914t0001l704tgh2kfn8	2025-12-31 07:03:15.768
cmjtoiwsz0003lb04bq72xnya	cmjtoiwsz0001lb04ajvt9ejv	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 07:13:06.707
cmjtoy4fz0003jp04y0mqi888	cmjtoy4fz0001jp04p40mhqcq	cmhgkr6uf0003l804bzsy4f16	2025-12-31 07:24:56.447
cmjtp6ara000tjl04n6giqk0l	cmjtmyvqd0009jj04btdt80fr	cmi71914t0001l704tgh2kfn8	2025-12-31 07:31:17.878
cmjtpbtd70010jl04loolp4cp	cmiabdmj00001la04mnuo7g8p	cmi71914t0001l704tgh2kfn8	2025-12-31 07:35:35.275
cmjtpcgbq0016jl04lzzzp7nq	cmiab98810009jo04nogdp3s3	cmi71914t0001l704tgh2kfn8	2025-12-31 07:36:05.03
cmjtpfz5a001cjl04b74956xn	cmiaap2g80001lb04h5kxpsvl	cmi71914t0001l704tgh2kfn8	2025-12-31 07:38:49.39
cmjtvbzi50003l404aimf5px5	cmjtvbzi50001l404rqvjotyw	cmho3fsxp0001ju04hzwllaw8	2025-12-31 10:23:40.925
cmjtyj74f0001l204mvbo6wjf	cmjtnxsef000ajr04ylnerkne	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 11:53:16.239
cmjv0eeqy0003l50428kadual	cmjv0eeqy0001l504pcxi6vua	cmg5f33zu0001l804s1wrqr5t	2026-01-01 05:33:18.251
cmjv2oiud0004lb048oec4psw	cmjv2oiud0002lb04x7in0gzk	cmih9kzf70001i904tu7iuf6z	2026-01-01 06:37:09.349
cmiwr3b390003ju04uu0odcqi	cmiwr3b390001ju043i5r1sh0	cmhgkoax60003js04bp3l0c36	2025-12-08 06:08:33.765
cmjwupdnu0007ib04j64nhdgx	cmid388v40001ld04378ak7mz	cmhgd8l2q0004ky04uwi0a2pv	2026-01-02 12:29:24.715
cmiwzqfrr001lk304xdw246od	cmiwzqfrr001jk304q39bea37	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:10:29.847
cmix0raf10020kz04gjuglrut	cmix0a4ue000njm04nidnxrvw	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:39:09.182
cmix1fgu3002ckz048fwuym8a	cmiwziexm000djm04zwwkc1lv	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:57:57.244
cmix1sagg002djm04q44ciatv	cmiwzl0gb0011k304j9jn4ooe	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:07:55.505
cmiybf361000rjs04ir5kbyyo	cmiybf361000pjs048dxcvupl	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:25:21.866
cmiyjjb230003ie04y2zfgm64	cmiyjjb230001ie04uw6rhaex	cmhgcpq4f0001l10491v94f1j	2025-12-09 12:12:35.643
cmiymn6890003jp0455of4woo	cmiyaw9n40005js045eszzoxy	cmhgcpq4f0001l10491v94f1j	2025-12-09 13:39:34.857
cmizu3lon000bjx04agouh3ch	cmizu3lom0009jx04kjzpty2b	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 09:56:04.871
cmizuqit5000nl804s8s7bk6u	cmiztyxg90001jo04ikrn1bt4	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:13:54.233
cmizwn0h20003jx04wpv0it9h	cmizwn0h20001jx04k66s77b1	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:07:09.734
cmizxofna0011jp043w7f4wl3	cmizxofna000zjp04o1xdddtv	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:36:15.671
cmizzbc310009jy04pprrtxdi	cmizxkm46000pjp04yibdgoud	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 12:22:03.757
cmj19828d0003jr04bbxejmbg	cmj19828d0001jr04n7j7ljfi	cmg5f33zu0001l804s1wrqr5t	2025-12-11 09:47:13.357
cmj2sxq54000bjr04we26trnp	cmj2sxq540009jr04qy5th0wn	cmj2snjep0001le04djqr3fqd	2025-12-12 11:46:49.625
cmj2v7mw9001mle04ecxovxgj	cmj2v7mw9001kle04r4x2fic4	cmhgkpywb0005ib04ymz2zgwk	2025-12-12 12:50:31.209
cmj6vxplu000xky04pctdro3a	cmj6vwsxy0001jo04vftnlwuk	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 08:21:52.482
cmj85ncv4000bjm04h4un3pxb	cmj85ncv40009jm04kq8ayci2	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 05:41:31.745
cmj893so70003l2043hl39hkd	cmj893so70001l204mfe0rhfy	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 07:18:17.575
cmj9tznhe000bjs04xaly3qnp	cmj9tznhe0009js04abfwwuh1	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:50:42.338
cmj9ueq1v000fjv048c6yeook	cmj9ueq1v000djv04tawfq5fc	cmhgknb5p0001js04qvasnpzo	2025-12-17 10:02:25.507
cmjb2mkka0003jo04psq5wnks	cmjb2mkka0001jo04vzmqwjsm	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 06:40:14.746
cmjb43pj90003jp04u5mugeih	cmjb43pj90001jp049z3l53cr	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:21:33.957
cmjb5wx9s0003l5046idbjmq0	cmjb5wx9s0001l504ptigsigx	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:12:16.625
cmjb71ho70003l504ox3q3sf9	cmjb71ho70001l504nvv08pp6	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:43:49.303
cmjch0lxk0003kz04y0lzeghj	cmjch0lxk0001kz04jtecq2ao	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:10:50.504
cmjcicjjb000bl2045o1mywgg	cmjcicjjb0009l204h9m5o69t	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:48:06.887
cmjcjvq8c000bl204z7jxgjte	cmjcjvq8c0009l204p05tpsle	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 07:31:01.644
cmji8q43s0003jv043my3r07b	cmji8q43s0001jv048iw3reac	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:05:20.968
cmji94nyz0003jx04hjdaor61	cmji94nyz0001jx04akfb4mly	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:16:39.899
cmjjr1876000bjy0498ac9eh3	cmjjr18750009jy04sn7kd4vz	cmg5f3d7o0003l804vmxh5d2y	2025-12-24 08:25:38.754
cmjjrjb83000bl704bs99hfp7	cmjjrjb830009l704cnuetku9	cmg5f3d7o0003l804vmxh5d2y	2025-12-24 08:39:42.483
cmjjy8c2b0003l70447getxa0	cmjjy8c2b0001l704b20dbyhf	cmhgkplzd0005js04tn9fghob	2025-12-24 11:47:07.667
cmjjy9cya0009l704ltruco2w	cmjjxtxxj0001jv04blmym7ir	cmhgkplzd0005js04tn9fghob	2025-12-24 11:47:55.475
cmjjylfcj000bl404j3osy045	cmjjylfci0009l404l02xkl3g	cmhgkplzd0005js04tn9fghob	2025-12-24 11:57:18.45
cmjjz6pih0003k404z1d3gif8	cmjjz6pih0001k4047pf1v6xs	cmhgkplzd0005js04tn9fghob	2025-12-24 12:13:51.401
cmjl3v40v000gjo046wiozcdd	cmjl3v40v000ejo04b7v1gehs	cmi9zuxwu000dl404up390ywb	2025-12-25 07:12:34.591
cmjl4hibu0003la04jtg2xg71	cmjl4hibu0001la04kj0hi37k	cmi9zuxwu000dl404up390ywb	2025-12-25 07:29:59.562
cmjl58w7s0003jl045epepqfk	cmjl58w7s0001jl044y2irpcv	cmi9zuxwu000dl404up390ywb	2025-12-25 07:51:17.272
cmjmj4jkx000ojr041nhgmn1t	cmjmj4jkx000mjr04jmtfcny9	cmhgkox8n0003ib0427athu89	2025-12-26 07:07:35.074
cmjnwfmvz0003jo04xu7f55m9	cmjnwfmvz0001jo04ogxtrvvu	cmictwptb0001l2041xf5mh56	2025-12-27 06:07:53.76
cmjny8mkx000hjj04ax4wykcx	cmjny8mkx000fjj04f3h73xdi	cmih992ry0001la04z66nrpok	2025-12-27 06:58:26.002
cmjnyffgm000pjj047krffyml	cmjnyffgm000njj049w7ulrhe	cmih992ry0001la04z66nrpok	2025-12-27 07:03:43.366
cmjo16lci0003l804ai408wux	cmjo16lci0001l804ey5o6504	cmjo0ynz8000al704riezevpo	2025-12-27 08:20:49.938
cmjo1lj5n000akz040okkc1po	cmjo1lj5n0008kz04z28bkc80	cmht6sb1g0001js041506z3hz	2025-12-27 08:32:26.939
cmjqtve5g0003l704ctdv7oaj	cmjqtve5g0001l704mvsttaeq	cmjqt79cq0001l4049v3q222u	2025-12-29 07:19:28.612
cmjqu3jno0009l504wkqrh9wa	cmjqtjmdn0003l404tgyf3bjq	cmjqt79cq0001l4049v3q222u	2025-12-29 07:25:48.996
cmjs8iiu20003l704682v3str	cmjs8iiu20001l704a31vnmdq	cmg5f33zu0001l804s1wrqr5t	2025-12-30 06:57:08.571
cmjs8vswg000nl904gh86nz2p	cmjs8vswg000ll904ivb4y4hb	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:07:28.144
cmjs9pp6j0003l504hgtphdnj	cmjs9pp6j0001l50499ik07ke	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:30:43.003
cmjsa630i000bjv0435dj37ma	cmjsa630i0009jv04lqspdt5h	cmg5f33zu0001l804s1wrqr5t	2025-12-30 07:43:27.427
cmjsasy1r0003la041bsw3tgp	cmjsasy1r0001la04nx00bytv	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:01:14.079
cmjsbeh1y000jlg04c2br1uxy	cmjs90xgk0009kz04kzja35t9	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:17:58.486
cmjsbfbog000tlg04vrt3x8qi	cmjsa98840001ky04b5mxos3f	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:18:38.176
cmjtlvdxh0009jz04i1q1dpvi	cmjtlvdxh0007jz04h24gmmpt	cmhgkonzs0001l504aofu3gyj	2025-12-31 05:58:49.925
cmjto5h6u000fjl04v5eeiuzh	cmjtnf0jm0001jj04he3eveui	cmi71914t0001l704tgh2kfn8	2025-12-31 07:02:39.943
cmjtol88i000tjj04t4qpzkvo	cmjtol88i000rjj04b1n8dc0e	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 07:14:54.834
cmjtp2uet000njl04r14ybw7m	cmjtp2uet000ljl0454qgma3p	cmjtocyyb000pjj04i2gu0qwu	2025-12-31 07:28:36.726
cmjtp722h000zjl04gnl6vzav	cmiabk2qt0009la04v2kxzay3	cmi71914t0001l704tgh2kfn8	2025-12-31 07:31:53.273
cmhw45tcc0003ky04fj5yzgw8	cmhw45tcc0001ky04da5cfdhr	cmg5f3d7o0003l804vmxh5d2y	2025-11-12 14:46:57.228
cmhw4dww3000bky04j036d5vx	cmhw4dww30009ky04aqtl5fvv	cmg5f3d7o0003l804vmxh5d2y	2025-11-12 14:53:15.076
cmhw4k6t60003l804jjw2r93w	cmhw4k6t60001l804sulob08s	cmg5f3d7o0003l804vmxh5d2y	2025-11-12 14:58:07.866
cmhw4wdaa0003js04lvvbjo07	cmhw4wdaa0001js04f8p4tdkv	cmht6sb1g0001js041506z3hz	2025-11-12 15:07:36.131
cmi1u408k0003ic04u8jliebp	cmi1u408k0001ic047aflz7jh	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 14:52:13.748
cmiwr6k100003l804c9qcycib	cmiwr6k100001l8047lqcob8f	cmhgkoax60003js04bp3l0c36	2025-12-08 06:11:05.316
cmi1ufx2h0004lb04596ut8s2	cmi1ufx2g0002lb04x48gewsg	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 15:01:29.513
cmi1uokeh000pk0045snel6sj	cmi1uokeh000nk004nxb2d6n7	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 15:08:13.001
cmi1ur4uy0003ju04xp7sq54k	cmi1ur4uy0001ju04q2ovbxwi	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 15:10:12.826
cmjwv6qup0001jr04hwynkuhc	cmiaax6yd0009lb04sfuptdqf	cmi71914t0001l704tgh2kfn8	2026-01-02 12:42:54.961
cmi1va3vp0003kt04yidy77bc	cmi1va3vp0001kt040b4c9hhv	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 15:24:58.021
cmi1vd9lo000bkt04v50jzk21	cmi1vd9lo0009kt04fst16ysj	cmg5f3d7o0003l804vmxh5d2y	2025-11-16 15:27:25.404
cmjxxwfi10004lb04vmogttke	cmjxxwfi10002lb04s4gej9k8	cmhgkqq830001l8047ev8tmz7	2026-01-03 06:46:38.714
cmi1vidr3000jkt04v8xadvvi	cmi1vidr2000hkt047gujnpms	cmg5f33zu0001l804s1wrqr5t	2025-11-16 15:31:24.063
cmi47xlea0003la041hg7xltp	cmi47xle90001la04z1mwqsi0	cmhq0p02k0001kw04yw2jjlgu	2025-11-18 06:54:41.554
cmjy3q8bu0003ih04a8bsx3qv	cmjy3q8bu0001ih04nhmtu5q1	cmhgkqq830001l8047ev8tmz7	2026-01-03 09:29:47.178
cmi72fj250003jx041n7sdj3i	cmi72fj250001jx04towkqnah	cmi71914t0001l704tgh2kfn8	2025-11-20 06:43:59.165
cmi72rzan0003jp041f91c0ov	cmi72rzan0001jp040aayssub	cmi71914t0001l704tgh2kfn8	2025-11-20 06:53:40.079
cmi7333sv000bjp04v5qpg7y9	cmi7333sv0009jp04bxladepn	cmi71914t0001l704tgh2kfn8	2025-11-20 07:02:19.135
cmi739l1a000bjx046czowtcz	cmi739l1a0009jx0429tvqdd1	cmi71914t0001l704tgh2kfn8	2025-11-20 07:07:21.406
cmi73dj980003la0465myhgxg	cmi73dj980001la04lzwfpygx	cmi71914t0001l704tgh2kfn8	2025-11-20 07:10:25.724
cmi73gvzf000jjx04qwuk7vn8	cmi73gvzf000hjx04yuq8oroi	cmi71914t0001l704tgh2kfn8	2025-11-20 07:13:02.187
cmi73kz9l000jjp044blbvv8t	cmi73kz9l000hjp04kequg87i	cmi71914t0001l704tgh2kfn8	2025-11-20 07:16:13.065
cmjybyi3t0001jr04hos6cfw5	cmi487pzv0001l804wayq6n7r	cmho3fsxp0001ju04hzwllaw8	2026-01-03 13:20:10.026
cmix0sgqa002lk304dg9z1938	cmix0be9b0027k304rmgt8hdm	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:40:04.018
cmix1g5x8000hlb049hrl9dh7	cmix02qmx0016kz04lva4zr9i	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:58:29.756
cmk0rc1uj0003l7042317tcra	cmk0rc1uj0001l704k2sq881t	cmictwptb0001l2041xf5mh56	2026-01-05 06:06:08.732
cmix1v8200025lb045xng0lzo	cmiwzmrzy001bk304otwefuou	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:10:12.361
cmid3esrx0003ju04vpudukbr	cmid3esrx0001ju04wlhv1k8c	cmhgd8l2q0004ky04uwi0a2pv	2025-11-24 11:58:01.773
cmid4meqz0003ju04efl9crw0	cmid4meqz0001ju04ysxx0a96	cmhq0p02k0001kw04yw2jjlgu	2025-11-24 12:31:56.459
cmie5uwe30008l504xx7swdzf	cmie5uwe30006l50492em2fvv	cmhgkr6uf0003l804bzsy4f16	2025-11-25 05:54:18.364
cmiybny3j0003jr043pgzxw1t	cmiybny3j0001jr048t2v3zqh	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:32:15.199
cmiyie0sz0003jv04kerldq7f	cmiyie0sz0001jv04v16u0haa	cmhgcpq4f0001l10491v94f1j	2025-12-09 11:40:29.459
cmiykdcxu0001ju04mz4jsp6y	cmiycd4jw0001jy04ekrzjdwt	cmhgcpq4f0001l10491v94f1j	2025-12-09 12:35:57.763
cmizl9dv90003js04y2ta6fm7	cmizl9dv80001js04clbbr0jx	cmhgcpq4f0001l10491v94f1j	2025-12-10 05:48:38.133
cmk0rkb5h0003jm04xh5rd16n	cmk0rkb5h0001jm047p2ctppl	cmictwptb0001l2041xf5mh56	2026-01-05 06:12:34.037
cmizu8ofk0009l804z34tdy21	cmizu8ofk0007l804mg32hody	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:00:01.712
cmizv4nh8000jjo047zh3l3i7	cmizv4nh8000hjo04vheq6rxi	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:24:53.468
cmizwque4000bjp049mtx0crk	cmizwque40009jp04cskdtic3	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:10:08.477
cmizyd5po0003l50471emppz7	cmizyd5po0001l504bzac35fn	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:55:29.196
cmj01klam000hjy04g7ezsbp6	cmizz95mn0001kt04j7ym20k6	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 13:25:14.83
cmj19bimx000djv04e04tomas	cmj19bimx000bjv040k0a3f47	cmg5f33zu0001l804s1wrqr5t	2025-12-11 09:49:54.585
cmj1b808d0003l504thvfird6	cmj1b808d0001l504fmwrvone	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:43:09.997
cmj2szrzm0005le040sbkpmbk	cmj2szrzm0003le04tve70vg7	cmj2snjep0001le04djqr3fqd	2025-12-12 11:48:25.331
cmj2tt976000tjr04hhsaub1d	cmj2ts2ok000wle04q0w233jj	cmirh03xp0001l104sjizl4v4	2025-12-12 12:11:20.658
cmj6v549t000jky04st193jsy	cmj6v549t000hky04e3anafiy	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 07:59:38.465
cmj6w00av0015ky04l92mkp1a	cmj6w00av0013ky04dfgydq1a	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 08:23:39.655
cmj85qxvn0001ie04vjc9gbyv	cmj6vt1ae000ui804tlf8ndq1	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 05:44:18.947
cmj89vcr5000dl204epa8wwzq	cmj89vcr4000bl204k1wwwk8s	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 07:39:43.313
cmj9uh1hd0003jy04wmytgjfj	cmj9uh1hd0001jy04ytx5usc8	cmhgknb5p0001js04qvasnpzo	2025-12-17 10:04:13.633
cmjb2pk4q0003jp04pw3f982m	cmjb2pk4q0001jp04vdtipdxe	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 06:42:34.154
cmjb4yohw0008kw04x4bmyxrw	cmjb4yohw0006kw04kz54xrgm	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:45:38.948
cmjb5yqv90003ie04ssqqqa2f	cmjb5yqv90001ie048y56x03m	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:13:41.637
cmjb7266s0001ky04zfipyrxx	cmjb6zpph0001l104k8y1d14a	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:44:21.077
cmk0su6yd0005ic04k3kfw0f0	cmk0su6yd0003ic04xlpbvupv	cmho3fsxp0001ju04hzwllaw8	2026-01-05 06:48:14.773
cmjb74dls0009ky04fdssdaot	cmjb74dlr0007ky04ixslh5d8	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:46:04
cmjch2k8o000bky04nc23379n	cmjch2k8o0009ky04p8svcyhg	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:12:21.624
cmjguqogm000ajo04owkwxp9f	cmjguqogl0008jo04zc0einko	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:46:06.55
cmjgv42ew0003jo04z2ae1g88	cmjgv42ew0001jo04dlpbpcdm	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:56:31.16
cmji8u2lp000lkz049nsivqjx	cmji8u2lo000jkz04kez1f8j3	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:08:25.645
cmicunxfi000jjr04lcvkcz30	cmicunxfi000hjr048knaapyb	cmictwptb0001l2041xf5mh56	2025-11-24 07:53:11.167
cmicupjqs000rjr04cu7bb6du	cmicupjqs000pjr042szvpmts	cmictwptb0001l2041xf5mh56	2025-11-24 07:54:26.74
cmiwr8o4y000bl704guk6qz9t	cmiwr8o4y0009l704h5d4ktoj	cmhgkoax60003js04bp3l0c36	2025-12-08 06:12:43.954
cmjxxl0710004l504npsi1w3w	cmjxxl0710002l504iv6p3bbr	cmhgkqq830001l8047ev8tmz7	2026-01-03 06:37:45.662
cmjxxz8de000ll504s0m7qffv	cmjxxz8de000jl5043e4a0liq	cmhgkqq830001l8047ev8tmz7	2026-01-03 06:48:49.442
cmk0qb16v0004l404ruwoobpg	cmk0qb16v0002l4048b7duuhk	cmictwptb0001l2041xf5mh56	2026-01-05 05:37:21.607
cmix1nbfv001jlb04yeqwlihh	cmiwz98gb0001jm045m47oner	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:04:03.499
cmix2d6vz0001jp04b2xafmce	cmiwzf0sd000jk304699r6vx8	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:24:10.656
cmiybqhqg000dl8044c4r8waq	cmiybqhqg000bl804xk6za6wh	cmhgcpq4f0001l10491v94f1j	2025-12-09 08:34:13.96
cmiyiivm2000bjv04y79le22f	cmiyiivm20009jv04fkbv8tfl	cmhgcpq4f0001l10491v94f1j	2025-12-09 11:44:16.011
cmiymc6ak000djy04v4m1eav9	cmiyavsq40001js04rxyre88u	cmhgcpq4f0001l10491v94f1j	2025-12-09 13:31:01.725
cmizli28b000fic04eezk1u80	cmizli28b000dic046ptld805	cmhgcpq4f0001l10491v94f1j	2025-12-10 05:55:22.955
cmih8h6mb0007jm044xjczyo2	cmih8h6mb0005jm04xhy1tu6q	cmih2it88000fkz043nf8vfcc	2025-11-27 09:30:55.811
cmih8njmo000bju04ck5z1egd	cmih8njmo0009ju04ptjq4y9k	cmih2it88000fkz043nf8vfcc	2025-11-27 09:35:52.609
cmizudvwt000hl8049iw3xebl	cmizudvwt000fl804zkgwhway	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:04:04.685
cmizx15si000jjp04qf66cwix	cmizx15si000hjp04e3vnraq4	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:18:09.811
cmizyg0ta0003jo04ne0t3ot3	cmizyg0ta0001jo04c2s6uqgt	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:57:42.814
cmj10cv2s0003js04efnbu3bw	cmj10cv2s0001js04cg935auv	cmhgkonzs0001l504aofu3gyj	2025-12-11 05:39:00.82
cmj19ers5000dl504fer1yqlf	cmj19ers5000bl50468tqi94o	cmg5f33zu0001l804s1wrqr5t	2025-12-11 09:52:26.405
cmj1bbg0u000hld04jytiffez	cmj1bbg0u000fld04cg7wnjlh	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:45:50.43
cmj2t1mtx0008le044f1shpaq	cmj2t1mtx0006le04i9urumjn	cmj2snjep0001le04djqr3fqd	2025-12-12 11:49:51.957
cmj2tvupf0011jr041zqvylmy	cmj2tvupf000zjr044k5yfw8d	cmirh03xp0001l104sjizl4v4	2025-12-12 12:13:21.843
cmj2txzwb0019jr04cbkbx79g	cmj2txzwb0017jr04ius0xa0j	cmirh03xp0001l104sjizl4v4	2025-12-12 12:15:01.884
cmj6va9wq000ble04z9fy3up3	cmj6va9wq0009le04clsahelh	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 08:03:39.05
cmj6w43pd0016i804d2wc8z6u	cmj6w43pd0014i804goyhekbl	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 08:26:50.69
cmj86mvz40004l804tmmi8qf4	cmj86mvz40002l8045xsn6tr0	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 06:09:09.473
cmj8a8ybp000ll204rrnl1tdd	cmj8a8ybp000jl2049wvdyv2e	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 07:50:17.797
cmj9u6i5u000dic04odc6kn8n	cmj9tsf5d000fl804eo9dw254	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:56:02.035
cmj9u7rp8000jic04x0f1x5gn	cmj9to75u0002i8046rj4zmgs	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:57:01.052
cmj9umqxa0003jv04w0yzbiy8	cmj9umqxa0001jv04xceoc81e	cmhgknb5p0001js04qvasnpzo	2025-12-17 10:08:39.886
cmjb2roiq0006lb04ay62v74c	cmjb2roiq0004lb04figjb7r6	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 06:44:13.154
cmjb50jw60003jm04ukj5l2gk	cmjb50jw50001jm04f6cnvdsw	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:47:06.294
cmjb630vc000bie04tk9vagpn	cmjb630vc0009ie04kcyaf9b3	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:17:01.224
cmjci2e5q0003l204towc05vf	cmjci2e5q0001l204u5q87ina	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:40:13.358
cmjcjlocx0003l204fwnmf7og	cmjcjlocx0001l2045wujllk2	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 07:23:12.657
cmjgut89p0003jl04w3d605h9	cmjgut89o0001jl04372iqmgm	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:48:05.533
cmjgv6a4d0003ih0482m76g3f	cmjgv6a4d0001ih04eb0i7ven	cmitygf3c0001jl0465c0k3t9	2025-12-22 07:58:14.461
cmji8wpen0003kz044y87dbv8	cmji8wpen0001kz04pigbmiwn	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:10:28.511
cmji96ynw000bjx04se4irqci	cmji96ynw0009jx04xclaanlg	cmhq0p02k0001kw04yw2jjlgu	2025-12-23 07:18:27.068
cmjjomnny0003kt04467ujifg	cmjjomnny0001kt04ujxkszyo	cmih9kzf70001i904tu7iuf6z	2025-12-24 07:18:19.726
cmjjr9mvi000bjs04pmfeecqh	cmjjr9mvi0009js04c1sbrwcm	cmg5f3d7o0003l804vmxh5d2y	2025-12-24 08:32:11.022
cmjjrm68n0003jj04bl2ki017	cmjjrm68n0001jj042pr45n9h	cmg5f3d7o0003l804vmxh5d2y	2025-12-24 08:41:55.991
cmjjycuzw0003l804akxvgock	cmjjycuzw0001l8040f23afvg	cmhgkplzd0005js04tn9fghob	2025-12-24 11:50:38.829
cmjjyor2e000ejv046x58dwwt	cmjjyor2e000cjv04ijacfhav	cmhgkplzd0005js04tn9fghob	2025-12-24 11:59:53.606
cmjl3yxf0000bkz0478xw7ezc	cmjl3yxf00009kz044vwup59a	cmi9zuxwu000dl404up390ywb	2025-12-25 07:15:32.652
cmjl5co0r0003l4044golqu7g	cmjl5co0r0001l404ngo11rg8	cmi9zuxwu000dl404up390ywb	2025-12-25 07:54:13.275
cmjmioopy0003jp04fpvzgg7w	cmjmioopy0001jp04uepyzj84	cmhgkox8n0003ib0427athu89	2025-12-26 06:55:15.239
cmiimgjll000tl804u5zbajaf	cmi48e4c10001l8048gwzbiub	cmi46y9du0001l204herkdh6w	2025-11-28 08:50:06.777
cmjmjaih30003jp043rhq70gz	cmjmjaih30001jp043s8hl0u6	cmhgkox8n0003ib0427athu89	2025-12-26 07:12:13.575
cmjnwhh8x0003ih04202rat5a	cmjnwhh8x0001ih041v4hjait	cmictwptb0001l2041xf5mh56	2025-12-27 06:09:19.761
cmjnyah6f0003l8047tic6hyi	cmjnyah6f0001l804h7gczuzj	cmih992ry0001la04z66nrpok	2025-12-27 06:59:52.311
cmjnyjg7f000dlb04hi9mq2ks	cmjnyjg7f000blb04gp0unx7c	cmih992ry0001la04z66nrpok	2025-12-27 07:06:50.956
cmjo1a1wb000bl404yyajh46f	cmjo1a1wb0009l4040mfi7fss	cmjo0ynz8000al704riezevpo	2025-12-27 08:23:31.355
cmjo1p332000ml704ro13ujq1	cmjo1p332000kl704i56n349y	cmhgkntwx0001ib04a4y9dxou	2025-12-27 08:35:12.735
cmjqtms0i0003le043njka5s0	cmjqtms0i0001le04cs1dbosm	cmjqt79cq0001l4049v3q222u	2025-12-29 07:12:46.674
cmjqtxucg000jle04571wwtt0	cmjqtxucf000hle04f74pk7n3	cmjqt79cq0001l4049v3q222u	2025-12-29 07:21:22.912
cmjqu5tv3000qjy044ucy4550	cmjqthmbe000ajy04s4wtd484	cmjqt79cq0001l4049v3q222u	2025-12-29 07:27:35.535
cmjsb3jns000el104wh3qs1zx	cmjsb3jns000cl104cj790h0c	cmitygf3c0001jl0465c0k3t9	2025-12-30 08:09:28.648
cmjsbarc4000fla04evmouw43	cmjsb6b7p000kl104vs4u0xnb	cmitygf3c0001jl0465c0k3t9	2025-12-30 08:15:05.188
cmjsbhe6k000yl104yofo9jvv	cmjs9xr330009l504bve9usvm	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:20:14.732
cmjsbny1c001al104c1fn46ub	cmjs8ob89000bl904odrikbzk	cmg5f33zu0001l804s1wrqr5t	2025-12-30 08:25:20.4
cmiisktss000dl704zq8ev0ky	cmiisktss000bl7043pqltjee	cmiiok42a0001jr04mqm2lgu1	2025-11-28 11:41:24.317
cmjtnlto60003jl04p95clbnu	cmjtnlto60001jl04rcv1k31v	cmi71914t0001l704tgh2kfn8	2025-12-31 06:47:22.999
cmiit63qs000rk304j7mh0srj	cmiit63qs000pk30475ax6dkn	cmiiok42a0001jr04mqm2lgu1	2025-11-28 11:57:56.98
cmiitb0x3000nl704fs5cqi0s	cmiitb0x3000ll704o1eilly9	cmiiok42a0001jr04mqm2lgu1	2025-11-28 12:01:46.6
cmiitji7m0003l204h4ftpcuh	cmiitji7m0001l204s1sruv97	cmiiok42a0001jr04mqm2lgu1	2025-11-28 12:08:22.258
cmiitpyob0019k304zeuvpx1e	cmiitpyob0017k304h418pgca	cmiiok42a0001jr04mqm2lgu1	2025-11-28 12:13:23.532
cmiituz7b000bl20480d9hkxg	cmiituz7b0009l2047mmmeoys	cmiiok42a0001jr04mqm2lgu1	2025-11-28 12:17:17.495
cmiiu09s4000ll204qppffttz	cmiiu09s3000jl204yl7q96ee	cmiiok42a0001jr04mqm2lgu1	2025-11-28 12:21:24.484
cmiwrdseo0003jv04ojya6dep	cmiwrdseo0001jv04g2wk6x0h	cmhgkoax60003js04bp3l0c36	2025-12-08 06:16:42.769
cmiiuj398001pk304lwh2ptc6	cmiiuj398001nk304lgcyp28n	cmhgd8l2q0004ky04uwi0a2pv	2025-11-28 12:36:02.493
cmiiune23000vl7048drsasuv	cmiiune23000tl704qssmsije	cmhgd8l2q0004ky04uwi0a2pv	2025-11-28 12:39:23.115
cmiius6lo0013l704v03aai9t	cmiius6lo0011l7047q63s4gs	cmhgd8l2q0004ky04uwi0a2pv	2025-11-28 12:43:06.732
cmix0woj7002rk304flo2q6r5	cmiwzzqpt001rk304jay476nb	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:43:20.755
cmix1hwvg002kkz04otuhch7y	cmix05oej001ekz04vfvrlrt2	cmhgkqq830001l8047ev8tmz7	2025-12-08 10:59:51.341
cmipl2wjj0004l7046a9n3upo	cmipl2wjj0002l704jpmj1n01	cmhq0p02k0001kw04yw2jjlgu	2025-12-03 05:45:53.983
cmiplrfn7000dl70425ulmxwo	cmiplrfn7000bl704uhs3n78s	cmhq0p02k0001kw04yw2jjlgu	2025-12-03 06:04:58.483
cmipmb3m30003ky042lzdvd5d	cmipmb3m30001ky04z2uftg3l	cmhq0p02k0001kw04yw2jjlgu	2025-12-03 06:20:16.012
cmiposir30003l60494rvktip	cmiposir30001l6044uzqkpgo	cmhq0p02k0001kw04yw2jjlgu	2025-12-03 07:29:48.015
cmix1jqih0036kz040ldm5yef	cmiwz42300001k304nsrt2pe6	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:01:16.409
cmix1p82z001zlb041qnm1pof	cmix08py8001zk3040tju9n99	cmhgkqq830001l8047ev8tmz7	2025-12-08 11:05:32.459
cmipqpccq000ljo04iu0254qk	cmipqpccq000jjo04whqot3ry	cmhq0p02k0001kw04yw2jjlgu	2025-12-03 08:23:18.987
cmirhhgcj0003l8043nkrxksh	cmirhhgcj0001l8048s0jo49d	cmirh03xp0001l104sjizl4v4	2025-12-04 13:40:46.723
cmirhknju0003l504y03s9abp	cmirhknju0001l504u25okyvu	cmirh03xp0001l104sjizl4v4	2025-12-04 13:43:16.026
cmirhovv80003ju04tmqdbsaj	cmirhovv80001ju04y00jjyvc	cmirh03xp0001l104sjizl4v4	2025-12-04 13:46:33.428
cmirhrgzq000bl804pmpjzxy9	cmirhrgzq0009l804io77q2pd	cmirh03xp0001l104sjizl4v4	2025-12-04 13:48:34.118
cmirhtv7v000bl5045ysd9gx4	cmirhtv7v0009l504c4hf4yti	cmirh03xp0001l104sjizl4v4	2025-12-04 13:50:25.868
cmish8x5i0003lb04dj13dn7q	cmish8x5i0001lb04u0ypbmr8	cmht6sb1g0001js041506z3hz	2025-12-05 06:21:54.774
cmishbp2u0006ic04zbnfioms	cmishbp2t0004ic04l963b5md	cmht6sb1g0001js041506z3hz	2025-12-05 06:24:04.278
cmishe4760003lb04mkz42u7m	cmishe4760001lb04vuthkdy7	cmht6sb1g0001js041506z3hz	2025-12-05 06:25:57.186
cmishn4cy000eic04ii65ph7e	cmishn4cy000cic04hisgio7r	cmht6sb1g0001js041506z3hz	2025-12-05 06:32:57.299
cmishssas000rlb04i7o3028h	cmishssas000plb04vapzckqr	cmht6sb1g0001js041506z3hz	2025-12-05 06:37:21.604
cmisi24mv000mic04x2rez8ic	cmisi24mv000kic04bbue5xy8	cmht6sb1g0001js041506z3hz	2025-12-05 06:44:37.496
cmisi9p99000zlb04tnb3biur	cmisi9p99000xlb04rdgcfo0b	cmht6sb1g0001js041506z3hz	2025-12-05 06:50:30.814
cmisidibs0003kz04tcq2ukqz	cmisidibs0001kz04gd5hydpt	cmht6sb1g0001js041506z3hz	2025-12-05 06:53:28.456
cmisifusg0017lb0403t9pr33	cmisifusg0015lb04axpsq5so	cmht6sb1g0001js041506z3hz	2025-12-05 06:55:17.921
cmisiurac0005jm045ktg375x	cmisiurac0003jm04i1j7k74h	cmht6sb1g0001js041506z3hz	2025-12-05 07:06:53.22
cmisjg4zu000bkz043znfofyy	cmisjg4zu0009kz04jbk1hicw	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:23:30.762
cmisjisd8000jkz04wpdgfvjj	cmisjisd8000hkz04vt9qxbs9	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:25:34.364
cmisjlgpa0003ld04y640jc31	cmisjlgpa0001ld0418dsyy8f	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:27:39.214
cmisjp5ut000rkz045h5vk7m2	cmisjp5ut000pkz046dnvgdp5	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:30:31.781
cmisjrn2v000bld04i3s1hbdv	cmisjrn2v0009ld041bhkfs86	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:32:27.416
cmisju5y6000djm04rkua8pit	cmisju5y6000bjm04d8yj6j7o	cmhgkntwx0001ib04a4y9dxou	2025-12-05 07:34:25.182
cmiyiq0s30003jx047rksvtdz	cmiyiq0s30001jx04mkjerrau	cmhgcpq4f0001l10491v94f1j	2025-12-09 11:49:49.299
cmitvvfru0009jr043hydqg59	cmitvvfrt0007jr04qu2fr8f5	cmhgkonzs0001l504aofu3gyj	2025-12-06 05:59:06.138
cmitvyh0r000bl404hescyl4b	cmitvyh0r0009l404pmtbad8b	cmhgkonzs0001l504aofu3gyj	2025-12-06 06:01:27.723
cmitw0yjm000hjr04l6rz5v5l	cmitw0yjm000fjr0496qc9crm	cmhgkonzs0001l504aofu3gyj	2025-12-06 06:03:23.746
cmitw32iv0003js04v7c354u7	cmitw32iv0001js0440gu7q2l	cmhgkonzs0001l504aofu3gyj	2025-12-06 06:05:02.215
cmitw58s0000jl404kn6ovsf3	cmitw58s0000hl404ujqkwbyu	cmhgkonzs0001l504aofu3gyj	2025-12-06 06:06:43.632
cmiymdpxw000ljy04x5rl6wkk	cmiyg1b1i0001lb04kep83ftw	cmhgcpq4f0001l10491v94f1j	2025-12-09 13:32:13.844
cmitx5bdd0003jp04ndvvlmm0	cmitx5bdd0001jp04kbk1adwt	cmg5f33zu0001l804s1wrqr5t	2025-12-06 06:34:46.609
cmitxe5v90003la0473sr9qw0	cmitxe5v90001la04tqizjkh1	cmg5f33zu0001l804s1wrqr5t	2025-12-06 06:41:39.381
cmity7fhb0003i804fioqs2j9	cmity7fhb0001i804548qmc42	cmg5f33zu0001l804s1wrqr5t	2025-12-06 07:04:24.863
cmizluoa80003jm04ltskw3he	cmizluoa80001jm04rbxxydn5	cmhgcpq4f0001l10491v94f1j	2025-12-10 06:05:11.408
cmizuhuum000jjx04r0mu430a	cmizuhuum000hjx04fh6ii3zl	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:07:09.934
cmizvygfw0009jr04703tkwx3	cmizvxnua0001jr04j6a2c058	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 10:48:04.028
cmizx4kqs0003l204apl175ez	cmizx4kqs0001l204cdrveglc	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 11:20:49.157
cmizyj7xm000jl804iuapjp6i	cmizyj7xm000hl804cbre8kus	cmg5f3d7o0003l804vmxh5d2y	2025-12-10 12:00:12.011
cmj10x6rc000djs04nu3bgubu	cmj10x6rc000bjs04aeppqojw	cmg5f33zu0001l804s1wrqr5t	2025-12-11 05:54:49.081
cmj1bdgq7000hl504hl08soat	cmj19mh87000bjr04h6jcglw5	cmg5f33zu0001l804s1wrqr5t	2025-12-11 10:47:24.655
cmj2ucdzm0016le04kgwojtks	cmj2ucdzm0014le04asenjpco	cmi9zuxwu000dl404up390ywb	2025-12-12 12:26:13.33
cmj6ulb1b0003ky04gdtqlobv	cmj6ulb1b0001ky04sphap4on	cmhgkpywb0005ib04ymz2zgwk	2025-12-15 07:44:14.112
cmj858wgi0003l404cwyslwcr	cmj858wgi0001l404lopxlbau	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 05:30:17.298
cmj87g5vm0003ky042dy5yybx	cmj87g5vm0001ky04ifsqjak2	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 06:31:55.33
cmj8anyas0003l104dx1rov51	cmj8anyas0001l104bt3fs0ok	cmhgkpywb0005ib04ymz2zgwk	2025-12-16 08:01:57.604
cmj9u4ijh0007ic043fw9cyjq	cmj9tvjp60001js04fc0exm4p	cmhgknb5p0001js04qvasnpzo	2025-12-17 09:54:29.213
cmj9utngk000hl104aa9s0y6v	cmj9u3bi50009l1045bz4l6mi	cmhgknb5p0001js04qvasnpzo	2025-12-17 10:14:01.989
cmjb3xbpq0003ia04l3wb4nw9	cmjb3xbpp0001ia04qlehfh60	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:16:36.11
cmjb531on0003js047m4fkhxh	cmjb531om0001js04yhfbfi2h	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 07:49:02.663
cmjb66avf0003ju04t5thoenl	cmjb66avf0001ju04w20u0sxg	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:19:34.155
cmjb7anc7000bl104m4f124jq	cmjb7anc70009l1042mi5f9rd	cmhgd8l2q0004ky04uwi0a2pv	2025-12-18 08:50:56.551
cmjci5nm90003jv04ufolx0sw	cmjci5nm90001jv04gu4fy4f3	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 06:42:45.585
cmjcjnxsu0003la048m0mv75y	cmjcjnxsu0001la042uzt1mme	cmhgd8l2q0004ky04uwi0a2pv	2025-12-19 07:24:58.206
cmjv2w2gj0003jj04t0nva5tn	cmjv2w2gj0001jj04ny6ydpqi	cmih9kzf70001i904tu7iuf6z	2026-01-01 06:43:01.363
cmjv32bho000dlb04keoxd9v0	cmjv32bho000blb04ep7whhc1	cmg5f33zu0001l804s1wrqr5t	2026-01-01 06:47:53.004
cmjv3wdr30003l804wj73va1f	cmjv3wdr30001l804tpk0n311	cmht6sb1g0001js041506z3hz	2026-01-01 07:11:15.615
cmjv5no9a0005kw04qt99f895	cmjv5no9a0003kw04a09jv8jf	cmih9kzf70001i904tu7iuf6z	2026-01-01 08:00:28.558
cmjv5utr40003la04k9frch46	cmjv5utr40001la04k1unspwk	cmht6sb1g0001js041506z3hz	2026-01-01 08:06:02.273
cmjwcodcl0004l704s6euzmvx	cmjwcodcl0002l704ij1om695	cmht6sb1g0001js041506z3hz	2026-01-02 04:04:44.565
cmjxxs9ql000cl504cl35b7el	cmjxxs9ql000al504xeayzy27	cmhgkqq830001l8047ev8tmz7	2026-01-03 06:43:24.622
cmjxy6th6000clb048d8l87y0	cmjxy6th6000alb044xn0rf1f	cmhgkqq830001l8047ev8tmz7	2026-01-03 06:54:43.386
cmjwdcd7o000bi204ym2a3aem	cmjwdcd7o0009i204110lzmgv	cmhgkntwx0001ib04a4y9dxou	2026-01-02 04:23:24.132
cmjwu77w80001jp04i8ef3tqm	cmi1uyg2s0009ju04r74ojtng	cmg5f3d7o0003l804vmxh5d2y	2026-01-02 12:15:17.433
cmjwug1ap0001jm04fzvkhzbw	cmiis00x00001l704qvzmffl7	cmiiok42a0001jr04mqm2lgu1	2026-01-02 12:22:08.786
cmjwulh9m0001ib04h8qa1k3r	cmjcjj902000nl204rgjal6xl	cmhgd8l2q0004ky04uwi0a2pv	2026-01-02 12:26:22.763
cmjwunnlm0009jm048uzcplxk	cmjb77yps0006la04eda0b4zl	cmhgd8l2q0004ky04uwi0a2pv	2026-01-02 12:28:04.282
cmk0qy2xl0003l804w000j2s1	cmk0qy2xl0001l804d0v3j34s	cmictwptb0001l2041xf5mh56	2026-01-05 05:55:16.953
cmk0soqyt0003gv043mjmiajj	cmk0soqyt0001gv04t4x3eqmk	cmg5f33zu0001l804s1wrqr5t	2026-01-05 06:44:00.773
cmk0t483o000yli04a1pv7sf3	cmk0t483o000wli04iygzxn79	cmho3fsxp0001ju04hzwllaw8	2026-01-05 06:56:02.82
cmk0teh370004l204i0hzc7sz	cmk0teh370002l204psvupo2l	cmi71914t0001l704tgh2kfn8	2026-01-05 07:04:01.027
cmk0tg93p0015li04twdwkl3h	cmk0su6yf000cli04aov48k85	cmi71914t0001l704tgh2kfn8	2026-01-05 07:05:23.989
cmk0ti3940001jj046vvicn4w	cmk0sxr6w000oli046a9i4vh5	cmi71914t0001l704tgh2kfn8	2026-01-05 07:06:49.72
cmk0tic0q0009jj04osso3xf9	cmk0tic0q0007jj04m60p6p25	cmih992ry0001la04z66nrpok	2026-01-05 07:07:01.083
cmk0tjkur000ml204xbhadjvr	cmk0t0xsq000hjv042vvu6aqa	cmi71914t0001l704tgh2kfn8	2026-01-05 07:07:59.187
cmk0tm39p000yl204gm62iufh	cmk0t8juc000bgv04e3zsik0u	cmi71914t0001l704tgh2kfn8	2026-01-05 07:09:56.365
cmk0tmjbd0016l204167hq968	cmk0tmjbd0014l204oc9majv8	cmih992ry0001la04z66nrpok	2026-01-05 07:10:17.161
cmk0tnqe1001hli04qzdljknh	cmk0sb0ec0001k104gz0kpd9m	cmi71914t0001l704tgh2kfn8	2026-01-05 07:11:12.985
cmk0tpf3r000pgv04q8rz3j46	cmk0sfwzk0004li04ox7azp2s	cmi71914t0001l704tgh2kfn8	2026-01-05 07:12:31.671
cmk0tr24b001nli04nn4w75x7	cmk0skw3q0009jv04b8dyfrwf	cmi71914t0001l704tgh2kfn8	2026-01-05 07:13:48.155
cmk0tta46001tli0461hx9non	cmiabs5gv000hla04k03752ia	cmi71914t0001l704tgh2kfn8	2026-01-05 07:15:31.83
cmk0tual3000fjj04kjgiv1dq	cmiabx58h000hjo04c81zhxbi	cmi71914t0001l704tgh2kfn8	2026-01-05 07:16:19.096
cmk0u0c9g001zli04jrijnsuk	cmk0s67ef0001jv04cxi5t1c9	cmi71914t0001l704tgh2kfn8	2026-01-05 07:21:01.205
cmk0ui9xz0004jp0482dgr76u	cmk0ui9xz0002jp04sew62zg4	cmg5f33zu0001l804s1wrqr5t	2026-01-05 07:34:58.008
cmk0ynp8t0003k404ztgfe9zl	cmk0ynp8t0001k404pq6uzjhy	cmhgkoax60003js04bp3l0c36	2026-01-05 09:31:09.581
cmk0ypotg0005l504k6rynhbu	cmk0ypotg0003l50482lhx28l	cmhgkoax60003js04bp3l0c36	2026-01-05 09:32:42.341
cmk0yu9530003l3040ub8qk2a	cmk0yu9530001l304mvpgpp9a	cmht6sb1g0001js041506z3hz	2026-01-05 09:36:15.303
cmk10hqyh0003i604x68pjysi	cmk10hqyh0001i604hdvih2e9	cmhq0p02k0001kw04yw2jjlgu	2026-01-05 10:22:31.097
cmk10s08h0004gy04p8bejbin	cmk10s08h0002gy045q09lin1	cmhq0p02k0001kw04yw2jjlgu	2026-01-05 10:30:29.681
cmk10urke000bk404wp2vh7tg	cmk10urke0009k404z49zkpto	cmhq0p02k0001kw04yw2jjlgu	2026-01-05 10:32:38.415
cmk11cy25000cgy04tufedojo	cmk11cy25000agy04w4fk2tyq	cmg5f33zu0001l804s1wrqr5t	2026-01-05 10:46:46.638
cmk222ihu0003l504o5w80ohn	cmk222ihu0001l504mffryyu1	cmih992ry0001la04z66nrpok	2026-01-06 03:54:25.698
cmk227mnz0005l404saatokqw	cmk227mny0003l404k6jzi6g6	cmih992ry0001la04z66nrpok	2026-01-06 03:58:24.383
cmk22a1th000cl504jx62w8s7	cmk22a1th000al50432b0thcj	cmih992ry0001la04z66nrpok	2026-01-06 04:00:17.334
cmk22colt000il804i4ups82l	cmk22colt000gl804uabtnp59	cmih992ry0001la04z66nrpok	2026-01-06 04:02:20.177
cmk22golj000ql804bq25m2q9	cmk22golj000ol804s3it8wkg	cmih992ry0001la04z66nrpok	2026-01-06 04:05:26.792
cmk22j84n000ll504h8ttpana	cmk22j84n000jl5044bu52s5f	cmih992ry0001la04z66nrpok	2026-01-06 04:07:25.415
cmk22lum9000tl504o5ictmkn	cmk22lum8000rl504lr387qd1	cmih992ry0001la04z66nrpok	2026-01-06 04:09:27.873
cmk22oobb000zl80483j2tcjw	cmk22oobb000xl804442kubzw	cmih992ry0001la04z66nrpok	2026-01-06 04:11:39.671
cmk22r0m60018l8043bdd6890	cmk22r0m60016l804jm8lo6hl	cmih992ry0001la04z66nrpok	2026-01-06 04:13:28.926
cmk22vyy90012l504zygsk42r	cmk22vyy90010l504q8j12fo2	cmih992ry0001la04z66nrpok	2026-01-06 04:17:20.049
cmk22zktx000gl404dbw6f8q1	cmk22zktx000el404y46v4j49	cmih992ry0001la04z66nrpok	2026-01-06 04:20:08.373
cmk232qry001al50473kcagqg	cmk232qry0018l504de8d5n5d	cmih992ry0001la04z66nrpok	2026-01-06 04:22:36.046
cmk235h57001hl804lql711fe	cmk235h57001fl8048cuptyib	cmih992ry0001la04z66nrpok	2026-01-06 04:24:43.531
cmk239fex001jl504l4ji67ho	cmk239fex001hl504ok7mr9yc	cmih992ry0001la04z66nrpok	2026-01-06 04:27:47.914
cmk23d3dx000ql404yy4ig0e1	cmk23d3dx000ol404f65rtwxa	cmih992ry0001la04z66nrpok	2026-01-06 04:30:38.95
cmk23hdrf001sl504gkiczrq7	cmk23hdrf001ql504837h4q9t	cmih992ry0001la04z66nrpok	2026-01-06 04:33:59.019
cmk2438fp001ql804ucf28xpm	cmk2438fp001ol804rtelnsw2	cmi9zuxwu000dl404up390ywb	2026-01-06 04:50:58.549
cmk24gl4n0003jw04j81679l6	cmk24gl4n0001jw045th1wh40	cmhgd8l2q0004ky04uwi0a2pv	2026-01-06 05:01:21.527
cmk24t060000cjw04pvvujrq7	cmk24t060000ajw04boatd81y	cmhgd8l2q0004ky04uwi0a2pv	2026-01-06 05:11:00.888
cmk2520s50003l404pmm4mzo5	cmk2520s50001l404qkpsjgvb	cmhgd8l2q0004ky04uwi0a2pv	2026-01-06 05:18:01.589
cmk2638ut000mjw045ghndkv7	cmk2638ut000kjw04ltf139lv	cmht6sb1g0001js041506z3hz	2026-01-06 05:46:58.325
cmk29bmwr0003jo049zzs3fhk	cmk29bmwr0001jo04hfeh53f9	cmhgkntwx0001ib04a4y9dxou	2026-01-06 07:17:28.635
cmk29irql000bjo04xnwpqh94	cmk29irqk0009jo04kf1w5mlb	cmhgkntwx0001ib04a4y9dxou	2026-01-06 07:23:01.485
cmk29mfpl000kjo04laoyqx39	cmk29mfpl000ijo041te5ch3k	cmg5f33zu0001l804s1wrqr5t	2026-01-06 07:25:52.522
cmk29q9n10005l504d0jc67pp	cmk29q9n10003l504zcvctmgi	cmg5f33zu0001l804s1wrqr5t	2026-01-06 07:28:51.277
cmk29wdht0004l804ev1xntws	cmk29wdhs0002l804sxbc1f8z	cmg5f33zu0001l804s1wrqr5t	2026-01-06 07:33:36.209
cmk29zb27000tjo046q55k8hf	cmk29zb27000rjo044wbyddje	cmg5f33zu0001l804s1wrqr5t	2026-01-06 07:35:53.023
cmk2d57tl0003ie04z85ijao6	cmk2d57tl0001ie047dkbg2b8	cmih992ry0001la04z66nrpok	2026-01-06 09:04:27.61
cmk2dyljs000djv041eseu0ox	cmk2dyljs000bjv04jbu8sqmu	cmih992ry0001la04z66nrpok	2026-01-06 09:27:18.424
cmk2e18dl0005jl05hi0qqz1z	cmk2e18dk0003jl05mw6kf0ps	cmih992ry0001la04z66nrpok	2026-01-06 09:29:21.321
cmk2e60xg0004ld04sko88tji	cmk2e60xg0002ld045d7irr75	cmih992ry0001la04z66nrpok	2026-01-06 09:33:04.948
cmk2ec1ud000ljv04w3zirn0e	cmk2ec1ud000jjv04130x4vo8	cmih992ry0001la04z66nrpok	2026-01-06 09:37:46.069
cmk2hjk4i0003jr04i6mh5idr	cmk2hjk4i0001jr04ne2zw15q	cmhgkntwx0001ib04a4y9dxou	2026-01-06 11:07:35.203
cmk2hn2qy000bjr046pjfoph0	cmk2hn2qx0009jr04uv5zlnf8	cmhgkntwx0001ib04a4y9dxou	2026-01-06 11:10:19.306
cmk3hge360004l804vpu8c3lz	cmk3hge360002l804cnvb2opo	cmg5f33zu0001l804s1wrqr5t	2026-01-07 03:52:53.587
cmk3i7fbg000kl804dclslvw8	cmk3i3mz1000al804zcakqk77	cmg5f33zu0001l804s1wrqr5t	2026-01-07 04:13:54.893
cmk3k0vnl0004jm04pdby5iez	cmk3k0vnl0002jm04dun2ixo3	cmhq0p02k0001kw04yw2jjlgu	2026-01-07 05:04:48.706
cmk3n6z9h0001k004uer681ev	cmjjrgf080001ii04yw1u28ly	cmg5f3d7o0003l804vmxh5d2y	2026-01-07 06:33:32.165
cmk3na61m0001kz04ppgfgewo	cmjjqkbzj0001ju04wzh4c3af	cmg5f3d7o0003l804vmxh5d2y	2026-01-07 06:36:00.923
cmk3naew70004jl04ik5dv415	cmk3naew70002jl04eh5j6gpd	cmhq0p02k0001kw04yw2jjlgu	2026-01-07 06:36:12.391
cmk3nfz020001jp04x3l0mj3v	cmjjqnsoi0001js04y1l1t6pi	cmg5f3d7o0003l804vmxh5d2y	2026-01-07 06:40:31.73
cmk3nrhzj0001jm04b9f8nz57	cmjjqwrfc0001ju04264ip0lh	cmg5f3d7o0003l804vmxh5d2y	2026-01-07 06:49:29.551
cmk3nx8n50007jm04zf5m5552	cmjjqt6ji0001jy04txetgjky	cmg5f3d7o0003l804vmxh5d2y	2026-01-07 06:53:57.377
cmk3o60hi0009jp04nr6cb70v	cmk3o60hi0007jp04ujya83qp	cmhgknb5p0001js04qvasnpzo	2026-01-07 07:00:46.711
cmk3ogl4y0005lc04y5lfyub9	cmk3ogl4x0003lc04nefpzpir	cmhgknb5p0001js04qvasnpzo	2026-01-07 07:09:00.034
cmk3ojxbo0003l404xnfsevmr	cmk3ojxbn0001l404g9pl8po8	cmhgknb5p0001js04qvasnpzo	2026-01-07 07:11:35.796
cmk3or6wq000ak004ovcrpidl	cmk3or6wq0008k004ek2wy8wn	cmhgknb5p0001js04qvasnpzo	2026-01-07 07:17:14.811
cmk3oupbl000cl404ejwjwykf	cmk3oupbl000al404py90az3u	cmhgknb5p0001js04qvasnpzo	2026-01-07 07:19:58.641
cmk3paabs000jk004an8f3yks	cmk3paabs000hk004ek0uxmid	cmhq0p02k0001kw04yw2jjlgu	2026-01-07 07:32:05.704
cmk3q9po0000yk004wk8x3dql	cmj2vajzy001sle04w250t26w	cmhgkntwx0001ib04a4y9dxou	2026-01-07 07:59:38.545
cmk3uf63o0004js04tiv30jo6	cmk3uf63o0002js049ruqwyb7	cmhgkpywb0005ib04ymz2zgwk	2026-01-07 09:55:51.589
cmk3xwear0004js049fl60rti	cmk3xwear0002js04b344z8lo	cmht6sb1g0001js041506z3hz	2026-01-07 11:33:14.211
cmk3xz7jg000djs04vmzjlfpj	cmk3xz7jg000bjs04jz6jd44c	cmht6sb1g0001js041506z3hz	2026-01-07 11:35:25.42
cmk3y6mfw000ljs0455lupyx0	cmk3y6mfw000jjs04odka8i8a	cmht6sb1g0001js041506z3hz	2026-01-07 11:41:11.324
cmk3ycyan000tjs04rhbvofmn	cmk3ycyan000rjs04322aiapz	cmhgkpywb0005ib04ymz2zgwk	2026-01-07 11:46:06.623
cmk446tv60001l404kob3wcrp	cmi1vpqki000vk0045nskax3p	cmg5f33zu0001l804s1wrqr5t	2026-01-07 14:29:18.642
cmk447o0a0001l7047ys15jce	cmj19ht4p000ll504c4sdzwfk	cmg5f33zu0001l804s1wrqr5t	2026-01-07 14:29:57.707
cmk449sxn0007l404h3q1ltf1	cmj1a6hnz000jjv04upgyxsfc	cmg5f33zu0001l804s1wrqr5t	2026-01-07 14:31:37.403
cmk44c4rh000dl404y65ahe39	cmiwqx3wx0001jp04x68lzs1f	cmhgkoax60003js04bp3l0c36	2026-01-07 14:33:26.045
cmk44cvk1000jl404030gc8qo	cmj6uigrd000ei80469objs63	cmhgkpywb0005ib04ymz2zgwk	2026-01-07 14:34:00.769
cmk44e1sw0001l404s4lfdpwk	cmj6vk8xw000pky041vsf1x2k	cmhgkpywb0005ib04ymz2zgwk	2026-01-07 14:34:55.52
cmk44gsni0005l70491neeig4	cmj88e2k10001l204hbsanhfr	cmhgkpywb0005ib04ymz2zgwk	2026-01-07 14:37:03.63
cmk44kn5q0001kz04l1fat49y	cmifmowbv0001jo046x81xk84	cmhgkr6uf0003l804bzsy4f16	2026-01-07 14:40:03.134
cmk44l4450007kz04e3830w5h	cmiehd01m0007jp0463lnwrb0	cmhgkr6uf0003l804bzsy4f16	2026-01-07 14:40:25.109
cmk46kr5v0001kv04glsjc42x	cmishjbaz0009lb04w1lfxzi7	cmht6sb1g0001js041506z3hz	2026-01-07 15:36:07.555
cmk46pohs0001ky04xf8dmjfi	cmishpz7t000hlb0479yzcqnq	cmht6sb1g0001js041506z3hz	2026-01-07 15:39:57.376
cmk4zbteq0003l804nykgkl18	cmk4zbteq0001l804mjxibulg	cmhgknb5p0001js04qvasnpzo	2026-01-08 05:00:59.426
cmk529lzj0003ii045h8c4l1b	cmk529lzj0001ii04wglsw9uo	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:23:15.343
cmk52cvag000cii04uj72bd84	cmk52cvag000aii04nxxa7xyw	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:25:47.369
cmk52huyh000lii049pzn593f	cmk52huyh000jii044ogvped3	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:29:40.217
cmk52n9dq000clb04sfucw2vz	cmk52n9dq000alb04aww67o8q	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:33:52.19
cmk52rjzq000bla04efsc1poc	cmk52rjzq0009la0464ukkl7k	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:37:12.566
cmk530jr2000llb04hwcq334q	cmk530jr2000jlb04oizxa3nh	cmhgkpywb0005ib04ymz2zgwk	2026-01-08 06:44:12.158
cmk542hq30003i00412n28sim	cmk542hq30001i0047k5l7s0p	cmhgknb5p0001js04qvasnpzo	2026-01-08 07:13:42.459
cmk5bum7i0001ky04v45ksvwq	cmjjohbkw0001l504rc7agsdj	cmht6sb1g0001js041506z3hz	2026-01-08 10:51:31.95
cmk5ctmvj0003lc044o2w77s0	cmk5ctmvj0001lc04341ymihj	cmhgknb5p0001js04qvasnpzo	2026-01-08 11:18:45.775
cmk5gopzr0001l2048hefuy8v	cmhrttccq0001ld049y0fc2w1	cmg5f33zu0001l804s1wrqr5t	2026-01-08 13:06:55
cmk81qmsg0001l104vhy7ehab	cmjgv0mpt0009i104ahr75f1p	cmitygf3c0001jl0465c0k3t9	2026-01-10 08:31:48.448
cmk81sbx80001jp042ai9xg4l	cmj2tba95000ljr04ahgx6yuq	cmitygf3c0001jl0465c0k3t9	2026-01-10 08:33:07.677
cmk81uj3y0007l1045azrcsqm	cmjo1h4ws0009l804xmlv9l75	cmhgkpywb0005ib04ymz2zgwk	2026-01-10 08:34:50.302
cmk81w16a0001ib04p6rwbm5v	cmj6uws0e0009ky04tg1otue3	cmhgkpywb0005ib04ymz2zgwk	2026-01-10 08:36:00.37
cmk81xmez0001l704m75v143y	cmj88hlye0001l8049hmqg0wx	cmhgkpywb0005ib04ymz2zgwk	2026-01-10 08:37:14.556
\.


--
-- Data for Name: product_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_media (id, "productId", "mediaId", "isPrimary", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmiwqx4in0005jp04mici189w	cmiwqx3wx0001jp04x68lzs1f	cmiwqnwt60000l1043tpob1nv	t	0	2025-12-08 06:03:45.311	2026-01-07 14:33:27.6
cmj19y2os0005ld04n6snzxny	cmj19y2ak0001ld04knippgnd	cmj15omf3000dlb04h4yuvbwp	t	0	2025-12-11 10:07:27.004	2025-12-11 10:07:27.849
cmiwzmsga001fk304umxq0js9	cmiwzmrzy001bk304otwefuou	cmiwytovc000ekz04yjcowljw	t	0	2025-12-08 10:07:39.658	2025-12-08 11:10:13.592
cmix0a5bu000rjm04h4by73m9	cmix0a4ue000njm04nidnxrvw	cmiwyvizl000nkz04148n71lm	t	0	2025-12-08 10:25:49.434	2025-12-08 10:39:10.42
cmiybqi39000fl804e8xrbnu3	cmiybqhqg000bl804xk6za6wh	cmiya1mkf000cld04g7mknj36	t	0	2025-12-09 08:34:14.421	2025-12-09 08:34:14.847
cmiyj2g9r000djx04w2j41zbu	cmiyj2fuu0009jx047ac3ny48	cmiya43m9000mld04cpxjk15z	t	0	2025-12-09 11:59:29.247	2025-12-09 11:59:29.678
cmiyawa630009js04iqpp1ue8	cmiyaw9n40005js045eszzoxy	cmiy9v1y60000ld04zoarfw2w	f	0	2025-12-09 08:10:44.475	2025-12-09 13:33:18.907
cmhiyvlpm0005la048thfrvt0	cmhiyvlbh0001la045johq640	cmhiypnnz0000l4044cyiou4g	t	0	2025-11-03 09:58:02.41	2025-11-03 09:58:02.812
cmizli2sg000nic045as47wp7	cmizli28b000dic046ptld805	cmizl0z9s0006ic04d28f7ce6	f	5	2025-12-10 05:55:23.516	2025-12-10 05:55:23.516
cmiwz98yw0007jm04mxerhay6	cmiwz98gb0001jm045m47oner	cmiwysgdx0003kz04ae7g3u5s	t	0	2025-12-08 09:57:07.727	2025-12-08 11:04:04.763
cmjjyfmc30005l404jxmqerfs	cmjjyflvy0001l4041djfubuw	cmjjxmrre0004jv04ahbgchh3	t	0	2025-12-24 11:52:47.572	2025-12-24 11:52:48
cmj1bfbsx000pld04a2yu3ytx	cmj1954vl0001jv04teoxuvj1	cmj1b0lc0000bld04iafvluku	t	0	2025-12-11 10:48:51.436	2025-12-11 10:49:35.994
cmiztyy4n0005jo041szxmxvp	cmiztyxg90001jo04ikrn1bt4	cmizrldix0001jv04tjycz5x1	f	0	2025-12-10 09:52:27.72	2025-12-10 10:13:55.085
cmj2tvv5l0013jr047io6p1f0	cmj2tvupf000zjr044k5yfw8d	cmj2tkff2000dle041qwfe29f	t	0	2025-12-12 12:13:22.425	2025-12-12 12:13:22.829
cmizvxoaj0005jr047xk8dxr3	cmizvxnua0001jr04j6a2c058	cmizrmgl5000ajv04zpjlgxpj	t	0	2025-12-10 10:47:27.547	2025-12-10 10:48:05.499
cmizxkmke000tjp04dxmu3lag	cmizxkm46000pjp04yibdgoud	cmizxc7eg0009l804e5g48tp3	f	1	2025-12-10 11:33:18.014	2025-12-10 12:22:04.687
cmj10cvnz0007js04z8qayx43	cmj10cv2s0001js04cg935auv	cmj104yks0000l204vqd0wz6n	t	0	2025-12-11 05:39:01.411	2025-12-11 05:39:02.122
cmj1982mj0007jr04r05h5q4z	cmj19828d0001jr04n7j7ljfi	cmj15n4cb0005lb04b9ftjfo2	f	1	2025-12-11 09:47:13.856	2025-12-11 09:47:13.856
cmj2ty095001bjr04tsn3fkck	cmj2txzwb0017jr04ius0xa0j	cmj2tkfhj000ele04wd2ivawf	t	0	2025-12-12 12:15:02.345	2025-12-12 12:15:02.956
cmj6uqwk2000qi804pocabuxn	cmj6uqw3r000mi804n2xdqxeq	cmj6u90440003i804xvk3o303	t	0	2025-12-15 07:48:35.283	2025-12-15 07:48:35.803
cmj6w00xl0017ky045ylwjh64	cmj6w00av0013ky04dfgydq1a	cmj6ubga9000ai804oh898pce	t	0	2025-12-15 08:23:40.473	2025-12-15 08:23:41.024
cmj88e2zd0005l204onmem95u	cmj88e2k10001l204hbsanhfr	cmj87rz4w0000k404qpporsoc	t	0	2025-12-16 06:58:17.882	2026-01-07 14:37:05.78
cmj9tgs63000bl804h5oytmh7	cmj9tgrr20007l804x8t834jb	cmj9rmtos0001l7047yuq5m6y	t	0	2025-12-17 09:36:01.947	2025-12-17 09:58:27.336
cmj9uh1w20005jy045z15mexy	cmj9uh1hd0001jy04ytx5usc8	cmj9roomr0008l7047zk8anq3	t	0	2025-12-17 10:04:14.163	2025-12-17 10:04:14.679
cmjb41j8c000ijr04wxvnrta2	cmjb41isn000ejr04dmv3ny4k	cmjb3ulu8000ajr040ioy4m83	t	0	2025-12-18 07:19:52.476	2025-12-18 07:19:52.976
cmjb5yrcj0005ie0408vebr6b	cmjb5yqv90001ie048y56x03m	cmjb5utph0009js04c8uhrwbe	t	0	2025-12-18 08:13:42.26	2025-12-18 08:13:42.753
cmjb7anp5000dl104r4r025cq	cmjb7anc70009l1042mi5f9rd	cmjb6xwlz0004la047zbbt9lw	t	0	2025-12-18 08:50:57.018	2025-12-18 08:50:57.44
cmjci8gqy0005js04o8ys45j3	cmjci8gcb0001js04vyuwhdxd	cmjchzwr80002ib0466x0hmnj	t	0	2025-12-19 06:44:56.65	2025-12-19 06:44:57.154
cmjcjtljt000zl204we80ybev	cmjcjtl5j000vl204wzc6bmnr	cmjcjgvgv000kl204pb1xh6pa	t	0	2025-12-19 07:29:22.265	2025-12-19 07:29:22.782
cmjgv42u90005jo044qqtouob	cmjgv42ew0001jo04dlpbpcdm	cmjgunuta0005jo04f3jlxjxd	t	0	2025-12-22 07:56:31.714	2025-12-22 07:56:32.122
cmji8z6gf000vkz04iqyy668u	cmji8z610000rkz04dkma3mhh	cmji87tyb0005kz04vtrbwtas	t	0	2025-12-23 07:12:23.92	2025-12-23 07:12:24.338
cmjjohc120005l504uco2gmer	cmjjohbkw0001l504rc7agsdj	cmjjo4g5j0002l8047k4xbfcq	t	0	2025-12-24 07:14:11.366	2026-01-08 10:51:33.847
cmjjqkcfs0005ju04j82g42ha	cmjjqkbzj0001ju04wzh4c3af	cmjjqdzjd0000js043vp27bzx	t	0	2025-12-24 08:12:31.096	2026-01-07 06:36:02.457
cmjjrgfdt0005ii04otkql5sz	cmjjrgf080001ii04yw1u28ly	cmjjqf7hc0007js04ag2a2a2d	t	0	2025-12-24 08:37:27.905	2026-01-07 06:33:33.69
cmjqtpevu000dle04zut1afd5	cmjqtpejk0009le04v6s3ukku	cmjqt612t0004jy04b1ar4xk5	t	0	2025-12-29 07:14:49.626	2025-12-29 07:14:50.03
cmjl3jx0e0005jm04l8k5bmgb	cmjl3jwdq0001jm04kocjalgg	cmjl390ip0000jo041h60jihv	t	0	2025-12-25 07:03:52.287	2025-12-25 07:08:39.451
cmjs8fajt0005kz044ws7srde	cmjs8fa490001kz04tbitluof	cmjr1wlxl0001kz04c31cz2f7	t	0	2025-12-30 06:54:37.865	2025-12-30 06:54:38.397
cmjtlvec2000bjz04p8kt3qdr	cmjtlvdxh0007jz04h24gmmpt	cmjtlq3sp0001l80468y2rri4	t	0	2025-12-31 05:58:50.45	2025-12-31 05:58:50.883
cmjl4spip000lks04f7w0xurq	cmjl4sp46000hks046gcg5fy0	cmjl3a6aj0008jo04l5uco4kv	t	0	2025-12-25 07:38:42.097	2025-12-25 08:03:38.987
cmjmiop5u0005jp049w5wounx	cmjmioopy0001jp04uepyzj84	cmjmigetk0001jr04rkjdfuz4	t	0	2025-12-26 06:55:15.81	2025-12-26 06:55:16.308
cmjnwhhni0005ih04rjbb05dr	cmjnwhh8x0001ih041v4hjait	cmjnw5j370003jp045crgbjqn	t	0	2025-12-27 06:09:20.287	2025-12-27 06:09:20.719
cmjnyffw7000rjj04aq6d2aag	cmjnyffgm000njj049w7ulrhe	cmjny6l4d000djj04pepupr7v	t	0	2025-12-27 07:03:43.927	2025-12-27 07:03:44.371
cmjo1h5bi000dl804lv56jz7c	cmjo1h4ws0009l804xmlv9l75	cmjo0vnzw0005kz04b0t57ke5	t	0	2025-12-27 08:29:02.382	2026-01-10 08:34:51.7
cmjsa11uv0005jo04c02w1lpb	cmjsa11gb0001jo04ctf4nom4	cmjr22qem000kkz04hyomh53e	t	0	2025-12-30 07:39:32.647	2025-12-30 07:39:33.063
cmjsaqy3r0008l104ih3d6ywz	cmjsaqxme0004l104hw0ecx84	cmjsalwcv0000lg04lk1qvb5u	t	0	2025-12-30 07:59:40.839	2025-12-30 07:59:41.317
cmjs90xtz000dkz045t3xloj3	cmjs90xgk0009kz04kzja35t9	cmjr1z6bs0008kz04o0hwf70c	t	0	2025-12-30 07:11:27.816	2025-12-30 08:18:00.408
cmjs9delz000hl704962beuz0	cmjs9ddzv0009l7040uzoq6md	cmjr23g2h000pkz04r01nd1ov	f	2	2025-12-30 07:21:09.26	2025-12-30 08:22:21.695
cmjtneke20006jr04ymjv1ndo	cmjtnejxj0002jr04xo079ktw	cmjtnaudp0000jr04mym5zqmk	t	0	2025-12-31 06:41:44.378	2025-12-31 06:41:44.875
cmjtog8ud000mjr04ouj3ujon	cmjtog8g1000ijr04r10x2m7o	cmjtm6e1g0009l204mewqyxru	t	0	2025-12-31 07:11:02.341	2025-12-31 07:11:02.783
cmjtp2urs000pjl04hnanr7dh	cmjtp2uet000ljl0454qgma3p	cmjtozogf000yjl04cm40u2qs	t	0	2025-12-31 07:28:37.193	2025-12-31 07:28:37.612
cmjuxrzdp0005l504icbkz59a	cmjuxrysv0001l504lhrbodsw	cmjuxk5rh0000l40473fcxinc	t	0	2026-01-01 04:19:52.67	2026-01-01 04:19:53.123
cmjv3we7d0005l804paci2ayi	cmjv3wdr30001l804tpk0n311	cmjv3sonk0000kw04yg19tuh1	t	0	2026-01-01 07:11:16.202	2026-01-01 07:11:16.712
cmjxxz8rd000nl504qawqafki	cmjxxz8de000jl5043e4a0liq	cmjxxy38j000hl50435f5b1nh	t	0	2026-01-03 06:48:49.945	2026-01-03 06:48:50.328
cmk0qy3b70005l8049fz9vzy5	cmk0qy2xl0001l804d0v3j34s	cmk0qvnys0000li048x35pvg1	t	0	2026-01-05 05:55:17.443	2026-01-05 05:55:17.906
cmk0sb0ti0005k104z6q1xmmc	cmk0sb0ec0001k104gz0kpd9m	cmk0rt3e90001kt04o2ehektc	t	0	2026-01-05 06:33:20.359	2026-01-05 07:11:14.365
cmk0su7fu000ili04im4rk3vk	cmk0su6yf000cli04aov48k85	cmk0rt3lj0004kt04gm3s2ihc	t	0	2026-01-05 06:48:15.402	2026-01-05 07:05:25.381
cmk0ticdc000bjj04skt3s2uf	cmk0tic0q0007jj04m60p6p25	cmk0tdr7n0000l204xyiw78ai	t	0	2026-01-05 07:07:01.537	2026-01-05 07:07:01.902
cmk0yu9oz0005l304vr8x8wzw	cmk0yu9530001l304mvpgpp9a	cmk0ypqew000al504cvlpt0b6	t	0	2026-01-05 09:36:16.019	2026-01-05 09:36:16.543
cmk22a27q000el504ficfmw9y	cmk22a1th000al50432b0thcj	cmk228si30008l504c73f3d33	t	0	2026-01-06 04:00:17.847	2026-01-06 04:00:18.279
cmiwr040m0005l704rv9p0s1w	cmiwr03l60001l704ithbg3pv	cmiwqo6i70001l104x67jdckn	t	0	2025-12-08 06:06:04.63	2025-12-08 06:06:05.104
cmiwzomc7000ukz04ss75uotq	cmiwzolz7000qkz04bg36n1ef	cmiwyubr2000fkz04h4whrh7l	t	0	2025-12-08 10:09:05.047	2025-12-08 10:09:05.577
cmiyb20ns000jjs04lvnjc9ii	cmiyb209u000fjs04u8y05yo6	cmiy9vkdb0001ld0420tj9f38	t	0	2025-12-09 08:15:12.088	2025-12-09 08:15:12.746
cmix0beni002bk304fn93q644	cmix0be9b0027k304rmgt8hdm	cmiwyvj32000okz04ntem5jwn	t	0	2025-12-08 10:26:48.175	2025-12-08 10:40:05.46
cmj19y2xb0007ld04isl0mc7m	cmj19y2ak0001ld04knippgnd	cmj19srww000sl50488h4epuc	f	1	2025-12-11 10:07:27.005	2025-12-11 10:07:27.005
cmiwz990e0009jm04g0otc2d5	cmiwz98gb0001jm045m47oner	cmiwys5ps0002kz04iw5l2yjx	f	0	2025-12-08 09:57:07.727	2025-12-08 11:04:04.237
cmiybywhh000nl804bvsy7zwb	cmiybyvw6000jl804usz052ug	cmiya2pag000dld048bi9jdim	t	0	2025-12-09 08:40:46.326	2025-12-09 08:48:00.563
cmiyjcn830005jj04t6tr1d4j	cmiyjcmsg0001jj04sctno10h	cmiya4l7o000old04w2069vh9	t	0	2025-12-09 12:07:24.82	2025-12-09 12:07:26.948
cmj2ssh620005jr04f46u1gqj	cmj2ssgso0001jr042y4xkjyr	cmj2sletv0000le044f1f04zh	t	0	2025-12-12 11:42:44.715	2025-12-12 11:42:45.117
cmj2sxqpp000fjr04d3q1snx0	cmj2sxq540009jr04qy5th0wn	cmj2slf1n0003le04i1v82rv5	f	1	2025-12-12 11:46:50.349	2025-12-12 11:46:50.349
cmj2ucecp0018le044j7zl53g	cmj2ucdzm0014le04asenjpco	cmj2u4uzd001fjr0477nvbvsi	t	0	2025-12-12 12:26:13.801	2025-12-12 12:26:14.541
cmj6uwsj8000dky04p2qzi6m8	cmj6uws0e0009ky04tg1otue3	cmj6u9f7c0004i804xxd3j42f	t	0	2025-12-15 07:53:10.005	2026-01-10 08:36:01.995
cmj6w44e20018i804lj8e01k1	cmj6w43pd0014i804goyhekbl	cmj6ubgdr000bi804ack8q4l6	t	0	2025-12-15 08:26:51.579	2025-12-15 08:26:52.311
cmiyawa8o000bjs045l32njao	cmiyaw9n40005js045eszzoxy	cmiy9w7470003ld0421s65ahz	t	0	2025-12-09 08:10:44.476	2025-12-09 13:39:36.785
cmizli2su000pic040fc5kdp9	cmizli28b000dic046ptld805	cmizl0z720005ic04xhmno1dw	f	4	2025-12-10 05:55:23.516	2025-12-10 05:55:23.516
cmizu3m3l000djx04f3t69lla	cmizu3lom0009jx04kjzpty2b	cmizrldlo0002jv04rdswhcu6	t	0	2025-12-10 09:56:05.409	2025-12-10 09:56:05.835
cmizwfp4m0005l8042gm9b9yr	cmizwfoqs0001l804clgfaweq	cmizrnyd6000bjv04mftm3ugl	t	0	2025-12-10 11:01:28.438	2025-12-10 11:01:28.965
cmj88hmcu0005l8048q6elcf6	cmj88hlye0001l8049hmqg0wx	cmj886wcz0000le0497bbk16z	t	0	2025-12-16 07:01:02.958	2026-01-10 08:37:16.144
cmizxkmku000vjp04v6nrcnm3	cmizxkm46000pjp04yibdgoud	cmizrpl4l000ljv04nxwchrk8	t	0	2025-12-10 11:33:18.015	2025-12-10 12:22:05.322
cmj10x766000fjs0477cnt466	cmj10x6rc000bjs04aeppqojw	cmj10iebr0000l7044n1u1zn6	t	0	2025-12-11 05:54:49.613	2025-12-11 05:54:50.248
cmj19bj2h000fjv04u48lwb5u	cmj19bimx000bjv040k0a3f47	cmj15ng9g0006lb04016aub06	t	0	2025-12-11 09:49:55.146	2025-12-11 09:49:55.663
cmjl3o95p0005kz04jsgg7a1c	cmjl3o8rm0001kz0467mz3iva	cmjl390me0001jo04fsa3y0js	t	0	2025-12-25 07:07:14.653	2025-12-25 07:07:15.168
cmjl50cys000zks04ez6qj6u3	cmjl50ck1000vks04rg1ovash	cmjl3a6e40009jo04tivwto1c	t	0	2025-12-25 07:44:39.076	2025-12-25 07:44:39.482
cmj9umrev0005jv04jtsd50by	cmj9umqxa0001jv04xceoc81e	cmj9rv82z0009l7048lf1v8gh	t	0	2025-12-17 10:08:40.52	2025-12-17 10:08:41.041
cmj9tl5ni0005l404wauamong	cmj9tl56y0001l4043enqfgt8	cmj9rncxe0002l704s1qdbpjz	t	0	2025-12-17 09:39:26.046	2025-12-17 10:17:11.959
cmjb43px40005jp04ki4eaj6j	cmjb43pj90001jp049z3l53cr	cmjb3ulwg000bjr04na3t59t0	t	0	2025-12-18 07:21:34.456	2025-12-18 07:21:34.981
cmjb631b7000die04ioo2ptz0	cmjb630vc0009ie04kcyaf9b3	cmjb5utrt000ajs041axchvvx	t	0	2025-12-18 08:17:01.796	2025-12-18 08:17:02.34
cmjcgvmsp0005k104l5qvxcrv	cmjcgvm610001k10496673wsi	cmjcgqfmg0000l704symu1ts7	t	0	2025-12-19 06:06:58.345	2025-12-19 06:06:59.046
cmjcialpu000aib04353tz4sq	cmjcial900006ib04melolbmn	cmjchzwtb0003ib0437dc5986	t	0	2025-12-19 06:46:36.402	2025-12-19 06:46:36.889
cmjcjvqnx000dl204ejc9q778	cmjcjvq8c0009l204p05tpsle	cmjcjgviu000ll20435364lg3	t	0	2025-12-19 07:31:02.205	2025-12-19 07:31:02.741
cmjgv6ah40005ih04hqounpvu	cmjgv6a4d0001ih04eb0i7ven	cmjgunuvt0006jo04qghqot6b	t	0	2025-12-22 07:58:14.921	2025-12-22 07:58:15.361
cmji91urg0005kw04j79oqi1a	cmji91ueg0001kw0447gr2wq4	cmji87u6l0006kz04wvdtgiv7	t	0	2025-12-23 07:14:28.733	2025-12-23 07:14:29.158
cmjjqnt660005js04l05dkjcm	cmjjqnsoi0001js04y1l1t6pi	cmjjqdznh0001js04vc3svk2p	t	0	2025-12-24 08:15:12.751	2026-01-07 06:40:33.668
cmjjrjblf000dl704bpvcwprv	cmjjrjb830009l704cnuetku9	cmjjqf7kz0008js045tjlog8o	t	0	2025-12-24 08:39:42.963	2025-12-24 08:39:43.393
cmjjyj00c0005l304rm4wz0pw	cmjjyizmp0001l304dcxortjl	cmjjxoaln0005jv045ho50m9z	t	0	2025-12-24 11:55:25.26	2025-12-24 11:55:25.685
cmjmisumm000ijr04lcmjkm55	cmjmisu7v000ejr04xb7t80g0	cmjmigew20002jr043sa1gafl	t	0	2025-12-26 06:58:29.518	2025-12-26 06:58:29.976
cmjnx3rpx0007jz04msx147w8	cmjnx3rb90003jz04imm7k71j	cmjnx1si10000jz04wpbul2m5	t	0	2025-12-27 06:26:39.765	2025-12-27 06:26:40.193
cmjnyjgki000flb04w085jvbe	cmjnyjg7f000blb04gp0unx7c	cmjnygkmz0008lb04qrs25461	t	0	2025-12-27 07:06:51.426	2025-12-27 07:06:51.849
cmjo1ljl2000ckz04tr9zvhig	cmjo1lj5n0008kz04z28bkc80	cmjo0w4zj0006kz0425kexple	t	0	2025-12-27 08:32:27.495	2025-12-27 08:32:28.236
cmjqtsvz7000mjy04zd1p371a	cmjqtsvjs000ijy04vsk72cez	cmjqt61560005jy04cretvzc1	t	0	2025-12-29 07:17:31.747	2025-12-29 07:17:32.175
cmjs8ij9m0005l704pr6kdqam	cmjs8iiu20001l704a31vnmdq	cmjr1wwdu0002kz04rsypguu9	t	0	2025-12-30 06:57:09.131	2025-12-30 06:57:09.611
cmjs9ppo50005l504azztlatm	cmjs9pp6j0001l50499ik07ke	cmjr21hy2000fkz04onbgvuen	t	0	2025-12-30 07:30:43.637	2025-12-30 07:30:44.058
cmjsa31oi0005l504drj8n3u9	cmjsa319i0001l50471nsxe57	cmjr23prw000qkz04r0739fep	t	0	2025-12-30 07:41:05.731	2025-12-30 07:41:06.17
cmjsasygt0005la04z6cr60fr	cmjsasy1r0001la04nx00bytv	cmjsalwga0001lg04kxwe62gv	t	0	2025-12-30 08:01:14.621	2025-12-30 08:01:15.128
cmjs90xu9000fkz049cgi96mh	cmjs90xgk0009kz04kzja35t9	cmjr1z6f00009kz049st2vr4z	f	1	2025-12-30 07:11:27.816	2025-12-30 08:17:59.717
cmjtnf0y60005jj04erf8f6bv	cmjtnf0jm0001jj04he3eveui	cmjtm4l6f0005l2048co8qugl	t	0	2025-12-31 06:42:05.838	2025-12-31 07:02:41.209
cmjtoix5z0005lb04c3hprcuu	cmjtoiwsz0001lb04ajvt9ejv	cmjtm6e3p000al2047dswmibt	t	0	2025-12-31 07:13:07.176	2025-12-31 07:13:07.752
cmjv0efdb0005l5048s1e8zi2	cmjv0eeqy0001l504pcxi6vua	cmjv0bros0001jr04wl0w9i2s	t	0	2026-01-01 05:33:19.055	2026-01-01 05:33:19.603
cmjtmdqgt000jl204fjhq1tnz	cmjtmdpvo000fl204u309ut89	cmjtm3g1k0000l2045r9k4056	t	0	2025-12-31 06:13:05.981	2025-12-31 07:32:33.321
cmjtpf6eq001gjj04epl2dduk	cmjtpf62g001cjj04w7160ys8	cmjtp8h69000ejp04yi98cix4	t	0	2025-12-31 07:38:12.146	2025-12-31 07:38:12.555
cmjv5nos60007kw04u13kyfu3	cmjv5no9a0003kw04a09jv8jf	cmjv5ieky0001kw0445lutje0	t	0	2026-01-01 08:00:29.238	2026-01-01 08:00:30.126
cmjwdcdl1000di204jtsjro5z	cmjwdcd7o0009i204110lzmgv	cmjwdab9e0007i20457lmrxzw	t	0	2026-01-02 04:23:24.613	2026-01-02 04:23:25.013
cmjxy6twe000elb04jfqwt1fn	cmjxy6th6000alb044xn0rf1f	cmjxy5823000ql504dqncia00	t	0	2026-01-03 06:54:43.935	2026-01-03 06:54:44.332
cmk0rc2980005l704ekpduv0l	cmk0rc1uj0001l704k2sq881t	cmk0r9tzy0008l8044ajlxk0u	t	0	2026-01-05 06:06:09.26	2026-01-05 06:06:09.673
cmk0sfxey0008li04shsijobw	cmk0sfwzk0004li04ox7azp2s	cmk0rt3gd0002kt04cj4ax4td	t	0	2026-01-05 06:37:09.226	2026-01-05 07:12:34.578
cmk0t0y6l000ljv040714l0ru	cmk0t0xsq000hjv042vvu6aqa	cmk0rt3q50006kt04eb2r8y1u	t	0	2026-01-05 06:53:29.998	2026-01-05 07:08:00.526
cmk0tmjpc0018l204hkmkaodv	cmk0tmjbd0014l204oc9majv8	cmk0tkzm70000jo04j22yae8d	t	0	2026-01-05 07:10:17.665	2026-01-05 07:10:18.022
cmk10hrd80005i6048qypmqdx	cmk10hqyh0001i604hdvih2e9	cmk10ffxo0000jr044rb9pvx5	t	0	2026-01-05 10:22:31.628	2026-01-05 10:22:32.165
cmjjohc1e0007l504mxc8yjeo	cmjjohbkw0001l504rc7agsdj	cmjjo4g9m0003l804ppjsbfx6	f	1	2025-12-24 07:14:11.366	2026-01-08 10:51:32.933
cmj1a3gof000zl504nuxv9p03	cmj1a3gap000vl504g82yuqhm	cmj15qizd000glb04d4756dgp	f	1	2025-12-11 10:11:38.415	2025-12-11 10:11:38.415
cmiwzb0ui000fk304u3nprrsc	cmiwzb0ei000bk304zhdiug18	cmiwyswjv0004kz042dxsjzac	t	0	2025-12-08 09:58:30.667	2025-12-08 11:06:27.245
cmiwr3bht0005ju04oqa2iklj	cmiwr3b390001ju043i5r1sh0	cmiwqo6nz0002l104vqyo9klv	t	0	2025-12-08 06:08:34.289	2025-12-08 06:08:34.721
cmiwzqg64001nk304xhysrp5s	cmiwzqfrr001jk304q39bea37	cmiwyubut000gkz047or7x283	t	0	2025-12-08 10:10:30.364	2025-12-08 10:10:30.876
cmj2sxqp9000djr04mi2jih42	cmj2sxq540009jr04qy5th0wn	cmj2slexi0001le046fvx7uko	t	0	2025-12-12 11:46:50.349	2025-12-12 11:46:50.806
cmiwzf1ai000pk304myiuot30	cmiwzf0sd000jk304699r6vx8	cmiwyswpq0006kz048ivz5uaz	t	0	2025-12-08 10:01:37.857	2025-12-08 11:24:12.43
cmiyb20rp000ljs04loqu2cbu	cmiyb209u000fjs04u8y05yo6	cmiy9vyhm0002ld04o82shj0j	f	1	2025-12-09 08:15:12.088	2025-12-09 08:15:12.088
cmiyc6u5q000djr04p20do0ka	cmiyc6tsj0009jr04qxccoypf	cmiya2pdq000eld04ubb8yios	t	0	2025-12-09 08:46:56.558	2025-12-09 08:46:56.963
cmiycb13a000rjr04i2kj3fmg	cmiycb0rs000njr04p1oejn2e	cmiya344y000fld04c0s4duwv	t	0	2025-12-09 08:50:12.167	2025-12-09 08:50:12.583
cmiyjjbgr0005ie04flvjj1nx	cmiyjjb230001ie04uw6rhaex	cmiya4uyd000pld04dl8x3h1v	t	0	2025-12-09 12:12:36.172	2025-12-09 12:12:36.632
cmizli2vt000ric04e9p4rhyb	cmizli28b000dic046ptld805	cmizkzy8p0002ic04x4zd381s	f	1	2025-12-10 05:55:23.515	2025-12-10 05:55:23.515
cmizu8ovv000bl804ektps5lz	cmizu8ofk0007l804mg32hody	cmizrldo20003jv04pncehukk	t	0	2025-12-10 10:00:02.3	2025-12-10 10:00:02.868
cmizwkdit0005jp04smz3hfua	cmizwkd3m0001jp0466f99oue	cmizrnyg2000cjv043qba3y32	t	0	2025-12-10 11:05:06.677	2025-12-10 11:05:07.18
cmizxog5c0013jp04om1kvtlc	cmizxofna000zjp04o1xdddtv	cmizxc7b10008l804b00s2kks	t	0	2025-12-10 11:36:16.32	2025-12-10 11:36:16.793
cmj10x796000hjs04lnmrvnb2	cmj10x6rc000bjs04aeppqojw	cmj10jelw0002l704pagisk6g	f	2	2025-12-11 05:54:49.614	2025-12-11 05:54:49.614
cmj19es8n000fl504joxnmpv7	cmj19ers5000bl50468tqi94o	cmj15ngfd0008lb04nui4gmgj	f	1	2025-12-11 09:52:26.999	2025-12-11 09:52:26.999
cmj2ulj4t001gle04nflaz6dh	cmj2ulioj001cle04pkvi7iot	cmj2udkos000fle04gngtdugh	t	0	2025-12-12 12:33:19.902	2025-12-12 12:33:20.451
cmj6v54n9000lky04ax320udy	cmj6v549t000hky04e3anafiy	cmj6u9fav0005i804oqec3buu	t	0	2025-12-15 07:59:38.949	2025-12-15 07:59:39.368
cmj858x4a0005l4049f7nfjp8	cmj858wgi0001l404lopxlbau	cmj6yoptq0000lg04x9gmdrjn	t	0	2025-12-16 05:30:18.154	2025-12-16 05:30:18.585
cmj893t480005l204y6d1mzc2	cmj893so70001l204mfe0rhfy	cmj88ze3y0008l204jonvyaf9	t	0	2025-12-16 07:18:18.153	2025-12-16 07:18:18.609
cmjl3v4gt000ijo0456cbwbn2	cmjl3v40v000ejo04b7v1gehs	cmjl39bsh0002jo04fy44yryq	t	0	2025-12-25 07:12:35.165	2025-12-25 07:12:35.684
cmj9to7ka0006i8042k90tuqb	cmj9to75u0002i8046rj4zmgs	cmj9t83p90000i804xq9nx5sn	t	0	2025-12-17 09:41:48.49	2025-12-17 09:57:02.362
cmjb2kht60005jr04l5twf3mv	cmjb2kh5q0001jr04ck2wo6p6	cmjb1tdro0000ii04zg7alggr	t	0	2025-12-18 06:38:37.866	2025-12-18 06:38:38.334
cmjb4yovo000akw04sr8v46k5	cmjb4yohw0006kw04kz54xrgm	cmjb4v8zb0000kw04ngsm722g	t	0	2025-12-18 07:45:39.444	2025-12-18 07:45:39.883
cmjb66b9x0005ju04zain15cc	cmjb66avf0001ju04w20u0sxg	cmjb5utu5000bjs04u9n3293h	t	0	2025-12-18 08:19:34.678	2025-12-18 08:19:35.117
cmjcgxayy0005ky04wbhdf0mi	cmjcgxaiy0001ky041a89u8ep	cmjcgqfre0001l704vv3ymzst	t	0	2025-12-19 06:08:16.331	2025-12-19 06:08:16.748
cmjcicjxh000dl204ytsivcpz	cmjcicjjb0009l204h9m5o69t	cmjchzwvm0004ib04ctn9j1cz	t	0	2025-12-19 06:48:07.397	2025-12-19 06:48:07.926
cmjguqp2l000cjo04ix5x7yj8	cmjguqogl0008jo04zc0einko	cmjgun5pw0000jo0464uc11cv	t	0	2025-12-22 07:46:07.341	2025-12-22 07:46:07.796
cmji8fzgt0005kw042or3ja4e	cmji8fyvc0001kw04fnt0law6	cmji86xw00000kz04erqydq27	t	0	2025-12-23 06:57:28.397	2025-12-23 06:57:28.831
cmji94odp0005jx04k8cu59ya	cmji94nyz0001jx04akfb4mly	cmji883cm0007kz04tvx0eru9	t	0	2025-12-23 07:16:40.429	2025-12-23 07:16:40.849
cmjjohc590009l5049z8oytj1	cmjjohbkw0001l504rc7agsdj	cmjjo5e6e0004l804mk7lbgsf	f	2	2025-12-24 07:14:11.366	2025-12-24 07:14:11.366
cmjl55os20005jw04tva11ept	cmjl55oag0001jw04ubz2icjn	cmjl3ap6x000ajo04yoiz3w0b	t	0	2025-12-25 07:48:47.666	2025-12-25 07:48:48.122
cmjjrm6mq0005jj04tyonled8	cmjjrm68n0001jj042pr45n9h	cmjjqf7nb0009js046igzcd61	t	0	2025-12-24 08:41:56.498	2025-12-24 08:41:56.931
cmjjylfq7000dl404lwukmlra	cmjjylfci0009l404l02xkl3g	cmjjxoas90006jv04scvj7txm	t	0	2025-12-24 11:57:18.943	2025-12-24 11:57:19.467
cmj19hti5000pl504roqtiih1	cmj19ht4p000ll504c4sdzwfk	cmj15ny8y000blb04k9pbd23y	f	0	2025-12-11 09:54:48.606	2026-01-07 14:29:58.749
cmjmj4k0k000qjr043mru3i7a	cmjmj4jkx000mjr04jmtfcny9	cmjmj2egs0008jp04972f036w	t	0	2025-12-26 07:07:35.636	2025-12-26 07:07:36.078
cmjnx5oyk0005la041l87vwr9	cmjnx5oie0001la042cm9pcti	cmjnx1slx0001jz04br53aiqx	t	0	2025-12-27 06:28:09.5	2025-12-27 06:28:10.008
cmjo12pl20005jl04jsrqebed	cmjo12p160001jl04bf7gx0xq	cmjo0t5uf0000kz04vfp696u9	t	0	2025-12-27 08:17:48.806	2025-12-27 08:17:49.309
cmjo1p3id000ol7040s9wb90j	cmjo1p332000kl704i56n349y	cmjo1mbrc000gl804jyhm9ac3	t	0	2025-12-27 08:35:13.286	2025-12-27 08:35:13.704
cmjqtvej00005l704dc52ahee	cmjqtve5g0001l704mvsttaeq	cmjqt6ju10006jy04k3pn1n3i	t	0	2025-12-29 07:19:29.101	2025-12-29 07:19:29.54
cmjsa63f5000djv04sg0s28mn	cmjsa630i0009jv04lqspdt5h	cmjr23pvf000rkz04nfugfkvj	t	0	2025-12-30 07:43:27.953	2025-12-30 07:43:28.384
cmjsb3k2q000gl1045nyglrmz	cmjsb3jns000cl104cj790h0c	cmjsaetqx0008jo04d78cb90q	t	0	2025-12-30 08:09:29.186	2025-12-30 08:09:29.61
cmjtmpgm3000bjr04xxmdi1xv	cmjtmpg5z0007jr04a33uj4ud	cmjtm473z0002l2040kbxxxx6	t	0	2025-12-31 06:22:13.083	2025-12-31 06:59:39.773
cmjs8l87j0005l904nm64bylg	cmjs8l7ul0001l904o9uuo7ve	cmjr1wwmo0003kz04rqsdzfbk	t	0	2025-12-30 06:59:14.767	2025-12-30 08:17:23.745
cmjs90xxq000hkz04vum3ypok	cmjs90xgk0009kz04kzja35t9	cmjr2356j000nkz04nl9rtpp9	f	2	2025-12-30 07:11:27.816	2025-12-30 08:17:59.717
cmjs8obp1000hl9047pw54ltz	cmjs8ob89000bl904odrikbzk	cmjr22qho000lkz04331ptsl3	t	0	2025-12-30 07:01:39.245	2025-12-30 08:25:22.259
cmjs9xrhz000dl5044rassb51	cmjs9xr330009l504bve9usvm	cmjr21vvu000gkz04gj5bpc48	t	0	2025-12-30 07:36:59.255	2025-12-30 08:20:16.289
cmjv2ojbi0006lb042u7o15ne	cmjv2oiud0002lb04x7in0gzk	cmjv2khob0000lb04e68pfp96	t	0	2026-01-01 06:37:09.966	2026-01-01 06:37:10.781
cmjtnlu1l0005jl043lp3a587	cmjtnlto60001jl04rcv1k31v	cmjtm501c0006l204kiwwiitb	t	0	2025-12-31 06:47:23.481	2025-12-31 06:47:23.907
cmjtol8ri000vjj045vq2deji	cmjtol88i000rjj04b1n8dc0e	cmjtm884z000bl204rxgkqrzd	t	0	2025-12-31 07:14:55.518	2025-12-31 07:14:55.95
cmjtupamw0006l704jix52bfa	cmjtupa6w0002l704hn7sr0p9	cmjtujvo30000l704gux5sp3u	t	0	2025-12-31 10:06:02.265	2025-12-31 10:06:02.668
cmjv5uu9w0005la04ffn56g5g	cmjv5utr40001la04k1unspwk	cmjv5r8nr0000jo04vp3mnn6s	t	0	2026-01-01 08:06:02.948	2026-01-01 08:06:03.463
cmjxxl0s30006l50469fxsz13	cmjxxl0710002l504iv6p3bbr	cmjxxixv50000l504fg3vgf5d	t	0	2026-01-03 06:37:46.419	2026-01-03 06:37:46.851
cmjy3q8om0005ih04cvurk1gy	cmjy3q8bu0001ih04nhmtu5q1	cmjy3oio80000l804fp94s6up	t	0	2026-01-03 09:29:47.638	2026-01-03 09:29:48.153
cmk0skwid000djv04we9y8cfd	cmk0skw3q0009jv04b8dyfrwf	cmk0rt3ir0003kt04ltbh0wsu	t	0	2026-01-05 06:41:01.333	2026-01-05 07:13:49.398
cmk0t48ia0010li047au29o42	cmk0t483o000wli04iygzxn79	cmk0t0gou0008gv04uz3q6e7z	t	0	2026-01-05 06:56:03.346	2026-01-05 06:56:03.895
cmk0uiadn0006jp0422cbg0l0	cmk0ui9xz0002jp04sew62zg4	cmk0ug77a0000jp04cyfx1oma	t	0	2026-01-05 07:34:58.571	2026-01-05 07:34:58.95
cmk10s0o80006gy0467nxrtl2	cmk10s08h0002gy045q09lin1	cmk10o2jr0000gy04p3fjghjd	t	0	2026-01-05 10:30:30.248	2026-01-05 10:30:30.66
cmk222iwj0005l504j2gbcoa6	cmk222ihu0001l504mffryyu1	cmk220xm30008l804jwefkkkt	t	0	2026-01-06 03:54:26.228	2026-01-06 03:54:26.747
cmiwr6kgd0005l804ae4qtj6i	cmiwr6k100001l8047lqcob8f	cmiwqokos0003l104143lxdse	t	0	2025-12-08 06:11:05.87	2025-12-08 06:11:06.399
cmiwzf1a8000nk304m6tvc0k6	cmiwzf0sd000jk304699r6vx8	cmiwyswjv0004kz042dxsjzac	f	0	2025-12-08 10:01:37.857	2025-12-08 11:24:11.655
cmiwzf1aq000rk304mlcc7jdv	cmiwzf0sd000jk304699r6vx8	cmiwyt9ai0007kz04jl0chiwu	f	4	2025-12-08 10:01:37.858	2025-12-08 11:24:11.655
cmiwzseyq0012kz04gmd9sond	cmiwzsei5000ykz04dc9yp1ud	cmiwyubx5000hkz040n1k860g	t	0	2025-12-08 10:12:02.114	2025-12-08 10:51:30.762
cmj1a3gwo0011l504wcxxyvod	cmj1a3gap000vl504g82yuqhm	cmj15ozf2000flb04b2vyssbc	t	0	2025-12-11 10:11:38.416	2025-12-11 10:11:39.267
cmiybb08m0005l804zynvhs6h	cmiybazux0001l804998w52hb	cmiy9x9470005ld04popz74xp	f	1	2025-12-09 08:22:11.446	2025-12-09 08:22:11.446
cmj2szso50007le04mxhsf6v7	cmj2szrzm0003le04tve70vg7	cmj2slezd0002le04pqeu01i4	t	0	2025-12-12 11:48:26.214	2025-12-12 11:48:26.635
cmiycd4yw0005jy04itxfm1x3	cmiycd4jw0001jy04ekrzjdwt	cmiya348i000gld04cmbxufy4	t	0	2025-12-09 08:51:50.504	2025-12-09 12:35:59.209
cmj2v1l6l0005l10476g8xrp9	cmj2v1kr70001l104133vk53b	cmj2uupyq0000kv04e1c5vt30	t	0	2025-12-12 12:45:49.054	2025-12-12 12:45:49.436
cmiymb0qj0001jy04ds7mz48l	cmiyavsq40001js04rxyre88u	cmiy9w7470003ld0421s65ahz	f	1	2025-12-09 13:30:07.867	2025-12-09 13:31:02.883
cmizluonz0005jm04ooxv4p6x	cmizluoa80001jm04rbxxydn5	cmizl1h170008ic04dv5ljoq1	f	1	2025-12-10 06:05:11.904	2025-12-10 06:05:11.904
cmizudwab000jl804u6niqzgo	cmizudvwt000fl804zkgwhway	cmizrldqv0004jv04ehoxddim	t	0	2025-12-10 10:04:05.171	2025-12-10 10:04:05.601
cmizwn0vd0005jx04ekiwngm4	cmizwn0h20001jx04k66s77b1	cmizrnyi1000djv04pli3yoxu	t	0	2025-12-10 11:07:10.25	2025-12-10 11:07:10.776
cmizyd6550005l504ftogxqww	cmizyd5po0001l504bzac35fn	cmizxc7k2000bl804mdkleajq	t	0	2025-12-10 11:55:29.753	2025-12-10 11:55:30.281
cmj10x79a000jjs04tz4jrly7	cmj10x6rc000bjs04aeppqojw	cmj10j1pm0001l704squkft55	f	1	2025-12-11 05:54:49.613	2025-12-11 05:54:49.613
cmj19esbr000hl504tpj4skz4	cmj19ers5000bl50468tqi94o	cmj15ngco0007lb04anxazpix	t	0	2025-12-11 09:52:27	2025-12-11 09:52:27.641
cmj6vaacl000dle04eom929yo	cmj6va9wq0009le04clsahelh	cmj6u9vuy0006i80448dkmd5e	t	0	2025-12-15 08:03:39.621	2025-12-15 08:03:40.124
cmj85gbz10005jl04l6hi1msj	cmj85gbkc0001jl04um7cx0lc	cmj6yoxp30001lg04gq6avcwo	t	0	2025-12-16 05:36:03.997	2025-12-16 05:36:04.58
cmj89vd4c000fl204vytjk2gi	cmj89vcr4000bl204k1wwwk8s	cmj89frvt0009l204a5762ab1	t	0	2025-12-16 07:39:43.788	2025-12-16 07:39:44.228
cmjjxtybs0005jv04hmh3774b	cmjjxtxxj0001jv04blmym7ir	cmjjxmrd20000jv04w198j7nc	t	0	2025-12-24 11:35:56.68	2025-12-24 11:47:56.788
cmjjyori4000gjv047239z3ap	cmjjyor2e000cjv04ijacfhav	cmjjxoauw0007jv048yvv8lpl	t	0	2025-12-24 11:59:54.172	2025-12-24 11:59:54.579
cmj9tsflx000jl804vj2memr4	cmj9tsf5d000fl804eo9dw254	cmj9rnd010003l704bbctzj4t	t	0	2025-12-17 09:45:05.541	2025-12-17 09:56:03.253
cmjb2ml050005jo04rzh0augu	cmjb2mkka0001jo04vzmqwjsm	cmjb2h7uu0000lb0447grfrll	t	0	2025-12-18 06:40:15.318	2025-12-18 06:40:15.849
cmjb50kbk0005jm04eeq6a2nz	cmjb50jw50001jm04f6cnvdsw	cmjb4v92p0001kw04bf988lbh	t	0	2025-12-18 07:47:06.848	2025-12-18 07:47:07.324
cmjb68bhz000lie04jfsztj7n	cmjb68b3i000hie04y29949g0	cmjb5utw7000cjs0473yt9xm5	t	0	2025-12-18 08:21:08.28	2025-12-18 08:21:08.813
cmjch0mcy0005kz04wgrk3t07	cmjch0lxk0001kz04jtecq2ao	cmjcgqfu90002l704jfyf7aaq	t	0	2025-12-19 06:10:51.059	2025-12-19 06:10:51.483
cmjcjj9dm000rl204r0tluvrf	cmjcjj902000nl204rgjal6xl	cmjcjgv5q000gl20429t1c67m	t	0	2025-12-19 07:21:19.93	2026-01-02 12:26:24.268
cmjgut8or0005jl04853m2xbc	cmjgut89o0001jl04372iqmgm	cmjgun5so0001jo04bbuxh4n4	t	0	2025-12-22 07:48:06.075	2025-12-22 07:48:06.591
cmji8je74000fkz04vula0r5a	cmji8jdpw000bkz04pmmgnx1y	cmji86y080001kz04qey4t1go	t	0	2025-12-23 07:00:07.457	2025-12-23 07:00:07.968
cmji96z13000djx04nywkis96	cmji96ynw0009jx04xclaanlg	cmji883fr0008kz047mnhmlnp	t	0	2025-12-23 07:18:27.543	2025-12-23 07:18:27.986
cmjjomo2j0005kt0444fcbilc	cmjjomnny0001kt04ujxkszyo	cmjjo5e9d0005l8045b2l810s	t	0	2025-12-24 07:18:20.251	2025-12-24 07:18:20.785
cmjjqwrt90005ju043f11u6es	cmjjqwrfc0001ju04264ip0lh	cmjjqel770003js04ml25xwjn	t	0	2025-12-24 08:22:10.894	2026-01-07 06:49:31.216
cmjl3yxs7000dkz04kwtt5f7g	cmjl3yxf00009kz044vwup59a	cmjl39c140003jo04qu0oad6d	t	0	2025-12-25 07:15:33.128	2025-12-25 07:15:33.656
cmjl58wn70005jl044giidrnt	cmjl58w7s0001jl044y2irpcv	cmjl3axqj000bjo047ko7qtuc	t	0	2025-12-25 07:51:17.827	2025-12-25 07:51:18.353
cmjmjaixn0005jp045p0b77c8	cmjmjaih30001jp043s8hl0u6	cmjmj2els0009jp041riesdc4	t	0	2025-12-26 07:12:14.171	2025-12-26 07:12:14.591
cmjny8my0000jjj04tlnvgaed	cmjny8mkx000fjj04f3h73xdi	cmjny65fc0008jj04nkprtrbu	t	0	2025-12-27 06:58:26.472	2025-12-27 06:58:26.91
cmjo14st70005l404xmow0onb	cmjo14s840001l404qx6aoqy3	cmjo0t5y20001kz046psnk801	t	0	2025-12-27 08:19:26.3	2025-12-27 08:19:26.998
cmjs93id6000xl904ejo56z7j	cmjs93htq000tl904jr4lb1tf	cmjr1zjmq000bkz04kdyxivyy	t	0	2025-12-30 07:13:27.739	2025-12-30 07:13:28.253
cmjqtxuvd000lle04o6hqmvqy	cmjqtxucf000hle04f74pk7n3	cmjqt6jwv0007jy044t1w51qu	t	0	2025-12-29 07:21:23.594	2025-12-29 07:21:24.006
cmjqtbiti0005l504yazmi66w	cmjqtbi6j0001l504vqav98rh	cmjqt5o150000jy04861d12mu	t	0	2025-12-29 07:04:01.542	2025-12-29 07:24:35.003
cmhrttcxf0005ld04hw5gl3iv	cmhrttccq0001ld049y0fc2w1	cmhrssxze0000i904zn7hvv3y	t	0	2025-11-09 14:46:15.219	2026-01-08 13:06:57.158
cmjtnob0f000ljj04xu5bjdjb	cmjtnoakf000hjj049jqsvnrn	cmjtm503x0007l204dq6vvasm	t	0	2025-12-31 06:49:18.783	2025-12-31 06:49:19.204
cmjsa98nk0005ky04kqtm2tn9	cmjsa98840001ky04b5mxos3f	cmjr234ws000mkz04u1jdfaiy	t	0	2025-12-30 07:45:54.704	2025-12-30 08:18:39.566
cmjs9xrkv000fl5049gm8z7j6	cmjs9xr330009l504bve9usvm	cmjr22ebu000ikz049jeqol9h	f	2	2025-12-30 07:36:59.256	2025-12-30 08:20:15.603
cmjsb6bkl000ol104ur7lrklv	cmjsb6b7p000kl104vs4u0xnb	cmjsaf40u0000l104czqy7g6n	t	0	2025-12-30 08:11:38.133	2025-12-30 08:15:06.628
cmjs8l87s0007l904xof795vo	cmjs8l7ul0001l904o9uuo7ve	cmjr1xjm50007kz04hbht3nfs	f	1	2025-12-30 06:59:14.767	2025-12-30 08:17:23.155
cmjtoxp29000vjl04gcmpsaa4	cmjtoxolk000rjl04mgo14jw4	cmjtm888f000cl204ouquv7mo	t	0	2025-12-31 07:24:36.514	2025-12-31 07:24:37.001
cmjs8obos000fl9045a7n326k	cmjs8ob89000bl904odrikbzk	cmjr1x8d10004kz04vf16832e	f	0	2025-12-30 07:01:39.245	2025-12-30 08:25:21.661
cmjtmyw6q000djj04i1iguc29	cmjtmyvqd0009jj04btdt80fr	cmjtm3p6q0001l204ta10rzk1	t	0	2025-12-31 06:29:33.171	2025-12-31 07:31:19.579
cmjtvbzz70005l404zlzr0tab	cmjtvbzi50001l404rqvjotyw	cmjtv2r3j0000l804kmr8q93r	t	0	2025-12-31 10:23:41.539	2025-12-31 10:23:42.027
cmjv2w45j0005jj04ggxxeu9i	cmjv2w2gj0001jj04ny6ydpqi	cmjv2u2dd0009lb041gau6o3k	t	0	2026-01-01 06:43:03.56	2026-01-01 06:43:06.313
cmjwcodxy0006l704mu941k82	cmjwcodcl0002l704ij1om695	cmjwch6oq0000l704hdjt3pld	t	0	2026-01-02 04:04:45.335	2026-01-02 04:04:45.803
cmjxxsa51000el50438q6axux	cmjxxs9ql000al504xeayzy27	cmjxxpqms0000ju04385gjhc4	t	0	2026-01-03 06:43:25.142	2026-01-03 06:43:25.575
cmk0rkbl30005jm04dzk77hkr	cmk0rkb5h0001jm047p2ctppl	cmk0rio9u0002li04d3zw80pd	t	0	2026-01-05 06:12:34.6	2026-01-05 06:12:35.014
cmk0sorc30005gv04rngadc56	cmk0soqyt0001gv04t4x3eqmk	cmk0smawy0000ic04f5hvnl9j	t	0	2026-01-05 06:44:01.251	2026-01-05 06:44:01.758
cmk0t8k7p000fgv04322p2asq	cmk0t8juc000bgv04e3zsik0u	cmk0t4bbk0013li04aktrs55r	t	0	2026-01-05 06:59:25.141	2026-01-05 07:09:57.637
cmk0ynpmt0005k4040o1431k0	cmk0ynp8t0001k404pq6uzjhy	cmk0yi0rt0000l504hk6tswl5	t	0	2026-01-05 09:31:10.086	2026-01-05 09:31:10.606
cmk10urzi000dk404rfe2me7y	cmk10urke0009k404z49zkpto	cmk10tcsh0008i604q8srr5wc	t	0	2026-01-05 10:32:38.959	2026-01-05 10:32:39.36
cmhrttczw0007ld04vg7r35zj	cmhrttccq0001ld049y0fc2w1	cmhrssy2r0001i904q7mv82ui	f	1	2025-11-09 14:46:15.22	2026-01-08 13:06:56.154
cmiwr8oip000dl704f8zc9y7a	cmiwr8o4y0009l704h5d4ktoj	cmiwqokrr0004l104lipk6ody	t	0	2025-12-08 06:12:44.449	2025-12-08 06:12:44.871
cmiwzf1da000tk304kg7scewd	cmiwzf0sd000jk304699r6vx8	cmiwyt9gc0009kz041iub0u4y	f	5	2025-12-08 10:01:37.858	2025-12-08 11:24:11.655
cmiybb0bj0007l804uf5w3ipj	cmiybazux0001l804998w52hb	cmiy9wfqo0004ld04uxp6wfer	t	0	2025-12-09 08:22:11.447	2025-12-09 08:22:12
cmiwzzr3c001vk304zvd9jql1	cmiwzzqpt001rk304jay476nb	cmiwyubzg000ikz0483w1uqg7	t	0	2025-12-08 10:17:44.425	2025-12-08 10:43:22.1
cmj1a3gyu0013l504t4fvf1c0	cmj1a3gap000vl504g82yuqhm	cmj15xq5x000hlb04upkdfmhf	f	2	2025-12-11 10:11:38.416	2025-12-11 10:11:38.416
cmiymb0tn0003jy04nb0wt2lh	cmiyavsq40001js04rxyre88u	cmiy9v1y60000ld04zoarfw2w	t	0	2025-12-09 13:30:07.867	2025-12-09 13:31:03.66
cmj19mhnq000fjr04gi7ftv7y	cmj19mh87000bjr04h6jcglw5	cmj15omb5000clb0450ek4520	t	0	2025-12-11 09:58:26.534	2025-12-11 10:47:26.425
cmiyg1bhk0005lb041kb5xiwd	cmiyg1b1i0001lb04kep83ftw	cmiya3fc4000hld04w7k7a23n	t	0	2025-12-09 10:34:37.544	2025-12-09 13:32:15.629
cmizluos60007jm04ni16i57s	cmizluoa80001jm04rbxxydn5	cmizl1h3x0009ic04vv2bsglz	f	2	2025-12-10 06:05:11.904	2025-12-10 06:05:11.904
cmizuhv85000ljx044mefbllg	cmizuhuum000hjx04fh6ii3zl	cmizrm0ys0005jv04zaqcecmw	t	0	2025-12-10 10:07:10.421	2025-12-10 10:07:10.822
cmizwquu0000djp04wexq5ykw	cmizwque40009jp04cskdtic3	cmizrofaq000ejv04036pbrbk	t	0	2025-12-10 11:10:09.048	2025-12-10 11:10:09.583
cmizyg1ba0005jo04m0it7x2i	cmizyg0ta0001jo04c2s6uqgt	cmizxcsx8000cl80482reyn0p	t	0	2025-12-10 11:57:43.462	2025-12-10 11:57:43.931
cmj191qla0005l504bl7rfv27	cmj191q4j0001l504vqd4658n	cmj15mfyw0000lb04uw5kifgn	t	0	2025-12-11 09:42:18.334	2025-12-11 09:42:18.972
cmjl4740w0005ks04vfupiwml	cmjl473mp0001ks043muuh9ce	cmjl39lgj0005jo04lzbpj4g6	t	0	2025-12-25 07:21:54.465	2025-12-25 07:27:13.05
cmj2t1n7s000ale043yx7shii	cmj2t1mtx0006le04i9urumjn	cmj2slf3n0004le04loh58u1l	t	0	2025-12-12 11:49:52.456	2025-12-12 11:49:52.851
cmj2v7njb001ole0465k3i3nx	cmj2v7mw9001kle04r4x2fic4	cmj2uv6yw0001kv04pvjdrhsb	t	0	2025-12-12 12:50:32.039	2025-12-12 12:50:32.474
cmj6vk9bm000tky04pzamtfkn	cmj6vk8xw000pky041vsf1x2k	cmj6uboz4000ci804nkmzdhtf	t	0	2025-12-15 08:11:24.85	2026-01-07 14:34:57.425
cmj85jypj0005jm04w5swb6cv	cmj85jyca0001jm04xw0av2n4	cmj6yp9h90002lg04wlymuhpn	t	0	2025-12-16 05:38:53.431	2025-12-16 05:38:53.86
cmj8a8yrm000nl204st3bp3tt	cmj8a8ybp000jl2049wvdyv2e	cmj8a4py40000js04hr5fx5jl	t	0	2025-12-16 07:50:18.37	2025-12-16 07:50:18.801
cmjl5coi70005l4044lqf58gx	cmjl5co0r0001l404ngo11rg8	cmjl3axyv000cjo04cteasfr6	t	0	2025-12-25 07:54:13.904	2025-12-25 07:54:14.386
cmj9tvk420005js04g6q3687j	cmj9tvjp60001js04fc0exm4p	cmj9rnuyh0004l704u1ztqwh8	t	0	2025-12-17 09:47:31.347	2025-12-17 09:54:30.471
cmjb2pkj70005jp048k2wkpki	cmjb2pk4q0001jp04vdtipdxe	cmjb2h7yk0001lb044ii53hji	t	0	2025-12-18 06:42:34.675	2025-12-18 06:42:35.084
cmjb532480005js0420k340ak	cmjb531om0001js04yhfbfi2h	cmjb4v94w0002kw04grbmvz1n	t	0	2025-12-18 07:49:03.224	2025-12-18 07:49:03.65
cmjnwaxxb0005l7044qmz5tc0	cmjnwaxay0001l704hsxh6ii2	cmjnw50gj0000jp04k1mdemto	t	0	2025-12-27 06:04:14.784	2025-12-27 06:04:15.243
cmjb6zq520005l104g3dt5mjk	cmjb6zpph0001l104k8y1d14a	cmjb6xwd10000la04qyr8ppwi	t	0	2025-12-18 08:42:26.966	2025-12-18 08:44:22.506
cmjch2ko8000dky045maadski	cmjch2k8o0009ky04p8svcyhg	cmjcgqfwt0003l704jyrjnjj4	t	0	2025-12-19 06:12:22.184	2025-12-19 06:12:22.643
cmjcjlosx0005l2040o3sjbr5	cmjcjlocx0001l2045wujllk2	cmjcjgv9v000hl204un8q9njt	t	0	2025-12-19 07:23:13.233	2025-12-19 07:23:13.759
cmjguwang000kjo04wkigyb7t	cmjguwa7u000gjo04d4sks137	cmjgungu70002jo04fk8go714	t	0	2025-12-22 07:50:28.588	2025-12-22 07:50:29.014
cmji8q4ll0005jv04b7bfby3n	cmji8q43s0001jv048iw3reac	cmji86y2f0002kz04nmram2md	t	0	2025-12-23 07:05:21.61	2025-12-23 07:05:22.027
cmji9a8d0000dkz04pc5jkmnk	cmji9a8090009kz04e15uul13	cmji8agdi0009kz04v7wvbuak	t	0	2025-12-23 07:20:59.604	2025-12-23 07:21:00.036
cmjjomo2s0007kt04owa6ymp6	cmjjomnny0001kt04ujxkszyo	cmjjo64xi0008l804xmhy22gd	f	1	2025-12-24 07:18:20.251	2025-12-24 07:18:20.251
cmjjr18ll000djy04twc78gi5	cmjjr18750009jy04sn7kd4vz	cmjjqelak0004js04t7az3eqj	t	0	2025-12-24 08:25:39.273	2025-12-24 08:25:39.696
cmjjy34wx0005i2040o58gt6o	cmjjy34gs0001i204jpoc69uf	cmjjxmrod0003jv042m32ausc	t	0	2025-12-24 11:43:05.121	2025-12-24 11:43:05.646
cmjjyzco20005kz04frt80g03	cmjjyzc7f0001kz04iotkptss	cmjjxooe70008jv04ioyjcwv4	t	0	2025-12-24 12:08:08.162	2025-12-24 12:08:08.577
cmjnyahka0005l804r9m4symv	cmjnyah6f0001l804h7gczuzj	cmjny65k80009jj04wur9qqp6	t	0	2025-12-27 06:59:52.81	2025-12-27 06:59:53.251
cmjo16lqf0005l804rdz1t4z0	cmjo16lci0001l804ey5o6504	cmjo0tyq80002kz04fs5c0ipz	t	0	2025-12-27 08:20:50.439	2025-12-27 08:20:50.876
cmjtnste3000djj04tfcnehgg	cmjtnssyi0009jj04xdq4mhqt	cmjtm6dy80008l204sy13ecjc	t	0	2025-12-31 06:52:49.228	2025-12-31 06:52:49.632
cmjqu0i2x000fl404ahmyjxsb	cmjqu0how000bl4044wnewdsd	cmjqt6jzd0008jy042e3mojmj	t	0	2025-12-29 07:23:26.986	2025-12-29 07:23:27.472
cmjtn24ax0005l904nvz0ghdf	cmjtn23w70001l904vlphaw2a	cmjtm476w0003l2043s825vew	t	0	2025-12-31 06:32:03.657	2025-12-31 07:03:16.951
cmjqthmq4000ejy04rnk5v26k	cmjqthmbe000ajy04s4wtd484	cmjqt5o4j0001jy04ts1q0m1a	t	0	2025-12-29 07:08:46.541	2025-12-29 07:27:36.873
cmjs8r3p40005jv04gdb2yj1v	cmjs8r3ae0001jv0440by6i7a	cmjr1x8g40005kz04xfuq29by	t	0	2025-12-30 07:03:48.856	2025-12-30 07:03:49.296
cmjsb7uhd0007lg04g9j87jni	cmjsb7u190003lg04ks3wxxe8	cmjsafl8l0002l104v2bjli3b	t	0	2025-12-30 08:12:49.297	2025-12-30 08:15:39.621
cmjsa98nx0007ky04kk90gsv7	cmjsa98840001ky04b5mxos3f	cmjr2404w000tkz04bqih2mg9	f	1	2025-12-30 07:45:54.704	2025-12-30 08:18:39.074
cmjtoy4wm0005jp04ywsvaspd	cmjtoy4fz0001jp04p40mhqcq	cmjtowos3000yjj04vp64vyhz	t	0	2025-12-31 07:24:57.046	2025-12-31 07:24:57.544
cmjs9xrlu000hl5044cady0fc	cmjs9xr330009l504bve9usvm	cmjr22ef7000jkz04o8sg3rcm	f	3	2025-12-30 07:36:59.256	2025-12-30 08:20:15.603
cmjs9deh7000dl7047pz06by0	cmjs9ddzv0009l7040uzoq6md	cmjr218cz000ekz04mh4txpz8	t	0	2025-12-30 07:21:09.26	2025-12-30 08:22:22.448
cmk0s68100005jv04zhbbjtkz	cmk0s67ef0001jv04cxi5t1c9	cmk0rt3ba0000kt04fmeax446	t	0	2026-01-05 06:29:36.42	2026-01-05 07:21:02.671
cmjtvve8t0007l804a34v1ykv	cmjtvvdux0003l8042si4fiqt	cmjtvmev90001l804c4fdzblo	t	0	2025-12-31 10:38:46.493	2025-12-31 10:38:46.974
cmjv32bww000flb04lcxzk57u	cmjv32bho000blb04ep7whhc1	cmjv2zhg60000lc04pyqzfnun	t	0	2026-01-01 06:47:53.553	2026-01-01 06:47:54.033
cmjxxwfvg0006lb04hsw9i1go	cmjxxwfi10002lb04s4gej9k8	cmjxxuuhl0000lb04a8uducct	t	0	2026-01-03 06:46:39.196	2026-01-03 06:46:39.589
cmk0qb1va0006l404uas1f2g3	cmk0qb16v0002l4048b7duuhk	cmk0q8pdu0000l4044regwo7v	t	0	2026-01-05 05:37:22.486	2026-01-05 05:37:23.029
cmk0su7c1000gli04pdl5k4v6	cmk0su6yd0003ic04xlpbvupv	cmk0ss0vr0001ic04zki6ll2v	t	0	2026-01-05 06:48:15.265	2026-01-05 06:48:15.66
cmk0sxrny000sli0442tktkuj	cmk0sxr6w000oli046a9i4vh5	cmk0rt3ny0005kt04rwgrk0sg	t	0	2026-01-05 06:51:01.582	2026-01-05 07:06:51.135
cmk0tehk60006l204e1n9byoi	cmk0teh370002l204psvupo2l	cmk0t4u9k0009gv04iojswd1z	t	0	2026-01-05 07:04:01.638	2026-01-05 07:04:02.138
cmk0yppai0007l504s1gqg3e5	cmk0ypotg0003l50482lhx28l	cmk0yi0vf0001l504vftxn8vw	t	0	2026-01-05 09:32:42.954	2026-01-05 09:32:43.5
cmk11cyej000egy04iidi12fo	cmk11cy25000agy04w4fk2tyq	cmk11a5fl0000jr04tnesoajp	t	0	2026-01-05 10:46:47.084	2026-01-05 10:46:47.491
cmk227n320007l404eygua744	cmk227mny0003l404k6jzi6g6	cmk226bmz0001l40476ez6l4l	t	0	2026-01-06 03:58:24.927	2026-01-06 03:58:25.347
cmk22cp1w000kl804j31yuer7	cmk22colt000gl804uabtnp59	cmk22bcsi000hl504c4409nxu	t	0	2026-01-06 04:02:20.756	2026-01-06 04:02:21.366
cmk22gp2x000sl804z7sx3hhw	cmk22golj000ol804s3it8wkg	cmk22fefg000al404pppzex31	t	0	2026-01-06 04:05:27.417	2026-01-06 04:05:27.816
cmhw45tqy0005ky04g9zrc334	cmhw45tcc0001ky04da5cfdhr	cmhw3dp190003ju04kwvkorpz	t	0	2025-11-12 14:46:57.754	2025-11-12 14:46:58.167
cmhw4dxa6000dky04hzvqqvm3	cmhw4dww30009ky04aqtl5fvv	cmhw3cbm00002ju04p379pgq9	t	0	2025-11-12 14:53:15.582	2025-11-12 14:53:16.377
cmhw4k7690005l804komcm8li	cmhw4k6t60001l804sulob08s	cmhw3dp4l0004ju043l49nmau	t	0	2025-11-12 14:58:08.338	2025-11-12 14:58:08.773
cmhw4wdr20005js04vymljoj0	cmhw4wdaa0001js04f8p4tdkv	cmhw4qxpn0008l804mqp88465	f	2	2025-11-12 15:07:36.735	2025-11-12 15:07:36.735
cmhw4wduy0007js04tby95sma	cmhw4wdaa0001js04f8p4tdkv	cmhw4qc31000hky048fxegcmm	f	1	2025-11-12 15:07:36.735	2025-11-12 15:07:36.735
cmhw4wdwn0009js04zqux8ijx	cmhw4wdaa0001js04f8p4tdkv	cmhw4pcms000gky04444baxih	t	0	2025-11-12 15:07:36.736	2025-11-12 15:07:37.482
cmi1u40uw0005ic04tpoaguis	cmi1u408k0001ic047aflz7jh	cmi1ts7tt0005k004e48sb3h2	t	0	2025-11-16 14:52:14.552	2025-11-16 14:52:14.947
cmiwrdss00005jv04g99imiwd	cmiwrdseo0001jv04g2wk6x0h	cmiwqoku80005l104fwrcavxl	t	0	2025-12-08 06:16:43.249	2025-12-08 06:16:43.702
cmi1ufxen0006lb04c0ekcdz6	cmi1ufx2g0002lb04x48gewsg	cmi1tyu3m000dk004mv2d6b5b	t	0	2025-11-16 15:01:29.951	2025-11-16 15:01:30.348
cmi1uokqv000rk004zuoq5q4k	cmi1uokeh000nk004nxb2d6n7	cmi1tybz2000ck0044efvpqu5	t	0	2025-11-16 15:08:13.448	2025-11-16 15:08:13.904
cmi1ur58p0005ju04r1v5ltxn	cmi1ur4uy0001ju04q2ovbxwi	cmi1tudb00008k004vg7i8qmm	t	0	2025-11-16 15:10:13.321	2025-11-16 15:10:13.723
cmi1uygiq000dju0454une1il	cmi1uyg2s0009ju04r74ojtng	cmi1tv9wp0009k0040lvf65d0	t	0	2025-11-16 15:15:54.53	2026-01-02 12:15:19.037
cmi1va4b20005kt043k241l9w	cmi1va3vp0001kt040b4c9hhv	cmi1txldm000bk00427yv3akq	t	0	2025-11-16 15:24:58.574	2025-11-16 15:24:58.988
cmi1vd9xl000dkt04ezyagtzw	cmi1vd9lo0009kt04fst16ysj	cmi1tw73m000ak004mrltb80d	t	0	2025-11-16 15:27:25.833	2025-11-16 15:27:26.284
cmi1vijsd000lkt04d5ht1sdr	cmi1vidr2000hkt047gujnpms	cmi1tpm5o0000k004snfkdsc4	f	0	2025-11-16 15:31:31.885	2025-11-16 15:31:31.885
cmi1vijve000pkt04ruyrr2lx	cmi1vidr2000hkt047gujnpms	cmi1tqblq0002k004i17dlm0y	f	2	2025-11-16 15:31:31.886	2025-11-16 15:31:31.886
cmi1vijv8000nkt04ib0knvbm	cmi1vidr2000hkt047gujnpms	cmi1tq0m30001k0041y29z6nf	t	0	2025-11-16 15:31:31.885	2025-11-16 15:31:32.403
cmi1vpqwu000zk004mvadhh2s	cmi1vpqki000vk0045nskax3p	cmi1tnko10000lb04a5g1xft7	t	0	2025-11-16 15:37:07.711	2026-01-07 14:29:20.614
cmi47xm1q0005la04ozbgxzdl	cmi47xle90001la04z1mwqsi0	cmi470rbs0000jp04q38ro8h8	t	0	2025-11-18 06:54:42.399	2025-11-18 06:54:42.813
cmi487qej0005l8049euk5npk	cmi487pzv0001l804wayq6n7r	cmi472teg0001jp04lcl1a36d	t	0	2025-11-18 07:02:34.604	2026-01-03 13:20:14.269
cmi48e4tt0007l804nmv06yoo	cmi48e4c10001l8048gwzbiub	cmi4769fa0000jm04793g9cew	f	1	2025-11-18 07:07:33.122	2025-11-28 08:50:21.901
cmi72fjno0005jx04tl4uhh6t	cmi72fj250001jx04towkqnah	cmi71lboy0000jr04kcigbr03	t	0	2025-11-20 06:43:59.94	2025-11-20 06:44:00.402
cmi72rzor0005jp04vbsn33a3	cmi72rzan0001jp040aayssub	cmi71m5zg0001jr042xphjwp0	t	0	2025-11-20 06:53:40.588	2025-11-20 06:53:40.974
cmi733477000djp04ay48urc0	cmi7333sv0009jp04bxladepn	cmi71m62l0002jr043rcjmgpp	t	0	2025-11-20 07:02:19.651	2025-11-20 07:02:20.051
cmi739lgh000djx04gk6pvl3z	cmi739l1a0009jx0429tvqdd1	cmi71s7x50003jr04dkj2vat0	t	0	2025-11-20 07:07:21.953	2025-11-20 07:07:22.345
cmi73djor0005la047f3r8k5u	cmi73dj980001la04lzwfpygx	cmi71t0fb0004jr04q9e54sde	t	0	2025-11-20 07:10:26.284	2025-11-20 07:10:26.738
cmi73gwb2000ljx04620ekfdy	cmi73gvzf000hjx04yuq8oroi	cmi71tk730005jr04rmmbp18d	t	0	2025-11-20 07:13:02.606	2025-11-20 07:13:03.006
cmi73kzom000ljp04u4h8swix	cmi73kz9l000hjp04kequg87i	cmi71wox90006jr04ezc78vl8	t	0	2025-11-20 07:16:13.607	2025-11-20 07:16:14.002
cmizx169u000ljp04avyjw0gh	cmizx15si000hjp04e3vnraq4	cmizrp91r000hjv04bmhybgau	t	0	2025-12-10 11:18:10.434	2025-12-10 11:18:10.848
cmiwzl0um0015k304ltvb2ptu	cmiwzl0gb0011k304j9jn4ooe	cmiwytos3000dkz04bcpio85t	t	0	2025-12-08 10:06:17.23	2025-12-08 11:07:57.491
cmizyj8bq000ll8048247bgkn	cmizyj7xm000hl804cbre8kus	cmizxct00000dl804fji1efq9	t	0	2025-12-10 12:00:12.519	2025-12-10 12:00:13.227
cmiwzf1dm000vk3044sljbci7	cmiwzf0sd000jk304699r6vx8	cmiwyswng0005kz04e06eeoyc	f	1	2025-12-08 10:01:37.857	2025-12-08 11:24:11.655
cmix02r0u001akz04ohohw7se	cmix02qmx0016kz04lva4zr9i	cmiwyutib000jkz04ohmbsctu	t	0	2025-12-08 10:20:04.302	2025-12-08 10:58:31.064
cmiybf3mb000tjs0406rjmhcu	cmiybf361000pjs048dxcvupl	cmiy9y4r80008ld04f2eb1xgh	f	1	2025-12-09 08:25:22.451	2025-12-09 08:25:22.451
cmiyie1950005jv043gwayhvb	cmiyie0sz0001jv04v16u0haa	cmiya3fhq000ild04j81x77ep	t	0	2025-12-09 11:40:30.042	2025-12-09 11:40:30.461
cmiaap2v20005lb048sqnump6	cmiaap2g80001lb04h5kxpsvl	cmia5qkp40001l704hjxgvo7u	t	0	2025-11-22 12:58:40.19	2025-12-31 07:38:50.704
cmizl9egu0005js04r71uka08	cmizl9dv80001js04clbbr0jx	cmizkyyet0000ic04wzaagbgp	f	1	2025-12-10 05:48:38.911	2025-12-10 05:48:38.911
cmizluosz000bjm04sznl057p	cmizluoa80001jm04rbxxydn5	cmizl0zc00007ic040sc9nwlh	t	0	2025-12-10 06:05:11.904	2025-12-10 06:05:12.529
cmiaax7ck000dlb04giksogz9	cmiaax6yd0009lb04sfuptdqf	cmia5qkr00002l7041fz3xej6	t	0	2025-11-22 13:04:59.252	2026-01-02 12:42:56.545
cmizulpez000tjx04qyvnjwak	cmizuloym000pjx04ky7ewg7t	cmizrm11u0006jv045or0gqko	t	0	2025-12-10 10:10:09.515	2025-12-10 10:10:10.055
cmj191qon0007l504apsqahs7	cmj191q4j0001l504vqd4658n	cmj15mg400001lb04vkl2v904	f	1	2025-12-11 09:42:18.334	2025-12-11 09:42:18.334
cmj1a6i45000njv04as5x7q7e	cmj1a6hnz000jjv04upgyxsfc	cmj19tw5f000tl504wd3x20ry	t	0	2025-12-11 10:14:00.245	2026-01-07 14:31:39.745
cmj2tbapm000pjr049jqa5stf	cmj2tba95000ljr04ahgx6yuq	cmj2t5itr000ale04m48y1xvv	t	0	2025-12-12 11:57:22.81	2026-01-10 08:33:09.251
cmj2vakg3001wle0419vfbfpo	cmj2vajzy001sle04w250t26w	cmj2uv7220002kv04gybz2r81	t	0	2025-12-12 12:52:48.003	2026-01-07 07:59:40.377
cmiab98nl000djo04jr1bpgj8	cmiab98810009jo04nogdp3s3	cmia5qkvv0004l704g4lwzz5g	t	0	2025-11-22 13:14:20.817	2025-12-31 07:36:06.347
cmj6vt1ms000yi804fqna4trg	cmj6vt1ae000ui804tlf8ndq1	cmj6u9vyb0007i804nmc3zoso	t	0	2025-12-15 08:18:14.788	2025-12-16 05:44:20.391
cmiabdmxb0005la04rp4x94cq	cmiabdmj00001la04mnuo7g8p	cmia5qkye0005l704mxaeq7vq	t	0	2025-11-22 13:17:45.935	2025-12-31 07:35:36.773
cmj85nd9q000djm04myphegj6	cmj85ncv40009jm04kq8ayci2	cmj6ypjap0003lg04l7a7i5uk	t	0	2025-12-16 05:41:32.27	2025-12-16 05:41:32.684
cmiabhag0000llb04cd42j5pv	cmiabha3b000hlb04uca1j0qb	cmia5ql0v0006l704bj1notli	t	0	2025-11-22 13:20:36.384	2025-12-31 07:34:04.386
cmiabk38l000dla04k41fq53b	cmiabk2qt0009la04v2kxzay3	cmia5ql370007l704lml50v0k	t	0	2025-11-22 13:22:47.013	2025-12-31 07:31:54.534
cmiabp5q3000tlb046xa6524a	cmiabp5do000plb04qiw2ivv5	cmia5ql590008l7046lc4s5dx	t	0	2025-11-22 13:26:43.515	2025-12-31 07:35:04.272
cmiabs5u7000lla04ik4j7mo4	cmiabs5gv000hla04k03752ia	cmia5ql7q0009l704y8b9r3ys	t	0	2025-11-22 13:29:03.631	2026-01-05 07:15:33.034
cmiabx5o4000ljo04empb5a3j	cmiabx58h000hjo04c81zhxbi	cmia5qlad000al7041tpkrw17	t	0	2025-11-22 13:32:56.692	2026-01-05 07:16:20.544
cmj8anyr40005l104efqewsag	cmj8anyas0001l104bt3fs0ok	cmj8al48n000ql204y5vsgpnq	t	0	2025-12-16 08:01:58.193	2025-12-16 08:01:58.705
cmj9tznuo000djs04oucj0bie	cmj9tznhe0009js04abfwwuh1	cmj9rnv2l0005l704kmq8z2fc	t	0	2025-12-17 09:50:42.816	2025-12-17 09:50:43.277
cmjb2roxm0008lb04trqcpfyj	cmjb2roiq0004lb04figjb7r6	cmjb2h8110002lb04t2we85yt	t	0	2025-12-18 06:44:13.691	2025-12-18 06:44:14.331
cmjb557mi000ikw04b7ciumo1	cmjb5577u000ekw04kt9440e5	cmjb4v97f0003kw04gjxxwwyd	t	0	2025-12-18 07:50:43.674	2025-12-18 07:50:44.107
cmjb71i2s0005l504wu0cruei	cmjb71ho70001l504nvv08pp6	cmjb6xwfx0001la04zv8m00j0	t	0	2025-12-18 08:43:49.829	2025-12-18 08:43:50.331
cmi48e4qq0005l804h7h9nvqd	cmi48e4c10001l8048gwzbiub	cmi473xvh0002jp04y3o4dyec	t	0	2025-11-18 07:07:33.122	2025-11-28 08:50:40.161
cmicunxrp000ljr04tu592l0a	cmicunxfi000hjr048knaapyb	cmictb4ii0005l404pe5g8h08	t	0	2025-11-24 07:53:11.606	2025-11-24 07:53:11.987
cmicupk7g000tjr04psc7at5t	cmicupjqs000pjr042szvpmts	cmictb4lz0006l404dfxcruew	t	0	2025-11-24 07:54:27.34	2025-11-24 07:54:27.766
cmj1b80m90005l5046fomuock	cmj1b808d0001l504fmwrvone	cmj1b0l7w000ald04udvlxehl	t	0	2025-12-11 10:43:10.497	2025-12-11 10:43:11.023
cmiwzl0uw0017k304zyl4hl3v	cmiwzl0gb0011k304j9jn4ooe	cmiwytop5000ckz044o4ikpx1	f	0	2025-12-08 10:06:17.231	2025-12-08 11:07:56.391
cmiwzf1g7000xk304xmh67dlr	cmiwzf0sd000jk304699r6vx8	cmiwyt9dz0008kz04nq0pm6dp	f	2	2025-12-08 10:01:37.858	2025-12-08 11:24:11.655
cmiybf3mj000vjs04g7kyuwfb	cmiybf361000pjs048dxcvupl	cmiya0x7g000ald04ty80soqp	f	2	2025-12-09 08:25:22.452	2025-12-09 08:25:22.452
cmjb57rnh000djm04bgc4x4sc	cmjb57ra00009jm04tryz3oju	cmjb4v99z0004kw049m4u1ebl	t	0	2025-12-18 07:52:42.941	2025-12-18 07:52:43.476
cmid389b10005ld04cdyirwp7	cmid388v40001ld04378ak7mz	cmid2dbyq000hjr04s9s0rauc	t	0	2025-11-24 11:52:56.605	2026-01-02 12:29:26.084
cmid3b9d50005ky04bnu40zye	cmid3b8y10001ky041oqfpu1g	cmid2bbvq000gjr04kp1uqwqi	t	0	2025-11-24 11:55:16.649	2025-11-24 11:55:17.072
cmid3et4h0005ju04yv2pl7f3	cmid3esrx0001ju04wlhv1k8c	cmid2e72k000ijr04ofno5ukv	t	0	2025-11-24 11:58:02.225	2025-11-24 11:58:02.619
cmid3qbbj000dld04egfoaxz3	cmid3qazo0009ld04qjijkzd2	cmid2faqc0000jy04uwnd5dli	t	0	2025-11-24 12:06:59.024	2025-11-24 12:06:59.412
cmid4mf5v0005ju04df2a2u9b	cmid4meqz0001ju04ysxx0a96	cmid2pzha0003jy04ohv5jdvs	f	2	2025-11-24 12:31:56.995	2025-11-24 12:31:56.995
cmid4mfar0007ju04xvgxhnkm	cmid4meqz0001ju04ysxx0a96	cmid2kh0a0002jy042p58tdcl	f	1	2025-11-24 12:31:56.996	2025-11-24 12:31:56.996
cmid4mfc8000dju04l8pw4yp5	cmid4meqz0001ju04ysxx0a96	cmid2sm400005jy04h2zjp7um	f	4	2025-11-24 12:31:56.996	2025-11-24 12:31:56.996
cmid4mfc0000bju04ecxwpsyj	cmid4meqz0001ju04ysxx0a96	cmid2qln90004jy047uod0hep	f	3	2025-11-24 12:31:56.996	2025-11-24 12:31:56.996
cmid4mfar0009ju04pxz4q2sn	cmid4meqz0001ju04ysxx0a96	cmid2js7z0001jy04tin85e24	t	0	2025-11-24 12:31:56.996	2025-11-24 12:31:57.71
cmiyiiw1b000djv04qur1moyb	cmiyiivm20009jv04fkbv8tfl	cmiya3sya000jld04fh2qutqf	t	0	2025-12-09 11:44:16.559	2025-12-09 11:44:17.296
cmizl9ejj0007js04ux1sg7h9	cmizl9dv80001js04clbbr0jx	cmiymt7y30008jp04ozvfhax8	t	0	2025-12-10 05:48:38.911	2025-12-10 05:48:39.444
cmie5ux27000al504mq5d8glx	cmie5uwe30006l50492em2fvv	cmie5m1r50002l504ghh1ulxp	f	0	2025-11-25 05:54:19.232	2025-11-25 05:54:19.232
cmie5ux5q000cl504edd0m7ju	cmie5uwe30006l50492em2fvv	cmie5mcmh0003l504ca3bwc75	t	0	2025-11-25 05:54:19.232	2025-11-25 05:54:19.791
cmizluosw0009jm04yxhgiz30	cmizluoa80001jm04rbxxydn5	cmizll9jz000ajs0402czz17z	f	4	2025-12-10 06:05:11.904	2025-12-10 06:05:11.904
cmix05oq7001ikz04brqg5ciy	cmix05oej001ekz04vfvrlrt2	cmiwyutll000kkz044g2nrsk1	t	0	2025-12-08 10:22:21.295	2025-12-08 10:59:52.712
cmizuox3u000djo04847ilc8f	cmizuowmb0009jo04zln9bc1h	cmizrm14o0007jv04nium2g4i	t	0	2025-12-10 10:12:39.451	2025-12-10 10:12:39.953
cmizx4l5t0005l204un2e7qjr	cmizx4kqs0001l204cdrveglc	cmizrofg4000gjv04m793hmxi	t	0	2025-12-10 11:20:49.698	2025-12-10 11:20:50.177
cmie6g1s20005jg04ot1okmqo	cmie6g1e20001jg04v7j9fx1d	cmie5n8ds0004l504l3u4x2mm	t	0	2025-11-25 06:10:45.122	2025-11-25 06:10:45.518
cmizz6c2e0005jy04k3hm2exx	cmizz6bo20001jy04fhjeap5n	cmizxct2o000el804nlwb37u9	t	0	2025-12-10 12:18:10.455	2025-12-10 12:18:10.875
cmieh2thl0005l404ichvitae	cmieh2t1e0001l404chnd2ien	cmiegunat0000jp04fogwzazr	t	0	2025-11-25 11:08:23.625	2025-11-25 11:08:24.128
cmiehd0en000bjp04fjv1n740	cmiehd01m0007jp0463lnwrb0	cmiegunew0001jp04bcbwi9i0	t	0	2025-11-25 11:16:19.151	2026-01-07 14:40:29.035
cmiehg7jr0005kz04g4akcmog	cmiehg73m0001kz04fkg2pt90	cmiegv87z0002jp04r2texy5a	t	0	2025-11-25 11:18:48.375	2025-11-25 11:18:48.803
cmifmowyx0005jo04o72jvbts	cmifmowbv0001jo046x81xk84	cmiegw7uu0004jp04bnf5b100	t	0	2025-11-26 06:33:18.826	2026-01-07 14:40:05.034
cmiwz42hz0005k304587vtib1	cmiwz42300001k304nsrt2pe6	cmiwyr2z60000kz049v28o3j4	t	0	2025-12-08 09:53:06.215	2025-12-08 11:01:17.713
cmj1955av0005jv04slgk4tyf	cmj1954vl0001jv04teoxuvj1	cmj15mte00002lb046hk012zk	f	0	2025-12-11 09:44:57.367	2025-12-11 10:49:35.135
cmjb74dz9000bky04esb6xmdm	cmjb74dlr0007ky04ixslh5d8	cmjb6xwi10002la0402660ji2	t	0	2025-12-18 08:46:04.485	2025-12-18 08:46:04.988
cmj2tght4000ile04a1or6r6o	cmj2tghea000ele04orwgqrfg	cmj2t40fi000ijr04omh4jo8q	t	0	2025-12-12 12:01:25.289	2025-12-12 12:02:25.516
cmj6uihdz000ii804lxobsxi6	cmj6uigrd000ei80469objs63	cmj6u8hdp0000i804bsjf60iu	t	0	2025-12-15 07:42:02.376	2026-01-07 14:34:02.353
cmj6vt1pw0010i804wi0h262t	cmj6vt1ae000ui804tlf8ndq1	cmj6uaa0s0008i804nq4l37cm	f	1	2025-12-15 08:18:14.788	2025-12-16 05:44:19.793
cmj86mwf40006l804e833biab	cmj86mvz40002l8045xsn6tr0	cmj86i1a10000l804dka4cwud	t	0	2025-12-16 06:09:10.048	2025-12-16 06:09:10.522
cmj8b6guf0005jo04lb0v18vp	cmj8b6gbp0001jo04k30qq3zd	cmj8b0vvv000rl204bbqxziza	t	0	2025-12-16 08:16:21.447	2025-12-16 08:16:21.953
cmjci2el60005l2041xdbj67k	cmjci2e5q0001l204u5q87ina	cmjchzwla0000ib04cufsy9jy	t	0	2025-12-19 06:40:13.915	2025-12-19 06:40:14.473
cmj9u3c14000dl104npj6wkv3	cmj9u3bi50009l1045bz4l6mi	cmj9rodew0006l704fefqz0x4	t	0	2025-12-17 09:53:34.121	2025-12-17 10:14:03.492
cmjb3xc6h0005ia04yyywy03m	cmjb3xbpp0001ia04qlehfh60	cmjb3ulrv0009jr04ifvvbz5x	t	0	2025-12-18 07:16:36.714	2025-12-18 07:16:37.204
cmjcjny5i0005la048dvelkqt	cmjcjnxsu0001la042uzt1mme	cmjcjgvcg000il204be1hwr2z	t	0	2025-12-19 07:24:58.662	2025-12-19 07:24:59.07
cmih8habt0009jm045g6l380w	cmih8h6mb0005jm04xhy1tu6q	cmih7xnxc0001jm04g8uq1nso	t	0	2025-11-27 09:31:00.617	2025-11-27 09:31:01.012
cmih8nnf1000dju04dlyxg8qj	cmih8njmo0009ju04ptjq4y9k	cmih7z1sr0002jm04f9uwua1v	t	0	2025-11-27 09:35:57.517	2025-11-27 09:35:57.891
cmjguycjj0005i104tbrg7i54	cmjguyc010001i104y5e30pcr	cmjgunh2i0003jo049o1u7f1a	t	0	2025-12-22 07:52:04.352	2025-12-22 07:52:04.876
cmji8u2z6000nkz04aqa0iihe	cmji8u2lo000jkz04kez1f8j3	cmji87iy30003kz042ixnq677	t	0	2025-12-23 07:08:26.13	2025-12-23 07:08:26.568
cmjjocpbf0005kt04wt6uu5ns	cmjjocom20001kt04c4pbtpqr	cmjjo42tp0001l804ik674cut	f	1	2025-12-24 07:10:35.307	2025-12-24 07:10:35.307
cmjjookho000fkt04vfvbpeul	cmjjook2t000bkt04wg6oqo5y	cmjjo5p140006l804gboynv8u	t	0	2025-12-24 07:19:48.924	2025-12-24 07:19:49.343
cmjjr9ne2000djs04tgb42fof	cmjjr9mvi0009js04c1sbrwcm	cmjjqeldr0005js04mgwdm11b	t	0	2025-12-24 08:32:11.69	2025-12-24 08:32:12.208
cmjjy8cik0005l7040amfngua	cmjjy8c2b0001l704b20dbyhf	cmjjxmrgj0001jv04176b0d08	t	0	2025-12-24 11:47:08.252	2025-12-24 11:47:08.744
cmjjz3ho9000dl304qvrmceps	cmjjz3hao0009l3045y4nqoeq	cmjjxoohd0009jv04eiso6d88	t	0	2025-12-24 12:11:21.273	2025-12-24 12:11:21.718
cmjl4hipw0005la04p73cc9q0	cmjl4hibu0001la04kj0hi37k	cmjl39w8g0006jo04we7f4go1	t	0	2025-12-25 07:30:00.068	2025-12-25 07:30:00.505
cmjl5sdd20005ky04tt59h915	cmjl5scwi0001ky040idt0vh6	cmjl5pi0l0000l604m22pq3tg	t	0	2025-12-25 08:06:25.958	2025-12-25 08:06:26.448
cmifnxo0h0005jr0406xi1o0w	cmifnxnl50001jr04om6aohjs	cmifnfm7d0000ju04m9apjul1	t	0	2025-11-26 07:08:06.737	2025-12-06 16:54:59.435
cmjnwd3xu0005jj04xfkbfes6	cmjnwd3hy0001jj04k1z9fj65	cmjnw5ar20001jp04qk2e60ul	t	0	2025-12-27 06:05:55.89	2025-12-27 06:05:56.29
cmjnybzly0005l704dn92iyxi	cmjnybz7g0001l7044288boh8	cmjny65mw000ajj04b4pd1sgk	t	0	2025-12-27 07:01:02.854	2025-12-27 07:01:03.278
cmjo1a2cl000dl404rvwz8xzp	cmjo1a1wb0009l4040mfi7fss	cmjo0tytk0003kz0423qb706a	t	0	2025-12-27 08:23:31.942	2025-12-27 08:23:32.463
cmjqtjmsa0007l404eqqe0k32	cmjqtjmdn0003l404tgyf3bjq	cmjqt5o6n0002jy04z4lpbjsi	t	0	2025-12-29 07:10:19.93	2025-12-29 07:25:50.55
cmjs88ddu0005jp047sx4oj2x	cmjs88cs50001jp04q6z468hr	cmjr1wluc0000kz04nripoipc	t	0	2025-12-30 06:49:14.946	2025-12-30 08:23:42.265
cmiisku7v000fl704lfs3qyrq	cmiisktss000bl7043pqltjee	cmiipqgwy000wlb04wic77vnu	f	0	2025-11-28 11:41:24.86	2025-11-28 11:41:24.86
cmiiskuaw000hl704j4md0ldh	cmiisktss000bl7043pqltjee	cmiipqh18000ylb041rh078w7	t	0	2025-11-28 11:41:24.86	2025-11-28 11:41:25.379
cmipmb4220005ky04s3fx4a9p	cmipmb3m30001ky04z2uftg3l	cmipm3h600000jx044zuw8x6t	t	0	2025-12-03 06:20:16.587	2025-12-03 06:20:16.998
cmiybf3p0000xjs04ooopccv2	cmiybf361000pjs048dxcvupl	cmiy9xun90007ld045qjuromg	t	0	2025-12-09 08:25:22.452	2025-12-09 08:25:23.056
cmiit65qu000tk304xz6div7a	cmiit63qs000pk30475ax6dkn	cmiiprh890010lb048a2bisg4	t	0	2025-11-28 11:57:59.575	2025-11-28 11:57:59.935
cmiitb19j000pl7048o7i39oz	cmiitb0x3000ll704o1eilly9	cmiiprha30011lb04stzrrjz3	t	0	2025-11-28 12:01:47.047	2025-11-28 12:01:47.433
cmiyiiw5k000fjv04kcdxwjpb	cmiyiivm20009jv04fkbv8tfl	cmiya3t0x000kld04ptqyiy8g	f	1	2025-12-09 11:44:16.559	2025-12-09 11:44:16.559
cmiwz42ki0007k304g3qw02t4	cmiwz42300001k304nsrt2pe6	cmiwyqgi30000kv04xhkc9a3a	f	0	2025-12-08 09:53:06.215	2025-12-08 11:01:17.185
cmiitjikr0005l204cptx2wfe	cmiitji7m0001l204s1sruv97	cmiiptl4l001blb04ym9zem16	t	0	2025-11-28 12:08:22.731	2025-11-28 12:08:23.548
cmiitpz0j001dk3044lqyblso	cmiitpyob0017k304h418pgca	cmiipudbm001ilb048h0ook3s	f	1	2025-11-28 12:13:23.971	2025-11-28 12:13:23.971
cmiitpz0j001bk304b60vd7ls	cmiitpyob0017k304h418pgca	cmiiptl79001clb04eim79pvg	t	0	2025-11-28 12:13:23.971	2025-11-28 12:13:24.357
cmiitv310000fl204y7vdcjwv	cmiituz7b0009l2047mmmeoys	cmiipud38001flb04sjytj2uq	f	1	2025-11-28 12:17:22.452	2025-11-28 12:17:22.452
cmiitv310000el204zsnuh9ei	cmiituz7b0009l2047mmmeoys	cmiiptl9m001dlb04hpjc7m5m	t	0	2025-11-28 12:17:22.452	2025-11-28 12:17:22.849
cmiiu0acn000pl204pb3ub03k	cmiiu09s3000jl204yl7q96ee	cmiipud68001glb04kvzpf6c5	f	1	2025-11-28 12:21:25.215	2025-11-28 12:21:25.215
cmiiu0acf000nl2048cohpu3e	cmiiu09s3000jl204yl7q96ee	cmiipucvr001elb04plfbybdf	t	0	2025-11-28 12:21:25.215	2025-11-28 12:21:25.631
cmizli2p2000jic04syal2rj9	cmizli28b000dic046ptld805	cmizl0z3e0004ic04im5fwnzf	f	3	2025-12-10 05:55:23.516	2025-12-10 05:55:23.516
cmiposj640005l604omik1abw	cmiposir30001l6044uzqkpgo	cmiponebx0000jo042d7cbrap	t	0	2025-12-03 07:29:48.556	2025-12-03 07:29:49.065
cmizli2nv000hic04k2ci6x7s	cmizli28b000dic046ptld805	cmizkzjic0001ic04umrrn9ci	t	0	2025-12-10 05:55:23.515	2025-12-10 05:55:24.545
cmiwzifd3000hjm043wysauzw	cmiwziexm000djm04zwwkc1lv	cmiwytomf000bkz04c36oyc8c	t	0	2025-12-08 10:04:16.071	2025-12-08 10:57:58.596
cmiiuj5nx001rk304ths8jbhp	cmiiuj398001nk304lgcyp28n	cmiiprheo0013lb04j6708i3q	t	0	2025-11-28 12:36:05.613	2025-11-28 12:36:06.026
cmiiungr1000xl704isqlyzl8	cmiiune23000tl704qssmsije	cmiipsgnc0014lb0454pfyw73	t	0	2025-11-28 12:39:26.605	2025-11-28 12:39:26.997
cmiiusagk0015l704jnmlvp7j	cmiius6lo0011l7047q63s4gs	cmiipud8x001hlb04bvmlkj9t	t	0	2025-11-28 12:43:11.732	2025-11-28 12:43:12.126
cmizluoto000djm046b4ep49y	cmizluoa80001jm04rbxxydn5	cmizl1h5v000aic04o2nsy34t	f	3	2025-12-10 06:05:11.904	2025-12-10 06:05:11.904
cmix0754u001qkz04xpipwob6	cmix074qv001mkz04rx4o0i64	cmiwyv5y0000lkz04r5p4tom6	t	0	2025-12-08 10:23:29.214	2025-12-08 11:02:33.201
cmizurmng000rl8046s0fflof	cmizudvwt000fl804zkgwhway	cmizrm1740008jv04y5damudm	f	0	2025-12-10 10:14:45.868	2025-12-10 10:14:45.868
cmizxgzll000dl204wulmc3b4	cmizxgz5x0009l2041cpwyird	cmizrp9an000kjv04h7afprib	f	0	2025-12-10 11:30:28.282	2025-12-10 11:30:28.282
cmish8xs90005lb04oefkrqcx	cmish8x5i0001lb04u0ypbmr8	cmisgknwc0003l704gs3rpkkr	t	0	2025-12-05 06:21:55.593	2025-12-05 06:21:55.987
cmizz960r0005kt04cb9gut55	cmizz95mn0001kt04j7ym20k6	cmizxct52000fl8041jupg3hc	t	0	2025-12-10 12:20:22.588	2025-12-10 13:25:16.197
cmipl2x5g0006l704p9qupo6p	cmipl2wjj0002l704jpmj1n01	cmipkhon70000l704g3a67uk4	t	0	2025-12-03 05:45:54.773	2025-12-03 05:45:55.268
cmj1bbghp000jld0442wn263u	cmj1bbg0u000fld04cg7wnjlh	cmj1b14wy000dld04ec8n4ygq	t	0	2025-12-11 10:45:51.037	2025-12-11 10:45:51.48
cmiplrg04000fl704y4uw2vlj	cmiplrfn7000bl704uhs3n78s	cmipliuz40009l70453q5alqr	t	0	2025-12-03 06:04:58.949	2025-12-03 06:04:59.38
cmj1955b40007jv04g0nyrlar	cmj1954vl0001jv04teoxuvj1	cmj15mtic0003lb04t6undp6v	f	1	2025-12-11 09:44:57.367	2025-12-11 10:49:35.135
cmishbpjg0008ic042i3683cu	cmishbp2t0004ic04l963b5md	cmisgko2g0005l704sac6z2bu	t	0	2025-12-05 06:24:04.876	2025-12-05 06:24:05.3
cmj2tghtc000kle042qhr6mqf	cmj2tghea000ele04orwgqrfg	cmj2t4jbx000jjr04nkyx8bup	f	1	2025-12-12 12:01:25.289	2025-12-12 12:02:24.708
cmj6ulbgv0005ky041nkvpopo	cmj6ulb1b0001ky04sphap4on	cmj6u8hhq0001i804jl39xxj4	t	0	2025-12-15 07:44:14.672	2025-12-15 07:44:15.189
cmipqpcs5000njo04jal5a8qj	cmipqpccq000jjo04whqot3ry	cmipqd3dp000hjo04id7ctohr	t	0	2025-12-03 08:23:19.541	2025-12-03 08:23:19.969
cmirhhh9u0005l804rd3g05bm	cmirhhgcj0001l8048s0jo49d	cmirh2xpn0000l804zwfzy034	t	0	2025-12-04 13:40:47.922	2025-12-04 13:40:48.425
cmirhko0l0005l504l8xophss	cmirhknju0001l504u25okyvu	cmirh2xtb0001l804w9l8dg5s	t	0	2025-12-04 13:43:16.629	2025-12-04 13:43:17.127
cmirhowbq0005ju04qwc01dz1	cmirhovv80001ju04y00jjyvc	cmirh2xvv0002l8042x7rtx2e	t	0	2025-12-04 13:46:34.022	2025-12-04 13:46:34.45
cmirhrhew000dl804a5iww68f	cmirhrgzq0009l804io77q2pd	cmirh2xyl0003l804hn2ljsw8	t	0	2025-12-04 13:48:34.664	2025-12-04 13:48:35.19
cmirhtvm2000dl5040fyd25ny	cmirhtv7v0009l504c4hf4yti	cmirh2y0j0004l804bcw7hip4	t	0	2025-12-04 13:50:26.378	2025-12-04 13:50:26.898
cmishe4lw0005lb04c2a18fy2	cmishe4760001lb04vuthkdy7	cmisglj7g0008l704fhz4g24z	t	0	2025-12-05 06:25:57.716	2025-12-05 06:25:58.301
cmishjbpb000dlb048ek2v82z	cmishjbaz0009lb04w1lfxzi7	cmisgljb80009l7047dfzi0gs	t	0	2025-12-05 06:30:00.191	2026-01-07 15:36:09.077
cmishn4sb000gic04t0ufred9	cmishn4cy000cic04hisgio7r	cmisgljnm000cl7040z909gjp	t	0	2025-12-05 06:32:57.852	2025-12-05 06:32:58.285
cmishpzoe000llb04v3w3f1a6	cmishpz7t000hlb0479yzcqnq	cmisgmm94000dl7047muo55v9	t	0	2025-12-05 06:35:11.199	2026-01-07 15:39:59.579
cmishssys000tlb04l4ablpa7	cmishssas000plb04vapzckqr	cmisgmmbg000el704v0vgfj0n	t	0	2025-12-05 06:37:22.469	2025-12-05 06:37:22.874
cmisi24zg000oic04815uee13	cmisi24mv000kic04bbue5xy8	cmisgmmdh000fl704te0u2wlo	t	0	2025-12-05 06:44:37.949	2025-12-05 06:44:38.341
cmisi9poj0011lb04lywo3piz	cmisi9p99000xlb04rdgcfo0b	cmisgmmhw000hl7041ogu1wob	t	0	2025-12-05 06:50:31.363	2025-12-05 06:50:31.887
cmisidiom0005kz04gw10vir0	cmisidibs0001kz04gd5hydpt	cmisgmmss000ml70408h9t4n5	t	0	2025-12-05 06:53:28.918	2025-12-05 06:53:29.335
cmisifv4t0019lb04govuzeho	cmisifusg0015lb04axpsq5so	cmisgmmv5000nl704ya749amp	t	0	2025-12-05 06:55:18.365	2025-12-05 06:55:18.821
cmisiurnz0007jm047oqircki	cmisiurac0003jm04i1j7k74h	cmisinymt0000jm04mgpljik5	t	0	2025-12-05 07:06:53.712	2025-12-05 07:06:54.12
cmisjg5er000dkz04v06bi3p6	cmisjg4zu0009kz04jbk1hicw	cmisgz9ze0002ic0475j3ncpz	t	0	2025-12-05 07:23:31.3	2025-12-05 07:23:31.815
cmisjisr2000lkz04igwrd49d	cmisjisd8000hkz04vt9qxbs9	cmisgjry70000l704nurezyul	t	0	2025-12-05 07:25:34.863	2025-12-05 07:25:35.285
cmisjlh3q0005ld04hxi2m5l4	cmisjlgpa0001ld0418dsyy8f	cmisgjs120001l704tdmphlym	t	0	2025-12-05 07:27:39.734	2025-12-05 07:27:40.341
cmisjp69p000tkz043ohf1aet	cmisjp5ut000pkz046dnvgdp5	cmisgknzn0004l7047jw46nx5	t	0	2025-12-05 07:30:32.317	2025-12-05 07:30:32.908
cmisjrnfi000dld04ir7gl9xy	cmisjrn2v0009ld041bhkfs86	cmisgko500006l704p4fgvevi	t	0	2025-12-05 07:32:27.871	2025-12-05 07:32:28.292
cmisju6dv000fjm04k3vwzst6	cmisju5y6000bjm04d8yj6j7o	cmisgko780007l70414iekbm9	t	0	2025-12-05 07:34:25.748	2025-12-05 07:34:26.116
cmiis02yp0005l704nhatiu7g	cmiis00x00001l704qvzmffl7	cmiippt77000tlb040zntcpxl	f	0	2025-11-28 11:25:16.418	2026-01-02 12:22:09.944
cmiis032g0007l704kch1fuw1	cmiis00x00001l704qvzmffl7	cmiirsg0a000ul204f6oc8lq8	t	0	2025-11-28 11:25:16.418	2026-01-02 12:22:10.665
cmitvvg4x000bjr04syzqc0sx	cmitvvfrt0007jr04qu2fr8f5	cmisgnx66000yl7044p87nth3	t	0	2025-12-06 05:59:06.609	2025-12-06 05:59:07.435
cmitvyher000dl4049d5e5h9t	cmitvyh0r0009l404pmtbad8b	cmisgnx84000zl704rspkp698	t	0	2025-12-06 06:01:28.227	2025-12-06 06:01:28.661
cmitw0yxn000jjr04gsriv1ha	cmitw0yjm000fjr0496qc9crm	cmisgnxaz0010l704y7jymd27	t	0	2025-12-06 06:03:24.251	2025-12-06 06:03:24.67
cmitw32zn0005js04x3hfsjiu	cmitw32iv0001js0440gu7q2l	cmisgnxcw0011l704ri9ofz1b	t	0	2025-12-06 06:05:02.819	2025-12-06 06:05:03.284
cmitw5962000ll4040zkpake4	cmitw58s0000hl404ujqkwbyu	cmisgnxf30012l70467acwb70	t	0	2025-12-06 06:06:44.138	2025-12-06 06:06:44.593
cmitx5brr0005jp04yxfu9ub1	cmitx5bdd0001jp04kbk1adwt	cmitwu2r80006ju04nj5jnj1x	f	1	2025-12-06 06:34:47.127	2025-12-06 06:34:47.127
cmitx5buo0007jp04o4jje4a2	cmitx5bdd0001jp04kbk1adwt	cmitwu2p10005ju04obd0kqfl	t	0	2025-12-06 06:34:47.127	2025-12-06 06:34:47.851
cmitxe6a40005la049c2dei8b	cmitxe5v90001la04tqizjkh1	cmitwu2c60000ju04h6n974e7	f	0	2025-12-06 06:41:39.917	2025-12-06 06:41:39.917
cmitxe6ec0007la041gbvtak5	cmitxe5v90001la04tqizjkh1	cmitwu2fo0001ju04d2jbdzcn	f	1	2025-12-06 06:41:39.917	2025-12-06 06:41:39.917
cmitxe6f40009la0482vw0ej9	cmitxe5v90001la04tqizjkh1	cmitwu2kn0003ju045y107w83	f	3	2025-12-06 06:41:39.917	2025-12-06 06:41:39.917
cmitxe6gf000dla0404t5v61a	cmitxe5v90001la04tqizjkh1	cmitwu2ip0002ju04spxuth1x	f	2	2025-12-06 06:41:39.917	2025-12-06 06:41:39.917
cmitxe6fu000bla0497tf6brd	cmitxe5v90001la04tqizjkh1	cmitwu2mn0004ju04xcv438tc	t	0	2025-12-06 06:41:39.917	2025-12-06 06:41:40.646
cmity7fyu0007i8044ycnpvgv	cmity7fhb0001i804548qmc42	cmitxz0zd000hla049dvyfazw	f	2	2025-12-06 07:04:25.392	2025-12-06 07:04:25.392
cmity7fz00009i80451m4d5z0	cmity7fhb0001i804548qmc42	cmitxllw50000l7046allb6dx	f	0	2025-12-06 07:04:25.391	2025-12-06 07:04:25.391
cmity7fvy0005i804c43vjrjl	cmity7fhb0001i804548qmc42	cmitxz0vg000gla04s8pey261	t	0	2025-12-06 07:04:25.391	2025-12-06 07:04:26.08
cmj1bcrij0009l5040ps9m62n	cmj19mh87000bjr04h6jcglw5	cmj1b14ud000cld040gljcpyy	f	1	2025-12-11 10:46:51.979	2025-12-11 10:47:25.689
cmix08qco0023k3041m20g1jf	cmix08py8001zk3040tju9n99	cmiwyv62r000mkz04rli7vevu	t	0	2025-12-08 10:24:43.369	2025-12-08 11:05:33.728
cmiybnyog0005jr049kucmedn	cmiybny3j0001jr048t2v3zqh	cmiya1djf000bld043wars1fo	t	0	2025-12-09 08:32:15.953	2025-12-09 08:32:16.439
cmiwzifg6000jjm041290hdc4	cmiwziexm000djm04zwwkc1lv	cmiwytois000akz04w3izp98a	f	0	2025-12-08 10:04:16.072	2025-12-08 10:57:58.13
cmiyiq18g0005jx04zq1i8nih	cmiyiq0s30001jx04mkjerrau	cmiya43fn000lld04r43zzsoz	t	0	2025-12-09 11:49:49.888	2025-12-09 11:49:50.304
cmiwz98um0005jm046m46bzto	cmiwz98gb0001jm045m47oner	cmiwyrsc00001kz04p9y29grq	f	2	2025-12-08 09:57:07.726	2025-12-08 11:04:04.237
cmizli2r1000lic04aw7n0kez	cmizli28b000dic046ptld805	cmizkzyb60003ic04cx4kpgpb	f	2	2025-12-10 05:55:23.516	2025-12-10 05:55:23.516
cmiztw71h0005jx04xq6qk8si	cmiztw6fm0001jx045mgbe7wn	cmizrldf30000jv041ygsc8w4	t	0	2025-12-10 09:50:19.302	2025-12-10 09:50:19.812
cmizv4nxi000ljo04gfqe8onz	cmizv4nh8000hjo04vheq6rxi	cmizrm1740008jv04y5damudm	t	0	2025-12-10 10:24:54.054	2025-12-10 10:24:54.583
cmizxgzo8000fl204oqteu9k3	cmizxgz5x0009l2041cpwyird	cmizrp98p000jjv04db6ye6wh	t	0	2025-12-10 11:30:28.282	2025-12-10 11:30:28.884
cmj10cvj70005js04im2axjht	cmj10cv2s0001js04cg935auv	cmj105xxe0001l204i8urbrml	f	1	2025-12-11 05:39:01.411	2025-12-11 05:39:01.411
cmj1982m70005jr04vstgt31m	cmj19828d0001jr04n7j7ljfi	cmj15n4620004lb04e7ib4p0f	t	0	2025-12-11 09:47:13.856	2025-12-11 09:47:14.405
cmjcjpmuh0005ji040ufpa25a	cmjcjpmgf0001ji04oqe4aygh	cmjcjgvek000jl204hi0nnoow	t	0	2025-12-19 07:26:17.321	2025-12-19 07:26:17.737
cmj2ts3180010le04m12c6bd1	cmj2ts2ok000wle04q0w233jj	cmj2tkfbd000cle04kr0fi2w0	t	0	2025-12-12 12:10:26.012	2025-12-12 12:11:22.125
cmj6uo1a60005le048rrcqatq	cmj6uo0u70001le04rtcrxs2v	cmj6u900w0002i8040bvp6kwv	t	0	2025-12-15 07:46:21.439	2025-12-15 07:46:21.931
cmjgv0n3x000di104pxwz4hav	cmjgv0mpt0009i104ahr75f1p	cmjgunh4u0004jo04nfqi1b6j	t	0	2025-12-22 07:53:51.357	2026-01-10 08:31:50.472
cmj6vwtbv0005jo04jhhdztiw	cmj6vwsxy0001jo04vftnlwuk	cmj6uaa9n0009i804occ0dp71	t	0	2025-12-15 08:21:10.651	2025-12-15 08:21:53.914
cmj87g6be0005ky044qj5yk57	cmj87g5vm0001ky04ifsqjak2	cmj874na10000ju04ilnik4wu	t	0	2025-12-16 06:31:55.898	2025-12-16 06:31:56.423
cmji8wpsd0005kz04qjmrbc07	cmji8wpen0001kz04pigbmiwn	cmji87j1x0004kz04nekhpou1	t	0	2025-12-23 07:10:29.005	2025-12-23 07:10:29.429
cmjjocpf70007kt046d655vtg	cmjjocom20001kt04c4pbtpqr	cmjjo42qa0000l80405zc401g	t	0	2025-12-24 07:10:35.307	2025-12-24 07:10:35.984
cmj9tcuqm0005l104hy0igrvy	cmj9tcu400001l104aoig665o	cmj9rmtky0000l704267qhn0q	t	0	2025-12-17 09:32:58.655	2025-12-17 09:55:04.77
cmj9ueqfu000hjv048m7me5ku	cmj9ueq1v000djv04tawfq5fc	cmj9rodh70007l704bufi2rr6	t	0	2025-12-17 10:02:26.011	2025-12-17 10:02:26.442
cmjb3znk00005jr04h13e64ji	cmjb3zn6i0001jr04deeirohk	cmjb3ulog0008jr04pmo9ehii	t	0	2025-12-18 07:18:24.768	2025-12-18 07:18:25.237
cmjb5wxqs0005l504wuqtqihf	cmjb5wx9s0001l504ptigsigx	cmjb5utm90008js04ub6pviu1	t	0	2025-12-18 08:12:17.237	2025-12-18 08:12:17.747
cmjb77z54000ala045pmsgyo5	cmjb77yps0006la04eda0b4zl	cmjb6xwjw0003la04xfn5vigl	t	0	2025-12-18 08:48:51.881	2026-01-02 12:28:05.851
cmjci5o0i0005jv04pkjl2eu5	cmjci5nm90001jv04gu4fy4f3	cmjchzwon0001ib04ghydjgdv	t	0	2025-12-19 06:42:46.099	2025-12-19 06:42:46.621
cmjjorwip0005lb04tk0wrp8f	cmjjorw4u0001lb04kh2xte2s	cmjjo5yep0007l804bfngk9q5	t	0	2025-12-24 07:22:24.482	2025-12-24 07:22:24.886
cmjjrdedc0005l7045yib1zz1	cmjjrddxa0001l70489frh9xg	cmjjqelg20006js04n8kdlfgy	t	0	2025-12-24 08:35:06.624	2025-12-24 08:35:07.14
cmjjycver0005l804pj7osn4d	cmjjycuzw0001l8040f23afvg	cmjjxmrl30002jv046kizhd34	t	0	2025-12-24 11:50:39.364	2025-12-24 11:50:39.791
cmjjz6pwz0005k404s9s7c97v	cmjjz6pih0001k4047pf1v6xs	cmjjxoojd000ajv04998j3iua	t	0	2025-12-24 12:13:51.924	2025-12-24 12:13:52.348
cmjnydw6z0005lb040z3y5ndw	cmjnydvs60001lb04mes6ro5n	cmjny65pa000bjj04qtcu9brw	t	0	2025-12-27 07:02:31.74	2025-12-27 07:02:32.173
cmjl4k78u000dks040sylnrd9	cmjl4k6w10009ks04hps5omnq	cmjl39waz0007jo04u8dnlp05	t	0	2025-12-25 07:32:05.166	2025-12-25 07:36:07.903
cmjo1ce6c000gl704iffs0z75	cmjo1cdsr000cl7042ijbpvrc	cmjo0uowz0004kz04652h3rrx	t	0	2025-12-27 08:25:20.58	2025-12-27 08:25:21.022
cmjmiiw0z000ajr04cnxlflux	cmjmiiv9k0006jr04vbtcud68	cmjmigepu0000jr045sa86knk	t	0	2025-12-26 06:50:44.771	2025-12-26 06:56:46.598
cmjnwfna30005jo04spc04acw	cmjnwfmvz0001jo04ogxtrvvu	cmjnw5b0b0002jp04i95drv31	t	0	2025-12-27 06:07:54.268	2025-12-27 06:07:54.737
cmjqtmseo0005le048b5vlmyg	cmjqtms0i0001le04cs1dbosm	cmjqt60zr0003jy04oh3mjl3m	t	0	2025-12-29 07:12:47.185	2025-12-29 07:12:47.593
cmjs8vt95000pl904am7fhoez	cmjs8vswg000ll904ivb4y4hb	cmjr1xjdx0006kz04ig728d9v	t	0	2025-12-30 07:07:28.601	2025-12-30 07:07:29.035
cmjs9xrm8000jl504v7ry5a47	cmjs9xr330009l504bve9usvm	cmjr21w2r000hkz041dwb15b1	f	1	2025-12-30 07:36:59.255	2025-12-30 08:20:15.603
cmjsabitu000rl504x3jx9hhp	cmjsabie4000nl5047neriisy	cmjr24026000skz04tyfk9xt2	t	0	2025-12-30 07:47:41.203	2025-12-30 07:47:41.626
cmjs9dek0000fl704u52kwo1h	cmjs9ddzv0009l7040uzoq6md	cmjr23fsz000okz0451qpya6u	f	1	2025-12-30 07:21:09.26	2025-12-30 08:22:21.695
cmjs88dhw0007jp04nnoon51f	cmjs88cs50001jp04q6z468hr	cmjr1zjjg000akz04azeacgw8	f	1	2025-12-30 06:49:14.947	2025-12-30 08:23:41.737
cmjtlscqq0005jj04oowoydet	cmjtlsbz60001jj04uj1r1219	cmjtlpumc0000l804zbmrw43t	t	0	2025-12-31 05:56:28.418	2025-12-31 05:57:10.171
cmjtnabk10005jl043a3nk3j6	cmjtnab660001jl04cbowblqq	cmjtm4l3b0004l204lkx55unm	t	0	2025-12-31 06:38:26.305	2025-12-31 07:02:06.563
cmjtnxsrk000ejr04qpm3tlyc	cmjtnxsef000ajr04ylnerkne	cmjtm6e1g0009l204mewqyxru	t	0	2025-12-31 06:56:41.697	2025-12-31 11:53:17.675
cmk22j8kk000nl504dpx3vt9m	cmk22j84n000jl5044bu52s5f	cmk22hvuv000vl804tjtlerlk	t	0	2026-01-06 04:07:25.989	2026-01-06 04:07:26.418
cmk22luzy000vl504jaikyzsp	cmk22lum8000rl504lr387qd1	cmk22klqs000bl404caoy0o39	t	0	2026-01-06 04:09:28.366	2026-01-06 04:09:28.792
cmk22oonm0011l804vh0ctsyf	cmk22oobb000xl804442kubzw	cmk22n8aw000yl504gvnm0mz9	t	0	2026-01-06 04:11:40.115	2026-01-06 04:11:40.558
cmk22r16v001al8045s5dbso6	cmk22r0m60016l804jm8lo6hl	cmk22ps9f0014l804efmfa7a4	t	0	2026-01-06 04:13:29.672	2026-01-06 04:13:30.144
cmk22vzaz0014l504nec30a4b	cmk22vyy90010l504q8j12fo2	cmk22t66v000cl4042ysayspt	t	0	2026-01-06 04:17:20.507	2026-01-06 04:17:20.952
cmk22zl84000il404fmda5ht2	cmk22zktx000el404y46v4j49	cmk22yb64001dl804oxiatt4l	t	0	2026-01-06 04:20:08.884	2026-01-06 04:20:09.542
cmk232r5i001cl504jlsx7lal	cmk232qry0018l504de8d5n5d	cmk231dbu000ll404j0jzab2h	t	0	2026-01-06 04:22:36.534	2026-01-06 04:22:37.082
cmk235hix001jl804e99ft015	cmk235h57001fl8048cuptyib	cmk2343uf001fl504t4kztnkl	t	0	2026-01-06 04:24:44.025	2026-01-06 04:24:44.55
cmk239ftg001ll5040efdin00	cmk239fex001hl504ok7mr9yc	cmk236vzd001ml804laqaywz5	t	0	2026-01-06 04:27:48.436	2026-01-06 04:27:48.894
cmk23d3t1000sl404ztnaefqs	cmk23d3dx000ol404f65rtwxa	cmk23bvrz000ml404rpcifcsc	t	0	2026-01-06 04:30:39.493	2026-01-06 04:30:39.987
cmk23he44001ul5044ou0jynh	cmk23hdrf001ql504837h4q9t	cmk23frn4001ol504p2qtc3l1	t	0	2026-01-06 04:33:59.476	2026-01-06 04:33:59.891
cmk2438w9001sl804b0i44p7q	cmk2438fp001ol804rtelnsw2	cmk240n92001xl504npkr9qx7	t	0	2026-01-06 04:50:59.145	2026-01-06 04:50:59.561
cmk24glmt0005jw04byg29n7p	cmk24gl4n0001jw045th1wh40	cmk24e044001vl804dsbdi35c	t	0	2026-01-06 05:01:22.181	2026-01-06 05:01:23.009
cmk24t0kz000ejw04lwa1t3g8	cmk24t060000ajw04boatd81y	cmk24mxae0008jw04rwiui7c8	t	0	2026-01-06 05:11:01.427	2026-01-06 05:11:02.092
cmk2521610005l404f94ozbap	cmk2520s50001l404qkpsjgvb	cmk250c9y000hjw04cq1f6qpn	t	0	2026-01-06 05:18:02.089	2026-01-06 05:18:02.512
cmk2639ds000ojw0483ykfrt9	cmk2638ut000kjw04ltf139lv	cmk2618sv000ijw04eiwzgz8z	t	0	2026-01-06 05:46:59.008	2026-01-06 05:46:59.413
cmk29bncm0005jo042pt2x12l	cmk29bmwr0001jo04hfeh53f9	cmk297cvp0000l504ladnzz3b	t	0	2026-01-06 07:17:29.207	2026-01-06 07:17:29.729
cmk29is7x000djo04z8zdb1i5	cmk29irqk0009jo04kf1w5mlb	cmk29gj2i0000l804lhp4d0uh	t	0	2026-01-06 07:23:02.109	2026-01-06 07:23:02.739
cmk29mg3r000mjo04pfuobh1d	cmk29mfpl000ijo041te5ch3k	cmk29jsds000gjo04ikiy0392	t	0	2026-01-06 07:25:53.032	2026-01-06 07:25:53.495
cmk29qa190007l5043rg0bkeg	cmk29q9n10003l504zcvctmgi	cmk29ni9w0001l504a19mqnpx	t	0	2026-01-06 07:28:51.79	2026-01-06 07:28:52.231
cmk29wdz20006l804m2nr4izm	cmk29wdhs0002l804sxbc1f8z	cmk29tw9l000pjo04kjg3m8pf	t	0	2026-01-06 07:33:36.83	2026-01-06 07:33:37.42
cmk29zbkb000vjo04a7f0sgxt	cmk29zb27000rjo044wbyddje	cmk29xql5000al50412qq09wb	t	0	2026-01-06 07:35:53.676	2026-01-06 07:35:54.068
cmk2d58ir0005ie04pboopue0	cmk2d57tl0001ie047dkbg2b8	cmk2d2gf10009l804co4kj45r	t	0	2026-01-06 09:04:28.516	2026-01-06 09:04:28.98
cmk2e61ee0006ld04w7p4xc66	cmk2e60xg0002ld045d7irr75	cmk2e3tos0000ld04v4brd13s	t	0	2026-01-06 09:33:05.559	2026-01-06 09:33:06.045
cmk2ec2ik000njv0418bqnbex	cmk2ec1ud000jjv04130x4vo8	cmk2ea4lu000ajl05jvroiwza	t	0	2026-01-06 09:37:46.94	2026-01-06 09:37:47.457
cmk2dym4b000fjv047og5bz2c	cmk2dyljs000bjv04jbu8sqmu	cmk2dw62i0000jl0544vu3oyl	t	0	2026-01-06 09:27:19.164	2026-01-06 09:27:20.117
cmk2e18uw0007jl05vcdsbohv	cmk2e18dk0003jl05mw6kf0ps	cmk2dzszb0001jl05xat41yge	t	0	2026-01-06 09:29:21.944	2026-01-06 09:29:22.422
cmk2hjkkx0005jr04bxsy6oy8	cmk2hjk4i0001jr04ne2zw15q	cmk2hhis70000jv04wukg1bhy	t	0	2026-01-06 11:07:35.794	2026-01-06 11:07:36.337
cmk2hn36j000djr04e6r1qgew	cmk2hn2qx0009jr04uv5zlnf8	cmk2hlib40000js040l0dlq06	t	0	2026-01-06 11:10:19.867	2026-01-06 11:10:20.277
cmk3hgeol0006l804cbvnnvo4	cmk3hge360002l804cnvb2opo	cmk3haolt0000l804wuilkz0u	t	0	2026-01-07 03:52:54.357	2026-01-07 03:52:54.816
cmk3paarb000lk004qb24c5eo	cmk3paabs000hk004ek0uxmid	cmk3p3no7000fk004uhys0hga	t	0	2026-01-07 07:32:06.263	2026-01-07 07:32:06.798
cmk3i3nda000el8042bjzdwop	cmk3i3mz1000al804zcakqk77	cmk3i1g1q0000jv04vo6e0lnq	t	0	2026-01-07 04:10:58.702	2026-01-07 04:13:56.173
cmk3k0w1x0006jm040nujcot9	cmk3k0vnl0002jm04dun2ixo3	cmk3jrm490000jm044yo8ky1t	t	0	2026-01-07 05:04:49.222	2026-01-07 05:04:49.68
cmk3naffo0006jl04ypdrdrx1	cmk3naew70002jl04eh5j6gpd	cmk3n7pzm0000jl046nmvnss4	t	0	2026-01-07 06:36:13.092	2026-01-07 06:36:13.619
cmjjqt6z20005jy04622zksd2	cmjjqt6ji0001jy04txetgjky	cmjjqel3x0002js04j7mue5g7	t	0	2025-12-24 08:19:23.918	2026-01-07 06:53:58.716
cmk3o60vc000bjp04xjb3ikbh	cmk3o60hi0007jp04ujya83qp	cmk3o4e200000lc04bivpwie4	t	0	2026-01-07 07:00:47.209	2026-01-07 07:00:47.62
cmk3oglks0007lc04fbh2c6of	cmk3ogl4x0003lc04nefpzpir	cmk3oe5ok0001lc04ynsn4b7e	t	0	2026-01-07 07:09:00.605	2026-01-07 07:09:01.116
cmk3ojxrf0005l404xp5jue0y	cmk3ojxbn0001l404g9pl8po8	cmk3oihj10006k0045woxboi0	t	0	2026-01-07 07:11:36.364	2026-01-07 07:11:36.995
cmk3or7c7000ck0046sofrzm3	cmk3or6wq0008k004ek2wy8wn	cmk3opl42000alc04gjzjd8fu	t	0	2026-01-07 07:17:15.368	2026-01-07 07:17:15.797
cmk3ouq0q000el404xkqw3rg1	cmk3oupbl000al404py90az3u	cmk3otduo0008l4047waloo3m	t	0	2026-01-07 07:19:59.546	2026-01-07 07:20:00.258
cmk3uf6jo0006js04wpnw2qdo	cmk3uf63o0002js049ruqwyb7	cmk3ub7ep0000js0465a29lqf	t	0	2026-01-07 09:55:52.164	2026-01-07 09:55:52.691
cmk3xwevd0006js04glhdendm	cmk3xwear0002js04b344z8lo	cmk3xu5wc0000js04l2aeohgz	t	0	2026-01-07 11:33:14.954	2026-01-07 11:33:15.756
cmk3xz7wo000fjs049sgh3kwe	cmk3xz7jg000bjs04jz6jd44c	cmk3xxo1w0009js04mu0vyfao	t	0	2026-01-07 11:35:25.896	2026-01-07 11:35:26.305
cmk3y6n2b000njs04vaihhc1r	cmk3y6mfw000jjs04odka8i8a	cmk3y4g3v0009js04zbb2w2dg	t	0	2026-01-07 11:41:12.131	2026-01-07 11:41:12.938
cmk3ycyoc000vjs040j8dm6wu	cmk3ycyan000rjs04322aiapz	cmk3yakgd000ajs04yz32fdao	t	0	2026-01-07 11:46:07.116	2026-01-07 11:46:07.54
cmk4zbu070005l804hslxgyc8	cmk4zbteq0001l804mjxibulg	cmk4z97xd0000ld04z2lbhuiu	t	0	2026-01-08 05:01:00.199	2026-01-08 05:01:00.693
cmk529md10005ii0416omlbo2	cmk529lzj0001ii04wglsw9uo	cmk526dva0002kw04j5v461pk	t	0	2026-01-08 06:23:15.829	2026-01-08 06:23:16.302
cmk52cvq8000eii04wqebc4qv	cmk52cvag000aii04nxxa7xyw	cmk52aqcd0008ii0452s2c2bt	t	0	2026-01-08 06:25:47.937	2026-01-08 06:25:48.457
cmk52hvaz000nii04puqh64uj	cmk52huyh000jii044ogvped3	cmk52g7y9000hii042r14fxyw	t	0	2026-01-08 06:29:40.667	2026-01-08 06:29:41.09
cmk52n9tf000elb04a366qjhs	cmk52n9dq000alb04aww67o8q	cmk52lle10000lb0436rqi8f4	t	0	2026-01-08 06:33:52.755	2026-01-08 06:33:53.753
cmk52rkdz000dla04ly7a6554	cmk52rjzq0009la0464ukkl7k	cmk52ozxz000hlb04f61zz9db	t	0	2026-01-08 06:37:13.079	2026-01-08 06:37:13.607
cmk530k6s000nlb041dgbd6xa	cmk530jr2000jlb04oizxa3nh	cmk52xvqo0000le04hbuml0q8	t	0	2026-01-08 06:44:12.724	2026-01-08 06:44:13.128
cmk542i6a0005i004q2bgoaqz	cmk542hq30001i0047k5l7s0p	cmk53zvp90003kw04dsce1nvt	t	0	2026-01-08 07:13:43.043	2026-01-08 07:13:43.667
cmk5ctnfg0005lc04yrh39058	cmk5ctmvj0001lc04341ymihj	cmk5crq4e0000jq04mw42cefd	t	0	2026-01-08 11:18:46.493	2026-01-08 11:18:47.13
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, sku, description, price, category, "categoryId", variations, "stockLevel", "minStock", "isActive", "clientId", images, videos, "thumbnailUrl", "createdAt", "updatedAt", "allowPreorder") FROM stdin;
cmiwzmrzy001bk304otwefuou	CZ MAT BRACELET PREMIUM QUALITY 	CZ BRACELET -40	HC:45	360.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:07:39.07	2025-12-08 11:10:12.358	f
cmiybazux0001l804998w52hb	CZ BLACK BEADS 18"INCHES 	CZ BLACK BEADS -42	HC:\n(Colours Available) 	380.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765268164994", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:22:10.953	2025-12-09 08:22:10.953	f
cmiyjcmsg0001jj04sctno10h	BLACK BITS	CZ BLACK BEEDS -56	HC:60\n(Length:24"Inches)	450.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 12:07:24.256	2025-12-09 12:07:24.256	f
cmizuowmb0009jo04zln9bc1h	CZ VICTORIAN BANGLES PREMIUM QUALITY 	CZ VIC BANGLES -108	HC:\n(Colours Available)	800.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765361460229", "name": "2.4+2.10", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:12:38.82	2025-12-10 10:12:38.82	f
cmizxofna000zjp04o1xdddtv	PANCHALOHAM BANGLES PREMIUM QUALITY 	4 BNGL-108	HC:\n	760.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765366452192", "name": "2.4", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:36:15.671	2025-12-10 11:36:15.671	f
cmj19bimx000bjv040k0a3f47	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-132	HC:\n	900.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:49:54.585	2025-12-11 09:49:54.585	f
cmj2t1mtx0006le04i9urumjn	INVISIBLE CHAINS 	NECKLACE-22#2	HC:26	270.00	Invisible Chains	cmj2snjep0001le04djqr3fqd	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 11:49:51.957	2025-12-12 11:49:51.957	f
cmj6ulb1b0001ky04sphap4on	COMBOSET PREMIUM QUALITY 	COMBOSET -440	HC:463	2720.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:44:14.112	2025-12-15 07:44:14.112	f
cmj858wgi0001l404lopxlbau	COMBOSET PREMIUM QUALITY 	COMBOSET -312	HC:328	1998.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 05:30:17.298	2025-12-16 05:30:17.298	f
cmj8a8ybp000jl2049wvdyv2e	CZ VICTORIYA COMBOSET PREMIUM QUALITY 	CZ VICT HARAMSET-335	HC:368	2180.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 07:50:17.797	2025-12-16 07:50:17.797	f
cmhiyvlbh0001la045johq640	Jadav kundan.gold replica.sun and moon.	Sun moon - 56	Hc 60	520.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-03 09:58:01.902	2025-11-03 09:58:01.902	f
cmj9u3bi50009l1045bz4l6mi	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-256#2	HC:270\n(Colours Available)	1640.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765965085541", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:53:33.437	2025-12-17 10:14:01.987	f
cmjb41isn000ejr04dmv3ny4k	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-67	HC:	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:19:51.911	2025-12-18 07:19:51.911	f
cmjb66avf0001ju04w20u0sxg	MAT JUMKA PREMIUM QUALITY 	MAT JUMKA-87#1	HC:	630.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:19:34.155	2025-12-18 08:19:34.155	f
cmjch2k8o0009ky04p8svcyhg	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-51	HC:	400.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:12:21.624	2025-12-19 06:12:21.624	f
cmjcjtl5j000vl204wzc6bmnr	GOLD REPLICA JUMKA MICRO PLATED PREMIUM QUALITY 	GOLD JUMKA-48	HC:54	425.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:29:21.751	2025-12-19 07:29:21.751	f
cmjgv6a4d0001ih04eb0i7ven	 3 STEP CHANDRA HARAM PREMIUM QUALITY 	3 STEP CHAIN-40	HC:45	360.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:58:14.461	2025-12-22 07:58:14.461	f
cmji94nyz0001jx04akfb4mly	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-319#1	HC:335	2000.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:16:39.899	2025-12-23 07:16:39.899	f
cmjjorw4u0001lb04kh2xte2s	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM-69	HC:72\n	530.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 07:22:23.982	2025-12-24 07:22:23.982	f
cmjjrddxa0001l70489frh9xg	MAT BANGLES PREMIUM QUALITY 	BANGLES-60	HC:65\n(Sizes Available)	470.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766565199741", "name": "2.4 +2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:35:06.046	2025-12-24 08:35:06.046	f
cmjjycuzw0001l8040f23afvg	SUN MOON PREMIUM QUALITY 	SUN MOON-54	HC:60	440.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:50:38.829	2025-12-24 11:50:38.829	f
cmjjz6pih0001k4047pf1v6xs	SUN MOON PREMIUM QUALITY 	SUN MOON-31	HC:36	330.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 12:13:51.401	2025-12-24 12:13:51.401	f
cmjl4hibu0001la04kj0hi37k	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-161	HC:	1170.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:29:59.562	2025-12-25 07:29:59.562	f
cmjl5co0r0001l404ngo11rg8	MEENAKARI LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-240	HC:254	1640.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:54:13.275	2025-12-25 07:54:13.275	f
cmjmjaih30001jp043s8hl0u6	CZ JADA PREMIUM QUALITY 	CZ JADA-94	HC:99	760.00	Jada set	cmhgkox8n0003ib0427athu89	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-26 07:12:13.575	2025-12-26 07:12:13.575	f
cmjnx5oie0001la042cm9pcti	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-33#1	HC:36	330.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:28:08.918	2025-12-27 06:28:08.918	f
cmjnyjg7f000blb04gp0unx7c	CZ STUDS PREMIUM QUALITY 	CZ STUDS-72#1	HC:78	560.00	Ear studs	cmih992ry0001la04z66nrpok	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 07:06:50.956	2025-12-27 07:06:50.956	f
cmjqtms0i0001le04cs1dbosm	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-85	HC:90\n(Sizes Available)	625.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:12:46.674	2025-12-29 07:12:46.674	f
cmjqtxucf000hle04f74pk7n3	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-85#4	HC:90\n(Sizes Available)	625.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:21:22.912	2025-12-29 07:21:22.912	f
cmjo1h4ws0009l804xmlv9l75	CZ COMBO SET PREMIUM QUALITY 	CZ HARAM NECKLACE-1081	HC:1136	6680.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:29:01.853	2026-01-10 08:34:50.301	f
cmiwr03l60001l704ithbg3pv	CZ VANKI PREMIUM QUALITY 	VANKI-213	HC:225	1390.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:06:04.074	2025-12-08 06:06:04.074	f
cmiwzolz7000qkz04bg36n1ef	CZ BRACELET PREMIUM QUALITY 	BRACELET -38	HC:42	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:09:04.579	2025-12-08 10:09:04.579	f
cmiybf361000pjs048dxcvupl	CZ BLACK BEADS 18"INCHES 	CZ BLACK BEADS-42	HC:\n(Colours Available)	380.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765268618806", "name": "Ruby + Green + White ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:25:21.866	2025-12-09 08:25:21.866	f
cmiyjjb230001ie04uw6rhaex	CZ BLACK BITS PREMIUM QUALITY 24"INCHES 	BLACK BEAT-108	HC:114\n(Length:24"Inches)	760.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 12:12:35.643	2025-12-09 12:12:35.643	f
cmizv4nh8000hjo04vheq6rxi	CZ VICTORIAN BANGLES PREMIUM QUALITY 	CZ VIC BANGLES -144#1	HC:\n(Colours Available)	990.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:24:53.468	2025-12-10 10:24:53.468	f
cmizyd5po0001l504bzac35fn	CZ BANGLES PREMIUM QUALITY 	CZ BANGLES -49	HC:\n	389.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765367650039", "name": "2.4+2.8", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:55:29.196	2025-12-10 11:55:29.196	f
cmj19ers5000bl50468tqi94o	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-139	HC:146\n(Colours Available)	940.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765446639593", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:52:26.405	2025-12-11 09:52:26.405	f
cmj6uo0u70001le04rtcrxs2v	COMBOSET PREMIUM QUALITY 	COMBOSET -513	HC:539	3240.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:46:20.863	2025-12-15 07:46:20.863	f
cmj85gbkc0001jl04um7cx0lc	CZ COMBOSET PREMIUM QUALITY 	CZ V HARAM 447	HC:491\n(Colours Available)	2870.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[{"id": "1765863295229", "name": "Wine & Purple ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 05:36:03.468	2025-12-16 05:36:03.468	f
cmj8anyas0001l104bt3fs0ok	CZ VICTORIYA HARAMSET PREMIUM QUALITY 	CZ VICT HARAMSET-283	HC:311	1860.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 08:01:57.604	2025-12-16 08:01:57.604	f
cmj9ueq1v000djv04tawfq5fc	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-256#3	HC:270\n(Colours Available)	1640.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765965614324", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 10:02:25.507	2025-12-17 10:02:25.507	f
cmjb43pj90001jp049z3l53cr	CZ JUMKA PREMIUM QUALITY 	JUMKA-63	HC:	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:21:33.957	2025-12-18 07:21:33.957	f
cmjb68b3i000hie04y29949g0	MAT JUMKA PREMIUM QUALITY 	MAT JUMKA-110	HC:117	760.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:21:07.759	2025-12-18 08:21:07.759	f
cmjci2e5q0001l204u5q87ina	VICTORIA JUMKA PREMIUM QUALITY 	VICT JUMKA-204	HC:	1280.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:40:13.358	2025-12-19 06:40:13.358	f
cmjcjvq8c0009l204p05tpsle	GOLD REPLICA JUMKA MICRO PLATED PREMIUM QUALITY 	GOLD JUMKA-68	HC:76	540.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:31:01.644	2025-12-19 07:31:01.644	f
cmji8fyvc0001kw04fnt0law6	CZ CHAIN HIP BELT PREMIUM QUALITY  	CZ BELT-319	HC:335	2000.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 06:57:27.624	2025-12-23 06:57:27.624	f
cmji96ynw0009jx04xclaanlg	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-229#2	HC:240	1480.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:18:27.068	2025-12-23 07:18:27.068	f
cmjjyflvy0001l4041djfubuw	SUN MOON PREMIUM QUALITY 	SUN MOON-36	HC:40	330.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:52:46.991	2025-12-24 11:52:46.991	f
cmjl3jwdq0001jm04kocjalgg	CZ PULIGORU LOCKET WITH MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MALA-103	HC:146	1030.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:03:51.47	2025-12-25 07:08:38.146	f
cmjl4k6w10009ks04hps5omnq	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-143	HC:	1080.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:32:04.705	2025-12-25 07:36:06.448	f
cmjl5scwi0001ky040idt0vh6	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-148#2	HC:	1100.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 08:06:25.363	2025-12-25 08:06:25.363	f
cmjnwaxay0001l704hsxh6ii2	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-27	HC:31	310.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:04:13.978	2025-12-27 06:04:13.978	f
cmjny8mkx000fjj04f3h73xdi	GJ STUDS PREMIUM QUALITY 	GJ STUDS-58	HC:	470.00	Ear studs	cmih992ry0001la04z66nrpok	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:58:26.002	2025-12-27 06:58:26.002	f
cmjo12p160001jl04bf7gx0xq	PANCHALOHAM NECKLACE 	NECKLACE-180	HC:189	1170.00	PANCHALOHAM NECKLACE	cmjo0ynz8000al704riezevpo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:17:48.09	2025-12-27 08:17:48.09	f
cmjo1lj5n0008kz04z28bkc80	MAT NECKLACE PREMIUM QUALITY 	NECKLACE-481	HC:506	2990.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:32:26.939	2025-12-27 08:32:26.939	f
cmjqtpejk0009le04v6s3ukku	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-45#1	HC:49\n(Sizes Available)	380.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:14:49.184	2025-12-29 07:14:49.184	f
cmjjqkbzj0001ju04wzh4c3af	PANCHALOHAM BANGLES PREMIUM QUALITY 	BNGL-96#1	HC:101\n(Size’s Available)	690.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:12:30.511	2026-01-07 06:36:00.919	f
cmj19ht4p000ll504c4sdzwfk	CZ NECKLACE PREMIUM QUALITY 	 CZ NECK -168	HC:177\n(Colours Available) 	1120.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:54:48.122	2026-01-07 14:29:57.703	f
cmj2tba95000ljr04ahgx6yuq	CHANDRAHARAM WITH LOCKET PREMIUM QUALITY 	STEP HARAM -162	HC:171\n(Length 30"Inches)	1080.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 11:57:22.217	2026-01-10 08:33:07.675	f
cmiwr3b390001ju043i5r1sh0	CZ ARAVANKI PREMIUM QUALITY 	CZ ARAVANKI-121	HC:133	870.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:08:33.765	2025-12-08 06:08:33.765	f
cmiwzqfrr001jk304q39bea37	CZ BRACELET PREMIUM QUALITY 	BRACELET -44	HC:	360.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:10:29.847	2025-12-08 10:10:29.847	f
cmiybny3j0001jr048t2v3zqh	JADAU KUNDAN BLACK BEADS 18"INCHES 	CZ BLACK BEADS-54	HC:	420.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:32:15.199	2025-12-09 08:32:15.199	f
cmizl9dv80001js04clbbr0jx	CZ BLACK BITS PREMIUM QUALITY 	BLACK BEAT-40	HC:45\n(Colours Available)\n(Length 18"Inches)	360.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765345448433", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 05:48:38.133	2025-12-10 05:48:38.133	f
cmizvxnua0001jr04j6a2c058	CZ BANGLES 	CZ BANGLES-103	HC:	780.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765363682011", "name": "2.4", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:47:26.962	2025-12-10 10:48:04.026	f
cmizyg0ta0001jo04c2s6uqgt	CZ PREMIUM BANGLES PREMIUM QUALITY 	CZ BANGLES -92	HC:	630.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765367778080", "name": "2.4+ 2.10", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:57:42.814	2025-12-10 11:57:42.814	f
cmj19mh87000bjr04h6jcglw5	CZ NECKLACE PREMIUM QUALITY 	CZ NECK -272	HC:285\n(Colours Available) \n	1730.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765447073761", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:58:25.976	2025-12-11 10:47:24.653	f
cmj2tghea000ele04orwgqrfg	CHANDRAHARAM WITH LOCKET PREMIUM QUALITY 	STEP HARAM -162#2	HC:171\n(Colours Available)\n(Length 30" Inches 	1080.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[{"id": "1765540795828", "name": "Maroon & Green ", "value": ".", "priceAdjustment": 0}]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:01:24.754	2025-12-12 12:02:23.812	f
cmj6uqw3r000mi804n2xdqxeq	COMBOSET PREMIUM QUALITY 	COMBOSET -724	HC:760	4450.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:48:34.695	2025-12-15 07:48:34.695	f
cmj85jyca0001jm04xw0av2n4	CZ COMBOSET PREMIUM QUALITY 	CZ COMBOSET -344	HC:378	2240.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 05:38:52.954	2025-12-16 05:38:52.954	f
cmj8b6gbp0001jo04k30qq3zd	CZ VICTORIYA COMBOSET PREMIUM QUALITY 	CZ VICT HARAMSET-385	HC:424	2495.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 08:16:20.773	2025-12-16 08:16:20.773	f
cmj9uh1hd0001jy04ytx5usc8	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-308	HC:324	1950.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 10:04:13.633	2025-12-17 10:04:13.633	f
cmjb4yohw0006kw04kz54xrgm	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-177	HC:	1289.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:45:38.948	2025-12-18 07:45:38.948	f
cmjb6zpph0001l104k8y1d14a	C JUMKA PREMIUM QUALITY 	CZ JUMKA-94	HC:	850.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:42:26.405	2025-12-18 08:44:21.075	f
cmjci5nm90001jv04gu4fy4f3	VICTORIA JUMKA PREMIUM QUALITY 	VICT JUMKA-180	HC:	1230.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:42:45.585	2025-12-19 06:42:45.585	f
cmjguqogl0008jo04zc0einko	5 STEPS CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM-65	HC:69	499.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:46:06.55	2025-12-22 07:46:06.55	f
cmji8jdpw000bkz04pmmgnx1y	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-274	HC:288	1750.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:00:06.837	2025-12-23 07:00:06.837	f
cmjjrjb830009l704cnuetku9	CZ BANGLES PREMIUM QUALITY 	BANGLES-58	HC:63\n(Sizes Available)	465.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766565498569", "name": "2.4 +2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:39:42.483	2025-12-24 08:39:42.483	f
cmjjyizmp0001l304dcxortjl	SUN MOON PREMIUM QUALITY 	SUN MOON-42	HC:45	350.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:55:24.77	2025-12-24 11:55:24.77	f
cmjl3o8rm0001kz0467mz3iva	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-112	HC:121	879.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:07:14.146	2025-12-25 07:07:14.146	f
cmjnwd3hy0001jj04k1z9fj65	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-27#1	HC:31	310.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:05:55.319	2025-12-27 06:05:55.319	f
cmjnyah6f0001l804h7gczuzj	GJ STUDS PREMIUM QUALITY 	GJ STUDS-58#1	HC:	470.00	Ear studs	cmih992ry0001la04z66nrpok	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:59:52.311	2025-12-27 06:59:52.311	f
cmjl4sp46000hks046gcg5fy0	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-148	HC:	1100.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:38:41.574	2025-12-25 08:03:37.318	f
cmjmiiv9k0006jr04vbtcud68	CZ JADA PREMIUM QUALITY 	CZ JADA -85	HC:90	630.00	Jada set	cmhgkox8n0003ib0427athu89	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-26 06:50:43.785	2025-12-26 06:56:45.014	f
cmjo14s840001l404qx6aoqy3	PANCHALOHAM NECKLACE 	NECKLACE-180#1	HC:189	1170.00	PANCHALOHAM NECKLACE	cmjo0ynz8000al704riezevpo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:19:25.541	2025-12-27 08:19:25.541	f
cmjo1p332000kl704i56n349y	CZ HARAM PREMIUM QUALITY 	CZ HARAM-600	HC:630	3690.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:35:12.735	2025-12-27 08:35:12.735	f
cmjqtsvjs000ijy04vsk72cez	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-85#2	HC:90\n(Sizes Available)	625.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:17:31.192	2025-12-29 07:17:31.192	f
cmjqu0how000bl4044wnewdsd	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-45#3	HC:49\n(Sizes Available)	380.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:23:26.48	2025-12-29 07:23:26.48	f
cmji9a8090009kz04e15uul13	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-308	HC:324	1950.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:20:59.146	2026-01-10 05:53:00.465	f
cmiwr6k100001l8047lqcob8f	CZ PREMIUM QUALITY ARAVANKI 	VANKI-216	HC-227	1399.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:11:05.316	2025-12-08 06:11:05.316	f
cmiwzsei5000ykz04dc9yp1ud	CZ BRACELET PREMIUM QUALITY 	CZ BRACELET -38	HC:42	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:12:01.517	2025-12-08 10:51:29.446	f
cmiybqhqg000bl804xk6za6wh	CZ BLACK BEADS 18" INCHES 	CZ YMS -22	HC:27	260.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:34:13.96	2025-12-09 08:34:13.96	f
cmizli28b000dic046ptld805	AD BLACK BITS PREMIUM QUALITY 	YMS-33#1	HC:38\n(Colours Available)\n(Length 18"Inches)	335.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765345908585", "name": "Ruby+Purple+Multi+Black+Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 05:55:22.955	2025-12-10 05:55:22.955	f
cmizwfoqs0001l804clgfaweq	1 GRAM BANGLES 	1 GRAM BANGLES -87	HC:\n(Sizes Available)	585.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765364128606", "name": "2.4+2.6+2.8", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:01:27.94	2025-12-10 11:01:27.94	f
cmizyj7xm000hl804cbre8kus	CZ PREMIUM QUALITY NECKLACE 	BNGL-96	HC:101	690.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765367943045", "name": "2.4+2.10", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 12:00:12.011	2025-12-10 12:00:12.011	f
cmj19y2ak0001ld04knippgnd	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-168	HC:\n(Colours Available) 	1120.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765447586601", "name": "Wine & Purple ", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 10:07:26.493	2025-12-11 10:07:26.493	f
cmj2ts2ok000wle04q0w233jj	CZ MATTE PREMIUM QUALITY 	CZ MATTE -27	HC:31	299.00	Matti	cmirh03xp0001l104sjizl4v4	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:10:25.556	2025-12-12 12:11:20.656	f
cmj85ncv40009jm04kq8ayci2	CZ COMBOSET PREMIUM QUALITY 	CZ MAT HARAMSET -220	HC:242	1480.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 05:41:31.745	2025-12-16 05:41:31.745	f
cmjl50ck1000vks04rg1ovash	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-161#2	HC:	1170.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:44:38.546	2025-12-25 07:44:38.546	f
cmj9tcu400001l104aoig665o	 GJ NECKLACE PREMIUM QUALITY 	CZ NECKLACE-123	HC:130\n(Colours Available)	850.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765963880627", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:32:57.84	2025-12-17 09:55:03.174	f
cmj9umqxa0001jv04xceoc81e	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-247	HC:260	1660.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 10:08:39.886	2025-12-17 10:08:39.886	f
cmjb50jw50001jm04f6cnvdsw	MAT JUMKA PREMIUM QUALITY 	MAT JUMKA-105	HC:	720.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:47:06.294	2025-12-18 07:47:06.294	f
cmjb71ho70001l504nvv08pp6	CZ JUMKA PREMIUM QUALITY 	JUMKA-38	HC:	350.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:43:49.303	2025-12-18 08:43:49.303	f
cmjci8gcb0001js04vyuwhdxd	GJ JUMKA PREMIUM QUALITY 	GJ Y JUMKA-126	HC:	895.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:44:56.123	2025-12-19 06:44:56.123	f
cmjgut89o0001jl04372iqmgm	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM-65#1	HC:69	499.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:48:05.533	2025-12-22 07:48:05.533	f
cmji8q43s0001jv048iw3reac	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-229	HC:240	1480.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:05:20.968	2025-12-23 07:05:20.968	f
cmjjocom20001kt04c4pbtpqr	MAT NECKLACE PREMIUM QUALITY 	NECKLACE-207	HC:218\n(Colours Available)	1350.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[{"id": "1766560074145", "name": "Green & Maroon ", "value": ".", "priceAdjustment": 0}]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 07:10:34.395	2025-12-24 07:10:34.395	f
cmjjrm68n0001jj042pr45n9h	CZ BANGLES PREMIUM QUALITY 	BANGLES-65	HC:69\n(Sizes Available)	499.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766565641692", "name": "2.4 +2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:41:55.991	2025-12-24 08:41:55.991	f
cmjjylfci0009l404l02xkl3g	SUN MOON PREMIUM QUALITY 	SUN MOON-56	HC:60	440.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:57:18.45	2025-12-24 11:57:18.45	f
cmj6uws0e0009ky04tg1otue3	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM -229	HC:399	2459.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:53:09.326	2026-01-10 08:36:00.369	f
cmjl3v40v000ejo04b7v1gehs	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-163	HC:173	1190.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:12:34.591	2025-12-25 07:12:34.591	f
cmjmioopy0001jp04uepyzj84	CZ JADA PREMIUM QUALITY 	CZ JADA-112	HC:119	780.00	Jada set	cmhgkox8n0003ib0427athu89	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-26 06:55:15.239	2025-12-26 06:55:15.239	f
cmjnwfmvz0001jo04ogxtrvvu	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-31#2	HC:35	330.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:07:53.76	2025-12-27 06:07:53.76	f
cmjnybz7g0001l7044288boh8	GJ STUDS PREMIUM QUALITY 	GJ STUDS-54	HC:	440.00	Ear studs	cmih992ry0001la04z66nrpok	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 07:01:02.332	2025-12-27 07:01:02.332	f
cmjo16lci0001l804ey5o6504	PANCHALOHAM NECKLACE 	NECKLACE-180#2	HC:189	1170.00	PANCHALOHAM NECKLACE	cmjo0ynz8000al704riezevpo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:20:49.938	2025-12-27 08:20:49.938	f
cmjqtve5g0001l704mvsttaeq	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-85#3	HC:90\n(Sizes Available)	625.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:19:28.612	2025-12-29 07:19:28.612	f
cmjjqt6ji0001jy04txetgjky	PANCHALOHAM BANGLES PREMIUM QUALITY 	BANGLES-126	HC:132\n(Sizes Available)\n	859.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766564299818", "name": "2.4+2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:19:23.359	2026-01-07 06:53:57.375	f
cmjtnejxj0002jr04xo079ktw	MAT CHOKER	CHOKER-544	HC:573	3350.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:41:43.783	2025-12-31 06:41:43.783	f
cmiwr8o4y0009l704h5d4ktoj	CZ PREMIUM QUALITY VANKI 	VANKI-189	HC:198	1230.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:12:43.954	2025-12-08 06:12:43.954	f
cmjjyor2e000cjv04ijacfhav	SUN MOON PREMIUM QUALITY 	SUN MOON-33#1	HC:38	330.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:59:53.606	2025-12-24 11:59:53.606	f
cmiwzzqpt001rk304jay476nb	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -116	HC:128	830.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:17:43.937	2025-12-08 10:43:20.753	f
cmiybyvw6000jl804usz052ug	ROSE GOLD BLACK BITS PREMIUM QUALITY 	YMS-17	HC:20\nLength 18"Inches 	240.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:40:45.559	2025-12-09 08:47:59.358	f
cmizluoa80001jm04rbxxydn5	BLACK BITS PREMIUM QUALITY 	YMS-29	HC:33\n(Colours Available)\n(Length 18"Inches)	299.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765346502851", "name": "Ruby+Purple+Multi+Black+Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 06:05:11.408	2025-12-10 06:05:11.408	f
cmizwkd3m0001jp0466f99oue	1 GRAM BANGLES PREMIUM QUALITY 	1GRAM BANGLES -49	HC:\n(Sizes Available)	420.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765364606301", "name": "2.4+2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:05:06.13	2025-12-10 11:05:06.13	f
cmizz6bo20001jy04fhjeap5n	CZ BANGLES PREMIUM QUALITY 	CZ BANGLES -72	HC:\n	499.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765368951060", "name": "2.4+2.8", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 12:18:09.938	2025-12-10 12:18:09.938	f
cmj1a3gap000vl504g82yuqhm	CZ NECKLACE PREMIUM QUALITY 	CZ NECKLACE -191	HC:\n(Colours Available) 	1260.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765447725117", "name": "Ruby & Purple & Green", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 10:11:37.921	2025-12-11 10:11:37.921	f
cmj2tvupf000zjr044k5yfw8d	CZ MATTE PREMIUM QUALITY 	CZ M MATTE-27	HC:31	299.00	Matti	cmirh03xp0001l104sjizl4v4	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:13:21.843	2025-12-12 12:13:21.843	f
cmj2txzwb0017jr04ius0xa0j	CZ MATTE PREMIUM QUALITY 	CZ M MATTE-27#1	HC:31	299.00	Matti	cmirh03xp0001l104sjizl4v4	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:15:01.884	2025-12-12 12:15:01.884	f
cmj6v549t000hky04e3anafiy	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM NECKLACE -618	HC:650	3960.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:59:38.465	2025-12-15 07:59:38.465	f
cmj86mvz40002l8045xsn6tr0	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM-713	HC:786	4520.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 06:09:09.473	2025-12-16 06:09:09.473	f
cmj9tgrr20007l804x8t834jb	GJ NECKLACE PREMIUM QUALITY 	CZ NECKLACE-123#1	HC:130\n(Colours Available)	850.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765964051619", "name": "Green & Ruby", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:36:01.406	2025-12-17 09:58:26.104	f
cmjb2kh5q0001jr04ck2wo6p6	CZ JUMKA PREMIUM QUALITY 	JUMKA-65	HC:72	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 06:38:37.023	2025-12-18 06:38:37.023	f
cmjb531om0001js04yhfbfi2h	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-58	HC:	470.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:49:02.663	2025-12-18 07:49:02.663	f
cmjb74dlr0007ky04ixslh5d8	CZ JUMKA PREMIUM QUALITY 	CJ JUMKA-51	HC:	400.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:46:04	2025-12-18 08:46:04	f
cmjcial900006ib04melolbmn	GOLD JUMKA PREMIUM QUALITY 	YGH-24	HC:	270.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:46:35.796	2025-12-19 06:46:35.796	f
cmjguwa7u000gjo04d4sks137	3 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM-60	HC:65	499.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:50:28.026	2025-12-22 07:50:28.026	f
cmji8u2lo000jkz04kez1f8j3	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-456	HC:479	2810.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:08:25.645	2025-12-23 07:08:25.645	f
cmjjxtxxj0001jv04blmym7ir	SUN MOON PREMIUM QUALITY 	SUN MOON -60	HC:65	470.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:35:56.167	2025-12-24 11:47:55.473	f
cmjl3yxf00009kz044vwup59a	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-154	HC:	1140.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:15:32.652	2025-12-25 07:15:32.652	f
cmjl55oag0001jw04ubz2icjn	CZ BALAJI LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-145	HC:156	1100.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:48:47.031	2025-12-25 07:48:47.031	f
cmjmisu7v000ejr04xb7t80g0	CZ JADA PREMIUM QUALITY 	CZ JADA-80	HC:85	600.00	Jada set	cmhgkox8n0003ib0427athu89	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-26 06:58:28.987	2025-12-26 06:58:28.987	f
cmjnwhh8x0001ih041v4hjait	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-31	HC:35	330.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:09:19.761	2025-12-27 06:09:19.761	f
cmjnydvs60001lb04mes6ro5n	CZ STUDS PREMIUM QUALITY 	CZ STUDS-35	HC:	290.00	Ear studs	cmih992ry0001la04z66nrpok	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 07:02:31.206	2025-12-27 07:02:31.206	f
cmjo1a1wb0009l4040mfi7fss	PANCHALOHAM NECKLACE 	CZ NECKLACE-189	HC:208	1290.00	PANCHALOHAM NECKLACE	cmjo0ynz8000al704riezevpo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:23:31.355	2025-12-27 08:23:31.355	f
cmhrttccq0001ld049y0fc2w1	Cz primium stone nackles.	Cz neck -234	Hc - 245	1500.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1762699423938", "name": "Purple+Ruby colour available ", "value": ".", "priceAdjustment": 0}]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-09 14:46:14.474	2026-01-08 13:06:54.998	f
cmjjohbkw0001l504rc7agsdj	MAT NECKLACE PREMIUM QUALITY 	NECK-211	HC:222\n(Colours Available)	1440.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[{"id": "1766560354654", "name": "Green & Maroon & Purple", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 07:14:10.784	2026-01-08 10:51:31.948	f
cmiwrdseo0001jv04g2wk6x0h	CZ PREMIUM QUALITY VANKI 	VANKI-213#1	HC:225	1390.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:16:42.769	2025-12-08 06:16:42.769	f
cmjguyc010001i104y5e30pcr	3 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM -60	HC:65	499.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:52:03.649	2025-12-22 07:52:03.649	f
cmji8wpen0001kz04pigbmiwn	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-456#1	HC:479	2810.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:10:28.511	2025-12-23 07:10:28.511	f
cmjjomnny0001kt04ujxkszyo	CHAIN NECKLACE PREMIUM QUALITY 	NECKLACE-98	HC:117\n(Colours Available)	780.00	Chain Necklace	cmih9kzf70001i904tu7iuf6z	[{"id": "1766560572329", "name": "Ruby & Purple", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 07:18:19.726	2025-12-24 07:18:19.726	f
cmix02qmx0016kz04lva4zr9i	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172	HC:189\n(8" INCHES)	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:20:03.801	2025-12-08 10:58:29.755	f
cmjjr18750009jy04sn7kd4vz	PANCHALOHAM BANGLES PREMIUM QUALITY 	BANGLES-76	HC:80\n(Sizes Available)	580.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766564651567", "name": "2.4 +2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:25:38.754	2025-12-24 08:25:38.754	f
cmjjy34gs0001i204jpoc69uf	SUN MOON PREMIUM QUALITY 	SUN MOON-44	HC:49	380.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:43:04.54	2025-12-24 11:43:04.54	f
cmix05oej001ekz04vfvrlrt2	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172#1	HC:189\n(8"INCHES) 	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:22:20.875	2025-12-08 10:59:51.339	f
cmiyc6tsj0009jr04qxccoypf	ROSE GOLD BLACK BITS PREMIUM QUALITY 	YMS-20	HC:29\nLength 18"Inches 	270.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:46:56.084	2025-12-09 08:46:56.084	f
cmiycb0rs000njr04p1oejn2e	ROSE GOLD BLACK BITS PREMIUM QUALITY 	YMS-20#1	HC:24\nLength 18"Inches 	260.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:50:11.752	2025-12-09 08:50:11.752	f
cmiztw6fm0001jx045mgbe7wn	CZ KADA BANGLE PREMIUM QUALITY 	CZ KADA BANGLE -96	HC:96\n(Colours Available)	690.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765359972916", "name": "2.6+2.8+2.10 Sizes Available ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 09:50:18.514	2025-12-10 09:50:18.514	f
cmizwn0h20001jx04k66s77b1	1GRAM BANGLES PREMIUM QUALITY 	1GRAM BANGLES -42	HC:\n(Sizes Available)	380.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765364751323", "name": "2.4+2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:07:09.734	2025-12-10 11:07:09.734	f
cmizz95mn0001kt04j7ym20k6	CZ PREMIUM QUALITY BANGLES 	4BNGL-72	HC:76	540.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765369155884", "name": "2.4+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 12:20:22.08	2025-12-10 13:25:14.828	f
cmj2ucdzm0014le04asenjpco	FANCY MALA WITH CZ LOCKET 	FANCY MALA CZ LOCKET -121	HC:121\nLocket -58 + Mala -63\n	780.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:26:13.33	2025-12-12 12:26:13.33	f
cmj6va9wq0009le04clsahelh	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM NECKLACE -1070	HC:1127	6580.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:03:39.05	2025-12-15 08:03:39.05	f
cmj87g5vm0001ky04ifsqjak2	CZ COBOSET PREMIUM QUALITY 	CZ HARAM NECK-624	HC:656	3930.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 06:31:55.33	2025-12-16 06:31:55.33	f
cmjjyzc7f0001kz04iotkptss	SUN MOON PREMIUM QUALITY 	SUN MOON -40	HC:45	360.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 12:08:07.563	2025-12-24 12:08:07.563	f
cmj9tl56y0001l4043enqfgt8	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-225	HC:236\n(Colours Available)	1440.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765964217613", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:39:25.45	2025-12-17 10:17:10.615	f
cmjb2mkka0001jo04vzmqwjsm	MAT JUMKA PREMIUM QUALITY 	JUMKA-60	HC:65	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 06:40:14.746	2025-12-18 06:40:14.746	f
cmjb5577u000ekw04kt9440e5	CZ MAT JUMKA PREMIUM QUALITY 	CZ MAT JUMKA-92	HC:	650.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:50:43.147	2025-12-18 07:50:43.147	f
cmjcicjjb0009l204h9m5o69t	GOLD JUMKA PREMIUM QUALITY 	YGH-24#1	HC:	270.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:48:06.887	2025-12-19 06:48:06.887	f
cmjl473mp0001ks043muuh9ce	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-154#1	HC:	1140.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:21:53.953	2025-12-25 07:27:11.404	f
cmjl58w7s0001jl044y2irpcv	CZ PULIGORU LOCKET MOTHI MALA PREMIUM QUALITY 	CZ LOCKET MOTHI MALA-154#3	HC:	1140.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-25 07:51:17.272	2025-12-25 07:51:17.272	f
cmjnx3rb90003jz04imm7k71j	CZ TIKKA PREMIUM QUALITY 	CZ TIKKA-33	HC:36	330.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 06:26:39.237	2025-12-27 06:26:39.237	f
cmjnyffgm000njj049w7ulrhe	CZ STUDS PREMIUM QUALITY 	CZ STUDS-72	HC:78	560.00	Ear studs	cmih992ry0001la04z66nrpok	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 07:03:43.366	2025-12-27 07:03:43.366	f
cmjo1cdsr000cl7042ijbpvrc	PANCHALOHAM NECKLACE 	NECKLACE-180#3	HC:189	1170.00	PANCHALOHAM NECKLACE	cmjo0ynz8000al704riezevpo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-27 08:25:20.091	2025-12-27 08:25:20.091	f
cmjb77yps0006la04eda0b4zl	JADAU KUNDAN JUMKA PREMIUM QUALITY 	JUMKA-263	HC:276	1665.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:48:51.328	2026-01-02 12:28:04.28	f
cmj1a6hnz000jjv04upgyxsfc	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-162	HC:171\n	1100.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765447995037", "name": "Multi Colour ", "value": ".", "priceAdjustment": 0}]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 10:13:59.664	2026-01-07 14:31:37.401	f
cmjmj4jkx000mjr04jmtfcny9	CZ JADA PREMIUM QUALITY 	CZ JADA-85	HC:90	630.00	Jada set	cmhgkox8n0003ib0427athu89	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-26 07:07:35.074	2026-01-10 05:53:00.409	f
cmj10cv2s0001js04cg935auv	EAR CHAIN SET PREMIUM QUALITY 	EAR CHAIN-80	HC:85\n(Colours Available)	600.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[{"id": "1765431278235", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 05:39:00.82	2025-12-11 05:39:00.82	f
cmiztyxg90001jo04ikrn1bt4	CZ MAT BANGLES PREMIUM QUALITY 	CZ MAT BANGLES-80	HC:	630.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765360660107", "name": "2.4+2.6+2.8+2.10 Sizes ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 09:52:26.841	2025-12-10 10:13:54.232	f
cmix074qv001mkz04rx4o0i64	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172#2	HC:189\n(8"INCHES)	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:23:28.712	2025-12-08 11:02:32	f
cmizwque40009jp04cskdtic3	1GRAM BANGLES PREMIUM QUALITY 	1GRAM BANGLES -49#1	HC:\n(Sizes Available)	420.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765364877950", "name": "2.4+2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:10:08.477	2025-12-10 11:10:08.477	f
cmiwz42300001k304nsrt2pe6	CZ BRACELET PREMIUM QUALITY 	BRACELET -29	HC:33\n(COLOURS AVAILABLE) 	299.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[{"id": "1765187429095", "name": "PURPLE & GREEN ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 09:53:05.676	2025-12-08 11:01:16.407	f
cmiycd4jw0001jy04ekrzjdwt	ROSE GOLD BLACK BITS PREMIUM QUALITY 	YMS-33	HC:38\n(Length 18"Inches)	335.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:51:49.964	2025-12-09 12:35:57.76	f
cmj1b808d0001l504fmwrvone	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-229	HC:\n(Multi Colour) 	1460.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 10:43:09.997	2025-12-11 10:43:09.997	f
cmhw45tcc0001ky04da5cfdhr	Open type kada bangles.	Bangles - 103	Hc-108	760.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1762958727657", "name": "Multi colour ", "value": "2.4+ 2.6 + 2.8 open type ", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-12 14:46:57.228	2025-11-12 14:46:57.228	f
cmhw4dww30009ky04aqtl5fvv	Matt primium bangles.	Bangles-78	Hc - 83	580.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1762958918633", "name": "Multi colour ", "value": "2.4+2.6+2.8+2.10 sizes available ", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-12 14:53:15.076	2025-11-12 14:53:15.076	f
cmhw4k6t60001l804sulob08s	Matt primium bangles 	Bangles - 78	Hc-83	580.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1762959448878", "name": "4.4+2.6+2.8+2.10 sizes available ", "value": "Multi colour.", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-12 14:58:07.866	2025-11-12 14:58:07.866	f
cmhw4wdaa0001js04f8p4tdkv	Nakshi premium nackles.	$nacklace-189	Hc - 204	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[{"id": "1762959982323", "name": "Gold+multi+green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-12 15:07:36.131	2025-11-12 15:07:36.131	f
cmi1u408k0001ic047aflz7jh	1gram bangles gold replica.	Bangles - 85	Hc - 90	625.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763304710353", "name": "2.8 + 2.6 + 2.4 size available.", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 14:52:13.748	2025-11-16 14:52:13.748	f
cmj2ulioj001cle04pkvi7iot	CZ KASULA HARAM SET PREMIUM QUALITY BANGLES 	CZ HARAM -328	HC:346\n(Colours Available)	2070.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[{"id": "1765542735876", "name": "Gold & Green Beads ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:33:19.316	2025-12-12 12:33:19.316	f
cmi1ufx2g0002lb04x48gewsg	1 gram bangles primiam quality.	Bangles - 80	Hc-87	600.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763305206925", "name": "2.8+2.6+2.4 sizes available ", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:01:29.513	2025-11-16 15:01:29.513	f
cmi1uokeh000nk004nxb2d6n7	1 gram bangles primiam quality.	Banglse - 67	Hc - 67	485.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763305447972", "name": "2.8+2.6+2.4 size available ", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:08:13.001	2025-11-16 15:08:13.001	f
cmi1ur4uy0001ju04q2ovbxwi	1 gram bangles primiam quality.	Banglse - 85	Hc - 90	625.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763305744794", "name": "2.8+2.6+2.4 size available ", "value": "Multi colour ", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:10:12.826	2025-11-16 15:10:12.826	f
cmi1vd9lo0009kt04fst16ysj	1 gram bangles primiam quality 	Bangles -  78	Hc - 83	580.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763306761127", "name": "2.8+2.6+2.4 size available ", "value": "Multi colour ", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:27:25.404	2025-11-16 15:27:25.404	f
cmi1vidr2000hkt047gujnpms	Cz primium stone nackles 	Nackles - 216	Hc - 227	1399.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1763307011472", "name": "Purple green Ruby colours available ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:31:24.063	2025-11-16 15:31:24.063	f
cmi47xle90001la04z1mwqsi0	CZ PREMIUM QUALITY  BELT 	CZ BELT-265	HC-279	1730.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-18 06:54:41.554	2025-11-18 06:54:41.554	f
cmi48e4c10001l8048gwzbiub	CZ FANCY MALA	CZ HARAM-591	HC-621\nRuby-3, Green-1	3620.00	Fancy mala	cmi46y9du0001l204herkdh6w	[{"id": "1763449486516", "name": "Ruby colour , Green Colour ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-18 07:07:32.594	2025-11-28 08:50:06.775	f
cmi1vpqki000vk0045nskax3p	 Matt primium nackles 	Nackles - 252	Hc- 265	1590.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:37:07.266	2026-01-07 14:29:18.641	f
cmi487pzv0001l804wayq6n7r	CZ PREMIUM QUALITY HARAM 	CZ HARAM -321	HC/337	2090.00	KASULA HARAM	cmho3fsxp0001ju04hzwllaw8	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-18 07:02:34.075	2026-01-03 13:20:10.024	f
cmj6vk8xw000pky041vsf1x2k	CZ COMBOSET PREMIUM QUALITY 	HARAM NECKLACE -582	HC:611	3660.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:11:24.356	2026-01-07 14:34:55.519	f
cmi72fj250001jx04towkqnah	Guaranty chain 24 Inch.	Chain - 45	Hc - 50	400.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 06:43:59.165	2025-11-20 06:43:59.165	f
cmi72rzan0001jp040aayssub	Guaranty Chain 24 Inches 	Chain-45	HC-50	400.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 06:53:40.079	2025-11-20 06:53:40.079	f
cmi7333sv0009jp04bxladepn	Guaranty Chain 24 Inches	Chain-60	HC-67	495.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 07:02:19.135	2025-11-20 07:02:19.135	f
cmi739l1a0009jx0429tvqdd1	Guaranty Chain 24 inches 	Chain-33	HC-36	320.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 07:07:21.406	2025-11-20 07:07:21.406	f
cmi73dj980001la04lzwfpygx	Guaranty Chain 24 Inches	Chain-39	HC-42	355.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 07:10:25.724	2025-11-20 07:10:25.724	f
cmi73gvzf000hjx04yuq8oroi	Guaranty Chain 24 Inches	Chain-45#1	HC-50	400.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 07:13:02.187	2025-11-20 07:13:02.187	f
cmi73kz9l000hjp04kequg87i	Guaranty Chain 24 Inches	Chain-22	HC-24	260.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-20 07:16:13.065	2025-11-20 07:16:13.065	f
cmizx15si000hjp04e3vnraq4	GJ BANGLES PREMIUM QUALITY 	GJ BANGLES -189	HC:\n(Sizes Available)	1280.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765365171679", "name": "2.4+2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:18:09.811	2025-12-10 11:18:09.811	f
cmj10x6rc000bjs04aeppqojw	CZ NECKLACE PREMIUM QUALITY 	CZ NECKLACE-158	HC:175\n(Colours Available)	1095.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765432095626", "name": "Purple + Green + Red", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 05:54:49.081	2025-12-11 05:54:49.081	f
cmj1bbg0u000fld04cg7wnjlh	CZ NECKLACE PREMIUM QUALITY 	CZ NECKLACE -173	HC:190\n 	1185.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 10:45:50.43	2025-12-11 10:45:50.43	f
cmj2v1kr70001l104133vk53b	KASULA NECKLACE SET PREMIUM QUALITY 	NECKLACE -108	HC:114	760.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:45:48.499	2025-12-12 12:45:48.499	f
cmiwz98gb0001jm045m47oner	CZ BRACELET PREMIUM QUALITY 	BRACELET -9	HC:11\n(Designs Available)	195.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[{"id": "1765187716880", "name": " THREE DESIGNS AVAILABLE ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 09:57:07.211	2025-12-08 11:04:03.497	f
cmix08py8001zk3040tju9n99	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172#3	HC:189\n(8"INCHES)	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:24:42.848	2025-12-08 11:05:32.457	f
cmiyg1b1i0001lb04kep83ftw	CZ BLACK BEADS 24" INCHES 	BLACK BEAT-139	HC:146\n(LENGTH:24"INCHES)	940.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 10:34:36.966	2025-12-09 13:32:13.843	f
cmizu3lom0009jx04kjzpty2b	CZ BANGLE PREMIUM QUALITY 	CZ BANGLES-105	HC:	699.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765360547113", "name": "2.4 Size ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 09:56:04.871	2025-12-10 09:56:04.871	f
cmj6vt1ae000ui804tlf8ndq1	CZ VICTORIAN COMBO SET PREMIUM QUALITY 	CZ VICT HARAMSET -830	HC:913\n(Colours Available)	5230.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[{"id": "1765786535787", "name": "Sea Green & Bottle Green ", "value": ".", "priceAdjustment": 0}]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:18:14.343	2025-12-16 05:44:18.945	f
cmj9to75u0002i8046rj4zmgs	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-225#2	HC:236\n(Colours Available)	1440.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[{"id": "1765964418191", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:41:47.97	2025-12-17 09:57:01.05	f
cmjb2pk4q0001jp04vdtipdxe	MAT JUMKA PREMIUM QUALITY 	MAT JUMKA-87	HC:96	630.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 06:42:34.154	2025-12-18 06:42:34.154	f
cmjb57ra00009jm04tryz3oju	CZ MAT JUMKA PREMIUM QUALITY 	CZ MAT JUMKA-116	HC:	830.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:52:42.457	2025-12-18 07:52:42.457	f
cmjb7anc70009l1042mi5f9rd	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-45	HC:	380.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:50:56.551	2025-12-18 08:50:56.551	f
cmiabdmj00001la04mnuo7g8p	Premium Quality Mop Chain 	SGC SI-BI-100	HC-110\n(LENGTH:24" INCHES)	740.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:17:45.42	2025-12-31 07:35:35.274	f
cmiabp5do000plb04qiw2ivv5	Premium Quality Mop Chain 	SGC SI-BI-104	HC-114\n(LENGTH:24"INCHES)	760.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	5	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:26:43.069	2025-12-31 07:35:02.718	f
cmiab98810009jo04nogdp3s3	Premium Quality Mop Chain 	SGC SI-BI-85	HC-94\n(LENGTH:24"INCHES)	650.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:14:20.257	2025-12-31 07:36:05.028	f
cmiabs5gv000hla04k03752ia	Premium Quality Mop Chain 	SGC SI-BI-116 	HC-128\n(LENGTH:24"INCHES)	850.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:29:03.151	2026-01-05 07:15:31.827	f
cmjcjj902000nl204rgjal6xl	GOLD CRYSTAL JUMKA 	JUMKA-24	HC:29	299.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:21:19.442	2026-01-02 12:26:22.761	f
cmiaap2g80001lb04h5kxpsvl	Premium Quality Mop Chain 	SGC-SI-BI-100#1	HC-110\n(Length:24" Inches)	740.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 12:58:39.657	2025-12-31 07:38:49.388	f
cmiaax6yd0009lb04sfuptdqf	Premium Quality Mop Chain 	SGC SI-BI-116	HC-128\n(LENGTH:24" INCHES)	850.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:04:58.741	2026-01-02 12:42:54.958	f
cmiabx58h000hjo04c81zhxbi	Premium Quality Mop Chain 	SGC SI-BI-101	HC-112\n(LENGTH:24" INCHES)	740.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:32:56.13	2026-01-05 07:16:19.094	f
cmj88e2k10001l204hbsanhfr	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM NECK-458	HC:482	2949.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 06:58:17.33	2026-01-07 14:37:03.629	f
cmjcgvm610001k10496673wsi	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-31	HC:	270.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:06:57.529	2025-12-19 06:06:57.529	f
cmix0a4ue000njm04nidnxrvw	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172#4	HC:189\n8" INCHES 	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:25:48.806	2025-12-08 10:39:09.18	f
cmiwzb0ei000bk304zhdiug18	CZ BRACELET PREMIUM QUALITY 	CZ BRACELET -42	HC:	380.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 09:58:30.09	2025-12-08 11:06:25.378	f
cmicunxfi000hjr048knaapyb	CZ PREMIUM QUALITY TIKKA 	CZ TIKKA-27#3	HC-31	310.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 07:53:11.167	2025-11-24 07:53:11.167	f
cmicupjqs000pjr042szvpmts	CZ PREMIUM QUALITY TIKKA 	CZ TIKKA-35	HC-40	360.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 07:54:26.74	2025-11-24 07:54:26.74	f
cmiyie0sz0001jv04v16u0haa	CZ BLACK BEADS 24"INCHES 	BLACK BEAT -83	HC:87\nLength:24"Inches 	630.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 11:40:29.459	2025-12-09 11:40:29.459	f
cmizu8ofk0007l804mg32hody	CZ KADA BANGLE PREMIUM QUALITY 	BANGLE -96	HC:	690.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765360736944", "name": "2.4 Size", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:00:01.712	2025-12-10 10:00:01.712	f
cmizx4kqs0001l204cdrveglc	CZ MAT BANGLES PREMIUM QUALITY 	CZ MAT BANGLES -87	HC:\n(Sizes Available)	740.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765365551954", "name": "2.4+2.8", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:20:49.157	2025-12-10 11:20:49.157	f
cmid3b8y10001ky041oqfpu1g	NAKSHI JUMKA PREMIUM QUALITY 	JUMKA-78#2	HC-81	580.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 11:55:16.106	2025-11-24 11:55:16.106	f
cmid3esrx0001ju04wlhv1k8c	MAT JUMKA PREMIUM QUALITY 	CZ JUMKA-56	HC-63	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 11:58:01.773	2025-11-24 11:58:01.773	f
cmid3qazo0009ld04qjijkzd2	CZ BANGLES PREMIUM QUALITY 	BANGLES -69	HC-74\nAVAILABLE SIZES:2.4,2.6,2.8,2.10	515.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 12:06:58.596	2025-11-24 12:06:58.596	f
cmid4meqz0001ju04ysxx0a96	THREE BIT LOCKET VADDANAM PREMIUM QUALITY 	VADDANAM-100	\nHC-137(BIG)	999.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[{"id": "1763986415217", "name": "Ruby, Bottle Green, Meroon, Purple,Pista Green", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 12:31:56.459	2025-11-24 12:31:56.459	f
cmj191q4j0001l504vqd4658n	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-171	HC:\n(Colours Available) 	1100.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765446030287", "name": "Purple & Green ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:42:17.732	2025-12-11 09:42:17.732	f
cmie5uwe30006l50492em2fvv	CZ PREMIUM QUALITY NECKLACE 	NECKLACE-285	HC:299\nCOLOURS AVAILABLE 	1800.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[{"id": "1764049819875", "name": "Ruby ,Green Colours", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-25 05:54:18.364	2025-11-25 05:54:18.364	f
cmj2ssgso0001jr042y4xkjyr	INVISIBLE CHAINS 	NECKLACE -33	HC:38	330.00	Invisible Chains	cmj2snjep0001le04djqr3fqd	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 11:42:44.232	2025-12-12 11:42:44.232	f
cmj2v7mw9001kle04r4x2fic4	KASULA COMBOSET PREMIUM QUALITY 	CZ HARAM NECKLACE -276	HC:267	1660.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:50:31.209	2025-12-12 12:50:31.209	f
cmie6g1e20001jg04v7j9fx1d	CZ PREMIUM QUALITY BANGLES	BANGLES-90	HC-99\nSIZES:2.4,2.6,2.8	670.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-25 06:10:44.618	2025-11-25 06:10:44.618	f
cmj6vwsxy0001jo04vftnlwuk	VICTORIAN COMBOSET PREMIUM QUALITY 	VICT HARAMSET-861	HC:948\n	5440.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:21:10.15	2025-12-15 08:21:52.481	f
cmieh2t1e0001l404chnd2ien	GOLD PREMIUM QUALITY CHOKER 	CHOKER-321	HC-337	1998.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-25 11:08:23.042	2025-11-25 11:08:23.042	f
cmiehg73m0001kz04fkg2pt90	CZ MAT PREMIUM QUALITY NECKLACE 	CZ MAT NECKLACE-441	HC-	2550.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-25 11:18:47.794	2025-11-25 11:18:47.794	f
cmifnxnl50001jr04om6aohjs	MAT JUMKA 	JUMKA-31	HC-36\nCOLOURS AVAILABLE 	330.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[{"id": "1764140799790", "name": "Ruby & Green Colours Available ", "value": ".", "priceAdjustment": 0}]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-26 07:08:06.185	2025-11-26 07:08:06.185	f
cmj9tsf5d000fl804eo9dw254	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-132#1	HC:139\n	900.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:45:04.945	2025-12-17 09:56:02.033	f
cmjb2roiq0004lb04figjb7r6	CZ JUMKA PREMIUM QUALITY 	JUMKA-51	HC:56	420.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 06:44:13.154	2025-12-18 06:44:13.154	f
cmjb5wx9s0001l504ptigsigx	VICTORIA JUMKA PREMIUM QUALITY 	VICT JUMKA-170	HC:	1080.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:12:16.625	2025-12-18 08:12:16.625	f
cmjcjlocx0001l2045wujllk2	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-44	HC:	390.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:23:12.657	2025-12-19 07:23:12.657	f
cmji8z610000rkz04dkma3mhh	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-400	HC:420	2479.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:12:23.364	2025-12-23 07:12:23.364	f
cmifmowbv0001jo046x81xk84	GJ. NECKLACE 	CZ CHOKER-378	HC-386	2290.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-26 06:33:17.995	2026-01-07 14:40:03.132	f
cmiehd01m0007jp0463lnwrb0	GOLD PREMIUM QUALITY CZ NECKLACE 	CZ NECK-301	HC-	1899.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-25 11:16:18.683	2026-01-07 14:40:25.106	f
cmjgv0mpt0009i104ahr75f1p	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM-76	HC:81	580.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:53:50.849	2026-01-10 08:31:48.447	f
cmj88hlye0001l8049hmqg0wx	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM NECK-458#1	HC:482	2949.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 07:01:02.438	2026-01-10 08:37:14.554	f
cmix0be9b0027k304rmgt8hdm	CZ BRACELET PREMIUM QUALITY 	CZ Y BRACELET -172#5	HC:189\n8"INCHES 	1170.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:26:47.664	2025-12-08 10:40:04.016	f
cmjb5yqv90001ie048y56x03m	CZ JUMKA PREMIUM QUALITY 	JUMKA-54	HC:	400.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:13:41.637	2025-12-18 08:13:41.637	f
cmiwzf0sd000jk304699r6vx8	CZ BRACELET PREMIUM QUALITY 	CZ BRACELET -42#1	HC:49\n(Designs Available)	380.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[{"id": "1765188011267", "name": "DESIGNS AVAILABLE ", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:01:37.213	2025-12-08 11:24:10.653	f
cmiyiivm20009jv04fkbv8tfl	CZ BLACK BEADS 24"INCHES 	BLACK BEAT-63	HC:67\n(Length:24"Inches)	499.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765280520438", "name": "Ruby & White ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 11:44:16.011	2025-12-09 11:44:16.011	f
cmizudvwt000fl804zkgwhway	CZ VICTORIAN BANGLES PREMIUM QUALITY 	CZ VIC BANGLES -144	HC:\n(Sizes Available) 	990.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765360979539", "name": "2.4+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:04:04.685	2025-12-10 10:04:04.685	f
cmih8h6mb0005jm04xhy1tu6q	CZ EAR CUFFS PREMIUM QUALITY 	CZ EAR COPS -114	HC-119	780.00	Earrcuffs	cmih2it88000fkz043nf8vfcc	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-27 09:30:55.811	2025-11-27 09:30:55.811	f
cmih8njmo0009ju04ptjq4y9k	CZ EAR CUFFS PREMIUM QUALITY 	CZ EAR COPS -128	HC-135	890.00	Earrcuffs	cmih2it88000fkz043nf8vfcc	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-27 09:35:52.609	2025-11-27 09:35:52.609	f
cmizxgz5x0009l2041cpwyird	GJ BANGLES PREMIUM QUALITY 	GJ BANGLES -87	HC:\n(Sizes Available)	670.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765366165974", "name": "2.4+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:30:27.717	2025-12-10 11:30:27.717	f
cmj1954vl0001jv04teoxuvj1	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-200	HC:\n(Colours Available)	1300.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765446198311", "name": "Ruby & Purple ", "value": ".", "priceAdjustment": 0}, {"id": "1765450168966", "name": "Ruby + Purple + Green ", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:44:56.817	2025-12-11 10:49:34.236	f
cmj2sxq540009jr04qy5th0wn	INVISIBLE CHAINS 	NECKLACE -22	HC:26\n(Colours Available)	270.00	Invisible Chains	cmj2snjep0001le04djqr3fqd	[{"id": "1765539962915", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 11:46:49.625	2025-12-12 11:46:49.625	f
cmj6w00av0013ky04dfgydq1a	CZ COMBOSET PREMIUM QUALITY 	CZ COMBOSET -859	HC:869	4985.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:23:39.655	2025-12-15 08:23:39.655	f
cmj893so70001l204mfe0rhfy	CZ VICTORIYA HARAM SET PREMIUM QUALITY 	CZ VICT HARAMSET-336	HC:370	2195.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 07:18:17.575	2025-12-16 07:18:17.575	f
cmj9tvjp60001js04fc0exm4p	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-270	HC:283	1710.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:47:30.81	2025-12-17 09:54:29.212	f
cmjb3xbpp0001ia04qlehfh60	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-135	HC:	899.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:16:36.11	2025-12-18 07:16:36.11	f
cmjcgxaiy0001ky041a89u8ep	CZ MAT JUMKA PREMIUM QUALITY 	CZ MAT JUMKA-79	HC:	600.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:08:15.754	2025-12-19 06:08:15.754	f
cmjcjnxsu0001la042uzt1mme	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-31#1	HC:	330.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:24:58.206	2025-12-19 07:24:58.206	f
cmjgv42ew0001jo04dlpbpcdm	5 STEP CHANDRA HARAM PREMIUM QUALITY 	5 STEP CHAIN-47	HC:53	420.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-22 07:56:31.16	2025-12-22 07:56:31.16	f
cmji91ueg0001kw0447gr2wq4	CZ CHAIN HIP BELT PREMIUM QUALITY 	CZ BELT-400#2	HC:420	2479.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-23 07:14:28.265	2025-12-23 07:14:28.265	f
cmjjook2t000bkt04wg6oqo5y	CHAIN NECKLACE PREMIUM QUALITY 	NECKLACE-189	HC:198	1260.00	Chain Necklace	cmih9kzf70001i904tu7iuf6z	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 07:19:48.389	2025-12-24 07:19:48.389	f
cmjjr9mvi0009js04c1sbrwcm	CZ PREMIUM BANGLES 	BANGLES-69	HC:74\n(Sizes Available)	515.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1766565047415", "name": "2.4 +2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:32:11.022	2025-12-24 08:32:11.022	f
cmjjy8c2b0001l704b20dbyhf	SUN MOON PREMIUM QUALITY 	SUN MOON-33	HC:38	330.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 11:47:07.667	2025-12-24 11:47:07.667	f
cmjjz3hao0009l3045y4nqoeq	SUN MOON PREMIUM QUALITY 	SUN MOON-33#2	HC:38	330.00	Sun & Moon	cmhgkplzd0005js04tn9fghob	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 12:11:20.784	2025-12-24 12:11:20.784	f
cmiisktss000bl7043pqltjee	JADAU HANGINGS	CHANDBALI-170	HC-180\nRUBY GREEN -2(P)\nRUBY WHITE -2(P)	1140.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[{"id": "1764329945362", "name": "Ruby white & Ruby Green ", "value": ".", "priceAdjustment": 0}]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 11:41:24.317	2025-11-28 11:41:24.317	f
cmj2vajzy001sle04w250t26w	CZ KASULA HARAM PREMIUM QUALITY 	CZ HARAM-168	HC:177	1100.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 12:52:47.423	2026-01-07 07:59:38.543	f
cmiit63qs000pk30475ax6dkn	JADAU HANGINGS	CZ HANGING -144	HC-153\n	980.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 11:57:56.98	2025-11-28 11:57:56.98	f
cmiitb0x3000ll704o1eilly9	JADAU HANGINGS	CZ HANGINGS-144	HC-153	980.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:01:46.6	2025-11-28 12:01:46.6	f
cmiitji7m0001l204s1sruv97	JADAU HANGINGS	CHANDBALI-60	HC-65	499.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:08:22.258	2025-11-28 12:08:22.258	f
cmiitpyob0017k304h418pgca	JADAU HANGINGS	CZ HANGING-60	HC-67\nRUBY-2(P)\nMULTI COLOUR-1(P)\n	499.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:13:23.532	2025-11-28 12:13:23.532	f
cmiituz7b0009l2047mmmeoys	JADAU HANGINGS	CHAND BALI-90	HC-96\nRUBY WHITE-3(P)\nRUBY GREEN -5(P)	670.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[{"id": "1764332130521", "name": "Ruby white & Ruby Green ", "value": ".", "priceAdjustment": 0}]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:17:17.495	2025-11-28 12:17:17.495	f
cmiiu09s3000jl204yl7q96ee	JADAU HANGINGS	CHANDBALI - 117	HC-126\nRUBY GREEN -2(P)\nRUBY WHITE -2(P)	850.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[{"id": "1764332348497", "name": "Ruby & White, Ruby & Green ", "value": ".", "priceAdjustment": 0}]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:21:24.484	2025-11-28 12:21:24.484	f
cmiwziexm000djm04zwwkc1lv	CZ BRACELET PREMIUM QUALITY 	BRACELET -99	HC:105\n(COLOURS AVAILABLE)	699.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[{"id": "1765188198096", "name": "Purple  & Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:04:15.514	2025-12-08 10:57:57.242	f
cmiiuj398001nk304lgcyp28n	NAKSHI MAT JUMKA 	JUMKA -72	HC-78	560.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:36:02.493	2025-11-28 12:36:02.493	f
cmiiune23000tl704qssmsije	NAKSHI MAT JUMKA 	JUMKA-92 	HC-99\nRUBY WHITE -2(P)\nWHITE GREEN -(P)	670.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:39:23.115	2025-11-28 12:39:23.115	f
cmiius6lo0011l7047q63s4gs	NAKSHI MAT JUMKA 	JUMKA-92#1	HC-99	670.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 12:43:06.732	2025-11-28 12:43:06.732	f
cmipl2wjj0002l704jpmj1n01	VICTORIA PREMIUM QUALITY VADDANAM 	VICT VADDANAM -589	HC-650	3750.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-03 05:45:53.983	2025-12-03 05:45:53.983	f
cmiyiq0s30001jx04mkjerrau	CZ BLACK BITS PREMIUM QUALITY 	CZ BLACK BEEDS-47	HC:51\nLength:24"Inches 	396.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 11:49:49.299	2025-12-09 11:49:49.299	f
cmiplrfn7000bl704uhs3n78s	PREMIUM QUALITY VADDANAM 	VADDANAM-555#1	HC-582	3460.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-03 06:04:58.483	2025-12-03 06:04:58.483	f
cmipmb3m30001ky04z2uftg3l	CZ ROTATABLE VADDANAM 	VADDANAM -648	HC-681	3960.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-03 06:20:16.012	2025-12-03 06:20:16.012	f
cmiposir30001l6044uzqkpgo	CZ MAT PREMIUM QUALITY VADDANAM 	CZ MAT VADDANAM-765#1	HC-843\nBIG SIZE 	4850.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-03 07:29:48.015	2025-12-03 07:29:48.015	f
cmizuhuum000hjx04fh6ii3zl	CZ MAT BANGLE PREMIUM QUALITY 	CZ MAT BANGLES-87	HC:\n(Colours Available)	740.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765361133249", "name": "2.4+2.8", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:07:09.934	2025-12-10 10:07:09.934	f
cmiyavsq40001js04rxyre88u	CZ BLACK BEADS 18"INCHES 	CZ YMS -51	HC:54\n(Colours Available)	400.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765267680082", "name": "Ruby& Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:10:21.868	2025-12-09 13:31:01.723	f
cmiyaw9n40005js045eszzoxy	CZ BLACK BEADS 18"INCHES 	CZ YMS -51#1	HC:54\n(Colours Available)	400.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765267680082", "name": "Ruby& Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:10:43.793	2025-12-09 13:39:34.855	f
cmishpz7t000hlb0479yzcqnq	GOLD REPLICA MAT PREMIUM QUALITY NECKLACE 	NECKLACE -153	HC:162	1370.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:35:10.601	2026-01-08 06:13:29.394	f
cmipqpccq000jjo04whqot3ry	3 BIT LOCKET VADDANAM 	3 BIT VADDANAM -204	HC-\n	1600.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-03 08:23:18.987	2025-12-03 08:23:18.987	f
cmirhhgcj0001l8048s0jo49d	CZ MATTE PREMIUM QUALITY 	CZ M MATTE-48	HC:54	420.00	Matti	cmirh03xp0001l104sjizl4v4	[]	9	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-04 13:40:46.723	2025-12-04 13:40:46.723	f
cmirhknju0001l504u25okyvu	CZ MATTE PREMIUM QUALITY 	CZ M MATTE-45	HC-51	400.00	Matti	cmirh03xp0001l104sjizl4v4	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-04 13:43:16.026	2025-12-04 13:43:16.026	f
cmirhovv80001ju04y00jjyvc	CZ MATTE PREMIUM QUALITY 	CZ M MATTE -38	HC-42	380.00	Matti	cmirh03xp0001l104sjizl4v4	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-04 13:46:33.428	2025-12-04 13:46:33.428	f
cmirhrgzq0009l804io77q2pd	CZ MATTE PREMIUM QUALITY 	CZ M MATTE -38#1	HC-42	380.00	Matti	cmirh03xp0001l104sjizl4v4	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-04 13:48:34.118	2025-12-04 13:48:34.118	f
cmirhtv7v0009l504c4hf4yti	CZ MATTE PREMIUM QUALITY 	CZ M MATTE -45	HC-51	400.00	Matti	cmirh03xp0001l104sjizl4v4	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-04 13:50:25.868	2025-12-04 13:50:25.868	f
cmish8x5i0001lb04u0ypbmr8	MAT PREMIUM QUALITY NECKLACE 	NECKLACE -297	HC:312	1890.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:21:54.774	2025-12-05 06:21:54.774	f
cmishbp2t0004ic04l963b5md	MAT PREMIUM QUALITY NECKLACE 	NECKLACE -605	HC:699	4050.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:24:04.278	2025-12-05 06:24:04.278	f
cmishe4760001lb04vuthkdy7	MAT PREMIUM QUALITY NECKLACE 	NECKLACE -429	HC-452	2650.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:25:57.186	2025-12-05 06:25:57.186	f
cmishn4cy000cic04hisgio7r	MAT PREMIUM QUALITY NECKLACE 	NECKLACE -213	HC:222	1370.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:32:57.299	2025-12-05 06:32:57.299	f
cmishssas000plb04vapzckqr	MAT JADAU NECKLACE PREMIUM QUALITY 	NECKLACE -231	HC:243	1480.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:37:21.604	2025-12-05 06:37:21.604	f
cmisi24mv000kic04bbue5xy8	JADAU KUNDAN NECKLACE PREMIUM QUALITY 	CZ NECK -226	HC:290	1770.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:44:37.496	2025-12-05 06:44:37.496	f
cmisi9p99000xlb04rdgcfo0b	MAT NECKLACE PREMIUM QUALITY 	NECKLACE -191	HC:202	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:50:30.814	2025-12-05 06:50:30.814	f
cmisidibs0001kz04gd5hydpt	MAT NECKLACE PREMIUM QUALITY 	NECKLACE -236	HC:249	1520.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:53:28.456	2025-12-05 06:53:28.456	f
cmisifusg0015lb04axpsq5so	KEMPU NECKLACE PREMIUM QUALITY 	NECKLACE -465	HC:490	2880.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:55:17.921	2025-12-05 06:55:17.921	f
cmisiurac0003jm04i1j7k74h	MAT NECKLACE PREMIUM QUALITY 	NECKLACE -189	HC-198	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[{"id": "1764918174287", "name": "RUBY & GREEN COLOUR AVAILABLE ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:06:53.22	2025-12-05 07:06:53.22	f
cmisjg4zu0009kz04jbk1hicw	NAKSHI HARAM SET PREMIUM QUALITY 	CZ HARAM -760	HC-798	4630.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:23:30.762	2025-12-05 07:23:30.762	f
cmisjisd8000hkz04vt9qxbs9	NAKSHI HARAM SET PREMIUM QUALITY 	CZ HARAM -508	HC-533	3100.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:25:34.364	2025-12-05 07:25:34.364	f
cmisjlgpa0001ld0418dsyy8f	KEMPU HARAM SET PREMIUM QUALITY 	CZ HARAM -641	HC:675	3930.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:27:39.214	2025-12-05 07:27:39.214	f
cmisjp5ut000pkz046dnvgdp5	MAT HARAM SET PREMIUM QUALITY 	CZ HARAM -436	HC:459	2690.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:30:31.781	2025-12-05 07:30:31.781	f
cmisjrn2v0009ld041bhkfs86	MAT HARAM SET PREMIUM QUALITY 	CZ HARAM -335	HC-351	2090.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:32:27.416	2025-12-05 07:32:27.416	f
cmisju5y6000bjm04d8yj6j7o	MAT HARAM SET PREMIUM QUALITY 	CZ HARAM-344	HC:360	2130.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	4	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 07:34:25.182	2025-12-05 07:34:25.182	f
cmj6w43pd0014i804goyhekbl	CZ COMBOSET PREMIUM QUALITY 	CZ HARAM NECK-1028	HC:1130	6450.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 08:26:50.69	2025-12-15 08:26:50.69	f
cmitvvfrt0007jr04qu2fr8f5	CZ CHAMPASWARALU PREMIUM QUALITY 	CZ MAT MATTE-82	HC:90	630.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 05:59:06.138	2025-12-06 05:59:06.138	f
cmitvyh0r0009l404pmtbad8b	CZ CHAMPASWARALU PREMIUM QUALITY 	CZ MAT MATTE-104	HC:114	760.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:01:27.723	2025-12-06 06:01:27.723	f
cmitw0yjm000fjr0496qc9crm	CZ CHAMPASWARALU PREMIUM QUALITY 	CZ MAT MATTE-78	HC:87	630.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:03:23.746	2025-12-06 06:03:23.746	f
cmitw32iv0001js0440gu7q2l	CZ CHAMPASWARALU PREMIUM QUALITY 	CZ MAT MATTE-88	HC:96	650.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:05:02.215	2025-12-06 06:05:02.215	f
cmitw58s0000hl404ujqkwbyu	CZ CHAMPASWARALU PREMIUM QUALITY 	CZ MAT MATTE-78#1	HC:87	630.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:06:43.632	2025-12-06 06:06:43.632	f
cmiwzl0gb0011k304j9jn4ooe	CZ BRACELET PREMIUM QUALITY 	BRACELET -47	HC:51\n(Colours Available)	400.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[{"id": "1765188296668", "name": "Ruby & Green", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 10:06:16.715	2025-12-08 11:07:55.503	f
cmitx5bdd0001jp04kbk1adwt	CZ NECKLACE PREMIUM QUALITY 	NECKLACE-153	HC:162\nCOLOURS AVAILABLE 	1030.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765002590825", "name": "RUBY+GREEN", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:34:46.609	2025-12-06 06:34:46.609	f
cmitxe5v90001la04tqizjkh1	CZ NECKLACE PREMIUM QUALITY 	CZ NECKLACE-164	HC:180\nCOLOURS AVAILABLE 	1140.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765003161718", "name": "+PURPLE+GREEN+MEROON+SKY GREEN+BABY PINK", "value": ".", "priceAdjustment": 0}]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 06:41:39.381	2025-12-06 06:41:39.381	f
cmity7fhb0001i804548qmc42	CZ NECKLACE PREMIUM QUALITY 	NECKLACE-150	HC:159\nCOLOURS AVAILABLE 	999.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-06 07:04:24.863	2025-12-06 07:04:24.863	f
cmiyb209u000fjs04u8y05yo6	CZ BLACK BEADS 18"INCHES 	CZ BLACK BEADS -47	HC:\n(Colours Available)	400.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[{"id": "1765267896652", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 08:15:11.586	2025-12-09 08:15:11.586	f
cmiyj2fuu0009jx047ac3ny48	CZ BLACK BEADS 24"INCHES 	CZ BLACK BEEDS -72	HC:\nLength:24"Inches 	560.00	Black Beads	cmhgcpq4f0001l10491v94f1j	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-09 11:59:28.71	2025-12-09 11:59:28.71	f
cmizuloym000pjx04ky7ewg7t	GJ BANGLES PREMIUM QUALITY 	GJ BANGLES -99	HC:\n(Colours Available)	740.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765361321398", "name": "2.6", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 10:10:08.927	2025-12-10 10:10:08.927	f
cmizxkm46000pjp04yibdgoud	CZ BANGLES PREMIUM QUALITY 	BNGL-83	HC:87\n(Colours Available) \n	600.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1765366302161", "name": "2.6+2.8+2.10", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-10 11:33:17.431	2025-12-10 12:22:03.755	f
cmj19828d0001jr04n7j7ljfi	CZ NECKLACE PREMIUM QUALITY 	CZ NECK-148	HC:\n(Colours Available)	980.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1765446340775", "name": "Ruby & Green ", "value": ".", "priceAdjustment": 0}]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-11 09:47:13.357	2025-12-11 09:47:13.357	f
cmj2szrzm0003le04tve70vg7	INVISIBLE CHAINS 	NECKLACE -22#1	HC:26	270.00	Invisible Chains	cmj2snjep0001le04djqr3fqd	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-12 11:48:25.331	2025-12-12 11:48:25.331	f
cmj89vcr4000bl204k1wwwk8s	CZ VICTORIA COMBOSET PREMIUM QUALITY 	CZ VICT HARAMSET-344	HC:378	2240.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-16 07:39:43.313	2025-12-16 07:39:43.313	f
cmj9tznhe0009js04abfwwuh1	GJ NECKLACE PREMIUM QUALITY 	CZ NECK-256	HC:269	1640.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-17 09:50:42.338	2025-12-17 09:50:42.338	f
cmjb3zn6i0001jr04deeirohk	CZ MAT JUMKA PREMIUM QUALITY 	CZ MAT JUMKA-58	HC:	560.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 07:18:24.283	2025-12-18 07:18:24.283	f
cmjb630vc0009ie04kcyaf9b3	STEP JUMKA PREMIUM QUALITY 	JUMKA-60#1	HC:65	470.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	10	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-18 08:17:01.224	2025-12-18 08:17:01.224	f
cmjch0lxk0001kz04jtecq2ao	CZ MAT JUMKA PREMIUM QUALITY 	CZ MAT JUMKA-92#1	HC:	850.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 06:10:50.504	2025-12-19 06:10:50.504	f
cmjcjpmgf0001ji04oqe4aygh	CZ JUMKA PREMIUM QUALITY 	CZ JUMKA-60	HC:	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-19 07:26:16.816	2025-12-19 07:26:16.816	f
cmjqtbi6j0001l504vqav98rh	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-74	HC:80\n(Sizes Available)	560.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[{"id": "1766991754135", "name": "2.4 + 2.6 +2.8 +2.10", "value": ".", "priceAdjustment": 0}]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:04:00.715	2025-12-29 07:24:33.779	f
cmjqtjmdn0003l404tgyf3bjq	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-99	HC:108\n(Sizes Available)	720.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:10:19.403	2025-12-29 07:25:48.994	f
cmjqthmbe000ajy04s4wtd484	ONE GRAM BANGLES PREMIUM QUALITY 	BANGLES-45	HC:49\n(Sizes Available)	380.00	ONE GRAM BANGLES	cmjqt79cq0001l4049v3q222u	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-29 07:08:46.01	2025-12-29 07:27:35.534	f
cmjs8fa490001kz04tbitluof	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-150	HC:165	1045.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 06:54:37.305	2025-12-30 06:54:37.305	f
cmjs8iiu20001l704a31vnmdq	CZ MAT NECKLACE PREMIUM QUALITY 	CZ MAT NECKLACE-81	HC:89	620.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 06:57:08.571	2025-12-30 06:57:08.571	f
cmjs8r3ae0001jv0440by6i7a	CZ MAT NECKLACE PREMIUM QUALITY 	CZ MAT NECKLACE-128	HC:	900.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:03:48.326	2025-12-30 07:03:48.326	f
cmjs8vswg000ll904ivb4y4hb	VICTORIA NECKLACE PREMIUM QUALITY 	VICT NECKLACE-249	HC:274	1655.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:07:28.144	2025-12-30 07:07:28.144	f
cmjs93htq000tl904jr4lb1tf	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-135	HC:	960.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:13:27.038	2025-12-30 07:13:27.038	f
cmjs9pp6j0001l50499ik07ke	CZ NAKSHI NECKLACE PREMIUM QUALITY 	CZ NAK NECKLACE-156	HC:172	1085.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:30:43.003	2025-12-30 07:30:43.003	f
cmjsa11gb0001jo04ctf4nom4	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-225	HC:	1500.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:39:32.123	2025-12-30 07:39:32.123	f
cmjsa319i0001l50471nsxe57	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-124	HC:136	880.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:41:05.19	2025-12-30 07:41:05.19	f
cmjsa630i0009jv04lqspdt5h	CZ MAT NECKLACE PREMIUM QUALITY 	CZ MAT NECKLACE-171	HC:188	1175.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:43:27.427	2025-12-30 07:43:27.427	f
cmjsabie4000nl5047neriisy	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-159	HC:	1120.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:47:40.636	2025-12-30 07:47:40.636	f
cmjsaqxme0004l104hw0ecx84	CZ NECKLACE PREMIUM QUALITY 	NECKLACE -121	HC:128	830.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:59:40.215	2025-12-30 07:59:40.215	f
cmjsasy1r0001la04nx00bytv	CZ NECKLACE PREMIUM QUALITY 	NECKLACE -121#1	HC:128	830.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 08:01:14.079	2025-12-30 08:01:14.079	f
cmjsb3jns000cl104cj790h0c	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM -71	HC:76	549.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 08:09:28.648	2025-12-30 08:09:28.648	f
cmjs8l7ul0001l904o9uuo7ve	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-123	HC:\n(Colours Available)	900.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 06:59:14.302	2025-12-30 08:17:22.337	f
cmjsb6b7p000kl104vs4u0xnb	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM -65	HC:69	510.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 08:11:37.67	2025-12-30 08:15:05.186	f
cmjsb7u190003lg04ks3wxxe8	5 STEP CHANDRA HARAM PREMIUM QUALITY 	STEP HARAM -65#1	HC:69	510.00	ChandraHaram.	cmitygf3c0001jl0465c0k3t9	[]	8	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 08:12:48.718	2025-12-30 08:15:38.199	f
cmjs90xgk0009kz04kzja35t9	CZ MAT NECKLACE PREMIUM QUALITY 	CZ MAT NECKLACE-139	HC:\n(Colours Available)	980.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767078590337", "name": "WINE + GREEN + LITE PINK ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:11:27.333	2025-12-30 08:17:58.484	f
cmjsa98840001ky04b5mxos3f	CZ MAT NECKLACE PREMIUM QUALITY 	CZ MAT NECKLACE-146	HC:160\n(Colours Available)	1015.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767080652945", "name": "WINE & RUBY", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:45:54.149	2025-12-30 08:18:38.174	f
cmjs9ddzv0009l7040uzoq6md	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-117	HC:128\n(Colours Available)	835.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767079182589", "name": "WINE + GREEN + LITE PINK ", "value": ".", "priceAdjustment": 0}]	3	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:21:08.635	2025-12-30 08:22:20.812	f
cmjs9xr330009l504bve9usvm	CZ NECKLACE PREMIUM QUALITY 	NECKLACE-81	HC:85\n(Colours Available)	580.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767079954617", "name": "PURPLE+ GREEN +SEA GREEN +LITE PINK ", "value": ".", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:36:58.719	2025-12-30 08:20:14.73	f
cmjs88cs50001jp04q6z468hr	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-112	HC:\n(Colours Available)	850.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767077262061", "name": "WINE & LITE PINK ", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 06:49:14.165	2025-12-30 08:23:40.884	f
cmjs8ob89000bl904odrikbzk	CZ VICTORIA NECKLACE PREMIUM QUALITY 	CZ VICT NECKLACE-195	HC:\n(Colours Available)	1300.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[{"id": "1767078051000", "name": "GREEN & WINE", "value": ".", "priceAdjustment": 0}]	2	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-30 07:01:38.65	2025-12-30 08:25:20.398	f
cmjtlsbz60001jj04uj1r1219	CZ CHAMPASWARALU PREMIUM QUALITY 	EARCHAIN-87	HC:92	630.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 05:56:27.427	2025-12-31 05:57:08.673	f
cmjtlvdxh0007jz04h24gmmpt	CZ CHAMPASWARALU PREMIUM QUALITY 	EARCHAIN-92	HC:92	630.00	CHAMPASWARALU	cmhgkonzs0001l504aofu3gyj	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 05:58:49.925	2025-12-31 05:58:49.925	f
cmjtmyvqd0009jj04btdt80fr	THALI CHAIN PREMIUM QUALITY 	YGC-40	HC:46\n(LENGTH:24”INCHES)	380.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:29:32.581	2025-12-31 07:31:17.876	f
cmjtnlto60001jl04rcv1k31v	THALI CHAIN PREMIUM QUALITY 	CHAIN-33	HC:38\n(LENGTH:24”INCHES)	330.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:47:22.999	2025-12-31 06:47:22.999	f
cmjtnoakf000hjj049jqsvnrn	THALI CHAIN PREMIUM QUALITY 	CHAIN-45	HC:49\n(LENGTH:24”INCHES)	400.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:49:18.207	2025-12-31 06:49:18.207	f
cmjtnssyi0009jj04xdq4mhqt	THALI CHAIN PREMIUM QUALITY 	CHAIN-45#1	HC:49\n(LENGTH:24”INCHES)	400.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:52:48.667	2025-12-31 06:52:48.667	f
cmjtmpg5z0007jr04a33uj4ud	THALI CHAIN PREMIUM QUALITY 	CHAIN-20	HC:24\n(LENGTH:24”INCHES)	240.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:22:12.503	2025-12-31 06:59:38.482	f
cmjtnab660001jl04cbowblqq	THALI CHAIN PREMIUM QUALITY 	CHAIN-36	HC:40\n(LENGTH:24”INCHES)	330.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:38:25.806	2025-12-31 07:02:04.973	f
cmjtnf0jm0001jj04he3eveui	THALI CHAIN PREMIUM QUALITY 	CHAIN-35	HC:40\n(LENGTH:24”INCHES)	330.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:42:05.314	2025-12-31 07:02:39.941	f
cmjtn23w70001l904vlphaw2a	THALI CHAIN PREMIUM QUALITY 	CHAIN-26	HC:29\n(LENGTH:24”INCHES)	290.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:32:03.127	2025-12-31 07:03:15.766	f
cmjtog8g1000ijr04r10x2m7o	SHORT CHAIN PREMIUM QUALITY 	CHAIN-11#1	HC:13\n(LENGTH:18”INCHES)	180.00	18 inches short chains.	cmjtocyyb000pjj04i2gu0qwu	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:11:01.825	2025-12-31 07:11:01.825	f
cmjtoiwsz0001lb04ajvt9ejv	SHORT CHAIN PREMIUM QUALITY 	CHAIN-13	HC:15\n(LENGTH:18”INCHES)	195.00	18 inches short chains.	cmjtocyyb000pjj04i2gu0qwu	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:13:06.707	2025-12-31 07:13:06.707	f
cmjtol88i000rjj04b1n8dc0e	SHORT CHAIN PREMIUM QUALITY 	CHAIN-11#2	HC:13\n(LENGTH:18”INCHES)	180.00	18 inches short chains.	cmjtocyyb000pjj04i2gu0qwu	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:14:54.834	2025-12-31 07:14:54.834	f
cmjtoxolk000rjl04mgo14jw4	SHORT CHAIN PREMIUM QUALITY 	YC-19.2	HC:21\n(LENGTH:18”INCHES)	240.00	18 inches short chains.	cmjtocyyb000pjj04i2gu0qwu	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:24:35.913	2025-12-31 07:24:35.913	f
cmjtnxsef000ajr04ylnerkne	SHORT CHAIN PREMIUM QUALITY 	CHAIN-11	HC:13\n(LENGTH:18”INCHES)	180.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:56:41.224	2025-12-31 11:53:16.235	f
cmjtoy4fz0001jp04p40mhqcq	CHOKER	CHOKER -544	HC:573	3350.00	CHOKERS	cmhgkr6uf0003l804bzsy4f16	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:24:56.447	2025-12-31 07:24:56.447	f
cmjtp2uet000ljl0454qgma3p	SHORT CHAIN PREMIUM QUALITY 	CHAIN-13#3	HC:15\n(LENGTH:18”INCHES)	195.00	18 inches short chains.	cmjtocyyb000pjj04i2gu0qwu	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:28:36.726	2025-12-31 07:28:36.726	f
cmiabk2qt0009la04v2kxzay3	Premium Quality Mop Chain 	SGC SI-BI-107	HC-117\n(LENGTH:24"INCHES)	780.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:22:46.374	2025-12-31 07:31:53.272	f
cmjtmdpvo000fl204u309ut89	THALI CHAIN PREMIUM QUALITY 	CHAIN-24	HC:27\n(LENGTH:24”INCHES)	270.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 06:13:05.22	2025-12-31 07:32:31.855	f
cmjxxs9ql000al504xeayzy27	Bracelet 	Bracelet -36#1	HC-40	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 06:43:24.622	2026-01-03 06:43:24.622	f
cmiabha3b000hlb04uca1j0qb	Premium Quality Mop Chain 	SGC SI-BI-116#1	HC-130\n(LENGTH:24" INCHES)	850.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-22 13:20:35.928	2025-12-31 07:34:03.106	f
cmjtpf62g001cjj04w7160ys8	Kempu necklace 	Necklace -396	HC- 416	2450.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 07:38:11.704	2025-12-31 07:38:11.704	f
cmjtupa6w0002l704hn7sr0p9	Kasula Haram 	CZ Haram -402	HC-423	2490.00	KASULA HARAM	cmho3fsxp0001ju04hzwllaw8	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 10:06:01.689	2025-12-31 10:06:01.689	f
cmjtvbzi50001l404rqvjotyw	Kasula Haram 	CZ Haram 402#1	HC-423	2490.00	KASULA HARAM	cmho3fsxp0001ju04hzwllaw8	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 10:23:40.925	2025-12-31 10:23:40.925	f
cmjtvvdux0003l8042si4fiqt	Chandbali necklace 	CZ Neck-240	HC-252	1530.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-31 10:38:45.993	2025-12-31 10:38:45.993	f
cmi1va3vp0001kt040b4c9hhv	1 gram bangles primiam quality 	Bangles -  85	Hc - 90	625.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763306631570", "name": "2.8+2.6+2.4 size available ", "value": "Multi colour ", "priceAdjustment": 0}]	12	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:24:58.021	2025-12-31 11:07:38.367	f
cmjuxrysv0001l504lhrbodsw	Necklace 	Necklace -191	HC-200	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 04:19:51.919	2026-01-01 04:19:51.919	f
cmjv0eeqy0001l504pcxi6vua	Kempu necklace 	CZ Necklace -321	HC-337	1998.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 05:33:18.251	2026-01-01 05:33:18.251	f
cmjv2oiud0002lb04x7in0gzk	Locket chain	Necklace -40	HC-45	380.00	Chain Necklace	cmih9kzf70001i904tu7iuf6z	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 06:37:09.349	2026-01-01 06:37:09.349	f
cmjv2w2gj0001jj04ny6ydpqi	Locket chain 	Necklace -40#1	HC-45	380.00	Chain Necklace	cmih9kzf70001i904tu7iuf6z	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 06:43:01.363	2026-01-01 06:43:01.363	f
cmjv32bho000blb04ep7whhc1	Kempu necklace 	CZ-Neck-321#1	HC-337	1998.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 06:47:53.004	2026-01-01 06:47:53.004	f
cmjv3wdr30001l804tpk0n311	MAT necklace 	Necklace -189	HC-198	1230.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 07:11:15.615	2026-01-01 07:11:15.615	f
cmjv5no9a0003kw04a09jv8jf	Nanthad necklace 	CZ Necklace -123	HC-130	850.00	Chain Necklace	cmih9kzf70001i904tu7iuf6z	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 08:00:28.558	2026-01-01 08:00:28.558	f
cmjv5utr40001la04k1unspwk	Necklace 	Necklace -150	HC-159	999.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-01 08:06:02.273	2026-01-01 08:06:02.273	f
cmjwcodcl0002l704ij1om695	Necklace 	Necklace -150#1	HC-159	999.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-02 04:04:44.565	2026-01-02 04:04:44.565	f
cmjxxwfi10002lb04s4gej9k8	Bracelet 	Bracelet -36#2	HC-40	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 06:46:38.714	2026-01-03 06:46:38.714	f
cmjxxz8de000jl5043e4a0liq	Bracelet 	Bracelet -36#3	HC-40 	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 06:48:49.442	2026-01-03 06:48:49.442	f
cmjwdcd7o0009i204110lzmgv	Nakshi Haram 	CZ Haram -384	HC-404	2380.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-02 04:23:24.132	2026-01-02 04:23:24.132	f
cmi1uyg2s0009ju04r74ojtng	1 gram bangles primiam quality.	Bangles - 76	Hc - 81	580.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1763305935086", "name": "2.8+2.6+2.4 available ", "value": "Multi colour.", "priceAdjustment": 0}, {"id": "1767356103376", "name": "2.4", "value": ".", "priceAdjustment": 0}]	1	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-16 15:15:53.956	2026-01-02 12:15:17.43	f
cmiis00x00001l704qvzmffl7	JADAU HANGINGS	JUMKA-72	HC-78\n\n	560.00	Hangings	cmiiok42a0001jr04mqm2lgu1	[{"id": "1764328907558", "name": "Ruby white & Ruby Green ", "value": ".", "priceAdjustment": 0}]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-28 11:25:13.765	2026-01-02 12:22:08.784	f
cmid388v40001ld04378ak7mz	MAT JUMK PREMIUM QUALITY 	CZ JUMKA-42	HC-47	360.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-11-24 11:52:56.032	2026-01-02 12:29:24.713	f
cmjxxl0710002l504iv6p3bbr	Bracelet 	Bracelet -36	HC-40	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 06:37:45.662	2026-01-03 06:37:45.662	f
cmjxy6th6000alb044xn0rf1f	Bracelet 	Bracelet -36#4	HC-40 	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 06:54:43.386	2026-01-03 06:54:43.386	f
cmjy3q8bu0001ih04nhmtu5q1	Bracelet 	Bracelet -36#5	HC-40 	350.00	BRACELET	cmhgkqq830001l8047ev8tmz7	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-03 09:29:47.178	2026-01-03 09:29:47.178	f
cmk0qb16v0002l4048b7duuhk	Papidi chain 	CZ Tikka -58	HC -62	450.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 05:37:21.607	2026-01-05 05:37:21.607	f
cmk0qy2xl0001l804d0v3j34s	Papidi chain 	CZ Tikka -45	HC -49	380.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 05:55:16.953	2026-01-05 05:55:16.953	f
cmk0rc1uj0001l704k2sq881t	Papidi chain 	CZ Tikka -49	HC-53	400.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:06:08.732	2026-01-05 06:06:08.732	f
cmk0rkb5h0001jm047p2ctppl	Papidi chain 	CZ Tikka -58#1	HC-62	450.00	Tikhas (papidi chain)	cmictwptb0001l2041xf5mh56	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:12:34.037	2026-01-05 06:12:34.037	f
cmk239fex001hl504ok7mr9yc	Ear Studs 	CZ Studs-15	HC -18	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:27:47.914	2026-01-06 04:27:47.914	f
cmk0soqyt0001gv04t4x3eqmk	Kasula Necklace 	CZ Neck-96	HC-103	690.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:44:00.773	2026-01-05 06:44:00.773	f
cmk0su6yd0003ic04xlpbvupv	Kasula Haram 	CZ Haram-144	HC-153	990.00	KASULA HARAM	cmho3fsxp0001ju04hzwllaw8	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:48:14.773	2026-01-05 06:48:14.773	f
cmk0t483o000wli04iygzxn79	Kasula Haram 	CZ Haram -348	HC-366	2180.00	KASULA HARAM	cmho3fsxp0001ju04hzwllaw8	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:56:02.82	2026-01-05 06:56:02.82	f
cmk0teh370002l204psvupo2l	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC-SI-BI-140	HC:153\n(LENGTH-24”INCHES)	980.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 07:04:01.027	2026-01-05 07:04:01.027	f
cmk0ui9xz0002jp04sew62zg4	Necklace 	CZ Neck-204	HC-215	1350.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 07:34:58.008	2026-01-05 07:34:58.008	f
cmk0su6yf000cli04aov48k85	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI-BI-92	HC:103\n(LENGTH-24”INCHES)	699.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:48:14.775	2026-01-05 07:05:23.986	f
cmk0ynp8t0001k404pq6uzjhy	CZ VANKI PREMIUM QUALITY 	VANKI-128	HC:135	870.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 09:31:09.581	2026-01-05 09:31:09.581	f
cmk0sxr6w000oli046a9i4vh5	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI-BI-112	HC:123\n(LENGTH-24”INCHES)	788.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:51:00.968	2026-01-05 07:06:49.716	f
cmk0tic0q0007jj04m60p6p25	 Ear Studs	CZ Studs -24	HC-27	270.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 07:07:01.083	2026-01-05 07:07:01.083	f
cmk0ypotg0003l50482lhx28l	CZ VANKI PREMIUM QUALITY 	VANKI-128#1	HC:135	870.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 09:32:42.341	2026-01-05 09:32:42.341	f
cmk0t0xsq000hjv042vvu6aqa	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI-BI-154	HC:168\n(LENGTH-24”INCHES)	1050.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:53:29.499	2026-01-05 07:07:59.185	f
cmk0yu9530001l304mvpgpp9a	MAT Necklace 	Necklace -189#1	HC-204	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 09:36:15.303	2026-01-05 09:36:15.303	f
cmk0t8juc000bgv04e3zsik0u	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC-SI-BI-105	HC:114\n(LENGTH-24”INCHES)	740.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:59:24.66	2026-01-05 07:09:56.363	f
cmk0tmjbd0014l204oc9majv8	Ear studs 	CZ Studs-24#1	HC-27	270.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 07:10:17.161	2026-01-05 07:10:17.161	f
cmk10hqyh0001i604hdvih2e9	Vaddanam	CZ Belt-749	HC-787	4540.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 10:22:31.097	2026-01-05 10:22:31.097	f
cmk0sb0ec0001k104gz0kpd9m	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI -BI-107	HC:117\n(LENGTH-24”INCHES)	760.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:33:19.813	2026-01-05 07:11:12.983	f
cmk0sfwzk0004li04ox7azp2s	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI-BI-118	HC:130\n(LENGTH-24”INCHES)	850.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:37:08.673	2026-01-05 07:12:31.669	f
cmk0skw3q0009jv04b8dyfrwf	MICRO GOLD PLATED PREMIUM QUALITY 	SHC SI-BI-122	HC:132\n(LENGTH -24”INCHES)	859.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:41:00.807	2026-01-05 07:13:48.153	f
cmk22oobb000xl804442kubzw	Ear Studs 	CZ Studs -29	HC-33	299.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:11:39.671	2026-01-06 04:11:39.671	f
cmk0s67ef0001jv04cxi5t1c9	MICRO GOLD PLATED MOP CHAIN PREMIUM QUALITY 	SGC SI-BI-101#1	HC:110\n(LENGTH-24”INCHES)	720.00	Thali chains	cmi71914t0001l704tgh2kfn8	[]	15	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 06:29:35.607	2026-01-05 07:21:01.203	f
cmk10s08h0002gy045q09lin1	Vaddanam 	CZ Belt-749#1	HC-787	4540.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 10:30:29.681	2026-01-05 10:30:29.681	f
cmk10urke0009k404z49zkpto	Vaddanam 	CZ  Belt-749#2	HC-787	4540.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 10:32:38.415	2026-01-05 10:32:38.415	f
cmk11cy25000agy04w4fk2tyq	Kasula Necklace 	CZ Neck-276	HC-290	1750.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-05 10:46:46.638	2026-01-05 10:46:46.638	f
cmk222ihu0001l504mffryyu1	Ear studs 	CZ Studs -13	HC-15	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 03:54:25.698	2026-01-06 03:54:25.698	f
cmk22r0m60016l804jm8lo6hl	Ear Studs 	CZ Studs -22#1	HC-26	270.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:13:28.926	2026-01-06 04:13:28.926	f
cmk227mny0003l404k6jzi6g6	Ear studs 	CZ Studs -20	HC-24	270.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 03:58:24.383	2026-01-06 03:58:24.383	f
cmk22a1th000al50432b0thcj	Ear Studs 	CZ Studs -9	HC-11	175.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:00:17.334	2026-01-06 04:00:17.334	f
cmk22colt000gl804uabtnp59	Ear Studs 	CZ Studs -13#1	HC-15 	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:02:20.177	2026-01-06 04:02:20.177	f
cmk22golj000ol804s3it8wkg	Ear Studs 	CZ Studs -18	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:05:26.792	2026-01-06 04:05:26.792	f
cmk22j84n000jl5044bu52s5f	Ear Studs 	CZ Studs -18#1	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:07:25.415	2026-01-06 04:07:25.415	f
cmk22lum8000rl504lr387qd1	Ear Studs 	CZ Studs -22	HC-26	270.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:09:27.873	2026-01-06 04:09:27.873	f
cmk22vyy90010l504q8j12fo2	Ear Studs 	CZ Studs -18#2	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:17:20.049	2026-01-06 04:17:20.049	f
cmk22zktx000el404y46v4j49	Ear Studs 	CZ Studs -18#3	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:20:08.373	2026-01-06 04:20:08.373	f
cmk232qry0018l504de8d5n5d	Ear Studs 	CZ Studs -18#4	HC- 20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:22:36.046	2026-01-06 04:22:36.046	f
cmk235h57001fl8048cuptyib	Ear Studs 	CZ Studs -17	HC-20	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:24:43.531	2026-01-06 04:24:43.531	f
cmk23d3dx000ol404f65rtwxa	Ear Studs 	CZ Studs -18#5	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:30:38.95	2026-01-06 04:30:38.95	f
cmk23hdrf001ql504837h4q9t	Ear Studs 	CZ Studs -18#6	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:33:59.019	2026-01-06 04:33:59.019	f
cmk2438fp001ol804rtelnsw2	Balaji locket chain 	CZ Locket -65	HC-69	499.00	Puli goru lockets	cmi9zuxwu000dl404up390ywb	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 04:50:58.549	2026-01-06 04:50:58.549	f
cmk24gl4n0001jw045th1wh40	Jumka	CZ MAT Jumka -58	HC-65	499.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 05:01:21.527	2026-01-06 05:01:21.527	f
cmk24t060000ajw04boatd81y	Jumka 	CZ MAT Jumka -79#1	HC-107	699.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 05:11:00.888	2026-01-06 05:11:00.888	f
cmk2520s50001l404qkpsjgvb	Jumka 	CZ MAT Jumka -33	HC-38	350.00	Jumkas	cmhgd8l2q0004ky04uwi0a2pv	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 05:18:01.589	2026-01-06 05:18:01.589	f
cmk2638ut000kjw04ltf139lv	MAT Necklace 	Necklace -236	HC-249	1520.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 05:46:58.325	2026-01-06 05:46:58.325	f
cmk29bmwr0001jo04hfeh53f9	MAT Haram 	CZHaram -305	HC-321	1930.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:17:28.635	2026-01-06 07:17:28.635	f
cmk29irqk0009jo04kf1w5mlb	MAT Haram 	CZ HARAM -305#1	HC-321	1930.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:23:01.485	2026-01-06 07:23:01.485	f
cmk29mfpl000ijo041te5ch3k	Necklace 	Necklace -22	HC-26	270.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:25:52.522	2026-01-06 07:25:52.522	f
cmk29q9n10003l504zcvctmgi	Necklace 	Necklace -22#1	HC -26	270.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:28:51.277	2026-01-06 07:28:51.277	f
cmk29wdhs0002l804sxbc1f8z	Necklace 	Necklace -22#2	HC-26	270.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:33:36.209	2026-01-06 07:33:36.209	f
cmk29zb27000rjo044wbyddje	Necklace 	Necklace -33	HC-38	330.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 07:35:53.023	2026-01-06 07:35:53.023	f
cmk2d57tl0001ie047dkbg2b8	Ear Studs 	CZ Studs -18#7	HC-20	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 09:04:27.61	2026-01-06 09:04:27.61	f
cmk2dyljs000bjv04jbu8sqmu	Ear Studs 	CZ Studs -18#8	HC-20 	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 09:27:18.424	2026-01-06 09:27:18.424	f
cmk2e18dk0003jl05mw6kf0ps	Ear Studs 	CZ Studs -18#9	HC-20 	240.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 09:29:21.321	2026-01-06 09:29:21.321	f
cmk2e60xg0002ld045d7irr75	Ear Studs 	CZ Studs -13#2	HC-15	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 09:33:04.948	2026-01-06 09:33:04.948	f
cmk2ec1ud000jjv04130x4vo8	Ear Studs 	CZ Studs -15	HC-18	220.00	Ear studs	cmih992ry0001la04z66nrpok	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 09:37:46.069	2026-01-06 09:37:46.069	f
cmk2hjk4i0001jr04ne2zw15q	MAT Haram 	CZ Haram -301	HC-317	1899.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 11:07:35.203	2026-01-06 11:07:35.203	f
cmk2hn2qx0009jr04uv5zlnf8	MAT Haram 	CZ HARAM -301#1	HC-317	1899.00	Mat haram	cmhgkntwx0001ib04a4y9dxou	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-06 11:10:19.306	2026-01-06 11:10:19.306	f
cmk3hge360002l804cnvb2opo	2in1  Necklace 	Necklace -609	HC-609	3530.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 03:52:53.587	2026-01-07 03:52:53.587	f
cmk3ogl4x0003lc04nefpzpir	Necklace 	Necklace -141	HC-150	960.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:09:00.034	2026-01-07 07:09:00.034	f
cmk3i3mz1000al804zcakqk77	Necklace 	Necklace -162	HC-162	1030.00	CZ Necklaces	cmg5f33zu0001l804s1wrqr5t	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 04:10:58.19	2026-01-07 04:13:54.89	f
cmk3k0vnl0002jm04dun2ixo3	Vaddanam 	CZ Belt-231	HC-242	1530.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 05:04:48.706	2026-01-07 05:04:48.706	f
cmjjrgf080001ii04yw1u28ly	PANCHALOHAM BANGLES PREMIUM QUALITY 	BNGL-108	HC:114\n(Sizes Available)	780.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1767767587158", "name": "2.4 & 2.10", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:37:27.417	2026-01-07 06:33:32.162	f
cmk3naew70002jl04eh5j6gpd	Vaddanam 	CZ Belt-231#1	HC-242	1530.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 06:36:12.391	2026-01-07 06:36:12.391	f
cmjjqnsoi0001js04y1l1t6pi	PANCHALOHAM BANGLES PREMIUM QUALITY 	BANGLES-116	HC:123\n(Sizes Available)	810.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1767768013138", "name": "2.4 & 2.8", "value": ".", "priceAdjustment": 0}]	5	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:15:12.115	2026-01-07 06:40:31.727	f
cmjjqwrfc0001ju04264ip0lh	PANCHALOHAM BANGLES PREMIUM QUALITY 	BANGLES-116#1	HC:123\n(Sizes Available)	810.00	Bangles	cmg5f3d7o0003l804vmxh5d2y	[{"id": "1767768537882", "name": "2.6+ 2.8 +2.10", "value": ".", "priceAdjustment": 0}]	11	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-24 08:22:10.392	2026-01-07 06:49:29.549	f
cmk3o60hi0007jp04ujya83qp	Necklace 	CZ Necklace -234	HC-245	1500.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:00:46.711	2026-01-07 07:00:46.711	f
cmk3ojxbn0001l404g9pl8po8	Necklace 	Necklace -141#1	HC-150	960.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:11:35.796	2026-01-07 07:11:35.796	f
cmk3or6wq0008k004ek2wy8wn	Necklace 	Necklace -141#2	HC -150	960.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:17:14.811	2026-01-07 07:17:14.811	f
cmk3oupbl000al404py90az3u	Necklace 	Necklace -141#3	HC-150	960.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:19:58.641	2026-01-07 07:19:58.641	f
cmk3paabs000hk004ek0uxmid	VADDANAM 	CZ BELT-231	HC:242	1530.00	VADDANAM	cmhq0p02k0001kw04yw2jjlgu	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 07:32:05.704	2026-01-07 07:32:05.704	f
cmk3uf63o0002js049ruqwyb7	COMBO SET 	COMBO SET -470	HC-495	2960.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 09:55:51.589	2026-01-07 09:55:51.589	f
cmk3xwear0002js04b344z8lo	MAT Necklace 	Necklace -189#2	HC-198	1230.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 11:33:14.211	2026-01-07 11:33:14.211	f
cmk3xz7jg000bjs04jz6jd44c	MAT Necklace 	Necklace -189#3	HC-198	1230.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 11:35:25.42	2026-01-07 11:35:25.42	f
cmk3y6mfw000jjs04odka8i8a	MAT Necklace 	Necklace -189#4	HC-204	1260.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 11:41:11.324	2026-01-07 11:41:11.324	f
cmk3ycyan000rjs04322aiapz	COMBO SET 	COMBO SET-470#1	HC-495	2960.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-07 11:46:06.623	2026-01-07 11:46:06.623	f
cmiwqx3wx0001jp04x68lzs1f	CZ VANKI PREMIUM QUALITY 	VANKI-114	HC:121	800.00	Aravanki	cmhgkoax60003js04bp3l0c36	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-08 06:03:44.529	2026-01-07 14:33:26.044	f
cmj6uigrd000ei80469objs63	COMBOSET PREMIUM QUALITY 	COMBOSET -526	HC:553\n	3260.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-15 07:42:01.562	2026-01-07 14:34:00.768	f
cmishjbaz0009lb04w1lfxzi7	CZ MAT PREMIUM QUALITY NECKLACE 	CZ NECK-180	HC:198	1665.00	MAT NECKLACE	cmht6sb1g0001js041506z3hz	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2025-12-05 06:29:59.675	2026-01-07 15:36:07.553	f
cmk4zbteq0001l804mjxibulg	Necklace 	CZ Necklace -144	HC-153	990.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 05:00:59.426	2026-01-08 05:00:59.426	f
cmk529lzj0001ii04wglsw9uo	Victoria Sets	CZV Haram -595	HC-654	3800.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:23:15.343	2026-01-08 06:23:15.343	f
cmk52cvag000aii04nxxa7xyw	Victoria Sets 	CZV Set -598	HC-659	3820.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:25:47.369	2026-01-08 06:25:47.369	f
cmk52huyh000jii044ogvped3	Victoria Sets 	CZV set-642	HC-706	4070.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:29:40.217	2026-01-08 06:29:40.217	f
cmk52n9dq000alb04aww67o8q	Victoria Sets 	CZV Haram -595#1	HC-654	3800.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:33:52.19	2026-01-08 06:33:52.19	f
cmk52rjzq0009la0464ukkl7k	Victoria Sets 	CZV Haram -595#2	HC-654	3800.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:37:12.566	2026-01-08 06:37:12.566	f
cmk530jr2000jlb04oizxa3nh	COMBO SET 	CZ HARAM -470#2	HC-495	2960.00	Combo Set	cmhgkpywb0005ib04ymz2zgwk	[]	0	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 06:44:12.158	2026-01-08 06:44:12.158	f
cmk542hq30001i0047k5l7s0p	Victoria Necklace 	CZ Necklace -240	HC-252	1550.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 07:13:42.459	2026-01-08 07:13:42.459	f
cmk5ctmvj0001lc04341ymihj	GJ Necklace 	CZ Neck -308	HC-324	1950.00	GJ Necklaces	cmhgknb5p0001js04qvasnpzo	[]	6	0	t	cmg1srt900001l5049x26l2cp	[]	[]	\N	2026-01-08 11:18:45.775	2026-01-08 11:18:45.775	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, role, "clientId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmg1fahe50001y7q2d6al5e4b	karthik@scan2ship.in	$2b$10$jRPfPVg2azFOPgZcparTOuc/LoOPi2jbYDy18F3bQi5yvmFijj32y	Karthik Dintakurthi	MASTER_ADMIN	\N	t	2025-09-26 22:37:57.005	2025-09-26 22:39:29.387
cmg1srtcz0005l504j6ofsics	yoshita@stockmind.in	$2b$10$v8Hv7qnhhUspy6q060ffVuzgPZ/MDs6x71EL4KvE6onh80VztSwt2	Yoshita Fashion Jewellery	ADMIN	cmg1srt900001l5049x26l2cp	t	2025-09-27 04:55:20.676	2025-09-27 04:56:29.327
cmg5evtyt0001ld04lehpg7b2	yoga@stockmind.in	$2b$10$yaojdG6Q334.wDf0uj5.P.UpIQEfv.fM32nC1Bfh.WXnVG1pvnKFG	Yoganand Ch	USER	cmg1srt900001l5049x26l2cp	t	2025-09-29 17:37:38.166	2025-10-11 10:56:43.899
cmgya2grr0005jm04zaywejzu	vanithafashionjewellery.usa@gmail.com	$2b$10$KcHWczT0ujZBY633mbZVquZM35Cg0j334n9NMQelI9iweSAgOdN7y	Vanitha Fashion Jewelry Admin	ADMIN	cmgya2gn30001jm04l9nho4y1	t	2025-10-19 22:28:08.679	2025-10-19 22:28:08.679
cmgya3dzq0001lb04n422zd1g	sailaja@vanitha.com	$2b$10$NEAaUXfinxHBTlJG25ll7OG8b64AUVZnQXnwu2.b4/yUFdqitdQbm	Sailaja Dintakurthi	USER	cmgya2gn30001jm04l9nho4y1	t	2025-10-19 22:28:51.735	2025-10-19 22:28:51.735
cmhgbmghy0001jy04m0iaivdr	shop@yoshita.com	$2b$10$8McHUBMGga2r9vb31JK90.6VINjkA7LrRvut90uG3YUuvfbgDzD9y	Vijayawada Shop	USER	cmg1srt900001l5049x26l2cp	t	2025-11-01 13:31:32.23	2025-11-01 13:31:32.23
cmjsu093u0001jr04jxi5g248	yoshitafashion@gmail.com	$2b$10$Pu5vc4utzVM0fONuEY4TieiODQb3j5ThTfSfRwAvYMBxRurVQG8Sq	Yoshita Fashion	USER	cmg1srt900001l5049x26l2cp	t	2025-12-30 16:58:47.706	2025-12-30 16:58:47.706
cmjsu0xp60001l204s7denxpj	onlineyoshita@gmail.com	$2b$10$tEGVXqnTVH9CiZNzukuKtuHQS3MvAY3xhDmowYCTcc9UC6fiiAJC6	Online Yoshita	USER	cmg1srt900001l5049x26l2cp	t	2025-12-30 16:59:19.578	2025-12-30 16:59:19.578
cmjsu1k980001k104wdwf3n3l	ch.yoganand@gmail.com	$2b$10$rplw5.tn/w7wN/Q4mC9Ete4TWBnvEcwZ.u.9OmkLqp8gd7DcPMNxC	Ch Yoganand	USER	cmg1srt900001l5049x26l2cp	t	2025-12-30 16:59:48.812	2025-12-30 16:59:48.812
\.


--
-- Data for Name: video_frames; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_frames (id, "mediaId", "frameS3Key", "tsMs", width, height, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: client_settings client_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: frame_embeddings frame_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frame_embeddings
    ADD CONSTRAINT frame_embeddings_pkey PRIMARY KEY (id);


--
-- Name: image_embeddings image_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_embeddings
    ADD CONSTRAINT image_embeddings_pkey PRIMARY KEY (id);


--
-- Name: inventory_history inventory_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT inventory_history_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_media product_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_media
    ADD CONSTRAINT product_media_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_frames video_frames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_frames
    ADD CONSTRAINT video_frames_pkey PRIMARY KEY (id);


--
-- Name: api_keys_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "api_keys_clientId_idx" ON public.api_keys USING btree ("clientId");


--
-- Name: api_keys_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX api_keys_key_idx ON public.api_keys USING btree (key);


--
-- Name: api_keys_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX api_keys_key_key ON public.api_keys USING btree (key);


--
-- Name: categories_name_clientId_parentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "categories_name_clientId_parentId_key" ON public.categories USING btree (name, "clientId", "parentId");


--
-- Name: client_settings_clientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "client_settings_clientId_key" ON public.client_settings USING btree ("clientId");


--
-- Name: clients_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_slug_key ON public.clients USING btree (slug);


--
-- Name: countries_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX countries_code_key ON public.countries USING btree (code);


--
-- Name: countries_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX countries_name_key ON public.countries USING btree (name);


--
-- Name: currencies_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX currencies_code_key ON public.currencies USING btree (code);


--
-- Name: currencies_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX currencies_name_key ON public.currencies USING btree (name);


--
-- Name: frame_embeddings_frameId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "frame_embeddings_frameId_key" ON public.frame_embeddings USING btree ("frameId");


--
-- Name: image_embeddings_mediaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "image_embeddings_mediaId_key" ON public.image_embeddings USING btree ("mediaId");


--
-- Name: order_items_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_orderId_idx" ON public.order_items USING btree ("orderId");


--
-- Name: order_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_productId_idx" ON public.order_items USING btree ("productId");


--
-- Name: orders_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_clientId_idx" ON public.orders USING btree ("clientId");


--
-- Name: orders_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_createdAt_idx" ON public.orders USING btree ("createdAt");


--
-- Name: orders_orderNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_orderNumber_idx" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: product_categories_productId_categoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON public.product_categories USING btree ("productId", "categoryId");


--
-- Name: product_media_productId_mediaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "product_media_productId_mediaId_key" ON public.product_media USING btree ("productId", "mediaId");


--
-- Name: products_sku_clientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "products_sku_clientId_key" ON public.products USING btree (sku, "clientId");


--
-- Name: users_email_clientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_email_clientId_key" ON public.users USING btree (email, "clientId");


--
-- Name: api_keys api_keys_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT "api_keys_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_settings client_settings_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT "client_settings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clients clients_countryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "clients_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES public.countries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clients clients_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "clients_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: countries countries_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT "countries_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: frame_embeddings frame_embeddings_frameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frame_embeddings
    ADD CONSTRAINT "frame_embeddings_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES public.video_frames(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: image_embeddings image_embeddings_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_embeddings
    ADD CONSTRAINT "image_embeddings_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_history inventory_history_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT "inventory_history_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_history inventory_history_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT "inventory_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_history inventory_history_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_history
    ADD CONSTRAINT "inventory_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: media media_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "media_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_categories product_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_categories product_categories_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_media product_media_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_media
    ADD CONSTRAINT "product_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_media product_media_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_media
    ADD CONSTRAINT "product_media_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: video_frames video_frames_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_frames
    ADD CONSTRAINT "video_frames_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public.media(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WponN6rjqATwmHv3NBQljd9ZxtyHZJJMf8Vr1Ier0hfwuliog8EwSQZxbEd4ATU

