"use client";

import { useState } from "react";
import AddHabitForm from "@/components/add-habit-form";
import HabitCard from "@/components/habit-card";
import HistoryList from "@/components/history-list";

type CheckInItem = {
  id: string;
  name: string;
};

type CheckInHistoryItem = {
  id: string;
  name: string;
  date: string;
  habitId: string;
};

type HabitTrackerClientProps = {
  initialHabits: CheckInItem[];
  initialHistoryRecords: CheckInHistoryItem[];
  initialCheckinDatesByHabit: Record<string, string[]>;
};

type AddHabitMutationResult =
  | { ok: false; message: "empty" | "error" }
  | { ok: true; habit: { id: string; name: string } };

type DeleteHabitMutationResult =
  | { ok: false; message: "invalid_id" | "not_found" | "error" }
  | { ok: true; id: number };

type ToggleCheckinMutationResult =
  | {
      ok: false;
      message: "invalid_habit_id" | "invalid_date" | "not_found" | "error";
    }
  | { ok: true; checked: boolean };

const addHabitRequest = async (
  name: string,
): Promise<AddHabitMutationResult> => {
  const response = await fetch("/api/habits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const result = (await response.json()) as AddHabitMutationResult;

  return result;
};

const deleteHabitRequest = async (
  id: number,
): Promise<DeleteHabitMutationResult> => {
  const response = await fetch("/api/habits", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const result = (await response.json()) as DeleteHabitMutationResult;

  return result;
};

const toggleCheckinRequest = async (
  habitId: number,
  date: string,
): Promise<ToggleCheckinMutationResult> => {
  const response = await fetch("/api/checkins/toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ habitId, date }),
  });

  const result = (await response.json()) as ToggleCheckinMutationResult;

  return result;
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPreviousDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const previousDate = new Date(year, month - 1, day);

  previousDate.setDate(previousDate.getDate() - 1);

  return getTodayDateFromDate(previousDate);
};

const getTodayDateFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getHabitStreak = (
  checkInDatesByHabit: Record<string, string[]>,
  habitId: string,
  today: string,
) => {
  const checkedDates = new Set(checkInDatesByHabit[habitId] ?? []);
  let streak = 0;
  let currentDate = today;

  while (checkedDates.has(currentDate)) {
    streak += 1;
    currentDate = getPreviousDate(currentDate);
  }

  return streak;
};

export default function HabitTrackerClient({
  initialHabits,
  initialHistoryRecords,
  initialCheckinDatesByHabit,
}: HabitTrackerClientProps) {
  const [checkInItems, setCheckInItems] =
    useState<CheckInItem[]>(initialHabits);
  const [checkInHistory, setCheckInHistory] =
    useState<CheckInHistoryItem[]>(initialHistoryRecords);
  const [checkInDatesByHabit, setCheckInDatesByHabit] = useState<
    Record<string, string[]>
  >(initialCheckinDatesByHabit);
  const [newItemName, setNewItemName] = useState("");
  const today = getTodayDate();
  const checkedItemIdsToday = new Set(
    Object.entries(checkInDatesByHabit)
      .filter(([, checkedDates]) => checkedDates.includes(today))
      .map(([habitId]) => habitId),
  );
  const checkedCount = checkInItems.filter((item) =>
    checkedItemIdsToday.has(item.id),
  ).length;
  const totalCount = checkInItems.length;

  const handleToggleCheckIn = async (id: string) => {
    const targetItem = checkInItems.find((item) => item.id === id);

    if (!targetItem) {
      return;
    }

    const habitId = Number(id);

    if (!Number.isInteger(habitId) || habitId <= 0) {
      return;
    }

    const result = await toggleCheckinRequest(habitId, today);

    if (!result.ok) {
      return;
    }

    setCheckInDatesByHabit((currentDatesByHabit) => {
      const currentDates = currentDatesByHabit[id] ?? [];
      const filteredDates = currentDates.filter((date) => date !== today);

      if (!result.checked) {
        return {
          ...currentDatesByHabit,
          [id]: filteredDates,
        };
      }

      return {
        ...currentDatesByHabit,
        [id]: [today, ...filteredDates],
      };
    });

    setCheckInHistory((currentHistory) => {
      const filteredHistory = currentHistory.filter(
        (historyItem) => !(historyItem.habitId === id && historyItem.date === today),
      );

      if (!result.checked) {
        return filteredHistory;
      }

      return [
        {
          id: targetItem.id,
          name: targetItem.name,
          date: today,
          habitId: targetItem.id,
        },
        ...filteredHistory,
      ];
    });
  };

  const handleAddItem = async () => {
    const trimmedName = newItemName.trim();

    if (!trimmedName) {
      return;
    }

    const normalizedName = trimmedName.toLocaleLowerCase();
    const hasDuplicate = checkInItems.some(
      (item) => item.name.trim().toLocaleLowerCase() === normalizedName,
    );

    if (hasDuplicate) {
      return;
    }

    const result = await addHabitRequest(trimmedName);

    if (!result.ok) {
      return;
    }

    setCheckInItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) =>
          item.id === result.habit.id ||
          item.name.trim().toLocaleLowerCase() === normalizedName,
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [...currentItems, result.habit];
    });
    setNewItemName("");
  };

  const handleDeleteItem = async (id: string) => {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      setCheckInItems((currentItems) =>
        currentItems.filter((item) => item.id !== id),
      );
      setCheckInDatesByHabit((currentDatesByHabit) => {
        const remainingDatesByHabit = { ...currentDatesByHabit };

        delete remainingDatesByHabit[id];

        return remainingDatesByHabit;
      });
      setCheckInHistory((currentHistory) =>
        currentHistory.filter((historyItem) => historyItem.habitId !== id),
      );
      return;
    }

    const result = await deleteHabitRequest(numericId);

    if (!result.ok) {
      return;
    }

    setCheckInItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
    setCheckInDatesByHabit((currentDatesByHabit) => {
      const remainingDatesByHabit = { ...currentDatesByHabit };

      delete remainingDatesByHabit[id];

      return remainingDatesByHabit;
    });
    setCheckInHistory((currentHistory) =>
      currentHistory.filter((historyItem) => historyItem.habitId !== id),
    );
  };

  return (
    <>
      <AddHabitForm
        value={newItemName}
        onChange={setNewItemName}
        onAdd={handleAddItem}
      />

      <div className="app-panel mt-6 rounded-[30px] p-3 sm:p-4">
        <div className="relative z-10 grid gap-3 sm:grid-cols-2">
          <div className="soft-panel rounded-[24px] px-5 py-4 text-center sm:text-left">
            <p className="text-sm font-medium text-zinc-500">Checked In Today</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-900">
              {checkedCount} items
            </p>
          </div>
          <div className="soft-panel rounded-[24px] px-5 py-4 text-center sm:text-left">
            <p className="text-sm font-medium text-zinc-500">Total Habits</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-900">
              {totalCount} items
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checkInItems.map((item) => {
          const isCheckedIn = checkedItemIdsToday.has(item.id);
          const streak = getHabitStreak(checkInDatesByHabit, item.id, today);

          return (
            <HabitCard
              key={item.id}
              name={item.name}
              checked={isCheckedIn}
              streak={streak}
              onToggle={() => handleToggleCheckIn(item.id)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          );
        })}
      </div>

      <HistoryList historyRecords={checkInHistory} />
    </>
  );
}
