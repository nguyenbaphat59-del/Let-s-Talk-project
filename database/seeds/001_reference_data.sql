-- ============================================================================
-- LET'S TALK - Reference Seed Data
-- Seeds: 2 topics, 4 gameplay modes, 16 content groups, 18 allowed-type rows.
-- Safe to re-run against the schema created by ../schema.sql.
-- Does NOT insert the 880 question/challenge texts.
-- ============================================================================

BEGIN;

-- 1. Topics
INSERT INTO public.topics (id, code, name, description, is_active)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'friends', 'Friends',
     'Questions and activities designed for groups of friends.', TRUE),
    ('22222222-2222-4222-8222-222222222222', 'family', 'Family',
     'Questions and activities designed for family members.', TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 2. Four main gameplay families. IDs are stable system reference IDs.
INSERT INTO public.gameplay_modes
    (id, code, name, description, display_order, is_active)
VALUES
    (1, 'question_zone', 'Question Zone',
     'Main question-based gameplay activity.', 1, TRUE),
    (2, 'pick_your_fate', 'Pick Your Fate',
     'Players choose between Truth and Challenge, including Mystery.', 2, TRUE),
    (3, 'random_event', 'Random Event',
     'Unexpected activities selected from four dedicated sub-activities.', 3, TRUE),
    (4, 'hot_seat', 'Hot Seat',
     'Special questions for focused interaction.', 4, TRUE)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- 3. Eight content groups per topic (16 total).
-- Group UUIDs are stable seed identifiers. Topic IDs are resolved by code.
WITH group_seed (
    topic_code, group_id, group_code, group_name, gameplay_mode_id, display_order
) AS (
    VALUES
    ('friends', 'f0000001-0000-4000-8000-000000000001'::uuid, 'question_zone', 'Question Zone', 1::smallint, 1::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000002'::uuid, 'truth', 'Truth', 2::smallint, 2::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000003'::uuid, 'challenge', 'Challenge', 2::smallint, 3::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000004'::uuid, 'double_challenge', 'Double Challenge', 3::smallint, 4::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000005'::uuid, 'everyone_answers', 'Everyone Answers', 3::smallint, 5::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000006'::uuid, 'surprise_question', 'Surprise Question', 3::smallint, 6::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000007'::uuid, 'pick_a_player', 'Pick a Player', 3::smallint, 7::smallint),
    ('friends', 'f0000001-0000-4000-8000-000000000008'::uuid, 'hot_seat', 'Hot Seat', 4::smallint, 8::smallint),

    ('family', 'a0000001-0000-4000-8000-000000000001'::uuid, 'question_zone', 'Question Zone', 1::smallint, 1::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000002'::uuid, 'truth', 'Truth', 2::smallint, 2::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000003'::uuid, 'challenge', 'Challenge', 2::smallint, 3::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000004'::uuid, 'double_challenge', 'Double Challenge', 3::smallint, 4::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000005'::uuid, 'everyone_answers', 'Everyone Answers', 3::smallint, 5::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000006'::uuid, 'surprise_question', 'Surprise Question', 3::smallint, 6::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000007'::uuid, 'pick_a_player', 'Pick a Player', 3::smallint, 7::smallint),
    ('family', 'a0000001-0000-4000-8000-000000000008'::uuid, 'hot_seat', 'Hot Seat', 4::smallint, 8::smallint)
)
INSERT INTO public.content_groups
    (id, topic_id, gameplay_mode_id, code, name, display_order, is_active)
SELECT
    gs.group_id,
    t.id,
    gs.gameplay_mode_id,
    gs.group_code,
    gs.group_name,
    gs.display_order,
    TRUE
FROM group_seed gs
JOIN public.topics t ON t.code = gs.topic_code
ON CONFLICT (topic_id, code) DO UPDATE
SET gameplay_mode_id = EXCLUDED.gameplay_mode_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- 4. Allowed content types: 9 mappings per topic, 18 total.
WITH allowed_seed (topic_code, group_code, content_type) AS (
    VALUES
    ('friends', 'question_zone', 'question'),
    ('friends', 'truth', 'question'),
    ('friends', 'challenge', 'challenge'),
    ('friends', 'double_challenge', 'challenge'),
    ('friends', 'everyone_answers', 'question'),
    ('friends', 'surprise_question', 'question'),
    ('friends', 'pick_a_player', 'question'),
    ('friends', 'pick_a_player', 'challenge'),
    ('friends', 'hot_seat', 'question'),
    ('family', 'question_zone', 'question'),
    ('family', 'truth', 'question'),
    ('family', 'challenge', 'challenge'),
    ('family', 'double_challenge', 'challenge'),
    ('family', 'everyone_answers', 'question'),
    ('family', 'surprise_question', 'question'),
    ('family', 'pick_a_player', 'question'),
    ('family', 'pick_a_player', 'challenge'),
    ('family', 'hot_seat', 'question')
)
INSERT INTO public.content_group_allowed_types (content_group_id, content_type)
SELECT cg.id, a.content_type
FROM allowed_seed a
JOIN public.topics t ON t.code = a.topic_code
JOIN public.content_groups cg
  ON cg.topic_id = t.id
 AND cg.code = a.group_code
ON CONFLICT (content_group_id, content_type) DO NOTHING;

COMMIT;

-- Expected after this file:
-- topics = 2
-- gameplay_modes = 4
-- content_groups = 16
-- content_group_allowed_types = 18
-- content_items = 0 until production content is imported
