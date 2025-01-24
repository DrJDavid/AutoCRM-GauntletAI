# Database Migrations

This directory contains all database migrations for the AutoCRM project.

## Migration Naming Convention

Migrations follow this naming pattern:
```
YYYYMMDD_HHMMSS_description.sql
```

For example:
- `20240124_020000_initial_schema.sql`
- `20240124_020100_base_functions.sql`
- `20240124_020200_rls_policies.sql`

## Migration Types

We organize migrations into these categories:

1. **Schema Changes** - Table creation, alterations, or deletions
2. **Function Updates** - Database functions and procedures
3. **Policy Changes** - RLS policies and security settings
4. **Data Migrations** - Data transformations or backfills
5. **Fixes** - Bug fixes and patches

## Best Practices

1. **Idempotency**: All migrations should be idempotent (safe to run multiple times)
   - Use `CREATE TABLE IF NOT EXISTS`
   - Use `DROP TABLE IF EXISTS`
   - Use `CREATE OR REPLACE FUNCTION`

2. **Reversibility**: Include rollback commands in comments
   ```sql
   -- migrate:up
   CREATE TABLE example (...);

   -- migrate:down
   DROP TABLE example;
   ```

3. **Atomic Changes**: Each migration should be self-contained
   - Don't reference objects created in future migrations
   - Include all dependent objects in the same migration

4. **Documentation**: Comment complex changes
   - Explain WHY the change is needed
   - Document any assumptions
   - Note any dependencies

## Testing Migrations

Before applying migrations:
1. Test on a development database
2. Verify rollback procedures
3. Check RLS policies work as expected
4. Validate data integrity

## Emergency Rollback

If you need to rollback a migration:
1. Check the migration file for rollback commands
2. Apply the rollback in reverse chronological order
3. Verify database state after rollback
