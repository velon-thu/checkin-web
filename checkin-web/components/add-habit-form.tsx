"use client";

type AddHabitFormProps = {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
};

export default function AddHabitForm({
  value,
  onChange,
  onAdd,
}: AddHabitFormProps) {
  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="输入新的打卡项目"
        className="h-12 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none transition focus:border-zinc-400"
      />
      <button
        type="button"
        onClick={onAdd}
        className="h-12 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        新增项目
      </button>
    </div>
  );
}
