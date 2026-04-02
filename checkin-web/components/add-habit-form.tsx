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
    <div className="rounded-[30px] border border-white/80 bg-white/72 p-3 shadow-[0_24px_55px_-36px_rgba(23,33,27,0.45)] backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter a new habit"
          className="relative z-10 h-14 flex-1 rounded-[22px] border border-white/80 bg-white/90 px-5 text-zinc-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:border-emerald-500/35 focus:ring-4 focus:ring-emerald-100"
        />
        <button
          type="button"
          onClick={onAdd}
          className="relative z-10 h-14 rounded-[22px] bg-[linear-gradient(135deg,#1e6a4b,#143d2d)] px-6 text-sm font-semibold text-white shadow-[0_18px_35px_-18px_rgba(20,61,45,0.92)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-18px_rgba(20,61,45,0.98)]"
        >
          Add Habit
        </button>
      </div>
    </div>
  );
}
