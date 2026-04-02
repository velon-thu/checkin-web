"use client";

type HabitCardProps = {
  name: string;
  checked: boolean;
  streak: number;
  onToggle: () => void;
  onDelete: () => void;
};

export default function HabitCard({
  name,
  checked,
  streak,
  onToggle,
  onDelete,
}: HabitCardProps) {
  return (
    <article
      className={`group relative isolate overflow-hidden rounded-[30px] border p-1 transition duration-300 ${
        checked
          ? "border-emerald-800/10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%),linear-gradient(135deg,rgba(33,111,79,0.98),rgba(20,61,45,1))] shadow-[0_28px_60px_-32px_rgba(20,61,45,0.9)]"
          : "border-white/80 bg-[radial-gradient(circle_at_top_right,rgba(214,228,219,0.84),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,240,228,0.92))] shadow-[0_24px_55px_-36px_rgba(23,33,27,0.45)]"
      }`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className={`absolute top-4 right-4 z-20 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
          checked
            ? "bg-white/16 text-emerald-50 backdrop-blur-md hover:bg-white/24"
            : "bg-white/90 text-zinc-500 shadow-sm hover:bg-white"
        }`}
        aria-label={`Delete ${name}`}
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="relative z-10 flex min-h-[176px] w-full cursor-pointer flex-col justify-between rounded-[26px] px-6 py-6 text-left transition duration-300 group-hover:-translate-y-1"
      >
        <div
          className={`max-w-[calc(100%-4.25rem)] text-[1.35rem] font-semibold tracking-[-0.03em] ${
            checked ? "text-white" : "text-zinc-900"
          }`}
        >
          {name}
        </div>
        <div
          className={`text-sm ${
            checked ? "text-emerald-50/90" : "text-zinc-600"
          }`}
        >{`${streak} day streak`}</div>
      </button>
    </article>
  );
}
