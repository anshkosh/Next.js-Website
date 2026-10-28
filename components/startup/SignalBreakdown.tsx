import type { LeaderboardEntry } from "@/lib/leaderboard";

export default function SignalBreakdown({ startup }: { startup: LeaderboardEntry }) {
  return <details className="mt-2 text-xs leading-relaxed text-gray-600">
    <summary className="cursor-pointer underline underline-offset-2">Signal breakdown<span className="sr-only"> for {startup.name}</span></summary>
    <ul className="mt-2 space-y-1">
      <li>Net votes: {startup.signalCount} ({startup.upvoteCount} up − {startup.downvoteCount} down)</li>
      <li>Founder publishing days: {startup.founderDays} · {2 * Math.min(startup.founderDays, 10)} points</li>
      <li>Community participants: {startup.backers} · {2 * Math.min(startup.backers, 20)} points</li>
      <li>Participants with founder replies: {startup.discussions} · {3 * Math.min(startup.discussions, 10)} points</li>
      <li className="font-semibold text-gray-900">Total signals: {startup.leaderboardScore}</li>
    </ul>
  </details>;
}
