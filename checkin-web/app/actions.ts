"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

type AddHabitActionResult =
  | { ok: false; message: "empty" | "error" }
  | { ok: true; habit: { id: string; name: string } };

type DeleteHabitActionResult =
  | { ok: false; message: "invalid_id" | "not_found" }
  | { ok: true; id: number };

type ToggleCheckinActionResult =
  | {
      ok: false;
      message: "invalid_habit_id" | "invalid_date" | "not_found" | "error";
    }
  | { ok: true; checked: boolean };

export async function addHabitAction(
  name: string,
): Promise<AddHabitActionResult> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { ok: false, message: "empty" };
  }

  try {
    const habit = await prisma.habit.upsert({
      where: { name: trimmedName },
      update: {},
      create: { name: trimmedName },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/");

    return {
      ok: true,
      habit: {
        id: String(habit.id),
        name: habit.name,
      },
    };
  } catch {
    return { ok: false, message: "error" };
  }
}

export async function deleteHabitAction(
  id: number,
): Promise<DeleteHabitActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: "invalid_id" };
  }

  try {
    await prisma.habit.delete({
      where: { id },
    });

    revalidatePath("/");

    return { ok: true, id };
  } catch {
    return { ok: false, message: "not_found" };
  }
}

export async function toggleCheckinAction(
  habitId: number,
  date: string,
): Promise<ToggleCheckinActionResult> {
  if (!Number.isInteger(habitId) || habitId <= 0) {
    return { ok: false, message: "invalid_habit_id" };
  }

  const trimmedDate = date.trim();
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate);

  if (!isValidDate) {
    return { ok: false, message: "invalid_date" };
  }

  try {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true },
    });

    if (!habit) {
      return { ok: false, message: "not_found" };
    }

    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: trimmedDate,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingCheckin) {
      await prisma.checkin.delete({
        where: {
          habitId_date: {
            habitId,
            date: trimmedDate,
          },
        },
      });

      revalidatePath("/");

      return { ok: true, checked: false };
    }

    await prisma.checkin.create({
      data: {
        habitId,
        date: trimmedDate,
      },
    });

    revalidatePath("/");

    return { ok: true, checked: true };
  } catch {
    return { ok: false, message: "error" };
  }
}
