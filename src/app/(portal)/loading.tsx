export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="加载中">
      <div className="h-16 w-2/3 bg-[#e2e8ed] dark:bg-[#17283b]" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 border border-[var(--line)] bg-[var(--surface)]"
          />
        ))}
      </div>
    </div>
  );
}
