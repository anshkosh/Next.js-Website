type StartupStatus = "DRAFT" | "PENDING_REVIEW" | "REJECTED" | "SUSPENDED" | "LIVE" | string;

export type StartupActionSummary = {
  id: string;
  name: string;
  status: StartupStatus;
  revision?: { status: string; notes?: string | null } | null;
  adminNotes?: string | null;
};

export type FounderNextStep = { title: string; detail: string; href: string; label: string };

export function founderSetupNextStep(startups: StartupActionSummary[]): FounderNextStep | null {
  if (startups.length === 0) {
    return {
      title: "Create your first startup listing",
      detail: "Add the basics to start a saved draft. You can complete the rest before sending it for review.",
      href: "/startup/new",
      label: "Create your startup",
    };
  }

  const draft = startups.find(startup => startup.status === "DRAFT");
  if (draft) return { title: `Finish ${draft.name}`, detail: "Complete your draft and send it for review.", href: `/startup/${draft.id}/edit`, label: "Continue draft" };

  const suspended = startups.find(startup => startup.status === "SUSPENDED");
  if (suspended) return { title: `${suspended.name}: listing suspended`, detail: "Contact the team for help with your listing.", href: "/contact", label: "Contact support" };

  const changes = startups.find(startup => startup.revision?.status === "CHANGES_REQUESTED" || startup.revision?.status === "REJECTED" || startup.status === "REJECTED");
  if (changes) return { title: `${changes.name}: changes need attention`, detail: changes.revision?.notes || changes.adminNotes || "Review the feedback and update your startup before resubmitting.", href: `/startup/${changes.id}/edit`, label: "Review feedback" };

  const pending = startups.find(startup => startup.status === "PENDING_REVIEW" || startup.revision?.status === "PENDING_REVIEW");
  if (pending) return { title: `${pending.name}: under review`, detail: "Your submission is awaiting review. You can check its current status on your dashboard.", href: "/dashboard", label: "Check review status" };

  return null;
}
