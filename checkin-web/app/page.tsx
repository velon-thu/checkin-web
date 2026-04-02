import type { Metadata } from "next";
import HabitTrackerClient from "@/components/habit-tracker-client";
import Nav from "@/components/nav";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "打卡网站",
};

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
    <main className="min-h-screen bg-zinc-50">
      <section className="min-h-screen w-full bg-white px-6 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex justify-center sm:justify-start">
          <Nav />
        </div>

        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            打卡网站
          </h1>
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
