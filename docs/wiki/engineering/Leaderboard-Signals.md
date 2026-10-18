# Leaderboard signals

The homepage featured list and `/leaderboard` share `lib/leaderboard.ts` and
`lib/startup-signals.ts`. Featured membership remains curated, but ordering and
displayed ranks are global. Only LIVE startups are eligible; no demo entries are added.

All-time score = net votes + founder publishing points + community participation
points + founder discussion points:

- Votes: persisted upvote rows minus downvote rows; may be negative.
- Founder publishing: 2 per distinct UTC date, capped at 10 dates (20 points).
  Combine startup updates and approved, already-published PUBLIC founder journal
  entries by the startup's current owner. Edits do not create new publishing days.
- Community participation: 2 per normalized approved commenter email per startup,
  capped at 20 participants (40 points). Blank comments and the owner's email are excluded.
  Legacy imported comments without email fall back to normalized commenter names;
  blank names and the owner's name are excluded. Names are not verified identities.
- Discussions: 3 per eligible participant with a non-empty, dated founder reply,
  capped at 10 participants (30 points). Repeated comments/reply edits do not add points.

Anonymous votes and unverified comment emails do not identify unique verified
people. This is participation, not investment or verified traction.
Private/pending/rejected/future journal material cannot influence the score.
Removed or rejected comments/replies and deleted updates lose their contribution.

The database returns aggregate counts only, never commenter emails. Read counts,
assign competition ranks (1,2,2,4) and slice pages in a RepeatableRead transaction.
Ties are ordered by name then ID. Only the current page's profile fields and visitor
vote flags are loaded. The aggregate pass is O(number of live startups); revisit
database-side windowed pagination if the directory grows substantially.

The generated `Startup.signalCount` column remains **net votes** for backwards
compatibility. `leaderboardScore` is separate and is never written to this column.
Directory voting controls explicitly say “Net votes”; leaderboard controls include
activity points and each row exposes a component breakdown. Score-changing
server actions invalidate the homepage and leaderboard. Scheduled publication is
included on the next dynamic request; neither list is cross-request cached.

Tests cover caps, ordering, snapshot eligibility, privacy, pagination, tied ranks,
featured consistency, and optimistic voting with an activity bonus.

For PostgreSQL integration fixtures, set `SIGNALS_TEST_DATABASE_URL` and run
`npx tsx scripts/test-startup-signals-postgres.ts`. This uses only session-local
temporary tables and always rolls back, never application rows. It exercises
legacy imports, approval/visibility/ownership checks, duplicate participants,
removal of points, and UTC boundaries with a non-UTC database session. Raw date
parameters are converted explicitly to UTC naive timestamps to match Prisma's
timestamp-without-timezone storage, independent of the VPS session timezone.
