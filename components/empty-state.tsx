import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-champagne text-ink">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{text}</p>
    </div>
  );
}
