--
-- PostgreSQL database dump
--

\restrict Ra4CGyhlox1sFD5dMUE5Fgwo2t57iFSxoW48H91o5Bwc3d3ZDfa88WWoPPVlzDz

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

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


--
-- Name: occupants_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.occupants_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.unit_no, '')), 'C');
  RETURN NEW;
END
$$;


ALTER FUNCTION public.occupants_search_vector_update() OWNER TO postgres;

--
-- Name: properties_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.properties_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.gps_code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.type, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.district, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$;


ALTER FUNCTION public.properties_search_vector_update() OWNER TO postgres;

--
-- Name: units_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.units_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.unit_no, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.type, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.status, '')), 'B');
  RETURN NEW;
END
$$;


ALTER FUNCTION public.units_search_vector_update() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    admin_email character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    detail jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_audit_log OWNER TO postgres;

--
-- Name: admin_impersonation_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_impersonation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    admin_email character varying(255) NOT NULL,
    target_tenant_id character varying(100) NOT NULL,
    target_user_id uuid NOT NULL,
    target_user_email character varying(255),
    reason text,
    impersonated_at timestamp with time zone DEFAULT now() NOT NULL,
    token_expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_impersonation_log OWNER TO postgres;

--
-- Name: admin_message_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_message_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_type character varying(20) NOT NULL,
    subject character varying(500) NOT NULL,
    body_preview text,
    recipient_count integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    sent_by character varying(255),
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_message_log OWNER TO postgres;

--
-- Name: advance_rents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advance_rents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    occupant_id uuid NOT NULL,
    unit_id uuid,
    property_id uuid,
    total_amount numeric(15,2) NOT NULL,
    monthly_rent numeric(15,2) NOT NULL,
    months_covered integer NOT NULL,
    remaining_balance numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    payment_method character varying(30),
    payment_reference character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    failure_origin character varying(32)
);


ALTER TABLE public.advance_rents OWNER TO postgres;

--
-- Name: COLUMN advance_rents.failure_origin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.advance_rents.failure_origin IS 'Why this advance stopped being PENDING: LANDLORD_CANCELLED (the landlord abandoned the request) or PAYMENT_UNCONFIRMED (declined, or written off while unresolved). Decides whether a stranded gateway payment behind it may be settled by crediting the landlord.';


--
-- Name: agent_commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    agent_id uuid NOT NULL,
    property_id uuid,
    unit_id uuid,
    occupant_id uuid,
    invoice_id uuid,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    commission_date date NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.agent_commissions OWNER TO postgres;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50) NOT NULL,
    gender character varying(20),
    date_of_birth date,
    ghana_card_number character varying(100),
    location character varying(255),
    avatar_url character varying(500),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    commission_type character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    commission_rate numeric(10,4) DEFAULT 10.0000 NOT NULL,
    primary_guarantor character varying(255),
    primary_guarantor_phone character varying(50),
    secondary_guarantor character varying(255),
    secondary_guarantor_phone character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: agreements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agreements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    agreement_number character varying(50) NOT NULL,
    type character varying(20) DEFAULT 'LEASE'::character varying NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    occupant_id uuid,
    property_id uuid,
    unit_id uuid,
    occupant_name character varying(255),
    property_name character varying(255),
    unit_no character varying(50),
    start_date date NOT NULL,
    end_date date NOT NULL,
    signed_date date,
    rent numeric(12,2),
    security_deposit numeric(12,2),
    late_fee numeric(12,2),
    total_amount numeric(12,2),
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    payment_frequency character varying(20) DEFAULT 'MONTHLY'::character varying NOT NULL,
    duration character varying(100),
    terms text,
    conditions text,
    renewal_options text,
    document_url character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    subletting_allowed boolean,
    pets_allowed boolean,
    noise_restrictions_apply boolean,
    notice_period_days integer,
    early_termination_allowed boolean,
    witness_name character varying(255),
    previous_agreement_id uuid,
    renewal_decision character varying(12),
    renewal_decided_at timestamp without time zone,
    renewal_notes text,
    CONSTRAINT ck_agreement_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'EXPIRED'::character varying, 'TERMINATED'::character varying])::text[]))),
    CONSTRAINT ck_agreement_type CHECK (((type)::text = ANY ((ARRAY['LEASE'::character varying, 'CONTRACT'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT ck_payment_freq CHECK (((payment_frequency)::text = ANY ((ARRAY['MONTHLY'::character varying, 'QUARTERLY'::character varying, 'YEARLY'::character varying, 'ONE_TIME'::character varying])::text[])))
);


ALTER TABLE public.agreements OWNER TO postgres;

--
-- Name: caution_fee_deductions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caution_fee_deductions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caution_fee_id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL,
    reason character varying(30) DEFAULT 'OTHER'::character varying NOT NULL,
    description text,
    deducted_at date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    inspection_id uuid
);


ALTER TABLE public.caution_fee_deductions OWNER TO postgres;

--
-- Name: caution_fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caution_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    occupant_id uuid NOT NULL,
    unit_id uuid,
    property_id uuid,
    amount numeric(15,2) NOT NULL,
    total_deductions numeric(15,2) DEFAULT 0 NOT NULL,
    refund_amount numeric(15,2),
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    status character varying(30) DEFAULT 'HELD'::character varying NOT NULL,
    payment_method character varying(30),
    payment_reference character varying(100),
    collected_at date DEFAULT CURRENT_DATE NOT NULL,
    refunded_at date,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.caution_fees OWNER TO postgres;

--
-- Name: communications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    subject character varying(500) NOT NULL,
    from_name character varying(255) NOT NULL,
    to_name character varying(255) NOT NULL,
    message text NOT NULL,
    comm_date date NOT NULL,
    type character varying(50) DEFAULT 'message'::character varying NOT NULL,
    status character varying(50) DEFAULT 'sent'::character varying NOT NULL,
    occupant_id uuid,
    occupant_name character varying(255),
    property_id uuid,
    property_name character varying(500),
    unit_id uuid,
    unit_no character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.communications OWNER TO postgres;

--
-- Name: direct_job_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direct_job_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occupant_id uuid NOT NULL,
    maintainer_id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    category character varying(120),
    description text NOT NULL,
    preferred_timing character varying(255),
    city character varying(120),
    region character varying(120),
    status character varying(32) DEFAULT 'SENT'::character varying NOT NULL,
    response_token_hash character varying(64) NOT NULL,
    response_token_expires_at timestamp without time zone NOT NULL,
    decline_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    responded_at timestamp without time zone,
    completed_at timestamp without time zone,
    maintainer_notified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.direct_job_requests OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    document_type character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reject_reason text,
    occupant_id uuid,
    occupant_name character varying(500),
    property_id uuid,
    property_name character varying(500),
    unit_id uuid,
    unit_no character varying(100),
    file_url text,
    file_name character varying(500),
    file_id character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    agreement_id uuid,
    agreement_number character varying(100)
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: expense_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    item character varying(255) NOT NULL,
    category character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_expense_config_category CHECK (((category IS NULL) OR ((category)::text = ANY ((ARRAY['ADMINISTRATIVE'::character varying, 'OCCUPANCY'::character varying, 'MAINTENANCE'::character varying, 'UTILITIES'::character varying, 'OTHER'::character varying])::text[]))))
);


ALTER TABLE public.expense_configs OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    item character varying(255) NOT NULL,
    expense_config_id uuid,
    property_id uuid,
    unit_id uuid,
    date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    responsibility character varying(20) DEFAULT 'OWNER'::character varying NOT NULL,
    status character varying(20) DEFAULT 'UNPAID'::character varying NOT NULL,
    description text,
    image_url character varying(512),
    image_file_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    maintenance_request_id uuid,
    CONSTRAINT ck_expense_responsibility CHECK (((responsibility)::text = ANY ((ARRAY['OWNER'::character varying, 'TENANT'::character varying])::text[]))),
    CONSTRAINT ck_expense_status CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'UNPAID'::character varying, 'PENDING'::character varying])::text[])))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: gateway_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gateway_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    gateway_name character varying(50) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_live boolean DEFAULT false NOT NULL,
    config text DEFAULT '{}'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    purpose character varying(30) DEFAULT 'RENT'::character varying NOT NULL
);


ALTER TABLE public.gateway_configs OWNER TO postgres;

--
-- Name: global_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    password_hash character varying(255),
    full_name character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    first_time_login boolean DEFAULT false NOT NULL,
    phone_number character varying(30),
    phone_verified_at timestamp with time zone,
    CONSTRAINT chk_global_users_reachable CHECK (((email IS NOT NULL) OR (phone_number IS NOT NULL)))
);


ALTER TABLE public.global_users OWNER TO postgres;

--
-- Name: COLUMN global_users.phone_verified_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.global_users.phone_verified_at IS 'Source of truth for a verified phone. Mirrored to users.phone_verified_at for every linked workspace row. Does NOT make GLOBAL_USER a valid OtpChannelResolver principal.';


--
-- Name: guarantors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guarantors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    occupant_id uuid NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    phone character varying(50),
    email character varying(255),
    relationship character varying(50) DEFAULT 'OTHER'::character varying NOT NULL,
    employer_name character varying(255),
    job_title character varying(255),
    work_address text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.guarantors OWNER TO postgres;

--
-- Name: inspection_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspection_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inspection_id uuid NOT NULL,
    tenant_id character varying(100) NOT NULL,
    room character varying(50) NOT NULL,
    item_name character varying(100) NOT NULL,
    condition character varying(20),
    notes text,
    photos text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inspection_items OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    invoice_number character varying(50) NOT NULL,
    occupant_id uuid,
    property_id uuid,
    unit_id uuid,
    occupant_name character varying(255),
    occupant_email character varying(255),
    property_name character varying(255),
    unit_no character varying(50),
    invoice_month character varying(7),
    issued_date date NOT NULL,
    due_date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    invoice_type character varying(100),
    description text,
    invoice_items text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    advance_rent_id uuid,
    agreement_id uuid,
    CONSTRAINT ck_invoice_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING'::character varying, 'PARTIAL'::character varying, 'PAID'::character varying, 'OVERDUE'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: late_fee_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.late_fee_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    fee_date date NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.late_fee_logs OWNER TO postgres;

--
-- Name: learned_localities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learned_localities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(64) NOT NULL,
    name character varying(160) NOT NULL,
    name_key character varying(160) NOT NULL,
    region character varying(64) NOT NULL,
    district character varying(64) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.learned_localities OWNER TO postgres;

--
-- Name: TABLE learned_localities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.learned_localities IS 'Locality names landlords supplied that the curated catalogue lacks; promoted across tenants only at a distinct-tenant threshold';


--
-- Name: COLUMN learned_localities.name_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.learned_localities.name_key IS 'Lowercased, punctuation-stripped name. The unique constraint uses it so "Nii Boi Town" and "nii-boi  town" count as one place rather than two';


--
-- Name: COLUMN learned_localities.latitude; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.learned_localities.latitude IS 'Centroid from the property that taught us this locality, when it had coordinates; null otherwise';


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    entry_type character varying(10) NOT NULL,
    category character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    running_balance numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'COMPLETED'::character varying NOT NULL,
    effective_date date NOT NULL,
    payment_transaction_id uuid,
    withdrawal_id uuid,
    invoice_id uuid,
    invoice_number character varying(100),
    property_id uuid,
    property_name character varying(500),
    unit_id uuid,
    unit_number character varying(100),
    occupant_id uuid,
    occupant_name character varying(500),
    description text,
    reference_code character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_method character varying(30),
    settlement character varying(20) DEFAULT 'GATEWAY'::character varying NOT NULL,
    CONSTRAINT chk_ledger_settlement CHECK (((settlement)::text = ANY ((ARRAY['GATEWAY'::character varying, 'OFFLINE'::character varying])::text[])))
);


ALTER TABLE public.ledger_entries OWNER TO postgres;

--
-- Name: COLUMN ledger_entries.payment_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ledger_entries.payment_method IS 'Instrument the payer used (CASH, CHEQUE, BANK_TRANSFER, MOBILE_MONEY, CARD). Informational only.';


--
-- Name: COLUMN ledger_entries.settlement; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ledger_entries.settlement IS 'GATEWAY = the platform received the money and can pay it out. OFFLINE = collected directly by the landlord; recorded, never withdrawable.';


--
-- Name: maintainer_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintainer_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    maintainer_id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    occupant_id uuid NOT NULL,
    maintenance_request_id uuid,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    direct_job_request_id uuid,
    CONSTRAINT ck_review_single_anchor CHECK ((((maintenance_request_id IS NOT NULL) AND (direct_job_request_id IS NULL)) OR ((maintenance_request_id IS NULL) AND (direct_job_request_id IS NOT NULL)))),
    CONSTRAINT maintainer_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.maintainer_reviews OWNER TO postgres;

--
-- Name: maintainers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintainers (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    company_name character varying(255),
    specializations text[],
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    rating numeric(2,1),
    total_jobs integer DEFAULT 0 NOT NULL,
    completed_jobs integer DEFAULT 0 NOT NULL,
    insurance_expiry_date date,
    tax_id character varying(100),
    is_compliant boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    background_check_passed boolean DEFAULT false NOT NULL,
    insurance_expiry date,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    city character varying(120),
    region character varying(120),
    price_tier character varying(20),
    availability character varying(30),
    response_time character varying(60),
    bio text,
    years_active integer,
    listed_in_marketplace boolean DEFAULT false NOT NULL,
    marketplace_consent_at timestamp without time zone,
    marketplace_consent_by uuid
);


ALTER TABLE public.maintainers OWNER TO postgres;

--
-- Name: maintenance_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_categories (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.maintenance_categories OWNER TO postgres;

--
-- Name: maintenance_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_comments (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    maintenance_request_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(255) NOT NULL,
    content text NOT NULL,
    visibility character varying(50) DEFAULT 'public'::character varying NOT NULL,
    attachments text[],
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.maintenance_comments OWNER TO postgres;

--
-- Name: maintenance_part_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_part_items (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    maintenance_request_id uuid NOT NULL,
    part_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.maintenance_part_items OWNER TO postgres;

--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_requests (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    request_number character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category_id uuid,
    sub_category character varying(255),
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid,
    occupant_id uuid,
    maintainer_id uuid,
    requested_by uuid NOT NULL,
    assigned_to uuid,
    approved_by uuid,
    scheduled_date timestamp without time zone,
    target_resolution_date timestamp without time zone,
    completed_date timestamp without time zone,
    is_sla_breached boolean DEFAULT false NOT NULL,
    permission_to_enter boolean DEFAULT false,
    entry_instructions text,
    preferred_time_slots text[],
    estimated_cost numeric(12,2),
    actual_cost numeric(12,2),
    billable_to character varying(50) DEFAULT 'property'::character varying,
    currency character varying(10) DEFAULT 'GHS'::character varying,
    images text[],
    notes text,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    image_file_ids text[],
    issue_type character varying(20) DEFAULT 'REPAIR'::character varying NOT NULL,
    complaint_category character varying(40),
    tenant_confirmed boolean DEFAULT false NOT NULL,
    confirmed_by uuid,
    confirmed_at timestamp without time zone,
    reopen_reason text,
    labour_cost numeric(12,2)
);


ALTER TABLE public.maintenance_requests OWNER TO postgres;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    occupant_id uuid NOT NULL,
    unit_id uuid,
    property_id uuid,
    type character varying(30) NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    delivery_method character varying(40) NOT NULL,
    status character varying(20) DEFAULT 'SENT'::character varying NOT NULL,
    source_type character varying(20),
    source_id uuid,
    issued_by_name character varying(150),
    issued_at timestamp without time zone DEFAULT now() NOT NULL,
    acknowledged_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    delivery_note text
);


ALTER TABLE public.notices OWNER TO postgres;

--
-- Name: notification_outbox; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_outbox (
    id uuid NOT NULL,
    tenant_id character varying(255),
    global_user_id uuid,
    type character varying(50) NOT NULL,
    recipient_address character varying(255) NOT NULL,
    subject character varying(255),
    payload text NOT NULL,
    status character varying(50) NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone NOT NULL,
    provider_message_id character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    sender_display_name character varying(255),
    origin character varying(20) DEFAULT 'PLATFORM'::character varying NOT NULL
);


ALTER TABLE public.notification_outbox OWNER TO postgres;

--
-- Name: occupants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.occupants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50) NOT NULL,
    avatar text,
    status character varying(50) DEFAULT 'active'::character varying,
    property_id uuid,
    unit_id uuid,
    unit_no character varying(50),
    move_in_date date,
    move_out_date date,
    emergency_contact jsonb DEFAULT '{}'::jsonb,
    documents text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector,
    avatar_file_id character varying,
    ghana_card_id character varying(20),
    id_type character varying(50),
    occupation character varying(255),
    family_members_count integer,
    dob date,
    previous_address jsonb,
    permanent_address jsonb,
    CONSTRAINT ck_occupant_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.occupants OWNER TO postgres;

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    invoice_id uuid,
    invoice_number character varying(100),
    occupant_id uuid,
    occupant_name character varying(500),
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    payment_method character varying(50) NOT NULL,
    mobile_network character varying(20),
    wallet_number character varying(20),
    cheque_number character varying(100),
    cheque_bank character varying(200),
    gateway_name character varying(50),
    gateway_transaction_id character varying(100),
    client_trans_id character varying(100),
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    failure_reason text,
    notes text,
    payment_date date,
    initiated_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    advance_rent_id uuid,
    needs_reconciliation boolean DEFAULT false NOT NULL,
    reconciliation_reason text,
    flagged_for_reconciliation_at timestamp without time zone,
    reconciliation_resolved_at timestamp without time zone,
    reconciliation_resolved_by character varying(255),
    reconciliation_resolution text
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: COLUMN payment_transactions.advance_rent_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.advance_rent_id IS 'Set when this payment funds an advance rent record instead of settling an invoice. Mutually exclusive with invoice_id.';


--
-- Name: COLUMN payment_transactions.needs_reconciliation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.needs_reconciliation IS 'True when this payment has (or may have) taken the payer''s money without the platform being able to book it. Orthogonal to status — needs manual reconciliation or a refund.';


--
-- Name: COLUMN payment_transactions.reconciliation_reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.reconciliation_reason IS 'Why the transaction was flagged, in the words of whichever code path flagged it.';


--
-- Name: COLUMN payment_transactions.flagged_for_reconciliation_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.flagged_for_reconciliation_at IS 'When the flag was first raised. Never overwritten by a later re-flag, so the age of the problem stays visible.';


--
-- Name: COLUMN payment_transactions.reconciliation_resolved_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.reconciliation_resolved_at IS 'When a platform operator resolved the reconciliation flag. Null while unresolved.';


--
-- Name: COLUMN payment_transactions.reconciliation_resolved_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.reconciliation_resolved_by IS 'Who resolved it — the platform admin identity from the admin JWT, not a tenant user.';


--
-- Name: COLUMN payment_transactions.reconciliation_resolution; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.reconciliation_resolution IS 'What was actually done to resolve it, in the words of the resolving path (settlement completed, or found already settled).';


--
-- Name: pending_signups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_signups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    company_name character varying(255) NOT NULL,
    company_description text,
    phone_number character varying(20),
    otp_hash character varying(255) NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pending_signups OWNER TO postgres;

--
-- Name: plan_feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    feature_key character varying(50) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    display_name character varying(100) NOT NULL
);


ALTER TABLE public.plan_feature_flags OWNER TO postgres;

--
-- Name: platform_announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    severity character varying(20) DEFAULT 'info'::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_at timestamp with time zone
);


ALTER TABLE public.platform_announcements OWNER TO postgres;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    description character varying(255),
    category character varying(50) DEFAULT 'GENERAL'::character varying NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100)
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- Name: preventative_maintenance_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preventative_maintenance_schedules (
    id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category_id uuid,
    property_id uuid NOT NULL,
    unit_id uuid,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    frequency character varying(50) NOT NULL,
    next_due_date date NOT NULL,
    last_generated_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.preventative_maintenance_schedules OWNER TO postgres;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    address_line_1 character varying(255),
    city character varying(100),
    state character varying(100),
    zip_code character varying(20),
    country character varying(100) DEFAULT 'Ghana'::character varying,
    region character varying(100),
    district character varying(100),
    gps_code character varying(50),
    type character varying(50),
    ownership character varying(50),
    condition character varying(50),
    status character varying(50) DEFAULT 'active'::character varying,
    purchase_price numeric(19,4),
    current_value numeric(19,4),
    currency character varying(3) DEFAULT 'GHS'::character varying,
    images text[] DEFAULT '{}'::text[],
    thumbnail_index integer DEFAULT 0,
    amenities jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_units integer DEFAULT 0,
    occupied_units integer DEFAULT 0,
    bedrooms integer,
    bathrooms integer,
    rooms integer,
    documents text[] DEFAULT '{}'::text[],
    search_vector tsvector,
    image_file_ids text[] DEFAULT '{}'::text[],
    latitude numeric(10,7),
    longitude numeric(10,7),
    place_id character varying(128),
    accuracy_metres numeric(8,2),
    CONSTRAINT ck_property_condition CHECK (((condition)::text = ANY ((ARRAY['new'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying])::text[]))),
    CONSTRAINT ck_property_ownership CHECK (((ownership)::text = ANY ((ARRAY['own'::character varying, 'lease'::character varying])::text[]))),
    CONSTRAINT ck_property_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'maintenance'::character varying, 'draft'::character varying])::text[]))),
    CONSTRAINT ck_property_type CHECK (((type)::text = ANY ((ARRAY['compound_house'::character varying, 'house'::character varying, 'apartment'::character varying, 'residential'::character varying, 'commercial'::character varying, 'mixed'::character varying])::text[])))
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: COLUMN properties.latitude; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.properties.latitude IS 'WGS84 latitude of the geocoded address, null when not geocoded';


--
-- Name: COLUMN properties.longitude; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.properties.longitude IS 'WGS84 longitude of the geocoded address, null when not geocoded';


--
-- Name: COLUMN properties.place_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.properties.place_id IS 'Provider-prefixed geocoder id, e.g. osm:N4951010023';


--
-- Name: COLUMN properties.accuracy_metres; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.properties.accuracy_metres IS 'Reported radius of uncertainty in metres for latitude/longitude; null when not captured from a device';


--
-- Name: property_inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_inspections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    unit_id uuid NOT NULL,
    property_id uuid,
    unit_no character varying(50),
    property_name character varying(255),
    type character varying(20) DEFAULT 'MOVE_IN'::character varying NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    inspection_date date,
    inspector_name character varying(255),
    inspector_notes text,
    tenant_acknowledgement text,
    signed_off_date date,
    pdf_url character varying(1000),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    electricity_meter_id uuid,
    electricity_reading numeric(12,2),
    water_meter_id uuid,
    water_reading numeric(12,2)
);


ALTER TABLE public.property_inspections OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_hash character varying(64) NOT NULL,
    family_id uuid NOT NULL,
    user_id uuid,
    tenant_id character varying(255) NOT NULL,
    device_fingerprint character varying(64),
    ip_address character varying(50),
    user_agent character varying(512),
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    absolute_expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    revoked_at timestamp with time zone,
    revoked_reason character varying(50),
    replaced_by_token_id uuid,
    global_user_id uuid,
    CONSTRAINT ck_refresh_tokens_single_identity CHECK (((user_id IS NOT NULL) <> (global_user_id IS NOT NULL)))
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.refresh_tokens IS 'Stores hashed refresh tokens with rotation and revocation support';


--
-- Name: COLUMN refresh_tokens.token_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'SHA-256 hash of the refresh token - never store plaintext';


--
-- Name: COLUMN refresh_tokens.family_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.family_id IS 'Groups tokens in a rotation chain for family-based revocation';


--
-- Name: COLUMN refresh_tokens.device_fingerprint; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.device_fingerprint IS 'Hash of User-Agent + IP for device binding validation';


--
-- Name: COLUMN refresh_tokens.absolute_expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.absolute_expires_at IS 'Maximum session lifetime (30 days from initial login)';


--
-- Name: COLUMN refresh_tokens.revoked_reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.revoked_reason IS 'logout, rotation, reuse_detected, device_mismatch, session_limit, admin';


--
-- Name: rent_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rent_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    unit_id uuid NOT NULL,
    property_id uuid NOT NULL,
    occupant_id uuid,
    current_rent numeric(12,2) NOT NULL,
    proposed_rent numeric(12,2) NOT NULL,
    increase_pct numeric(5,2),
    effective_date date NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    notified_at timestamp with time zone,
    applied_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.rent_reviews OWNER TO postgres;

--
-- Name: sender_id_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sender_id_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    requested_sender_id character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason text,
    requested_by uuid,
    approved_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone
);


ALTER TABLE public.sender_id_requests OWNER TO postgres;

--
-- Name: sms_credit_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_credit_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    active_sender_id character varying(50),
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    deactivated_sender_id character varying(50),
    deactivated_at timestamp without time zone,
    deactivated_by uuid,
    deactivation_reason text
);


ALTER TABLE public.sms_credit_accounts OWNER TO postgres;

--
-- Name: sms_credit_ledger_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_credit_ledger_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    sms_credit_account_id uuid NOT NULL,
    entry_type character varying(10) NOT NULL,
    category character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    running_balance numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'COMPLETED'::character varying NOT NULL,
    description text,
    reference_code character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sms_credit_ledger_entries OWNER TO postgres;

--
-- Name: sms_credit_topup_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_credit_topup_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    client_trans_id character varying(100) NOT NULL,
    gross_amount numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sms_credit_topup_transactions OWNER TO postgres;

--
-- Name: sms_fee_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_fee_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    min_amount numeric(14,2) NOT NULL,
    max_amount numeric(14,2),
    fee_type character varying(20) NOT NULL,
    fee_value numeric(14,4) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sms_fee_tiers OWNER TO postgres;

--
-- Name: sms_reminder_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_reminder_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    entity_type character varying(20) NOT NULL,
    entity_id uuid NOT NULL,
    days_before integer NOT NULL,
    recipient_phone character varying(30) NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    channel character varying(20) DEFAULT 'SMS'::character varying NOT NULL
);


ALTER TABLE public.sms_reminder_log OWNER TO postgres;

--
-- Name: subscription_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_subscription_id uuid NOT NULL,
    target_plan_id uuid,
    period_start date NOT NULL,
    period_end date NOT NULL,
    unit_count integer NOT NULL,
    price_per_unit numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    invoice_type character varying(20) DEFAULT 'RENEWAL'::character varying NOT NULL,
    paid_at timestamp without time zone,
    redde_transaction_ref character varying(100),
    client_trans_id character varying(100),
    failure_reason text,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    voided_at timestamp with time zone,
    voided_by character varying(255),
    void_reason text,
    retries_exhausted_at timestamp with time zone,
    billing_cycle character varying(10) DEFAULT 'MONTHLY'::character varying NOT NULL,
    payment_method character varying(10) DEFAULT 'MOMO'::character varying NOT NULL
);


ALTER TABLE public.subscription_invoices OWNER TO postgres;

--
-- Name: subscription_plan_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plan_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    from_plan character varying(50),
    to_plan character varying(50) NOT NULL,
    changed_by character varying(255),
    reason text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_plan_changes OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(20) NOT NULL,
    display_name character varying(50) NOT NULL,
    price_per_unit numeric(10,2) DEFAULT 0 NOT NULL,
    free_unit_cap integer,
    transaction_fee_pct numeric(5,4),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    popular boolean DEFAULT false NOT NULL,
    marketing_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    annual_discount_pct numeric(5,4)
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    submitter_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    body text NOT NULL,
    status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    assigned_to character varying(255),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: system_admin_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_admin_roles (
    admin_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.system_admin_roles OWNER TO postgres;

--
-- Name: system_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    mfa_required boolean DEFAULT false NOT NULL,
    phone_number character varying(20),
    phone_verified_at timestamp with time zone
);


ALTER TABLE public.system_admins OWNER TO postgres;

--
-- Name: COLUMN system_admins.phone_verified_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_admins.phone_verified_at IS 'Set only after an OTP to this number succeeded. Until then the number is ignored for delivery, so a typo cannot strand the user and a hostile edit cannot redirect their codes.';


--
-- Name: system_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    module character varying(50)
);


ALTER TABLE public.system_permissions OWNER TO postgres;

--
-- Name: system_role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.system_role_permissions OWNER TO postgres;

--
-- Name: system_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_roles OWNER TO postgres;

--
-- Name: tenant_api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    key_prefix character varying(8) NOT NULL,
    key_hash character varying(64) NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_api_keys OWNER TO postgres;

--
-- Name: tenant_feature_flag_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_feature_flag_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    feature_key character varying(50) NOT NULL,
    enabled boolean NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_feature_flag_overrides OWNER TO postgres;

--
-- Name: tenant_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    submitter_email character varying(255) NOT NULL,
    rating integer NOT NULL,
    category character varying(50) DEFAULT 'GENERAL'::character varying NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.tenant_feedback OWNER TO postgres;

--
-- Name: tenant_login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_login_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    user_id uuid,
    email character varying(255) NOT NULL,
    ip_address character varying(45),
    user_agent character varying(512),
    success boolean NOT NULL,
    failure_reason character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_login_history OWNER TO postgres;

--
-- Name: tenant_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    body text NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_notes OWNER TO postgres;

--
-- Name: tenant_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    module character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_permissions OWNER TO postgres;

--
-- Name: tenant_role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.tenant_role_permissions OWNER TO postgres;

--
-- Name: tenant_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_roles OWNER TO postgres;

--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    settings text DEFAULT '{}'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.tenant_settings OWNER TO postgres;

--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    grandfathered_unit_cap integer,
    billing_cycle_day integer,
    current_period_start date,
    current_period_end date,
    pending_plan_id uuid,
    cancelled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    billing_mobile_number character varying(20),
    billed_unit_count integer,
    billing_cycle character varying(10) DEFAULT 'MONTHLY'::character varying NOT NULL,
    paystack_authorization_code character varying(100),
    CONSTRAINT tenant_subscriptions_billing_cycle_day_check CHECK (((billing_cycle_day >= 1) AND (billing_cycle_day <= 28)))
);


ALTER TABLE public.tenant_subscriptions OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    contact_phone character varying(20)
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: transaction_fee_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_fee_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    source_type character varying(50) NOT NULL,
    source_id uuid NOT NULL,
    gross_amount numeric(14,2) NOT NULL,
    fee_rate numeric(7,4) NOT NULL,
    fee_amount numeric(14,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    status character varying(20) DEFAULT 'CAPTURED'::character varying NOT NULL,
    settled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transaction_fee_ledger OWNER TO postgres;

--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trusted_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    global_user_id uuid,
    device_id_hash character varying(64) NOT NULL,
    user_agent character varying(255),
    created_at timestamp without time zone NOT NULL,
    last_seen_at timestamp without time zone,
    user_id uuid,
    system_admin_id uuid,
    CONSTRAINT chk_trusted_devices_one_principal CHECK ((num_nonnulls(global_user_id, user_id, system_admin_id) = 1))
);


ALTER TABLE public.trusted_devices OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    property_id uuid NOT NULL,
    unit_no character varying(50) NOT NULL,
    floor integer,
    type character varying(50) NOT NULL,
    size_sqft numeric(12,2),
    bedrooms integer,
    bathrooms integer,
    rent numeric(19,4) NOT NULL,
    deposit numeric(19,4),
    currency character varying(3) DEFAULT 'GHS'::character varying,
    status character varying(50) DEFAULT 'available'::character varying,
    occupant_id uuid,
    images text[] DEFAULT '{}'::text[],
    amenities jsonb DEFAULT '[]'::jsonb,
    features jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector,
    image_file_ids text[] DEFAULT '{}'::text[],
    CONSTRAINT ck_unit_status CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'occupied'::character varying, 'maintenance'::character varying, 'reserved'::character varying])::text[])))
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    body text,
    entity_type character varying(100),
    entity_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    global_user_id uuid,
    otp_hash character varying(255) NOT NULL,
    purpose character varying(30) NOT NULL,
    channel character varying(10) NOT NULL,
    used boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    device_id_hash character varying(64),
    attempts integer DEFAULT 0 NOT NULL,
    user_id uuid,
    system_admin_id uuid,
    CONSTRAINT chk_user_otps_one_principal CHECK ((num_nonnulls(global_user_id, user_id, system_admin_id) = 1))
);


ALTER TABLE public.user_otps OWNER TO postgres;

--
-- Name: COLUMN user_otps.device_id_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_otps.device_id_hash IS 'The device the code was issued to. A code entered from a different device is refused, so an attacker who can read the SMS cannot use it from their own machine.';


--
-- Name: COLUMN user_otps.attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_otps.attempts IS 'Failed verification attempts against this code. Bounded so a six-digit code cannot be brute-forced within its lifetime.';


--
-- Name: user_tenant_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tenant_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    global_user_id uuid NOT NULL,
    tenant_id character varying(255) NOT NULL,
    tenant_user_id uuid,
    user_type character varying(50) DEFAULT 'STAFF'::character varying NOT NULL,
    role character varying(100) DEFAULT 'USER'::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    linked_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_tenant_links OWNER TO postgres;

--
-- Name: user_tenant_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tenant_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_tenant_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    full_name character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    company_name character varying(255) NOT NULL,
    user_type character varying(20) DEFAULT 'STAFF'::character varying NOT NULL,
    phone_number character varying(20),
    phone_verified_at timestamp with time zone,
    CONSTRAINT chk_user_type CHECK (((user_type)::text = ANY ((ARRAY['STAFF'::character varying, 'OCCUPANT'::character varying, 'LANDLORD'::character varying, 'MAINTAINER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.phone_verified_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.phone_verified_at IS 'Set only after an OTP to this number succeeded. Until then the number is ignored for delivery, so a typo cannot strand the user and a hostile edit cannot redirect their codes.';


--
-- Name: utility_bill_splits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_bill_splits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    occupant_id uuid,
    share_amount numeric(12,2) NOT NULL,
    share_pct numeric(6,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tenant_id character varying(255) NOT NULL
);


ALTER TABLE public.utility_bill_splits OWNER TO postgres;

--
-- Name: utility_bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    meter_id uuid NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    previous_reading numeric(12,2),
    current_reading numeric(12,2),
    units_consumed numeric(12,2),
    amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'UNPAID'::character varying NOT NULL,
    paid_at timestamp without time zone,
    paid_by character varying(20),
    split_method character varying(20) DEFAULT 'EQUAL'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.utility_bills OWNER TO postgres;

--
-- Name: utility_meter_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_meter_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meter_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.utility_meter_units OWNER TO postgres;

--
-- Name: utility_meters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_meters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    property_id uuid NOT NULL,
    meter_number character varying(100) NOT NULL,
    utility_type character varying(20) NOT NULL,
    meter_type character varying(20) DEFAULT 'POSTPAID'::character varying NOT NULL,
    payment_responsibility character varying(20) DEFAULT 'LANDLORD'::character varying NOT NULL,
    split_method character varying(20) DEFAULT 'EQUAL'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.utility_meters OWNER TO postgres;

--
-- Name: utility_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    meter_id uuid NOT NULL,
    purchased_at timestamp without time zone DEFAULT now() NOT NULL,
    token_number character varying(100),
    units_purchased numeric(10,3),
    amount_paid numeric(12,2) NOT NULL,
    purchased_by character varying(20) DEFAULT 'LANDLORD'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.utility_tokens OWNER TO postgres;

--
-- Name: vacancy_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vacancy_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    unit_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    contact_phone character varying(30),
    contact_email character varying(150),
    available_from date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.vacancy_listings OWNER TO postgres;

--
-- Name: vacate_notices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vacate_notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    unit_id uuid NOT NULL,
    property_id uuid,
    unit_no character varying(50),
    property_name character varying(255),
    occupant_id uuid,
    occupant_name character varying(255),
    status character varying(30) DEFAULT 'NOTICE_GIVEN'::character varying NOT NULL,
    notice_date date NOT NULL,
    expected_move_out date NOT NULL,
    actual_move_out date,
    keys_returned boolean DEFAULT false NOT NULL,
    keys_returned_date date,
    keys_returned_to character varying(255),
    notice_reason character varying(255),
    notes text,
    inspection_id uuid,
    confirmed_at timestamp without time zone,
    moved_out_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.vacate_notices OWNER TO postgres;

--
-- Name: violations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(100) NOT NULL,
    occupant_id uuid NOT NULL,
    unit_id uuid,
    property_id uuid,
    category character varying(30) NOT NULL,
    severity character varying(10) DEFAULT 'MEDIUM'::character varying NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    fine_amount numeric(12,2),
    fine_status character varying(10) DEFAULT 'NONE'::character varying NOT NULL,
    reported_by_name character varying(150),
    reported_at timestamp without time zone DEFAULT now() NOT NULL,
    warning_issued_at timestamp without time zone,
    resolved_at timestamp without time zone,
    escalated_at timestamp without time zone,
    resolution_notes text,
    escalation_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.violations OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    pending_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_earned numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_withdrawn numeric(15,2) DEFAULT 0.00 NOT NULL,
    linked_momo_number character varying(20),
    linked_momo_network character varying(20),
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    offline_balance numeric(15,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: COLUMN wallets.offline_balance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.offline_balance IS 'Cumulative rent the landlord collected directly (cash, cheque, bank transfer, or MoMo paid to them). Included in balance for bookkeeping; subtracted from it to get the withdrawable amount.';


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying(255) NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'GHS'::character varying NOT NULL,
    payout_method character varying(20) DEFAULT 'MOMO'::character varying NOT NULL,
    momo_number character varying(20),
    momo_network character varying(20),
    bank_account character varying(50),
    bank_code character varying(20),
    bank_name character varying(200),
    gateway_name character varying(50),
    gateway_transaction_id character varying(100),
    client_trans_id character varying(100),
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    failure_reason text,
    ledger_entry_id uuid,
    initiated_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    reversed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_log (id, admin_id, admin_email, action, entity_type, entity_id, detail, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: admin_impersonation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_impersonation_log (id, admin_id, admin_email, target_tenant_id, target_user_id, target_user_email, reason, impersonated_at, token_expires_at) FROM stdin;
\.


--
-- Data for Name: admin_message_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_message_log (id, message_type, subject, body_preview, recipient_count, sent_count, failed_count, sent_by, sent_at) FROM stdin;
\.


--
-- Data for Name: advance_rents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advance_rents (id, tenant_id, occupant_id, unit_id, property_id, total_amount, monthly_rent, months_covered, remaining_balance, currency, period_start, period_end, status, payment_method, payment_reference, notes, created_at, updated_at, failure_origin) FROM stdin;
dbc365d1-413e-47cf-98d6-fab2cf1f38a2	oseimensah-properties	dc36c884-aaff-4650-bcc3-463a5f8c02ca	0018bbf1-8a32-4069-9843-538f77cd3753	7aeade41-e994-414a-ae8f-de43fe4a91db	20400.00	850.00	24	20400.00	GHS	2026-08-24	2028-08-24	ACTIVE	CASH	\N	\N	2026-08-24 23:40:58.919857	\N	\N
b70c44ab-fedb-4fac-a669-76673f371be4	oseimensah-properties	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	f5b3f921-41e3-45f5-b782-fde7c44e5b32	7aeade41-e994-414a-ae8f-de43fe4a91db	7200.00	600.00	12	7200.00	GHS	2026-08-25	2027-08-25	ACTIVE	CASH	\N	\N	2026-08-25 20:11:20.592337	\N	\N
\.


--
-- Data for Name: agent_commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_commissions (id, tenant_id, agent_id, property_id, unit_id, occupant_id, invoice_id, amount, currency, status, commission_date, paid_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, tenant_id, name, email, phone, gender, date_of_birth, ghana_card_number, location, avatar_url, status, commission_type, commission_rate, primary_guarantor, primary_guarantor_phone, secondary_guarantor, secondary_guarantor_phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agreements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agreements (id, tenant_id, agreement_number, type, status, occupant_id, property_id, unit_id, occupant_name, property_name, unit_no, start_date, end_date, signed_date, rent, security_deposit, late_fee, total_amount, currency, payment_frequency, duration, terms, conditions, renewal_options, document_url, created_at, updated_at, subletting_allowed, pets_allowed, noise_restrictions_apply, notice_period_days, early_termination_allowed, witness_name, previous_agreement_id, renewal_decision, renewal_decided_at, renewal_notes) FROM stdin;
6685eb59-bb93-4d25-8590-d7110103f702	oseimensah-properties	AGR-2026-001	LEASE	ACTIVE	c285f73b-0a29-47d5-a720-57443ccbb4e3	7aeade41-e994-414a-ae8f-de43fe4a91db	d74fe5ae-b2df-4936-8c9b-f103bb6d651a	Akosua Boateng	Adenta Compound	Room 1	2026-08-23	2028-08-22	\N	600.00	600.00	\N	600.00	GHS	MONTHLY	\N	\N	\N	\N	\N	2026-08-23 01:19:51.283448+00	2026-08-23 01:20:16.080638+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a6c9972d-5c74-4268-9169-b56862de3e4d	oseimensah-properties	AGR-2026-002	LEASE	PENDING	6aa60021-c4dc-4041-aecf-956f7d74dfa0	7aeade41-e994-414a-ae8f-de43fe4a91db	410bb23f-636a-45fe-a330-6440a5289fdf	Yaa Asantewaa	Adenta Compound	Room 2	2026-08-24	2027-08-24	\N	600.00	600.00	\N	600.00	GHS	MONTHLY	\N	\N	\N	\N	\N	2026-08-24 20:26:51.445295+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5ad7757d-69c8-4d10-a7f9-2a41ffeafd78	oseimensah-properties	AGR-2026-003	LEASE	ACTIVE	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	Adenta Compound	Room 7	2026-08-24	2028-08-23	\N	850.00	850.00	\N	850.00	GHS	MONTHLY	\N	\N	\N	\N	\N	2026-08-24 23:40:58.779008+00	2026-08-24 23:45:50.572298+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4335b5ec-868e-478e-a224-fb692a84eb14	oseimensah-properties	AGR-2026-004	LEASE	ACTIVE	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	Adenta Compound	Room 9	2026-08-25	2027-08-25	\N	600.00	600.00	\N	600.00	GHS	MONTHLY	\N	\N	\N	\N	\N	2026-08-25 20:11:20.18893+00	2026-08-25 20:11:29.325667+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: caution_fee_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caution_fee_deductions (id, caution_fee_id, tenant_id, amount, reason, description, deducted_at, created_at, inspection_id) FROM stdin;
f067387a-bde6-4a1c-ba97-280b916ef490	fb932875-a96d-4416-bc3a-d6c872005db4	oseimensah-properties	150.00	DAMAGE	Two louvre blades cracked in the front window and the door lock replaced. Photographed at inspection 25/08. Agreed with him at the compound.	2026-08-25	2026-08-25 20:37:29.317192	\N
\.


--
-- Data for Name: caution_fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caution_fees (id, tenant_id, occupant_id, unit_id, property_id, amount, total_deductions, refund_amount, currency, status, payment_method, payment_reference, collected_at, refunded_at, notes, created_at, updated_at) FROM stdin;
49730816-2145-4499-833b-12837fee5885	oseimensah-properties	6aa60021-c4dc-4041-aecf-956f7d74dfa0	410bb23f-636a-45fe-a330-6440a5289fdf	7aeade41-e994-414a-ae8f-de43fe4a91db	600.00	0.00	\N	GHS	HELD	\N	\N	2026-08-24	\N	\N	2026-08-24 20:26:51.585547	\N
32cf064d-3216-4392-90a8-f2824fb15869	oseimensah-properties	dc36c884-aaff-4650-bcc3-463a5f8c02ca	0018bbf1-8a32-4069-9843-538f77cd3753	7aeade41-e994-414a-ae8f-de43fe4a91db	850.00	0.00	\N	GHS	HELD	\N	\N	2026-08-24	\N	\N	2026-08-24 23:40:59.157698	\N
fb932875-a96d-4416-bc3a-d6c872005db4	oseimensah-properties	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	f5b3f921-41e3-45f5-b782-fde7c44e5b32	7aeade41-e994-414a-ae8f-de43fe4a91db	600.00	150.00	\N	GHS	HELD	\N	\N	2026-08-25	\N	\N	2026-08-25 20:11:21.180614	2026-08-25 20:37:29.361619
\.


--
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communications (id, tenant_id, subject, from_name, to_name, message, comm_date, type, status, occupant_id, occupant_name, property_id, property_name, unit_id, unit_no, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: direct_job_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direct_job_requests (id, occupant_id, maintainer_id, tenant_id, category, description, preferred_timing, city, region, status, response_token_hash, response_token_expires_at, decline_reason, created_at, responded_at, completed_at, maintainer_notified) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, tenant_id, document_type, status, reject_reason, occupant_id, occupant_name, property_id, property_name, unit_id, unit_no, file_url, file_name, file_id, created_at, updated_at, agreement_id, agreement_number) FROM stdin;
\.


--
-- Data for Name: expense_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_configs (id, tenant_id, item, category, is_active, created_at, updated_at) FROM stdin;
e638b5f1-2909-46cb-88c9-c38e04c6d94a	oseimensah-properties	Plumbing repairs	MAINTENANCE	t	2026-08-23 04:12:50.716375+00	\N
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, tenant_id, item, expense_config_id, property_id, unit_id, date, amount, currency, responsibility, status, description, image_url, image_file_id, created_at, updated_at, maintenance_request_id) FROM stdin;
a9d25176-c3ac-435c-bba9-98a6776815ad	oseimensah-properties	Plumbing repairs	e638b5f1-2909-46cb-88c9-c38e04c6d94a	7aeade41-e994-414a-ae8f-de43fe4a91db	\N	2026-08-23	330.00	GHS	OWNER	PAID	Plumber Kwame Adjei unblocked Room 4 toilet. GHS 250 labour + GHS 80 ball valve. Paid cash 23/08/2026. Ref REQ-20260823-4B3208CF.	\N	\N	2026-08-23 04:15:32.361584+00	\N	\N
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init	SQL	V1__init.sql	-219418690	postgres	2026-08-22 23:11:02.589061	10	t
2	2	add user full name to users	SQL	V2__add_user_full_name_to_users.sql	-1884104175	postgres	2026-08-22 23:11:02.624306	5	t
3	3	add is active column to users	SQL	V3__add_is_active_column_to_users.sql	-1043492700	postgres	2026-08-22 23:11:02.644177	6	t
4	4	create tenants table	SQL	V4__create_tenants_table.sql	-244577456	postgres	2026-08-22 23:11:02.666539	8	t
5	5	create system admins table	SQL	V5__create_system_admins_table.sql	-1383146275	postgres	2026-08-22 23:11:02.692571	11	t
6	6	create system roles permissions	SQL	V6__create_system_roles_permissions.sql	-1965478326	postgres	2026-08-22 23:11:02.71908	18	t
7	7	seed system roles permissions	SQL	V7__seed_system_roles_permissions.sql	186506333	postgres	2026-08-22 23:11:02.750858	2	t
8	8	add company name to users table	SQL	V8__add_company_name_to_users_table.sql	-528886194	postgres	2026-08-22 23:11:02.764369	5	t
9	9	add unique email tenant constraint	SQL	V9__add_unique_email_tenant_constraint.sql	-1068908643	postgres	2026-08-22 23:11:02.779411	5	t
10	10	seed demo tenants	SQL	V10__seed_demo_tenants.sql	1585724713	postgres	2026-08-22 23:11:02.794406	1	t
11	11	create tenant roles permissions	SQL	V11__create_tenant_roles_permissions.sql	-1652668924	postgres	2026-08-22 23:11:02.810911	22	t
12	12	add user type to users	SQL	V12__add_user_type_to_users.sql	-427702273	postgres	2026-08-22 23:11:02.845053	5	t
13	13	seed tenant permissions	SQL	V13__seed_tenant_permissions.sql	-216854857	postgres	2026-08-22 23:11:02.862141	5	t
14	14	create refresh tokens table	SQL	V14__create_refresh_tokens_table.sql	-505419711	postgres	2026-08-22 23:11:02.880165	14	t
15	15	Create property and unit Table	SQL	V15__Create_property_and_unit_Table.sql	-1293828079	postgres	2026-08-22 23:11:02.907419	20	t
16	16	Add unit counts to properties	SQL	V16__Add_unit_counts_to_properties.sql	-1348385171	postgres	2026-08-22 23:11:02.937417	8	t
17	17	Add missing feature columns to properties	SQL	V17__Add_missing_feature_columns_to_properties.sql	1635190118	postgres	2026-08-22 23:11:02.953575	5	t
18	18	Add documents to properties	SQL	V18__Add_documents_to_properties.sql	85201485	postgres	2026-08-22 23:11:02.967984	2	t
19	19	create occupants table	SQL	V19__create_occupants_table.sql	-1556917174	postgres	2026-08-22 23:11:02.979503	21	t
20	20	Drop unit type constraint	SQL	V20__Drop_unit_type_constraint.sql	-352381675	postgres	2026-08-22 23:11:03.017894	3	t
21	21	create global users tables	SQL	V21__create_global_users_tables.sql	-1751010955	postgres	2026-08-22 23:11:03.032537	16	t
22	22	create maintenance tables	SQL	V22__create_maintenance_tables.sql	1370756315	postgres	2026-08-22 23:11:03.06322	56	t
23	23	add first time login and otps	SQL	V23__add_first_time_login_and_otps.sql	1888816502	postgres	2026-08-22 23:11:03.132272	14	t
24	24	create notification outbox	SQL	V24__create_notification_outbox.sql	-882295283	postgres	2026-08-22 23:11:03.158436	7	t
25	25	forgot password user otps	SQL	V25__forgot_password_user_otps.sql	-1882273979	postgres	2026-08-22 23:11:03.176149	9	t
26	26	add search vector fts	SQL	V26__add_search_vector_fts.sql	131442343	postgres	2026-08-22 23:11:03.197445	22	t
27	27	add sender display name to notification outbox	SQL	V27__add_sender_display_name_to_notification_outbox.sql	-72154955	postgres	2026-08-22 23:11:03.229786	2	t
28	28	seed maintainer permissions	SQL	V28__seed_maintainer_permissions.sql	-628713610	postgres	2026-08-22 23:11:03.240859	2	t
29	29	add image file ids to properties	SQL	V29__add_image_file_ids_to_properties.sql	315895473	postgres	2026-08-22 23:11:03.250393	2	t
30	30	add image file ids to units	SQL	V30__add_image_file_ids_to_units.sql	-2035761179	postgres	2026-08-22 23:11:03.261503	3	t
31	31	add avatar file id to occupants	SQL	V31__add_avatar_file_id_to_occupants.sql	-2076384128	postgres	2026-08-22 23:11:03.273095	2	t
32	32	add image file ids to maintenance requests	SQL	V32__add_image_file_ids_to_maintenance_requests.sql	1477545328	postgres	2026-08-22 23:11:03.283328	2	t
33	33	create expense configs table	SQL	V33__create_expense_configs_table.sql	861960509	postgres	2026-08-22 23:11:03.292986	7	t
34	34	create expenses table	SQL	V34__create_expenses_table.sql	979457669	postgres	2026-08-22 23:11:03.308869	11	t
35	35	create invoices table	SQL	V35__create_invoices_table.sql	-819506170	postgres	2026-08-22 23:11:03.328839	9	t
36	36	create agreements table	SQL	V36__create_agreements_table.sql	-669288020	postgres	2026-08-22 23:11:03.347625	10	t
37	37	create communications table	SQL	V37__create_communications_table.sql	-191226735	postgres	2026-08-22 23:11:03.366001	8	t
38	38	create documents table	SQL	V38__create_documents_table.sql	-521756615	postgres	2026-08-22 23:11:03.382318	10	t
39	39	create tenant settings table	SQL	V39__create_tenant_settings_table.sql	-185353544	postgres	2026-08-22 23:11:03.399788	4	t
40	40	create payment transactions table	SQL	V40__create_payment_transactions_table.sql	895244241	postgres	2026-08-22 23:11:03.41336	8	t
41	41	create gateway configs table	SQL	V41__create_gateway_configs_table.sql	46792602	postgres	2026-08-22 23:11:03.429782	5	t
42	42	create wallets table	SQL	V42__create_wallets_table.sql	1552636825	postgres	2026-08-22 23:11:03.447943	6	t
43	43	create ledger entries table	SQL	V43__create_ledger_entries_table.sql	-423852482	postgres	2026-08-22 23:11:03.467588	19	t
44	44	create withdrawals table	SQL	V44__create_withdrawals_table.sql	-1876008017	postgres	2026-08-22 23:11:03.498529	10	t
45	45	create advance rents table	SQL	V45__create_advance_rents_table.sql	594448614	postgres	2026-08-22 23:11:03.516417	8	t
46	46	create caution fees table	SQL	V46__create_caution_fees_table.sql	-955259989	postgres	2026-08-22 23:11:03.532533	7	t
47	47	create caution fee deductions table	SQL	V47__create_caution_fee_deductions_table.sql	1349531986	postgres	2026-08-22 23:11:03.548736	7	t
48	48	add advance rent id to invoices	SQL	V48__add_advance_rent_id_to_invoices.sql	-1364176230	postgres	2026-08-22 23:11:03.57556	3	t
49	49	create sms reminder log	SQL	V49__create_sms_reminder_log.sql	-982521775	postgres	2026-08-22 23:11:03.610979	6	t
50	50	create guarantors table	SQL	V50__create_guarantors_table.sql	-1896382628	postgres	2026-08-22 23:11:03.64877	8	t
51	51	add channel to sms reminder log	SQL	V51__add_channel_to_sms_reminder_log.sql	99628510	postgres	2026-08-22 23:11:03.668131	4	t
52	52	create utility tables	SQL	V52__create_utility_tables.sql	-21017133	postgres	2026-08-22 23:11:03.685534	27	t
53	53	create rent reviews table	SQL	V53__create_rent_reviews_table.sql	1756898939	postgres	2026-08-22 23:11:03.721158	8	t
54	54	create inspection tables	SQL	V54__create_inspection_tables.sql	-1011107330	postgres	2026-08-22 23:11:03.737512	11	t
55	55	create vacate notices table	SQL	V55__create_vacate_notices_table.sql	710458239	postgres	2026-08-22 23:11:03.756587	10	t
56	56	add ghana card id to occupants	SQL	V56__add_ghana_card_id_to_occupants.sql	-500939231	postgres	2026-08-22 23:11:03.773053	2	t
57	57	add id card images to occupants	SQL	V57__add_id_card_images_to_occupants.sql	-230143216	postgres	2026-08-22 23:11:03.782989	2	t
58	58	create vacancy listings table	SQL	V58__create_vacancy_listings_table.sql	143174937	postgres	2026-08-22 23:11:03.792541	8	t
59	59	create late fee logs table	SQL	V59__create_late_fee_logs_table.sql	-1214332130	postgres	2026-08-22 23:11:03.808606	8	t
60	60	create agents tables	SQL	V60__create_agents_tables.sql	1935869084	postgres	2026-08-22 23:11:03.82891	18	t
61	61	seed admin user and roles	SQL	V61__seed_admin_user_and_roles.sql	-1849937236	postgres	2026-08-22 23:11:03.856536	10	t
62	62	create subscription tables	SQL	V62__create_subscription_tables.sql	-717885558	postgres	2026-08-22 23:11:03.876187	13	t
63	63	create subscription invoices	SQL	V63__create_subscription_invoices.sql	-1509243497	postgres	2026-08-22 23:11:03.897196	8	t
64	64	add billing mobile to subscription	SQL	V64__add_billing_mobile_to_subscription.sql	19189385	postgres	2026-08-22 23:11:03.91428	3	t
65	65	add last login at to system admins	SQL	V65__add_last_login_at_to_system_admins.sql	2028222163	postgres	2026-08-22 23:11:03.924701	2	t
66	66	create tenant notes table	SQL	V66__create_tenant_notes_table.sql	1475407828	postgres	2026-08-22 23:11:03.93882	7	t
67	67	create tenant feature flag overrides table	SQL	V67__create_tenant_feature_flag_overrides_table.sql	577535147	postgres	2026-08-22 23:11:03.953643	9	t
68	68	create subscription plan changes table	SQL	V68__create_subscription_plan_changes_table.sql	1832739636	postgres	2026-08-22 23:11:03.969476	5	t
69	69	add void fields to subscription invoices	SQL	V69__add_void_fields_to_subscription_invoices.sql	-106644066	postgres	2026-08-22 23:11:03.983046	2	t
70	70	add mfa required to system admins	SQL	V70__add_mfa_required_to_system_admins.sql	1737621958	postgres	2026-08-22 23:11:03.994573	2	t
71	71	create platform announcements table	SQL	V71__create_platform_announcements_table.sql	-1485887298	postgres	2026-08-22 23:11:04.002338	7	t
72	72	create support tickets table	SQL	V72__create_support_tickets_table.sql	2044866281	postgres	2026-08-22 23:11:04.016924	8	t
73	73	create tenant feedback table	SQL	V73__create_tenant_feedback_table.sql	126820913	postgres	2026-08-22 23:11:04.034073	7	t
74	74	fix tenant feedback rating column type	SQL	V74__fix_tenant_feedback_rating_column_type.sql	-155412507	postgres	2026-08-22 23:11:04.050357	6	t
75	75	create tenant login history table	SQL	V75__create_tenant_login_history_table.sql	281837857	postgres	2026-08-22 23:11:04.064757	5	t
76	76	create tenant api keys table	SQL	V76__create_tenant_api_keys_table.sql	2087701967	postgres	2026-08-22 23:11:04.077469	4	t
77	77	create platform settings table	SQL	V77__create_platform_settings_table.sql	1158863580	postgres	2026-08-22 23:11:04.089883	6	t
78	78	add maintenance mode settings	SQL	V78__add_maintenance_mode_settings.sql	-1789767907	postgres	2026-08-22 23:11:04.102778	1	t
79	79	create admin audit log table	SQL	V79__create_admin_audit_log_table.sql	1985316514	postgres	2026-08-22 23:11:04.110965	7	t
80	80	create transaction fee ledger	SQL	V80__create_transaction_fee_ledger.sql	-1434263494	postgres	2026-08-22 23:11:04.125458	7	t
81	81	add retries exhausted at to subscription invoices	SQL	V81__add_retries_exhausted_at_to_subscription_invoices.sql	448963706	postgres	2026-08-22 23:11:04.139706	2	t
82	82	add scheduled at to platform announcements	SQL	V82__add_scheduled_at_to_platform_announcements.sql	543041466	postgres	2026-08-22 23:11:04.148409	1	t
83	83	add rate limit provider retention settings	SQL	V83__add_rate_limit_provider_retention_settings.sql	1019560277	postgres	2026-08-22 23:11:04.156177	2	t
84	84	create admin message log	SQL	V84__create_admin_message_log.sql	627345274	postgres	2026-08-22 23:11:04.165745	4	t
85	85	fix provider sms default to frog	SQL	V85__fix_provider_sms_default_to_frog.sql	-1820753740	postgres	2026-08-22 23:11:04.177345	2	t
86	86	add frog sms credential settings	SQL	V86__add_frog_sms_credential_settings.sql	1041459632	postgres	2026-08-22 23:11:04.187592	2	t
87	87	create admin impersonation log	SQL	V87__create_admin_impersonation_log.sql	862524413	postgres	2026-08-22 23:11:04.197613	6	t
88	88	add user notifications	SQL	V88__add_user_notifications.sql	119498791	postgres	2026-08-22 23:11:04.211148	6	t
89	89	add branding settings	SQL	V89__add_branding_settings.sql	-1662080147	postgres	2026-08-22 23:11:04.224218	2	t
90	90	add preventative schedules	SQL	V90__add_preventative_schedules.sql	-1044003853	postgres	2026-08-22 23:11:04.234214	8	t
91	91	add plan marketing fields	SQL	V91__add_plan_marketing_fields.sql	-2105395210	postgres	2026-08-22 23:11:04.249209	3	t
92	95	fix marketing features empty object	SQL	V95__fix_marketing_features_empty_object.sql	-832308764	postgres	2026-08-22 23:11:04.258533	2	t
93	96	expand feature flags	SQL	V96__expand_feature_flags.sql	1308661653	postgres	2026-08-22 23:11:04.26664	5	t
94	97	randomise plan uuids	SQL	V97__randomise_plan_uuids.sql	552353484	postgres	2026-08-22 23:11:04.280854	13	t
95	98	add display name to feature flags	SQL	V98__add_display_name_to_feature_flags.sql	-1076623183	postgres	2026-08-22 23:11:04.303726	12	t
96	99	fix landlord usertype	SQL	V99__fix_landlord_usertype.sql	1658415425	postgres	2026-08-22 23:11:04.323796	5	t
97	100	expand and fix tenant permissions	SQL	V100__expand_and_fix_tenant_permissions.sql	689629665	postgres	2026-08-22 23:11:04.336722	3	t
98	101	rename system permissions name to code	SQL	V101__rename_system_permissions_name_to_code.sql	1389060933	postgres	2026-08-22 23:11:04.347644	2	t
99	102	add purpose to gateway configs	SQL	V102__add_purpose_to_gateway_configs.sql	304382497	postgres	2026-08-22 23:11:04.358423	6	t
100	103	add billed unit count to tenant subscriptions	SQL	V103__add_billed_unit_count_to_tenant_subscriptions.sql	205991895	postgres	2026-08-22 23:11:04.372039	2	t
101	104	add billing cycle and payment method	SQL	V104__add_billing_cycle_and_payment_method.sql	1327703450	postgres	2026-08-22 23:11:04.382485	5	t
102	105	add property draft support	SQL	V105__add_property_draft_support.sql	-1973937630	postgres	2026-08-22 23:11:04.394383	4	t
103	106	add sms credit ledger	SQL	V106__add_sms_credit_ledger.sql	-302414326	postgres	2026-08-22 23:11:04.405236	9	t
104	107	add sender id requests	SQL	V107__add_sender_id_requests.sql	341596660	postgres	2026-08-22 23:11:04.420935	7	t
105	108	add sms credit topup transactions	SQL	V108__add_sms_credit_topup_transactions.sql	-216537609	postgres	2026-08-22 23:11:04.436324	3	t
106	109	add notification outbox origin	SQL	V109__add_notification_outbox_origin.sql	-1383945198	postgres	2026-08-22 23:11:04.447532	2	t
107	110	add sms fee tiers	SQL	V110__add_sms_fee_tiers.sql	-1289283483	postgres	2026-08-22 23:11:04.457072	5	t
108	111	add sender id deactivation fields	SQL	V111__add_sender_id_deactivation_fields.sql	937701218	postgres	2026-08-22 23:11:04.469595	2	t
109	112	promote occupant profile columns	SQL	V112__promote_occupant_profile_columns.sql	1152514204	postgres	2026-08-22 23:11:04.479669	3	t
110	113	add inspection meter readings	SQL	V113__add_inspection_meter_readings.sql	-1556593048	postgres	2026-08-22 23:11:04.48898	1	t
111	114	add document agreement link	SQL	V114__add_document_agreement_link.sql	-866473081	postgres	2026-08-22 23:11:04.49773	2	t
112	115	add agreement clauses and witness	SQL	V115__add_agreement_clauses_and_witness.sql	662236588	postgres	2026-08-22 23:11:04.50588	2	t
113	116	add complaint discriminator	SQL	V116__add_complaint_discriminator.sql	377900546	postgres	2026-08-22 23:11:04.515162	2	t
114	117	create notices table	SQL	V117__create_notices_table.sql	-1457895818	postgres	2026-08-22 23:11:04.525063	9	t
115	118	create violations table	SQL	V118__create_violations_table.sql	-1196402998	postgres	2026-08-22 23:11:04.542347	8	t
116	119	add agreement renewal workflow	SQL	V119__add_agreement_renewal_workflow.sql	-876145193	postgres	2026-08-22 23:11:04.557459	4	t
117	120	add maintenance tenant confirmation	SQL	V120__add_maintenance_tenant_confirmation.sql	1408341769	postgres	2026-08-22 23:11:04.569615	4	t
118	121	add agreement id to invoices	SQL	V121__add_agreement_id_to_invoices.sql	2026727901	postgres	2026-08-22 23:11:04.580446	2	t
119	122	add partial invoice status	SQL	V122__add_partial_invoice_status.sql	86249261	postgres	2026-08-22 23:11:04.590087	3	t
120	123	add notice delivery note	SQL	V123__add_notice_delivery_note.sql	1543186544	postgres	2026-08-22 23:11:04.600424	2	t
121	124	seed platform admin permissions	SQL	V124__seed_platform_admin_permissions.sql	-533759470	postgres	2026-08-22 23:11:04.611344	7	t
122	125	add global users phone unique index	SQL	V125__add_global_users_phone_unique_index.sql	-20832330	postgres	2026-08-22 23:11:04.626586	3	t
123	126	add refresh tokens global user id	SQL	V126__add_refresh_tokens_global_user_id.sql	-897581150	postgres	2026-08-22 23:11:04.638903	6	t
124	127	create trusted devices	SQL	V127__create_trusted_devices.sql	341263990	postgres	2026-08-22 23:11:04.654286	7	t
125	128	add tenant contact phone	SQL	V128__add_tenant_contact_phone.sql	-1295971045	postgres	2026-08-22 23:11:04.668475	2	t
126	129	add maintainer marketplace	SQL	V129__add_maintainer_marketplace.sql	-1678566272	postgres	2026-08-22 23:11:04.677959	9	t
127	130	normalise maintainer status	SQL	V130__normalise_maintainer_status.sql	249227003	postgres	2026-08-22 23:11:04.696379	3	t
128	131	add direct job requests	SQL	V131__add_direct_job_requests.sql	-1052368158	postgres	2026-08-22 23:11:04.70851	12	t
129	132	add direct job maintainer notified	SQL	V132__add_direct_job_maintainer_notified.sql	-1743588363	postgres	2026-08-22 23:11:04.729587	2	t
130	133	recompute ratings one occupant one vote	SQL	V133__recompute_ratings_one_occupant_one_vote.sql	1405006341	postgres	2026-08-22 23:11:04.73847	2	t
131	134	add property coordinates	SQL	V134__add_property_coordinates.sql	479203046	postgres	2026-08-22 23:11:04.748249	3	t
132	135	add property location accuracy	SQL	V135__add_property_location_accuracy.sql	1188917312	postgres	2026-08-22 23:11:04.758286	2	t
133	136	add learned localities	SQL	V136__add_learned_localities.sql	1922463655	postgres	2026-08-22 23:11:04.767851	6	t
134	137	agreements foreign keys	SQL	V137__agreements_foreign_keys.sql	173541930	postgres	2026-08-22 23:11:04.782457	16	t
135	138	drop occupant id card images	SQL	V138__drop_occupant_id_card_images.sql	158873217	postgres	2026-08-22 23:11:04.805483	3	t
136	139	rent review foreign keys	SQL	V139__rent_review_foreign_keys.sql	-1524450140	postgres	2026-08-22 23:11:04.815618	8	t
137	140	revoke published seed admin credential	SQL	V140__revoke_published_seed_admin_credential.sql	-2114213595	postgres	2026-08-22 23:11:04.83218	2	t
138	141	ledger settlement and offline balance	SQL	V141__ledger_settlement_and_offline_balance.sql	-1672153444	postgres	2026-08-22 23:11:04.842539	9	t
139	142	advance rent gateway payments	SQL	V142__advance_rent_gateway_payments.sql	-1130179155	postgres	2026-08-22 23:11:04.860622	3	t
140	143	payment transaction reconciliation flag	SQL	V143__payment_transaction_reconciliation_flag.sql	-1300956287	postgres	2026-08-22 23:11:04.870989	4	t
141	144	reconciliation resolution	SQL	V144__reconciliation_resolution.sql	-1213077899	postgres	2026-08-22 23:11:04.88246	5	t
142	145	harden trusted devices and otps	SQL	V145__harden_trusted_devices_and_otps.sql	598488623	postgres	2026-08-22 23:11:04.895047	5	t
143	146	generalise otp principals	SQL	V146__generalise_otp_principals.sql	-1062709918	postgres	2026-08-22 23:11:04.909002	7	t
144	147	index user otps new principals	SQL	V147__index_user_otps_new_principals.sql	-309757504	postgres	2026-08-22 23:11:04.924281	5	t
145	148	add login otp platform settings	SQL	V148__add_login_otp_platform_settings.sql	-466167883	postgres	2026-08-22 23:11:04.937978	2	t
146	149	trusted device unique indexes concurrently	SQL	V149__trusted_device_unique_indexes_concurrently.sql	546933528	postgres	2026-08-22 23:11:04.961241	13	t
147	150	validate otp principal constraints	SQL	V150__validate_otp_principal_constraints.sql	1037148310	postgres	2026-08-22 23:11:04.966518	6	t
148	151	add otp rate limit and retention settings	SQL	V151__add_otp_rate_limit_and_retention_settings.sql	-1524298194	postgres	2026-08-22 23:11:04.979575	2	t
149	152	split admin login otp switch	SQL	V152__split_admin_login_otp_switch.sql	-621030297	postgres	2026-08-22 23:11:04.988216	2	t
150	153	replace sms enabled with channel	SQL	V153__replace_sms_enabled_with_channel.sql	-592885481	postgres	2026-08-22 23:11:04.998062	3	t
151	154	add global user phone verified at	SQL	V154__add_global_user_phone_verified_at.sql	1089919619	postgres	2026-08-22 23:11:05.007471	5	t
152	155	create pending signups	SQL	V155__create_pending_signups.sql	-1862109746	postgres	2026-08-22 23:11:05.019387	4	t
153	156	widen pending signups phone number	SQL	V156__widen_pending_signups_phone_number.sql	1586292423	postgres	2026-08-22 23:11:05.029975	2	t
154	157	add tenant id to utility bill splits	SQL	V157__add_tenant_id_to_utility_bill_splits.sql	-1071226765	postgres	2026-08-22 23:11:05.038323	4	t
155	158	add list shape composite indexes	SQL	V158__add_list_shape_composite_indexes.sql	-1318690318	postgres	2026-08-22 23:11:05.050089	19	t
156	159	global user email optional	SQL	V159__global_user_email_optional.sql	434121113	postgres	2026-08-24 19:00:03.891772	67	t
157	160	occupant email optional	SQL	V160__occupant_email_optional.sql	1575439262	postgres	2026-08-24 20:24:27.275504	42	t
158	161	maintenance labour and expense link	SQL	V161__maintenance_labour_and_expense_link.sql	-1722425344	postgres	2026-08-25 02:18:45.814853	66	t
159	162	backfill advance rent payment transactions	SQL	V162__backfill_advance_rent_payment_transactions.sql	-2092548813	postgres	2026-08-25 21:47:53.159073	14	t
160	163	allow compound house property type	SQL	V163__allow_compound_house_property_type.sql	1725177535	postgres	2026-08-26 15:03:25.288665	67	t
\.


--
-- Data for Name: gateway_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gateway_configs (id, tenant_id, gateway_name, is_default, is_active, is_live, config, created_at, updated_at, purpose) FROM stdin;
\.


--
-- Data for Name: global_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_users (id, email, password_hash, full_name, active, created_at, updated_at, first_time_login, phone_number, phone_verified_at) FROM stdin;
7718cb5a-97b3-4a7f-9b9e-6f412589fff0	akosua.boateng@gmail.com	\N	Akosua Boateng	t	2026-08-23 01:16:44.202485+00	\N	t	0244 118 227	\N
913beb77-dd1a-404b-9a2a-9e47a2a99cf8	\N	\N	Yaa Asantewaa	t	2026-08-24 20:26:16.394288+00	\N	t	0201445908	\N
9fec7be3-47f7-4678-aefe-725cf061e06f	\N	\N	Adjoa Mensima	t	2026-08-24 23:39:39.284934+00	\N	t	0209887766	\N
83339dd7-89e8-4553-aaa3-ee5b3f73f094	abdulshakuraclement@yahoo.com	$2a$10$YZBayP56eXmItmKc0YNWEeaf22BD5JYsUmf26DLnMIcMy4ruvnGBS	Kwabena Osei-Mensah	t	2026-08-22 23:24:20.708051+00	\N	f	\N	\N
5af99e6c-77ee-4f8e-ac6f-4fedcc3b71e7	\N	\N	Mensah Owusu	t	2026-08-25 20:08:38.952238+00	\N	t	0245 663 019	\N
\.


--
-- Data for Name: guarantors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guarantors (id, tenant_id, occupant_id, first_name, last_name, phone, email, relationship, employer_name, job_title, work_address, notes, created_at, updated_at) FROM stdin;
202ad1be-4692-4e38-9309-3390a67ac1a6	oseimensah-properties	c285f73b-0a29-47d5-a720-57443ccbb4e3	Kofi	Mensah	0201 445 908		OTHER					2026-08-23 01:24:04.673867	\N
\.


--
-- Data for Name: inspection_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_items (id, inspection_id, tenant_id, room, item_name, condition, notes, photos, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, tenant_id, invoice_number, occupant_id, property_id, unit_id, occupant_name, occupant_email, property_name, unit_no, invoice_month, issued_date, due_date, amount, balance, currency, status, invoice_type, description, invoice_items, created_at, updated_at, advance_rent_id, agreement_id) FROM stdin;
0c0e58cd-fb49-4b2b-a2f8-0695c9b25e6b	oseimensah-properties	INV-2026-001	c285f73b-0a29-47d5-a720-57443ccbb4e3	7aeade41-e994-414a-ae8f-de43fe4a91db	d74fe5ae-b2df-4936-8c9b-f103bb6d651a	Akosua Boateng	akosua.boateng@gmail.com	Adenta Compound	Room 1	08/2026	2026-08-01	2026-08-23	14400.00	0.00	GHS	PAID	Rent Advance - 24 months	Two years rent paid in advance before move-in. 24 months x GHS 600 = GHS 14,400. Cash, hand to hand, 23/08/2026.	\N	2026-08-23 01:33:53.523037+00	2026-08-23 01:37:17.124776+00	\N	\N
3b09643c-69f0-4371-9558-68d974a13854	oseimensah-properties	INV-2026-002	c285f73b-0a29-47d5-a720-57443ccbb4e3	7aeade41-e994-414a-ae8f-de43fe4a91db	d74fe5ae-b2df-4936-8c9b-f103bb6d651a	Akosua Boateng	akosua.boateng@gmail.com	Adenta Compound	Room 1	09/2026	2026-09-01	2026-09-01	600.00	200.00	GHS	PARTIAL	Monthly Rent	September 2026 rent, Room 1.	\N	2026-08-23 02:07:46.523602+00	2026-08-23 02:11:52.14063+00	\N	\N
0d8e3176-f44e-4137-bcfa-e53a6ee72f84	oseimensah-properties	ADV-DBC365D1-2026-08	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	08/2026	2026-08-24	2026-08-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – August 2026 (month 1 of 24)	\N	2026-08-24 23:40:58.948749+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
e65c777e-eb36-42d8-905e-9a34ca658f63	oseimensah-properties	ADV-DBC365D1-2026-09	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	09/2026	2026-09-24	2026-09-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – September 2026 (month 2 of 24)	\N	2026-08-24 23:40:58.949304+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
b462a5b0-fd69-4c66-bf55-9215635edaa2	oseimensah-properties	ADV-DBC365D1-2026-10	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	10/2026	2026-10-24	2026-10-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – October 2026 (month 3 of 24)	\N	2026-08-24 23:40:58.949487+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
db5e539a-3d0d-4469-9d2a-c81514c89b01	oseimensah-properties	ADV-DBC365D1-2026-11	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	11/2026	2026-11-24	2026-11-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – November 2026 (month 4 of 24)	\N	2026-08-24 23:40:58.949636+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
83460b67-0666-42d2-ad00-7d369f7fd452	oseimensah-properties	ADV-DBC365D1-2026-12	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	12/2026	2026-12-24	2026-12-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – December 2026 (month 5 of 24)	\N	2026-08-24 23:40:58.949807+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
105abc45-0990-4a2c-a4c8-4aa14eb3b903	oseimensah-properties	ADV-DBC365D1-2027-01	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	01/2027	2027-01-24	2027-01-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – January 2027 (month 6 of 24)	\N	2026-08-24 23:40:58.949953+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
44092330-f339-4ceb-842e-dc00931b3b65	oseimensah-properties	ADV-DBC365D1-2027-02	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	02/2027	2027-02-24	2027-02-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – February 2027 (month 7 of 24)	\N	2026-08-24 23:40:58.950125+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
0c7f4647-cf5b-4256-8c16-5cea36c18dde	oseimensah-properties	ADV-DBC365D1-2027-03	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	03/2027	2027-03-24	2027-03-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – March 2027 (month 8 of 24)	\N	2026-08-24 23:40:58.950355+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
f2068d69-0921-40e2-9e26-ace95c703324	oseimensah-properties	ADV-DBC365D1-2027-04	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	04/2027	2027-04-24	2027-04-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – April 2027 (month 9 of 24)	\N	2026-08-24 23:40:58.95068+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
2ec0d850-9d60-41fe-b7f0-2d7cd558f75c	oseimensah-properties	ADV-DBC365D1-2027-05	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	05/2027	2027-05-24	2027-05-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – May 2027 (month 10 of 24)	\N	2026-08-24 23:40:58.951086+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
031e91af-e4c5-4940-a089-af22f0b34a95	oseimensah-properties	ADV-DBC365D1-2027-06	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	06/2027	2027-06-24	2027-06-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – June 2027 (month 11 of 24)	\N	2026-08-24 23:40:58.951377+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
87af80b8-4c60-442f-9ce9-f8c43b0c733b	oseimensah-properties	ADV-DBC365D1-2027-07	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	07/2027	2027-07-24	2027-07-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – July 2027 (month 12 of 24)	\N	2026-08-24 23:40:58.95161+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
76f8c4e8-adee-4144-aeb9-0b725cbcd638	oseimensah-properties	ADV-DBC365D1-2027-08	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	08/2027	2027-08-24	2027-08-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – August 2027 (month 13 of 24)	\N	2026-08-24 23:40:58.951874+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
1acebd31-f872-4d03-83c2-814c70530085	oseimensah-properties	ADV-DBC365D1-2027-09	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	09/2027	2027-09-24	2027-09-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – September 2027 (month 14 of 24)	\N	2026-08-24 23:40:58.952053+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
7955236e-cfaf-4c34-99bd-674a0e5d9cc5	oseimensah-properties	ADV-DBC365D1-2027-10	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	10/2027	2027-10-24	2027-10-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – October 2027 (month 15 of 24)	\N	2026-08-24 23:40:58.952201+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
c023475f-891f-4803-8eff-08f23399ec3d	oseimensah-properties	ADV-DBC365D1-2027-11	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	11/2027	2027-11-24	2027-11-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – November 2027 (month 16 of 24)	\N	2026-08-24 23:40:58.952462+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
35d65d5b-79a4-406c-b61e-460082ddd4d3	oseimensah-properties	ADV-DBC365D1-2027-12	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	12/2027	2027-12-24	2027-12-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – December 2027 (month 17 of 24)	\N	2026-08-24 23:40:58.952723+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
0b5e41d0-4dcd-4f05-8857-5a371ba287f5	oseimensah-properties	ADV-DBC365D1-2028-01	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	01/2028	2028-01-24	2028-01-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – January 2028 (month 18 of 24)	\N	2026-08-24 23:40:58.952903+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
d6ecc0de-476a-4e01-80bd-ac1ac542d93b	oseimensah-properties	ADV-DBC365D1-2028-02	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	02/2028	2028-02-24	2028-02-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – February 2028 (month 19 of 24)	\N	2026-08-24 23:40:58.953096+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
38dd4af4-7625-49a1-b915-432f76ea9b54	oseimensah-properties	INV-2026-003	c285f73b-0a29-47d5-a720-57443ccbb4e3	7aeade41-e994-414a-ae8f-de43fe4a91db	d74fe5ae-b2df-4936-8c9b-f103bb6d651a	Akosua Boateng	akosua.boateng@gmail.com	Adenta Compound	Room 1	07/2026	2026-07-01	2026-07-05	600.00	250.00	GHS	PARTIAL	Monthly Rent	July 2026 rent, Room 1. Not paid.	\N	2026-08-23 02:20:03.518503+00	2026-08-25 21:15:50.130355+00	\N	\N
da0136fb-42ce-4879-bc0e-502c891d0b52	oseimensah-properties	ADV-DBC365D1-2028-03	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	03/2028	2028-03-24	2028-03-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – March 2028 (month 20 of 24)	\N	2026-08-24 23:40:58.953367+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
62347353-9067-4dc7-81aa-dcff7f3ce6d1	oseimensah-properties	ADV-DBC365D1-2028-04	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	04/2028	2028-04-24	2028-04-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – April 2028 (month 21 of 24)	\N	2026-08-24 23:40:58.953605+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
56d9ca84-d1d1-45c2-a597-160a181f9e54	oseimensah-properties	ADV-DBC365D1-2028-05	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	05/2028	2028-05-24	2028-05-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – May 2028 (month 22 of 24)	\N	2026-08-24 23:40:58.953749+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
8beffccc-0f10-416e-bda6-50dc3523e1a6	oseimensah-properties	ADV-DBC365D1-2028-06	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	06/2028	2028-06-24	2028-06-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – June 2028 (month 23 of 24)	\N	2026-08-24 23:40:58.953889+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
891e6cfb-28b4-46b3-af13-6ab8ae59093a	oseimensah-properties	ADV-DBC365D1-2028-07	dc36c884-aaff-4650-bcc3-463a5f8c02ca	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Adjoa Mensima	\N	Adenta Compound	Room 7	07/2028	2028-07-24	2028-07-24	850.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – July 2028 (month 24 of 24)	\N	2026-08-24 23:40:58.954029+00	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N
8e6769e3-0711-4039-b37f-3eaeb8ec1927	oseimensah-properties	ADV-B70C44AB-2026-08	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	08/2026	2026-08-25	2026-08-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – August 2026 (month 1 of 12)	\N	2026-08-25 20:11:20.648702+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
b7fa9fc3-a477-4ed7-aaea-b3e437e5aa59	oseimensah-properties	ADV-B70C44AB-2026-09	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	09/2026	2026-09-25	2026-09-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – September 2026 (month 2 of 12)	\N	2026-08-25 20:11:20.653278+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
3ae463d2-e0b5-4ce4-be9c-547742654bd5	oseimensah-properties	ADV-B70C44AB-2026-10	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	10/2026	2026-10-25	2026-10-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – October 2026 (month 3 of 12)	\N	2026-08-25 20:11:20.653631+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
1302ef81-52e7-404f-89ef-a103e28e0835	oseimensah-properties	ADV-B70C44AB-2026-11	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	11/2026	2026-11-25	2026-11-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – November 2026 (month 4 of 12)	\N	2026-08-25 20:11:20.653897+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
7a0deab3-81f9-416b-9807-61430b087c9e	oseimensah-properties	ADV-B70C44AB-2026-12	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	12/2026	2026-12-25	2026-12-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – December 2026 (month 5 of 12)	\N	2026-08-25 20:11:20.654101+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
5fe11da7-3263-41dd-ba81-87aea2218f78	oseimensah-properties	ADV-B70C44AB-2027-01	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	01/2027	2027-01-25	2027-01-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – January 2027 (month 6 of 12)	\N	2026-08-25 20:11:20.654367+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
dc081f6b-2482-448e-a303-50680a2fd22f	oseimensah-properties	ADV-B70C44AB-2027-02	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	02/2027	2027-02-25	2027-02-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – February 2027 (month 7 of 12)	\N	2026-08-25 20:11:20.654533+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
68e821d4-3f05-471b-8614-52dc13210387	oseimensah-properties	ADV-B70C44AB-2027-03	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	03/2027	2027-03-25	2027-03-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – March 2027 (month 8 of 12)	\N	2026-08-25 20:11:20.65467+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
feda9786-b1b4-4fd6-9d57-fd2ae64c719f	oseimensah-properties	ADV-B70C44AB-2027-04	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	04/2027	2027-04-25	2027-04-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – April 2027 (month 9 of 12)	\N	2026-08-25 20:11:20.654778+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
6c3a8017-0adc-4c6a-8eaf-cc3571d6da6e	oseimensah-properties	ADV-B70C44AB-2027-05	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	05/2027	2027-05-25	2027-05-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – May 2027 (month 10 of 12)	\N	2026-08-25 20:11:20.654888+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
a4ae1ce7-0df1-4958-b9a5-0a98f7d8621a	oseimensah-properties	ADV-B70C44AB-2027-06	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	06/2027	2027-06-25	2027-06-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – June 2027 (month 11 of 12)	\N	2026-08-25 20:11:20.654995+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
2eb7c470-2c22-45e8-ad73-c00c279ef784	oseimensah-properties	ADV-B70C44AB-2027-07	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Mensah Owusu	\N	Adenta Compound	Room 9	07/2027	2027-07-25	2027-07-25	600.00	0.00	GHS	PAID	ADVANCE_RENT	Advance rent – July 2027 (month 12 of 12)	\N	2026-08-25 20:11:20.655119+00	\N	b70c44ab-fedb-4fac-a669-76673f371be4	\N
\.


--
-- Data for Name: late_fee_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.late_fee_logs (id, tenant_id, invoice_id, amount, currency, fee_date, applied_at) FROM stdin;
\.


--
-- Data for Name: learned_localities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learned_localities (id, tenant_id, name, name_key, region, district, latitude, longitude, created_at) FROM stdin;
\.


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ledger_entries (id, wallet_id, tenant_id, entry_type, category, amount, currency, running_balance, status, effective_date, payment_transaction_id, withdrawal_id, invoice_id, invoice_number, property_id, property_name, unit_id, unit_number, occupant_id, occupant_name, description, reference_code, created_at, payment_method, settlement) FROM stdin;
200656af-5cca-4a50-9eea-1331ac724bdf	fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	CREDIT	RENT_COLLECTED	14400.00	GHS	14400.00	COMPLETED	2026-08-23	c2c82172-84ff-45d1-9637-4fafa825c0a7	\N	0c0e58cd-fb49-4b2b-a2f8-0695c9b25e6b	INV-2026-001	\N	\N	\N	\N	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	Rent – Akosua Boateng (INV-2026-001)	PAY:c2c82172-84ff-45d1-9637-4fafa825c0a7	2026-08-23 01:37:17.082292	CASH	OFFLINE
abc1a0a8-0c4a-43a8-969b-f85905af6f87	fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	CREDIT	RENT_COLLECTED	400.00	GHS	14800.00	COMPLETED	2026-08-23	bea7bf41-5b51-44fb-8556-290ed8c100d4	\N	3b09643c-69f0-4371-9558-68d974a13854	INV-2026-002	\N	\N	\N	\N	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	Rent – Akosua Boateng (INV-2026-002)	PAY:bea7bf41-5b51-44fb-8556-290ed8c100d4	2026-08-23 02:11:52.134062	CASH	OFFLINE
65644f61-861a-4d6f-b0a2-ee4bf639a3ac	fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	CREDIT	ADVANCE_RENT_COLLECTED	20400.00	GHS	35200.00	COMPLETED	2026-08-24	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	\N	\N	\N	7aeade41-e994-414a-ae8f-de43fe4a91db	Adenta Compound	0018bbf1-8a32-4069-9843-538f77cd3753	Room 7	dc36c884-aaff-4650-bcc3-463a5f8c02ca	Adjoa Mensima	Advance rent – Unit Room 7, Adenta Compound – Adjoa Mensima	PAY:dbc365d1-413e-47cf-98d6-fab2cf1f38a2	2026-08-24 23:40:59.00172	CASH	OFFLINE
90096eb1-db5a-4c1f-90b5-63becb916695	fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	CREDIT	ADVANCE_RENT_COLLECTED	7200.00	GHS	42400.00	COMPLETED	2026-08-25	b70c44ab-fedb-4fac-a669-76673f371be4	\N	\N	\N	7aeade41-e994-414a-ae8f-de43fe4a91db	Adenta Compound	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Room 9	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	Mensah Owusu	Advance rent – Unit Room 9, Adenta Compound – Mensah Owusu	PAY:b70c44ab-fedb-4fac-a669-76673f371be4	2026-08-25 20:11:20.817914	CASH	OFFLINE
c64bf8c1-49cd-4d45-be09-321bb659d723	fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	CREDIT	RENT_COLLECTED	350.00	GHS	42750.00	COMPLETED	2026-08-25	46e1d7d1-4e31-4a99-be2f-6359faff12af	\N	38dd4af4-7625-49a1-b915-432f76ea9b54	INV-2026-003	\N	\N	\N	\N	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	Rent – Akosua Boateng (INV-2026-003)	PAY:46e1d7d1-4e31-4a99-be2f-6359faff12af	2026-08-25 21:15:50.032906	CASH	OFFLINE
\.


--
-- Data for Name: maintainer_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintainer_reviews (id, maintainer_id, tenant_id, occupant_id, maintenance_request_id, rating, comment, created_at, direct_job_request_id) FROM stdin;
\.


--
-- Data for Name: maintainers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintainers (id, tenant_id, name, email, phone, company_name, specializations, status, rating, total_jobs, completed_jobs, insurance_expiry_date, tax_id, is_compliant, is_active, background_check_passed, insurance_expiry, created_at, updated_at, city, region, price_tier, availability, response_time, bio, years_active, listed_in_marketplace, marketplace_consent_at, marketplace_consent_by) FROM stdin;
a0203392-9a08-42d7-9a82-16522711024d	oseimensah-properties	Kwame Adjei	\N	0208 776 341	Adjei Plumbing Works	{Plumbing}	active	\N	0	0	\N	\N	t	t	f	\N	2026-08-23 03:37:45.234383	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: maintenance_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_categories (id, tenant_id, name, description, icon, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_comments (id, tenant_id, maintenance_request_id, author_id, author_name, content, visibility, attachments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_part_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_part_items (id, tenant_id, maintenance_request_id, part_name, quantity, unit_cost, notes, created_at) FROM stdin;
d9847ea0-2ae3-4db9-a936-f5bbae232eba	oseimensah-properties	34734099-2283-44d6-9989-70116407ba47	Ball valve and washers	1	80.00	Bought at Adenta market by Yaw, receipt kept	2026-08-23 03:23:53.132124
d18deb83-51c0-4da8-8083-bfba33e1db98	oseimensah-properties	34734099-2283-44d6-9989-70116407ba47	Plumber labour (Kwame Adjei)	1	250.00	Paid cash on the day. Not a part - there is nowhere else to put labour.	2026-08-23 03:45:26.730333
e2a0dfe5-8dc8-446c-a481-26d65ceedfe5	oseimensah-properties	d7e8addd-14ee-4592-ba91-93cddf08162e	ECG prepaid meter box and cable	1	120.00	\N	2026-08-25 21:25:57.535354
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_requests (id, tenant_id, request_number, title, description, category_id, sub_category, priority, status, property_id, unit_id, occupant_id, maintainer_id, requested_by, assigned_to, approved_by, scheduled_date, target_resolution_date, completed_date, is_sla_breached, permission_to_enter, entry_instructions, preferred_time_slots, estimated_cost, actual_cost, billable_to, currency, images, notes, version, created_at, updated_at, image_file_ids, issue_type, complaint_category, tenant_confirmed, confirmed_by, confirmed_at, reopen_reason, labour_cost) FROM stdin;
34734099-2283-44d6-9989-70116407ba47	oseimensah-properties	REQ-20260823-4B3208CF	Toilet blocked - Room 4	Tenant reported on WhatsApp this morning that the toilet in Room 4 is blocked and water is backing up onto the floor. Shared bathroom, so it affects the whole block. Needs a plumber today.	\N	\N	HIGH	closed	7aeade41-e994-414a-ae8f-de43fe4a91db	5031234b-d2bc-45f1-bd05-839ce907fac8	\N	a0203392-9a08-42d7-9a82-16522711024d	3ac9b037-fad8-4741-aef3-be0a3659d470	\N	3ac9b037-fad8-4741-aef3-be0a3659d470	\N	2026-08-24 03:20:04.060629	2026-08-23 03:46:26.994896	f	f	\N	\N	\N	330.00	property	GHS	\N	Yaw to let the plumber in. Whole block shares this toilet.	8	2026-08-23 03:20:04.063393	2026-08-23 03:47:32.436189	\N	REPAIR	\N	f	\N	\N	\N	\N
d7e8addd-14ee-4592-ba91-93cddf08162e	oseimensah-properties	REQ-20260825-1DA80B87	ECG meter box burnt - Room 3	Prepaid meter box burnt out on Sunday night. No light in Room 3 and the neighbours on the same board are complaining. Electrician needed same day.	\N	\N	MEDIUM	pending	7aeade41-e994-414a-ae8f-de43fe4a91db	f123e463-8aad-459f-972b-d0057073c856	\N	\N	3ac9b037-fad8-4741-aef3-be0a3659d470	\N	\N	\N	2026-08-28 21:20:19.025767	\N	f	f	\N	\N	\N	300.00	property	GHS	\N	\N	2	2026-08-25 21:20:19.028705	2026-08-25 21:25:57.551489	\N	REPAIR	\N	f	\N	\N	\N	180.00
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notices (id, tenant_id, occupant_id, unit_id, property_id, type, title, body, delivery_method, status, source_type, source_id, issued_by_name, issued_at, acknowledged_at, created_at, updated_at, delivery_note) FROM stdin;
\.


--
-- Data for Name: notification_outbox; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_outbox (id, tenant_id, global_user_id, type, recipient_address, subject, payload, status, retry_count, next_retry_at, provider_message_id, created_at, updated_at, sender_display_name, origin) FROM stdin;
89a2d25a-554e-49ea-9988-11451243f10d	\N	\N	EMAIL	abdulshakuraclement@yahoo.com	Your Verification Code	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n  <title>TenantX — Verification Code</title>\n</head>\n<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">\n  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;">\n    <tr><td align="center">\n      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">\n\n        <!-- Logo / platform name -->\n        <tr><td style="padding-bottom:20px;text-align:center;">\n          \n          <span style="font-size:22px;font-weight:bold;color:#7367F0;">TenantX</span>\n        </td></tr>\n\n        <!-- Card -->\n        <tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;">\n          <div style="height:4px;background-color:#7367F0;"></div>\n          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px;">\n            <tr><td>\n              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#212121;">\n                Hi <span>Kwabena Osei-Mensah</span>,\n              </p>\n              <p style="margin:0 0 24px;font-size:15px;color:#424242;line-height:1.6;">\n                Your verification code is:\n              </p>\n              <!-- OTP box -->\n              <div style="text-align:center;margin:0 0 24px;">\n                <span style="display:inline-block;padding:14px 32px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#ffffff;background-color:#7367F0;border-radius:8px;">978610</span>\n              </div>\n              <p style="margin:0 0 8px;font-size:14px;color:#757575;text-align:center;">\n                Expires in <strong>10</strong> minutes.\n              </p>\n              <p style="margin:0;font-size:13px;color:#9e9e9e;text-align:center;">\n                If you didn't request this, you can safely ignore this email.\n              </p>\n            </td></tr>\n          </table>\n        </td></tr>\n\n        <!-- Footer -->\n        <tr><td style="padding:20px 0 0;text-align:center;">\n          <p style="margin:0;font-size:12px;color:#9e9e9e;">\n            &copy; <span>TenantX</span>. All rights reserved.\n          </p>\n        </td></tr>\n\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>\n	SENT	0	2026-08-22 23:20:51.850535+00	\N	2026-08-22 23:20:51.850488+00	2026-08-22 23:20:56.642753+00	\N	PLATFORM
c73d4dca-6601-4a89-83ce-e926648ffc99	\N	\N	EMAIL	akosua.boateng@gmail.com	Welcome	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n  <title>Welcome to TenantX</title>\n</head>\n<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">\n  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;">\n    <tr><td align="center">\n      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">\n\n        <!-- Logo / platform name -->\n        <tr><td style="padding-bottom:20px;text-align:center;">\n          \n          <span style="font-size:22px;font-weight:bold;color:#7367F0;">TenantX</span>\n        </td></tr>\n\n        <!-- Card -->\n        <tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;">\n          <div style="height:4px;background-color:#7367F0;"></div>\n          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px;">\n            <tr><td>\n              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#212121;">\n                Hi <span>Akosua Boateng</span>,\n              </p>\n              <!-- Who set them up and where. The occupant did not ask for this email, so it has to\n                   say where it came from before it shows them a code. -->\n              <p style="margin:0 0 16px;font-size:15px;color:#424242;line-height:1.6;">\n                <span>\n                  You've been added as an occupant of\n                  <strong>Adenta Compound</strong><span>, unit <strong>Room 1</strong></span>.\n                </span>\n                \n                Your account is ready — use the code below to set your password and sign in for the\n                first time.\n              </p>\n              <!-- OTP box -->\n              <div style="text-align:center;margin:0 0 24px;">\n                <span style="display:inline-block;padding:14px 32px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#ffffff;background-color:#7367F0;border-radius:8px;">465462</span>\n              </div>\n              <p style="margin:0 0 24px;font-size:14px;color:#757575;text-align:center;">\n                Expires in <strong>10</strong> minutes.\n              </p>\n              <p style="margin:0 0 24px;font-size:15px;color:#424242;line-height:1.6;">\n                <span>Your landlord will share the TenantX app with you shortly.</span>\n              </p>\n              <p style="margin:0;font-size:15px;color:#424242;line-height:1.6;">\n                The <span>TenantX</span> Team\n              </p>\n            </td></tr>\n          </table>\n        </td></tr>\n\n        <!-- Footer -->\n        <tr><td style="padding:20px 0 0;text-align:center;">\n          <p style="margin:0;font-size:12px;color:#9e9e9e;">\n            &copy; <span>TenantX</span>. All rights reserved.\n          </p>\n        </td></tr>\n\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>\n	SENT	0	2026-08-23 01:16:45.426048+00	\N	2026-08-23 01:16:45.425993+00	2026-08-23 01:16:59.803604+00	Osei-Mensah Properties	PLATFORM
4e33a476-064e-4a24-86bf-8b8a3fda58a9	\N	\N	EMAIL	abdulshakuraclement@yahoo.com	TenantX - Password Reset Code	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n  <title>TenantX — Verification Code</title>\n</head>\n<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">\n  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;">\n    <tr><td align="center">\n      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">\n\n        <!-- Logo / platform name -->\n        <tr><td style="padding-bottom:20px;text-align:center;">\n          \n          <span style="font-size:22px;font-weight:bold;color:#7367F0;">TenantX</span>\n        </td></tr>\n\n        <!-- Card -->\n        <tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;">\n          <div style="height:4px;background-color:#7367F0;"></div>\n          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px;">\n            <tr><td>\n              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#212121;">\n                Hi <span>Kwabena Osei-Mensah</span>,\n              </p>\n              <p style="margin:0 0 24px;font-size:15px;color:#424242;line-height:1.6;">\n                Your verification code is:\n              </p>\n              <!-- OTP box -->\n              <div style="text-align:center;margin:0 0 24px;">\n                <span style="display:inline-block;padding:14px 32px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#ffffff;background-color:#7367F0;border-radius:8px;">272198</span>\n              </div>\n              <p style="margin:0 0 8px;font-size:14px;color:#757575;text-align:center;">\n                Expires in <strong>10</strong> minutes.\n              </p>\n              <p style="margin:0;font-size:13px;color:#9e9e9e;text-align:center;">\n                If you didn't request this, you can safely ignore this email.\n              </p>\n            </td></tr>\n          </table>\n        </td></tr>\n\n        <!-- Footer -->\n        <tr><td style="padding:20px 0 0;text-align:center;">\n          <p style="margin:0;font-size:12px;color:#9e9e9e;">\n            &copy; <span>TenantX</span>. All rights reserved.\n          </p>\n        </td></tr>\n\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>\n	FAILED	5	2026-08-26 15:59:08.612866+00	\N	2026-08-26 15:07:47.688517+00	2026-08-26 15:59:12.793221+00	\N	PLATFORM
5840b133-eb99-4798-89ac-24dd9dcacfe6	\N	\N	EMAIL	abdulshakuraclement@yahoo.com	TenantX - Password Reset Code	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n  <title>TenantX — Verification Code</title>\n</head>\n<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">\n  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:32px 16px;">\n    <tr><td align="center">\n      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">\n\n        <!-- Logo / platform name -->\n        <tr><td style="padding-bottom:20px;text-align:center;">\n          \n          <span style="font-size:22px;font-weight:bold;color:#7367F0;">TenantX</span>\n        </td></tr>\n\n        <!-- Card -->\n        <tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;">\n          <div style="height:4px;background-color:#7367F0;"></div>\n          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px;">\n            <tr><td>\n              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#212121;">\n                Hi <span>Kwabena Osei-Mensah</span>,\n              </p>\n              <p style="margin:0 0 24px;font-size:15px;color:#424242;line-height:1.6;">\n                Your verification code is:\n              </p>\n              <!-- OTP box -->\n              <div style="text-align:center;margin:0 0 24px;">\n                <span style="display:inline-block;padding:14px 32px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#ffffff;background-color:#7367F0;border-radius:8px;">793532</span>\n              </div>\n              <p style="margin:0 0 8px;font-size:14px;color:#757575;text-align:center;">\n                Expires in <strong>10</strong> minutes.\n              </p>\n              <p style="margin:0;font-size:13px;color:#9e9e9e;text-align:center;">\n                If you didn't request this, you can safely ignore this email.\n              </p>\n            </td></tr>\n          </table>\n        </td></tr>\n\n        <!-- Footer -->\n        <tr><td style="padding:20px 0 0;text-align:center;">\n          <p style="margin:0;font-size:12px;color:#9e9e9e;">\n            &copy; <span>TenantX</span>. All rights reserved.\n          </p>\n        </td></tr>\n\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>\n	FAILED	5	2026-08-26 16:00:19.613997+00	\N	2026-08-26 15:09:03.262359+00	2026-08-26 16:00:23.872941+00	\N	PLATFORM
\.


--
-- Data for Name: occupants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.occupants (id, tenant_id, first_name, last_name, email, phone, avatar, status, property_id, unit_id, unit_no, move_in_date, move_out_date, emergency_contact, documents, created_at, updated_at, search_vector, avatar_file_id, ghana_card_id, id_type, occupation, family_members_count, dob, previous_address, permanent_address) FROM stdin;
c285f73b-0a29-47d5-a720-57443ccbb4e3	oseimensah-properties	Akosua	Boateng	akosua.boateng@gmail.com	0244 118 227	\N	active	7aeade41-e994-414a-ae8f-de43fe4a91db	d74fe5ae-b2df-4936-8c9b-f103bb6d651a	Room 1	2026-08-23	\N	\N	\N	2026-08-23 01:16:43.932375+00	\N	'0244':4B '1':8C '118':5B '227':6B 'akosua':1A 'akosua.boateng@gmail.com':3B 'boateng':2A 'room':7C	\N	\N	\N	\N	\N	\N	\N	\N
6aa60021-c4dc-4041-aecf-956f7d74dfa0	oseimensah-properties	Yaa	Asantewaa	\N	0201445908	\N	active	7aeade41-e994-414a-ae8f-de43fe4a91db	410bb23f-636a-45fe-a330-6440a5289fdf	Room 2	2026-08-24	\N	\N	\N	2026-08-24 20:26:16.245631+00	\N	'0201445908':3B '2':5C 'asantewaa':2A 'room':4C 'yaa':1A	\N	\N	\N	\N	\N	\N	\N	\N
dc36c884-aaff-4650-bcc3-463a5f8c02ca	oseimensah-properties	Adjoa	Mensima	\N	0209887766	\N	active	7aeade41-e994-414a-ae8f-de43fe4a91db	0018bbf1-8a32-4069-9843-538f77cd3753	Room 7	2026-08-24	\N	\N	\N	2026-08-24 23:39:39.032797+00	\N	'0209887766':3B '7':5C 'adjoa':1A 'mensima':2A 'room':4C	\N	\N	\N	\N	\N	\N	\N	\N
a3e87dbf-f309-4095-8261-3f1f1f5b11aa	oseimensah-properties	Mensah	Owusu	\N	0245 663 019	\N	active	7aeade41-e994-414a-ae8f-de43fe4a91db	f5b3f921-41e3-45f5-b782-fde7c44e5b32	Room 9	2026-08-25	\N	\N	\N	2026-08-25 20:08:38.68504+00	\N	'019':5B '0245':3B '663':4B '9':7C 'mensah':1A 'owusu':2A 'room':6C	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (id, tenant_id, invoice_id, invoice_number, occupant_id, occupant_name, amount, currency, payment_method, mobile_network, wallet_number, cheque_number, cheque_bank, gateway_name, gateway_transaction_id, client_trans_id, status, failure_reason, notes, payment_date, initiated_at, completed_at, created_at, updated_at, advance_rent_id, needs_reconciliation, reconciliation_reason, flagged_for_reconciliation_at, reconciliation_resolved_at, reconciliation_resolved_by, reconciliation_resolution) FROM stdin;
c2c82172-84ff-45d1-9637-4fafa825c0a7	oseimensah-properties	0c0e58cd-fb49-4b2b-a2f8-0695c9b25e6b	INV-2026-001	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	14400.00	GHS	CASH	\N	\N	\N	\N	\N	\N	\N	RECORDED	\N	Two years advance, cash received hand to hand at the compound. Counted in front of her brother Kofi Mensah.	2026-08-23	\N	2026-08-23 01:37:16.949342	2026-08-23 01:37:16.95172	\N	\N	f	\N	\N	\N	\N	\N
bea7bf41-5b51-44fb-8556-290ed8c100d4	oseimensah-properties	3b09643c-69f0-4371-9558-68d974a13854	INV-2026-002	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	400.00	GHS	CASH	\N	\N	\N	\N	\N	\N	\N	RECORDED	\N	Part payment. She will bring the remaining GHS 200 after market day.	2026-08-23	\N	2026-08-23 02:11:52.128958	2026-08-23 02:11:52.129217	\N	\N	f	\N	\N	\N	\N	\N
46e1d7d1-4e31-4a99-be2f-6359faff12af	oseimensah-properties	38dd4af4-7625-49a1-b915-432f76ea9b54	INV-2026-003	c285f73b-0a29-47d5-a720-57443ccbb4e3	Akosua Boateng	350.00	GHS	CASH	\N	\N	\N	\N	\N	\N	\N	RECORDED	\N	Part payment of the July rent. GHS 350 cash at the compound, counted in front of her. She brings the remaining GHS 250 after market day.	2026-08-25	\N	2026-08-25 21:15:49.952703	2026-08-25 21:15:49.989858	\N	\N	f	\N	\N	\N	\N	\N
630076e3-7f2f-42d2-9e81-a9c1c7bc63b5	oseimensah-properties	\N	\N	dc36c884-aaff-4650-bcc3-463a5f8c02ca	Adjoa Mensima	20400.00	GHS	CASH	\N	\N	\N	\N	\N	\N	\N	RECORDED	\N	Reconstructed by migration V162 from the advance rent record. The original entry predates advance rent recording a payment transaction, so no first-hand payment detail exists for it; the date shown is when the advance was recorded.	2026-08-24	\N	2026-08-24 23:40:58.919857	2026-08-24 23:40:58.919857	\N	dbc365d1-413e-47cf-98d6-fab2cf1f38a2	f	\N	\N	\N	\N	\N
42960c94-47ea-467a-8070-934227ac15e9	oseimensah-properties	\N	\N	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	Mensah Owusu	7200.00	GHS	CASH	\N	\N	\N	\N	\N	\N	\N	RECORDED	\N	Reconstructed by migration V162 from the advance rent record. The original entry predates advance rent recording a payment transaction, so no first-hand payment detail exists for it; the date shown is when the advance was recorded.	2026-08-25	\N	2026-08-25 20:11:20.592337	2026-08-25 20:11:20.592337	\N	b70c44ab-fedb-4fac-a669-76673f371be4	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: pending_signups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_signups (id, email, password_hash, full_name, company_name, company_description, phone_number, otp_hash, attempts, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: plan_feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plan_feature_flags (id, plan_id, feature_key, enabled, display_name) FROM stdin;
f62070a9-317a-4c3d-a6c4-cc7121bd64b7	7bbe461e-aceb-4606-a538-b8d7cb038b6a	SMS_REMINDERS	f	SMS Reminders
6279b975-77b2-4c5e-9f5a-0eebd5ca7c57	41a47258-49b8-4ded-8707-7952071a291c	SMS_REMINDERS	t	SMS Reminders
906d08bc-64fa-436e-898b-90197c622ba9	900ea37a-5e1b-4a39-87bd-d725780ac798	SMS_REMINDERS	t	SMS Reminders
0b34b73d-52eb-4f42-91ed-c9162d8dabb9	7bbe461e-aceb-4606-a538-b8d7cb038b6a	WHATSAPP_REMINDERS	f	WhatsApp Reminders
d1bc8817-b03a-4454-8417-15347796cbb2	41a47258-49b8-4ded-8707-7952071a291c	WHATSAPP_REMINDERS	t	WhatsApp Reminders
b1086451-22bb-4112-98f7-daf4541f556e	900ea37a-5e1b-4a39-87bd-d725780ac798	WHATSAPP_REMINDERS	t	WhatsApp Reminders
a70d436c-7780-4e0d-afe2-af077a0e2179	7bbe461e-aceb-4606-a538-b8d7cb038b6a	ADVANCED_REPORTS	f	Advanced Reports
57124ce2-1762-46c2-b70b-c20b9c627760	41a47258-49b8-4ded-8707-7952071a291c	ADVANCED_REPORTS	t	Advanced Reports
020b16f6-ea45-4ce0-ad32-c92ca7bf51dc	900ea37a-5e1b-4a39-87bd-d725780ac798	ADVANCED_REPORTS	t	Advanced Reports
e485a321-28c1-40c1-bd07-f7f87709fcdb	7bbe461e-aceb-4606-a538-b8d7cb038b6a	MAINTENANCE_CONTRACTORS	f	Maintenance Contractors
ea8c20a8-1988-4dd3-8125-fd91611df6a4	41a47258-49b8-4ded-8707-7952071a291c	MAINTENANCE_CONTRACTORS	t	Maintenance Contractors
e7dc4f9b-53cc-406e-98ae-49fabcf1901c	900ea37a-5e1b-4a39-87bd-d725780ac798	MAINTENANCE_CONTRACTORS	t	Maintenance Contractors
2e47a1ba-1b04-4a75-b9b6-7c3de05aff20	7bbe461e-aceb-4606-a538-b8d7cb038b6a	RENT_COLLECTION	f	Mobile Money Rent Collection
131cc41a-5237-449c-9da2-61a35d669aba	41a47258-49b8-4ded-8707-7952071a291c	RENT_COLLECTION	f	Mobile Money Rent Collection
4533d13f-14b4-4266-ab1b-3326506110df	7bbe461e-aceb-4606-a538-b8d7cb038b6a	LANDLORD_WALLET	f	Landlord Wallet
a1c55f2c-67f4-464b-bc56-5f71f41ec56c	41a47258-49b8-4ded-8707-7952071a291c	LANDLORD_WALLET	f	Landlord Wallet
55d1bcba-3d25-48ae-a41b-ed1d7cf28b9a	7bbe461e-aceb-4606-a538-b8d7cb038b6a	AUTOMATED_RECONCILIATION	f	Automated Reconciliation
df01421c-1fdc-4e6a-a71e-2639a2d107d0	41a47258-49b8-4ded-8707-7952071a291c	AUTOMATED_RECONCILIATION	f	Automated Reconciliation
2ccb1e35-ee9e-4cf9-ab49-89b68703e2e4	7bbe461e-aceb-4606-a538-b8d7cb038b6a	FINANCIAL_REPORTS	f	Financial & GRA Reports
49630a26-ce5a-4a49-b172-4c74de1f606c	41a47258-49b8-4ded-8707-7952071a291c	FINANCIAL_REPORTS	f	Financial & GRA Reports
7c649e5b-ea3b-4253-a871-5646ea40646e	7bbe461e-aceb-4606-a538-b8d7cb038b6a	COMMUNICATION	f	Send Messages & Notices
8c2e5241-8460-4264-b461-a7d3cac6da91	41a47258-49b8-4ded-8707-7952071a291c	COMMUNICATION	t	Send Messages & Notices
fada0fcd-c82f-4438-82b1-258abc5b8fb4	7bbe461e-aceb-4606-a538-b8d7cb038b6a	EXPENSES	f	Expense Tracking
0a022586-c734-47b6-a238-0f53689bee48	41a47258-49b8-4ded-8707-7952071a291c	EXPENSES	t	Expense Tracking
ec3ec7c4-1a91-4024-9ed6-9be03b5a48aa	7bbe461e-aceb-4606-a538-b8d7cb038b6a	INSPECTIONS	f	Property Inspections
f82d0b6b-e67f-4e90-8872-c7a953784e73	41a47258-49b8-4ded-8707-7952071a291c	INSPECTIONS	t	Property Inspections
3b2b124c-ed88-42a9-875c-f2fcfe22b340	7bbe461e-aceb-4606-a538-b8d7cb038b6a	VACANCY_LISTINGS	f	Vacancy Listings
50773a7f-11c8-4e0e-a079-d4f01a2e7544	41a47258-49b8-4ded-8707-7952071a291c	VACANCY_LISTINGS	t	Vacancy Listings
858aab5c-508f-4fab-9c50-095f0a06a6c3	7bbe461e-aceb-4606-a538-b8d7cb038b6a	ADVANCE_RENT	f	Advance Rent Collection
48bd8ab5-a5de-41e8-99d9-e214c51efcf4	41a47258-49b8-4ded-8707-7952071a291c	ADVANCE_RENT	t	Advance Rent Collection
1f520edb-d09e-4699-be12-4d7b5d3200a8	7bbe461e-aceb-4606-a538-b8d7cb038b6a	CAUTION_FEES	f	Caution Fees
e518baee-59a4-4b78-86d3-ab01e785756e	41a47258-49b8-4ded-8707-7952071a291c	CAUTION_FEES	t	Caution Fees
a919f67c-5fe0-486a-80d7-a13c6f4b1c80	7bbe461e-aceb-4606-a538-b8d7cb038b6a	RENT_REVIEWS	f	Rent Review Workflows
25ad877c-a96c-474e-a59f-12e90b9995d4	41a47258-49b8-4ded-8707-7952071a291c	RENT_REVIEWS	t	Rent Review Workflows
aa44095b-b08e-4a71-afa2-a375abc4b064	7bbe461e-aceb-4606-a538-b8d7cb038b6a	LATE_FEES	f	Late Payment Fees
95268e11-cbff-43c8-a27f-5b88516fbdbf	41a47258-49b8-4ded-8707-7952071a291c	LATE_FEES	t	Late Payment Fees
497c565e-0299-4bee-b197-db33262bf169	7bbe461e-aceb-4606-a538-b8d7cb038b6a	PREVENTATIVE_MAINTENANCE	f	Preventative Maintenance
0f390d96-8bd7-4c7c-b107-b45762f213cd	41a47258-49b8-4ded-8707-7952071a291c	PREVENTATIVE_MAINTENANCE	t	Preventative Maintenance
9d7cbbf2-0d1b-417c-b783-88806067e1c2	7bbe461e-aceb-4606-a538-b8d7cb038b6a	UTILITIES_MANAGEMENT	f	Utility Meter Management
85ce0fd0-fe49-499b-bafa-cd9f2895ed92	41a47258-49b8-4ded-8707-7952071a291c	UTILITIES_MANAGEMENT	f	Utility Meter Management
425e364d-f785-49b3-a460-1310b9d43aea	7bbe461e-aceb-4606-a538-b8d7cb038b6a	AGENT_MANAGEMENT	f	Agent Management
24b3fccc-31a1-45d6-a032-06c25f484057	41a47258-49b8-4ded-8707-7952071a291c	AGENT_MANAGEMENT	f	Agent Management
79cd89fc-7275-420e-a218-c645bb5ad2e9	900ea37a-5e1b-4a39-87bd-d725780ac798	RENT_COLLECTION	t	Mobile Money Rent Collection
0061d5df-f911-4670-81e1-90d16fadb008	900ea37a-5e1b-4a39-87bd-d725780ac798	LANDLORD_WALLET	t	Landlord Wallet
8c0967ec-5481-49d4-8e26-60f9fa75b8ad	900ea37a-5e1b-4a39-87bd-d725780ac798	AUTOMATED_RECONCILIATION	t	Automated Reconciliation
6a02a164-3999-42d8-864b-81ebca22ef23	900ea37a-5e1b-4a39-87bd-d725780ac798	FINANCIAL_REPORTS	t	Financial & GRA Reports
add9d934-814e-4011-b1dc-a837fff8fb7a	900ea37a-5e1b-4a39-87bd-d725780ac798	COMMUNICATION	t	Send Messages & Notices
9dc467c9-8d82-4681-9bf6-cfdfcda7fda3	900ea37a-5e1b-4a39-87bd-d725780ac798	EXPENSES	t	Expense Tracking
bc3c5b00-22e9-438f-99a8-f3280f7110ff	900ea37a-5e1b-4a39-87bd-d725780ac798	INSPECTIONS	t	Property Inspections
80329bad-6e43-4e93-92a2-2f42532c3b23	900ea37a-5e1b-4a39-87bd-d725780ac798	VACANCY_LISTINGS	t	Vacancy Listings
7d4122d7-83c8-4cf7-9261-2a4895f66039	900ea37a-5e1b-4a39-87bd-d725780ac798	ADVANCE_RENT	t	Advance Rent Collection
faf8f0ba-3d92-425c-a31e-afc702c3f467	900ea37a-5e1b-4a39-87bd-d725780ac798	CAUTION_FEES	t	Caution Fees
a3e47a4e-5eea-4f2f-aa4b-1289ce669e4d	900ea37a-5e1b-4a39-87bd-d725780ac798	RENT_REVIEWS	t	Rent Review Workflows
d6a258e3-81dd-4c0d-9680-757f6b40d4f3	900ea37a-5e1b-4a39-87bd-d725780ac798	LATE_FEES	t	Late Payment Fees
020d5f66-c174-4eae-820a-6cd42768e826	900ea37a-5e1b-4a39-87bd-d725780ac798	PREVENTATIVE_MAINTENANCE	t	Preventative Maintenance
767f1eff-8f24-4fa0-bb70-82d340ad36ec	900ea37a-5e1b-4a39-87bd-d725780ac798	UTILITIES_MANAGEMENT	t	Utility Meter Management
472dc0c4-015e-4705-a905-d4a459d1929f	900ea37a-5e1b-4a39-87bd-d725780ac798	AGENT_MANAGEMENT	t	Agent Management
\.


--
-- Data for Name: platform_announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_announcements (id, title, message, severity, active, expires_at, created_by, created_at, updated_at, scheduled_at) FROM stdin;
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_settings (setting_key, setting_value, description, category, updated_at, updated_by) FROM stdin;
feature.sms_reminders.enabled	true	Enable SMS reminder notifications platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.whatsapp_reminders.enabled	true	Enable WhatsApp reminder notifications platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.advanced_reports.enabled	true	Enable advanced reporting features platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.maintenance_contractors.enabled	true	Enable maintenance contractor module platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.rent_collection.enabled	true	Enable rent collection module platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.landlord_wallet.enabled	true	Enable landlord wallet module platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.automated_reconciliation.enabled	true	Enable automated reconciliation platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
feature.financial_reports.enabled	true	Enable financial reports module platform-wide	FEATURE_FLAGS	2026-08-22 23:11:04.089883+00	\N
gateway.active	REDDE	Name of the active payment gateway adapter	PAYMENT_GATEWAY	2026-08-22 23:11:04.089883+00	\N
gateway.environment	PRODUCTION	Gateway environment: PRODUCTION or SANDBOX	PAYMENT_GATEWAY	2026-08-22 23:11:04.089883+00	\N
gateway.redde.merchant_id		Redde merchant ID (leave blank to use per-tenant)	PAYMENT_GATEWAY	2026-08-22 23:11:04.089883+00	\N
gateway.redde.api_key		Redde platform-level API key (optional)	PAYMENT_GATEWAY	2026-08-22 23:11:04.089883+00	\N
notification.from_address	noreply@tenantx.app	Sender email address for all platform emails	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.email.invoice_issued	true	Send email when an invoice is issued	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.email.payment_failed	true	Send email when a payment fails	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.email.payment_success	true	Send email when a payment succeeds	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.email.subscription_renewed	true	Send email when a subscription renews	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.email.trial_expiring	true	Send email 3 days before trial expiry	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.sms.payment_reminder	false	Send SMS payment reminders (requires SMS provider)	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
notification.whatsapp.payment_reminder	false	Send WhatsApp payment reminders	NOTIFICATIONS	2026-08-22 23:11:04.089883+00	\N
billing.retry.max_count	3	Maximum number of automatic payment retry attempts	BILLING_RETRY	2026-08-22 23:11:04.089883+00	\N
billing.retry.interval_seconds	3600	Seconds between automatic retry attempts (default 1 hr)	BILLING_RETRY	2026-08-22 23:11:04.089883+00	\N
billing.grace_period_days	3	Days before downgrading to FREE after all retries fail	BILLING_RETRY	2026-08-22 23:11:04.089883+00	\N
billing.retry.enabled	true	Enable automatic billing retries	BILLING_RETRY	2026-08-22 23:11:04.089883+00	\N
platform.maintenance.enabled	false	When true, the platform returns 503 to all tenant requests. Admin endpoints remain accessible.	MAINTENANCE	2026-08-22 23:11:04.102778+00	\N
platform.maintenance.message	TenantX is temporarily offline for scheduled maintenance. We will be back shortly.	Message shown to tenants during maintenance mode.	MAINTENANCE	2026-08-22 23:11:04.102778+00	\N
platform.maintenance.estimated_end		Optional: estimated time maintenance will end (ISO 8601 or human-readable).	MAINTENANCE	2026-08-22 23:11:04.102778+00	\N
billing.transaction_fee_rate	0.0150	Platform fee rate applied to each successful subscription payment (decimal fraction, e.g. 0.0150 = 1.50%).	BILLING	2026-08-22 23:11:04.125458+00	\N
rate_limit.enabled	false	When true, per-plan API rate limits are enforced.	RATE_LIMIT	2026-08-22 23:11:04.156177+00	\N
rate_limit.global.rpm	600	Global requests-per-minute ceiling applied to all plans regardless of per-plan limits.	RATE_LIMIT	2026-08-22 23:11:04.156177+00	\N
rate_limit.free.rpm	60	API requests per minute allowed for tenants on the FREE plan.	RATE_LIMIT	2026-08-22 23:11:04.156177+00	\N
rate_limit.basic.rpm	180	API requests per minute allowed for tenants on the BASIC plan.	RATE_LIMIT	2026-08-22 23:11:04.156177+00	\N
rate_limit.pro.rpm	600	API requests per minute allowed for tenants on the PRO plan.	RATE_LIMIT	2026-08-22 23:11:04.156177+00	\N
provider.email	RESEND	Active email delivery provider. Supported values: RESEND | SENDGRID | MAILGUN.	PROVIDER	2026-08-22 23:11:04.156177+00	\N
provider.whatsapp	NONE	Active WhatsApp delivery provider. Supported values: NONE | TWILIO | 360DIALOG.	PROVIDER	2026-08-22 23:11:04.156177+00	\N
retention.inactive_tenant_days	365	Days of inactivity before a tenant account is flagged for archival review.	RETENTION	2026-08-22 23:11:04.156177+00	\N
retention.audit_log_days	730	Number of days admin audit log entries are retained before being purged.	RETENTION	2026-08-22 23:11:04.156177+00	\N
retention.invoice_history_days	2555	Number of days subscription invoice records are retained (default: 7 years ≈ 2555 days).	RETENTION	2026-08-22 23:11:04.156177+00	\N
provider.sms	FROG	Active SMS delivery provider. Supported values: FROG.	PROVIDER	2026-08-22 23:11:04.156177+00	\N
provider.frog.api_key		FROG SMS API key (obtain from frogapi.wigal.com.gh dashboard).	PROVIDER	2026-08-22 23:11:04.187592+00	\N
provider.frog.username		FROG SMS account username.	PROVIDER	2026-08-22 23:11:04.187592+00	\N
provider.frog.sender_id		FROG SMS sender ID / from-name shown to recipients.	PROVIDER	2026-08-22 23:11:04.187592+00	\N
branding.platform_name	TenantX	Platform name shown in email headers and footers sent to tenants.	BRANDING	2026-08-22 23:11:04.224218+00	\N
branding.logo_url		Publicly accessible URL of the platform logo. Shown at the top of every tenant-facing email. Leave blank to show the platform name as text instead.	BRANDING	2026-08-22 23:11:04.224218+00	\N
branding.primary_colour	#7367F0	Hex colour code used as the accent colour in tenant-facing email templates (e.g. #7367F0). Include the leading #.	BRANDING	2026-08-22 23:11:04.224218+00	\N
manual_payment.enabled	false	Show the manual bank-transfer option at upgrade	MANUAL_PAYMENT	2026-08-22 23:11:04.382485+00	\N
manual_payment.bank_name		Bank name shown to landlords for manual transfer	MANUAL_PAYMENT	2026-08-22 23:11:04.382485+00	\N
manual_payment.account_name		Account holder name shown to landlords	MANUAL_PAYMENT	2026-08-22 23:11:04.382485+00	\N
manual_payment.account_number		Account number shown to landlords	MANUAL_PAYMENT	2026-08-22 23:11:04.382485+00	\N
manual_payment.branch		Bank branch (optional)	MANUAL_PAYMENT	2026-08-22 23:11:04.382485+00	\N
sms.cost_per_message	0.05	GHS cost debited per landlord-triggered SMS sent under a custom sender ID.	PROVIDER	2026-08-22 23:11:04.405236+00	\N
sms.fee.enabled	true	Charge a platform fee on SMS credit top-ups (see sms_fee_tiers for the schedule).	PROVIDER	2026-08-22 23:11:04.457072+00	\N
otp.device.trust_days	30	Number of days a device stays trusted after a successful OTP challenge before it must verify again. Must be a positive integer.	OTP	2026-08-22 23:11:04.937978+00	\N
otp.device.max_per_principal	10	Maximum number of trusted devices kept per principal (tenant user, occupant, or platform admin); the least-recently-seen device is evicted once this cap is reached. Must be a positive integer.	OTP	2026-08-22 23:11:04.937978+00	\N
otp.send.max_per_identifier	3	Maximum OTP codes that may be SENT to one email or phone number in a rolling 15-minute window. Bounds SMS spend on one victim and how often an attacker can reset the per-code attempt counter. Must be a positive integer.	OTP	2026-08-22 23:11:04.979575+00	\N
otp.send.max_per_ip	60	Maximum OTP codes that may be SENT from one caller IP in a rolling hour, across every identifier tried. A coarse spend backstop, not per-account protection: occupants share addresses behind compound routers and carrier-grade NAT.	OTP	2026-08-22 23:11:04.979575+00	\N
otp.verify.max_attempts	5	Failed verification attempts (wrong code, or right code from the wrong device) allowed against one live OTP before it is refused outright. Bounds brute force against a six-digit code within its lifetime. Must be a positive integer.	OTP	2026-08-22 23:11:04.979575+00	\N
otp.code.retention_days	30	How many days an OTP row is kept after it expires before UserOtpPurgeJob deletes it. Only already-expired rows are ever eligible, so this cannot shorten a live code's life. Must be a positive integer.	OTP	2026-08-22 23:11:04.979575+00	\N
otp.admin.login.enabled	false	Master switch for login OTP on the platform-admin login path only. Kept separate from otp.login.enabled so the small, directly-reachable admin population can be used to pilot the second factor before it is armed for every landlord and staff user.	OTP	2026-08-22 23:11:04.988216+00	\N
otp.login.enabled	false	Master switch for login OTP on the tenant-user login and select-tenant paths. When false, no second factor is challenged on an untrusted device for those paths. Platform-admin login has its own switch, otp.admin.login.enabled.	OTP	2026-08-22 23:11:04.937978+00	\N
otp.login.channel	EMAIL	How login OTPs are delivered. EMAIL always uses email. SMS prefers a verified phone, falling back to email. BOTH does the same but also lets the user switch channel on the code screen. Email is always the fallback; no value leaves a user undeliverable.	OTP	2026-08-22 23:11:04.998062+00	\N
\.


--
-- Data for Name: preventative_maintenance_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preventative_maintenance_schedules (id, tenant_id, title, description, category_id, property_id, unit_id, priority, frequency, next_due_date, last_generated_at, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, tenant_id, name, description, address_line_1, city, state, zip_code, country, region, district, gps_code, type, ownership, condition, status, purchase_price, current_value, currency, images, thumbnail_index, amenities, metadata, created_at, updated_at, total_units, occupied_units, bedrooms, bathrooms, rooms, documents, search_vector, image_file_ids, latitude, longitude, place_id, accuracy_metres) FROM stdin;
f8d08e57-e6d9-456b-b638-d69254bbb91c	oseimensah-properties	East Legon Self-Contained	\N	Nii Teiko Abbey Lane	East Legon Extension	greater-accra	00233	Ghana	greater-accra	ayawaso-west	\N	apartment	own	good	active	\N	\N	GHS	{}	\N	[]	\N	2026-08-23 00:55:13.251214+00	2026-08-25 19:56:33.184429+00	2	0	2	2	4	\N	'apart':6A 'ayawaso':11B 'ayawaso-west':10B 'contain':5A 'east':1A,7B 'extens':9B 'legon':2A,8B 'self':4A 'self-contain':3A 'west':12B	{}	5.6483193	-0.1507720	osm:N5047108310	\N
a83e1d2d-581f-4c02-b9a1-1af427c09657	oseimensah-properties	Madina Compound	\N	Ankpa Kooko Abbey Street	North Legon	greater-accra	00233	Ghana	greater-accra	la-nkwantanang-madina	\N	house	own	good	active	\N	\N	GHS	{}	\N	[]	\N	2026-08-25 20:03:42.4857+00	\N	\N	\N	5	2	5	\N	'compound':2A 'hous':3A 'la':7B 'la-nkwantanang-madina':6B 'legon':5B 'madina':1A,9B 'nkwantanang':8B 'north':4B	{}	5.6766804	-0.1716389	osm:N5005343801	\N
7aeade41-e994-414a-ae8f-de43fe4a91db	oseimensah-properties	Adenta Compound	\N	\N	Adenta	greater-accra	\N	Ghana	greater-accra	adenta	GD-183-5417	house	own	good	active	\N	\N	GHS	\N	\N	\N	\N	2026-08-23 00:04:14.309747+00	2026-08-25 22:32:17.999987+00	10	3	\N	\N	\N	\N	'-183':4A '-5417':5A 'adenta':1A,7B,8B 'compound':2A 'gd':3A 'hous':6A	\N	\N	\N	\N	\N
\.


--
-- Data for Name: property_inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_inspections (id, tenant_id, unit_id, property_id, unit_no, property_name, type, status, inspection_date, inspector_name, inspector_notes, tenant_acknowledgement, signed_off_date, pdf_url, created_at, updated_at, electricity_meter_id, electricity_reading, water_meter_id, water_reading) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token_hash, family_id, user_id, tenant_id, device_fingerprint, ip_address, user_agent, issued_at, expires_at, absolute_expires_at, revoked, revoked_at, revoked_reason, replaced_by_token_id, global_user_id) FROM stdin;
c7ebadd4-bdeb-42c3-abff-cad72760445e	6f10385339c330043ef041e1fe11ed14dcd143155b3c237d68611db3b9ada3e1	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 02:11:48.996303+00	2026-08-30 02:11:48.996295+00	2026-09-21 23:40:58.417904+00	t	2026-08-25 00:03:24.217217+00	session_limit	\N	\N
d126d723-c136-4b69-8914-20cc5007ddda	9c60b827184302dcc823f63cf1a7dd036653d33512d67cc6fb9d94a1c7c5c156	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-22 23:40:58.420916+00	2026-08-29 23:40:58.42079+00	2026-09-21 23:40:58.417904+00	t	2026-08-22 23:56:00.475551+00	rotation	4b754c48-0b20-408a-9713-10c58a62d1e7	\N
4b754c48-0b20-408a-9713-10c58a62d1e7	2688444f4fc9324e58c9462f2bba15f42c89799f2d1eef5a8850b145adfc58b5	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-22 23:56:00.474596+00	2026-08-29 23:56:00.474588+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 00:11:00.446723+00	rotation	2ae6282f-a566-48d9-866c-d7490e033ac3	\N
2ae6282f-a566-48d9-866c-d7490e033ac3	2eed21f5f85a530fa9c3cfaae2c131554d46abebcb59be7a2714a623120f3617	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 00:11:00.446099+00	2026-08-30 00:11:00.446087+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 00:26:15.483257+00	rotation	09495e61-528d-4185-8113-b1927d8a812c	\N
09495e61-528d-4185-8113-b1927d8a812c	213f5a9e7ad79f8e8f8462681fdb79b01dd841dffee1760f7090da2124e29b1e	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 00:26:15.482889+00	2026-08-30 00:26:15.482883+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 00:41:20.23133+00	rotation	7648149a-d959-4f05-903a-476b83439023	\N
7648149a-d959-4f05-903a-476b83439023	c5f501bcfcea20c80bf0b737c3a95c8473756799414973457c2e0dffc178d5fc	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 00:41:20.216023+00	2026-08-30 00:41:20.215997+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 00:56:33.552149+00	rotation	aadcf4ab-cb63-4dd3-ac60-61647cbd6ba8	\N
aadcf4ab-cb63-4dd3-ac60-61647cbd6ba8	e41b50e92f430bbf8a7e7ef34858d94a71c74273e0ab37ee8d7fa73c6368aa36	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 00:56:33.551738+00	2026-08-30 00:56:33.551733+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:11:38.745086+00	rotation	4a729d00-6898-46ae-8e96-6fa059e4c619	\N
4a729d00-6898-46ae-8e96-6fa059e4c619	1411c67d4a56d306f0691f0a4387635c7379fbab49ab5dc7cf6d3645392d2ae6	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:11:38.701505+00	2026-08-30 01:11:38.701489+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:11:39.791646+00	rotation	b28a172c-21b1-4e84-acf1-3d57a16f6535	\N
b28a172c-21b1-4e84-acf1-3d57a16f6535	00dea938821681d43141cf228149ee884fce916e0817941c14f558d6bd916f2a	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:11:39.790723+00	2026-08-30 01:11:39.790712+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:26:44.206856+00	rotation	fdb38b28-7cfb-4041-85c0-b00625d9f85c	\N
fdb38b28-7cfb-4041-85c0-b00625d9f85c	874ab94697f1c5574b35c98f683705e67a806c5371efbb28152fa1fb20cb5ce4	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:26:44.205656+00	2026-08-30 01:26:44.205642+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:26:44.477063+00	rotation	95d4ddd7-5955-4449-8958-fdab3cd002cb	\N
95d4ddd7-5955-4449-8958-fdab3cd002cb	1db96bf05cd50a27d51f6276ef467a170a292692eccbd13791c4221f87fc0373	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:26:44.476292+00	2026-08-30 01:26:44.47627+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:41:47.104777+00	rotation	2a7d0868-0b21-41de-b3bb-31909e20acb7	\N
2a7d0868-0b21-41de-b3bb-31909e20acb7	39802402c5c5bc08846a2853b2d9ac24678a049775b2823c8565e835b951027f	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:41:47.104472+00	2026-08-30 01:41:47.104466+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:41:47.179633+00	rotation	826d48b5-9b72-48fd-a069-f864c5131117	\N
826d48b5-9b72-48fd-a069-f864c5131117	60413a89dba730aa6a3519019a03ada942a5bb208cfec7979f23947a26633ded	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:41:47.179417+00	2026-08-30 01:41:47.179412+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:56:48.799925+00	rotation	095ba9bc-a83c-4601-8f21-4cca8f6d42eb	\N
095ba9bc-a83c-4601-8f21-4cca8f6d42eb	111363d9ee66341418b6b5e4447ab5633f21a3053770643e52c243241581aad3	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:56:48.797681+00	2026-08-30 01:56:48.797672+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 01:56:48.905304+00	rotation	743f55d8-3921-405a-bf9f-2f448e00e453	\N
743f55d8-3921-405a-bf9f-2f448e00e453	96b35c6c1360f8a60d189996dbea1a74f156254434c0a43b19db50f91c56a929	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 01:56:48.904838+00	2026-08-30 01:56:48.904828+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 02:11:48.903653+00	rotation	9b024141-4621-4111-9419-55f2cbf4c17a	\N
9b024141-4621-4111-9419-55f2cbf4c17a	e1e88a7907c3af44b56dbad57a892347294a3c64274dfaea704f1d5d015a85d0	6df4d6e5-bec2-4866-97f4-9c11b2aaafdf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 02:11:48.903112+00	2026-08-30 02:11:48.903102+00	2026-09-21 23:40:58.417904+00	t	2026-08-23 02:11:48.997222+00	rotation	c7ebadd4-bdeb-42c3-abff-cad72760445e	\N
fd254d8d-ed45-4923-b2a8-3efd0691393c	551b8c10ea3aedf24b0c79df8ba0fb58fe05eb78a909e6df9d93a745c3ce53ce	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 03:18:36.084536+00	2026-08-30 03:18:36.084531+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 03:34:35.98375+00	rotation	9b9873f8-8b61-445b-bc63-de79b6d87a3b	\N
d8ceaf96-1663-447a-9501-327809c743a6	569f2c351fa8de6894ce59894d9e98b9679c1849e072afea9f24f023c5347eec	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 03:02:42.790161+00	2026-08-30 03:02:42.790159+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 03:18:36.084768+00	rotation	fd254d8d-ed45-4923-b2a8-3efd0691393c	\N
d4dfcc02-5ebb-4309-bef7-acdb439d792b	7511d286fa322bab62a0b3cf17c13da6b92d2073ec64451493cafb6bdfa5c00a	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 04:50:45.53164+00	2026-08-30 04:50:45.531632+00	2026-09-22 03:02:42.790072+00	t	2026-08-25 02:39:35.857286+00	session_limit	\N	\N
9b9873f8-8b61-445b-bc63-de79b6d87a3b	23a7dc82589f3161e206e29b6be12d876f91619a1ec43b8771fdfbf6c1558e64	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 03:34:35.983455+00	2026-08-30 03:34:35.983449+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 03:49:35.897182+00	rotation	3ab6b026-aa48-4530-bd29-beb2667879b4	\N
3ab6b026-aa48-4530-bd29-beb2667879b4	f868303a4417aac2c334e2be92577993246ac5b0fc08213ae5820606e76716c0	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 03:49:35.896824+00	2026-08-30 03:49:35.896819+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 04:04:48.190391+00	rotation	675b44c5-6bf0-4e5c-b5dd-e87eaa8884ac	\N
675b44c5-6bf0-4e5c-b5dd-e87eaa8884ac	cc935c2ea40e630f3a00bbfd5716fe67f3e7f63f6f473126ae96f8fbde5c450f	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 04:04:48.190177+00	2026-08-30 04:04:48.190172+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 04:04:48.334095+00	rotation	bc9d1d5f-cfa1-40dc-aa27-206beb77cf8f	\N
bc9d1d5f-cfa1-40dc-aa27-206beb77cf8f	4d3a73dd2929d06d733479ffa3c988ced746f7a43bf6c0a701296d1e522058ab	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 04:04:48.333804+00	2026-08-30 04:04:48.333798+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 04:20:12.249949+00	rotation	159c041b-3928-4d62-874b-60f8284e0376	\N
159c041b-3928-4d62-874b-60f8284e0376	14b448229fa78933f834eae73ae0f78f1c92b721c2ed7537505dd82783e64efe	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 04:20:12.24953+00	2026-08-30 04:20:12.249524+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 04:35:45.409442+00	rotation	f6839729-7fa8-4b67-be47-56713e2ef0b3	\N
f6839729-7fa8-4b67-be47-56713e2ef0b3	5ef7159dfd23eef49979af0f4077af327122ce313d3a8cbfccc1e97a49974b81	3794f2e5-b439-4a3e-8b87-6ee9e600f232	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	7a9f3afbc85f3e8451408e05ab5a72d3	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-23 04:35:45.409129+00	2026-08-30 04:35:45.409123+00	2026-09-22 03:02:42.790072+00	t	2026-08-23 04:50:45.532084+00	rotation	d4dfcc02-5ebb-4309-bef7-acdb439d792b	\N
735a31f7-d438-4a5b-86bd-2885b8ac031c	2515e7b53083bbe6159eb02584ce66f1c7f9181008781618c9193cf3fac87fb9	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 01:36:31.682737+00	2026-08-31 01:36:31.682715+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 01:51:50.083263+00	rotation	ed061e21-90df-488b-9a88-c215d7a89390	\N
ed061e21-90df-488b-9a88-c215d7a89390	2126c970e42d0757624a18d3285803278287f0139d1268e8e5526e333877bdae	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 01:51:50.078783+00	2026-08-31 01:51:50.078769+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 02:07:01.511994+00	rotation	fcb31dd8-76a9-4174-9dfa-d5ba3095592b	\N
fcb31dd8-76a9-4174-9dfa-d5ba3095592b	eb2742d50c96dca7524f0b55ec5645b891f52909add1b2a35876734c2ab1c88f	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 02:07:01.511675+00	2026-08-31 02:07:01.511669+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 02:22:01.64941+00	rotation	cbee0b1e-ec4b-40e3-bfe9-77158d0e7980	\N
cbee0b1e-ec4b-40e3-bfe9-77158d0e7980	3ee04a985f67e3782f95850325ea7003130c7f567c34b99b97b8f8ccf58d2728	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 02:22:01.649121+00	2026-08-31 02:22:01.649115+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 02:37:01.785205+00	rotation	072984ce-465e-4815-b6e1-21a1124594bd	\N
072984ce-465e-4815-b6e1-21a1124594bd	94e22450a5f0fb577aff38cef64068f77057bad33e006ecc40612ab0d77fea0e	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 02:37:01.784822+00	2026-08-31 02:37:01.784816+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 02:52:01.754155+00	rotation	e530cd4a-473c-4085-8421-b8c249543dcf	\N
e530cd4a-473c-4085-8421-b8c249543dcf	d8ffaea38012017c1e087c72035bf11760d4df8037a026c4e58c13eb400d737d	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 02:52:01.753903+00	2026-08-31 02:52:01.753896+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 16:11:24.886876+00	rotation	46db43f3-a3e3-4dd5-a92f-2a443e151d6c	\N
46db43f3-a3e3-4dd5-a92f-2a443e151d6c	79d59176df59f0c6f25024d8c440e230c8a57f732710149943db46ad43cae1bf	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 16:11:24.868529+00	2026-08-31 16:11:24.868486+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 16:26:44.015887+00	rotation	1b66fc7f-4adc-49b9-84db-314dcb8e9847	\N
1b66fc7f-4adc-49b9-84db-314dcb8e9847	29b70f22e2e4ebc5bfb9471e2eb9164e49adb235674370322ee60cc6dabe773b	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 16:26:44.015499+00	2026-08-31 16:26:44.015494+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 16:41:55.411912+00	rotation	6667b6bc-ce7e-46e7-9268-d902d53018c8	\N
66687e0b-930b-48cb-95ee-f2403d6ebaa0	9feefe28c4bcaf43641a623ddfb190bca61ecafb78ff5b65e8bff08600e3befa	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 16:57:43.868159+00	2026-08-31 16:57:43.868153+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 17:12:55.343207+00	rotation	aa2bf0fd-be4c-4cd3-9889-c2805bc27cbd	\N
6667b6bc-ce7e-46e7-9268-d902d53018c8	61b43430defc045310e50e199c972a14ac592821ca17be2ed5272ddc30678e18	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 16:41:55.410725+00	2026-08-31 16:41:55.410719+00	2026-09-23 01:36:31.682042+00	t	2026-08-24 16:57:43.868518+00	rotation	66687e0b-930b-48cb-95ee-f2403d6ebaa0	\N
02a99d0c-ecf0-47e6-921d-702d9a59bf46	ee2c57cf4c2911c9086508e540867eed2c15ac362b5126a2e00e67d25c6fe42e	9e50404f-d1ee-4275-a901-098e998d66b6	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	284d26bb261b839175152baa65ed9420	0:0:0:0:0:0:0:1	curl/8.7.1	2026-08-25 00:03:24.31587+00	2026-09-01 00:03:24.315867+00	2026-09-24 00:03:24.315615+00	t	2026-08-25 21:49:21.853049+00	session_limit	\N	\N
259843c7-0f3e-4627-9185-f745c53f173f	a3c0c61ea743c636ee34bb71cc8b917ca5716fd5aaca5e9cf4876b390aa2746e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:48:52.968965+00	2026-08-31 23:48:52.968885+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:48:53.099147+00	rotation	be48a48c-fb04-48bc-ba8f-d11b4eb5cd95	\N
23df54b9-ece1-4e6a-bd90-2405cee53f33	69b9247f9701cce6b23297657214de5ea4ca3b3a15f3b1a5367735d2af998253	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 17:29:01.725501+00	2026-08-31 17:29:01.725488+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 17:44:01.515182+00	rotation	045d9940-be54-496a-b02c-fa157bad3acc	\N
045d9940-be54-496a-b02c-fa157bad3acc	7452e60952427a48676146a22d0f5ed31971d6dab569139929bbdb61e1fdf560	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 17:44:01.500517+00	2026-08-31 17:44:01.500493+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 17:44:01.7972+00	rotation	e21fc83f-6d38-4923-819c-caa8e44d83aa	\N
e21fc83f-6d38-4923-819c-caa8e44d83aa	afa1ed82b7cb06fb6861219ef6a7930f5dfbf757a11e76b9622c6b9cd8c94c0e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 17:44:01.7969+00	2026-08-31 17:44:01.796895+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 17:59:49.236512+00	rotation	b1d85fac-cff4-47b5-aaf9-e530cc0fc583	\N
b1d85fac-cff4-47b5-aaf9-e530cc0fc583	fa85750f8f267c9ac771174cd163231e03bb26510df0cb93b0563f36b28bd59e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 17:59:49.230118+00	2026-08-31 17:59:49.230063+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 18:15:20.672716+00	rotation	72baf009-e687-4c01-aad5-be7ef9511e83	\N
72baf009-e687-4c01-aad5-be7ef9511e83	8c7c498b0afd3c361ed179bf1d69af33378486953f119f3fcb0a17ffde0e37ee	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 18:15:20.660083+00	2026-08-31 18:15:20.660062+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 18:30:24.89825+00	rotation	2e7c0e2c-85b9-4595-833c-002c073bccab	\N
2e7c0e2c-85b9-4595-833c-002c073bccab	749531abbd68bc65f21c255b0de2cb7a1c709f67c112fb3a9de0d6526a07e816	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 18:30:24.897056+00	2026-08-31 18:30:24.897052+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 18:45:56.245255+00	rotation	e524d7cc-5678-43a9-bd33-28289eebad1b	\N
e524d7cc-5678-43a9-bd33-28289eebad1b	165b0a2c6a129005f52cbeadccc72a1f1d78affce3eb846e26c0fa25b4463d4e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 18:45:56.244961+00	2026-08-31 18:45:56.244957+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:01:19.991322+00	rotation	a0a3ef1c-b231-4e87-bbd5-72162b23f46b	\N
a0a3ef1c-b231-4e87-bbd5-72162b23f46b	e8bf2a0d06f9fd4d68cd1551712a0b2deebb2c558c76f0f716de16801c874170	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:01:19.974933+00	2026-08-31 19:01:19.974913+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:16:20.261791+00	rotation	bbad473b-d95b-415b-bda5-3f88c6fec923	\N
bbad473b-d95b-415b-bda5-3f88c6fec923	f4c71774de3291efa62c053840848ce1eee6826f2d5920ae7970b7f87260ac27	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:16:20.261102+00	2026-08-31 19:16:20.261084+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:16:20.317621+00	rotation	a7e38697-6da0-4026-b860-7ecd91e3992a	\N
a7e38697-6da0-4026-b860-7ecd91e3992a	35e9193348b7a86b03acc6201890c7cd5889fc3b6816a0425441efe16c75bc84	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:16:20.31726+00	2026-08-31 19:16:20.317255+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:31:20.254238+00	rotation	2aff1ab3-a8db-4b81-a705-374d5cb30dbd	\N
2aff1ab3-a8db-4b81-a705-374d5cb30dbd	947ec861f1b3035205f4f2e96533d7a35602d55ef99fb8a2759e51ffacde1d11	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:31:20.242518+00	2026-08-31 19:31:20.242498+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:31:20.38911+00	rotation	25d56eab-aaf5-4dfc-b571-1757dacc63d4	\N
25d56eab-aaf5-4dfc-b571-1757dacc63d4	17243e77d50c293ace218337b6a32186f724061080755ea909468db5072cdd49	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:31:20.388591+00	2026-08-31 19:31:20.388584+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:46:22.482318+00	rotation	0aec00d8-cae5-47f6-a73d-19e767ed73d1	\N
0aec00d8-cae5-47f6-a73d-19e767ed73d1	37cb323b117c4d999e617e7fb8a4b8b7a070f55dddcba1cbd76563636f71a281	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:46:22.480968+00	2026-08-31 19:46:22.480946+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 19:46:22.535727+00	rotation	f035958c-223a-4754-89a0-592f7d685532	\N
f035958c-223a-4754-89a0-592f7d685532	266a05263d3bfb9332dacc546ff77be059b024b7fe69648348176aa59fa77352	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 19:46:22.53544+00	2026-08-31 19:46:22.535435+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:01:22.516173+00	rotation	f43f4488-cd8f-4741-967c-ac30af7c4833	\N
787e8630-d108-4465-b70a-4d4e6327c1ec	02fb35cf16a7949d3f88a05bfe51046e0a125b7c698f7fffd922752bdbde44c7	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:01:22.564958+00	2026-08-31 20:01:22.564953+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:16:33.555358+00	rotation	aa424617-1acd-4dac-bb1e-b782aff44ae8	\N
f43f4488-cd8f-4741-967c-ac30af7c4833	d2c20b5ba3e184b5577b95fddc4b40f0b29320f41726f61816f49923b2c39822	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:01:22.515857+00	2026-08-31 20:01:22.515852+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:01:22.565195+00	rotation	787e8630-d108-4465-b70a-4d4e6327c1ec	\N
4af02719-be07-45b6-8f42-274314019bc5	a61d9072496edc2cfd2d9a6a208ff9b9e25abdc339cd0067a9abeb2a91ab2c83	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:33:52.496069+00	2026-08-31 23:33:52.496064+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:48:52.970658+00	rotation	259843c7-0f3e-4627-9185-f745c53f173f	\N
aa424617-1acd-4dac-bb1e-b782aff44ae8	e226e29e1c6ba9e422ac19a9587bbc9188e224321a028c403f9f177f304e54ae	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:16:33.55018+00	2026-08-31 20:16:33.550175+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:31:36.613954+00	rotation	25d5b7eb-a9e5-4e4b-8a2e-93d7bc495052	\N
be48a48c-fb04-48bc-ba8f-d11b4eb5cd95	532f4c46dd221671d0eaeff19ed3cd05d4d17a95490c8c88236ca7681bc32dbe	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:48:53.098877+00	2026-08-31 23:48:53.098872+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 00:03:56.119435+00	rotation	b9a16715-3ef3-442d-b025-68312d0624f0	\N
25d5b7eb-a9e5-4e4b-8a2e-93d7bc495052	85a6ac710691c7c2a56779d0a19088af96aaac7c9712a32b787860dee15b9809	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:31:36.613004+00	2026-08-31 20:31:36.612951+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:31:36.750816+00	rotation	790fda67-6020-41d6-85c9-67384b2c9700	\N
291fff42-f63f-4ef9-b550-95f16c6f1f93	a14e778454f98a59ed06165d7da1b6917530b9a5e31c4eaf3a4183056a772853	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:37:03.760749+00	2026-09-01 20:37:03.760598+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:37:03.851218+00	rotation	ee695b40-1c0e-4b0d-8306-b2733a74fccc	\N
790fda67-6020-41d6-85c9-67384b2c9700	5815cd3bd3949d339d8732fd76ceb726a7412a3b13b1d0b27c1f59c82a0b7594	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:31:36.750528+00	2026-08-31 20:31:36.750524+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:46:36.642292+00	rotation	138f67a8-b869-4f09-b9c9-bf17e51a4d70	\N
138f67a8-b869-4f09-b9c9-bf17e51a4d70	a1567e6a92ae51a34b8b124af448f43ee4a5408b498b85d61f7ee4cc253d5f2b	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:46:36.64194+00	2026-08-31 20:46:36.641936+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 20:46:36.705199+00	rotation	aeca4ad8-3467-4776-97cf-e1d0a33a79b2	\N
6d6fb188-6692-41e5-9909-c97d53a11b48	ee37444121feee4b10df1cadc026b2425e73905dba62daab295bb29554defcf2	34c6218a-ed61-4c6e-afaa-9fb851a646dd	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	284d26bb261b839175152baa65ed9420	0:0:0:0:0:0:0:1	curl/8.7.1	2026-08-25 02:39:35.910286+00	2026-09-01 02:39:35.910269+00	2026-09-24 02:39:35.909922+00	t	2026-08-26 15:12:53.084197+00	session_limit	\N	\N
aeca4ad8-3467-4776-97cf-e1d0a33a79b2	149123c6d5fa3342cb6436ff8fa0560a4c62232d4450f81b77476eb414e67969	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 20:46:36.70491+00	2026-08-31 20:46:36.704906+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 21:01:36.679552+00	rotation	338f1823-9801-47b6-b48b-f3c1b7d1c1e9	\N
ebbd173c-a176-446e-824c-31527a177416	43e3a386d713073f91957e3aafd80ce40154568f964e56713acb54cae437f28b	455f0483-a59d-4847-a5c9-4f4eb3222f5d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	284d26bb261b839175152baa65ed9420	0:0:0:0:0:0:0:1	curl/8.7.1	2026-08-24 22:49:15.560041+00	2026-08-31 22:49:15.560022+00	2026-09-23 22:49:15.461543+00	t	2026-08-25 19:51:49.366957+00	session_limit	\N	\N
338f1823-9801-47b6-b48b-f3c1b7d1c1e9	5ab22acd8e71de0cdefeec38dd2214e440693f593fa3f13d9e69fdbe28a85a9e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 21:01:36.675395+00	2026-08-31 21:01:36.675368+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 21:01:36.773113+00	rotation	179a08ac-ea4a-4e8a-8165-2682f68b5795	\N
179a08ac-ea4a-4e8a-8165-2682f68b5795	03c162cff980c052fd332395d1284b47349db5486507685d4c27586b18fe1dfe	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 21:01:36.772801+00	2026-08-31 21:01:36.772796+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 22:47:26.214307+00	rotation	2208595c-53bf-4f51-83cb-ae9c8ed721a6	\N
2208595c-53bf-4f51-83cb-ae9c8ed721a6	ed61351fcd709c63c2667abaca8791132b6cc01e2abb1d744a088e5619047a00	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 22:47:25.661197+00	2026-08-31 22:47:25.660881+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:03:11.951203+00	rotation	43a61876-4d06-4b9f-a29d-e3ff6e6f62d3	\N
43a61876-4d06-4b9f-a29d-e3ff6e6f62d3	b15319679e23dc5d0d67c87d5536f6f6d333b2708c540a4a5921b76eb593afac	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:03:11.950747+00	2026-08-31 23:03:11.950743+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:03:12.025288+00	rotation	1768e3c6-f6ff-49c6-b204-b73b78743330	\N
1768e3c6-f6ff-49c6-b204-b73b78743330	6d5592969082a673709ac157599040ec4c7c8b1885ddfbc52c6623dea825784b	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:03:12.02498+00	2026-08-31 23:03:12.024976+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:18:18.776612+00	rotation	e7390d31-7dca-47ef-9e41-7cd95b738bb5	\N
e7390d31-7dca-47ef-9e41-7cd95b738bb5	df290367aa21de1479733a282d1c114f6ee6fcdb0c49554e2a73d623079a6ae1	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:18:18.7666+00	2026-08-31 23:18:18.766595+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:33:52.389862+00	rotation	c43f4fe5-eb7f-4fad-80dc-789cbfea3c2a	\N
c43f4fe5-eb7f-4fad-80dc-789cbfea3c2a	02cf36de1e94b7127e6fa59462b2eeed6a207015000808e2f48f89ecc6b4c5d2	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 23:33:52.389358+00	2026-08-31 23:33:52.389353+00	2026-09-23 17:29:01.725274+00	t	2026-08-24 23:33:52.496365+00	rotation	4af02719-be07-45b6-8f42-274314019bc5	\N
b9a16715-3ef3-442d-b025-68312d0624f0	57d8eadee21ae367ef6eff4675a89f5d8831c4ef4976902efd3d814f89c4aa4c	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 00:03:56.119123+00	2026-09-01 00:03:56.119119+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 00:03:56.204702+00	rotation	8cb98359-db97-4fa6-b3cc-716e932f39a4	\N
8cb98359-db97-4fa6-b3cc-716e932f39a4	2e32406f8a19debdd5e7865c3b9a8625ad2a223897835e3bcb17c5e8d32c6424	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 00:03:56.20414+00	2026-09-01 00:03:56.204131+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 00:19:34.841538+00	rotation	b66e0e21-e320-466e-bdbb-c0ac5495877d	\N
b66e0e21-e320-466e-bdbb-c0ac5495877d	a414fc5cf3e4bd5e2d7439ebde31f22f0a9dc4e1046d8d491e8832187a96b750	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 00:19:34.829614+00	2026-09-01 00:19:34.829574+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 00:34:34.698594+00	rotation	e1347bc9-7daf-4394-8a6d-c9d275fc7c73	\N
e1347bc9-7daf-4394-8a6d-c9d275fc7c73	7a0bc2ba52beedb8c143899af678041f7f5d36233f642bcdb48fae3579834ac1	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 00:34:34.695753+00	2026-09-01 00:34:34.695735+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 00:49:34.359451+00	rotation	6de0e709-8bbe-423e-89f9-ee31ec44af7b	\N
6de0e709-8bbe-423e-89f9-ee31ec44af7b	e8771203ae0f69aec0b2ca62d9ecfe0a9f7f00f9f9649c7ae29b4abd31c0813c	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 00:49:34.351152+00	2026-09-01 00:49:34.351142+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 01:04:34.265156+00	rotation	9415b650-e826-4899-a000-bb4c73b0d32f	\N
9415b650-e826-4899-a000-bb4c73b0d32f	059a84ad4175f9d6d755537bd02fa42176b3fcb823f7412c934402198b520d6f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 01:04:34.264888+00	2026-09-01 01:04:34.264883+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 01:19:34.350214+00	rotation	b889e0ce-151a-414c-9ecf-5ac9c3fb4adf	\N
b889e0ce-151a-414c-9ecf-5ac9c3fb4adf	3192399248d04ca8c5708ef4233da1a579d1fab256e78414ee961771f075bc25	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 01:19:34.348714+00	2026-09-01 01:19:34.348704+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 01:34:34.18994+00	rotation	17d53967-447a-49b6-8a7b-cba96fd423d3	\N
17d53967-447a-49b6-8a7b-cba96fd423d3	85c21033a276f4f019ece4850c90d604f0549653fc07066b28af4e019ecb91f9	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 01:34:34.189624+00	2026-09-01 01:34:34.189618+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 01:49:34.291205+00	rotation	eeb62e51-4347-4feb-a720-44dc00baae6e	\N
eeb62e51-4347-4feb-a720-44dc00baae6e	4aaafd80aae7467ef77a938904479bb9809e86b99d36c28873c71cd6439a73bd	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 01:49:34.290826+00	2026-09-01 01:49:34.29082+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 02:04:34.368417+00	rotation	b7f22935-df32-48cc-ab08-d63d11125db7	\N
b7f22935-df32-48cc-ab08-d63d11125db7	b7a619276d2544023a9a88d68b24fc35d27f206cfc373af68309352f8eea24b3	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 02:04:34.368067+00	2026-09-01 02:04:34.368062+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 02:19:34.750796+00	rotation	04ad8c34-def4-458d-b950-3e6c3d15cc69	\N
04ad8c34-def4-458d-b950-3e6c3d15cc69	d6c339766030529bcb8d1c1e300995930deeb368137b5bd2a578f514581f0d61	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 02:19:34.723707+00	2026-09-01 02:19:34.723668+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 02:34:34.421588+00	rotation	cc3acd30-739c-48d3-aa2c-bf13b07b612c	\N
cc3acd30-739c-48d3-aa2c-bf13b07b612c	a7e9c5799f106315ce0bfa1d9f0615c5de5d271197d6e77e76d6a456255ba5b2	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 02:34:34.421206+00	2026-09-01 02:34:34.421202+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 02:49:34.563836+00	rotation	17ec85d8-8e5c-480b-9d58-5c72e33d3533	\N
17ec85d8-8e5c-480b-9d58-5c72e33d3533	99b4e8ba6950d731c118b0a5457f2ca042f9cb733aaa2ed5f80848d5e6256c26	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 02:49:34.563382+00	2026-09-01 02:49:34.563376+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 03:04:34.540215+00	rotation	41ad1f60-5099-490e-9a1f-7a5df8a6489a	\N
41ad1f60-5099-490e-9a1f-7a5df8a6489a	5cd28aa07df7179805e15628009b233b9f95a35de9ab2754361f6e8a758095c3	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 03:04:34.539847+00	2026-09-01 03:04:34.539831+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 03:19:34.565892+00	rotation	afabd80b-55c6-4ebc-a43c-64af4247da44	\N
afabd80b-55c6-4ebc-a43c-64af4247da44	31748d4138ae8b6e81ea57b745a8fc7b1c9a7f027fde9f33e9fa8e3839e14b9e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 03:19:34.565562+00	2026-09-01 03:19:34.565556+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 03:34:34.488379+00	rotation	c5f255f0-e8fe-4182-915c-d12cfaf8a167	\N
c5f255f0-e8fe-4182-915c-d12cfaf8a167	12c0fb39bd5b977614981e69a102b0c6cfec64b090389862f3fac2c186654c64	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 03:34:34.486417+00	2026-09-01 03:34:34.486391+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 03:49:34.512905+00	rotation	d2c1eac8-c3f2-4d56-8d8e-66ce2b774188	\N
b993a454-5640-490d-b373-650e0f8425c2	7d849627d12f66bf8370e4ef6cb6c3241859183f6feab0afa84bec524adb4ad9	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 04:04:34.555179+00	2026-09-01 04:04:34.555175+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 04:19:34.627922+00	rotation	f6e0fe03-7991-49ad-8b7f-430aa6392fd5	\N
d2c1eac8-c3f2-4d56-8d8e-66ce2b774188	9ec68f21e42b42baff6508095b736f0dead1300b14557e956ed692568dae2d0f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 03:49:34.512637+00	2026-09-01 03:49:34.512631+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 04:04:34.555422+00	rotation	b993a454-5640-490d-b373-650e0f8425c2	\N
f6e0fe03-7991-49ad-8b7f-430aa6392fd5	a0dcbf331fa443a4101d48780b9e645a5681f576c2c09b6431314ee25618c66b	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 04:19:34.627654+00	2026-09-01 04:19:34.62765+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 04:34:34.65208+00	rotation	cdbd8468-3287-4576-bb4c-53abf2e6d9a8	\N
cdbd8468-3287-4576-bb4c-53abf2e6d9a8	cdc4770459d5746713214e30973991d1722fcefc460d88f3d2e170387faf62f4	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 04:34:34.651819+00	2026-09-01 04:34:34.651815+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 04:49:34.671694+00	rotation	30a8e651-6f6e-4d88-9ca5-b6a1d4d93b39	\N
30a8e651-6f6e-4d88-9ca5-b6a1d4d93b39	4724ef724a0d2ae17edfb8f75ab77fe1db263e7a5c372f87823f614c1db738ca	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 04:49:34.671401+00	2026-09-01 04:49:34.671396+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 05:04:34.708998+00	rotation	88531ac6-d308-4042-adae-17781ba864ae	\N
88531ac6-d308-4042-adae-17781ba864ae	b0ce626b279d2092b18b32d37a7a6108a574fb116d6cb4b7c9f2c399ccc4407f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 05:04:34.706428+00	2026-09-01 05:04:34.706423+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 05:19:34.717482+00	rotation	7010dc02-1553-4d40-9ae0-e872bf272a5c	\N
7010dc02-1553-4d40-9ae0-e872bf272a5c	ebede6c0584408a30e903e80d6afe614cad063734bd46260e47fe834653271e9	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 05:19:34.717155+00	2026-09-01 05:19:34.71715+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 05:34:34.739089+00	rotation	90fc6203-560c-4e35-8748-a073e8d187f3	\N
90fc6203-560c-4e35-8748-a073e8d187f3	229aad9036c1f50cc8b42e3c3cb0b06d4e9177a63ef8d6a5fb95f4cc834636ea	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 05:34:34.738721+00	2026-09-01 05:34:34.738714+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 05:49:34.767361+00	rotation	6c25944a-99ff-41c8-8e35-e9cb673b7f12	\N
6c25944a-99ff-41c8-8e35-e9cb673b7f12	84b0af32d072c2df1c50343211b92389b6f6bd388ee9c8e8d3b90aea33077254	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 05:49:34.767082+00	2026-09-01 05:49:34.767077+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 06:04:34.784568+00	rotation	98e6f5a9-b32a-46c5-9fd1-c206bae39c7b	\N
98e6f5a9-b32a-46c5-9fd1-c206bae39c7b	b9c7922ae996aedee69969f47de3de372f7ffdc710ce3b601810aa815633097c	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 06:04:34.784298+00	2026-09-01 06:04:34.784294+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 06:19:34.815161+00	rotation	aef03fa1-b1c4-408e-a62e-c377f0015ca0	\N
aef03fa1-b1c4-408e-a62e-c377f0015ca0	fdc5d187d569794c6dfcd72c23b56f7f84d1eb8287b04e7a2ac3c86648d14ceb	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 06:19:34.814898+00	2026-09-01 06:19:34.814893+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 06:34:34.839718+00	rotation	be2b7ce3-5db6-4c18-ae49-01d61e214ccc	\N
be2b7ce3-5db6-4c18-ae49-01d61e214ccc	86bf7f6d3ff028596e66279bcd77d11aeb68692f09562214a476c42a81577826	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 06:34:34.839277+00	2026-09-01 06:34:34.83927+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 06:49:34.85247+00	rotation	a5f46a5d-be83-42df-95e3-9a20d1b2b4b6	\N
a5f46a5d-be83-42df-95e3-9a20d1b2b4b6	2e9088d18860217582cf000eb8fee10b44f95cedb318180dffd8f68a369430a0	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 06:49:34.852218+00	2026-09-01 06:49:34.852213+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 07:04:34.877216+00	rotation	190b0a37-fe32-48d9-8703-083b8557aa92	\N
190b0a37-fe32-48d9-8703-083b8557aa92	a167d74896d5c2b40df7e2dee1538091834b2c8f169f70cf45577884b6019a61	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 07:04:34.876943+00	2026-09-01 07:04:34.876937+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 07:19:34.901953+00	rotation	6b82648c-c7dd-47e6-9cee-37295031b627	\N
6b82648c-c7dd-47e6-9cee-37295031b627	cd4f73b4f69af19d561298202a13992806cf255127f22fcf6346f3196bb30c07	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 07:19:34.901603+00	2026-09-01 07:19:34.901596+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 07:34:34.927716+00	rotation	37c1953a-d34c-4e59-9b93-4fe732426b18	\N
37c1953a-d34c-4e59-9b93-4fe732426b18	088c7a8ee0a59fd07a1b2da51fedd50c8a6ca5cf9a0a4f12d34b0b6b5b8307de	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 07:34:34.927429+00	2026-09-01 07:34:34.927424+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 07:49:34.945753+00	rotation	b62029bb-0ce9-48df-9de5-919d9495f923	\N
b62029bb-0ce9-48df-9de5-919d9495f923	5ce280176b76b7f5de60df9202027ffae59e413c5cf756212aaeb0ae89359e57	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 07:49:34.945535+00	2026-09-01 07:49:34.94553+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 08:04:34.977611+00	rotation	55e906b3-0752-4367-92ee-ab95c309845f	\N
1a171267-31de-4abf-84b2-041ebd411a53	b65775d0d41d49d7cd843e6383c142126e10f7a6334353d28d6a243136950dca	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 08:19:34.990329+00	2026-09-01 08:19:34.990324+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:01:18.381827+00	rotation	4c1d3e7e-6da1-4e19-98d0-272e88687e14	\N
55e906b3-0752-4367-92ee-ab95c309845f	3bc5a28976c385d7aae966285afe5806d30af0f261a8e672d1c45d92fbdc0705	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 08:04:34.977347+00	2026-09-01 08:04:34.977342+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 08:19:34.990571+00	rotation	1a171267-31de-4abf-84b2-041ebd411a53	\N
ee695b40-1c0e-4b0d-8306-b2733a74fccc	242d7d90893c9e16a23b6b6fd414760b48166ae4ec175a4f3d1ace156a549492	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:37:03.850977+00	2026-09-01 20:37:03.850973+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:52:04.906783+00	rotation	94d1bbb5-72c0-4584-a019-a69983b21b33	\N
4c1d3e7e-6da1-4e19-98d0-272e88687e14	f310fc1a674b53b0806844e69c83e8d21ae89210f2f49cbb580bcc9e763f5264	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:01:18.371603+00	2026-09-01 09:01:18.371402+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:01:18.774248+00	rotation	a341b2e0-e30b-4b23-b9cc-b8e9354ee60e	\N
a341b2e0-e30b-4b23-b9cc-b8e9354ee60e	914fd9174370de48beee0b02486bad0718ddac890fcc50b4516a00df00b18f9b	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:01:18.773892+00	2026-09-01 09:01:18.773885+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:16:27.878657+00	rotation	05c9e8cc-6b9b-426b-85bc-65c8a25067ca	\N
05c9e8cc-6b9b-426b-85bc-65c8a25067ca	2c58a3bd701dfbc013435766cc291e69171be7daad8cec97d3c430940a6d06d5	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:16:27.864443+00	2026-09-01 09:16:27.864301+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:32:27.625633+00	rotation	3bc80769-de25-4a69-b2bf-8ca896467c97	\N
3bc80769-de25-4a69-b2bf-8ca896467c97	f50f4bccf718a60a1550c111d7f9d553363be96d884ee661813c47c2dd50c25e	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:32:27.618392+00	2026-09-01 09:32:27.618385+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:47:27.387044+00	rotation	e8fcdb14-76c2-4123-84ba-c5b6b54f4c36	\N
e8fcdb14-76c2-4123-84ba-c5b6b54f4c36	ccf88bc9cccd357e5ea93f7ae83e7c1f19ab20feb1a0ab3b266dc42ba6f057d8	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:47:27.381331+00	2026-09-01 09:47:27.380611+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 09:47:27.761895+00	rotation	136de19a-2a2e-40ea-95fc-f0a80c393b64	\N
136de19a-2a2e-40ea-95fc-f0a80c393b64	52574c6cc20d5ef72c74b39cafe7e2ba64d9448c540b9e93bb72b4e4c25e74f6	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 09:47:27.761277+00	2026-09-01 09:47:27.761268+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 10:02:57.724702+00	rotation	a020523a-e868-4033-9a52-d2778ea17bd7	\N
a020523a-e868-4033-9a52-d2778ea17bd7	70db9b81e452a62155e7f39d67bd4a562ad25abb7241620d51ad9ed20d27faf9	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 10:02:57.691124+00	2026-09-01 10:02:57.691092+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 10:02:59.588474+00	rotation	2c872f0f-3bf5-40eb-ac20-1963eb194ff0	\N
2c872f0f-3bf5-40eb-ac20-1963eb194ff0	d31851a7b02adcc24e98c9ef66124c487992bdd8bd02fef111d2c1365734bfae	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 10:02:59.587266+00	2026-09-01 10:02:59.587255+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 10:19:03.546788+00	rotation	bd6a54b7-90f2-4a88-b22a-8fe2d1b7bb6e	\N
bd6a54b7-90f2-4a88-b22a-8fe2d1b7bb6e	b1ca6db78887a7be2f4119ec73b4eacf2772a75bf99946364ef6f22c39da08eb	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 10:19:03.527785+00	2026-09-01 10:19:03.527681+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 10:34:13.472402+00	rotation	94dcb05c-b9a6-4b46-a567-30659ac0985e	\N
94dcb05c-b9a6-4b46-a567-30659ac0985e	28df8e4bdf29a8271d54d91651519e77245ef6ed2d51158ebe26db092b487d2f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 10:34:13.469446+00	2026-09-01 10:34:13.469441+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 10:49:27.714559+00	rotation	be502b54-09a1-4478-a697-954960f31c6b	\N
6a066e58-64ea-4809-907f-91a333c339b5	addd855ddb0146a747ca1de3b40e619234d9f0f757ed4f2176fb9f53b3eff350	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 11:04:27.672682+00	2026-09-01 11:04:27.672674+00	2026-09-23 17:29:01.725274+00	f	\N	\N	\N	\N
be502b54-09a1-4478-a697-954960f31c6b	5fbaf04cc3dadcd6c6643c1b9bbbddb94c5b40a5bb39ee42665fdfc0913515d4	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 10:49:27.71411+00	2026-09-01 10:49:27.714102+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 11:04:27.673036+00	rotation	6a066e58-64ea-4809-907f-91a333c339b5	\N
b12a546b-f9b1-4105-879e-c89641c119b9	8bc15eef0260b6210caf20b6ddcf704b37a70db3e74ba4cc4bcaad4c7ba825a0	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 11:19:27.666245+00	2026-09-01 11:19:27.666238+00	2026-09-23 17:29:01.725274+00	f	\N	\N	\N	\N
6b6ac63e-0707-4a24-9e72-da6f4a1ba8a3	59e80a3cffc999e81589ba73d9499566237529b020a28fd5678cec17f857e38f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 11:04:27.642987+00	2026-09-01 11:04:27.642982+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 11:19:27.681903+00	rotation	115e0d25-30e3-44c0-b5f8-9a81ab44cae7	\N
115e0d25-30e3-44c0-b5f8-9a81ab44cae7	3376022a3f8f96f4ecb803121e0012ea39c0508bf5744219cc9d647a5699c17f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 11:19:27.681648+00	2026-09-01 11:19:27.681643+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:23:46.971092+00	rotation	e599db17-57d9-404c-9410-a2f07e9ae919	\N
5b8e65fc-82cb-484a-bfc0-fd394d9a97ec	f71f9417625cd9989fb76313d48b170d58ffde3e34ba1b3aa42c86a0b675f95f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:39:31.205153+00	2026-09-01 16:39:31.205073+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:39:31.363073+00	rotation	bd0fd386-ffa2-468e-a728-fd960cb0df3b	\N
e599db17-57d9-404c-9410-a2f07e9ae919	c24220e88adf084a081dd42c335aac44b50fecebc349258631aadf66344092df	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:23:46.953698+00	2026-09-01 16:23:46.953692+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:39:31.209043+00	rotation	5b8e65fc-82cb-484a-bfc0-fd394d9a97ec	\N
bd0fd386-ffa2-468e-a728-fd960cb0df3b	6a17bb6acafaf867b5f94a7e76e0a9711b224036327e91cba653da274e9c5f21	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:39:31.362802+00	2026-09-01 16:39:31.362796+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:39:31.500337+00	rotation	273f73ad-ff13-480d-9c7d-699ad5913480	\N
273f73ad-ff13-480d-9c7d-699ad5913480	31656974672f5140464f1bf46db180a590f32630778ffdc74a9f08eab5b4e1df	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:39:31.500064+00	2026-09-01 16:39:31.500058+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:39:31.636789+00	rotation	7dc7b3cd-176f-4a29-a121-dc841955d7bc	\N
7dc7b3cd-176f-4a29-a121-dc841955d7bc	3ee9738b9489e1a12b0e9cdbf4080fa28bd53996e724e00b3454f4b5f7e85018	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:39:31.636406+00	2026-09-01 16:39:31.636398+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 16:55:28.371485+00	rotation	08726f6c-f381-4aff-a1fb-9719e0c813bb	\N
08726f6c-f381-4aff-a1fb-9719e0c813bb	f08a17dfddba5beb6a820dbe1a5e74578644c4d8901061385b5e69ed27584c51	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 16:55:28.355573+00	2026-09-01 16:55:28.355495+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 17:10:58.279819+00	rotation	d22c2606-7bfd-4647-83a3-82614fa2b964	\N
d22c2606-7bfd-4647-83a3-82614fa2b964	4642ae3fec392d31f871d6bca646746b2e016ea708d0156a240100e5ab1ea059	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 17:10:58.269428+00	2026-09-01 17:10:58.269371+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 17:26:32.974119+00	rotation	1f68792c-e39f-4c00-9864-f46c970c7735	\N
1f68792c-e39f-4c00-9864-f46c970c7735	d71ef3096916ebc4f49a6205d62474bb420cd8f94e26b8061f5fb519a265b8b9	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 17:26:32.944628+00	2026-09-01 17:26:32.942847+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 17:47:32.598076+00	rotation	ea80e45b-8d73-4bd3-8a25-dd6d6c6e0539	\N
ea80e45b-8d73-4bd3-8a25-dd6d6c6e0539	36aa76d8b8810faf6f0a591987017681cbefda7b7199498625c7c5c42802f1af	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 17:47:32.577136+00	2026-09-01 17:47:32.576431+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 18:08:05.525119+00	rotation	d73c8519-967a-40d2-86f9-51e20cf6f8e3	\N
d73c8519-967a-40d2-86f9-51e20cf6f8e3	ce486b1402b4143545106bdcc7c18df9a4581721920d849d60e5b518f48834e3	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 18:08:05.524782+00	2026-09-01 18:08:05.524777+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 18:24:03.341318+00	rotation	22c37072-688a-46a2-8a4b-d3072f9e654c	\N
22c37072-688a-46a2-8a4b-d3072f9e654c	2260671798a77bb9a87a57c770c1dd7fb44e0b826132c3168f499e67e0b9f2e4	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 18:24:03.335653+00	2026-09-01 18:24:03.335613+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 18:39:03.552298+00	rotation	8e3720b7-c24d-4668-b4dd-42a9ac95d18d	\N
8e3720b7-c24d-4668-b4dd-42a9ac95d18d	0cfbe2af78dcb86ecd3ddb13e709c6a560edeb41f4fa60c586e60df455509b29	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 18:39:03.551376+00	2026-09-01 18:39:03.551371+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 18:54:03.466278+00	rotation	ebc55478-ce80-4925-9d05-5a727fdcadb6	\N
77a2d4b7-3daa-4c1e-9d90-39fe885b2d82	6c4f103550d368985ab232c3da656db88741b3a99f5d313c8c2dc119b5dc4c1f	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 19:09:20.494379+00	2026-09-01 19:09:20.494356+00	2026-09-23 17:29:01.725274+00	f	\N	\N	\N	\N
ebc55478-ce80-4925-9d05-5a727fdcadb6	4d9704b1b9b79d3fcb838053726b518422f99794a62a1bbb78bf4e5d86a87553	53ba7d8b-bfa5-4067-8514-0426d0961049	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 18:54:03.465836+00	2026-09-01 18:54:03.46583+00	2026-09-23 17:29:01.725274+00	t	2026-08-25 19:09:20.494913+00	rotation	77a2d4b7-3daa-4c1e-9d90-39fe885b2d82	\N
aa2bf0fd-be4c-4cd3-9889-c2805bc27cbd	1ccbb5f3dea658e7159121277a29008881c7602d6a754e5c8c8c39819228bae2	9321a641-18a0-4567-8ef5-fde4858106cf	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	e0a5e8639e7dad626325db2ae94fedbc	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-24 17:12:55.337395+00	2026-08-31 17:12:55.337388+00	2026-09-23 01:36:31.682042+00	t	2026-08-25 19:11:55.245977+00	session_limit	\N	\N
e783c3ec-7758-411e-997f-5a72b116d82e	349d0a660c9d56d8f094725f10c6688e0c91fe9557b647afc35162bc1342f6df	0b3a3801-c28a-4abd-b0ff-d3c1a068711a	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 19:27:16.579776+00	2026-09-01 19:27:16.579694+00	2026-09-24 19:11:55.269405+00	f	\N	\N	\N	\N
1f445f58-c58f-42d6-9b90-f1a07fbdba66	5fa58820fdc5a13848af5e99481ae7effe9c3fdefb2d1d850223a7a9ad162df7	0b3a3801-c28a-4abd-b0ff-d3c1a068711a	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 19:11:55.269491+00	2026-09-01 19:11:55.269489+00	2026-09-24 19:11:55.269405+00	t	2026-08-25 19:27:16.586343+00	rotation	e783c3ec-7758-411e-997f-5a72b116d82e	\N
66ffd9ee-7e7c-4521-9e6b-6cc560e92f49	b7934648bc2913d036c318d01da3e0befd2e03a05c61ac78d1e82f88a0536e63	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:06:54.638761+00	2026-09-01 20:06:54.638748+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:06:55.122263+00	rotation	73fbb237-7780-401b-ab7e-9d200b93bc46	\N
2c5cc11e-8441-4435-8b0f-067c1403b1be	4e66b4291e0b3934bf90d63256fb749927f4e143fc571bc058a7c7b188928fcc	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 19:51:49.42092+00	2026-09-01 19:51:49.420918+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:06:54.65142+00	rotation	66ffd9ee-7e7c-4521-9e6b-6cc560e92f49	\N
e28adbbc-27e3-482d-8947-66fb4e6e7d79	2e72c1a55794076e49e1fb116dd802c1f10bb12312874fdd2b420adb0fbf4d2f	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:22:03.358973+00	2026-09-01 20:22:03.358962+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:37:03.771526+00	rotation	291fff42-f63f-4ef9-b550-95f16c6f1f93	\N
94d1bbb5-72c0-4584-a019-a69983b21b33	babdc4f29101709a7f6148df73096021fa70bab4655968cc338b8b4c7fc39284	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:52:04.90541+00	2026-09-01 20:52:04.905402+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:52:04.986209+00	rotation	b20b4dc5-026d-4579-8d12-671c3311fb66	\N
73fbb237-7780-401b-ab7e-9d200b93bc46	56562901cbed9a7fa502268d758aa56e559dafa1d7b0700529c7b02ba23f1d43	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:06:55.121526+00	2026-09-01 20:06:55.121519+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:22:02.005608+00	rotation	bc41c9b7-e5fc-4cdf-90ab-f534509431b9	\N
bc41c9b7-e5fc-4cdf-90ab-f534509431b9	3f2d4899907062a314f16daf280f3f26f1c1cdd6ceb6dc4b5a906302e6e05f9d	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:22:01.990645+00	2026-09-01 20:22:01.990539+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 20:22:03.359681+00	rotation	e28adbbc-27e3-482d-8947-66fb4e6e7d79	\N
b20b4dc5-026d-4579-8d12-671c3311fb66	255fde62021e33c13a78529e00239d8bb3929b92daeca00516e4181598e11b58	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 20:52:04.985977+00	2026-09-01 20:52:04.985973+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 21:07:43.989757+00	rotation	9ff3ffba-9ae3-43ba-a3ae-28e7136a6484	\N
942e0562-e7b5-48ac-baf1-cfeb912e2c27	ea973faf9a6d794fd26d72a60699a4531caa96f12b4501065ea8faedc5db8f65	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 21:22:44.687368+00	2026-09-01 21:22:44.687275+00	2026-09-24 19:51:49.42066+00	f	\N	\N	\N	\N
9ff3ffba-9ae3-43ba-a3ae-28e7136a6484	cd2b9a0c278c037cb3958b85408d58a74ebb2912ed847a96a3f340cf592439f1	018167fe-647b-4bfe-96b5-575621d8593d	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 21:07:43.985058+00	2026-09-01 21:07:43.985021+00	2026-09-24 19:51:49.42066+00	t	2026-08-25 21:22:44.690401+00	rotation	942e0562-e7b5-48ac-baf1-cfeb912e2c27	\N
3e244096-55a8-4ed2-89c1-345e9f8bd620	40bf2914cfd72700eec950c525608fdb079e0ff2c5863acead1752204c552b1a	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 21:49:21.924652+00	2026-09-01 21:49:21.924637+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:05:20.827918+00	rotation	2931ae27-3215-479c-bd6b-5e2dcf5039fe	\N
2931ae27-3215-479c-bd6b-5e2dcf5039fe	bb5922e7b75c6067e3fc55c57589230ccdd7b78926c033a7a333f801bda56b6d	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:05:20.827587+00	2026-09-01 22:05:20.827582+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:20:20.913365+00	rotation	afdd7ef2-0847-4a56-b50f-e280a70fb5b2	\N
afdd7ef2-0847-4a56-b50f-e280a70fb5b2	bb38c71ad28fe3e61f7266ed36988a1dcb45f66fb0ccb71ae595c65e9f0551b0	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:20:20.90665+00	2026-09-01 22:20:20.906622+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:35:22.872175+00	rotation	704d8658-1f94-4b07-86b2-ff44270454eb	\N
704d8658-1f94-4b07-86b2-ff44270454eb	c8cb7cf245c8aec5ffcec3ab2aaf45c94d4d5f16a97941b276d2eab137624fb7	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:35:22.871576+00	2026-09-01 22:35:22.871569+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:35:23.044994+00	rotation	cb9d6780-8435-431f-9812-a884a48fffe4	\N
cb9d6780-8435-431f-9812-a884a48fffe4	7a9a763e18b1e537f7ddccdeaafe79129c2bc2d56855048cae21fdcad053b0be	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:35:23.04468+00	2026-09-01 22:35:23.044674+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:50:24.854608+00	rotation	b8f2c792-9cf2-4822-8b34-63212afd3451	\N
b8f2c792-9cf2-4822-8b34-63212afd3451	1cdb9707d0323c3e7ad0e8bf1514ff43703fe21005068c760554efdda727b85b	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:50:24.778125+00	2026-09-01 22:50:24.777999+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:50:26.13229+00	rotation	f331268c-c99f-419d-b943-a63c08df8f06	\N
f331268c-c99f-419d-b943-a63c08df8f06	a6392b09d0e16835bcae9da0f62125462c06678bece233b03e31639f62aa8f40	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:50:26.129813+00	2026-09-01 22:50:26.129799+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 22:50:27.254997+00	rotation	864f84e2-1e60-4079-96ee-8373a07f5096	\N
864f84e2-1e60-4079-96ee-8373a07f5096	9b4a3df168a6913e5dd6d4e00cdc8a9f4d2938ac05ae14f122030b1b5b6b7076	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 22:50:27.254038+00	2026-09-01 22:50:27.25402+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 23:05:33.865654+00	rotation	724011ca-f35c-4eee-85de-cb101fd876a6	\N
b2b7be8d-57e9-4d94-a2de-d06b5845a565	0524ed4483611ac5d11387e0969c1fe7b9fcd671976653df4ddba5cdb44f8da5	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 23:21:13.350824+00	2026-09-01 23:21:13.350819+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 23:36:17.180142+00	rotation	9b808b15-aba3-404d-a4c9-bf0007dc420c	\N
724011ca-f35c-4eee-85de-cb101fd876a6	2c00ced0a47d13474e4a0a3c2e2de9943c4f29079f40deb6a694df5473586459	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 23:05:33.863659+00	2026-09-01 23:05:33.863642+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 23:21:13.351077+00	rotation	b2b7be8d-57e9-4d94-a2de-d06b5845a565	\N
9b808b15-aba3-404d-a4c9-bf0007dc420c	756450c5c794ef73098fe070149245f5ab8aa9f522ebe26b23301f9a4e236102	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 23:36:17.172577+00	2026-09-01 23:36:17.17256+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 23:36:17.271596+00	rotation	d4f56fe5-5c84-4949-8256-207fae821170	\N
d4f56fe5-5c84-4949-8256-207fae821170	58fd0167c73e0cbfa3129e698e4655f890bc7580c095bd80a2178115a3fb5a7f	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 23:36:17.271319+00	2026-09-01 23:36:17.271315+00	2026-09-24 21:49:21.924316+00	t	2026-08-25 23:51:20.893856+00	rotation	e6c3061f-28c4-4268-85ac-42334db527a5	\N
e6c3061f-28c4-4268-85ac-42334db527a5	c2387b1efad1cd05373baa2c00d03db1a8462278cc3b957514de716dd0821e90	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-25 23:51:20.893446+00	2026-09-01 23:51:20.893438+00	2026-09-24 21:49:21.924316+00	t	2026-08-26 00:06:20.940543+00	rotation	4966f3ab-922d-4638-812a-498a47711b2e	\N
3336b71d-e058-4b21-9524-b8d7a7310f87	7ce69e66cf0bcdfe4812f026bc101ec923dbc5256c513388206b388194afc9bf	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-26 11:39:33.001087+00	2026-09-02 11:39:33.001069+00	2026-09-24 21:49:21.924316+00	f	\N	\N	\N	\N
4966f3ab-922d-4638-812a-498a47711b2e	e6a3883a3189946fed81a48627deed4e53bd97ea53be1dbc92d1a2e8fcf2e7fd	60f8b367-c6a6-461c-9d42-fafbea880a17	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	83d0ec2c66cef4ef26d860a3268327fe	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-26 00:06:20.939867+00	2026-09-02 00:06:20.939862+00	2026-09-24 21:49:21.924316+00	t	2026-08-26 11:39:33.008744+00	rotation	3336b71d-e058-4b21-9524-b8d7a7310f87	\N
d115017b-e8b0-4936-bea3-24f0e30784b0	1264357f8ebccb4f148b2b8c0ba902157ff184a9e768e07e946e27d89649a860	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:12:53.170994+00	2026-09-02 15:12:53.170974+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.208108+00	rotation	027fa696-7b37-4af4-9972-2bad180dc167	\N
027fa696-7b37-4af4-9972-2bad180dc167	a258123dcfad3eede13803dc4e72fa46df23e2a8db783ab44962af28b49f1d3a	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.206744+00	2026-09-02 15:22:37.206713+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.300414+00	rotation	a2ad4fad-55d6-46d1-afd0-78fd39ca5b29	\N
a2ad4fad-55d6-46d1-afd0-78fd39ca5b29	d0be3022fcf84040548f52c504fee550a0c49fa8a745174ba1c33c2216d483ef	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.30004+00	2026-09-02 15:22:37.300034+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.392223+00	rotation	a8315c93-4423-4454-86ac-742184f35ec1	\N
a8315c93-4423-4454-86ac-742184f35ec1	b488e3e28f747f7c09d65d9032f0e5efce7063c212dbeec74f2d51a0e6247721	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.391908+00	2026-09-02 15:22:37.391902+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.470568+00	rotation	e1e67b63-695e-4b48-ad88-d5ddabf80e05	\N
e1e67b63-695e-4b48-ad88-d5ddabf80e05	227c840f98846b30911855a8ec7612121475e3c18be7ce9446219bb6c53faf7a	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.470278+00	2026-09-02 15:22:37.470273+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.559272+00	rotation	75fa79e1-a884-425b-a87d-1e8b551d9ec6	\N
75fa79e1-a884-425b-a87d-1e8b551d9ec6	71623b9945ecbbd70075d49ee0a54c697731aad0631cb144f9eb14bf82b2c517	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.558568+00	2026-09-02 15:22:37.558559+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.65769+00	rotation	7aaaa67f-4995-4fb4-8873-b178effaa83c	\N
7aaaa67f-4995-4fb4-8873-b178effaa83c	f69dc74c753a22b63adaee713f4b6e56078d657f496ca4d937078a023b46d2d3	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.657371+00	2026-09-02 15:22:37.657348+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.751746+00	rotation	25e9028c-5f31-43dd-a518-8902cde5740c	\N
25e9028c-5f31-43dd-a518-8902cde5740c	0f920dcddc673af6bb1d9ab5d5e0a095a721d8a6cb58ca491561c8d6580ca403	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.751508+00	2026-09-02 15:22:37.751503+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.84916+00	rotation	6500c3eb-9c88-4d44-9af4-a9dd86581d8f	\N
6500c3eb-9c88-4d44-9af4-a9dd86581d8f	1b307bcc83e994d11c42e94de194cbe01b288c346405abfef4c03849444a1a26	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.848921+00	2026-09-02 15:22:37.848917+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.920349+00	rotation	bfc147e2-9fd2-4539-bb36-a559da8f05eb	\N
c1c98e17-58dd-44a6-a648-bfca39578d83	dadd43a844f55b2f0f80466920e5a801285b5fba1d9c1f17f26252dd365e5073	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.990124+00	2026-09-02 15:22:37.990119+00	2026-09-25 15:12:53.170571+00	f	\N	\N	\N	\N
bfc147e2-9fd2-4539-bb36-a559da8f05eb	96b27bdc1173aff6d492f3956f1fbb6de71f168d62d3de5812e148d536ec9db8	4a315d95-f84c-4158-88b9-ed23ff305234	3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	56a4c31d6dc205ef92002a0953348a16	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-26 15:22:37.920091+00	2026-09-02 15:22:37.920072+00	2026-09-25 15:12:53.170571+00	t	2026-08-26 15:22:37.990392+00	rotation	c1c98e17-58dd-44a6-a648-bfca39578d83	\N
\.


--
-- Data for Name: rent_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rent_reviews (id, tenant_id, unit_id, property_id, occupant_id, current_rent, proposed_rent, increase_pct, effective_date, status, notified_at, applied_at, cancelled_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sender_id_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sender_id_requests (id, tenant_id, requested_sender_id, status, rejection_reason, requested_by, approved_by, created_at, approved_at, rejected_at) FROM stdin;
\.


--
-- Data for Name: sms_credit_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_credit_accounts (id, tenant_id, active_sender_id, balance, version, created_at, updated_at, deactivated_sender_id, deactivated_at, deactivated_by, deactivation_reason) FROM stdin;
\.


--
-- Data for Name: sms_credit_ledger_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_credit_ledger_entries (id, tenant_id, sms_credit_account_id, entry_type, category, amount, running_balance, status, description, reference_code, created_at) FROM stdin;
\.


--
-- Data for Name: sms_credit_topup_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_credit_topup_transactions (id, tenant_id, client_trans_id, gross_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: sms_fee_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_fee_tiers (id, min_amount, max_amount, fee_type, fee_value, created_at) FROM stdin;
9f588b90-0144-4231-bc67-4c40159fe11c	0.00	1000.00	PERCENTAGE	0.0200	2026-08-22 23:11:04.457072
83e0548b-d66a-44e2-a54e-05eaac8ff4c3	1000.00	\N	FLAT	10.0000	2026-08-22 23:11:04.457072
\.


--
-- Data for Name: sms_reminder_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_reminder_log (id, tenant_id, entity_type, entity_id, days_before, recipient_phone, sent_at, channel) FROM stdin;
\.


--
-- Data for Name: subscription_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_invoices (id, tenant_subscription_id, target_plan_id, period_start, period_end, unit_count, price_per_unit, total_amount, status, invoice_type, paid_at, redde_transaction_ref, client_trans_id, failure_reason, retry_count, next_retry_at, created_at, voided_at, voided_by, void_reason, retries_exhausted_at, billing_cycle, payment_method) FROM stdin;
79c1c0ce-68cc-4680-8ed8-9fcf2e25d62d	634363d2-48da-496d-a421-612464c5f28c	41a47258-49b8-4ded-8707-7952071a291c	2026-08-23	2026-09-22	9	15.00	135.00	FAILED	UPGRADE	\N	\N	SUB_C696A8976EDB4C17	Bank transfer is not enabled, so this payment could never be confirmed	0	\N	2026-08-23 00:18:31.87844	\N	\N	\N	\N	MONTHLY	MANUAL
\.


--
-- Data for Name: subscription_plan_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plan_changes (id, tenant_id, from_plan, to_plan, changed_by, reason, changed_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, display_name, price_per_unit, free_unit_cap, transaction_fee_pct, active, created_at, updated_at, popular, marketing_features, annual_discount_pct) FROM stdin;
7bbe461e-aceb-4606-a538-b8d7cb038b6a	FREE	Free Plan	0.00	5	0.0200	t	2026-08-22 23:11:03.876187	2026-08-22 23:11:03.876187	f	[]	\N
41a47258-49b8-4ded-8707-7952071a291c	BASIC	Basic Plan	15.00	\N	0.0150	t	2026-08-22 23:11:03.876187	2026-08-22 23:11:03.876187	f	[]	\N
900ea37a-5e1b-4a39-87bd-d725780ac798	PRO	Pro Plan	30.00	\N	0.0100	t	2026-08-22 23:11:03.876187	2026-08-22 23:11:03.876187	f	[]	\N
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, tenant_id, submitter_email, subject, body, status, priority, assigned_to, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_admin_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_admin_roles (admin_id, role_id) FROM stdin;
33333333-3333-3333-3333-333333333001	22222222-2222-2222-2222-222222222001
\.


--
-- Data for Name: system_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_admins (id, email, password_hash, full_name, active, created_at, last_login_at, mfa_required, phone_number, phone_verified_at) FROM stdin;
33333333-3333-3333-3333-333333333001	abdulshakuraclement@yahoo.com	$2a$10$kP8.x0Vc5CmTYGUSpUZrk.L4X6iT2y.T6Pk/W0dX6LeBWh9YcFnZi	Abdul Shakur Clement	t	2026-08-22 23:11:03.856536+00	\N	f	\N	\N
\.


--
-- Data for Name: system_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_permissions (id, code, description, created_at, module) FROM stdin;
11111111-1111-1111-1111-111111111001	view_tenants	View tenant list and details	2026-08-22 23:11:03.856536	legacy
11111111-1111-1111-1111-111111111002	manage_tenants	Create, update, and deactivate tenants	2026-08-22 23:11:03.856536	legacy
11111111-1111-1111-1111-111111111003	manage_admins	Create and deactivate system admins	2026-08-22 23:11:03.856536	legacy
c6734a38-0602-4b37-8e9a-8608163977a9	platform:tenants:read	View tenant accounts and their details	2026-08-22 23:11:04.611344	tenants
70e78c24-6a2c-42ec-8126-4f93ff54becd	platform:tenants:write	Create, edit, suspend and reactivate tenants	2026-08-22 23:11:04.611344	tenants
27f32647-bc92-4757-80ee-d128f25dc95c	platform:tenants:offboard	Permanently offboard a tenant	2026-08-22 23:11:04.611344	tenants
91a45705-96ef-4cc5-897f-150b37ce7937	platform:wallet:read	View tenant wallet balances and ledger	2026-08-22 23:11:04.611344	wallet
f421120d-777a-4960-9296-b30aab718b6a	platform:wallet:adjust	Freeze wallets and post manual credits/debits	2026-08-22 23:11:04.611344	wallet
09e9b677-9609-42ca-b086-882abcfd2047	platform:users:read	View users across all tenants	2026-08-22 23:11:04.611344	users
b3ed408c-b7b3-4180-a4f6-b962b855bf5a	platform:users:write	Manage users across all tenants	2026-08-22 23:11:04.611344	users
1fe397a2-9d86-47ab-a4fd-9b3202d39514	platform:admins:read	View platform administrators	2026-08-22 23:11:04.611344	admins
e0d32cfc-dbdf-4e49-9877-e2d3b6f4b21b	platform:admins:manage	Create, deactivate and assign roles to admins	2026-08-22 23:11:04.611344	admins
0e38eb81-cfe9-4226-bf6c-3c0c11daa3b7	platform:roles:read	View platform roles and permissions	2026-08-22 23:11:04.611344	admins
922a7f9f-5d55-4049-842c-1d637e16f1ff	platform:roles:manage	Create and edit platform roles	2026-08-22 23:11:04.611344	admins
b2bf390d-f261-4612-ba6f-7bc69f6f8885	platform:plans:read	View subscription plans and assignments	2026-08-22 23:11:04.611344	billing
9abdeec9-d71d-4390-9048-966536edcdef	platform:plans:write	Create and edit plans, override tenant plans	2026-08-22 23:11:04.611344	billing
3b9032ad-b5e5-4c3c-8e99-f5bba15209b0	platform:billing:read	View platform invoices and fee ledger	2026-08-22 23:11:04.611344	billing
ce4abdbd-f24d-4162-b302-5000e45e4967	platform:billing:write	Settle fees and manage platform invoices	2026-08-22 23:11:04.611344	billing
17ec05e5-66f8-4cc0-ac4d-daa114e17f46	platform:features:read	View per-tenant feature flag overrides	2026-08-22 23:11:04.611344	billing
bc0b6930-96cb-4b08-a804-3afc71baa2c3	platform:features:write	Set and clear per-tenant feature overrides	2026-08-22 23:11:04.611344	billing
f3a7ba70-3ed4-4c1e-a539-f0867cae3dff	platform:announcements:read	View platform announcements	2026-08-22 23:11:04.611344	comms
b3d80721-ad3d-4502-8c40-78326f485164	platform:announcements:write	Create, edit and delete announcements	2026-08-22 23:11:04.611344	comms
6a9134d9-f3a6-48f0-9c7a-e58c1e662521	platform:messaging:read	View message history	2026-08-22 23:11:04.611344	comms
65751118-46d6-4dcb-97b1-2641843b2979	platform:messaging:send	Send targeted and broadcast messages	2026-08-22 23:11:04.611344	comms
99f65a92-6a67-4744-be0c-bd6940eb4e10	platform:support:read	View support tickets and feedback	2026-08-22 23:11:04.611344	support
54280ecf-b4e6-40d0-b74b-aa016aa20b2f	platform:support:write	Respond to and update support tickets	2026-08-22 23:11:04.611344	support
daf3e8c2-4c51-45aa-a760-018f9f199144	platform:reports:read	View platform analytics and reports	2026-08-22 23:11:04.611344	reports
a85d0443-7410-4cc9-98fe-baf8852ddf8d	platform:settings:read	View platform settings	2026-08-22 23:11:04.611344	system
179467e9-b250-4da6-beb7-09650620ea34	platform:settings:write	Change platform settings and maintenance mode	2026-08-22 23:11:04.611344	system
996dea3a-6847-4133-abe5-23143d1f41c8	platform:gateway:read	View payment gateway configuration	2026-08-22 23:11:04.611344	system
395eeaf5-0369-4ad6-8be2-b45da00b46be	platform:gateway:write	Change payment gateway configuration	2026-08-22 23:11:04.611344	system
5199ab77-4474-4192-ad23-72d2a06884ac	platform:health:read	View system health and infrastructure status	2026-08-22 23:11:04.611344	system
fbb08ece-c301-4508-8e1b-c0b496a9a173	platform:sms:read	View SMS sender ID requests	2026-08-22 23:11:04.611344	system
c17de18b-7e07-4107-9c25-5708830dd6db	platform:sms:approve	Approve, reject and deactivate sender IDs	2026-08-22 23:11:04.611344	system
0e6e9f66-9359-4c8c-a8fa-325c9c8d5522	platform:audit:read	View the platform audit log	2026-08-22 23:11:04.611344	audit
a6dcd728-d1f9-44d7-912e-5bd11ad2c49e	platform:sessions:read	View active tenant sessions	2026-08-22 23:11:04.611344	audit
27dfc2bb-9007-4939-a316-2ac2b6ec4aa4	platform:sessions:manage	Force-terminate tenant sessions	2026-08-22 23:11:04.611344	audit
29877f23-b746-44ef-9338-697752a6f748	platform:apikeys:read	View tenant API keys	2026-08-22 23:11:04.611344	audit
de616e33-6585-414c-b066-89c8c65d7f16	platform:apikeys:manage	Generate and revoke tenant API keys	2026-08-22 23:11:04.611344	audit
6041ebc3-ca9b-4fc2-b1a1-524ab5c3fba1	platform:export:run	Export platform data	2026-08-22 23:11:04.611344	audit
73ec41f9-46a8-4ce3-8050-1101b053577e	platform:impersonate	Sign in as a tenant user	2026-08-22 23:11:04.611344	impersonation
\.


--
-- Data for Name: system_role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_role_permissions (role_id, permission_id) FROM stdin;
22222222-2222-2222-2222-222222222001	11111111-1111-1111-1111-111111111001
22222222-2222-2222-2222-222222222001	11111111-1111-1111-1111-111111111002
22222222-2222-2222-2222-222222222001	11111111-1111-1111-1111-111111111003
22222222-2222-2222-2222-222222222001	c6734a38-0602-4b37-8e9a-8608163977a9
22222222-2222-2222-2222-222222222001	70e78c24-6a2c-42ec-8126-4f93ff54becd
22222222-2222-2222-2222-222222222001	27f32647-bc92-4757-80ee-d128f25dc95c
22222222-2222-2222-2222-222222222001	91a45705-96ef-4cc5-897f-150b37ce7937
22222222-2222-2222-2222-222222222001	f421120d-777a-4960-9296-b30aab718b6a
22222222-2222-2222-2222-222222222001	09e9b677-9609-42ca-b086-882abcfd2047
22222222-2222-2222-2222-222222222001	b3ed408c-b7b3-4180-a4f6-b962b855bf5a
22222222-2222-2222-2222-222222222001	1fe397a2-9d86-47ab-a4fd-9b3202d39514
22222222-2222-2222-2222-222222222001	e0d32cfc-dbdf-4e49-9877-e2d3b6f4b21b
22222222-2222-2222-2222-222222222001	0e38eb81-cfe9-4226-bf6c-3c0c11daa3b7
22222222-2222-2222-2222-222222222001	922a7f9f-5d55-4049-842c-1d637e16f1ff
22222222-2222-2222-2222-222222222001	b2bf390d-f261-4612-ba6f-7bc69f6f8885
22222222-2222-2222-2222-222222222001	9abdeec9-d71d-4390-9048-966536edcdef
22222222-2222-2222-2222-222222222001	3b9032ad-b5e5-4c3c-8e99-f5bba15209b0
22222222-2222-2222-2222-222222222001	ce4abdbd-f24d-4162-b302-5000e45e4967
22222222-2222-2222-2222-222222222001	17ec05e5-66f8-4cc0-ac4d-daa114e17f46
22222222-2222-2222-2222-222222222001	bc0b6930-96cb-4b08-a804-3afc71baa2c3
22222222-2222-2222-2222-222222222001	f3a7ba70-3ed4-4c1e-a539-f0867cae3dff
22222222-2222-2222-2222-222222222001	b3d80721-ad3d-4502-8c40-78326f485164
22222222-2222-2222-2222-222222222001	6a9134d9-f3a6-48f0-9c7a-e58c1e662521
22222222-2222-2222-2222-222222222001	65751118-46d6-4dcb-97b1-2641843b2979
22222222-2222-2222-2222-222222222001	99f65a92-6a67-4744-be0c-bd6940eb4e10
22222222-2222-2222-2222-222222222001	54280ecf-b4e6-40d0-b74b-aa016aa20b2f
22222222-2222-2222-2222-222222222001	daf3e8c2-4c51-45aa-a760-018f9f199144
22222222-2222-2222-2222-222222222001	a85d0443-7410-4cc9-98fe-baf8852ddf8d
22222222-2222-2222-2222-222222222001	179467e9-b250-4da6-beb7-09650620ea34
22222222-2222-2222-2222-222222222001	996dea3a-6847-4133-abe5-23143d1f41c8
22222222-2222-2222-2222-222222222001	395eeaf5-0369-4ad6-8be2-b45da00b46be
22222222-2222-2222-2222-222222222001	5199ab77-4474-4192-ad23-72d2a06884ac
22222222-2222-2222-2222-222222222001	fbb08ece-c301-4508-8e1b-c0b496a9a173
22222222-2222-2222-2222-222222222001	c17de18b-7e07-4107-9c25-5708830dd6db
22222222-2222-2222-2222-222222222001	0e6e9f66-9359-4c8c-a8fa-325c9c8d5522
22222222-2222-2222-2222-222222222001	a6dcd728-d1f9-44d7-912e-5bd11ad2c49e
22222222-2222-2222-2222-222222222001	27dfc2bb-9007-4939-a316-2ac2b6ec4aa4
22222222-2222-2222-2222-222222222001	29877f23-b746-44ef-9338-697752a6f748
22222222-2222-2222-2222-222222222001	de616e33-6585-414c-b066-89c8c65d7f16
22222222-2222-2222-2222-222222222001	6041ebc3-ca9b-4fc2-b1a1-524ab5c3fba1
22222222-2222-2222-2222-222222222001	73ec41f9-46a8-4ce3-8050-1101b053577e
\.


--
-- Data for Name: system_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_roles (id, name, description, created_at) FROM stdin;
22222222-2222-2222-2222-222222222001	SUPER_ADMIN	Full platform access — all permissions	2026-08-22 23:11:03.856536
\.


--
-- Data for Name: tenant_api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_api_keys (id, tenant_id, name, key_prefix, key_hash, last_used_at, expires_at, is_active, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_feature_flag_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_feature_flag_overrides (id, tenant_id, feature_key, enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_feedback (id, tenant_id, submitter_email, rating, category, message, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_login_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_login_history (id, tenant_id, user_id, email, ip_address, user_agent, success, failure_reason, created_at) FROM stdin;
f6b1798a-ea68-4e67-ad32-8a0a9eeff395	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-22 23:40:58.547651+00
7cbdf3ea-b177-4834-97d7-95326567bacd	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-23 03:02:42.803523+00
9291b57a-cb8c-4ec2-8e6e-f8c48903546c	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	172.23.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-24 01:36:31.772525+00
654b5270-a2ac-49a6-893e-6df9e83cdc87	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-24 17:29:01.761822+00
6ec251fd-0c4f-401d-a7ed-0de6ee6c4b8e	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	curl/8.7.1	t	\N	2026-08-24 22:49:16.428908+00
26f8190b-1a2a-4494-9c49-f6062871b7d0	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	curl/8.7.1	t	\N	2026-08-25 00:03:24.33827+00
d1966a3a-c26c-446f-896d-3f5348a39764	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	curl/8.7.1	t	\N	2026-08-25 02:39:35.947096+00
c3a96e4a-e27a-4352-853d-3a50e261e44c	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-25 19:11:55.277127+00
5ff4ba84-e091-42e1-b617-2f93f1dd7f24	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-25 19:51:49.440973+00
df1977ac-a4c8-4042-9602-07d2fb910100	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	t	\N	2026-08-25 21:49:21.958031+00
77d4343d-5536-4f78-96de-c31a164863bd	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	abdulshakuraclement@yahoo.com	0:0:0:0:0:0:0:1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	t	\N	2026-08-26 15:12:53.202535+00
\.


--
-- Data for Name: tenant_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_notes (id, tenant_id, body, author_id, author_name, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_permissions (id, code, description, module, created_at) FROM stdin;
b0585ad9-cce4-46d5-850c-d892d3eb84fd	property:read	View properties and units	properties	2026-08-22 23:11:02.862141+00
edba21e0-9c8a-4a34-aa07-61ed783f506f	property:write	Create, update, and delete properties	properties	2026-08-22 23:11:02.862141+00
d38f1ac0-376e-4596-9190-a42451ec6d0b	occupant:read	View occupant records	occupants	2026-08-22 23:11:02.862141+00
798bf596-d102-4a9d-a2c6-ca36ff60e72f	occupant:write	Manage occupant records	occupants	2026-08-22 23:11:02.862141+00
d33d56d4-2ca6-4c99-b7d6-217b2e30ae29	invoice:read	View invoices and payments	billing	2026-08-22 23:11:02.862141+00
04ad81a9-50a7-42a6-919a-0060216800b5	invoice:write	Create and manage invoices	billing	2026-08-22 23:11:02.862141+00
08ad3f13-62ec-4e73-9e90-e8317bb78c05	payment:read	View payment history	billing	2026-08-22 23:11:02.862141+00
f1704eb1-3a0e-4cc0-91d3-96caebecba25	payment:write	Record payments	billing	2026-08-22 23:11:02.862141+00
1e4407d9-0a45-4d9a-8b01-fc4f2f787c7c	maintenance:read	View maintenance requests	maintenance	2026-08-22 23:11:02.862141+00
c514f233-123d-4854-968c-0cc85751088e	maintenance:create	Create maintenance requests	maintenance	2026-08-22 23:11:02.862141+00
eda6505e-7427-497a-9ce2-25582234384a	maintenance:manage	Assign and manage maintenance requests	maintenance	2026-08-22 23:11:02.862141+00
e698a82e-ab6c-4872-a5fc-8b087b57c7db	agreement:read	View lease agreements	agreements	2026-08-22 23:11:02.862141+00
7d066fc4-ce76-4d7f-b859-b3512f6d0c26	agreement:write	Create and manage agreements	agreements	2026-08-22 23:11:02.862141+00
53c98c6d-b4de-4d0c-b261-2d8f54e7af1f	report:view	View reports and analytics	reports	2026-08-22 23:11:02.862141+00
010ad824-bf2e-4b50-8641-77af549014de	settings:read	View tenant settings	settings	2026-08-22 23:11:02.862141+00
86b32681-8214-4ee8-9487-fb2fa9a342bc	settings:write	Manage tenant settings	settings	2026-08-22 23:11:02.862141+00
a12490b3-a35d-442c-a412-650f0a66553c	user:read	View tenant users	users	2026-08-22 23:11:02.862141+00
d6dce9ec-b5c4-4a69-b756-6827f3d446c6	user:write	Manage tenant users	users	2026-08-22 23:11:02.862141+00
862947f9-5f62-40be-8ccd-f7d90cbc762c	dashboard:view	Access dashboard overview	dashboard	2026-08-22 23:11:02.862141+00
3dc0f769-1ddf-4e04-9a13-5c8b4eafaf1d	maintainer:read	View maintainers list and details	maintenance	2026-08-22 23:11:03.240859+00
d5e28077-f59e-4385-9b8e-8f15c8923445	maintainer:write	Create new maintainers	maintenance	2026-08-22 23:11:03.240859+00
3367acdd-6ea8-4647-849a-0cfc11291589	maintainer:update	Update existing maintainer records	maintenance	2026-08-22 23:11:03.240859+00
209996ae-5711-4c8f-b325-2541567a089c	maintainer:delete	Delete maintainer records	maintenance	2026-08-22 23:11:03.240859+00
f4c6f513-d960-425c-86eb-5e1cd84e0d72	property:update	Update property records	properties	2026-08-22 23:11:04.336722+00
0aceb9d9-7b4a-4a99-97fe-891c999d94ad	property:delete	Delete property records	properties	2026-08-22 23:11:04.336722+00
8a887b19-a034-456f-bfcb-84e7ad8fd68a	occupant:delete	Delete occupant records	occupants	2026-08-22 23:11:04.336722+00
fc496618-cef1-4f24-9ebd-285cde3fbd60	expenses:read	View expense records	expenses	2026-08-22 23:11:04.336722+00
842e79f6-4f5f-4308-b813-bdc88a172806	expenses:create	Create expense records	expenses	2026-08-22 23:11:04.336722+00
0728c8f9-bddc-4185-aec8-c94758815baa	expenses:update	Update expense records	expenses	2026-08-22 23:11:04.336722+00
669df956-7236-4ea4-b9d3-c327c0dd52d2	expenses:delete	Delete expense records	expenses	2026-08-22 23:11:04.336722+00
880584e9-6007-4739-b62f-3eebde607663	unit:write	Create and update units	properties	2026-08-22 23:11:04.336722+00
d6d23978-918b-42e4-a5b4-021da181a1b2	unit:delete	Delete units	properties	2026-08-22 23:11:04.336722+00
35d6c2dc-10a0-4489-872d-aace6566b6d9	maintenance:update	Update maintenance request status	maintenance	2026-08-22 23:11:04.336722+00
8bb9ba78-0695-4e29-bcf1-5cb2a6135d3b	maintenance:comment	Add comments to maintenance requests	maintenance	2026-08-22 23:11:04.336722+00
f483ec90-583d-4001-b686-9065c29b4882	advance_rents:read	View advance rent records	billing	2026-08-22 23:11:04.336722+00
0195cb9e-0af2-467f-9676-6aa83578f225	advance_rents:create	Create advance rent records	billing	2026-08-22 23:11:04.336722+00
c869f5c3-6fb7-4db3-be62-9e6a30b04c9f	advance_rents:update	Update advance rent records	billing	2026-08-22 23:11:04.336722+00
423d829c-566a-46c6-9248-a21e4348e2f8	wallet:read	View wallet balance and ledger	wallet	2026-08-22 23:11:04.336722+00
b220f71a-816d-463b-b69a-7d154b02450d	wallet:write	Initiate wallet transactions	wallet	2026-08-22 23:11:04.336722+00
7d776e15-6c66-46b5-ad08-e2288da510c7	communication:read	View communications and notices	communication	2026-08-22 23:11:04.336722+00
42554bf8-fb93-4d16-acc4-132a7170d80e	communication:write	Send notices and messages	communication	2026-08-22 23:11:04.336722+00
3ccee66c-5b64-44db-854e-f0e8c1a2ff3f	document:read	View tenant documents	documents	2026-08-22 23:11:04.336722+00
196a953f-8dc0-4889-907e-0e784c615ada	document:write	Upload and manage documents	documents	2026-08-22 23:11:04.336722+00
3efb50bf-dd75-49d2-97c9-9de9b23fd38b	inspection:read	View inspections and reports	inspections	2026-08-22 23:11:04.336722+00
96459267-d8ab-4ba8-b978-3f349adf4628	inspection:write	Create and manage inspections	inspections	2026-08-22 23:11:04.336722+00
49fe1748-cd40-46b3-b691-ea6f3502dfeb	late-fee:read	View late fee records	billing	2026-08-22 23:11:04.336722+00
b994e6e0-9bf4-4ad1-8092-bbc1af3d4e3e	late-fee:write	Apply and manage late fees	billing	2026-08-22 23:11:04.336722+00
1fb97f94-d341-4567-95f1-8af5c9ababc5	vacate-notice:read	View vacate notices	occupants	2026-08-22 23:11:04.336722+00
f4d9d2e9-23d5-485a-aaec-b2c2ff5a3718	vacate-notice:write	Create and manage vacate notices	occupants	2026-08-22 23:11:04.336722+00
45e0e6dc-df2c-40dd-ac7d-3289919bc610	agent:read	View agent records	agents	2026-08-22 23:11:04.336722+00
bf6c812b-f13f-44ef-8d66-5f5bc3e49661	agent:write	Manage agent records and commissions	agents	2026-08-22 23:11:04.336722+00
83012241-3373-47f7-bf7e-88ffc7a4c152	guarantors:read	View guarantor records	occupants	2026-08-22 23:11:04.336722+00
cb044283-575a-4b3c-88d3-8bb2dd4ecc5c	guarantors:write	Manage guarantor records	occupants	2026-08-22 23:11:04.336722+00
6c5c28bf-cce2-4793-89bf-5338a97d7a33	listings:read	View vacancy listings	listings	2026-08-22 23:11:04.336722+00
9bc6277d-f1a6-44ca-a39e-e59668edadc9	listings:write	Create and update vacancy listings	listings	2026-08-22 23:11:04.336722+00
d0fe95c6-858c-4c35-a190-4de6a63baf28	listings:delete	Delete vacancy listings	listings	2026-08-22 23:11:04.336722+00
fbc2e7d4-abcd-44bb-9856-903f258e4b2f	rent-reviews:read	View rent review records	rent-reviews	2026-08-22 23:11:04.336722+00
595c1af4-f9f9-41e1-9bfe-3ca16b656f6f	rent-reviews:write	Create and manage rent reviews	rent-reviews	2026-08-22 23:11:04.336722+00
91f27059-2c52-40e9-be5f-6bd9d837d213	utilities:read	View utility meter records	utilities	2026-08-22 23:11:04.336722+00
81c6f23c-f6a7-4e4d-930a-2af5da422491	utilities:write	Manage utility meter records	utilities	2026-08-22 23:11:04.336722+00
58bdac51-0132-49d7-ad78-45c91fa9d0e2	caution_fees:read	View caution fee records	billing	2026-08-22 23:11:04.336722+00
6316a8a2-099d-4f78-ad85-d601f237ecb5	caution_fees:write	Create caution fee records	billing	2026-08-22 23:11:04.336722+00
a1831219-3e9b-489c-9cdb-b0d65fe483fe	caution_fees:delete	Delete caution fee records	billing	2026-08-22 23:11:04.336722+00
\.


--
-- Data for Name: tenant_role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_role_permissions (role_id, permission_id) FROM stdin;
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	0195cb9e-0af2-467f-9676-6aa83578f225
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	35d6c2dc-10a0-4489-872d-aace6566b6d9
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	3ccee66c-5b64-44db-854e-f0e8c1a2ff3f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	b994e6e0-9bf4-4ad1-8092-bbc1af3d4e3e
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	bf6c812b-f13f-44ef-8d66-5f5bc3e49661
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	7d776e15-6c66-46b5-ad08-e2288da510c7
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	49fe1748-cd40-46b3-b691-ea6f3502dfeb
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d33d56d4-2ca6-4c99-b7d6-217b2e30ae29
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	a1831219-3e9b-489c-9cdb-b0d65fe483fe
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	842e79f6-4f5f-4308-b813-bdc88a172806
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	58bdac51-0132-49d7-ad78-45c91fa9d0e2
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	0728c8f9-bddc-4185-aec8-c94758815baa
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	6c5c28bf-cce2-4793-89bf-5338a97d7a33
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	209996ae-5711-4c8f-b325-2541567a089c
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d6d23978-918b-42e4-a5b4-021da181a1b2
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	862947f9-5f62-40be-8ccd-f7d90cbc762c
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	53c98c6d-b4de-4d0c-b261-2d8f54e7af1f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	1e4407d9-0a45-4d9a-8b01-fc4f2f787c7c
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d6dce9ec-b5c4-4a69-b756-6827f3d446c6
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	42554bf8-fb93-4d16-acc4-132a7170d80e
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	81c6f23c-f6a7-4e4d-930a-2af5da422491
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	f1704eb1-3a0e-4cc0-91d3-96caebecba25
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	010ad824-bf2e-4b50-8641-77af549014de
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	86b32681-8214-4ee8-9487-fb2fa9a342bc
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	0aceb9d9-7b4a-4a99-97fe-891c999d94ad
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	595c1af4-f9f9-41e1-9bfe-3ca16b656f6f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	e698a82e-ab6c-4872-a5fc-8b087b57c7db
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d38f1ac0-376e-4596-9190-a42451ec6d0b
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	04ad81a9-50a7-42a6-919a-0060216800b5
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	196a953f-8dc0-4889-907e-0e784c615ada
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	a12490b3-a35d-442c-a412-650f0a66553c
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	83012241-3373-47f7-bf7e-88ffc7a4c152
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	b0585ad9-cce4-46d5-850c-d892d3eb84fd
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	8bb9ba78-0695-4e29-bcf1-5cb2a6135d3b
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	3367acdd-6ea8-4647-849a-0cfc11291589
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	9bc6277d-f1a6-44ca-a39e-e59668edadc9
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d5e28077-f59e-4385-9b8e-8f15c8923445
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	423d829c-566a-46c6-9248-a21e4348e2f8
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	b220f71a-816d-463b-b69a-7d154b02450d
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	f4c6f513-d960-425c-86eb-5e1cd84e0d72
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	7d066fc4-ce76-4d7f-b859-b3512f6d0c26
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	c869f5c3-6fb7-4db3-be62-9e6a30b04c9f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	96459267-d8ab-4ba8-b978-3f349adf4628
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	cb044283-575a-4b3c-88d3-8bb2dd4ecc5c
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	d0fe95c6-858c-4c35-a190-4de6a63baf28
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	edba21e0-9c8a-4a34-aa07-61ed783f506f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	669df956-7236-4ea4-b9d3-c327c0dd52d2
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	fc496618-cef1-4f24-9ebd-285cde3fbd60
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	fbc2e7d4-abcd-44bb-9856-903f258e4b2f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	08ad3f13-62ec-4e73-9e90-e8317bb78c05
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	f4d9d2e9-23d5-485a-aaec-b2c2ff5a3718
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	3dc0f769-1ddf-4e04-9a13-5c8b4eafaf1d
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	1fb97f94-d341-4567-95f1-8af5c9ababc5
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	f483ec90-583d-4001-b686-9065c29b4882
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	45e0e6dc-df2c-40dd-ac7d-3289919bc610
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	3efb50bf-dd75-49d2-97c9-9de9b23fd38b
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	8a887b19-a034-456f-bfcb-84e7ad8fd68a
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	880584e9-6007-4739-b62f-3eebde607663
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	798bf596-d102-4a9d-a2c6-ca36ff60e72f
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	c514f233-123d-4854-968c-0cc85751088e
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	eda6505e-7427-497a-9ce2-25582234384a
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	91f27059-2c52-40e9-be5f-6bd9d837d213
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	6316a8a2-099d-4f78-ad85-d601f237ecb5
3d2daafa-4066-4592-9f18-cab7a3ca8470	0195cb9e-0af2-467f-9676-6aa83578f225
3d2daafa-4066-4592-9f18-cab7a3ca8470	35d6c2dc-10a0-4489-872d-aace6566b6d9
3d2daafa-4066-4592-9f18-cab7a3ca8470	3ccee66c-5b64-44db-854e-f0e8c1a2ff3f
3d2daafa-4066-4592-9f18-cab7a3ca8470	b994e6e0-9bf4-4ad1-8092-bbc1af3d4e3e
3d2daafa-4066-4592-9f18-cab7a3ca8470	bf6c812b-f13f-44ef-8d66-5f5bc3e49661
3d2daafa-4066-4592-9f18-cab7a3ca8470	7d776e15-6c66-46b5-ad08-e2288da510c7
3d2daafa-4066-4592-9f18-cab7a3ca8470	49fe1748-cd40-46b3-b691-ea6f3502dfeb
3d2daafa-4066-4592-9f18-cab7a3ca8470	d33d56d4-2ca6-4c99-b7d6-217b2e30ae29
3d2daafa-4066-4592-9f18-cab7a3ca8470	a1831219-3e9b-489c-9cdb-b0d65fe483fe
3d2daafa-4066-4592-9f18-cab7a3ca8470	842e79f6-4f5f-4308-b813-bdc88a172806
3d2daafa-4066-4592-9f18-cab7a3ca8470	58bdac51-0132-49d7-ad78-45c91fa9d0e2
3d2daafa-4066-4592-9f18-cab7a3ca8470	0728c8f9-bddc-4185-aec8-c94758815baa
3d2daafa-4066-4592-9f18-cab7a3ca8470	6c5c28bf-cce2-4793-89bf-5338a97d7a33
3d2daafa-4066-4592-9f18-cab7a3ca8470	209996ae-5711-4c8f-b325-2541567a089c
3d2daafa-4066-4592-9f18-cab7a3ca8470	d6d23978-918b-42e4-a5b4-021da181a1b2
3d2daafa-4066-4592-9f18-cab7a3ca8470	862947f9-5f62-40be-8ccd-f7d90cbc762c
3d2daafa-4066-4592-9f18-cab7a3ca8470	53c98c6d-b4de-4d0c-b261-2d8f54e7af1f
3d2daafa-4066-4592-9f18-cab7a3ca8470	1e4407d9-0a45-4d9a-8b01-fc4f2f787c7c
3d2daafa-4066-4592-9f18-cab7a3ca8470	42554bf8-fb93-4d16-acc4-132a7170d80e
3d2daafa-4066-4592-9f18-cab7a3ca8470	81c6f23c-f6a7-4e4d-930a-2af5da422491
3d2daafa-4066-4592-9f18-cab7a3ca8470	f1704eb1-3a0e-4cc0-91d3-96caebecba25
3d2daafa-4066-4592-9f18-cab7a3ca8470	010ad824-bf2e-4b50-8641-77af549014de
3d2daafa-4066-4592-9f18-cab7a3ca8470	86b32681-8214-4ee8-9487-fb2fa9a342bc
3d2daafa-4066-4592-9f18-cab7a3ca8470	0aceb9d9-7b4a-4a99-97fe-891c999d94ad
3d2daafa-4066-4592-9f18-cab7a3ca8470	595c1af4-f9f9-41e1-9bfe-3ca16b656f6f
3d2daafa-4066-4592-9f18-cab7a3ca8470	e698a82e-ab6c-4872-a5fc-8b087b57c7db
3d2daafa-4066-4592-9f18-cab7a3ca8470	d38f1ac0-376e-4596-9190-a42451ec6d0b
3d2daafa-4066-4592-9f18-cab7a3ca8470	04ad81a9-50a7-42a6-919a-0060216800b5
3d2daafa-4066-4592-9f18-cab7a3ca8470	196a953f-8dc0-4889-907e-0e784c615ada
3d2daafa-4066-4592-9f18-cab7a3ca8470	83012241-3373-47f7-bf7e-88ffc7a4c152
3d2daafa-4066-4592-9f18-cab7a3ca8470	b0585ad9-cce4-46d5-850c-d892d3eb84fd
3d2daafa-4066-4592-9f18-cab7a3ca8470	8bb9ba78-0695-4e29-bcf1-5cb2a6135d3b
3d2daafa-4066-4592-9f18-cab7a3ca8470	3367acdd-6ea8-4647-849a-0cfc11291589
3d2daafa-4066-4592-9f18-cab7a3ca8470	9bc6277d-f1a6-44ca-a39e-e59668edadc9
3d2daafa-4066-4592-9f18-cab7a3ca8470	d5e28077-f59e-4385-9b8e-8f15c8923445
3d2daafa-4066-4592-9f18-cab7a3ca8470	423d829c-566a-46c6-9248-a21e4348e2f8
3d2daafa-4066-4592-9f18-cab7a3ca8470	b220f71a-816d-463b-b69a-7d154b02450d
3d2daafa-4066-4592-9f18-cab7a3ca8470	f4c6f513-d960-425c-86eb-5e1cd84e0d72
3d2daafa-4066-4592-9f18-cab7a3ca8470	7d066fc4-ce76-4d7f-b859-b3512f6d0c26
3d2daafa-4066-4592-9f18-cab7a3ca8470	c869f5c3-6fb7-4db3-be62-9e6a30b04c9f
3d2daafa-4066-4592-9f18-cab7a3ca8470	96459267-d8ab-4ba8-b978-3f349adf4628
3d2daafa-4066-4592-9f18-cab7a3ca8470	cb044283-575a-4b3c-88d3-8bb2dd4ecc5c
3d2daafa-4066-4592-9f18-cab7a3ca8470	d0fe95c6-858c-4c35-a190-4de6a63baf28
3d2daafa-4066-4592-9f18-cab7a3ca8470	edba21e0-9c8a-4a34-aa07-61ed783f506f
3d2daafa-4066-4592-9f18-cab7a3ca8470	669df956-7236-4ea4-b9d3-c327c0dd52d2
3d2daafa-4066-4592-9f18-cab7a3ca8470	fc496618-cef1-4f24-9ebd-285cde3fbd60
3d2daafa-4066-4592-9f18-cab7a3ca8470	fbc2e7d4-abcd-44bb-9856-903f258e4b2f
3d2daafa-4066-4592-9f18-cab7a3ca8470	08ad3f13-62ec-4e73-9e90-e8317bb78c05
3d2daafa-4066-4592-9f18-cab7a3ca8470	f4d9d2e9-23d5-485a-aaec-b2c2ff5a3718
3d2daafa-4066-4592-9f18-cab7a3ca8470	3dc0f769-1ddf-4e04-9a13-5c8b4eafaf1d
3d2daafa-4066-4592-9f18-cab7a3ca8470	1fb97f94-d341-4567-95f1-8af5c9ababc5
3d2daafa-4066-4592-9f18-cab7a3ca8470	f483ec90-583d-4001-b686-9065c29b4882
3d2daafa-4066-4592-9f18-cab7a3ca8470	45e0e6dc-df2c-40dd-ac7d-3289919bc610
3d2daafa-4066-4592-9f18-cab7a3ca8470	3efb50bf-dd75-49d2-97c9-9de9b23fd38b
3d2daafa-4066-4592-9f18-cab7a3ca8470	8a887b19-a034-456f-bfcb-84e7ad8fd68a
3d2daafa-4066-4592-9f18-cab7a3ca8470	880584e9-6007-4739-b62f-3eebde607663
3d2daafa-4066-4592-9f18-cab7a3ca8470	798bf596-d102-4a9d-a2c6-ca36ff60e72f
3d2daafa-4066-4592-9f18-cab7a3ca8470	c514f233-123d-4854-968c-0cc85751088e
3d2daafa-4066-4592-9f18-cab7a3ca8470	eda6505e-7427-497a-9ce2-25582234384a
3d2daafa-4066-4592-9f18-cab7a3ca8470	91f27059-2c52-40e9-be5f-6bd9d837d213
3d2daafa-4066-4592-9f18-cab7a3ca8470	6316a8a2-099d-4f78-ad85-d601f237ecb5
20482e4d-d07b-4b73-88c3-64ef611839dc	d38f1ac0-376e-4596-9190-a42451ec6d0b
20482e4d-d07b-4b73-88c3-64ef611839dc	fbc2e7d4-abcd-44bb-9856-903f258e4b2f
20482e4d-d07b-4b73-88c3-64ef611839dc	08ad3f13-62ec-4e73-9e90-e8317bb78c05
20482e4d-d07b-4b73-88c3-64ef611839dc	6c5c28bf-cce2-4793-89bf-5338a97d7a33
20482e4d-d07b-4b73-88c3-64ef611839dc	a12490b3-a35d-442c-a412-650f0a66553c
20482e4d-d07b-4b73-88c3-64ef611839dc	83012241-3373-47f7-bf7e-88ffc7a4c152
20482e4d-d07b-4b73-88c3-64ef611839dc	b0585ad9-cce4-46d5-850c-d892d3eb84fd
20482e4d-d07b-4b73-88c3-64ef611839dc	3dc0f769-1ddf-4e04-9a13-5c8b4eafaf1d
20482e4d-d07b-4b73-88c3-64ef611839dc	3ccee66c-5b64-44db-854e-f0e8c1a2ff3f
20482e4d-d07b-4b73-88c3-64ef611839dc	1fb97f94-d341-4567-95f1-8af5c9ababc5
20482e4d-d07b-4b73-88c3-64ef611839dc	f483ec90-583d-4001-b686-9065c29b4882
20482e4d-d07b-4b73-88c3-64ef611839dc	45e0e6dc-df2c-40dd-ac7d-3289919bc610
20482e4d-d07b-4b73-88c3-64ef611839dc	423d829c-566a-46c6-9248-a21e4348e2f8
20482e4d-d07b-4b73-88c3-64ef611839dc	3efb50bf-dd75-49d2-97c9-9de9b23fd38b
20482e4d-d07b-4b73-88c3-64ef611839dc	7d776e15-6c66-46b5-ad08-e2288da510c7
20482e4d-d07b-4b73-88c3-64ef611839dc	1e4407d9-0a45-4d9a-8b01-fc4f2f787c7c
20482e4d-d07b-4b73-88c3-64ef611839dc	49fe1748-cd40-46b3-b691-ea6f3502dfeb
20482e4d-d07b-4b73-88c3-64ef611839dc	d33d56d4-2ca6-4c99-b7d6-217b2e30ae29
20482e4d-d07b-4b73-88c3-64ef611839dc	58bdac51-0132-49d7-ad78-45c91fa9d0e2
20482e4d-d07b-4b73-88c3-64ef611839dc	010ad824-bf2e-4b50-8641-77af549014de
20482e4d-d07b-4b73-88c3-64ef611839dc	e698a82e-ab6c-4872-a5fc-8b087b57c7db
20482e4d-d07b-4b73-88c3-64ef611839dc	fc496618-cef1-4f24-9ebd-285cde3fbd60
20482e4d-d07b-4b73-88c3-64ef611839dc	91f27059-2c52-40e9-be5f-6bd9d837d213
\.


--
-- Data for Name: tenant_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_roles (id, tenant_id, name, description, is_default, created_at, updated_at) FROM stdin;
6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	oseimensah-properties	ADMIN	Full administrative access	f	2026-08-22 23:24:21.214179+00	2026-08-22 23:24:21.214188+00
3d2daafa-4066-4592-9f18-cab7a3ca8470	oseimensah-properties	MANAGER	Property and financial management	f	2026-08-22 23:24:21.22189+00	2026-08-22 23:24:21.221895+00
20482e4d-d07b-4b73-88c3-64ef611839dc	oseimensah-properties	STAFF	Basic read access	t	2026-08-22 23:24:21.244131+00	2026-08-22 23:24:21.244137+00
\.


--
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_settings (id, tenant_id, category, settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_subscriptions (id, tenant_id, plan_id, status, grandfathered_unit_cap, billing_cycle_day, current_period_start, current_period_end, pending_plan_id, cancelled_at, created_at, updated_at, billing_mobile_number, billed_unit_count, billing_cycle, paystack_authorization_code) FROM stdin;
634363d2-48da-496d-a421-612464c5f28c	oseimensah-properties	900ea37a-5e1b-4a39-87bd-d725780ac798	ACTIVE	\N	22	2026-08-23	2026-09-23	41a47258-49b8-4ded-8707-7952071a291c	\N	2026-08-23 00:05:43.959288	2026-08-25 00:23:41.089519	0240472060	14	MONTHLY	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, tenant_id, name, description, active, created_at, contact_phone) FROM stdin;
1b33ae95-60c7-48fa-89a8-cbc995c628f5	oseimensah-properties	Osei-Mensah Properties	\N	t	2026-08-22 23:24:19.711822+00	\N
\.


--
-- Data for Name: transaction_fee_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_fee_ledger (id, tenant_id, source_type, source_id, gross_amount, fee_rate, fee_amount, currency, status, settled_at, created_at) FROM stdin;
\.


--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trusted_devices (id, global_user_id, device_id_hash, user_agent, created_at, last_seen_at, user_id, system_admin_id) FROM stdin;
c96937f7-9b58-4b72-81b1-2bd14bc899a9	\N	45ef49bdb1c5575f0770f290929f6385b6d4c6961c47acb92587a045eddaeb3d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36	2026-08-22 23:24:23.564681	2026-08-22 23:24:23.564702	3ac9b037-fad8-4741-aef3-be0a3659d470	\N
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, tenant_id, property_id, unit_no, floor, type, size_sqft, bedrooms, bathrooms, rent, deposit, currency, status, occupant_id, images, amenities, features, metadata, created_at, updated_at, search_vector, image_file_ids) FROM stdin;
f123e463-8aad-459f-972b-d0057073c856	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 3	\N	1br	\N	\N	\N	850.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:26:15.589168+00	\N	'1br':3A '3':2A 'avail':4B 'room':1A	\N
5031234b-d2bc-45f1-bd05-839ce907fac8	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 4	\N	studio	\N	\N	\N	600.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:28:50.404805+00	\N	'4':2A 'avail':4B 'room':1A 'studio':3A	\N
0f149c7b-9ce7-4fe6-8371-5df7a795df87	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 5	\N	studio	\N	\N	\N	600.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:30:44.73183+00	\N	'5':2A 'avail':4B 'room':1A 'studio':3A	\N
526ecafd-34ef-43c4-b9e6-95d9073f16fb	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 6	\N	studio	\N	\N	\N	600.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:42:25.571348+00	\N	'6':2A 'avail':4B 'room':1A 'studio':3A	\N
9fc99bfd-e0dc-4b41-aeb5-db2cca09c090	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 8	\N	studio	\N	\N	\N	600.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:47:02.053125+00	\N	'8':2A 'avail':4B 'room':1A 'studio':3A	\N
48050277-ad9d-4e61-84c5-9883787569c1	oseimensah-properties	f8d08e57-e6d9-456b-b638-d69254bbb91c	Main House	\N	2br	\N	\N	\N	800.0000	\N	USD	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 01:07:18.140195+00	\N	'2br':3A 'avail':4B 'hous':2A 'main':1A	\N
d74fe5ae-b2df-4936-8c9b-f103bb6d651a	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 1	\N	studio	\N	\N	\N	600.0000	\N	GHS	occupied	c285f73b-0a29-47d5-a720-57443ccbb4e3	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:05:43.961868+00	2026-08-23 01:20:16.080908+00	'1':2A 'occupi':4B 'room':1A 'studio':3A	\N
410bb23f-636a-45fe-a330-6440a5289fdf	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 2	\N	studio	\N	\N	\N	600.0000	\N	GHS	reserved	6aa60021-c4dc-4041-aecf-956f7d74dfa0	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:23:08.919825+00	2026-08-24 20:26:51.457061+00	'2':2A 'reserv':4B 'room':1A 'studio':3A	\N
0018bbf1-8a32-4069-9843-538f77cd3753	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 7	\N	1br	\N	\N	\N	850.0000	\N	GHS	occupied	dc36c884-aaff-4650-bcc3-463a5f8c02ca	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-23 00:44:22.663823+00	2026-08-24 23:45:50.572406+00	'1br':3A '7':2A 'occupi':4B 'room':1A	\N
a3b17af6-c0cd-486b-9ebc-7ed4e0be72c6	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 10	\N	chamber_and_hall	\N	\N	\N	850.0000	\N	GHS	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-25 19:55:41.102723+00	\N	'10':2A 'avail':6B 'chamber':3A 'hall':5A 'room':1A	\N
5c3936e1-651c-4fb7-9acf-9489cf9a3357	oseimensah-properties	f8d08e57-e6d9-456b-b638-d69254bbb91c	Annex Flat	\N	self_contained	\N	\N	\N	800.0000	\N	USD	available	\N	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-25 19:56:33.175154+00	\N	'annex':1A 'avail':5B 'contain':4A 'flat':2A 'self':3A	\N
f5b3f921-41e3-45f5-b782-fde7c44e5b32	oseimensah-properties	7aeade41-e994-414a-ae8f-de43fe4a91db	Room 9	\N	single_room	\N	\N	\N	600.0000	\N	GHS	occupied	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	\N	\N	\N	{"rentPeriod": "monthly"}	2026-08-25 19:54:58.077176+00	2026-08-25 20:11:29.325772+00	'9':2A 'occupi':5B 'room':1A,4A 'singl':3A	\N
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notifications (id, tenant_id, user_id, title, body, entity_type, entity_id, is_read, read_at, created_at) FROM stdin;
fed3884d-f851-4d08-90c0-fe16c976e8ca	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	New occupant added	Akosua Boateng was added to unit Room 1.	OCCUPANT	c285f73b-0a29-47d5-a720-57443ccbb4e3	f	\N	2026-08-23 01:16:50.018757+00
99cb67d4-c9fe-481e-91bd-a777b38e8f5a	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	Payment received	GHS 14,400.00 received for invoice INV-2026-001 from Akosua Boateng.	INVOICE	0c0e58cd-fb49-4b2b-a2f8-0695c9b25e6b	f	\N	2026-08-23 01:37:17.124309+00
e91392e7-3411-4ff0-b8ff-3ce25c49039a	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	Payment received	GHS 400.00 received for invoice INV-2026-002 from Akosua Boateng.	INVOICE	3b09643c-69f0-4371-9558-68d974a13854	f	\N	2026-08-23 02:11:52.140095+00
0458c046-282f-46db-933d-8fdaf8211bdf	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	New occupant added	Yaa Asantewaa was added to unit Room 2.	OCCUPANT	6aa60021-c4dc-4041-aecf-956f7d74dfa0	f	\N	2026-08-24 20:26:16.488814+00
852db0a4-38a7-4d6e-8841-8d9730d63de6	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	New occupant added	Adjoa Mensima was added to unit Room 7.	OCCUPANT	dc36c884-aaff-4650-bcc3-463a5f8c02ca	f	\N	2026-08-24 23:39:39.441941+00
d3876cab-4f97-4856-ae1e-d8f10c42dded	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	New occupant added	Mensah Owusu was added to unit Room 9.	OCCUPANT	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	f	\N	2026-08-25 20:08:39.164137+00
a342b68d-6075-4b65-9476-938988991cc3	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	Payment received	GHS 350.00 received for invoice INV-2026-003 from Akosua Boateng.	INVOICE	38dd4af4-7625-49a1-b915-432f76ea9b54	f	\N	2026-08-25 21:15:50.128554+00
\.


--
-- Data for Name: user_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_otps (id, global_user_id, otp_hash, purpose, channel, used, expires_at, created_at, device_id_hash, attempts, user_id, system_admin_id) FROM stdin;
6582a00c-0852-46bd-bd29-f07831e4b257	7718cb5a-97b3-4a7f-9b9e-6f412589fff0	$2a$10$jPD.HdHzRMA2Meie7feweOvltQbntIqxCfY57dmtJEnJMkA9t.qjW	FIRST_TIME_LOGIN	EMAIL	f	2026-08-23 01:26:45.407202+00	2026-08-23 01:16:45.408379+00	\N	0	\N	\N
dc8f3e0b-76b9-42ad-a3bc-b83acd0bb9a4	83339dd7-89e8-4553-aaa3-ee5b3f73f094	$2a$10$GnLqW2fkaV.itzWhaASdEuQsMWMaHr2H3LMmSWEpuWItOX2uWh.D.	FORGOT_PASSWORD	EMAIL	t	2026-08-26 15:17:47.66758+00	2026-08-26 15:07:47.669067+00	\N	0	\N	\N
20dc327b-a947-4cae-9467-cd98233a5a0d	83339dd7-89e8-4553-aaa3-ee5b3f73f094	$2a$10$.2miEhOP/kYHmDVQUjNG7OKETrxyQ6Y1VFlmi9jvii7mEfM9BUSIq	FORGOT_PASSWORD	EMAIL	f	2026-08-26 15:19:03.258829+00	2026-08-26 15:09:03.258836+00	\N	0	\N	\N
\.


--
-- Data for Name: user_tenant_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_tenant_links (id, global_user_id, tenant_id, tenant_user_id, user_type, role, active, linked_at) FROM stdin;
ee0b854e-208e-4339-95b5-b573829a8ca4	83339dd7-89e8-4553-aaa3-ee5b3f73f094	oseimensah-properties	3ac9b037-fad8-4741-aef3-be0a3659d470	LANDLORD	ADMIN	t	2026-08-22 23:24:20.765643+00
ad41b573-7128-4be3-abca-66906667ebcd	7718cb5a-97b3-4a7f-9b9e-6f412589fff0	oseimensah-properties	c285f73b-0a29-47d5-a720-57443ccbb4e3	OCCUPANT	OCCUPANT	t	2026-08-23 01:16:44.366206+00
560114d3-5215-4861-92c2-37a6790e4969	913beb77-dd1a-404b-9a2a-9e47a2a99cf8	oseimensah-properties	6aa60021-c4dc-4041-aecf-956f7d74dfa0	OCCUPANT	OCCUPANT	t	2026-08-24 20:26:16.402884+00
e772c7a3-a3e9-44f4-b68c-7e4b241e846e	9fec7be3-47f7-4678-aefe-725cf061e06f	oseimensah-properties	dc36c884-aaff-4650-bcc3-463a5f8c02ca	OCCUPANT	OCCUPANT	t	2026-08-24 23:39:39.316249+00
c2b916b2-ad35-454e-94ea-16f5738f075d	5af99e6c-77ee-4f8e-ac6f-4fedcc3b71e7	oseimensah-properties	a3e87dbf-f309-4095-8261-3f1f1f5b11aa	OCCUPANT	OCCUPANT	t	2026-08-25 20:08:38.980761+00
\.


--
-- Data for Name: user_tenant_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_tenant_roles (user_id, role_id, assigned_at) FROM stdin;
3ac9b037-fad8-4741-aef3-be0a3659d470	6f9c20f4-8bb5-4acf-b503-0e72f2d6020c	2026-08-22 23:24:17.8811+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, tenant_id, email, password_hash, role, created_at, full_name, active, company_name, user_type, phone_number, phone_verified_at) FROM stdin;
3ac9b037-fad8-4741-aef3-be0a3659d470	oseimensah-properties	abdulshakuraclement@yahoo.com	$2a$10$YZBayP56eXmItmKc0YNWEeaf22BD5JYsUmf26DLnMIcMy4ruvnGBS	ADMIN	2026-08-22 23:24:20.622985+00	Kwabena Osei-Mensah	t	Osei-Mensah Properties	LANDLORD	024 047 2060	\N
\.


--
-- Data for Name: utility_bill_splits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_bill_splits (id, bill_id, unit_id, occupant_id, share_amount, share_pct, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: utility_bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_bills (id, tenant_id, meter_id, billing_period_start, billing_period_end, previous_reading, current_reading, units_consumed, amount, status, paid_at, paid_by, split_method, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: utility_meter_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_meter_units (id, meter_id, unit_id, created_at) FROM stdin;
\.


--
-- Data for Name: utility_meters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_meters (id, tenant_id, property_id, meter_number, utility_type, meter_type, payment_responsibility, split_method, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: utility_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utility_tokens (id, tenant_id, meter_id, purchased_at, token_number, units_purchased, amount_paid, purchased_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: vacancy_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vacancy_listings (id, tenant_id, unit_id, title, description, contact_phone, contact_email, available_from, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vacate_notices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vacate_notices (id, tenant_id, unit_id, property_id, unit_no, property_name, occupant_id, occupant_name, status, notice_date, expected_move_out, actual_move_out, keys_returned, keys_returned_date, keys_returned_to, notice_reason, notes, inspection_id, confirmed_at, moved_out_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: violations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.violations (id, tenant_id, occupant_id, unit_id, property_id, category, severity, title, description, status, fine_amount, fine_status, reported_by_name, reported_at, warning_issued_at, resolved_at, escalated_at, resolution_notes, escalation_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, tenant_id, currency, status, balance, pending_balance, total_earned, total_withdrawn, linked_momo_number, linked_momo_network, version, created_at, updated_at, offline_balance) FROM stdin;
fd2f51ab-ee68-4eb0-b620-031ba36fad8f	oseimensah-properties	GHS	ACTIVE	42750.00	0.00	42750.00	0.00	\N	\N	5	2026-08-23 00:14:39.801575	2026-08-25 21:15:50.130422	42750.00
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, tenant_id, wallet_id, amount, currency, payout_method, momo_number, momo_network, bank_account, bank_code, bank_name, gateway_name, gateway_transaction_id, client_trans_id, status, failure_reason, ledger_entry_id, initiated_at, completed_at, reversed_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: admin_impersonation_log admin_impersonation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_impersonation_log
    ADD CONSTRAINT admin_impersonation_log_pkey PRIMARY KEY (id);


--
-- Name: admin_message_log admin_message_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_message_log
    ADD CONSTRAINT admin_message_log_pkey PRIMARY KEY (id);


--
-- Name: advance_rents advance_rents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advance_rents
    ADD CONSTRAINT advance_rents_pkey PRIMARY KEY (id);


--
-- Name: agent_commissions agent_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agreements agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_pkey PRIMARY KEY (id);


--
-- Name: caution_fee_deductions caution_fee_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caution_fee_deductions
    ADD CONSTRAINT caution_fee_deductions_pkey PRIMARY KEY (id);


--
-- Name: caution_fees caution_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caution_fees
    ADD CONSTRAINT caution_fees_pkey PRIMARY KEY (id);


--
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- Name: direct_job_requests direct_job_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_job_requests
    ADD CONSTRAINT direct_job_requests_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: expense_configs expense_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_configs
    ADD CONSTRAINT expense_configs_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: gateway_configs gateway_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gateway_configs
    ADD CONSTRAINT gateway_configs_pkey PRIMARY KEY (id);


--
-- Name: global_users global_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_users
    ADD CONSTRAINT global_users_pkey PRIMARY KEY (id);


--
-- Name: guarantors guarantors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantors
    ADD CONSTRAINT guarantors_pkey PRIMARY KEY (id);


--
-- Name: inspection_items inspection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: late_fee_logs late_fee_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_fee_logs
    ADD CONSTRAINT late_fee_logs_pkey PRIMARY KEY (id);


--
-- Name: learned_localities learned_localities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learned_localities
    ADD CONSTRAINT learned_localities_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_reference_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_reference_code_key UNIQUE (reference_code);


--
-- Name: maintainer_reviews maintainer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintainer_reviews
    ADD CONSTRAINT maintainer_reviews_pkey PRIMARY KEY (id);


--
-- Name: maintainers maintainers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintainers
    ADD CONSTRAINT maintainers_pkey PRIMARY KEY (id);


--
-- Name: maintenance_categories maintenance_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_categories
    ADD CONSTRAINT maintenance_categories_pkey PRIMARY KEY (id);


--
-- Name: maintenance_comments maintenance_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_comments
    ADD CONSTRAINT maintenance_comments_pkey PRIMARY KEY (id);


--
-- Name: maintenance_part_items maintenance_part_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_part_items
    ADD CONSTRAINT maintenance_part_items_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: notification_outbox notification_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_outbox
    ADD CONSTRAINT notification_outbox_pkey PRIMARY KEY (id);


--
-- Name: occupants occupants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.occupants
    ADD CONSTRAINT occupants_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: pending_signups pending_signups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_signups
    ADD CONSTRAINT pending_signups_pkey PRIMARY KEY (id);


--
-- Name: plan_feature_flags plan_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_feature_flags
    ADD CONSTRAINT plan_feature_flags_pkey PRIMARY KEY (id);


--
-- Name: plan_feature_flags plan_feature_flags_plan_id_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_feature_flags
    ADD CONSTRAINT plan_feature_flags_plan_id_feature_key_key UNIQUE (plan_id, feature_key);


--
-- Name: platform_announcements platform_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_announcements
    ADD CONSTRAINT platform_announcements_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (setting_key);


--
-- Name: preventative_maintenance_schedules preventative_maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preventative_maintenance_schedules
    ADD CONSTRAINT preventative_maintenance_schedules_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_inspections property_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_inspections
    ADD CONSTRAINT property_inspections_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: rent_reviews rent_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rent_reviews
    ADD CONSTRAINT rent_reviews_pkey PRIMARY KEY (id);


--
-- Name: sender_id_requests sender_id_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sender_id_requests
    ADD CONSTRAINT sender_id_requests_pkey PRIMARY KEY (id);


--
-- Name: sms_credit_accounts sms_credit_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_accounts
    ADD CONSTRAINT sms_credit_accounts_pkey PRIMARY KEY (id);


--
-- Name: sms_credit_accounts sms_credit_accounts_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_accounts
    ADD CONSTRAINT sms_credit_accounts_tenant_id_key UNIQUE (tenant_id);


--
-- Name: sms_credit_ledger_entries sms_credit_ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_ledger_entries
    ADD CONSTRAINT sms_credit_ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: sms_credit_ledger_entries sms_credit_ledger_entries_reference_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_ledger_entries
    ADD CONSTRAINT sms_credit_ledger_entries_reference_code_key UNIQUE (reference_code);


--
-- Name: sms_credit_topup_transactions sms_credit_topup_transactions_client_trans_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_topup_transactions
    ADD CONSTRAINT sms_credit_topup_transactions_client_trans_id_key UNIQUE (client_trans_id);


--
-- Name: sms_credit_topup_transactions sms_credit_topup_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_topup_transactions
    ADD CONSTRAINT sms_credit_topup_transactions_pkey PRIMARY KEY (id);


--
-- Name: sms_fee_tiers sms_fee_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_fee_tiers
    ADD CONSTRAINT sms_fee_tiers_pkey PRIMARY KEY (id);


--
-- Name: sms_reminder_log sms_reminder_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_reminder_log
    ADD CONSTRAINT sms_reminder_log_pkey PRIMARY KEY (id);


--
-- Name: subscription_invoices subscription_invoices_client_trans_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_client_trans_id_key UNIQUE (client_trans_id);


--
-- Name: subscription_invoices subscription_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id);


--
-- Name: subscription_plan_changes subscription_plan_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plan_changes
    ADD CONSTRAINT subscription_plan_changes_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_admin_roles system_admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_admin_roles
    ADD CONSTRAINT system_admin_roles_pkey PRIMARY KEY (admin_id, role_id);


--
-- Name: system_admins system_admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_admins
    ADD CONSTRAINT system_admins_email_key UNIQUE (email);


--
-- Name: system_admins system_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_admins
    ADD CONSTRAINT system_admins_pkey PRIMARY KEY (id);


--
-- Name: system_permissions system_permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_permissions
    ADD CONSTRAINT system_permissions_name_key UNIQUE (code);


--
-- Name: system_permissions system_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_permissions
    ADD CONSTRAINT system_permissions_pkey PRIMARY KEY (id);


--
-- Name: system_role_permissions system_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_role_permissions
    ADD CONSTRAINT system_role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: system_roles system_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_name_key UNIQUE (name);


--
-- Name: system_roles system_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_pkey PRIMARY KEY (id);


--
-- Name: tenant_api_keys tenant_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_api_keys
    ADD CONSTRAINT tenant_api_keys_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_flag_overrides tenant_feature_flag_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feature_flag_overrides
    ADD CONSTRAINT tenant_feature_flag_overrides_pkey PRIMARY KEY (id);


--
-- Name: tenant_feedback tenant_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feedback
    ADD CONSTRAINT tenant_feedback_pkey PRIMARY KEY (id);


--
-- Name: tenant_login_history tenant_login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_login_history
    ADD CONSTRAINT tenant_login_history_pkey PRIMARY KEY (id);


--
-- Name: tenant_notes tenant_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_notes
    ADD CONSTRAINT tenant_notes_pkey PRIMARY KEY (id);


--
-- Name: tenant_permissions tenant_permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_permissions
    ADD CONSTRAINT tenant_permissions_code_key UNIQUE (code);


--
-- Name: tenant_permissions tenant_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_permissions
    ADD CONSTRAINT tenant_permissions_pkey PRIMARY KEY (id);


--
-- Name: tenant_role_permissions tenant_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_role_permissions
    ADD CONSTRAINT tenant_role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: tenant_roles tenant_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_roles
    ADD CONSTRAINT tenant_roles_pkey PRIMARY KEY (id);


--
-- Name: tenant_roles tenant_roles_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_roles
    ADD CONSTRAINT tenant_roles_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscriptions tenant_subscriptions_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: transaction_fee_ledger transaction_fee_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee_ledger
    ADD CONSTRAINT transaction_fee_ledger_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: properties uk_property_tenant_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT uk_property_tenant_name UNIQUE (tenant_id, name);


--
-- Name: units uk_unit_property_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT uk_unit_property_no UNIQUE (property_id, unit_no);


--
-- Name: users uk_users_email_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_email_tenant UNIQUE (email, tenant_id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: agreements uq_agreement_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT uq_agreement_number UNIQUE (tenant_id, agreement_number);


--
-- Name: tenant_api_keys uq_api_key_hash; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_api_keys
    ADD CONSTRAINT uq_api_key_hash UNIQUE (key_hash);


--
-- Name: direct_job_requests uq_direct_job_token; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_job_requests
    ADD CONSTRAINT uq_direct_job_token UNIQUE (response_token_hash);


--
-- Name: gateway_configs uq_gateway_config_tenant_name_purpose; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gateway_configs
    ADD CONSTRAINT uq_gateway_config_tenant_name_purpose UNIQUE (tenant_id, gateway_name, purpose);


--
-- Name: invoices uq_invoice_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT uq_invoice_number UNIQUE (tenant_id, invoice_number);


--
-- Name: learned_localities uq_learned_locality_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learned_localities
    ADD CONSTRAINT uq_learned_locality_per_tenant UNIQUE (tenant_id, name_key, region, district);


--
-- Name: utility_meters uq_meter_number_per_property; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meters
    ADD CONSTRAINT uq_meter_number_per_property UNIQUE (tenant_id, property_id, meter_number);


--
-- Name: utility_meter_units uq_meter_unit; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meter_units
    ADD CONSTRAINT uq_meter_unit UNIQUE (meter_id, unit_id);


--
-- Name: sms_reminder_log uq_sms_reminder_entity_window_channel; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_reminder_log
    ADD CONSTRAINT uq_sms_reminder_entity_window_channel UNIQUE (entity_id, days_before, channel);


--
-- Name: tenant_feature_flag_overrides uq_tenant_feature_override; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feature_flag_overrides
    ADD CONSTRAINT uq_tenant_feature_override UNIQUE (tenant_id, feature_key);


--
-- Name: tenant_settings uq_tenant_settings_category; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT uq_tenant_settings_category UNIQUE (tenant_id, category);


--
-- Name: user_tenant_links uq_user_tenant_link; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_links
    ADD CONSTRAINT uq_user_tenant_link UNIQUE (global_user_id, tenant_id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_otps user_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_otps
    ADD CONSTRAINT user_otps_pkey PRIMARY KEY (id);


--
-- Name: user_tenant_links user_tenant_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_links
    ADD CONSTRAINT user_tenant_links_pkey PRIMARY KEY (id);


--
-- Name: user_tenant_roles user_tenant_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_roles
    ADD CONSTRAINT user_tenant_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tenant_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);


--
-- Name: utility_bill_splits utility_bill_splits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_bill_splits
    ADD CONSTRAINT utility_bill_splits_pkey PRIMARY KEY (id);


--
-- Name: utility_bills utility_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_bills
    ADD CONSTRAINT utility_bills_pkey PRIMARY KEY (id);


--
-- Name: utility_meter_units utility_meter_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meter_units
    ADD CONSTRAINT utility_meter_units_pkey PRIMARY KEY (id);


--
-- Name: utility_meters utility_meters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_meters
    ADD CONSTRAINT utility_meters_pkey PRIMARY KEY (id);


--
-- Name: utility_tokens utility_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_tokens
    ADD CONSTRAINT utility_tokens_pkey PRIMARY KEY (id);


--
-- Name: vacancy_listings vacancy_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacancy_listings
    ADD CONSTRAINT vacancy_listings_pkey PRIMARY KEY (id);


--
-- Name: vacate_notices vacate_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacate_notices
    ADD CONSTRAINT vacate_notices_pkey PRIMARY KEY (id);


--
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_tenant_id_key UNIQUE (tenant_id);


--
-- Name: withdrawals withdrawals_client_trans_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_client_trans_id_key UNIQUE (client_trans_id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_advance_rents_occupant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advance_rents_occupant_id ON public.advance_rents USING btree (tenant_id, occupant_id);


--
-- Name: idx_advance_rents_period_end; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advance_rents_period_end ON public.advance_rents USING btree (period_end);


--
-- Name: idx_advance_rents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advance_rents_status ON public.advance_rents USING btree (tenant_id, status);


--
-- Name: idx_advance_rents_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advance_rents_tenant_id ON public.advance_rents USING btree (tenant_id);


--
-- Name: idx_agent_commissions_agent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_commissions_agent ON public.agent_commissions USING btree (tenant_id, agent_id);


--
-- Name: idx_agent_commissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_commissions_status ON public.agent_commissions USING btree (tenant_id, status);


--
-- Name: idx_agent_commissions_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_commissions_tenant ON public.agent_commissions USING btree (tenant_id);


--
-- Name: idx_agents_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_tenant_id ON public.agents USING btree (tenant_id);


--
-- Name: idx_agents_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_tenant_status ON public.agents USING btree (tenant_id, status);


--
-- Name: idx_agreements_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_occupant ON public.agreements USING btree (tenant_id, occupant_id);


--
-- Name: idx_agreements_occupant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_occupant_id ON public.agreements USING btree (occupant_id);


--
-- Name: idx_agreements_previous_agreement_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_previous_agreement_id ON public.agreements USING btree (previous_agreement_id);


--
-- Name: idx_agreements_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_property ON public.agreements USING btree (tenant_id, property_id);


--
-- Name: idx_agreements_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_property_id ON public.agreements USING btree (property_id);


--
-- Name: idx_agreements_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_tenant ON public.agreements USING btree (tenant_id);


--
-- Name: idx_agreements_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_tenant_created ON public.agreements USING btree (tenant_id, created_at DESC);


--
-- Name: idx_agreements_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_tenant_status ON public.agreements USING btree (tenant_id, status);


--
-- Name: idx_agreements_tenant_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_tenant_status_created ON public.agreements USING btree (tenant_id, status, created_at DESC);


--
-- Name: idx_agreements_tenant_type_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_tenant_type_created ON public.agreements USING btree (tenant_id, type, created_at DESC);


--
-- Name: idx_agreements_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agreements_unit_id ON public.agreements USING btree (unit_id);


--
-- Name: idx_api_keys_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_keys_tenant ON public.tenant_api_keys USING btree (tenant_id, is_active);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_action ON public.admin_audit_log USING btree (action, created_at DESC);


--
-- Name: idx_audit_admin_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_admin_email ON public.admin_audit_log USING btree (admin_email, created_at DESC);


--
-- Name: idx_audit_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_created_at ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entity ON public.admin_audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_caution_fee_deductions_fee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caution_fee_deductions_fee_id ON public.caution_fee_deductions USING btree (caution_fee_id);


--
-- Name: idx_caution_fee_deductions_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caution_fee_deductions_tenant_id ON public.caution_fee_deductions USING btree (tenant_id);


--
-- Name: idx_caution_fees_occupant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caution_fees_occupant_id ON public.caution_fees USING btree (occupant_id);


--
-- Name: idx_caution_fees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caution_fees_status ON public.caution_fees USING btree (status);


--
-- Name: idx_caution_fees_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caution_fees_tenant_id ON public.caution_fees USING btree (tenant_id);


--
-- Name: idx_communications_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communications_tenant_created ON public.communications USING btree (tenant_id, created_at DESC);


--
-- Name: idx_communications_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communications_tenant_id ON public.communications USING btree (tenant_id);


--
-- Name: idx_direct_job_maintainer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_job_maintainer ON public.direct_job_requests USING btree (maintainer_id, created_at DESC);


--
-- Name: idx_direct_job_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_job_occupant ON public.direct_job_requests USING btree (occupant_id, created_at DESC);


--
-- Name: idx_documents_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_created_at ON public.documents USING btree (tenant_id, created_at DESC);


--
-- Name: idx_documents_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_tenant_id ON public.documents USING btree (tenant_id);


--
-- Name: idx_documents_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_tenant_status ON public.documents USING btree (tenant_id, status);


--
-- Name: idx_documents_tenant_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_tenant_type ON public.documents USING btree (tenant_id, document_type);


--
-- Name: idx_expense_configs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_configs_tenant ON public.expense_configs USING btree (tenant_id);


--
-- Name: idx_expense_configs_tenant_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_expense_configs_tenant_item ON public.expense_configs USING btree (tenant_id, lower((item)::text));


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (tenant_id, date DESC);


--
-- Name: idx_expenses_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_property ON public.expenses USING btree (tenant_id, property_id);


--
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (tenant_id, status);


--
-- Name: idx_expenses_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_tenant ON public.expenses USING btree (tenant_id);


--
-- Name: idx_gateway_configs_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gateway_configs_tenant_id ON public.gateway_configs USING btree (tenant_id);


--
-- Name: idx_global_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_global_users_email ON public.global_users USING btree (email);


--
-- Name: idx_global_users_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_global_users_phone_number ON public.global_users USING btree (phone_number) WHERE (phone_number IS NOT NULL);


--
-- Name: idx_guarantors_occupant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guarantors_occupant_id ON public.guarantors USING btree (occupant_id);


--
-- Name: idx_guarantors_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guarantors_tenant_id ON public.guarantors USING btree (tenant_id);


--
-- Name: idx_guarantors_tenant_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guarantors_tenant_occupant ON public.guarantors USING btree (tenant_id, occupant_id);


--
-- Name: idx_imp_log_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_imp_log_admin ON public.admin_impersonation_log USING btree (admin_id);


--
-- Name: idx_imp_log_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_imp_log_tenant ON public.admin_impersonation_log USING btree (target_tenant_id);


--
-- Name: idx_imp_log_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_imp_log_timestamp ON public.admin_impersonation_log USING btree (impersonated_at DESC);


--
-- Name: idx_inspection_items_inspection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspection_items_inspection_id ON public.inspection_items USING btree (inspection_id);


--
-- Name: idx_inspections_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_tenant_id ON public.property_inspections USING btree (tenant_id);


--
-- Name: idx_inspections_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_unit_id ON public.property_inspections USING btree (unit_id);


--
-- Name: idx_invoices_advance_rent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_advance_rent_id ON public.invoices USING btree (advance_rent_id);


--
-- Name: idx_invoices_agreement_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_agreement_id ON public.invoices USING btree (agreement_id);


--
-- Name: idx_invoices_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (tenant_id, due_date);


--
-- Name: idx_invoices_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_occupant ON public.invoices USING btree (tenant_id, occupant_id);


--
-- Name: idx_invoices_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant ON public.invoices USING btree (tenant_id);


--
-- Name: idx_invoices_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant_created ON public.invoices USING btree (tenant_id, created_at DESC);


--
-- Name: idx_invoices_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant_status ON public.invoices USING btree (tenant_id, status);


--
-- Name: idx_invoices_tenant_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant_status_created ON public.invoices USING btree (tenant_id, status, created_at DESC);


--
-- Name: idx_late_fee_logs_tenant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_late_fee_logs_tenant_date ON public.late_fee_logs USING btree (tenant_id, fee_date);


--
-- Name: idx_late_fee_logs_tenant_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_late_fee_logs_tenant_invoice ON public.late_fee_logs USING btree (tenant_id, invoice_id);


--
-- Name: idx_learned_localities_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learned_localities_lookup ON public.learned_localities USING btree (region, district, name_key);


--
-- Name: idx_learned_localities_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learned_localities_tenant ON public.learned_localities USING btree (tenant_id);


--
-- Name: idx_ledger_entries_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_entries_tenant_created ON public.ledger_entries USING btree (tenant_id, created_at DESC);


--
-- Name: idx_ledger_entries_wallet_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_entries_wallet_settlement ON public.ledger_entries USING btree (wallet_id, settlement);


--
-- Name: idx_ledger_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_occupant ON public.ledger_entries USING btree (tenant_id, occupant_id);


--
-- Name: idx_ledger_payment_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_payment_tx ON public.ledger_entries USING btree (payment_transaction_id);


--
-- Name: idx_ledger_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_property ON public.ledger_entries USING btree (tenant_id, property_id);


--
-- Name: idx_ledger_reference_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_reference_code ON public.ledger_entries USING btree (reference_code);


--
-- Name: idx_ledger_tenant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tenant_date ON public.ledger_entries USING btree (tenant_id, effective_date DESC);


--
-- Name: idx_ledger_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tenant_id ON public.ledger_entries USING btree (tenant_id);


--
-- Name: idx_ledger_wallet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_wallet_id ON public.ledger_entries USING btree (wallet_id);


--
-- Name: idx_ledger_withdrawal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_withdrawal ON public.ledger_entries USING btree (withdrawal_id);


--
-- Name: idx_login_history_success_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_history_success_created ON public.tenant_login_history USING btree (created_at) WHERE (success = true);


--
-- Name: idx_login_history_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_history_tenant_created ON public.tenant_login_history USING btree (tenant_id, created_at DESC);


--
-- Name: idx_login_history_tenant_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_history_tenant_user ON public.tenant_login_history USING btree (tenant_id, user_id);


--
-- Name: idx_login_history_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_history_user_created ON public.tenant_login_history USING btree (user_id, created_at DESC);


--
-- Name: idx_maint_cat_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_maint_cat_name ON public.maintenance_categories USING btree (tenant_id, name);


--
-- Name: idx_maint_cat_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_cat_tenant ON public.maintenance_categories USING btree (tenant_id);


--
-- Name: idx_maint_comment_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_comment_request ON public.maintenance_comments USING btree (maintenance_request_id, created_at);


--
-- Name: idx_maint_comment_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_comment_tenant ON public.maintenance_comments USING btree (tenant_id);


--
-- Name: idx_maint_part_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_part_request ON public.maintenance_part_items USING btree (maintenance_request_id);


--
-- Name: idx_maint_part_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_part_tenant ON public.maintenance_part_items USING btree (tenant_id);


--
-- Name: idx_maint_req_maintainer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_maintainer ON public.maintenance_requests USING btree (tenant_id, maintainer_id);


--
-- Name: idx_maint_req_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_maint_req_number ON public.maintenance_requests USING btree (tenant_id, request_number);


--
-- Name: idx_maint_req_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_property ON public.maintenance_requests USING btree (tenant_id, property_id);


--
-- Name: idx_maint_req_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_tenant ON public.maintenance_requests USING btree (tenant_id);


--
-- Name: idx_maint_req_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_tenant_created ON public.maintenance_requests USING btree (tenant_id, created_at DESC);


--
-- Name: idx_maint_req_tenant_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_tenant_priority ON public.maintenance_requests USING btree (tenant_id, priority);


--
-- Name: idx_maint_req_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maint_req_tenant_status ON public.maintenance_requests USING btree (tenant_id, status);


--
-- Name: idx_maintainer_reviews_maintainer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintainer_reviews_maintainer ON public.maintainer_reviews USING btree (maintainer_id, created_at DESC);


--
-- Name: idx_maintainer_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintainer_tenant ON public.maintainers USING btree (tenant_id);


--
-- Name: idx_maintainer_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintainer_tenant_created ON public.maintainers USING btree (tenant_id, created_at DESC);


--
-- Name: idx_maintainer_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintainer_tenant_status ON public.maintainers USING btree (tenant_id, status);


--
-- Name: idx_maintainers_marketplace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintainers_marketplace ON public.maintainers USING btree (listed_in_marketplace, region, city) WHERE (listed_in_marketplace = true);


--
-- Name: idx_maintenance_tenant_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_tenant_category ON public.maintenance_requests USING btree (tenant_id, category_id);


--
-- Name: idx_maintenance_tenant_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_tenant_status_created ON public.maintenance_requests USING btree (tenant_id, status, created_at DESC);


--
-- Name: idx_msg_log_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_msg_log_sent_at ON public.admin_message_log USING btree (sent_at DESC);


--
-- Name: idx_notices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notices_status ON public.notices USING btree (status);


--
-- Name: idx_notices_tenant_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notices_tenant_occupant ON public.notices USING btree (tenant_id, occupant_id, issued_at DESC);


--
-- Name: idx_notification_outbox_status_retry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_outbox_status_retry ON public.notification_outbox USING btree (status, next_retry_at);


--
-- Name: idx_occupants_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_property ON public.occupants USING btree (property_id);


--
-- Name: idx_occupants_search_vector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_search_vector ON public.occupants USING gin (search_vector);


--
-- Name: idx_occupants_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_tenant ON public.occupants USING btree (tenant_id);


--
-- Name: idx_occupants_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_tenant_created ON public.occupants USING btree (tenant_id, created_at DESC);


--
-- Name: idx_occupants_tenant_id_keyset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_tenant_id_keyset ON public.occupants USING btree (tenant_id, id);


--
-- Name: idx_occupants_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_tenant_status ON public.occupants USING btree (tenant_id, status);


--
-- Name: idx_occupants_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_occupants_unit ON public.occupants USING btree (unit_id);


--
-- Name: idx_pa_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_active ON public.platform_announcements USING btree (active);


--
-- Name: idx_pa_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pa_created_at ON public.platform_announcements USING btree (created_at DESC);


--
-- Name: idx_payment_transactions_advance_rent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_transactions_advance_rent ON public.payment_transactions USING btree (advance_rent_id) WHERE (advance_rent_id IS NOT NULL);


--
-- Name: idx_payment_transactions_needs_reconciliation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_transactions_needs_reconciliation ON public.payment_transactions USING btree (tenant_id, created_at DESC) WHERE needs_reconciliation;


--
-- Name: idx_payment_tx_client_trans; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_client_trans ON public.payment_transactions USING btree (client_trans_id);


--
-- Name: idx_payment_tx_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_invoice_id ON public.payment_transactions USING btree (invoice_id);


--
-- Name: idx_payment_tx_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_status ON public.payment_transactions USING btree (tenant_id, status);


--
-- Name: idx_payment_tx_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_tenant_created ON public.payment_transactions USING btree (tenant_id, created_at DESC);


--
-- Name: idx_payment_tx_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_tenant_id ON public.payment_transactions USING btree (tenant_id);


--
-- Name: idx_payment_tx_tenant_occupant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tx_tenant_occupant_created ON public.payment_transactions USING btree (tenant_id, occupant_id, created_at DESC);


--
-- Name: idx_pending_signups_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pending_signups_expires_at ON public.pending_signups USING btree (expires_at);


--
-- Name: idx_prev_sched_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prev_sched_due ON public.preventative_maintenance_schedules USING btree (tenant_id, next_due_date) WHERE (is_active = true);


--
-- Name: idx_prev_sched_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prev_sched_tenant ON public.preventative_maintenance_schedules USING btree (tenant_id);


--
-- Name: idx_prev_schedules_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prev_schedules_due ON public.preventative_maintenance_schedules USING btree (next_due_date) WHERE (is_active = true);


--
-- Name: idx_prev_schedules_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prev_schedules_property ON public.preventative_maintenance_schedules USING btree (tenant_id, property_id);


--
-- Name: idx_prev_schedules_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prev_schedules_tenant ON public.preventative_maintenance_schedules USING btree (tenant_id);


--
-- Name: idx_properties_search_vector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_search_vector ON public.properties USING gin (search_vector);


--
-- Name: idx_properties_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_tenant ON public.properties USING btree (tenant_id);


--
-- Name: idx_properties_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_tenant_created ON public.properties USING btree (tenant_id, created_at DESC);


--
-- Name: idx_refresh_tokens_absolute_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_absolute_expiry ON public.refresh_tokens USING btree (absolute_expires_at);


--
-- Name: idx_refresh_tokens_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_active ON public.refresh_tokens USING btree (user_id, tenant_id) WHERE (revoked = false);


--
-- Name: idx_refresh_tokens_family; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_family ON public.refresh_tokens USING btree (family_id);


--
-- Name: idx_refresh_tokens_global_user_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_global_user_tenant ON public.refresh_tokens USING btree (global_user_id, tenant_id);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_tenant ON public.refresh_tokens USING btree (tenant_id);


--
-- Name: idx_refresh_tokens_user_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user_tenant ON public.refresh_tokens USING btree (user_id, tenant_id);


--
-- Name: idx_rent_reviews_effective_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rent_reviews_effective_date ON public.rent_reviews USING btree (effective_date);


--
-- Name: idx_rent_reviews_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rent_reviews_status ON public.rent_reviews USING btree (status);


--
-- Name: idx_rent_reviews_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rent_reviews_tenant_id ON public.rent_reviews USING btree (tenant_id);


--
-- Name: idx_rent_reviews_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rent_reviews_unit_id ON public.rent_reviews USING btree (unit_id);


--
-- Name: idx_sender_id_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sender_id_requests_status ON public.sender_id_requests USING btree (status);


--
-- Name: idx_sender_id_requests_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sender_id_requests_tenant ON public.sender_id_requests USING btree (tenant_id);


--
-- Name: idx_sms_credit_ledger_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sms_credit_ledger_account ON public.sms_credit_ledger_entries USING btree (sms_credit_account_id);


--
-- Name: idx_sms_reminder_log_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sms_reminder_log_entity ON public.sms_reminder_log USING btree (entity_type, entity_id);


--
-- Name: idx_sms_reminder_log_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sms_reminder_log_sent_at ON public.sms_reminder_log USING btree (sent_at DESC);


--
-- Name: idx_sms_reminder_log_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sms_reminder_log_tenant ON public.sms_reminder_log USING btree (tenant_id);


--
-- Name: idx_spc_changed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spc_changed_at ON public.subscription_plan_changes USING btree (changed_at DESC);


--
-- Name: idx_spc_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spc_tenant_id ON public.subscription_plan_changes USING btree (tenant_id);


--
-- Name: idx_st_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_st_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_st_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_st_priority ON public.support_tickets USING btree (priority);


--
-- Name: idx_st_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_st_status ON public.support_tickets USING btree (status);


--
-- Name: idx_st_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_st_tenant_id ON public.support_tickets USING btree (tenant_id);


--
-- Name: idx_sub_invoices_client_trans; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_invoices_client_trans ON public.subscription_invoices USING btree (client_trans_id);


--
-- Name: idx_sub_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_invoices_status ON public.subscription_invoices USING btree (status);


--
-- Name: idx_sub_invoices_tenant_sub; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sub_invoices_tenant_sub ON public.subscription_invoices USING btree (tenant_subscription_id);


--
-- Name: idx_system_admin_roles_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_admin_roles_admin ON public.system_admin_roles USING btree (admin_id);


--
-- Name: idx_system_admin_roles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_admin_roles_role ON public.system_admin_roles USING btree (role_id);


--
-- Name: idx_system_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_admins_email ON public.system_admins USING btree (email);


--
-- Name: idx_system_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_role_permissions_permission ON public.system_role_permissions USING btree (permission_id);


--
-- Name: idx_system_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_role_permissions_role ON public.system_role_permissions USING btree (role_id);


--
-- Name: idx_tenant_notes_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_notes_created_at ON public.tenant_notes USING btree (created_at DESC);


--
-- Name: idx_tenant_notes_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_notes_tenant_id ON public.tenant_notes USING btree (tenant_id);


--
-- Name: idx_tenant_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_role_permissions_permission ON public.tenant_role_permissions USING btree (permission_id);


--
-- Name: idx_tenant_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_role_permissions_role ON public.tenant_role_permissions USING btree (role_id);


--
-- Name: idx_tenant_roles_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_roles_tenant ON public.tenant_roles USING btree (tenant_id);


--
-- Name: idx_tenant_settings_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_settings_tenant_id ON public.tenant_settings USING btree (tenant_id);


--
-- Name: idx_tenants_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_active ON public.tenants USING btree (active);


--
-- Name: idx_tenants_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_name ON public.tenants USING btree (name);


--
-- Name: idx_tenants_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_tenant_id ON public.tenants USING btree (tenant_id);


--
-- Name: idx_tf_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tf_created_at ON public.tenant_feedback USING btree (created_at DESC);


--
-- Name: idx_tf_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tf_rating ON public.tenant_feedback USING btree (rating);


--
-- Name: idx_tf_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tf_tenant_id ON public.tenant_feedback USING btree (tenant_id);


--
-- Name: idx_tff_overrides_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tff_overrides_tenant_id ON public.tenant_feature_flag_overrides USING btree (tenant_id);


--
-- Name: idx_tfl_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tfl_created_at ON public.transaction_fee_ledger USING btree (created_at DESC);


--
-- Name: idx_tfl_source_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tfl_source_id ON public.transaction_fee_ledger USING btree (source_id);


--
-- Name: idx_tfl_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tfl_status ON public.transaction_fee_ledger USING btree (status);


--
-- Name: idx_tfl_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tfl_tenant_id ON public.transaction_fee_ledger USING btree (tenant_id);


--
-- Name: idx_trusted_devices_global_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trusted_devices_global_user ON public.trusted_devices USING btree (global_user_id);


--
-- Name: idx_trusted_devices_last_seen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trusted_devices_last_seen ON public.trusted_devices USING btree (global_user_id, last_seen_at);


--
-- Name: idx_units_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_occupant ON public.units USING btree (occupant_id);


--
-- Name: idx_units_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_property ON public.units USING btree (property_id);


--
-- Name: idx_units_search_vector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_search_vector ON public.units USING gin (search_vector);


--
-- Name: idx_units_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_tenant_created ON public.units USING btree (tenant_id, created_at DESC);


--
-- Name: idx_units_tenant_id_keyset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_tenant_id_keyset ON public.units USING btree (tenant_id, id);


--
-- Name: idx_units_tenant_property_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_tenant_property_status ON public.units USING btree (tenant_id, property_id, status);


--
-- Name: idx_units_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_tenant_status ON public.units USING btree (tenant_id, status);


--
-- Name: idx_user_notifications_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_unread ON public.user_notifications USING btree (tenant_id, user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_user_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user ON public.user_notifications USING btree (tenant_id, user_id, created_at DESC);


--
-- Name: idx_user_otps_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_otps_admin ON public.user_otps USING btree (system_admin_id) WHERE (system_admin_id IS NOT NULL);


--
-- Name: idx_user_otps_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_otps_expires_at ON public.user_otps USING btree (expires_at);


--
-- Name: idx_user_otps_global_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_otps_global_user ON public.user_otps USING btree (global_user_id);


--
-- Name: idx_user_otps_purpose; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_otps_purpose ON public.user_otps USING btree (purpose);


--
-- Name: idx_user_otps_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_otps_user ON public.user_otps USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_user_tenant_links_global_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tenant_links_global_user ON public.user_tenant_links USING btree (global_user_id);


--
-- Name: idx_user_tenant_links_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tenant_links_tenant ON public.user_tenant_links USING btree (tenant_id);


--
-- Name: idx_user_tenant_links_tenant_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tenant_links_tenant_user ON public.user_tenant_links USING btree (tenant_user_id);


--
-- Name: idx_user_tenant_roles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tenant_roles_role ON public.user_tenant_roles USING btree (role_id);


--
-- Name: idx_user_tenant_roles_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tenant_roles_user ON public.user_tenant_roles USING btree (user_id);


--
-- Name: idx_users_company_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_company_name ON public.users USING btree (company_name);


--
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_utility_bill_splits_bill; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bill_splits_bill ON public.utility_bill_splits USING btree (bill_id);


--
-- Name: idx_utility_bill_splits_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bill_splits_tenant ON public.utility_bill_splits USING btree (tenant_id);


--
-- Name: idx_utility_bill_splits_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bill_splits_unit ON public.utility_bill_splits USING btree (unit_id);


--
-- Name: idx_utility_bills_meter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bills_meter ON public.utility_bills USING btree (meter_id);


--
-- Name: idx_utility_bills_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bills_period ON public.utility_bills USING btree (billing_period_start, billing_period_end);


--
-- Name: idx_utility_bills_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bills_status ON public.utility_bills USING btree (tenant_id, status);


--
-- Name: idx_utility_bills_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_bills_tenant ON public.utility_bills USING btree (tenant_id);


--
-- Name: idx_utility_meter_units_meter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_meter_units_meter ON public.utility_meter_units USING btree (meter_id);


--
-- Name: idx_utility_meter_units_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_meter_units_unit ON public.utility_meter_units USING btree (unit_id);


--
-- Name: idx_utility_meters_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_meters_property ON public.utility_meters USING btree (tenant_id, property_id);


--
-- Name: idx_utility_meters_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_meters_tenant ON public.utility_meters USING btree (tenant_id);


--
-- Name: idx_utility_meters_utility_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_meters_utility_type ON public.utility_meters USING btree (tenant_id, utility_type);


--
-- Name: idx_utility_tokens_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_tokens_date ON public.utility_tokens USING btree (purchased_at DESC);


--
-- Name: idx_utility_tokens_meter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_tokens_meter ON public.utility_tokens USING btree (meter_id);


--
-- Name: idx_utility_tokens_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_tokens_tenant ON public.utility_tokens USING btree (tenant_id);


--
-- Name: idx_vacancy_listings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacancy_listings_status ON public.vacancy_listings USING btree (tenant_id, status);


--
-- Name: idx_vacancy_listings_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacancy_listings_tenant ON public.vacancy_listings USING btree (tenant_id);


--
-- Name: idx_vacancy_listings_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacancy_listings_unit ON public.vacancy_listings USING btree (unit_id);


--
-- Name: idx_vacate_notices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacate_notices_status ON public.vacate_notices USING btree (status);


--
-- Name: idx_vacate_notices_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacate_notices_tenant_id ON public.vacate_notices USING btree (tenant_id);


--
-- Name: idx_vacate_notices_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vacate_notices_unit_id ON public.vacate_notices USING btree (unit_id);


--
-- Name: idx_violations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_violations_status ON public.violations USING btree (status);


--
-- Name: idx_violations_tenant_occupant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_violations_tenant_occupant ON public.violations USING btree (tenant_id, occupant_id, reported_at DESC);


--
-- Name: idx_wallets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_tenant_id ON public.wallets USING btree (tenant_id);


--
-- Name: idx_withdrawals_client_trans; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_client_trans ON public.withdrawals USING btree (client_trans_id);


--
-- Name: idx_withdrawals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_status ON public.withdrawals USING btree (tenant_id, status);


--
-- Name: idx_withdrawals_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_tenant_id ON public.withdrawals USING btree (tenant_id);


--
-- Name: idx_withdrawals_wallet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawals_wallet_id ON public.withdrawals USING btree (wallet_id);


--
-- Name: uk_occupants_email_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_occupants_email_tenant ON public.occupants USING btree (email, tenant_id) WHERE (email IS NOT NULL);


--
-- Name: uk_trusted_devices_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_trusted_devices_admin ON public.trusted_devices USING btree (system_admin_id, device_id_hash) WHERE (system_admin_id IS NOT NULL);


--
-- Name: uk_trusted_devices_global; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_trusted_devices_global ON public.trusted_devices USING btree (global_user_id, device_id_hash) WHERE (global_user_id IS NOT NULL);


--
-- Name: uk_trusted_devices_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_trusted_devices_user ON public.trusted_devices USING btree (user_id, device_id_hash) WHERE (user_id IS NOT NULL);


--
-- Name: uq_expenses_maintenance_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_expenses_maintenance_request ON public.expenses USING btree (maintenance_request_id) WHERE (maintenance_request_id IS NOT NULL);


--
-- Name: uq_global_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_global_users_email ON public.global_users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: uq_review_per_direct_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_review_per_direct_job ON public.maintainer_reviews USING btree (direct_job_request_id, occupant_id) WHERE (direct_job_request_id IS NOT NULL);


--
-- Name: uq_review_per_maintenance_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_review_per_maintenance_request ON public.maintainer_reviews USING btree (maintenance_request_id, occupant_id) WHERE (maintenance_request_id IS NOT NULL);


--
-- Name: occupants occupants_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER occupants_search_vector_trigger BEFORE INSERT OR UPDATE ON public.occupants FOR EACH ROW EXECUTE FUNCTION public.occupants_search_vector_update();


--
-- Name: properties properties_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER properties_search_vector_trigger BEFORE INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.properties_search_vector_update();


--
-- Name: units units_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER units_search_vector_trigger BEFORE INSERT OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.units_search_vector_update();


--
-- Name: agent_commissions agent_commissions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agreements agreements_occupant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_occupant_id_fkey FOREIGN KEY (occupant_id) REFERENCES public.occupants(id) ON DELETE SET NULL;


--
-- Name: agreements agreements_previous_agreement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_previous_agreement_id_fkey FOREIGN KEY (previous_agreement_id) REFERENCES public.agreements(id);


--
-- Name: agreements agreements_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: agreements agreements_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: caution_fee_deductions caution_fee_deductions_caution_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caution_fee_deductions
    ADD CONSTRAINT caution_fee_deductions_caution_fee_id_fkey FOREIGN KEY (caution_fee_id) REFERENCES public.caution_fees(id) ON DELETE CASCADE;


--
-- Name: caution_fee_deductions caution_fee_deductions_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caution_fee_deductions
    ADD CONSTRAINT caution_fee_deductions_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.property_inspections(id);


--
-- Name: expenses expenses_expense_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_expense_config_id_fkey FOREIGN KEY (expense_config_id) REFERENCES public.expense_configs(id) ON DELETE SET NULL;


--
-- Name: expenses fk_expenses_maintenance_request; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_maintenance_request FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE SET NULL;


--
-- Name: trusted_devices fk_trusted_devices_system_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT fk_trusted_devices_system_admin FOREIGN KEY (system_admin_id) REFERENCES public.system_admins(id) ON DELETE CASCADE;


--
-- Name: trusted_devices fk_trusted_devices_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT fk_trusted_devices_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_otps fk_user_otps_system_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_otps
    ADD CONSTRAINT fk_user_otps_system_admin FOREIGN KEY (system_admin_id) REFERENCES public.system_admins(id) ON DELETE CASCADE;


--
-- Name: user_otps fk_user_otps_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_otps
    ADD CONSTRAINT fk_user_otps_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: inspection_items inspection_items_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.property_inspections(id) ON DELETE CASCADE;


--
-- Name: late_fee_logs late_fee_logs_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_fee_logs
    ADD CONSTRAINT late_fee_logs_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: ledger_entries ledger_entries_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: maintainer_reviews maintainer_reviews_maintainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintainer_reviews
    ADD CONSTRAINT maintainer_reviews_maintainer_id_fkey FOREIGN KEY (maintainer_id) REFERENCES public.maintainers(id) ON DELETE CASCADE;


--
-- Name: maintenance_comments maintenance_comments_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_comments
    ADD CONSTRAINT maintenance_comments_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: maintenance_part_items maintenance_part_items_maintenance_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_part_items
    ADD CONSTRAINT maintenance_part_items_maintenance_request_id_fkey FOREIGN KEY (maintenance_request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.maintenance_categories(id);


--
-- Name: maintenance_requests maintenance_requests_maintainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_maintainer_id_fkey FOREIGN KEY (maintainer_id) REFERENCES public.maintainers(id);


--
-- Name: occupants occupants_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.occupants
    ADD CONSTRAINT occupants_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: occupants occupants_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.occupants
    ADD CONSTRAINT occupants_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: plan_feature_flags plan_feature_flags_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_feature_flags
    ADD CONSTRAINT plan_feature_flags_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: preventative_maintenance_schedules preventative_maintenance_schedules_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preventative_maintenance_schedules
    ADD CONSTRAINT preventative_maintenance_schedules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.maintenance_categories(id);


--
-- Name: refresh_tokens refresh_tokens_global_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_global_user_id_fkey FOREIGN KEY (global_user_id) REFERENCES public.global_users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_replaced_by_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_replaced_by_token_id_fkey FOREIGN KEY (replaced_by_token_id) REFERENCES public.refresh_tokens(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rent_reviews rent_reviews_occupant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rent_reviews
    ADD CONSTRAINT rent_reviews_occupant_id_fkey FOREIGN KEY (occupant_id) REFERENCES public.occupants(id) ON DELETE SET NULL;


--
-- Name: rent_reviews rent_reviews_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rent_reviews
    ADD CONSTRAINT rent_reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: rent_reviews rent_reviews_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rent_reviews
    ADD CONSTRAINT rent_reviews_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: sms_credit_ledger_entries sms_credit_ledger_entries_sms_credit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_credit_ledger_entries
    ADD CONSTRAINT sms_credit_ledger_entries_sms_credit_account_id_fkey FOREIGN KEY (sms_credit_account_id) REFERENCES public.sms_credit_accounts(id);


--
-- Name: subscription_invoices subscription_invoices_target_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_target_plan_id_fkey FOREIGN KEY (target_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: subscription_invoices subscription_invoices_tenant_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_tenant_subscription_id_fkey FOREIGN KEY (tenant_subscription_id) REFERENCES public.tenant_subscriptions(id);


--
-- Name: system_admin_roles system_admin_roles_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_admin_roles
    ADD CONSTRAINT system_admin_roles_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.system_admins(id) ON DELETE CASCADE;


--
-- Name: system_admin_roles system_admin_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_admin_roles
    ADD CONSTRAINT system_admin_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.system_roles(id) ON DELETE CASCADE;


--
-- Name: system_role_permissions system_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_role_permissions
    ADD CONSTRAINT system_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.system_permissions(id) ON DELETE CASCADE;


--
-- Name: system_role_permissions system_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_role_permissions
    ADD CONSTRAINT system_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.system_roles(id) ON DELETE CASCADE;


--
-- Name: tenant_role_permissions tenant_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_role_permissions
    ADD CONSTRAINT tenant_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.tenant_permissions(id) ON DELETE CASCADE;


--
-- Name: tenant_role_permissions tenant_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_role_permissions
    ADD CONSTRAINT tenant_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tenant_roles(id) ON DELETE CASCADE;


--
-- Name: tenant_subscriptions tenant_subscriptions_pending_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pending_plan_id_fkey FOREIGN KEY (pending_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: tenant_subscriptions tenant_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: trusted_devices trusted_devices_global_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_global_user_id_fkey FOREIGN KEY (global_user_id) REFERENCES public.global_users(id) ON DELETE CASCADE;


--
-- Name: units units_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: user_otps user_otps_global_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_otps
    ADD CONSTRAINT user_otps_global_user_id_fkey FOREIGN KEY (global_user_id) REFERENCES public.global_users(id) ON DELETE CASCADE;


--
-- Name: user_tenant_links user_tenant_links_global_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_links
    ADD CONSTRAINT user_tenant_links_global_user_id_fkey FOREIGN KEY (global_user_id) REFERENCES public.global_users(id) ON DELETE CASCADE;


--
-- Name: user_tenant_roles user_tenant_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_roles
    ADD CONSTRAINT user_tenant_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tenant_roles(id) ON DELETE CASCADE;


--
-- Name: user_tenant_roles user_tenant_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenant_roles
    ADD CONSTRAINT user_tenant_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vacancy_listings vacancy_listings_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacancy_listings
    ADD CONSTRAINT vacancy_listings_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: vacate_notices vacate_notices_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacate_notices
    ADD CONSTRAINT vacate_notices_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.property_inspections(id);


--
-- Name: withdrawals withdrawals_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Ra4CGyhlox1sFD5dMUE5Fgwo2t57iFSxoW48H91o5Bwc3d3ZDfa88WWoPPVlzDz

