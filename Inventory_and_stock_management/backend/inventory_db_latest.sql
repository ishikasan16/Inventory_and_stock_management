--
-- PostgreSQL database dump
--

\restrict 3UwVkxZXRStLwZ5kKg5YPFXzDesNsnleCUFIUU2zmRhUmyhEeA7yTbuCOK60MJ4

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
    id uuid NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

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
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    supplier_id uuid NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

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
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    name character varying(100) NOT NULL,
    contact_email character varying(100) NOT NULL,
    phone character varying(15),
    address character varying(255),
    created_at timestamp without time zone NOT NULL,
    id uuid NOT NULL,
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
    id uuid NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
5960cfc355e2
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (name, description, created_at, id, is_deleted) FROM stdin;
Footwear	\N	2026-08-26 17:19:19.253331	533a15dd-5c2d-4037-81f4-de00b87e68a2	f
Clothes	Things to wear on your body	2026-08-27 10:07:08.978267	ff848db9-35d3-4085-a45f-95aa4aee11bb	f
Cosmetics	such as lipstck,foundation, concealor ,and skincare items.	2026-08-27 10:11:05.528518	6227c031-67ac-497d-9c8a-8caf5f6f6e5a	f
Automobile	vehicles	2026-09-15 14:39:09.361024	4ab8dfaf-9e32-43c1-8803-6ccda8eabe0e	t
electronic appliances	Electronic items	2026-08-25 10:49:34.322885	03d644b2-c214-48f3-9863-bb77aa3ab55b	t
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (name, sku, unit_price, quantity_in_stock, reorder_level, is_active, created_at, updated_at, id, category_id, supplier_id) FROM stdin;
fridge	sam928	199222.00	3	2	t	2026-08-27 11:19:09.31997	2026-08-27 11:19:09.319973	733784bb-7a4b-45fa-a9c8-f23677d3a141	03d644b2-c214-48f3-9863-bb77aa3ab55b	8ff19537-9752-4646-8a4f-bc947fed6ce0
Perfume	perf28	90000.00	0	0	t	2026-08-27 11:26:53.694581	2026-08-27 11:26:53.694585	2ff6766a-79cd-4561-87f7-963ff83db300	6227c031-67ac-497d-9c8a-8caf5f6f6e5a	59d630ec-3ef8-4ab3-a347-61a9207ce32a
Voltas	Voltas-12	10000.00	88	10	t	2026-08-25 10:56:19.715955	2026-09-03 15:58:59.537589	795403a1-d553-4e05-bf3b-b0c2b426d723	03d644b2-c214-48f3-9863-bb77aa3ab55b	8ff19537-9752-4646-8a4f-bc947fed6ce0
Nike AF1	AF-1uy7	10099.00	32	100000	f	2026-08-27 10:16:39.613873	2026-09-10 15:46:08.275383	202249e5-827c-471d-af48-b6c6c78da763	533a15dd-5c2d-4037-81f4-de00b87e68a2	dae3c283-d7bc-4871-9d4d-dab61892619a
Lip tint	tint28	13378.00	19	237	f	2026-08-27 11:25:02.325454	2026-09-10 15:47:16.901686	2ecc8361-85df-4d55-b4e2-e71a69c14fb9	6227c031-67ac-497d-9c8a-8caf5f6f6e5a	59d630ec-3ef8-4ab3-a347-61a9207ce32a
Skirt	sgh-0	9009.00	200	10	f	2026-08-27 11:35:54.218813	2026-09-10 15:49:03.056586	e1b116a4-e272-4e22-9e8c-7b098d72b062	ff848db9-35d3-4085-a45f-95aa4aee11bb	5c49dc7f-dea3-4382-9b4f-06a0f2c825c2
lip balm	SKU-101	1299.00	12	0	t	2026-09-16 10:25:29.042062	2026-09-16 10:25:29.042062	d376a912-546a-4923-8615-e1a4ccc7d0eb	6227c031-67ac-497d-9c8a-8caf5f6f6e5a	59d630ec-3ef8-4ab3-a347-61a9207ce32a
T shirt	HM928	1321.00	10	10	t	2026-08-27 11:23:27.918025	2026-09-16 10:25:58.81737	942c6859-3af0-451b-a7d7-f21111d25b34	ff848db9-35d3-4085-a45f-95aa4aee11bb	c66934cb-26bd-4762-9561-0e39fb912518
Chic bowler bag	hiz-09	9000999.00	90000	1000	f	2026-08-27 11:30:18.33483	2026-09-16 10:26:35.947996	d8281ad9-3f59-4476-885c-81602bb7d46d	6227c031-67ac-497d-9c8a-8caf5f6f6e5a	d1b5bd18-55f3-4434-994c-e58f1112087a
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revoked_tokens (id, jti, expires_at, token_type) FROM stdin;
0023e4b0-dfd1-4e96-ae8d-7478a6852d6a	e0566861-944f-4102-bd82-e3423b72c233	2026-09-15 15:38:15+05:30	access
14dbb0e2-c1c7-42b5-b6d8-61aa39f3de89	593d289c-4125-4407-9d27-691d575d0f4b	2026-09-22 14:38:15+05:30	refresh
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (name, contact_email, phone, address, created_at, id, is_deleted) FROM stdin;
ABC_pvt_ltd	abc@example.com	3746282382	london	2026-08-25 10:55:22.170831	8ff19537-9752-4646-8a4f-bc947fed6ce0	f
Nike	user123@example.com	7364878233	America	2026-08-27 10:12:55.247957	dae3c283-d7bc-4871-9d4d-dab61892619a	f
samsung	sanr@example.com	8268899944	kolkata	2026-08-27 11:15:50.450422	25121ee8-0cf4-4e0b-acb0-a2b32fbc9f5b	f
H & M	HM@example.com	4762787122	UK	2026-08-27 11:21:41.007726	c66934cb-26bd-4762-9561-0e39fb912518	f
DIOR	DIOR@example.com	4762783322	FRANCE	2026-08-27 11:24:06.946668	59d630ec-3ef8-4ab3-a347-61a9207ce32a	f
Chanel	ch@example.com	4762783002	paris	2026-08-27 11:29:03.398177	d1b5bd18-55f3-4434-994c-e58f1112087a	f
Volchok	vikchk@example.com	47628882	Russia	2026-08-27 11:33:57.708053	5c49dc7f-dea3-4382-9b4f-06a0f2c825c2	f
jakson	jakson@gmail.com	5973053809	nsez	2026-09-08 13:30:39.605071	bf18376c-50bf-4a24-b24c-17ebad34f565	f
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, priority, status, due_date, assigned_to_id, assigned_by_id, target_type, target_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (username, email, password_hash, role, id) FROM stdin;
ishu	ishika@yahoo.com	$2b$12$UrS/faqclRNgFNbIrPMo/eAvnq4px/HQ07bkEaaxa4qAOWdbZpiz6	STAFF	f81f263a-76f8-44bf-a08c-be87f930fcd7
yuvi	yuvi@gmail.com	$2b$12$Cgu4Y9oq4aIII4qgzTsWQO7Iwle5rwJAks0yv7CHN1S7ikM9gNVAO	ADMIN	c328e63a-9c64-4cab-a9a1-100d9e07c0b0
Priyanka	priyankaka@admin.com	$2b$12$1JHPx9wCjztt7v41FpxsreQXTtVpdlmQFgmrCAe.7jM5X4.5GafWC	ADMIN	21e2fa8b-abcb-467f-8683-2b47fab3158d
Priyanka Kanwal	priyanka@gmai.com	$2b$12$CgCdFaAHHJ0HuF8yXBSiNuthrLh6SZOicGLoRHYchSYIYr/cIR8sq	STAFF	7e6f1556-d87d-4b40-95ea-e606fd51fd0d
Bhavya	bhavi@gmail.com	$2b$12$iDvow9FVVkqOlo/2gVjm2OKTYbMr8F6EMspRsIwx.f4lL.N8CfXu.	SUPER_ADMIN	149d6492-ba9d-47bf-b160-06f4358b2c01
bhavya	bhavya@test.com	$2b$12$fkF7a7zIrRqCAAClZyuZ6uCrv.20i6RK6iNE8cqh9TBFN3lXuJ8Qq	SUPER_ADMIN	855b2dc4-d987-44b7-a67c-fe3c8f82057b
mgr_admin	mgr_admin@test.com	$2b$12$fkF7a7zIrRqCAAClZyuZ6uCrv.20i6RK6iNE8cqh9TBFN3lXuJ8Qq	ADMIN_MANAGER	779caa89-5311-42a5-89c1-1237f2544644
mgr_staff	mgr_staff@test.com	$2b$12$fkF7a7zIrRqCAAClZyuZ6uCrv.20i6RK6iNE8cqh9TBFN3lXuJ8Qq	STAFF_MANAGER	fed91cd2-dd0c-4ce3-bfbb-987a549c5b09
admin1	admin1@test.com	$2b$12$fkF7a7zIrRqCAAClZyuZ6uCrv.20i6RK6iNE8cqh9TBFN3lXuJ8Qq	ADMIN	5c5d5fc1-49f9-4898-9ffb-06fd9aef111d
staff1	staff1@test.com	$2b$12$fkF7a7zIrRqCAAClZyuZ6uCrv.20i6RK6iNE8cqh9TBFN3lXuJ8Qq	STAFF	7f29d703-88d6-4ec8-bdbf-c8e4623e9816
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
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


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
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


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
-- PostgreSQL database dump complete
--

\unrestrict 3UwVkxZXRStLwZ5kKg5YPFXzDesNsnleCUFIUU2zmRhUmyhEeA7yTbuCOK60MJ4

