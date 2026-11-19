export function sessionState(s: { status: string; opensAt: Date; closesAt: Date }, now = Date.now()) {
  if (s.status === "cancelled") return { key: "cancelled", label: "Cancelled", tone: "red" } as const;
  if (now < s.opensAt.getTime()) return { key: "upcoming", label: "Upcoming", tone: "blue" } as const;
  if (now < s.closesAt.getTime()) return { key: "open", label: "Open now", tone: "green" } as const;
  return { key: "closed", label: "Closed", tone: "grey" } as const;
}
