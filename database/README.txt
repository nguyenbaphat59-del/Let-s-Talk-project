LET'S TALK — COMPLETE DATABASE PACKAGE v1.1.0
================================================

Target
------
Supabase PostgreSQL.

This package contains the five-table database schema, reference rows,
and the complete 880-item production content inventory.

DATABASE MODEL
-------------
1. topics
2. gameplay_modes
3. content_groups
4. content_group_allowed_types
5. content_items

PRODUCTION CONTENT
------------------
Language: English, matching the current prototype and the existing content bank.

Friends: 440 items
- Question Zone: 100 questions
- Truth: 50 questions
- Challenge: 50 challenges
- Double Challenge: 50 challenges
- Everyone Answers: 50 questions
- Surprise Question: 50 questions
- Pick a Player: 20 questions + 20 challenges
- Hot Seat: 50 questions

Family: 440 items with the same breakdown.

Total: 880 content items (640 questions + 240 challenges).

CONTENT QUALITY / INDEPENDENCE
------------------------------
The existing 880-item draft was reused as the content baseline.
Ten exact duplicate prompts across independent groups were rewritten.
The production seed uses deterministic UUIDs derived from the source IDs.
A global normalized unique index and validation script prevent exact
duplicates after trimming, whitespace collapsing, Unicode NFC and lowercase.

The prompts are original editorial content prepared for this project;
they are not represented as externally researched or licensed material.
Please perform a final human playtest for tone and suitability with your
actual audience before public launch.

EXECUTION ORDER
---------------
Run these files in Supabase SQL Editor, in this exact order, on a NEW/EMPTY
Supabase project:

1. schema.sql
2. seeds/001_reference_data.sql
3. seeds/002_production_content.sql
4. validation/validate_inventory.sql

The validation script first prints the inventory report, then raises an
exception unless the exact expected inventory is present.

IMPORTANT
---------
- Do not run schema.sql over an existing production database without reviewing
  its current objects and planning a migration.
- Runtime access is read-only through the anon-scoped Supabase client from
  the Express Backend. Do not expose a service-role/secret key in frontend code.
- No user, player, game_session, session history, progression or used-content
  tables are included. Active session state and used IDs remain in Local Storage.
- The current package creates the schema and imports all 880 rows; it does not
  create the Supabase project or execute itself against your account.
