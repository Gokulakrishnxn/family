export default function Loading() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="skeleton h-9 w-32 rounded-lg bg-card" />
      <div className="skeleton h-16 rounded-[20px] bg-card" />
      <div className="skeleton h-40 rounded-[20px] bg-card" />
      <div className="grid grid-cols-4 gap-2">
        <div className="skeleton mx-auto size-12 rounded-2xl bg-card" />
        <div className="skeleton mx-auto size-12 rounded-2xl bg-card" />
        <div className="skeleton mx-auto size-12 rounded-2xl bg-card" />
        <div className="skeleton mx-auto size-12 rounded-2xl bg-card" />
      </div>
    </div>
  );
}
