"use client";

import { useState } from "react";
import {
  addHabitAction,
  deleteHabitAction,
  toggleCheckinAction,
} from "@/app/actions";
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

    const result = await toggleCheckinAction(habitId, today);

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

    const result = await addHabitAction(trimmedName);

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

    const result = await deleteHabitAction(numericId);

    if (!result.ok && result.message !== "not_found") {
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

      <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center sm:text-left">
          <p className="text-sm text-zinc-500">今日已打卡</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {checkedCount} 项
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center sm:text-left">
          <p className="text-sm text-zinc-500">总项目数</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {totalCount} 项
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
