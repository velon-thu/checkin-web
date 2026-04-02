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
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function HabitTrackerClient({
  initialHabits,
  initialHistoryRecords,
}: HabitTrackerClientProps) {
  const [checkInItems, setCheckInItems] =
    useState<CheckInItem[]>(initialHabits);
  const [checkInHistory, setCheckInHistory] =
    useState<CheckInHistoryItem[]>(initialHistoryRecords);
  const [newItemName, setNewItemName] = useState("");
  const today = getTodayDate();
  const checkedItemIdsToday = new Set(
    checkInHistory
      .filter((historyItem) => historyItem.date === today)
      .map((historyItem) => historyItem.habitId),
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

    setCheckInHistory((currentHistory) => {
      const filteredHistory = currentHistory.filter(
        (historyItem) =>
          !(
            historyItem.habitId === id &&
            historyItem.date === today
          ),
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
      setCheckInHistory((currentHistory) =>
        currentHistory.filter(
          (historyItem) => historyItem.habitId !== id,
        ),
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

          return (
            <HabitCard
              key={item.id}
              name={item.name}
              checked={isCheckedIn}
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
