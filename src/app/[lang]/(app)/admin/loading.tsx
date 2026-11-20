import { getTr } from "@/i18n/app-server";
export default async function Loading() {
  const { tr } = await getTr();
  return (
    <div className="space-y-6" aria-busy="true" aria-label={tr("Loading")}>
      <div className="h-9 w-64 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
