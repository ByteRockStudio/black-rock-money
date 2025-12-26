--
-- PostgreSQL database dump
--

\restrict gfFx0KwGe5qNZRkVyngCF74Y313GXUgRVp3CjJ3dVTA5foeJJAIA7noYeWFBwZx

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "startingBalance" double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'UAH'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isSavings" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'expense'::text NOT NULL,
    "budgetLimit" double precision,
    "userId" text
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: RecurringExpense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RecurringExpense" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    amount double precision NOT NULL,
    "accountId" text NOT NULL,
    "categoryId" text NOT NULL,
    "recurrenceType" text NOT NULL,
    "recurrenceInterval" integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "lastAppliedDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isPaused" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."RecurringExpense" OWNER TO postgres;

--
-- Name: RecurringRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RecurringRule" (
    id text NOT NULL,
    "dayOfMonth" integer NOT NULL,
    amount double precision NOT NULL,
    "categoryId" text NOT NULL,
    "accountId" text NOT NULL
);


ALTER TABLE public."RecurringRule" OWNER TO postgres;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "categoryId" text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text NOT NULL,
    comment text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurringExpenseId" text
);


ALTER TABLE public."Transaction" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "exchangeRate" double precision DEFAULT 42 NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", name, type, balance, "startingBalance", currency, "isDefault", "isSavings") FROM stdin;
cmiou09020003hxcvnox06u6p	cminnkjrg000010dfru4a6qah	Приват Кредитка	card	-66745	-67895	UAH	f	f
cminnro1o0003e7vxcr527m3o	cminnkjrg000010dfru4a6qah	Mono Чорна	card	3094	1334	UAH	t	f
cmiou0ivk0005hxcvtdzx8ihc	cminnkjrg000010dfru4a6qah	Приват Чорна	card	6821	1398	UAH	f	f
cmj9zx1cg0001mjqpiqinbcfn	cminnkjrg000010dfru4a6qah	Book 	cash	1500	1500	USD	f	t
cmj9zxctp0003mjqpvljatqcr	cminnkjrg000010dfru4a6qah	USA	cash	3400	3400	USD	f	t
cmiotpphn0001hxcvqddmxan4	cminnkjrg000010dfru4a6qah	Mono Біла	card	24000	19000	UAH	f	f
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, type, "budgetLimit", "userId") FROM stdin;
cminnrt280005e7vxbnmuogrd	Зарплата	income	\N	cminnkjrg000010dfru4a6qah
cmiojftma0004124ojliyvjhk	Кава	expense	3000	cminnkjrg000010dfru4a6qah
cminnrxra0007e7vx60mkeh5s	Здоровʼя	expense	3000	cminnkjrg000010dfru4a6qah
cmirsezba00096815fm96jt3h	Підписки	expense	\N	cminnkjrg000010dfru4a6qah
cmirsddr200016815puoghuro	Авто	expense	6000	cminnkjrg000010dfru4a6qah
cmirso9jm000t6815gfgv7v35	Перекази	income	\N	cminnkjrg000010dfru4a6qah
cmirsoje7000v6815l4ehtrze	Побори	expense	\N	cminnkjrg000010dfru4a6qah
cmirssd44001968153fed54ni	Кафе та Фастфуди	expense	\N	cminnkjrg000010dfru4a6qah
cmirssxb4001e6815nqoqixd6	Продукти	expense	\N	cminnkjrg000010dfru4a6qah
cmirt3jnw001y6815mavf9sp4	Кредити	expense	\N	cminnkjrg000010dfru4a6qah
cmiu147wy000111fn4uivuxhj	Нова Пошта	expense	\N	cminnkjrg000010dfru4a6qah
cmiw2jyh0000kcw0qpaascaqs	Інше	expense	\N	cminnkjrg000010dfru4a6qah
cmiw2klly000pcw0qaid98q9o	Кіно	expense	\N	cminnkjrg000010dfru4a6qah
cmj714u3p000i2v6mhcf8ezcl	Хатні приладдя 	expense	\N	cminnkjrg000010dfru4a6qah
cmj70zsvv000a2v6maykq41ax	Гаджети та елетроніка	expense	\N	cminnkjrg000010dfru4a6qah
\.


--
-- Data for Name: RecurringExpense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RecurringExpense" (id, "userId", name, amount, "accountId", "categoryId", "recurrenceType", "recurrenceInterval", "startDate", "lastAppliedDate", "isActive", "createdAt", "updatedAt", "isPaused") FROM stdin;
9ed6672a-450b-49ab-a402-59f7c25f35d7	cminnkjrg000010dfru4a6qah	1Password	168	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-08 00:00:00	2025-12-10 19:43:36.552	t	2025-12-04 19:04:13.974	2025-12-10 19:43:36.55	f
068bb1c3-069a-4d21-91e5-204bc87983a6	cminnkjrg000010dfru4a6qah	MacBook Air 13 	3713	cminnro1o0003e7vxcr527m3o	cmirt3jnw001y6815mavf9sp4	MONTHLY	1	2025-12-13 00:00:00	2025-12-14 13:48:04.54	t	2025-12-04 19:05:43.323	2025-12-14 13:48:04.535	f
054baf63-41cf-46e8-bd00-d41e9e36e1af	cminnkjrg000010dfru4a6qah	Київстар	350	cminnro1o0003e7vxcr527m3o	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-12 00:00:00	2025-12-15 10:48:05.204	t	2025-12-04 19:06:40.425	2025-12-15 10:48:05.202	f
568ac46f-8ed5-4c56-8389-84269fbdf143	cminnkjrg000010dfru4a6qah	Apple One	594	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-01 00:00:00	2025-12-04 18:47:16.71	t	2025-12-04 18:47:10.598	2025-12-04 18:47:52.158	f
60e82379-8aab-473b-9817-ac43f1e6bfd2	cminnkjrg000010dfru4a6qah	Apollo Next	1349	cmiou0ivk0005hxcvtdzx8ihc	cminnrxra0007e7vx60mkeh5s	MONTHLY	1	2025-12-04 00:00:00	2025-12-04 18:52:52.665	t	2025-12-04 18:52:49.794	2025-12-04 18:52:52.658	f
44c8edc9-bf2b-4f03-afa5-8d4c53d86c04	cminnkjrg000010dfru4a6qah	LocalNet	350	cminnro1o0003e7vxcr527m3o	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-02 00:00:00	2025-12-04 18:55:51.772	t	2025-12-04 18:55:42.915	2025-12-04 18:55:51.769	f
1c88e922-471f-4f8d-8174-78138ce68839	cminnkjrg000010dfru4a6qah	YouTube Оля	216	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-23 00:00:00	\N	t	2025-12-04 19:08:25.629	2025-12-04 19:08:25.629	f
6fdabb60-234f-412a-b22a-6ff2aab822ae	cminnkjrg000010dfru4a6qah	Preply	1988	cmiou0ivk0005hxcvtdzx8ihc	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-24 00:00:00	\N	t	2025-12-04 19:09:01.624	2025-12-04 19:09:01.624	f
a427a1b6-f8b9-449d-a60c-a9104aff8ca3	cminnkjrg000010dfru4a6qah	YouTube	100	cmiotpphn0001hxcvqddmxan4	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-25 00:00:00	\N	t	2025-12-04 19:09:34.932	2025-12-04 19:09:34.932	f
08400b83-736d-4ca3-9cd7-eece257254c4	cminnkjrg000010dfru4a6qah	Megogo	420	cmiotpphn0001hxcvqddmxan4	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-26 00:00:00	\N	t	2025-12-04 19:10:09.559	2025-12-04 19:10:09.559	f
a800bb5b-6f26-42f1-bcfe-be914a5d2cb9	cminnkjrg000010dfru4a6qah	iCloud	128	cmiotpphn0001hxcvqddmxan4	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-28 00:00:00	\N	t	2025-12-04 19:10:33.393	2025-12-04 19:10:33.393	f
330d6cd1-b0de-4b88-b0f7-9364ea55702a	cminnkjrg000010dfru4a6qah	Ремонт Авто	6048	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	MONTHLY	1	2025-12-21 00:00:00	\N	t	2025-12-06 08:49:45.314	2025-12-06 08:51:15.775	f
b7b877db-fb42-4d8e-9308-f53749a0501e	cminnkjrg000010dfru4a6qah	Іпотека	7500	cmiou0ivk0005hxcvtdzx8ihc	cmirt3jnw001y6815mavf9sp4	MONTHLY	1	2025-12-08 00:00:00	2025-12-06 09:09:20.447	t	2025-12-04 19:04:47.295	2025-12-06 09:09:20.442	f
6cbcc360-7741-46a9-8205-dac32a8804fa	cminnkjrg000010dfru4a6qah	Chat GPT	988	cmiou0ivk0005hxcvtdzx8ihc	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-15 00:00:00	\N	t	2025-12-04 19:07:54.811	2025-12-10 19:42:58.995	t
d26217aa-bf86-4db1-b29c-969384a02cba	cminnkjrg000010dfru4a6qah	Lightroom	84	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	MONTHLY	1	2025-12-08 00:00:00	2025-12-10 19:43:10.513	t	2025-12-04 19:03:27.811	2025-12-10 19:43:10.506	f
\.


--
-- Data for Name: RecurringRule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RecurringRule" (id, "dayOfMonth", amount, "categoryId", "accountId") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transaction" (id, "accountId", "categoryId", amount, date, type, comment, "isRecurring", "recurringExpenseId") FROM stdin;
cmirsdr0r000468153bdp1fqr	cmiou09020003hxcvnox06u6p	cmirsddr200016815puoghuro	1000	2025-12-04 18:45:49.706	expense	WOG	f	\N
cmirsfm5f000c6815bimjkiu2	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	594	2025-12-04 18:47:16.706	expense	Recurring: Apple One	t	568ac46f-8ed5-4c56-8389-84269fbdf143
cmirsh08i000f6815tbwc94ab	cmiou09020003hxcvnox06u6p	cmirsddr200016815puoghuro	125	2025-12-04 18:48:21.617	expense	Автомийка ICW	f	\N
cmirshkr1000i68152u6yxoei	cmiou09020003hxcvnox06u6p	cminnrxra0007e7vx60mkeh5s	108	2025-12-04 18:48:48.205	expense	Aптека АНЦ	f	\N
cmirsjojz000l6815m9i3ijjl	cmiou09020003hxcvnox06u6p	cmiojftma0004124ojliyvjhk	204	2025-12-04 18:50:26.446	expense	Хлібар	f	\N
cmirslij0000o6815npjdrny7	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	67	2025-12-04 18:51:51.947	expense	Megogo Кіно	f	\N
cmirsmtdf000r6815uyx1z3ep	cmiou0ivk0005hxcvtdzx8ihc	cminnrxra0007e7vx60mkeh5s	1349	2025-12-04 18:52:52.658	expense	Recurring: Apollo Next	t	60e82379-8aab-473b-9817-ac43f1e6bfd2
cmirsozpf000y6815xc7ocxkh	cminnro1o0003e7vxcr527m3o	cmirsoje7000v6815l4ehtrze	200	2025-12-04 18:54:34.179	expense	День Народження в групі	f	\N
cmirspksq00116815ojeky62j	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	26	2025-12-04 18:55:01.513	expense	Кава	f	\N
cmirsqnkp001468157ufjdt1i	cminnro1o0003e7vxcr527m3o	cmirsezba00096815fm96jt3h	350	2025-12-04 18:55:51.769	expense	Recurring: LocalNet	t	44c8edc9-bf2b-4f03-afa5-8d4c53d86c04
cmirsrxk800176815m2edj97a	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	76	2025-12-04 18:56:51.367	expense	Кава	f	\N
cmirssq9p001c68152pfc56tz	cminnro1o0003e7vxcr527m3o	cmirssd44001968153fed54ni	139	2025-12-04 18:57:28.573	expense	МакДональдз	f	\N
cmirst6qg001h6815ghz5hlxq	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	180	2025-12-04 18:57:49.911	expense	Сільпо	f	\N
cmirstguw001k6815bsiooh4a	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	42	2025-12-04 18:58:03.032	expense	Мікс Март	f	\N
cmirsty5x001n6815c6vii4l9	cminnro1o0003e7vxcr527m3o	cmirssd44001968153fed54ni	159	2025-12-04 18:58:25.46	expense	МакДональдз	f	\N
cmirsu6ur001q6815rr6qyvjg	cminnro1o0003e7vxcr527m3o	cmirsddr200016815puoghuro	1000	2025-12-04 18:58:36.722	expense	WOG	f	\N
cmirsuqrq001t6815lx91kb6b	cminnro1o0003e7vxcr527m3o	cmirso9jm000t6815gfgv7v35	2000	2025-12-04 18:59:02.533	income	Мама	f	\N
cmirsuzak001w6815flpbvcpk	cminnro1o0003e7vxcr527m3o	cmirso9jm000t6815gfgv7v35	2000	2025-12-04 18:59:13.58	income	Батько	f	\N
cmiu14g62000411fn6dt01xvp	cminnro1o0003e7vxcr527m3o	cmiu147wy000111fn4uivuxhj	73	2025-12-06 08:26:04.633	expense		f	\N
cmiu14pn8000711fnxvdcweof	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	156	2025-12-06 08:26:16.916	expense	Хлібар	f	\N
cmiu1535k000a11fnr2nix0i7	cminnro1o0003e7vxcr527m3o	cminnrxra0007e7vx60mkeh5s	36	2025-12-06 08:26:34.424	expense	Аптека АНЦ	f	\N
cmiu15e9e000d11fnu0o39ep1	cminnro1o0003e7vxcr527m3o	cmirsoje7000v6815l4ehtrze	200	2025-12-06 08:26:48.817	expense	ДН Тарас	f	\N
cmiu1x4kb00022grbuigmyoz9	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	192	2025-12-06 08:48:22.618	expense	Руставелі	f	\N
cmiu2o33v0002cw0qn3vnhij4	cmiou0ivk0005hxcvtdzx8ihc	cmirt3jnw001y6815mavf9sp4	7400	2025-12-06 09:09:34.85	expense	Recurring: Іпотека	t	b7b877db-fb42-4d8e-9308-f53749a0501e
cmiu2r9t60006cw0qhtu1dlmc	cmiotpphn0001hxcvqddmxan4	cminnrt280005e7vxbnmuogrd	5000	2025-12-06 09:11:49.097	income		f	\N
cmiu2rhml0009cw0qnvjnoy11	cmiou09020003hxcvnox06u6p	cminnrt280005e7vxbnmuogrd	3500	2025-12-06 09:11:59.229	income		f	\N
cmiu2rqhz000ccw0qfqump0qk	cminnro1o0003e7vxcr527m3o	cminnrt280005e7vxbnmuogrd	10000	2025-12-06 09:12:10.726	income		f	\N
cmiu2sauk000fcw0qblw3fdss	cmiou0ivk0005hxcvtdzx8ihc	cminnrt280005e7vxbnmuogrd	15877	2025-12-06 09:12:37.099	income		f	\N
cmiw2jmto000icw0qb6rx3xf2	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	440	2025-12-07 18:41:25.067	expense	Белучі	f	\N
cmiw2kayq000ncw0qre8j0s0u	cminnro1o0003e7vxcr527m3o	cmiw2jyh0000kcw0qpaascaqs	1190	2025-12-07 18:41:56.352	expense	Захисне Скло	f	\N
cmiw2l2oh000scw0q3xue5yq0	cminnro1o0003e7vxcr527m3o	cmiw2klly000pcw0qaid98q9o	925	2025-12-07 18:42:32.272	expense	Планета Кіно	f	\N
cmiw2lad9000vcw0qltpc94sa	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	170	2025-12-07 18:42:42.237	expense	Белучі	f	\N
cmiw2lig0000ycw0qdx7y1iia	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	177	2025-12-07 18:42:52.703	expense	Коло	f	\N
cmj098i1p0002limmm5mv2toz	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	110	2025-12-10 16:59:47.675	expense	Віті	f	\N
cmj098osd0005limmdzpcf75o	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	87	2025-12-10 16:59:56.413	expense	Віті	f	\N
cmj0993310008limmpihvv52b	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	110	2025-12-10 17:00:14.94	expense	Хлібна Кава	f	\N
cmj099904000blimmb8t0icw4	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	70	2025-12-10 17:00:22.612	expense	Белучі	f	\N
cmj099h4v000elimmgx7qpon8	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	143	2025-12-10 17:00:33.151	expense	Хлібар	f	\N
cmj099tsx000hlimmxlygcyjo	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	431	2025-12-10 17:00:49.568	expense	Сам у дома	f	\N
cmj09a1mg000klimm7ltxv9ie	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	70	2025-12-10 17:00:59.704	expense	Белучі	f	\N
cmj09acgy000nlimmj0pvxxi7	cminnro1o0003e7vxcr527m3o	cmirsddr200016815puoghuro	1500	2025-12-10 17:01:13.762	expense	WOG	f	\N
cmj09annn000qlimm476hwdzd	cminnro1o0003e7vxcr527m3o	cmirsoje7000v6815l4ehtrze	300	2025-12-10 17:01:28.258	expense	Юріч	f	\N
cmj09b413000wlimmqsacooc7	cminnro1o0003e7vxcr527m3o	cmirssd44001968153fed54ni	402	2025-12-10 17:01:49.479	expense	МакДональдз	f	\N
cmj0f2lyj0002wti401njpu4m	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	84	2025-12-10 19:43:10.507	expense	Recurring: Lightroom	t	d26217aa-bf86-4db1-b29c-969384a02cba
cmj0f361y0005wti4odaou80k	cmiou09020003hxcvnox06u6p	cmirsezba00096815fm96jt3h	168	2025-12-10 19:43:36.55	expense	Recurring: 1Password	t	9ed6672a-450b-49ab-a402-59f7c25f35d7
cmj5l0wg10002azbwvudnw9l1	cminnro1o0003e7vxcr527m3o	cmirso9jm000t6815gfgv7v35	3000	2025-12-14 10:28:39.36	income	Оля	f	\N
cmj5s5cu00005azbwltc43yfh	cminnro1o0003e7vxcr527m3o	cmirt3jnw001y6815mavf9sp4	3713	2025-12-14 13:48:04.536	expense	Recurring: MacBook Air 13 	t	068bb1c3-069a-4d21-91e5-204bc87983a6
cmj09au54000tlimmi6vl3sq2	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	140	2025-12-11 00:00:00	expense	Ашот	f	\N
cmj70ws9k00022v6mva5dnoqi	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	158	2025-12-11 00:00:00	expense	Белучі	f	\N
cmj70xhwf00052v6m3tcz7uda	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	185	2025-12-12 00:00:00	expense	Ашот	f	\N
cmj70y4fo00082v6mr11by2mh	cminnro1o0003e7vxcr527m3o	cmiojftma0004124ojliyvjhk	140	2025-12-14 00:00:00	expense	Ашот	f	\N
cmj711enk000d2v6mazkga23b	cminnro1o0003e7vxcr527m3o	cmiw2jyh0000kcw0qpaascaqs	550	2025-12-14 00:00:00	expense	Ювелірка ремонт каблучки	f	\N
cmj7125jx000g2v6mb71ncduz	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	355	2025-12-14 00:00:00	expense	Бадьорий 	f	\N
cmj715b29000l2v6mmx9no8qz	cminnro1o0003e7vxcr527m3o	cmj714u3p000i2v6mhcf8ezcl	265	2025-12-14 00:00:00	expense	Ева	f	\N
cmj715qoi000o2v6mkku3gvyc	cminnro1o0003e7vxcr527m3o	cmirsezba00096815fm96jt3h	350	2025-12-15 10:48:05.201	expense	Recurring: Київстар	t	054baf63-41cf-46e8-bd00-d41e9e36e1af
cmj7170rg000r2v6ml6xahx5o	cminnro1o0003e7vxcr527m3o	cmirssd44001968153fed54ni	100	2025-12-14 00:00:00	expense	Чайові 	f	\N
cmj717oxk000u2v6mdr7x3ran	cminnro1o0003e7vxcr527m3o	cmirssxb4001e6815nqoqixd6	330	2025-12-14 00:00:00	expense	АТБ	f	\N
cmj7198su000x2v6m6yy5p1hs	cmiou0ivk0005hxcvtdzx8ihc	cmirsoje7000v6815l4ehtrze	600	2025-12-15 00:00:00	expense	Дні Народження 	f	\N
cmj71aqv500102v6mn1xg8bdd	cmiou0ivk0005hxcvtdzx8ihc	cmj70zsvv000a2v6maykq41ax	1105	2025-12-15 00:00:00	expense	USB Hub	f	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, username, "passwordHash", "createdAt", "exchangeRate") FROM stdin;
cminnkjrg000010dfru4a6qah	booker	$2b$10$kiJb0pxT3j9ObuZX6zFu0eN2T7HUShm7pyN03mYIbFa2rukaJTysq	2025-12-01 21:20:04.108	42
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
eb60cb93-6ad6-4450-8477-d791899ffec2	eb6964a736030963f4a3b29faaec1f43b995add887749ec559aedd26c159bae0	2025-12-01 21:20:03.565233+00	20251201212003_init_with_recurring	\N	\N	2025-12-01 21:20:03.541557+00	1
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: RecurringExpense RecurringExpense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY (id);


--
-- Name: RecurringRule RecurringRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringRule"
    ADD CONSTRAINT "RecurringRule_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Category Category_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RecurringExpense RecurringExpense_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringExpense RecurringExpense_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringExpense RecurringExpense_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringExpense"
    ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringRule RecurringRule_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringRule"
    ADD CONSTRAINT "RecurringRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecurringRule RecurringRule_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecurringRule"
    ADD CONSTRAINT "RecurringRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_recurringExpenseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES public."RecurringExpense"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict gfFx0KwGe5qNZRkVyngCF74Y313GXUgRVp3CjJ3dVTA5foeJJAIA7noYeWFBwZx

