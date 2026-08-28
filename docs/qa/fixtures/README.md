# Field-test fixtures

## `2026-08-22-landlord-field-test-db.sql`

The database the landlord field tests were run against — a full `pg_dump` of the throwaway
`ft-db` instance as it stood at the end of the second visit.

It is the starting condition behind both reports in the parent directory:

- `2026-08-22-landlord-field-test.md`
- `2026-08-25-landlord-field-retest.md`

**What is in it:** one tenant (Osei-Mensah Properties), 4 occupants, 3 properties, 12 units,
39 invoices. Kwabena's Adenta compound and East Legon flat; Akosua Boateng's GHS 14,400
two-year advance and her GHS 400 cash part-payment; Adjoa Mensima's GHS 20,400 advance recorded
through the advance-rent route; the closed plumbing job. Every figure quoted in the reports can
be traced back to a row in here.

**Why it is kept.** Re-running the field test against a fresh signup produces different data and
therefore different numbers, so the reports stop being checkable. This is the only copy of the
conditions they describe.

**Schema version.** Migrated to the branch numbering that was in force before the integration
merge — its `flyway_schema_history` records the OLD V159–V163. Restoring it and pointing a
current build at it will fail with a checksum mismatch on V159, which is correct and expected:

```
Migration checksum mismatch for migration version 159
```

To use it with a current build, restore it and then either drop the offending history rows or
run it read-only. Do not `flyway repair` — that would paper over the fact that genuinely
different migrations ran.

**Restore:**

```bash
docker exec -i <postgres-container> psql -U postgres -c 'CREATE DATABASE fieldtest'
docker exec -i <postgres-container> psql -U postgres -q fieldtest < 2026-08-22-landlord-field-test-db.sql
```

No real customer data: the tenant, the occupants and their money are all invented for the test.
