# Voting and net signals

A visitor has one active direction per startup. Selecting the same direction removes it; selecting the other switches it. Signals are all-time upvotes minus downvotes, including zero and negative totals. Equal scores share leaderboard ranks. Customer-validation evidence is a different concept.

Existing `Upvote` rows are preserved. `Downvote` stores the opposite direction with equivalent cookie and fingerprint uniqueness. `recordVote` locks the startup before reading either table and changing rows/counters in one transaction. The nightly reconciliation uses the same lock before recounting both tables. Individual identifiers are not sent to public cards.

`Startup.signalCount` is a PostgreSQL stored generated column (`upvoteCount - downvoteCount`), represented in Prisma with `dbgenerated()`. Never write it directly. Review future generated migrations for this column; Prisma does not fully model PostgreSQL generated-column DDL.

The additive migration `20261009050000_downvotes_and_signals` adds counts, a derived column, indexes and the new table. It does not rewrite or remove existing votes. The conservative automatic migration checker flags the cascade clauses on the new table, so review and apply this migration after a verified backup before releasing the new code. Keep the installed deployment controls unchanged. The previous release remains compatible with these additive columns and the separate table.

Public search matches published team names in `StartupFounder`; it does not search account emails, private account names or pending revisions. Search and Discover share the same predicate.
