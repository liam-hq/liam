import { describe, it } from 'vitest'
import { processor } from '.'

describe(processor, () => {
  it('test.', async () => {
    const result = await processor(/* PostgreSQL */ `
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: timestamp_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.timestamp_id(table_name text) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
  DECLARE
    time_part bigint;
    sequence_base bigint;
    tail bigint;
  BEGIN
    time_part := (
      -- Get the time in milliseconds
      ((date_part('epoch', now()) * 1000))::bigint
      -- And shift it over two bytes
      << 16);

    sequence_base := (
      'x' ||
      -- Take the first two bytes (four hex characters)
      substr(
        -- Of the MD5 hash of the data we documented
        md5(table_name || 'c80cf27dfd8c2ed736e77d40fe99d7e7' || time_part::text),
        1, 4
      )
    -- And turn it into a bigint
    )::bit(16)::bigint;

    -- Finally, add our sequence number to our base, and chop
    -- it to the last two bytes
    tail := (
      (sequence_base + nextval(table_name || '_id_seq'))
      & 65535);

    -- Return the time part and the sequence part. OR appears
    -- faster here than addition, but they're equivalent:
    -- time_part has no trailing two bytes, and tail is only
    -- the last two bytes.
    RETURN time_part | tail;
  END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_aliases (
    id bigint NOT NULL,
    account_id bigint,
    acct character varying DEFAULT ''::character varying NOT NULL,
    uri character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_aliases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_aliases_id_seq OWNED BY public.account_aliases.id;


--
-- Name: account_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_conversations (
    id bigint NOT NULL,
    account_id bigint,
    conversation_id bigint,
    participant_account_ids bigint[] DEFAULT '{}'::bigint[] NOT NULL,
    status_ids bigint[] DEFAULT '{}'::bigint[] NOT NULL,
    last_status_id bigint,
    lock_version integer DEFAULT 0 NOT NULL,
    unread boolean DEFAULT false NOT NULL
);


--
-- Name: account_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_conversations_id_seq OWNED BY public.account_conversations.id;


--
-- Name: account_deletion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_deletion_requests (
    id bigint NOT NULL,
    account_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_deletion_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_deletion_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_deletion_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_deletion_requests_id_seq OWNED BY public.account_deletion_requests.id;


--
-- Name: account_domain_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_domain_blocks (
    domain character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint,
    id bigint NOT NULL
);


--
-- Name: account_domain_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_domain_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_domain_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_domain_blocks_id_seq OWNED BY public.account_domain_blocks.id;


--
-- Name: account_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_migrations (
    id bigint NOT NULL,
    account_id bigint,
    acct character varying DEFAULT ''::character varying NOT NULL,
    followers_count bigint DEFAULT 0 NOT NULL,
    target_account_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_migrations_id_seq OWNED BY public.account_migrations.id;


--
-- Name: account_moderation_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_moderation_notes (
    id bigint NOT NULL,
    content text NOT NULL,
    account_id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_moderation_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_moderation_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_moderation_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_moderation_notes_id_seq OWNED BY public.account_moderation_notes.id;


--
-- Name: account_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_notes (
    id bigint NOT NULL,
    account_id bigint,
    target_account_id bigint,
    comment text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_notes_id_seq OWNED BY public.account_notes.id;


--
-- Name: account_pins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_pins (
    id bigint NOT NULL,
    account_id bigint,
    target_account_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: account_pins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_pins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_pins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_pins_id_seq OWNED BY public.account_pins.id;


--
-- Name: account_relationship_severance_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_relationship_severance_events (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    relationship_severance_event_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    followers_count integer DEFAULT 0 NOT NULL,
    following_count integer DEFAULT 0 NOT NULL
);


--
-- Name: account_relationship_severance_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_relationship_severance_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_relationship_severance_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_relationship_severance_events_id_seq OWNED BY public.account_relationship_severance_events.id;


--
-- Name: account_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_stats (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    statuses_count bigint DEFAULT 0 NOT NULL,
    following_count bigint DEFAULT 0 NOT NULL,
    followers_count bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    last_status_at timestamp without time zone
);


--
-- Name: account_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_stats_id_seq OWNED BY public.account_stats.id;


--
-- Name: account_statuses_cleanup_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_statuses_cleanup_policies (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    min_status_age integer DEFAULT 1209600 NOT NULL,
    keep_direct boolean DEFAULT true NOT NULL,
    keep_pinned boolean DEFAULT true NOT NULL,
    keep_polls boolean DEFAULT false NOT NULL,
    keep_media boolean DEFAULT false NOT NULL,
    keep_self_fav boolean DEFAULT true NOT NULL,
    keep_self_bookmark boolean DEFAULT true NOT NULL,
    min_favs integer,
    min_reblogs integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: account_statuses_cleanup_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_statuses_cleanup_policies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_statuses_cleanup_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_statuses_cleanup_policies_id_seq OWNED BY public.account_statuses_cleanup_policies.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    username character varying DEFAULT ''::character varying NOT NULL,
    domain character varying,
    private_key text,
    public_key text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    display_name character varying DEFAULT ''::character varying NOT NULL,
    uri character varying DEFAULT ''::character varying NOT NULL,
    url character varying,
    avatar_file_name character varying,
    avatar_content_type character varying,
    avatar_file_size integer,
    avatar_updated_at timestamp without time zone,
    header_file_name character varying,
    header_content_type character varying,
    header_file_size integer,
    header_updated_at timestamp without time zone,
    avatar_remote_url character varying,
    locked boolean DEFAULT false NOT NULL,
    header_remote_url character varying DEFAULT ''::character varying NOT NULL,
    last_webfingered_at timestamp without time zone,
    inbox_url character varying DEFAULT ''::character varying NOT NULL,
    outbox_url character varying DEFAULT ''::character varying NOT NULL,
    shared_inbox_url character varying DEFAULT ''::character varying NOT NULL,
    followers_url character varying DEFAULT ''::character varying NOT NULL,
    protocol integer DEFAULT 0 NOT NULL,
    id bigint DEFAULT public.timestamp_id('accounts'::text) NOT NULL,
    memorial boolean DEFAULT false NOT NULL,
    moved_to_account_id bigint,
    featured_collection_url character varying,
    fields jsonb,
    actor_type character varying,
    discoverable boolean,
    also_known_as character varying[],
    silenced_at timestamp without time zone,
    suspended_at timestamp without time zone,
    hide_collections boolean,
    avatar_storage_schema_version integer,
    header_storage_schema_version integer,
    sensitized_at timestamp without time zone,
    suspension_origin integer,
    trendable boolean,
    reviewed_at timestamp without time zone,
    requested_review_at timestamp without time zone,
    indexable boolean DEFAULT false NOT NULL,
    attribution_domains character varying[] DEFAULT '{}'::character varying[]
);


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statuses (
    id bigint DEFAULT public.timestamp_id('statuses'::text) NOT NULL,
    uri character varying,
    text text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    in_reply_to_id bigint,
    reblog_of_id bigint,
    url character varying,
    sensitive boolean DEFAULT false NOT NULL,
    visibility integer DEFAULT 0 NOT NULL,
    spoiler_text text DEFAULT ''::text NOT NULL,
    reply boolean DEFAULT false NOT NULL,
    language character varying,
    conversation_id bigint,
    local boolean,
    account_id bigint NOT NULL,
    application_id bigint,
    in_reply_to_account_id bigint,
    poll_id bigint,
    deleted_at timestamp without time zone,
    edited_at timestamp without time zone,
    trendable boolean,
    ordered_media_attachment_ids bigint[]
);


--
-- Name: account_summaries; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.account_summaries AS
 SELECT accounts.id AS account_id,
    mode() WITHIN GROUP (ORDER BY t0.language) AS language,
    mode() WITHIN GROUP (ORDER BY t0.sensitive) AS sensitive
   FROM (public.accounts
     CROSS JOIN LATERAL ( SELECT statuses.account_id,
            statuses.language,
            statuses.sensitive
           FROM public.statuses
          WHERE ((statuses.account_id = accounts.id) AND (statuses.deleted_at IS NULL) AND (statuses.reblog_of_id IS NULL))
          ORDER BY statuses.id DESC
         LIMIT 20) t0)
  WHERE ((accounts.suspended_at IS NULL) AND (accounts.silenced_at IS NULL) AND (accounts.moved_to_account_id IS NULL) AND (accounts.discoverable = true) AND (accounts.locked = false))
  GROUP BY accounts.id
  WITH NO DATA;


--
-- Name: account_warning_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_warning_presets (
    id bigint NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    title character varying DEFAULT ''::character varying NOT NULL
);


--
-- Name: account_warning_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_warning_presets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_warning_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_warning_presets_id_seq OWNED BY public.account_warning_presets.id;


--
-- Name: account_warnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_warnings (
    id bigint NOT NULL,
    account_id bigint,
    target_account_id bigint,
    action integer DEFAULT 0 NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    report_id bigint,
    status_ids character varying[],
    overruled_at timestamp without time zone
);


--
-- Name: account_warnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_warnings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_warnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_warnings_id_seq OWNED BY public.account_warnings.id;


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: accounts_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_tags (
    account_id bigint NOT NULL,
    tag_id bigint NOT NULL
);


--
-- Name: admin_action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_action_logs (
    id bigint NOT NULL,
    account_id bigint,
    action character varying DEFAULT ''::character varying NOT NULL,
    target_type character varying,
    target_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    human_identifier character varying,
    route_param character varying,
    permalink character varying
);


--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_action_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_action_logs_id_seq OWNED BY public.admin_action_logs.id;


--
-- Name: announcement_mutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_mutes (
    id bigint NOT NULL,
    account_id bigint,
    announcement_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: announcement_mutes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcement_mutes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcement_mutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcement_mutes_id_seq OWNED BY public.announcement_mutes.id;


--
-- Name: announcement_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_reactions (
    id bigint NOT NULL,
    account_id bigint,
    announcement_id bigint,
    name character varying DEFAULT ''::character varying NOT NULL,
    custom_emoji_id bigint,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: announcement_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcement_reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcement_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcement_reactions_id_seq OWNED BY public.announcement_reactions.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    published boolean DEFAULT false NOT NULL,
    all_day boolean DEFAULT false NOT NULL,
    scheduled_at timestamp without time zone,
    starts_at timestamp without time zone,
    ends_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    published_at timestamp without time zone,
    status_ids bigint[]
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: annual_report_statuses_per_account_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annual_report_statuses_per_account_counts (
    id bigint NOT NULL,
    year integer NOT NULL,
    account_id bigint NOT NULL,
    statuses_count bigint NOT NULL
);


--
-- Name: annual_report_statuses_per_account_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annual_report_statuses_per_account_counts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: annual_report_statuses_per_account_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annual_report_statuses_per_account_counts_id_seq OWNED BY public.annual_report_statuses_per_account_counts.id;


--
-- Name: appeals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appeals (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    account_warning_id bigint NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    approved_at timestamp without time zone,
    approved_by_account_id bigint,
    rejected_at timestamp without time zone,
    rejected_by_account_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: appeals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appeals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appeals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appeals_id_seq OWNED BY public.appeals.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backups (
    id bigint NOT NULL,
    user_id bigint,
    dump_file_name character varying,
    dump_content_type character varying,
    dump_updated_at timestamp without time zone,
    processed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    dump_file_size bigint
);


--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.backups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocks (
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    uri character varying
);


--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookmarks (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    status_id bigint NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookmarks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookmarks_id_seq OWNED BY public.bookmarks.id;


--
-- Name: bulk_import_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulk_import_rows (
    id bigint NOT NULL,
    bulk_import_id bigint NOT NULL,
    data jsonb,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: bulk_import_rows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bulk_import_rows_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bulk_import_rows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bulk_import_rows_id_seq OWNED BY public.bulk_import_rows.id;


--
-- Name: bulk_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulk_imports (
    id bigint NOT NULL,
    type integer NOT NULL,
    state integer NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    imported_items integer DEFAULT 0 NOT NULL,
    processed_items integer DEFAULT 0 NOT NULL,
    finished_at timestamp without time zone,
    overwrite boolean DEFAULT false NOT NULL,
    likely_mismatched boolean DEFAULT false NOT NULL,
    original_filename character varying DEFAULT ''::character varying NOT NULL,
    account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: bulk_imports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bulk_imports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bulk_imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bulk_imports_id_seq OWNED BY public.bulk_imports.id;


--
-- Name: canonical_email_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canonical_email_blocks (
    id bigint NOT NULL,
    canonical_email_hash character varying DEFAULT ''::character varying NOT NULL,
    reference_account_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: canonical_email_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.canonical_email_blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: canonical_email_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.canonical_email_blocks_id_seq OWNED BY public.canonical_email_blocks.id;


--
-- Name: conversation_mutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_mutes (
    conversation_id bigint NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL
);


--
-- Name: conversation_mutes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_mutes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_mutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_mutes_id_seq OWNED BY public.conversation_mutes.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    uri character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: custom_emoji_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_emoji_categories (
    id bigint NOT NULL,
    name character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: custom_emoji_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_emoji_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_emoji_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_emoji_categories_id_seq OWNED BY public.custom_emoji_categories.id;


--
-- Name: custom_emojis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_emojis (
    id bigint NOT NULL,
    shortcode character varying DEFAULT ''::character varying NOT NULL,
    domain character varying,
    image_file_name character varying,
    image_content_type character varying,
    image_file_size integer,
    image_updated_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    uri character varying,
    image_remote_url character varying,
    visible_in_picker boolean DEFAULT true NOT NULL,
    category_id bigint,
    image_storage_schema_version integer
);


--
-- Name: custom_emojis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_emojis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_emojis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_emojis_id_seq OWNED BY public.custom_emojis.id;


--
-- Name: custom_filter_keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_filter_keywords (
    id bigint NOT NULL,
    custom_filter_id bigint NOT NULL,
    keyword text DEFAULT ''::text NOT NULL,
    whole_word boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: custom_filter_keywords_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_filter_keywords_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_filter_keywords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_filter_keywords_id_seq OWNED BY public.custom_filter_keywords.id;


--
-- Name: custom_filter_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_filter_statuses (
    id bigint NOT NULL,
    custom_filter_id bigint NOT NULL,
    status_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: custom_filter_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_filter_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_filter_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_filter_statuses_id_seq OWNED BY public.custom_filter_statuses.id;


--
-- Name: custom_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_filters (
    id bigint NOT NULL,
    account_id bigint,
    expires_at timestamp without time zone,
    phrase text DEFAULT ''::text NOT NULL,
    context character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    action integer DEFAULT 0 NOT NULL
);


--
-- Name: custom_filters_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_filters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_filters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_filters_id_seq OWNED BY public.custom_filters.id;


--
-- Name: deprecated_preview_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deprecated_preview_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: domain_allows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_allows (
    id bigint NOT NULL,
    domain character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: domain_allows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.domain_allows_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: domain_allows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.domain_allows_id_seq OWNED BY public.domain_allows.id;


--
-- Name: domain_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_blocks (
    domain character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    severity integer DEFAULT 0,
    reject_media boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    reject_reports boolean DEFAULT false NOT NULL,
    private_comment text,
    public_comment text,
    obfuscate boolean DEFAULT false NOT NULL
);


--
-- Name: domain_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.domain_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: domain_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.domain_blocks_id_seq OWNED BY public.domain_blocks.id;


--
-- Name: email_domain_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_domain_blocks (
    id bigint NOT NULL,
    domain character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    parent_id bigint,
    allow_with_approval boolean DEFAULT false NOT NULL
);


--
-- Name: email_domain_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_domain_blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_domain_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_domain_blocks_id_seq OWNED BY public.email_domain_blocks.id;


--
-- Name: favourites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favourites (
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    status_id bigint NOT NULL
);


--
-- Name: favourites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favourites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favourites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favourites_id_seq OWNED BY public.favourites.id;


--
-- Name: featured_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_tags (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    statuses_count bigint DEFAULT 0 NOT NULL,
    last_status_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    name character varying
);


--
-- Name: featured_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.featured_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: featured_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.featured_tags_id_seq OWNED BY public.featured_tags.id;


--
-- Name: follow_recommendation_mutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_recommendation_mutes (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: follow_recommendation_mutes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follow_recommendation_mutes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follow_recommendation_mutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follow_recommendation_mutes_id_seq OWNED BY public.follow_recommendation_mutes.id;


--
-- Name: follow_recommendation_suppressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_recommendation_suppressions (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: follow_recommendation_suppressions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follow_recommendation_suppressions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follow_recommendation_suppressions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follow_recommendation_suppressions_id_seq OWNED BY public.follow_recommendation_suppressions.id;


--
-- Name: follow_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_requests (
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    show_reblogs boolean DEFAULT true NOT NULL,
    uri character varying,
    notify boolean DEFAULT false NOT NULL,
    languages character varying[]
);


--
-- Name: follow_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follow_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follow_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follow_requests_id_seq OWNED BY public.follow_requests.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    show_reblogs boolean DEFAULT true NOT NULL,
    uri character varying,
    notify boolean DEFAULT false NOT NULL,
    languages character varying[]
);


--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: generated_annual_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_annual_reports (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    year integer NOT NULL,
    data jsonb NOT NULL,
    schema_version integer NOT NULL,
    viewed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: generated_annual_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.generated_annual_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: generated_annual_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.generated_annual_reports_id_seq OWNED BY public.generated_annual_reports.id;


--
-- Name: status_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_stats (
    id bigint NOT NULL,
    status_id bigint NOT NULL,
    replies_count bigint DEFAULT 0 NOT NULL,
    reblogs_count bigint DEFAULT 0 NOT NULL,
    favourites_count bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    untrusted_favourites_count bigint,
    untrusted_reblogs_count bigint
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    email character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    encrypted_password character varying DEFAULT ''::character varying NOT NULL,
    reset_password_token character varying,
    reset_password_sent_at timestamp without time zone,
    sign_in_count integer DEFAULT 0 NOT NULL,
    current_sign_in_at timestamp without time zone,
    last_sign_in_at timestamp without time zone,
    confirmation_token character varying,
    confirmed_at timestamp without time zone,
    confirmation_sent_at timestamp without time zone,
    unconfirmed_email character varying,
    locale character varying,
    encrypted_otp_secret character varying,
    encrypted_otp_secret_iv character varying,
    encrypted_otp_secret_salt character varying,
    consumed_timestep integer,
    otp_required_for_login boolean DEFAULT false NOT NULL,
    last_emailed_at timestamp without time zone,
    otp_backup_codes character varying[],
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    invite_id bigint,
    chosen_languages character varying[],
    created_by_application_id bigint,
    approved boolean DEFAULT true NOT NULL,
    sign_in_token character varying,
    sign_in_token_sent_at timestamp without time zone,
    webauthn_id character varying,
    sign_up_ip inet,
    skip_sign_in_token boolean,
    role_id bigint,
    settings text,
    time_zone character varying,
    otp_secret character varying
);


--
-- Name: global_follow_recommendations; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.global_follow_recommendations AS
 SELECT t0.account_id,
    sum(t0.rank) AS rank,
    array_agg(t0.reason) AS reason
   FROM ( SELECT account_summaries.account_id,
            ((count(follows.id))::numeric / (1.0 + (count(follows.id))::numeric)) AS rank,
            'most_followed'::text AS reason
           FROM ((public.follows
             JOIN public.account_summaries ON ((account_summaries.account_id = follows.target_account_id)))
             JOIN public.users ON ((users.account_id = follows.account_id)))
          WHERE ((users.current_sign_in_at >= (now() - '30 days'::interval)) AND (account_summaries.sensitive = false) AND (NOT (EXISTS ( SELECT 1
                   FROM public.follow_recommendation_suppressions
                  WHERE (follow_recommendation_suppressions.account_id = follows.target_account_id)))))
          GROUP BY account_summaries.account_id
         HAVING (count(follows.id) >= 5)
        UNION ALL
         SELECT account_summaries.account_id,
            (sum((status_stats.reblogs_count + status_stats.favourites_count)) / (1.0 + sum((status_stats.reblogs_count + status_stats.favourites_count)))) AS rank,
            'most_interactions'::text AS reason
           FROM ((public.status_stats
             JOIN public.statuses ON ((statuses.id = status_stats.status_id)))
             JOIN public.account_summaries ON ((account_summaries.account_id = statuses.account_id)))
          WHERE ((statuses.id >= (((date_part('epoch'::text, (now() - '30 days'::interval)) * (1000)::double precision))::bigint << 16)) AND (account_summaries.sensitive = false) AND (NOT (EXISTS ( SELECT 1
                   FROM public.follow_recommendation_suppressions
                  WHERE (follow_recommendation_suppressions.account_id = statuses.account_id)))))
          GROUP BY account_summaries.account_id
         HAVING (sum((status_stats.reblogs_count + status_stats.favourites_count)) >= (5)::numeric)) t0
  GROUP BY t0.account_id
  ORDER BY (sum(t0.rank)) DESC
  WITH NO DATA;


--
-- Name: identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identities (
    provider character varying DEFAULT ''::character varying NOT NULL,
    uid character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    id bigint NOT NULL,
    user_id bigint
);


--
-- Name: identities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.identities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: identities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.identities_id_seq OWNED BY public.identities.id;


--
-- Name: imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imports (
    type integer NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    data_file_name character varying,
    data_content_type character varying,
    data_file_size integer,
    data_updated_at timestamp without time zone,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    overwrite boolean DEFAULT false NOT NULL
);


--
-- Name: imports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imports_id_seq OWNED BY public.imports.id;


--
-- Name: instances; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.instances AS
 WITH domain_counts(domain, accounts_count) AS (
         SELECT accounts.domain,
            count(*) AS accounts_count
           FROM public.accounts
          WHERE (accounts.domain IS NOT NULL)
          GROUP BY accounts.domain
        )
 SELECT domain_counts.domain,
    domain_counts.accounts_count
   FROM domain_counts
UNION
 SELECT domain_blocks.domain,
    COALESCE(domain_counts.accounts_count, (0)::bigint) AS accounts_count
   FROM (public.domain_blocks
     LEFT JOIN domain_counts ON (((domain_counts.domain)::text = (domain_blocks.domain)::text)))
UNION
 SELECT domain_allows.domain,
    COALESCE(domain_counts.accounts_count, (0)::bigint) AS accounts_count
   FROM (public.domain_allows
     LEFT JOIN domain_counts ON (((domain_counts.domain)::text = (domain_allows.domain)::text)))
  WITH NO DATA;


--
-- Name: invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invites (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    code character varying DEFAULT ''::character varying NOT NULL,
    expires_at timestamp without time zone,
    max_uses integer,
    uses integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    autofollow boolean DEFAULT false NOT NULL,
    comment text
);


--
-- Name: invites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invites_id_seq OWNED BY public.invites.id;


--
-- Name: ip_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ip_blocks (
    id bigint NOT NULL,
    ip inet DEFAULT '0.0.0.0'::inet NOT NULL,
    severity integer DEFAULT 0 NOT NULL,
    expires_at timestamp without time zone,
    comment text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: ip_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ip_blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ip_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ip_blocks_id_seq OWNED BY public.ip_blocks.id;


--
-- Name: list_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.list_accounts (
    id bigint NOT NULL,
    list_id bigint NOT NULL,
    account_id bigint NOT NULL,
    follow_id bigint,
    follow_request_id bigint
);


--
-- Name: list_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.list_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: list_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.list_accounts_id_seq OWNED BY public.list_accounts.id;


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    title character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    replies_policy integer DEFAULT 0 NOT NULL,
    exclusive boolean DEFAULT false NOT NULL
);


--
-- Name: lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lists_id_seq OWNED BY public.lists.id;


--
-- Name: login_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_activities (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    authentication_method character varying,
    provider character varying,
    success boolean,
    failure_reason character varying,
    ip inet,
    user_agent character varying,
    created_at timestamp without time zone
);


--
-- Name: login_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_activities_id_seq OWNED BY public.login_activities.id;


--
-- Name: markers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markers (
    id bigint NOT NULL,
    user_id bigint,
    timeline character varying DEFAULT ''::character varying NOT NULL,
    last_read_id bigint DEFAULT 0 NOT NULL,
    lock_version integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: markers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.markers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: markers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.markers_id_seq OWNED BY public.markers.id;


--
-- Name: media_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_attachments (
    status_id bigint,
    file_file_name character varying,
    file_content_type character varying,
    file_file_size integer,
    file_updated_at timestamp without time zone,
    remote_url character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    shortcode character varying,
    type integer DEFAULT 0 NOT NULL,
    file_meta json,
    account_id bigint,
    id bigint DEFAULT public.timestamp_id('media_attachments'::text) NOT NULL,
    description text,
    scheduled_status_id bigint,
    blurhash character varying,
    processing integer,
    file_storage_schema_version integer,
    thumbnail_file_name character varying,
    thumbnail_content_type character varying,
    thumbnail_file_size integer,
    thumbnail_updated_at timestamp without time zone,
    thumbnail_remote_url character varying
);


--
-- Name: media_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_attachments_id_seq OWNED BY public.media_attachments.id;


--
-- Name: mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentions (
    status_id bigint NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    silent boolean DEFAULT false NOT NULL
);


--
-- Name: mentions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mentions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mentions_id_seq OWNED BY public.mentions.id;


--
-- Name: mutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mutes (
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    hide_notifications boolean DEFAULT true NOT NULL,
    account_id bigint NOT NULL,
    id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    expires_at timestamp without time zone
);


--
-- Name: mutes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mutes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mutes_id_seq OWNED BY public.mutes.id;


--
-- Name: notification_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_permissions (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    from_account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: notification_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_permissions_id_seq OWNED BY public.notification_permissions.id;


--
-- Name: notification_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_policies (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    for_not_following integer DEFAULT 0 NOT NULL,
    for_not_followers integer DEFAULT 0 NOT NULL,
    for_new_accounts integer DEFAULT 0 NOT NULL,
    for_private_mentions integer DEFAULT 1 NOT NULL,
    for_limited_accounts integer DEFAULT 1 NOT NULL
);


--
-- Name: notification_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_policies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_policies_id_seq OWNED BY public.notification_policies.id;


--
-- Name: notification_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_requests (
    id bigint DEFAULT public.timestamp_id('notification_requests'::text) NOT NULL,
    account_id bigint NOT NULL,
    from_account_id bigint NOT NULL,
    last_status_id bigint,
    notifications_count bigint DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: notification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_requests_id_seq OWNED BY public.notification_requests.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    activity_id bigint NOT NULL,
    activity_type character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    account_id bigint NOT NULL,
    from_account_id bigint NOT NULL,
    id bigint NOT NULL,
    type character varying,
    filtered boolean DEFAULT false NOT NULL,
    group_key character varying
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: oauth_access_grants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_access_grants (
    token character varying NOT NULL,
    expires_in integer NOT NULL,
    redirect_uri text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    revoked_at timestamp without time zone,
    scopes character varying,
    application_id bigint NOT NULL,
    id bigint NOT NULL,
    resource_owner_id bigint NOT NULL,
    code_challenge character varying,
    code_challenge_method character varying
);


--
-- Name: oauth_access_grants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oauth_access_grants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oauth_access_grants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_access_grants_id_seq OWNED BY public.oauth_access_grants.id;


--
-- Name: oauth_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_access_tokens (
    token character varying NOT NULL,
    refresh_token character varying,
    expires_in integer,
    revoked_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    scopes character varying,
    application_id bigint,
    id bigint NOT NULL,
    resource_owner_id bigint,
    last_used_at timestamp without time zone,
    last_used_ip inet
);


--
-- Name: oauth_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oauth_access_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oauth_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_access_tokens_id_seq OWNED BY public.oauth_access_tokens.id;


--
-- Name: oauth_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_applications (
    name character varying NOT NULL,
    uid character varying NOT NULL,
    secret character varying NOT NULL,
    redirect_uri text NOT NULL,
    scopes character varying DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    superapp boolean DEFAULT false NOT NULL,
    website character varying,
    owner_type character varying,
    id bigint NOT NULL,
    owner_id bigint,
    confidential boolean DEFAULT true NOT NULL
);


--
-- Name: oauth_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oauth_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oauth_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_applications_id_seq OWNED BY public.oauth_applications.id;


--
-- Name: pghero_space_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pghero_space_stats (
    id bigint NOT NULL,
    database text,
    schema text,
    relation text,
    size bigint,
    captured_at timestamp without time zone
);


--
-- Name: pghero_space_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pghero_space_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pghero_space_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pghero_space_stats_id_seq OWNED BY public.pghero_space_stats.id;


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id bigint NOT NULL,
    account_id bigint,
    poll_id bigint,
    choice integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    uri character varying
);


--
-- Name: poll_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.poll_votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: poll_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.poll_votes_id_seq OWNED BY public.poll_votes.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polls (
    id bigint NOT NULL,
    account_id bigint,
    status_id bigint,
    expires_at timestamp without time zone,
    options character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    cached_tallies bigint[] DEFAULT '{}'::bigint[] NOT NULL,
    multiple boolean DEFAULT false NOT NULL,
    hide_totals boolean DEFAULT false NOT NULL,
    votes_count bigint DEFAULT 0 NOT NULL,
    last_fetched_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    lock_version integer DEFAULT 0 NOT NULL,
    voters_count bigint
);


--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.polls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: preview_card_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preview_card_providers (
    id bigint NOT NULL,
    domain character varying DEFAULT ''::character varying NOT NULL,
    icon_file_name character varying,
    icon_content_type character varying,
    icon_file_size bigint,
    icon_updated_at timestamp without time zone,
    trendable boolean,
    reviewed_at timestamp without time zone,
    requested_review_at timestamp without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: preview_card_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preview_card_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preview_card_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preview_card_providers_id_seq OWNED BY public.preview_card_providers.id;


--
-- Name: preview_card_trends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preview_card_trends (
    id bigint NOT NULL,
    preview_card_id bigint NOT NULL,
    score double precision DEFAULT 0.0 NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    allowed boolean DEFAULT false NOT NULL,
    language character varying
);
    `)

    console.log(result)
  })
})