import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { habitId?: unknown; date?: unknown }
    | null;
  const habitId =
    typeof body?.habitId === "number" ? body.habitId : Number(body?.habitId);
  const date = typeof body?.date === "string" ? body.date.trim() : "";

  if (!Number.isInteger(habitId) || habitId <= 0) {
    return Response.json(
      { ok: false, message: "invalid_habit_id" },
      { status: 400 },
    );
  }

  if (!isValidDate(date)) {
    return Response.json(
      { ok: false, message: "invalid_date" },
      { status: 400 },
    );
  }

  try {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true },
    });

    if (!habit) {
      return Response.json({ ok: false, message: "not_found" }, { status: 404 });
    }

    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        habitId_date: {
          habitId,
          date,
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
            date,
          },
        },
      });

      revalidatePath("/");
      revalidatePath("/calendar");

      return Response.json({ ok: true, checked: false });
    }

    await prisma.checkin.create({
      data: {
        habitId,
        date,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendar");

    return Response.json({ ok: true, checked: true });
  } catch {
    return Response.json({ ok: false, message: "error" }, { status: 500 });
  }
}
