--
-- PostgreSQL database dump
--

\restrict i2QFPX3G2kui1kuDhQ4VKWn0HXHce3YSG7d4z1gDeCNL0J84XFs3QSb3F54SSA0

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone NOT NULL,
    id uuid CONSTRAINT categories_uuid_id_not_null NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    address character varying(500),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    residential_address character varying(500),
    delivery_address character varying(500)
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    subtotal numeric(14,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_tracking (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    notes character varying(500)
);


ALTER TABLE public.order_tracking OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    order_date timestamp with time zone NOT NULL,
    status character varying(30) NOT NULL,
    total_amount numeric(14,2) NOT NULL,
    predicted_delivery_date timestamp with time zone,
    actual_delivery_date timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    name character varying(100) NOT NULL,
    sku character varying(30) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quantity_in_stock integer NOT NULL,
    reorder_level integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    id uuid CONSTRAINT products_uuid_id_not_null NOT NULL,
    category_id uuid CONSTRAINT products_uuid_category_id_not_null NOT NULL,
    supplier_id uuid CONSTRAINT products_uuid_supplier_id_not_null NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    id uuid NOT NULL,
    purchase_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    order_date timestamp with time zone NOT NULL,
    expected_date timestamp with time zone,
    received_date timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revoked_tokens (
    id character varying(36) NOT NULL,
    jti character varying(36) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token_type character varying(20) NOT NULL
);


ALTER TABLE public.revoked_tokens OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    movement_type character varying(30) NOT NULL,
    reference_id uuid,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    name character varying(100) NOT NULL,
    contact_email character varying(100) NOT NULL,
    phone character varying(15),
    address character varying(255),
    created_at timestamp without time zone NOT NULL,
    id uuid CONSTRAINT suppliers_uuid_id_not_null NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description character varying(500),
    priority character varying(10) DEFAULT 'MEDIUM'::character varying NOT NULL,
    status character varying(15) DEFAULT 'PENDING'::character varying NOT NULL,
    due_date timestamp without time zone,
    assigned_to_id uuid NOT NULL,
    assigned_by_id uuid NOT NULL,
    target_type character varying(15),
    target_id uuid,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    id uuid CONSTRAINT users_uuid_id_not_null NOT NULL,
    manager_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
b937a37b254c
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (name, description, created_at, id, is_deleted) FROM stdin;
Consumer Electronics	Smartphones, tablets, and consumer gadgets	2026-07-13 15:35:38.093291	5a73e9c6-5d9e-4cd8-8169-81dce691269a	f
Computer Hardware	CPUs, GPUs, motherboards, RAM, and internal storage	2026-07-08 15:35:38.093291	d8b0f25a-e433-4537-8389-1e0c5f9448a3	f
Smart Home	Connected thermostats, smart locks, and automation sensors	2026-08-03 15:35:38.093291	269780fe-9ab5-473e-8011-43fbce43f983	f
Audio & Headphones	Studio monitors, noise-canceling headphones, and DACs	2026-07-01 15:35:38.093291	f90dfb73-4d11-47de-9e4d-b6e240cd46e9	f
Kitchen Appliances	Air fryers, espresso machines, blenders, and smart cookers	2026-07-12 15:35:38.093291	0e908e46-d634-4a7a-adf0-e1d5f5f02d0f	f
Office Supplies	Paper, ergonomic desk accessories, and organization tools	2026-07-29 15:35:38.093291	d9f2b7e7-7792-4312-b9f8-d1eac39a6e53	f
Industrial Tools	Power drills, angle grinders, meters, and work lights	2026-08-16 15:35:38.093291	2d87da35-7426-41e4-9a36-19f3b4d576a8	f
Wearable Tech	Smartwatches, fitness bands, and AR glasses	2026-08-03 15:35:38.093291	0b2cea31-6a0b-4b90-abc7-37cd01f02338	f
Automobile Parts	Sensors, LED headlights, OBD2 scanners, and spark plugs	2026-07-25 15:35:38.093291	5afa5eda-e9bf-4971-a80b-ba3c4baeda29	f
Lighting & Electrical	Commercial lighting fixtures, switches, and wiring	2026-07-09 15:35:38.093291	b1c60741-90ad-463d-a354-175a81eaeb39	f
Photography & Video	Mirrorless cameras, studio lighting, and lenses	2026-08-17 15:35:38.093291	3be303b0-839f-4276-b539-66a7bd98135e	f
Gaming & Consoles	Gaming consoles, controllers, VR headsets, and chairs	2026-07-05 15:35:38.093291	fc335f1b-0b15-41b0-b115-afb4ac068b85	f
Networking & Telecom	Enterprise routers, PoE switches, and WiFi 7 APs	2026-06-28 15:35:38.093291	4a47ee45-6626-44b9-ba0e-28e8b2f04273	f
Healthcare Devices	Digital pulse oximeters, smart scales, and thermometers	2026-07-27 15:35:38.093291	7186e535-1811-4952-93ed-31b1bc578099	f
Safety & Security	IP surveillance cameras, alarm hubs, and RFID locks	2026-08-12 15:35:38.093291	e3368267-c2ac-4428-969a-a216f78f0e18	f
Mobile Accessories	GaN fast chargers, magnetic cases, and braided cables	2026-08-08 15:35:38.093291	a30f83d9-d25d-4ecf-af03-2451ae1b6550	f
Lab Equipment	Precision digital scales, pipettes, and inspection scopes	2026-08-20 15:35:38.093291	fd71fc05-8486-4cee-a2f4-367dded92213	f
Furniture & Storage	Standing motorized desks, modular shelving, and drawer units	2026-08-13 15:35:38.093291	5949d526-b21b-4a0e-80af-887914f7120e	f
Packaging Supplies	Thermal label printers, bubble wrap, and packing boxes	2026-08-16 15:35:38.093291	c8b9d389-f236-4167-b589-6f72fbe54611	f
Power & Batteries	Lithium battery packs, solar inverters, and UPS systems	2026-08-10 15:35:38.093291	44edac49-e8c8-4c9b-9905-f2bcd41c119a	f
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, address, created_at, updated_at, residential_address, delivery_address) FROM stdin;
0cbf9091-856e-4032-942a-f218fbde395f	Acme Corporation	purchasing@acmecorp.com	212-555-0401	350 5th Ave, New York, NY 10118	2026-07-14 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	350 5th Ave, New York, NY 10118	350 5th Ave, New York, NY 10118
819e5a75-550c-44ef-b702-13db687f384e	Starlight Logistics LLC	orders@starlightlog.com	310-555-0402	1901 Ave of the Stars, Los Angeles, CA 90067	2026-07-23 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	1901 Ave of the Stars, Los Angeles, CA 90067	1901 Ave of the Stars, Los Angeles, CA 90067
61bcffa2-c762-406f-9d8a-c322f08f4d1b	Cyberdyne Systems	procure@cyberdyne.org	408-555-0403	10500 N De Anza Blvd, Cupertino, CA 95014	2026-07-17 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	10500 N De Anza Blvd, Cupertino, CA 95014	10500 N De Anza Blvd, Cupertino, CA 95014
daaa4d82-8686-4616-a2cd-06bc3efaad5d	Wayne Enterprises	procurement@waynecorp.com	312-555-0404	100 S Wacker Dr, Chicago, IL 60606	2026-07-21 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	100 S Wacker Dr, Chicago, IL 60606	100 S Wacker Dr, Chicago, IL 60606
32c43557-6fd0-44b0-aa8a-4f2a417b13da	Initech Solutions	accounts@initech.io	512-555-0405	401 Congress Ave, Austin, TX 78701	2026-06-16 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	401 Congress Ave, Austin, TX 78701	401 Congress Ave, Austin, TX 78701
f7e82ade-e791-404f-8a32-058c5a4e6cd9	Massive Dynamic	b2b@massivedynamic.com	617-555-0406	500 Boylston St, Boston, MA 02116	2026-07-09 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	500 Boylston St, Boston, MA 02116	500 Boylston St, Boston, MA 02116
c6a43621-6e9c-4f7c-87c9-eface26e02f6	Umbrella Labs Ltd	supply@umbrellalabs.co.uk	020-7123-0407	25 Bank St, Canary Wharf, London, UK	2026-08-20 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	25 Bank St, Canary Wharf, London, UK	25 Bank St, Canary Wharf, London, UK
6a4e63f9-3baf-42d2-b495-ded4ae30a338	Stark Tech Industries	purchasing@starktech.com	212-555-0408	200 Park Ave, New York, NY 10166	2026-07-14 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	200 Park Ave, New York, NY 10166	200 Park Ave, New York, NY 10166
4691e738-b8d3-4664-8ba1-22ba01705912	Hooli Cloud Services	inventory@hooli.com	650-555-0409	1600 Amphitheatre Pkwy, Mountain View, CA 94043	2026-08-11 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	1600 Amphitheatre Pkwy, Mountain View, CA 94043	1600 Amphitheatre Pkwy, Mountain View, CA 94043
e8902f1e-88d3-4124-87d0-2f8e8c509023	Pied Piper Storage	ops@piedpiper.com	415-555-0410	525 Market St, San Francisco, CA 94105	2026-07-18 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	525 Market St, San Francisco, CA 94105	525 Market St, San Francisco, CA 94105
e7edffdd-38ba-4330-b94f-88a340b5dd0f	E-Corp Global	orders@ecorpglobal.com	212-555-0411	135 E 57th St, New York, NY 10022	2026-06-19 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	135 E 57th St, New York, NY 10022	135 E 57th St, New York, NY 10022
19c16dd9-9218-46a6-8b46-dcd69fa1c8d3	Globex Corp	info@globexcorp.com	703-555-0412	8200 Greensboro Dr, McLean, VA 22102	2026-07-01 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	8200 Greensboro Dr, McLean, VA 22102	8200 Greensboro Dr, McLean, VA 22102
6a4032ed-365f-48bf-b1e0-08a70a09384e	Aperture Laboratories	supplies@aperture.com	216-555-0413	1100 Superior Ave, Cleveland, OH 44114	2026-08-08 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	1100 Superior Ave, Cleveland, OH 44114	1100 Superior Ave, Cleveland, OH 44114
8828ff36-036c-4495-8255-525f54c8c28b	Black Mesa Research	procure@blackmesa.gov	505-555-0414	White Sands Proving Ground, NM 88002	2026-07-18 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	White Sands Proving Ground, NM 88002	White Sands Proving Ground, NM 88002
685365b8-5e20-4496-abdf-1179b646225e	Wonka Confectionery Co	trade@wonka.com	012-1456-0415	Bournville Lane, Birmingham, UK	2026-08-22 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	Bournville Lane, Birmingham, UK	Bournville Lane, Birmingham, UK
ce80b838-ba01-4820-8d78-a5bf266e0f3f	Soylent Health Corp	supply@soylenthealth.com	415-555-0416	201 3rd St, San Francisco, CA 94103	2026-08-29 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	201 3rd St, San Francisco, CA 94103	201 3rd St, San Francisco, CA 94103
8b6ca833-3c67-4f1a-9c5b-db6fd294d134	Tyrell Bio-Robotics	orders@tyrellcorp.com	213-555-0417	400 S Hope St, Los Angeles, CA 90071	2026-08-15 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	400 S Hope St, Los Angeles, CA 90071	400 S Hope St, Los Angeles, CA 90071
ce17751b-586c-4a0f-b676-cfc69444a883	Weyland-Yutani Consort	freight@weyland.com	206-555-0418	1201 3rd Ave, Seattle, WA 98101	2026-06-26 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	1201 3rd Ave, Seattle, WA 98101	1201 3rd Ave, Seattle, WA 98101
235d493c-627d-41a0-9019-75b8bf92220c	Nakatomi Trading Plaza	operations@nakatomi.com	310-555-0419	2121 Ave of the Stars, Los Angeles, CA 90067	2026-08-15 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	2121 Ave of the Stars, Los Angeles, CA 90067	2121 Ave of the Stars, Los Angeles, CA 90067
8d40883c-77d1-4f97-b7ea-6b1df2b41fa0	Oscorp Manufacturing	procurement@oscorp.com	212-555-0420	767 5th Ave, New York, NY 10153	2026-09-02 15:35:38.093291+05:30	2026-09-23 15:35:38.093291+05:30	767 5th Ave, New York, NY 10153	767 5th Ave, New York, NY 10153
9ae5adbf-c685-4078-a963-102270bf25d6	grazia	grazia@gmail.com	8263571197	modipuram	2026-09-30 16:29:49.141221+05:30	2026-09-30 16:29:49.141237+05:30	modipuram	modipuram
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, unit_price, subtotal) FROM stdin;
f38b1a47-840c-4f9c-ae28-17fe777bc030	3334845a-29e3-49b6-8e57-76267667b7b2	6d74e92e-fd52-4ef4-9d41-d53e509b9e6f	3	299.99	899.97
dc372cc0-2428-4a24-8dfd-79a136b45312	7af90bcb-b0f5-4462-91ed-c48132c8cb1f	50bfd2ac-e2d7-48a1-a732-449c5336ad34	1	189.50	189.50
15e43c47-420b-4ac3-8b3a-666cd45a0785	1c94b0a8-5872-43e8-a5e1-3c3fcb622566	04dc2ad7-f4b5-49c6-84cc-37308d41db06	3	149.00	447.00
8a5d470d-72a2-4270-85b7-fefc01098214	28ff0003-6ec9-4aa9-9b5d-c3cc268909bc	96024aba-37ca-4fd9-9370-4d3df656150d	4	49.99	199.96
6400af45-57f1-49b1-b3fe-fae2e63d0f31	e5e9bbbc-214a-4e98-8439-74f46e0e4a56	260de49d-af22-4f74-92d7-b785630dce19	1	199.99	199.99
e6f59fb1-c49a-48ee-9932-5a1cde0ee218	2c59c1fa-41b0-47e1-b353-576ba6d4dcc6	aab472d5-4947-4289-997a-879049e2604e	4	249.00	996.00
d099d9ff-1026-4c6c-8254-09600662ff16	4abde21c-f82e-4fcf-b64c-baf584eddeab	911a711a-9fcc-49a8-807f-13bd5b4de022	3	129.50	388.50
423fbe2f-5a2d-4e39-b75d-2400344c9dd9	0ef894c6-f0be-4506-8969-6f03436fd78b	1dfadae5-f96b-4bcc-a6b6-cf9a2eb3f44e	4	179.00	716.00
98989ffe-130b-4aac-9800-95e669d235e0	16c35ecd-dce2-4927-bdab-e37992980dc4	d94e3765-a8f6-4f90-b726-c70b4eff0fae	4	215.00	860.00
2343976b-5f25-4bd3-8862-ac4ef904607a	0a3091bb-cbb8-4b2c-889c-7d510595d375	85b17d19-6f9a-4a51-85b0-8c86979bc459	3	389.99	1169.97
ba4b655c-6700-4579-a52d-1d8c7fcc5537	2ca19202-3fde-40bd-ab86-1ca3c348d582	40cdaef6-3eef-4bf7-9531-dcb5ce0d46a4	4	119.95	479.80
d32c49ae-0bcf-482a-8d41-dcfe6b8e5274	84d06b89-dff3-4898-904c-cba2e605efc9	a4097787-6d95-4e8b-84ad-b7368e38205c	3	279.00	837.00
107d2d8d-992f-4e55-831c-ef398fd6be81	2bb1d05c-c31c-44ce-8fcf-b8f7006f5103	5d18fc33-c0a0-4041-8e36-e4b225f43ac1	1	79.99	79.99
e655f19c-c47b-4c88-b9cd-15bc28d6de31	39f9e1b4-b133-4da4-a189-dd982c8eccab	205dd1a9-1a72-4f28-a8e1-2161cc7c9f65	3	159.00	477.00
8e03ebfa-562c-4339-b04d-794e053e6d8f	eb8c3bd2-cfc2-482f-b5f2-25f61b1c9dcc	fbcb5a6e-b3ee-41f3-b15b-43017a0f07f4	3	489.00	1467.00
80994a76-64ba-4df5-b99e-59971a17c852	568d4f01-f7cc-4d2e-952b-d921ebf63824	73db8b30-503f-46ca-b7e6-78bfcef49c02	2	169.00	338.00
559fa2ba-ad4c-4301-b8b3-1f5e61e042c5	9e2ce7a3-666f-473c-a8b3-e1e426b3e3e6	5903a979-ed3f-4b8d-bfb5-449cb30e76f0	1	59.99	59.99
037efc81-f70a-46d9-9e3a-d6f8461829a2	509cc15b-2793-407e-9ba0-20e2c41aea48	016c256e-23de-48de-8490-b26ec0e9a30d	4	229.00	916.00
7c44aa91-f638-4472-a7d8-b6e17c65ecd4	bb8e7d34-dd2f-4fd7-9b96-ed979c341519	20848029-ddec-4c4a-b026-50aaec63d1dd	4	89.50	358.00
9a8b29c9-6536-460e-a4f6-a6f46a9bfde8	f7f6727d-d10d-4c0c-94a1-35338a08df95	f0e71a4b-a6ca-456b-be8c-c95466dfc335	1	899.00	899.00
77b62fd8-e5dc-4f42-8526-b05022b7e163	9f419b21-4304-4369-a067-271e59ce0528	a4097787-6d95-4e8b-84ad-b7368e38205c	6	279.00	1674.00
15d5b9cd-b6e5-43db-b935-df10482625cd	32d38027-c7d8-46c7-9c65-6aa1078dbfb2	a4097787-6d95-4e8b-84ad-b7368e38205c	90	279.00	25110.00
cfa58587-d1ee-4527-b228-5d55ccfa71dd	82bb8466-79cc-4490-b7ff-8ac85c73a11a	b1906edd-4636-4018-9a3f-c5ac5ba2ca41	20	99.00	1980.00
\.


--
-- Data for Name: order_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_tracking (id, order_id, status, "timestamp", notes) FROM stdin;
3914f66b-a128-42fe-9c5e-5489c3208a18	3334845a-29e3-49b6-8e57-76267667b7b2	ORDER_PLACED	2026-09-22 22:35:38.093291+05:30	Scanned: Order is ORDER_PLACED at Fulfillment Hub.
73722757-682e-4f52-b78c-702754acc9e9	7af90bcb-b0f5-4462-91ed-c48132c8cb1f	CONFIRMED	2026-09-22 16:35:38.093291+05:30	Scanned: Order is CONFIRMED at Fulfillment Hub.
3e7aa502-57bb-4956-b9c3-1181c8dc3c83	1c94b0a8-5872-43e8-a5e1-3c3fcb622566	PROCESSING	2026-09-23 10:35:38.093291+05:30	Scanned: Order is PROCESSING at Fulfillment Hub.
7da1f9a5-7397-42f6-940c-d8382eaf295d	28ff0003-6ec9-4aa9-9b5d-c3cc268909bc	SHIPPED	2026-09-22 15:35:38.093291+05:30	Scanned: Order is SHIPPED at Fulfillment Hub.
9a5ee24d-655b-4555-a532-9909db36fe92	e5e9bbbc-214a-4e98-8439-74f46e0e4a56	DELIVERED	2026-09-22 13:35:38.093291+05:30	Scanned: Order is DELIVERED at Fulfillment Hub.
7cb6ccb8-6e9a-46fe-b10f-9e0bc0c81c8f	2c59c1fa-41b0-47e1-b353-576ba6d4dcc6	ORDER_PLACED	2026-09-22 23:35:38.093291+05:30	Scanned: Order is ORDER_PLACED at Fulfillment Hub.
50810f6a-1dc8-4c23-81f9-91907039557c	4abde21c-f82e-4fcf-b64c-baf584eddeab	PROCESSING	2026-09-22 15:35:38.093291+05:30	Scanned: Order is PROCESSING at Fulfillment Hub.
d2bce42f-13df-41d5-af18-5d07f4830594	0ef894c6-f0be-4506-8969-6f03436fd78b	SHIPPED	2026-09-22 13:35:38.093291+05:30	Scanned: Order is SHIPPED at Fulfillment Hub.
3b536bba-a9f2-43ba-a74f-0456484c44db	16c35ecd-dce2-4927-bdab-e37992980dc4	DELIVERED	2026-09-22 01:35:38.093291+05:30	Scanned: Order is DELIVERED at Fulfillment Hub.
8d3b48b5-3185-40db-a29b-69952263e755	0a3091bb-cbb8-4b2c-889c-7d510595d375	CONFIRMED	2026-09-23 11:35:38.093291+05:30	Scanned: Order is CONFIRMED at Fulfillment Hub.
98a9f687-7251-4556-900e-96b4f86805c7	2ca19202-3fde-40bd-ab86-1ca3c348d582	PROCESSING	2026-09-22 15:35:38.093291+05:30	Scanned: Order is PROCESSING at Fulfillment Hub.
746707f7-73ef-407c-8206-a48828d6d6ef	84d06b89-dff3-4898-904c-cba2e605efc9	SHIPPED	2026-09-21 18:35:38.093291+05:30	Scanned: Order is SHIPPED at Fulfillment Hub.
61ea4ae7-5ccd-4c96-bb1a-aad034822b00	2bb1d05c-c31c-44ce-8fcf-b8f7006f5103	DELIVERED	2026-09-22 20:35:38.093291+05:30	Scanned: Order is DELIVERED at Fulfillment Hub.
54415272-364b-4971-abdc-26a378908f0a	39f9e1b4-b133-4da4-a189-dd982c8eccab	ORDER_PLACED	2026-09-22 05:35:38.093291+05:30	Scanned: Order is ORDER_PLACED at Fulfillment Hub.
4461a66b-75c4-4ee5-8c97-416fa75b9dfa	eb8c3bd2-cfc2-482f-b5f2-25f61b1c9dcc	PROCESSING	2026-09-23 08:35:38.093291+05:30	Scanned: Order is PROCESSING at Fulfillment Hub.
6ae30b5c-0f18-478f-8c52-3c8a01807f38	568d4f01-f7cc-4d2e-952b-d921ebf63824	SHIPPED	2026-09-22 05:35:38.093291+05:30	Scanned: Order is SHIPPED at Fulfillment Hub.
151ae8ae-f262-40c1-b0f4-5308c14a02df	9e2ce7a3-666f-473c-a8b3-e1e426b3e3e6	DELIVERED	2026-09-21 19:35:38.093291+05:30	Scanned: Order is DELIVERED at Fulfillment Hub.
43fcaedf-9a80-4093-a977-a1917599c4bf	509cc15b-2793-407e-9ba0-20e2c41aea48	CONFIRMED	2026-09-22 15:35:38.093291+05:30	Scanned: Order is CONFIRMED at Fulfillment Hub.
aa82612c-a440-4f8f-8900-0ee69f1836a5	bb8e7d34-dd2f-4fd7-9b96-ed979c341519	PROCESSING	2026-09-22 19:35:38.093291+05:30	Scanned: Order is PROCESSING at Fulfillment Hub.
271536ed-1b4a-4fb7-8990-1fef91f17875	f7f6727d-d10d-4c0c-94a1-35338a08df95	DELIVERED	2026-09-21 19:35:38.093291+05:30	Scanned: Order is DELIVERED at Fulfillment Hub.
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, customer_id, order_date, status, total_amount, predicted_delivery_date, actual_delivery_date, created_at, updated_at) FROM stdin;
3334845a-29e3-49b6-8e57-76267667b7b2	0cbf9091-856e-4032-942a-f218fbde395f	2026-09-06 15:35:38.093291+05:30	ORDER_PLACED	899.97	2026-09-12 15:35:38.093291+05:30	\N	2026-09-06 15:35:38.093291+05:30	2026-09-08 14:35:38.093291+05:30
7af90bcb-b0f5-4462-91ed-c48132c8cb1f	819e5a75-550c-44ef-b702-13db687f384e	2026-08-24 15:35:38.093291+05:30	CONFIRMED	189.50	2026-08-28 15:35:38.093291+05:30	\N	2026-08-24 15:35:38.093291+05:30	2026-08-26 02:35:38.093291+05:30
4abde21c-f82e-4fcf-b64c-baf584eddeab	c6a43621-6e9c-4f7c-87c9-eface26e02f6	2026-08-26 15:35:38.093291+05:30	PROCESSING	388.50	2026-08-31 15:35:38.093291+05:30	\N	2026-08-26 15:35:38.093291+05:30	2026-08-27 07:35:38.093291+05:30
0a3091bb-cbb8-4b2c-889c-7d510595d375	e8902f1e-88d3-4124-87d0-2f8e8c509023	2026-09-21 15:35:38.093291+05:30	CONFIRMED	1169.97	2026-09-25 21:54:38.597747+05:30	\N	2026-09-21 15:35:38.093291+05:30	2026-09-28 16:20:13.865394+05:30
2c59c1fa-41b0-47e1-b353-576ba6d4dcc6	f7e82ade-e791-404f-8a32-058c5a4e6cd9	2026-09-15 15:35:38.093291+05:30	ORDER_PLACED	996.00	2026-09-19 22:02:25.750151+05:30	\N	2026-09-15 15:35:38.093291+05:30	2026-09-28 16:20:39.359885+05:30
39f9e1b4-b133-4da4-a189-dd982c8eccab	8828ff36-036c-4495-8255-525f54c8c28b	2026-09-01 15:35:38.093291+05:30	ORDER_PLACED	477.00	2026-09-06 15:35:38.093291+05:30	\N	2026-09-01 15:35:38.093291+05:30	2026-09-02 03:35:38.093291+05:30
82bb8466-79cc-4490-b7ff-8ac85c73a11a	9ae5adbf-c685-4078-a963-102270bf25d6	2026-09-30 16:32:05.395701+05:30	CONFIRMED	1980.00	2026-10-05 00:22:38.350108+05:30	\N	2026-09-30 16:32:05.395707+05:30	2026-09-30 16:32:27.555949+05:30
9e2ce7a3-666f-473c-a8b3-e1e426b3e3e6	8b6ca833-3c67-4f1a-9c5b-db6fd294d134	2026-09-13 15:35:38.093291+05:30	DELIVERED	59.99	2026-09-18 15:35:38.093291+05:30	2026-09-16 15:35:38.093291+05:30	2026-09-13 15:35:38.093291+05:30	2026-09-15 00:35:38.093291+05:30
509cc15b-2793-407e-9ba0-20e2c41aea48	ce17751b-586c-4a0f-b676-cfc69444a883	2026-09-12 15:35:38.093291+05:30	CONFIRMED	916.00	2026-09-18 15:35:38.093291+05:30	\N	2026-09-12 15:35:38.093291+05:30	2026-09-14 03:35:38.093291+05:30
2ca19202-3fde-40bd-ab86-1ca3c348d582	e7edffdd-38ba-4330-b94f-88a340b5dd0f	2026-09-06 15:35:38.093291+05:30	PROCESSING	479.80	2026-09-10 05:59:38.093291+05:30	\N	2026-09-06 15:35:38.093291+05:30	2026-10-01 15:04:10.49131+05:30
eb8c3bd2-cfc2-482f-b5f2-25f61b1c9dcc	685365b8-5e20-4496-abdf-1179b646225e	2026-09-09 15:35:38.093291+05:30	PROCESSING	1467.00	2026-09-13 05:02:02.093291+05:30	\N	2026-09-09 15:35:38.093291+05:30	2026-10-01 15:07:26.286981+05:30
9f419b21-4304-4369-a067-271e59ce0528	4691e738-b8d3-4664-8ba1-22ba01705912	2026-09-28 15:49:12.653368+05:30	AWAITING_STOCK	1674.00	2026-10-05 22:18:00.653368+05:30	\N	2026-09-28 15:49:12.653378+05:30	2026-10-01 15:10:57.34686+05:30
0ef894c6-f0be-4506-8969-6f03436fd78b	6a4e63f9-3baf-42d2-b495-ded4ae30a338	2026-08-28 15:35:38.093291+05:30	SHIPPED	716.00	2026-09-01 20:59:03.354521+05:30	\N	2026-08-28 15:35:38.093291+05:30	2026-09-23 16:29:38.873716+05:30
f7f6727d-d10d-4c0c-94a1-35338a08df95	8d40883c-77d1-4f97-b7ea-6b1df2b41fa0	2026-09-16 15:35:38.093291+05:30	DELIVERED	899.00	2026-09-27 01:42:56.557646+05:30	2026-09-20 15:35:38.093291+05:30	2026-09-16 15:35:38.093291+05:30	2026-09-23 16:29:48.963333+05:30
32d38027-c7d8-46c7-9c65-6aa1078dbfb2	4691e738-b8d3-4664-8ba1-22ba01705912	2026-09-28 15:50:17.956242+05:30	AWAITING_STOCK	25110.00	2026-10-05 21:07:05.956242+05:30	\N	2026-09-28 15:50:17.956256+05:30	2026-10-01 15:53:07.817317+05:30
84d06b89-dff3-4898-904c-cba2e605efc9	19c16dd9-9218-46a6-8b46-dcd69fa1c8d3	2026-09-14 15:35:38.093291+05:30	SHIPPED	837.00	2026-09-18 09:33:57.918578+05:30	\N	2026-09-14 15:35:38.093291+05:30	2026-09-24 11:11:24.424677+05:30
bb8e7d34-dd2f-4fd7-9b96-ed979c341519	235d493c-627d-41a0-9019-75b8bf92220c	2026-09-04 15:35:38.093291+05:30	PROCESSING	358.00	2026-09-08 17:56:46.409941+05:30	\N	2026-09-04 15:35:38.093291+05:30	2026-09-24 11:11:42.996668+05:30
28ff0003-6ec9-4aa9-9b5d-c3cc268909bc	daaa4d82-8686-4616-a2cd-06bc3efaad5d	2026-09-14 15:35:38.093291+05:30	OUT_FOR_DELIVERY	199.96	2026-09-18 22:02:08.28189+05:30	\N	2026-09-14 15:35:38.093291+05:30	2026-09-28 13:02:13.245496+05:30
1c94b0a8-5872-43e8-a5e1-3c3fcb622566	61bcffa2-c762-406f-9d8a-c322f08f4d1b	2026-09-08 15:35:38.093291+05:30	PROCESSING	447.00	2026-09-12 20:47:39.702788+05:30	\N	2026-09-08 15:35:38.093291+05:30	2026-09-28 13:06:13.013067+05:30
e5e9bbbc-214a-4e98-8439-74f46e0e4a56	32c43557-6fd0-44b0-aa8a-4f2a417b13da	2026-09-17 15:35:38.093291+05:30	DELIVERED	199.99	2026-09-22 11:54:19.248076+05:30	2026-09-20 15:35:38.093291+05:30	2026-09-17 15:35:38.093291+05:30	2026-09-28 13:06:43.895032+05:30
2bb1d05c-c31c-44ce-8fcf-b8f7006f5103	6a4032ed-365f-48bf-b1e0-08a70a09384e	2026-09-19 15:35:38.093291+05:30	DELIVERED	79.99	2026-09-24 13:00:31.87686+05:30	2026-09-25 15:35:38.093291+05:30	2026-09-19 15:35:38.093291+05:30	2026-09-28 14:56:13.86873+05:30
16c35ecd-dce2-4927-bdab-e37992980dc4	4691e738-b8d3-4664-8ba1-22ba01705912	2026-09-03 15:35:38.093291+05:30	DELIVERED	860.00	2026-09-07 20:51:27.078582+05:30	2026-09-07 15:35:38.093291+05:30	2026-09-03 15:35:38.093291+05:30	2026-09-28 14:56:24.77658+05:30
568d4f01-f7cc-4d2e-952b-d921ebf63824	ce80b838-ba01-4820-8d78-a5bf266e0f3f	2026-09-16 15:35:38.093291+05:30	DELIVERED	338.00	2026-09-20 23:05:21.201812+05:30	2026-09-28 15:01:26.151405+05:30	2026-09-16 15:35:38.093291+05:30	2026-09-28 15:01:45.165528+05:30
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (name, sku, unit_price, quantity_in_stock, reorder_level, is_active, created_at, updated_at, id, category_id, supplier_id) FROM stdin;
Pro Ultra Wireless Headphones	TECH-AUD-001	299.99	45	10	t	2026-08-24 15:35:38.093291	2026-09-23 15:35:38.093291	6d74e92e-fd52-4ef4-9d41-d53e509b9e6f	5a73e9c6-5d9e-4cd8-8169-81dce691269a	a01cc34e-1610-4ab9-b7dc-d2a544947260
ThunderBolt 4 Hub 12-in-1	TECH-HUB-002	189.50	8	15	t	2026-08-15 15:35:38.093291	2026-09-23 15:35:38.093291	50bfd2ac-e2d7-48a1-a732-449c5336ad34	d8b0f25a-e433-4537-8389-1e0c5f9448a3	ab37e1ee-fefe-4004-a156-d99202f0f821
Ergonomic Mechanical Keyboard	TECH-KBD-003	149.00	120	20	t	2026-09-01 15:35:38.093291	2026-09-23 15:35:38.093291	04dc2ad7-f4b5-49c6-84cc-37308d41db06	269780fe-9ab5-473e-8011-43fbce43f983	23ca417d-fe22-4419-b53b-df4560d23239
Smart Temperature Sensor Pack	SMART-SEN-004	49.99	250	30	t	2026-08-02 15:35:38.093291	2026-09-23 15:35:38.093291	96024aba-37ca-4fd9-9370-4d3df656150d	f90dfb73-4d11-47de-9e4d-b6e240cd46e9	9211b213-30f3-4f5c-8001-24c1aff83a7b
4K Cinema Streaming Webcam	TECH-CAM-005	199.99	3	10	t	2026-09-05 15:35:38.093291	2026-09-23 15:35:38.093291	260de49d-af22-4f74-92d7-b785630dce19	0e908e46-d634-4a7a-adf0-e1d5f5f02d0f	64c138cf-c29f-46f8-b835-a959fddcee13
Heavy-Duty Rotary Hammer Drill	TOOL-IND-006	249.00	35	8	t	2026-08-11 15:35:38.093291	2026-09-23 15:35:38.093291	aab472d5-4947-4289-997a-879049e2604e	d9f2b7e7-7792-4312-b9f8-d1eac39a6e53	c3453c37-a3a3-4e58-bb47-9eb04586475b
Precision Soldering Station Pro	TOOL-SOL-007	129.50	55	15	t	2026-09-07 15:35:38.093291	2026-09-23 15:35:38.093291	911a711a-9fcc-49a8-807f-13bd5b4de022	2d87da35-7426-41e4-9a36-19f3b4d576a8	bdc5a1cc-24e6-4960-a6bc-18c9f21dca93
Smart WiFi PoE Video Doorbell	SEC-CAM-008	179.00	60	12	t	2026-07-26 15:35:38.093291	2026-09-23 15:35:38.093291	1dfadae5-f96b-4bcc-a6b6-cf9a2eb3f44e	0b2cea31-6a0b-4b90-abc7-37cd01f02338	c78a6d45-e987-4d73-b295-9e2034f953fa
Cat6A 10Gbps Shielded Cable (1000ft)	NET-CBL-009	215.00	18	5	t	2026-08-30 15:35:38.093291	2026-09-23 15:35:38.093291	d94e3765-a8f6-4f90-b726-c70b4eff0fae	5afa5eda-e9bf-4971-a80b-ba3c4baeda29	30dc58bc-dd4a-47fe-af51-1a1519a909fe
Dual Band WiFi 7 Enterprise Router	NET-RTR-010	389.99	22	10	t	2026-09-04 15:35:38.093291	2026-09-23 15:35:38.093291	85b17d19-6f9a-4a51-85b0-8c86979bc459	b1c60741-90ad-463d-a354-175a81eaeb39	f39e60ab-822b-451a-8431-af189be1977e
Smart Air Fryer Digital XL 6Qt	APPL-KIT-011	119.95	40	15	t	2026-08-02 15:35:38.093291	2026-09-23 15:35:38.093291	40cdaef6-3eef-4bf7-9531-dcb5ce0d46a4	3be303b0-839f-4276-b539-66a7bd98135e	a8129de8-8e82-4315-a7bd-0af150fcb0df
Single-Dose Burr Coffee Grinder	APPL-COF-012	279.00	5	12	t	2026-08-23 15:35:38.093291	2026-09-23 15:35:38.093291	a4097787-6d95-4e8b-84ad-b7368e38205c	fc335f1b-0b15-41b0-b115-afb4ac068b85	4c4d1bc7-c561-415c-98f7-765733ac1ac4
GaN 140W USB-C Travel Charger	PWR-CHG-013	79.99	180	25	t	2026-08-26 15:35:38.093291	2026-09-23 15:35:38.093291	5d18fc33-c0a0-4041-8e36-e4b225f43ac1	4a47ee45-6626-44b9-ba0e-28e8b2f04273	2407dc13-1062-4342-91ee-0e788bcbf084
Heavy Duty Steel Wire Shelf 5-Tier	FURN-SHF-014	159.00	14	5	t	2026-08-08 15:35:38.093291	2026-09-23 15:35:38.093291	205dd1a9-1a72-4f28-a8e1-2161cc7c9f65	7186e535-1811-4952-93ed-31b1bc578099	65b78bf8-4783-45e3-baf0-fff330086e46
Motorized Dual-Motor Standing Desk	FURN-DSK-015	489.00	28	8	t	2026-08-17 15:35:38.093291	2026-09-23 15:35:38.093291	fbcb5a6e-b3ee-41f3-b15b-43017a0f07f4	e3368267-c2ac-4428-969a-a216f78f0e18	af692ae3-fd44-4f7b-a3cf-4cbf1eae0d00
Thermal Shipping Label Printer	PKG-PRN-016	169.00	62	15	t	2026-08-05 15:35:38.093291	2026-09-23 15:35:38.093291	73db8b30-503f-46ca-b7e6-78bfcef49c02	a30f83d9-d25d-4ecf-af03-2451ae1b6550	1075b297-9a36-4c60-9380-b78f3d06d08b
Biodegradable Bubble Mailers (500ct)	PKG-ENV-017	59.99	110	20	t	2026-08-23 15:35:38.093291	2026-09-23 15:35:38.093291	5903a979-ed3f-4b8d-bfb5-449cb30e76f0	fd71fc05-8486-4cee-a2f4-367dded92213	23a1931f-1237-426c-8eb8-cf53efc4b61a
Digital Lab Precision Scale 0.001g	LAB-SCL-019	89.50	42	10	t	2026-08-17 15:35:38.093291	2026-09-23 15:35:38.093291	20848029-ddec-4c4a-b026-50aaec63d1dd	c8b9d389-f236-4167-b589-6f72fbe54611	ca8bff69-46e2-43f3-8bd4-65015f163388
1000Wh Portable Solar Power Station	PWR-BAT-020	899.00	0	5	t	2026-08-14 15:35:38.093291	2026-09-23 15:35:38.093291	f0e71a4b-a6ca-456b-be8c-c95466dfc335	44edac49-e8c8-4c9b-9905-f2bcd41c119a	a1f87746-1422-43ea-accb-1af08e94238d
Hall Effect Keyboard	CB-GK-HE	3599.00	11	10	t	2026-09-23 16:22:00.748175	2026-09-23 16:22:00.748185	3a2796be-c439-4d46-a42f-13d78a1865ad	fc335f1b-0b15-41b0-b115-afb4ac068b85	c78a6d45-e987-4d73-b295-9e2034f953fa
Smart Fitness Heart-Rate Ring Band	WEAR-RNG-018	229.00	30	10	f	2026-08-28 15:35:38.093291	2026-09-24 11:59:44.432087	016c256e-23de-48de-8490-b26ec0e9a30d	5949d526-b21b-4a0e-80af-887914f7120e	8592de70-9ef9-4ee4-8ab5-7dd4fd8814cc
SAMPLE	SAM	99.00	50	10	t	2026-09-23 16:25:37.250006	2026-09-30 16:31:41.214401	b1906edd-4636-4018-9a3f-c5ac5ba2ca41	5949d526-b21b-4a0e-80af-887914f7120e	c78a6d45-e987-4d73-b295-9e2034f953fa
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, quantity) FROM stdin;
06b6d79d-8d84-4eb8-a526-8888e3c77645	b304aa5d-9009-4054-8331-0515169f989f	6d74e92e-fd52-4ef4-9d41-d53e509b9e6f	122
faa60c0d-6026-405d-a02d-f1a0f33a9547	632e09d1-12ae-49d2-bcac-fb34f0514ad8	50bfd2ac-e2d7-48a1-a732-449c5336ad34	184
7ff62c3e-1e79-4c40-84f5-b3244f44d3b4	d443a73a-d5de-4419-94d9-b82b73cecabb	04dc2ad7-f4b5-49c6-84cc-37308d41db06	191
5eae2201-517e-4ce3-9352-99d34ffd66f7	a9d46e00-422f-4717-9196-a5cd31934d40	96024aba-37ca-4fd9-9370-4d3df656150d	126
2f63e0e4-806c-49d8-a978-0afd6d81f18f	edfe763a-90e0-403d-adf6-fd0d02b5c46c	260de49d-af22-4f74-92d7-b785630dce19	154
a89f739a-26fc-47f9-9e41-f55f35bb52bb	7dac6468-4892-4182-a0c0-11836d676715	aab472d5-4947-4289-997a-879049e2604e	191
ba0b02ce-d3cb-4298-9c26-12154e786324	12552dea-bcd1-46e6-81b6-31383de075c4	911a711a-9fcc-49a8-807f-13bd5b4de022	133
9879f4c3-20d6-4462-bb5a-45db7b913ea6	8ecb7224-b744-4cdf-a502-b4802cab4940	1dfadae5-f96b-4bcc-a6b6-cf9a2eb3f44e	99
94c8d978-3d39-4fee-aa4a-fdbfb54a0b20	4f44c073-1e2c-45ff-8e4f-fb25545e4266	d94e3765-a8f6-4f90-b726-c70b4eff0fae	116
454d784a-7d64-4051-947f-64fb569e5b85	e96875e8-eb27-40dd-808e-7e809e01671e	85b17d19-6f9a-4a51-85b0-8c86979bc459	75
0158ad3a-29bd-4571-a904-486d0d3bf23a	fc4840e6-144a-4c66-a10d-85e2a9ba1b47	40cdaef6-3eef-4bf7-9531-dcb5ce0d46a4	63
ebc5aa65-4dbc-435b-a63f-bcc4ffcb85e4	f9c4e5ba-d057-4750-9151-c2b141481cf7	a4097787-6d95-4e8b-84ad-b7368e38205c	102
2c8583a0-17e8-407f-a2e2-36ca1926b974	569968fe-6dde-4c21-a5c8-6f34ff6265ef	5d18fc33-c0a0-4041-8e36-e4b225f43ac1	154
0e3c1341-f089-403e-848c-d8b44ae608da	e9a222bc-bb10-493d-834e-007e8197d7f3	205dd1a9-1a72-4f28-a8e1-2161cc7c9f65	164
b3b1d0c0-bb1c-411a-a176-dbb16560cb65	6e24ebaa-6376-4b4f-bf6f-0c8571321a89	fbcb5a6e-b3ee-41f3-b15b-43017a0f07f4	87
268fa065-f45c-43a6-98db-cda72e48dc97	cafa97cc-ceb9-44cf-ad92-5129ef04e448	73db8b30-503f-46ca-b7e6-78bfcef49c02	200
206b6eec-e957-406c-b26b-21e85cb8b696	cc120e23-4216-478a-b385-8d4b627053b9	5903a979-ed3f-4b8d-bfb5-449cb30e76f0	47
189a89c1-88c6-4bdc-890b-96e85e605887	2a3e8e3b-8841-47b0-a4a2-ecbc2a1ecb15	016c256e-23de-48de-8490-b26ec0e9a30d	35
142b7be3-be31-43c0-85ae-3ebad432e56c	58d45c1f-54e9-41bc-9fcd-20ffc09eb433	20848029-ddec-4c4a-b026-50aaec63d1dd	58
0a143494-e263-4f6f-abaa-ec0fd27069bd	843be252-fdcc-4c41-be1c-4553ab39bf77	f0e71a4b-a6ca-456b-be8c-c95466dfc335	87
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, supplier_id, status, order_date, expected_date, received_date, created_at, updated_at) FROM stdin;
b304aa5d-9009-4054-8331-0515169f989f	a01cc34e-1610-4ab9-b7dc-d2a544947260	CREATED	2026-08-11 15:35:38.093291+05:30	2026-08-19 15:35:38.093291+05:30	\N	2026-08-11 15:35:38.093291+05:30	2026-08-11 15:35:38.093291+05:30
632e09d1-12ae-49d2-bcac-fb34f0514ad8	ab37e1ee-fefe-4004-a156-d99202f0f821	ORDERED	2026-09-06 15:35:38.093291+05:30	2026-09-14 15:35:38.093291+05:30	\N	2026-09-06 15:35:38.093291+05:30	2026-09-06 15:35:38.093291+05:30
d443a73a-d5de-4419-94d9-b82b73cecabb	23ca417d-fe22-4419-b53b-df4560d23239	RECEIVED	2026-09-11 15:35:38.093291+05:30	2026-09-18 15:35:38.093291+05:30	2026-09-19 15:35:38.093291+05:30	2026-09-11 15:35:38.093291+05:30	2026-09-11 15:35:38.093291+05:30
a9d46e00-422f-4717-9196-a5cd31934d40	9211b213-30f3-4f5c-8001-24c1aff83a7b	CREATED	2026-08-16 15:35:38.093291+05:30	2026-08-23 15:35:38.093291+05:30	\N	2026-08-16 15:35:38.093291+05:30	2026-08-16 15:35:38.093291+05:30
edfe763a-90e0-403d-adf6-fd0d02b5c46c	64c138cf-c29f-46f8-b835-a959fddcee13	ORDERED	2026-08-26 15:35:38.093291+05:30	2026-09-08 15:35:38.093291+05:30	\N	2026-08-26 15:35:38.093291+05:30	2026-08-26 15:35:38.093291+05:30
7dac6468-4892-4182-a0c0-11836d676715	c3453c37-a3a3-4e58-bb47-9eb04586475b	RECEIVED	2026-09-03 15:35:38.093291+05:30	2026-09-13 15:35:38.093291+05:30	2026-09-09 15:35:38.093291+05:30	2026-09-03 15:35:38.093291+05:30	2026-09-03 15:35:38.093291+05:30
12552dea-bcd1-46e6-81b6-31383de075c4	bdc5a1cc-24e6-4960-a6bc-18c9f21dca93	CREATED	2026-09-06 15:35:38.093291+05:30	2026-09-20 15:35:38.093291+05:30	\N	2026-09-06 15:35:38.093291+05:30	2026-09-06 15:35:38.093291+05:30
8ecb7224-b744-4cdf-a502-b4802cab4940	c78a6d45-e987-4d73-b295-9e2034f953fa	ORDERED	2026-08-16 15:35:38.093291+05:30	2026-08-24 15:35:38.093291+05:30	\N	2026-08-16 15:35:38.093291+05:30	2026-08-16 15:35:38.093291+05:30
4f44c073-1e2c-45ff-8e4f-fb25545e4266	30dc58bc-dd4a-47fe-af51-1a1519a909fe	RECEIVED	2026-08-25 15:35:38.093291+05:30	2026-09-07 15:35:38.093291+05:30	2026-08-31 15:35:38.093291+05:30	2026-08-25 15:35:38.093291+05:30	2026-08-25 15:35:38.093291+05:30
e96875e8-eb27-40dd-808e-7e809e01671e	f39e60ab-822b-451a-8431-af189be1977e	CREATED	2026-08-10 15:35:38.093291+05:30	2026-08-23 15:35:38.093291+05:30	\N	2026-08-10 15:35:38.093291+05:30	2026-08-10 15:35:38.093291+05:30
fc4840e6-144a-4c66-a10d-85e2a9ba1b47	a8129de8-8e82-4315-a7bd-0af150fcb0df	ORDERED	2026-08-26 15:35:38.093291+05:30	2026-09-05 15:35:38.093291+05:30	\N	2026-08-26 15:35:38.093291+05:30	2026-08-26 15:35:38.093291+05:30
f9c4e5ba-d057-4750-9151-c2b141481cf7	4c4d1bc7-c561-415c-98f7-765733ac1ac4	RECEIVED	2026-08-20 15:35:38.093291+05:30	2026-08-31 15:35:38.093291+05:30	2026-08-28 15:35:38.093291+05:30	2026-08-20 15:35:38.093291+05:30	2026-08-20 15:35:38.093291+05:30
569968fe-6dde-4c21-a5c8-6f34ff6265ef	2407dc13-1062-4342-91ee-0e788bcbf084	CREATED	2026-08-28 15:35:38.093291+05:30	2026-09-09 15:35:38.093291+05:30	\N	2026-08-28 15:35:38.093291+05:30	2026-08-28 15:35:38.093291+05:30
e9a222bc-bb10-493d-834e-007e8197d7f3	65b78bf8-4783-45e3-baf0-fff330086e46	ORDERED	2026-08-25 15:35:38.093291+05:30	2026-09-08 15:35:38.093291+05:30	\N	2026-08-25 15:35:38.093291+05:30	2026-08-25 15:35:38.093291+05:30
6e24ebaa-6376-4b4f-bf6f-0c8571321a89	af692ae3-fd44-4f7b-a3cf-4cbf1eae0d00	RECEIVED	2026-09-07 15:35:38.093291+05:30	2026-09-14 15:35:38.093291+05:30	2026-09-17 15:35:38.093291+05:30	2026-09-07 15:35:38.093291+05:30	2026-09-07 15:35:38.093291+05:30
cafa97cc-ceb9-44cf-ad92-5129ef04e448	1075b297-9a36-4c60-9380-b78f3d06d08b	CREATED	2026-09-07 15:35:38.093291+05:30	2026-09-20 15:35:38.093291+05:30	\N	2026-09-07 15:35:38.093291+05:30	2026-09-07 15:35:38.093291+05:30
cc120e23-4216-478a-b385-8d4b627053b9	23a1931f-1237-426c-8eb8-cf53efc4b61a	ORDERED	2026-08-31 15:35:38.093291+05:30	2026-09-14 15:35:38.093291+05:30	\N	2026-08-31 15:35:38.093291+05:30	2026-08-31 15:35:38.093291+05:30
2a3e8e3b-8841-47b0-a4a2-ecbc2a1ecb15	8592de70-9ef9-4ee4-8ab5-7dd4fd8814cc	RECEIVED	2026-09-10 15:35:38.093291+05:30	2026-09-19 15:35:38.093291+05:30	2026-09-16 15:35:38.093291+05:30	2026-09-10 15:35:38.093291+05:30	2026-09-10 15:35:38.093291+05:30
58d45c1f-54e9-41bc-9fcd-20ffc09eb433	ca8bff69-46e2-43f3-8bd4-65015f163388	ORDERED	2026-08-21 15:35:38.093291+05:30	2026-08-30 15:35:38.093291+05:30	\N	2026-08-21 15:35:38.093291+05:30	2026-08-21 15:35:38.093291+05:30
843be252-fdcc-4c41-be1c-4553ab39bf77	a1f87746-1422-43ea-accb-1af08e94238d	RECEIVED	2026-08-14 15:35:38.093291+05:30	2026-08-24 15:35:38.093291+05:30	2026-08-25 15:35:38.093291+05:30	2026-08-14 15:35:38.093291+05:30	2026-08-14 15:35:38.093291+05:30
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revoked_tokens (id, jti, expires_at, token_type) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, product_id, quantity, movement_type, reference_id, created_at) FROM stdin;
9c492905-d680-4118-ae05-e500104025c8	6d74e92e-fd52-4ef4-9d41-d53e509b9e6f	36	IN	b304aa5d-9009-4054-8331-0515169f989f	2026-09-18 15:35:38.093291+05:30
5d911baf-d6a6-4684-b8f9-757afe75c959	50bfd2ac-e2d7-48a1-a732-449c5336ad34	78	OUT	7af90bcb-b0f5-4462-91ed-c48132c8cb1f	2026-09-10 15:35:38.093291+05:30
67fa3186-9b87-4be3-b7f2-188edc1b30d8	04dc2ad7-f4b5-49c6-84cc-37308d41db06	-2	ADJUSTMENT	d443a73a-d5de-4419-94d9-b82b73cecabb	2026-09-14 15:35:38.093291+05:30
743eaa47-29be-45d9-8659-d5cbac669b26	96024aba-37ca-4fd9-9370-4d3df656150d	68	IN	a9d46e00-422f-4717-9196-a5cd31934d40	2026-09-15 15:35:38.093291+05:30
34155850-4cc9-4556-9734-f30519dd6af1	260de49d-af22-4f74-92d7-b785630dce19	10	OUT	e5e9bbbc-214a-4e98-8439-74f46e0e4a56	2026-09-22 15:35:38.093291+05:30
30d5ff43-0509-4cfc-b1b0-e7af9b2c4b12	aab472d5-4947-4289-997a-879049e2604e	-2	ADJUSTMENT	7dac6468-4892-4182-a0c0-11836d676715	2026-09-09 15:35:38.093291+05:30
86856d68-4c0c-4f15-9e38-09dd334d1d4f	911a711a-9fcc-49a8-807f-13bd5b4de022	34	IN	12552dea-bcd1-46e6-81b6-31383de075c4	2026-09-04 15:35:38.093291+05:30
3b24ccb3-dae7-44ae-84fe-75b351c87591	1dfadae5-f96b-4bcc-a6b6-cf9a2eb3f44e	35	OUT	0ef894c6-f0be-4506-8969-6f03436fd78b	2026-09-07 15:35:38.093291+05:30
1f3ab630-c415-4220-9de3-25cc99f88f4b	d94e3765-a8f6-4f90-b726-c70b4eff0fae	-2	ADJUSTMENT	4f44c073-1e2c-45ff-8e4f-fb25545e4266	2026-09-11 15:35:38.093291+05:30
4e6930f0-d7ed-4ad9-a71c-e501ffdff8e7	85b17d19-6f9a-4a51-85b0-8c86979bc459	34	IN	e96875e8-eb27-40dd-808e-7e809e01671e	2026-09-20 15:35:38.093291+05:30
dc8ae05e-03c1-4019-aef6-c74b1cf82950	40cdaef6-3eef-4bf7-9531-dcb5ce0d46a4	79	OUT	2ca19202-3fde-40bd-ab86-1ca3c348d582	2026-09-18 15:35:38.093291+05:30
9dcc24d5-af82-488e-a783-e70eb73c1a60	a4097787-6d95-4e8b-84ad-b7368e38205c	3	ADJUSTMENT	f9c4e5ba-d057-4750-9151-c2b141481cf7	2026-09-11 15:35:38.093291+05:30
c9febad2-1103-4326-a302-02a556c0214b	5d18fc33-c0a0-4041-8e36-e4b225f43ac1	16	IN	569968fe-6dde-4c21-a5c8-6f34ff6265ef	2026-09-17 15:35:38.093291+05:30
b717ab6c-33d7-4399-b7fb-82bbd0fe94dc	205dd1a9-1a72-4f28-a8e1-2161cc7c9f65	41	OUT	39f9e1b4-b133-4da4-a189-dd982c8eccab	2026-09-17 15:35:38.093291+05:30
88892795-c20b-4cfb-b6cb-a04c669b78a1	fbcb5a6e-b3ee-41f3-b15b-43017a0f07f4	3	ADJUSTMENT	6e24ebaa-6376-4b4f-bf6f-0c8571321a89	2026-09-11 15:35:38.093291+05:30
47569802-f862-44f9-addd-924a8ea2fefd	73db8b30-503f-46ca-b7e6-78bfcef49c02	36	IN	cafa97cc-ceb9-44cf-ad92-5129ef04e448	2026-09-16 15:35:38.093291+05:30
9cfa64a4-9b97-4065-bc4d-c342050d3458	5903a979-ed3f-4b8d-bfb5-449cb30e76f0	39	OUT	9e2ce7a3-666f-473c-a8b3-e1e426b3e3e6	2026-09-08 15:35:38.093291+05:30
3fbf18d9-304d-4af8-9375-cc9b5a3a5473	016c256e-23de-48de-8490-b26ec0e9a30d	3	ADJUSTMENT	2a3e8e3b-8841-47b0-a4a2-ecbc2a1ecb15	2026-09-14 15:35:38.093291+05:30
a43ac070-0e16-437a-b3ad-96ee5dc7ebbf	20848029-ddec-4c4a-b026-50aaec63d1dd	71	IN	58d45c1f-54e9-41bc-9fcd-20ffc09eb433	2026-09-08 15:35:38.093291+05:30
5c5ba303-bcce-41fc-bd64-6735ea7bbbbe	f0e71a4b-a6ca-456b-be8c-c95466dfc335	34	OUT	f7f6727d-d10d-4c0c-94a1-35338a08df95	2026-09-20 15:35:38.093291+05:30
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (name, contact_email, phone, address, created_at, id, is_deleted) FROM stdin;
Apex Micro Technologies	contact@apexmicro.com	415-555-0101	100 Silicon Blvd, San Jose, CA	2026-07-07 15:35:38.093291	a01cc34e-1610-4ab9-b7dc-d2a544947260	f
Nexus Logistics & Hardware	procurement@nexuslog.com	206-555-0122	500 Harbor Way, Seattle, WA	2026-07-18 15:35:38.093291	ab37e1ee-fefe-4004-a156-d99202f0f821	f
Prime Circuit Works	sales@primecircuit.de	089-555-0133	Industriestr. 12, Munich, Germany	2026-08-04 15:35:38.093291	23ca417d-fe22-4419-b53b-df4560d23239	f
BlueSky Semiconductor	order@blueskysemi.tw	03-555-0144	88 Science Park Rd, Hsinchu, Taiwan	2026-07-23 15:35:38.093291	9211b213-30f3-4f5c-8001-24c1aff83a7b	f
Orion Global Supply	info@orionglobal.co.uk	020-7946-0155	45 Fleet Street, London, UK	2026-07-07 15:35:38.093291	64c138cf-c29f-46f8-b835-a959fddcee13	f
Zenith Precision Parts	supply@zenithparts.jp	03-5555-0166	2-1 Chiyoda, Tokyo, Japan	2026-06-02 15:35:38.093291	c3453c37-a3a3-4e58-bb47-9eb04586475b	f
Horizon Wholesale Corp	support@horizonwholesale.com	312-555-0177	300 Michigan Ave, Chicago, IL	2026-05-27 15:35:38.093291	bdc5a1cc-24e6-4960-a6bc-18c9f21dca93	f
Vertex Raw Materials	orders@vertexmat.com	713-555-0188	1200 Energy Corridor, Houston, TX	2026-06-28 15:35:38.093291	c78a6d45-e987-4d73-b295-9e2034f953fa	f
Summit Enterprise Components	sales@summitcomponents.com	617-555-0199	75 Innovation Way, Boston, MA	2026-06-16 15:35:38.093291	30dc58bc-dd4a-47fe-af51-1a1519a909fe	f
Titan Industrial Supply	hello@titansupply.com	404-555-0210	800 Peachtree St, Atlanta, GA	2026-06-29 15:35:38.093291	f39e60ab-822b-451a-8431-af189be1977e	f
Atlas Global Logistics	b2b@atlaslogistics.nl	020-555-0221	Keizersgracht 421, Amsterdam, Netherlands	2026-07-26 15:35:38.093291	a8129de8-8e82-4315-a7bd-0af150fcb0df	f
Sterling Device Goods	trade@sterlingdevices.com	512-555-0232	900 Congress Ave, Austin, TX	2026-07-21 15:35:38.093291	4c4d1bc7-c561-415c-98f7-765733ac1ac4	f
Matrix Display & Audio	sales@matrixaudio.kr	02-555-0243	Gangnam-daero 15, Seoul, South Korea	2026-08-14 15:35:38.093291	2407dc13-1062-4342-91ee-0e788bcbf084	f
Pioneer Commercial Trade	info@pioneertrade.sg	6789-0254	10 Marina Blvd, Singapore	2026-06-14 15:35:38.093291	65b78bf8-4783-45e3-baf0-fff330086e46	f
Vantage Assembly Corp	service@vantageassembly.ca	416-555-0265	200 Bay St, Toronto, Canada	2026-07-13 15:35:38.093291	af692ae3-fd44-4f7b-a3cf-4cbf1eae0d00	f
Beacon Industrial Robotics	contact@beaconrobotics.com	412-555-0276	600 Technology Dr, Pittsburgh, PA	2026-07-20 15:35:38.093291	1075b297-9a36-4c60-9380-b78f3d06d08b	f
Core Micro Silicon	orders@coremicro.com	503-555-0287	400 Sunset Hwy, Portland, OR	2026-05-26 15:35:38.093291	23a1931f-1237-426c-8eb8-cf53efc4b61a	f
Pacific Electronics Trade	info@pacificelec.com.au	02-5550-0298	100 George St, Sydney, Australia	2026-06-19 15:35:38.093291	8592de70-9ef9-4ee4-8ab5-7dd4fd8814cc	f
Nova Battery Solutions	b2b@novabatteries.com	720-555-0309	1500 Wynkoop St, Denver, CO	2026-06-22 15:35:38.093291	ca8bff69-46e2-43f3-8bd4-65015f163388	f
Quantum Power Systems	sales@quantumpower.ch	022-555-0310	Rue du Rhone 14, Geneva, Switzerland	2026-07-17 15:35:38.093291	a1f87746-1422-43ea-accb-1af08e94238d	f
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, priority, status, due_date, assigned_to_id, assigned_by_id, target_type, target_id, created_at, updated_at) FROM stdin;
b881197e-fb4e-4929-a787-437fd07b921a	Restock Required: Single-Dose Burr Coffee Grinder (Shortage: 85)	Order #32d38027 has a shortage of 85 units for 'Single-Dose Burr Coffee Grinder' (SKU: APPL-COF-012). Customer ordered 90, current warehouse stock is 5. Please place replenishment order with supplier.	HIGH	COMPLETED	\N	054e3715-12fa-48f5-96e6-d7892cf3f28e	e7a60375-1213-466a-9af5-888dc855906e	PRODUCT	a4097787-6d95-4e8b-84ad-b7368e38205c	2026-09-28 15:50:17.965095	2026-09-28 16:05:25.802961
eb4e26a3-5519-4d39-b136-e71618e827c4	create new sample product	\N	MEDIUM	COMPLETED	\N	f73fcd08-4a00-43ca-b6c9-20db269cdb5d	e7a60375-1213-466a-9af5-888dc855906e	PRODUCT	\N	2026-09-24 16:53:03.352406	2026-09-24 16:55:06.248716
36499e59-e6aa-4a55-92be-6ab87cb4f3f7	Restock Required: Single-Dose Burr Coffee Grinder (Shortage: 1)	Order #9f419b21 has a shortage of 1 units for 'Single-Dose Burr Coffee Grinder' (SKU: APPL-COF-012). Customer ordered 6, current warehouse stock is 5. Please place replenishment order with supplier.	HIGH	IN_PROGRESS	\N	054e3715-12fa-48f5-96e6-d7892cf3f28e	e7a60375-1213-466a-9af5-888dc855906e	PRODUCT	a4097787-6d95-4e8b-84ad-b7368e38205c	2026-09-28 15:49:12.680408	2026-09-28 16:05:27.896534
f2bfe5b6-d3bd-43e0-bf61-4a7562ac6c56	Restock Required: Single-Dose Burr Coffee Grinder (Shortage: 85)	\N	HIGH	COMPLETED	\N	f73fcd08-4a00-43ca-b6c9-20db269cdb5d	054e3715-12fa-48f5-96e6-d7892cf3f28e	PRODUCT	a4097787-6d95-4e8b-84ad-b7368e38205c	2026-09-28 16:01:55.360911	2026-09-28 16:04:35.095849
1715184d-5365-4c19-bed1-43a4ecc9692a	restock coffee grinder	\N	MEDIUM	IN_PROGRESS	\N	330a14bf-a691-4581-994c-2137c3de823d	054e3715-12fa-48f5-96e6-d7892cf3f28e	PRODUCT	a4097787-6d95-4e8b-84ad-b7368e38205c	2026-09-28 16:06:35.646466	2026-09-28 16:07:49.881523
7a4518ee-dfe2-4d5b-ac20-83e8d0c8ef2b	add category 	create magnetic items	LOW	IN_PROGRESS	2026-12-12 00:00:00	330a14bf-a691-4581-994c-2137c3de823d	054e3715-12fa-48f5-96e6-d7892cf3f28e	SUPPLIER	\N	2026-09-30 11:55:39.207347	2026-09-30 14:53:12.58608
c2b52321-844a-416f-889a-8e2b987abc4d	edit customer	\N	MEDIUM	PENDING	2026-10-01 00:00:00	3dfd5ca2-5513-42f1-ab1e-db855bee7f7b	599d2937-185d-4a73-9c4f-5fba28f51870	CUSTOMER	19c16dd9-9218-46a6-8b46-dcd69fa1c8d3	2026-09-30 15:45:17.540486	2026-09-30 15:45:17.540495
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (username, email, password_hash, role, id, manager_id) FROM stdin;
hailey	hailey@yahoo.com	$2b$12$sPrE.fZsExIlOoBxympT8.3VQx6HW81valqRDYAk7T13CFeoA8WaW	SUPER_ADMIN	e7a60375-1213-466a-9af5-888dc855906e	\N
benny	benny@gmail.com	$2b$12$AX5F99baK/8X1n1KD2Za/u1NKr0McGTSvdsBdlFlf7moqkFPfHSDi	INVENTORY_MANAGER	054e3715-12fa-48f5-96e6-d7892cf3f28e	\N
justin	justin@gmail.com	$2b$12$7THhSMKe8x40pA/6mVufN.ZUBTwkaUTIiVe/nnNIwiLPGDrwUux7O	ORDER_MANAGER	599d2937-185d-4a73-9c4f-5fba28f51870	\N
dustin	dustin@gmail.com	$2b$12$kzzGtMacm4ppIFmgoizrNuGBKn4TuYKlnr4lbDQ5LO.BGMvLOhbi.	INVENTORY_STAFF	f73fcd08-4a00-43ca-b6c9-20db269cdb5d	054e3715-12fa-48f5-96e6-d7892cf3f28e
selena	selena@gmail.com	$2b$12$MHxDB/jXzgtpPda1m4wN/u.0.mVdGEaiayTXkZhqkjllkzsDVJS/.	INVENTORY_STAFF	330a14bf-a691-4581-994c-2137c3de823d	054e3715-12fa-48f5-96e6-d7892cf3f28e
el	el@gmail.com	$2b$12$tOxuosMWOWfQl0QV7v3yeuyuu.uC0U6i/xD1lyHnHLUee3YcFsLqC	INVENTORY_MANAGER	9f1648f5-2057-4638-8232-9cec305570c9	\N
kendall	kendall@gmail.com	$2b$12$CYthSQh3aLkbEiZAiasbseHLNnX4VL75OUzSUIE5qW5lN3U7nY7u2	ORDER_STAFF	3dfd5ca2-5513-42f1-ab1e-db855bee7f7b	599d2937-185d-4a73-9c4f-5fba28f51870
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_jti_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_jti_key UNIQUE (jti);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_order_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_items_id ON public.order_items USING btree (id);


--
-- Name: ix_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: ix_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: ix_order_tracking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_tracking_id ON public.order_tracking USING btree (id);


--
-- Name: ix_order_tracking_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_tracking_order_id ON public.order_tracking USING btree (order_id);


--
-- Name: ix_orders_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_purchase_order_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_order_items_id ON public.purchase_order_items USING btree (id);


--
-- Name: ix_purchase_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_order_items_product_id ON public.purchase_order_items USING btree (product_id);


--
-- Name: ix_purchase_order_items_purchase_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_order_items_purchase_order_id ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: ix_purchase_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_orders_id ON public.purchase_orders USING btree (id);


--
-- Name: ix_purchase_orders_supplier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);


--
-- Name: ix_stock_movements_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_movements_id ON public.stock_movements USING btree (id);


--
-- Name: ix_stock_movements_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_movements_product_id ON public.stock_movements USING btree (product_id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_tasks_assigned_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_assigned_by_id ON public.tasks USING btree (assigned_by_id);


--
-- Name: ix_tasks_assigned_to_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_assigned_to_id ON public.tasks USING btree (assigned_to_id);


--
-- Name: ix_tasks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_id ON public.tasks USING btree (id);


--
-- Name: ix_tasks_target_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_target_id ON public.tasks USING btree (target_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_manager_id ON public.users USING btree (manager_id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_tracking order_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: tasks tasks_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict i2QFPX3G2kui1kuDhQ4VKWn0HXHce3YSG7d4z1gDeCNL0J84XFs3QSb3F54SSA0

