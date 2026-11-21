-- LET'S TALK - Production Inventory Validation
-- Run only after schema.sql, 001_reference_data.sql and 002_production_content.sql.

-- 1. Human-readable inventory report.
SELECT
    t.code AS topic,
    cg.code AS content_group,
    c.content_type,
    COUNT(*) AS total_items,
    COUNT(*) FILTER (WHERE c.is_active) AS active_items,
    COUNT(*) FILTER (WHERE NOT c.is_active) AS inactive_items
FROM public.content_items c
JOIN public.content_groups cg ON cg.id = c.content_group_id
JOIN public.topics t ON t.id = cg.topic_id
GROUP BY t.code, cg.code, c.content_type
ORDER BY t.code, cg.display_order, c.content_type;

-- 2. Strict assertions: fail the transaction if any required inventory rule fails.
DO $$
DECLARE
    actual_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM public.topics;
    IF actual_count <> 2 THEN
        RAISE EXCEPTION 'Expected 2 topics, found %', actual_count;
    END IF;

    SELECT COUNT(*) INTO actual_count FROM public.gameplay_modes;
    IF actual_count <> 4 THEN
        RAISE EXCEPTION 'Expected 4 gameplay modes, found %', actual_count;
    END IF;

    SELECT COUNT(*) INTO actual_count FROM public.content_groups;
    IF actual_count <> 16 THEN
        RAISE EXCEPTION 'Expected 16 content groups, found %', actual_count;
    END IF;

    SELECT COUNT(*) INTO actual_count FROM public.content_group_allowed_types;
    IF actual_count <> 18 THEN
        RAISE EXCEPTION 'Expected 18 allowed-type mappings, found %', actual_count;
    END IF;

    SELECT COUNT(*) INTO actual_count FROM public.content_items;
    IF actual_count <> 880 THEN
        RAISE EXCEPTION 'Expected 880 content items, found %', actual_count;
    END IF;

    SELECT COUNT(*) INTO actual_count
      FROM public.content_items
     WHERE is_active;
    IF actual_count <> 880 THEN
        RAISE EXCEPTION 'Expected 880 active items, found %', actual_count;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.topics t
        LEFT JOIN public.content_groups cg ON cg.topic_id = t.id
        GROUP BY t.id, t.code
        HAVING COUNT(cg.id) <> 8
    ) THEN
        RAISE EXCEPTION 'Each topic must have exactly 8 content groups';
    END IF;

    -- Exact group/type inventory.
    IF EXISTS (
        WITH expected(topic_code, group_code, content_type, expected_count) AS (
            VALUES
            ('friends','question_zone','question',100),
            ('friends','truth','question',50),
            ('friends','challenge','challenge',50),
            ('friends','double_challenge','challenge',50),
            ('friends','everyone_answers','question',50),
            ('friends','surprise_question','question',50),
            ('friends','pick_a_player','question',20),
            ('friends','pick_a_player','challenge',20),
            ('friends','hot_seat','question',50),
            ('family','question_zone','question',100),
            ('family','truth','question',50),
            ('family','challenge','challenge',50),
            ('family','double_challenge','challenge',50),
            ('family','everyone_answers','question',50),
            ('family','surprise_question','question',50),
            ('family','pick_a_player','question',20),
            ('family','pick_a_player','challenge',20),
            ('family','hot_seat','question',50)
        ),
        actual AS (
            SELECT t.code AS topic_code, cg.code AS group_code,
                   c.content_type, COUNT(c.id) AS actual_count
            FROM public.content_groups cg
            JOIN public.topics t ON t.id = cg.topic_id
            LEFT JOIN public.content_items c
              ON c.content_group_id = cg.id
             AND c.is_active
            GROUP BY t.code, cg.code, c.content_type
        )
        SELECT 1
        FROM expected e
        LEFT JOIN actual a
          ON a.topic_code = e.topic_code
         AND a.group_code = e.group_code
         AND a.content_type = e.content_type
        WHERE COALESCE(a.actual_count, 0) <> e.expected_count
    ) THEN
        RAISE EXCEPTION 'One or more content groups have incorrect type/count inventory';
    END IF;

    -- Allowed-type mappings must match the exact approved 18-row matrix.
    IF EXISTS (
        WITH expected(topic_code, group_code, content_type) AS (
            VALUES
            ('friends','question_zone','question'),
            ('friends','truth','question'),
            ('friends','challenge','challenge'),
            ('friends','double_challenge','challenge'),
            ('friends','everyone_answers','question'),
            ('friends','surprise_question','question'),
            ('friends','pick_a_player','question'),
            ('friends','pick_a_player','challenge'),
            ('friends','hot_seat','question'),
            ('family','question_zone','question'),
            ('family','truth','question'),
            ('family','challenge','challenge'),
            ('family','double_challenge','challenge'),
            ('family','everyone_answers','question'),
            ('family','surprise_question','question'),
            ('family','pick_a_player','question'),
            ('family','pick_a_player','challenge'),
            ('family','hot_seat','question')
        ),
        actual AS (
            SELECT t.code AS topic_code, cg.code AS group_code, a.content_type
            FROM public.content_group_allowed_types a
            JOIN public.content_groups cg ON cg.id = a.content_group_id
            JOIN public.topics t ON t.id = cg.topic_id
        )
        SELECT 1
        FROM (
            (SELECT * FROM expected EXCEPT SELECT * FROM actual)
            UNION ALL
            (SELECT * FROM actual EXCEPT SELECT * FROM expected)
        ) differences
    ) THEN
        RAISE EXCEPTION 'Allowed-type mappings do not match the exact approved 18-row matrix';
    END IF;

    -- No extra content types outside the approved inventory.
    IF EXISTS (
        SELECT 1
        FROM public.content_items c
        JOIN public.content_groups cg ON cg.id = c.content_group_id
        WHERE NOT (
            (cg.code IN ('question_zone','truth','everyone_answers','surprise_question','hot_seat')
                AND c.content_type = 'question')
            OR (cg.code IN ('challenge','double_challenge') AND c.content_type = 'challenge')
            OR (cg.code = 'pick_a_player' AND c.content_type IN ('question','challenge'))
        )
    ) THEN
        RAISE EXCEPTION 'Found content type assigned to an invalid group';
    END IF;

    -- Global normalized duplicate check (the unique index should also enforce this).
    SELECT COUNT(*) INTO actual_count
    FROM (
        SELECT lower(normalize(
            btrim(regexp_replace(content_text, '[[:space:]]+', ' ', 'g')),
            NFC
        )) AS normalized_text
        FROM public.content_items
        GROUP BY 1
        HAVING COUNT(*) > 1
    ) duplicates;
    IF actual_count > 0 THEN
        RAISE EXCEPTION 'Found % normalized duplicate content groups', actual_count;
    END IF;

    RAISE NOTICE 'LET''S TALK inventory validation PASSED: 880 active items, exact group/type counts, no normalized duplicates.';
END;
$$;
