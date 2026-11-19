export function resultStatus(set: { status: string; publishAt: Date | null } | null | undefined, now: number) {
  if (!set) return { label: "Not calculated", tone: "grey" } as const;
  if (set.status === "draft") return { label: "Draft — needs approval", tone: "amber" } as const;
  if (set.status === "approved") return { label: "Approved — not published", tone: "blue" } as const;
  if (set.status === "published" && set.publishAt && set.publishAt.getTime() > now) return { label: "Scheduled", tone: "blue" } as const;
  if (set.status === "published") return { label: "Published", tone: "green" } as const;
  return { label: "Withdrawn", tone: "red" } as const;
}
