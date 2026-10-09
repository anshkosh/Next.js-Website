export type VoteDirection = -1 | 0 | 1;
export type VoteCounts = { upvoteCount: number; downvoteCount: number };

export function signalCount(counts: VoteCounts) {
  return counts.upvoteCount - counts.downvoteCount;
}

export function voteTransition(current: VoteDirection, requested: -1 | 1) {
  const next: VoteDirection = current === requested ? 0 : requested;
  return {
    next,
    upvoteDelta: Number(next === 1) - Number(current === 1),
    downvoteDelta: Number(next === -1) - Number(current === -1),
  };
}

export function visitorVote(upvotes?: { id: string }[], downvotes?: { id: string }[]): VoteDirection {
  return upvotes?.length ? 1 : downvotes?.length ? -1 : 0;
}
