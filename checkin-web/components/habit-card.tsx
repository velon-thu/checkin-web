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
      className={`relative rounded-2xl border transition-colors ${
        checked
          ? "border-green-200 bg-green-100 text-green-900 hover:bg-green-200"
          : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
      }`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className={`absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium transition ${
          checked
            ? "bg-white/80 text-green-800 hover:bg-white"
            : "bg-white text-zinc-500 hover:bg-zinc-100"
        }`}
        aria-label={`删除${name}`}
      >
        删除
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="block w-full rounded-2xl px-6 py-8 text-center"
      >
        <div className="text-lg font-medium">{name}</div>
        <div className="mt-3 text-sm">{`已坚持 ${streak} 天`}</div>
      </button>
    </article>
  );
}
