export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-72 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>
      <div className="h-72 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
