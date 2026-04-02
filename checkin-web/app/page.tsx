import type { Metadata } from "next";
import HabitTrackerClient from "@/components/habit-tracker-client";
import Nav from "@/components/nav";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "打卡网站",
};

export default async function Home() {
  const [habits, recentCheckins] = await Promise.all([
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-8 flex justify-center sm:justify-start">
          <Nav />
        </div>

        <div className="space-y-4 text-center">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
            Daily Check-in
          </span>
          <p className="text-sm text-zinc-500">首页历史会优先显示数据库记录</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            打卡网站
          </h1>
          <p className="text-base leading-7 text-zinc-600 sm:text-lg">
            这是我的第一个 Next.js 打卡项目
          </p>
        </div>

        <HabitTrackerClient
          initialHabits={initialHabits}
          initialHistoryRecords={initialHistoryRecords}
        />
      </section>
    </main>
  );
}
