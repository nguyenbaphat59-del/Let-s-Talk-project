-- ============================================================================
-- LET'S TALK - PostgreSQL Database Schema
-- Target: Supabase PostgreSQL
-- Schema version: 1.1.0
-- Scope: Five approved core tables only
--
-- IMPORTANT
-- 1. Run this file against a NEW/empty Supabase project (or after reviewing
--    existing objects). It intentionally does not drop existing objects.
-- 2. This file creates the schema, constraints, indexes, triggers and RLS.
-- 3. Reference rows are in seeds/001_reference_data.sql.
-- 4. Production content is inserted by seeds/002_production_content.sql.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Schema permissions
-- ---------------------------------------------------------------------------
-- Supabase provides the anon role. The application uses the publishable key
-- from the Express Backend; no service-role/secret key is required at runtime.

GRANT USAGE ON SCHEMA public TO anon;

-- ---------------------------------------------------------------------------
-- 1. topics
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.topics (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(30)  NOT NULL,
    name        VARCHAR(80)  NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_topics_code UNIQUE (code),
    CONSTRAINT chk_topics_code
        CHECK (code IN ('friends', 'family')),
    CONSTRAINT chk_topics_name_not_blank
        CHECK (length(btrim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 2. gameplay_modes
-- ---------------------------------------------------------------------------
-- Stable IDs are seeded as 1..4. The CHECK binds each stable ID to its code,
-- preventing an accidental change that would invalidate content-group mapping.

CREATE TABLE IF NOT EXISTS public.gameplay_modes (
    id            SMALLINT     PRIMARY KEY,
    code          VARCHAR(40)  NOT NULL,
    name          VARCHAR(80)  NOT NULL,
    description   TEXT,
    display_order SMALLINT     NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_gameplay_modes_code UNIQUE (code),
    CONSTRAINT uq_gameplay_modes_display_order UNIQUE (display_order),
    CONSTRAINT chk_gameplay_modes_id_code
        CHECK (
            (id = 1 AND code = 'question_zone') OR
            (id = 2 AND code = 'pick_your_fate') OR
            (id = 3 AND code = 'random_event') OR
            (id = 4 AND code = 'hot_seat')
        ),
    CONSTRAINT chk_gameplay_modes_display_order
        CHECK (display_order BETWEEN 1 AND 4),
    CONSTRAINT chk_gameplay_modes_name_not_blank
        CHECK (length(btrim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 3. content_groups
-- ---------------------------------------------------------------------------
-- Each topic has eight independent groups. Cross-table mode/code consistency
-- is enforced by validate_content_group_mode() below.

CREATE TABLE IF NOT EXISTS public.content_groups (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id         UUID         NOT NULL,
    gameplay_mode_id SMALLINT     NOT NULL,
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(100) NOT NULL,
    display_order    SMALLINT     NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_content_groups_topic
        FOREIGN KEY (topic_id)
        REFERENCES public.topics (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_content_groups_gameplay_mode
        FOREIGN KEY (gameplay_mode_id)
        REFERENCES public.gameplay_modes (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT uq_content_groups_topic_code
        UNIQUE (topic_id, code),
    CONSTRAINT uq_content_groups_topic_order
        UNIQUE (topic_id, display_order),
    CONSTRAINT chk_content_groups_code
        CHECK (code IN (
            'question_zone',
            'truth',
            'challenge',
            'double_challenge',
            'everyone_answers',
            'surprise_question',
            'pick_a_player',
            'hot_seat'
        )),
    CONSTRAINT chk_content_groups_display_order
        CHECK (display_order BETWEEN 1 AND 8),
    CONSTRAINT chk_content_groups_name_not_blank
        CHECK (length(btrim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 4. content_group_allowed_types
-- ---------------------------------------------------------------------------
-- Composite primary key ensures one mapping per group/type pair.

CREATE TABLE IF NOT EXISTS public.content_group_allowed_types (
    content_group_id UUID        NOT NULL,
    content_type     VARCHAR(20) NOT NULL,

    CONSTRAINT pk_content_group_allowed_types
        PRIMARY KEY (content_group_id, content_type),
    CONSTRAINT fk_allowed_types_content_group
        FOREIGN KEY (content_group_id)
        REFERENCES public.content_groups (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT chk_allowed_types_content_type
        CHECK (content_type IN ('question', 'challenge'))
);

-- ---------------------------------------------------------------------------
-- 5. content_items
-- ---------------------------------------------------------------------------
-- The composite FK guarantees that a content item can only use a type allowed
-- by its content group. Session usage is deliberately NOT stored here.

CREATE TABLE IF NOT EXISTS public.content_items (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    content_group_id UUID         NOT NULL,
    content_type     VARCHAR(20)  NOT NULL,
    content_text     TEXT         NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_content_items_allowed_type
        FOREIGN KEY (content_group_id, content_type)
        REFERENCES public.content_group_allowed_types
            (content_group_id, content_type)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT chk_content_items_content_type
        CHECK (content_type IN ('question', 'challenge')),
    CONSTRAINT chk_content_items_text_not_blank
        CHECK (
            length(
                btrim(
                    regexp_replace(content_text, '[[:space:]]+', ' ', 'g')
                )
            ) > 0
        )
);

-- ---------------------------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------------------------
-- Unique constraints and primary keys already create their supporting indexes.
-- These are the additional indexes required by the approved access patterns.

CREATE INDEX IF NOT EXISTS idx_content_groups_gameplay_mode
    ON public.content_groups (gameplay_mode_id);

CREATE INDEX IF NOT EXISTS idx_content_items_active_group_type
    ON public.content_items (content_group_id, content_type)
    WHERE is_active = TRUE;

-- Global duplicate prevention across ALL topics and content groups.
-- Comparison normalization: trim, collapse whitespace, Unicode NFC, lowercase.
-- Original content_text remains unchanged for display.
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_items_normalized_text
    ON public.content_items (
        lower(
            normalize(
                btrim(regexp_replace(content_text, '[[:space:]]+', ' ', 'g')),
                NFC
            )
        )
    );

-- ---------------------------------------------------------------------------
-- 7. Trigger functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_content_group_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    expected_mode_id SMALLINT;
BEGIN
    expected_mode_id := CASE NEW.code
        WHEN 'question_zone'     THEN 1
        WHEN 'truth'             THEN 2
        WHEN 'challenge'         THEN 2
        WHEN 'double_challenge'  THEN 3
        WHEN 'everyone_answers'  THEN 3
        WHEN 'surprise_question' THEN 3
        WHEN 'pick_a_player'     THEN 3
        WHEN 'hot_seat'          THEN 4
        ELSE NULL
    END;

    IF expected_mode_id IS NULL THEN
        RAISE EXCEPTION 'Unsupported content group code: %', NEW.code
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.gameplay_mode_id IS DISTINCT FROM expected_mode_id THEN
        RAISE EXCEPTION
            'Content group code % must reference gameplay_mode_id %, received %',
            NEW.code, expected_mode_id, NEW.gameplay_mode_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

-- Validate allowed content types against the dedicated content group.
-- Pick a Player is the only group that accepts both questions and challenges.
CREATE OR REPLACE FUNCTION public.validate_content_group_allowed_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    group_code VARCHAR(50);
    type_is_allowed BOOLEAN;
BEGIN
    SELECT code
      INTO group_code
      FROM public.content_groups
     WHERE id = NEW.content_group_id;

    IF group_code IS NULL THEN
        RAISE EXCEPTION 'Unknown content_group_id: %', NEW.content_group_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    type_is_allowed := CASE group_code
        WHEN 'question_zone'     THEN NEW.content_type = 'question'
        WHEN 'truth'             THEN NEW.content_type = 'question'
        WHEN 'challenge'         THEN NEW.content_type = 'challenge'
        WHEN 'double_challenge'  THEN NEW.content_type = 'challenge'
        WHEN 'everyone_answers'  THEN NEW.content_type = 'question'
        WHEN 'surprise_question' THEN NEW.content_type = 'question'
        WHEN 'pick_a_player'     THEN NEW.content_type IN ('question', 'challenge')
        WHEN 'hot_seat'          THEN NEW.content_type = 'question'
        ELSE FALSE
    END;

    IF NOT type_is_allowed THEN
        RAISE EXCEPTION 'Content type % is not allowed for content group %',
            NEW.content_type, group_code
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

-- Prevent a content-group code change from making existing allowed-type
-- mappings invalid. This complements the mapping-table insert/update trigger.
CREATE OR REPLACE FUNCTION public.validate_existing_allowed_types_on_group_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.content_group_allowed_types a
        WHERE a.content_group_id = NEW.id
          AND NOT (
              (NEW.code IN ('question_zone','truth','everyone_answers','surprise_question','hot_seat')
                  AND a.content_type = 'question')
              OR (NEW.code IN ('challenge','double_challenge')
                  AND a.content_type = 'challenge')
              OR (NEW.code = 'pick_a_player'
                  AND a.content_type IN ('question','challenge'))
          )
    ) THEN
        RAISE EXCEPTION 'Changing content group % to code % would invalidate existing allowed types',
            NEW.id, NEW.code
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_topics_set_updated_at ON public.topics;
CREATE TRIGGER trg_topics_set_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_content_items_set_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_set_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_allowed_types_validate ON public.content_group_allowed_types;
CREATE TRIGGER trg_allowed_types_validate
BEFORE INSERT OR UPDATE OF content_group_id, content_type
ON public.content_group_allowed_types
FOR EACH ROW
EXECUTE FUNCTION public.validate_content_group_allowed_type();

DROP TRIGGER IF EXISTS trg_content_groups_validate_allowed_types ON public.content_groups;
CREATE TRIGGER trg_content_groups_validate_allowed_types
BEFORE UPDATE OF code
ON public.content_groups
FOR EACH ROW
WHEN (OLD.code IS DISTINCT FROM NEW.code)
EXECUTE FUNCTION public.validate_existing_allowed_types_on_group_change();

DROP TRIGGER IF EXISTS trg_content_groups_validate_mode ON public.content_groups;
CREATE TRIGGER trg_content_groups_validate_mode
BEFORE INSERT OR UPDATE OF code, gameplay_mode_id
ON public.content_groups
FOR EACH ROW
EXECUTE FUNCTION public.validate_content_group_mode();

-- ---------------------------------------------------------------------------
-- 9. Row Level Security (RLS)
-- ---------------------------------------------------------------------------
-- Public gameplay content is readable through the Backend's anon-scoped
-- Supabase client. No browser-side Supabase client is part of this design.
-- Runtime roles receive SELECT only. Writes are performed by trusted migration
-- / seed processes, not by the public application role.

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameplay_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_group_allowed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS topics_select_active ON public.topics;
CREATE POLICY topics_select_active
ON public.topics
FOR SELECT
TO anon
USING (is_active = TRUE);

DROP POLICY IF EXISTS gameplay_modes_select_active ON public.gameplay_modes;
CREATE POLICY gameplay_modes_select_active
ON public.gameplay_modes
FOR SELECT
TO anon
USING (is_active = TRUE);

DROP POLICY IF EXISTS content_groups_select_active ON public.content_groups;
CREATE POLICY content_groups_select_active
ON public.content_groups
FOR SELECT
TO anon
USING (
    is_active = TRUE
    AND EXISTS (
        SELECT 1
        FROM public.topics t
        WHERE t.id = content_groups.topic_id
          AND t.is_active = TRUE
    )
    AND EXISTS (
        SELECT 1
        FROM public.gameplay_modes gm
        WHERE gm.id = content_groups.gameplay_mode_id
          AND gm.is_active = TRUE
    )
);

DROP POLICY IF EXISTS allowed_types_select_active ON public.content_group_allowed_types;
CREATE POLICY allowed_types_select_active
ON public.content_group_allowed_types
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1
        FROM public.content_groups cg
        WHERE cg.id = content_group_allowed_types.content_group_id
          AND cg.is_active = TRUE
    )
);

DROP POLICY IF EXISTS content_items_select_active ON public.content_items;
CREATE POLICY content_items_select_active
ON public.content_items
FOR SELECT
TO anon
USING (
    is_active = TRUE
    AND EXISTS (
        SELECT 1
        FROM public.content_groups cg
        JOIN public.topics t
          ON t.id = cg.topic_id
        JOIN public.gameplay_modes gm
          ON gm.id = cg.gameplay_mode_id
        WHERE cg.id = content_items.content_group_id
          AND cg.is_active = TRUE
          AND t.is_active = TRUE
          AND gm.is_active = TRUE
    )
);

-- Remove inherited/public access, then grant the minimum runtime privilege.
REVOKE ALL ON TABLE
    public.topics,
    public.gameplay_modes,
    public.content_groups,
    public.content_group_allowed_types,
    public.content_items
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
    public.topics,
    public.gameplay_modes,
    public.content_groups,
    public.content_group_allowed_types,
    public.content_items
TO anon;

-- Trigger functions are invoked by their table triggers, not by API callers.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_content_group_mode() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_content_group_allowed_type() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_existing_allowed_types_on_group_change() FROM PUBLIC, anon, authenticated;

COMMIT;

-- End of schema.sql
