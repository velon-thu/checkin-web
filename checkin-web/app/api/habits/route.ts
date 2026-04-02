import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { name?: unknown }
    | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return Response.json({ ok: false, message: "empty" }, { status: 400 });
  }

  try {
    const habit = await prisma.habit.upsert({
      where: { name },
      update: {},
      create: { name },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/");

    return Response.json({
      ok: true,
      habit: {
        id: String(habit.id),
        name: habit.name,
      },
    });
  } catch {
    return Response.json({ ok: false, message: "error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: unknown }
    | null;
  const id = typeof body?.id === "number" ? body.id : Number(body?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ ok: false, message: "invalid_id" }, { status: 400 });
  }

  try {
    const habit = await prisma.habit.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!habit) {
      return Response.json({ ok: false, message: "not_found" }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/calendar");

    return Response.json({ ok: true, id });
  } catch {
    return Response.json({ ok: false, message: "error" }, { status: 500 });
  }
}
