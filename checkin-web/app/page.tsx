import type { Metadata } from "next";
import HabitTrackerClient from "@/components/habit-tracker-client";
import Nav from "@/components/nav";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Check-in Tracker",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [habits, recentCheckins, allCheckins] = await Promise.all([
    prisma.habit.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.checkin.findMany({
      include: {
        habit: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 200,
    }),
    prisma.checkin.findMany({
      select: {
        habitId: true,
        date: true,
      },
    }),
  ]);

  const initialHabits = habits.map((habit) => ({
    id: String(habit.id),
    name: habit.name,
  }));

  const initialHistoryRecords = recentCheckins.map((checkin) => ({
    id: String(checkin.id),
    date: checkin.date,
    name: checkin.habit.name,
    habitId: String(checkin.habitId),
  }));

  const initialCheckinDatesByHabit = allCheckins.reduce<
    Record<string, string[]>
  >((result, checkin) => {
    const habitId = String(checkin.habitId);
    const currentDates = result[habitId] ?? [];

    result[habitId] = [...currentDates, checkin.date];

    return result;
  }, {});

  return (
    <main className="page-shell min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-6 sm:min-h-[calc(100vh-3rem)]">
        <div className="flex justify-center sm:justify-start">
          <Nav />
        </div>

        <div className="app-panel rounded-[34px] px-6 py-8 text-center sm:px-8 sm:py-10 sm:text-left lg:px-10">
          <div className="relative z-10">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-5xl">
              Check-in Tracker
            </h1>
          </div>
        </div>

        <HabitTrackerClient
          initialHabits={initialHabits}
          initialHistoryRecords={initialHistoryRecords}
          initialCheckinDatesByHabit={initialCheckinDatesByHabit}
        />
      </section>
    </main>
  );
}
