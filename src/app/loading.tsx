export default function Loading() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="skeleton h-8 w-40 rounded-lg bg-muted" />
      <div className="skeleton h-48 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-24 rounded-2xl bg-muted" />
        <div className="skeleton h-24 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
