-- =============================================================================
-- seed.sql  –  Initial seed data for the Secure Task Management System
-- =============================================================================
--
-- Run AFTER the application has started at least once so that TypeORM
-- (synchronize: true) has already created all tables and sequences.
--
-- Usage – Docker Compose:
--   docker compose cp apps/api/src/seed/seed.sql task_db:/seed.sql
--   docker compose exec task_db psql -U taskuser -d taskdb -f /seed.sql
--
-- Usage – direct psql (PostgreSQL exposed on host port 5435):
--   psql -h localhost -p 5435 -U taskuser -d taskdb \
--        -f apps/api/src/seed/seed.sql
--
-- Default credentials created by this script:
--   owner@example.com   /  OwnerPass123!   →  Owner  (full access, all orgs)
--   admin@example.com   /  AdminPass123!   →  Admin  (create/edit/delete in org)
--   viewer@example.com  /  ViewerPass123!  →  Viewer (read-only, own org)
--
-- All INSERTs use ON CONFLICT … DO NOTHING so the script is safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permission (id, "createdAt", "updatedAt", status, name) VALUES
  (1, NOW(), NOW(), 'active', 'task:create'),
  (2, NOW(), NOW(), 'active', 'task:read'),
  (3, NOW(), NOW(), 'active', 'task:update'),
  (4, NOW(), NOW(), 'active', 'task:delete'),
  (5, NOW(), NOW(), 'active', 'audit:read'),
  (6, NOW(), NOW(), 'active', 'user:manage')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Roles
-- ---------------------------------------------------------------------------
INSERT INTO role (id, "createdAt", "updatedAt", status, name) VALUES
  (1, NOW(), NOW(), 'active', 'owner'),
  (2, NOW(), NOW(), 'active', 'admin'),
  (3, NOW(), NOW(), 'active', 'viewer')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Role ↔ Permission assignments  (join table: role_permissions_permission)
-- ---------------------------------------------------------------------------
INSERT INTO role_permissions_permission ("roleId", "permissionId") VALUES
  -- owner: all permissions
  (1, 1),  -- owner  → task:create
  (1, 2),  -- owner  → task:read
  (1, 3),  -- owner  → task:update
  (1, 4),  -- owner  → task:delete
  (1, 5),  -- owner  → audit:read
  (1, 6),  -- owner  → user:manage
  -- admin: task CRUD + audit access
  (2, 1),  -- admin  → task:create
  (2, 2),  -- admin  → task:read
  (2, 3),  -- admin  → task:update
  (2, 4),  -- admin  → task:delete
  (2, 5),  -- admin  → audit:read
  -- viewer: read only
  (3, 2)   -- viewer → task:read
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Organizations  (2-level hierarchy: parent → child)
-- ---------------------------------------------------------------------------
INSERT INTO organization (id, "createdAt", "updatedAt", status, name, "parentId") VALUES
  (1, NOW(), NOW(), 'active', 'Test Corp',        NULL),
  (2, NOW(), NOW(), 'active', 'Test Engineering', 1),
  (3, NOW(), NOW(), 'active', 'Other Corp',       NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Users  (passwords are bcrypt-hashed, cost factor 10)
-- ---------------------------------------------------------------------------
INSERT INTO "user" (id, "createdAt", "updatedAt", status, email, password, "organizationId") VALUES
  (1, NOW(), NOW(), 'active', 'owner@example.com',
   '$2b$10$DnrPfDs9DFRz02qpPxAVIuDoWF9hhHMaUcJaOq0hKWNyzMbjNytti', 1),
  (2, NOW(), NOW(), 'active', 'admin@example.com',
   '$2b$10$A.i8YRpDpeaYgbY9oS7Qsek6ikhD/lt3AnbK4zmtVEF/12NVi9lcK', 1),
  (3, NOW(), NOW(), 'active', 'viewer@example.com',,
   '$2b$10$5FyWbpWJIIP/n3mui4No5eyZckOYdDNkUKi9uT.wdnD6wmdCv4.D2', 2),
  (4, NOW(), NOW(), 'active', 'adminOther@example.com',
   '$2b$10$A.i8YRpDpeaYgbY9oS7Qsek6ikhD/lt3AnbK4zmtVEF/12NVi9lcK', 3)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. User ↔ Role assignments  (join table: user_roles_role)
-- ---------------------------------------------------------------------------
INSERT INTO user_roles_role ("userId", "roleId") VALUES
  (1, 1),  -- owner@example.com  → owner role
  (2, 2),  -- admin@example.com  → admin role
  (3, 3),   -- viewer@example.com → viewer role
  (4, 2)   -- adminOther@example.com → admin role
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Reset sequences so future auto-generated IDs do not conflict
-- ---------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('permission',   'id'), MAX(id)) FROM permission;
SELECT setval(pg_get_serial_sequence('role',         'id'), MAX(id)) FROM role;
SELECT setval(pg_get_serial_sequence('organization', 'id'), MAX(id)) FROM organization;
SELECT setval(pg_get_serial_sequence('"user"',       'id'), MAX(id)) FROM "user";
