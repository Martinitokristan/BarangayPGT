# Migration Cleanup Plan — BarangayPGT

> Generated: March 2, 2026
> Status: **PLAN ONLY — nothing has been changed yet**

---

## Problem

We currently have **22 migration files**. Eight of them are "ALTER TABLE" patches
that add columns to tables created by earlier migrations. This makes the migration
folder messy and harder to maintain.

---

## Current 22 Files (in execution order)

| #   | Filename                                                      | Action    | Target Table                                                 |
| --- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| 1   | `2014_10_12_000000_create_users_table`                        | CREATE    | users                                                        |
| 2   | `2014_10_12_100000_create_password_resets_table`              | CREATE    | password_resets                                              |
| 3   | `2019_08_19_000000_create_failed_jobs_table`                  | CREATE    | failed_jobs                                                  |
| 4   | `2019_12_14_000001_create_personal_access_tokens_table`       | CREATE    | personal_access_tokens                                       |
| 5   | `2024_01_01_000001_create_barangays_table`                    | CREATE    | barangays                                                    |
| 6   | `2024_01_01_000002_add_fields_to_users_table`                 | **ALTER** | users ← adds role, barangay_id, phone, address, avatar       |
| 7   | `2024_01_01_000003_create_posts_table`                        | CREATE    | posts                                                        |
| 8   | `2024_01_01_000004_create_comments_table`                     | CREATE    | comments                                                     |
| 9   | `2024_01_01_000005_create_reactions_table`                    | CREATE    | reactions                                                    |
| 10  | `2024_01_01_000006_create_notifications_table`                | CREATE    | notifications                                                |
| 11  | `2026_02_23_155325_add_parent_id_and_likes_to_comments_table` | **ALTER** | comments ← adds parent_id, liked_by                          |
| 12  | `2026_02_26_161145_create_followers_table`                    | CREATE    | followers                                                    |
| 13  | `2026_02_27_041237_create_sms_logs_table`                     | CREATE    | sms_logs                                                     |
| 14  | `2026_02_27_054956_add_notify_and_snooze_to_followers_table`  | **ALTER** | followers ← adds notify, snoozed_until                       |
| 15  | `2026_02_27_075547_update_reaction_types_in_reactions_table`  | **ALTER** | reactions ← changes type enum → varchar                      |
| 16  | `2026_02_27_152626_add_cover_photo_to_users_table`            | **ALTER** | users ← adds cover_photo                                     |
| 17  | `2026_02_27_154006_create_events_table`                       | CREATE    | events                                                       |
| 18  | `2026_02_27_182350_add_id_and_approval_to_users_table`        | **ALTER** | users ← adds id_front_path, id_back_path, is_approved        |
| 19  | `2026_02_28_083738_add_verification_code_to_users_table`      | **ALTER** | users ← adds verification_code, verification_code_expires_at |
| 20  | `2026_02_28_000001_create_trusted_devices_table`              | CREATE    | trusted_devices                                              |
| 21  | `2026_03_01_000010_add_demographic_fields_to_users_table`     | **ALTER** | users ← adds sex, birth_date, age, purok_address             |
| 22  | `2026_03_02_000001_create_pending_registrations_table`        | CREATE    | pending_registrations                                        |

### Summary: 14 CREATE + 8 ALTER patches

---

## Proposed Clean Migrations: 14 Files (zero ALTER patches)

All ALTER patches are merged into their parent CREATE migration.

| #   | New Filename                               | Merges From                     | Notes                                                              |
| --- | ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| 1   | `0001_create_barangays_table`              | #5                              | Unchanged. Must run first (FK target for users, posts, events).    |
| 2   | `0002_create_users_table`                  | #1 + #6 + #16 + #18 + #19 + #21 | **6 files → 1**. All user columns in one table.                    |
| 3   | `0003_create_password_resets_table`        | #2                              | Unchanged.                                                         |
| 4   | `0004_create_failed_jobs_table`            | #3                              | Unchanged.                                                         |
| 5   | `0005_create_personal_access_tokens_table` | #4                              | Unchanged.                                                         |
| 6   | `0006_create_posts_table`                  | #7                              | Unchanged. FK → users, barangays.                                  |
| 7   | `0007_create_comments_table`               | #8 + #11                        | **2 files → 1**. Includes parent_id and liked_by from the start.   |
| 8   | `0008_create_reactions_table`              | #9 + #15                        | **2 files → 1**. Uses VARCHAR(255) for type instead of ENUM.       |
| 9   | `0009_create_notifications_table`          | #10                             | Unchanged.                                                         |
| 10  | `0010_create_followers_table`              | #12 + #14                       | **2 files → 1**. Includes notify and snoozed_until from the start. |
| 11  | `0011_create_sms_logs_table`               | #13                             | Unchanged.                                                         |
| 12  | `0012_create_events_table`                 | #17                             | Unchanged.                                                         |
| 13  | `0013_create_trusted_devices_table`        | #20                             | Unchanged.                                                         |
| 14  | `0014_create_pending_registrations_table`  | #22                             | Unchanged.                                                         |

### Result: 22 files → 14 files (8 ALTER patches eliminated)

---

## Consolidated Table Schemas

### `users` (merged from 6 files)

```
id                              bigint unsigned  PK AUTO_INCREMENT
name                            varchar(255)     NOT NULL
email                           varchar(255)     NOT NULL UNIQUE
verification_code               varchar(6)       NULLABLE
verification_code_expires_at    timestamp        NULLABLE
role                            enum('resident','admin')  NOT NULL DEFAULT 'resident'
email_verified_at               timestamp        NULLABLE
password                        varchar(255)     NOT NULL
remember_token                  varchar(100)     NULLABLE
barangay_id                     bigint unsigned  NULLABLE  FK → barangays(id) ON DELETE SET NULL
phone                           varchar(255)     NULLABLE
sex                             enum('male','female','other')  NULLABLE
birth_date                      date             NULLABLE
age                             tinyint unsigned NULLABLE
address                         text             NULLABLE
purok_address                   varchar(255)     NULLABLE
avatar                          varchar(255)     NULLABLE
cover_photo                     varchar(255)     NULLABLE
id_front_path                   varchar(255)     NULLABLE
id_back_path                    varchar(255)     NULLABLE
is_approved                     tinyint(1)       NOT NULL DEFAULT 0
created_at                      timestamp        NULLABLE
updated_at                      timestamp        NULLABLE
```

### `comments` (merged from 2 files)

```
id            bigint unsigned  PK AUTO_INCREMENT
post_id       bigint unsigned  NOT NULL  FK → posts(id) ON DELETE CASCADE
user_id       bigint unsigned  NOT NULL  FK → users(id) ON DELETE CASCADE
body          text             NOT NULL
parent_id     bigint unsigned  NULLABLE  FK → comments(id) ON DELETE CASCADE
liked_by      json             NULLABLE
created_at    timestamp        NULLABLE
updated_at    timestamp        NULLABLE
```

### `reactions` (merged from 2 files)

```
id            bigint unsigned  PK AUTO_INCREMENT
post_id       bigint unsigned  NOT NULL  FK → posts(id) ON DELETE CASCADE
user_id       bigint unsigned  NOT NULL  FK → users(id) ON DELETE CASCADE
type          varchar(255)     NULLABLE
created_at    timestamp        NULLABLE
updated_at    timestamp        NULLABLE

UNIQUE(post_id, user_id)
```

### `followers` (merged from 2 files)

```
id              bigint unsigned  PK AUTO_INCREMENT
follower_id     bigint unsigned  NOT NULL  FK → users(id) ON DELETE CASCADE
following_id    bigint unsigned  NOT NULL  FK → users(id) ON DELETE CASCADE
notify          tinyint(1)       NOT NULL DEFAULT 0
snoozed_until   timestamp        NULLABLE
created_at      timestamp        NULLABLE
updated_at      timestamp        NULLABLE

UNIQUE(follower_id, following_id)
```

---

## Tables with NO changes (kept as-is)

- **barangays** — just reordered to run first
- **password_resets** — unchanged
- **failed_jobs** — unchanged
- **personal_access_tokens** — unchanged
- **posts** — unchanged
- **notifications** — unchanged
- **sms_logs** — unchanged
- **events** — unchanged
- **trusted_devices** — unchanged
- **pending_registrations** — unchanged

---

## Execution Steps

> ⚠️ **WARNING: `migrate:fresh` will DROP all tables and recreate them.**
> All existing data will be lost. Back up first if needed.

```bash
# Step 1: Back up the database (optional but recommended)
mysqldump -u root barangay_pgt > backup_before_migration_cleanup.sql

# Step 2: Delete old 22 migration files
# (They will be replaced by 14 new clean files)

# Step 3: Create the 14 new migration files
# (Copilot will generate these)

# Step 4: Run fresh migration
php artisan migrate:fresh

# Step 5: Re-seed if needed
php artisan db:seed
```

---

## Files to Delete (8 ALTER patches being absorbed)

These are the redundant files that get merged into their parent CREATE migration:

1. `2024_01_01_000002_add_fields_to_users_table.php` → merged into users
2. `2026_02_23_155325_add_parent_id_and_likes_to_comments_table.php` → merged into comments
3. `2026_02_27_054956_add_notify_and_snooze_to_followers_table.php` → merged into followers
4. `2026_02_27_075547_update_reaction_types_in_reactions_table.php` → merged into reactions
5. `2026_02_27_152626_add_cover_photo_to_users_table.php` → merged into users
6. `2026_02_27_182350_add_id_and_approval_to_users_table.php` → merged into users
7. `2026_02_28_083738_add_verification_code_to_users_table.php` → merged into users
8. `2026_03_01_000010_add_demographic_fields_to_users_table.php` → merged into users

---

## Ready?

When you approve this plan, Copilot will:

1. Delete all 22 old migration files
2. Create the 14 new clean migration files
3. Run `php artisan migrate:fresh`
4. Verify the schema matches the current live database exactly
