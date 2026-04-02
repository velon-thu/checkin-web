import type { Metadata } from "next";
import Nav from "@/components/nav";
import prisma from "@/lib/prisma";

const DAYS_TO_SHOW = 365;
const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getColorClassName = (count: number) => {
  if (count >= 3) {
    return "bg-green-700";
  }

  if (count === 2) {
    return "bg-green-500";
  }

  if (count === 1) {
    return "bg-green-200";
  }

  return "bg-zinc-200";
};

export const metadata: Metadata = {
  title: "打卡日历",
};

export default async function CalendarPage() {
  const today = new Date();
  const firstVisibleDate = new Date(today);

  firstVisibleDate.setDate(today.getDate() - (DAYS_TO_SHOW - 1));

  const startDate = getDateString(firstVisibleDate);
  const endDate = getDateString(today);

  const recentCheckins = await prisma.checkin.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      date: true,
    },
  });

  const historyCountByDate = recentCheckins.reduce<Record<string, number>>(
    (counts, item) => {
      counts[item.date] = (counts[item.date] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const recentDates = Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);
    return getDateString(date);
  });
  const leadingEmptyCells = firstVisibleDate.getDay();

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="min-h-screen w-full bg-white px-6 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex justify-center sm:justify-start">
          <Nav />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">最近 365 天</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
              打卡日历
            </h1>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex min-w-max gap-3">
            <div className="grid grid-rows-7 gap-2 pt-1">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="flex h-4 items-center text-[11px] text-zinc-400"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-2">
              {Array.from({ length: leadingEmptyCells }, (_, index) => (
                <div key={`empty-${index}`} className="h-4 w-4" />
              ))}

              {recentDates.map((date) => {
                const count = historyCountByDate[date] ?? 0;

                return (
                  <div
                    key={date}
                    title={`${date}：${count} 次打卡`}
                    className={`h-4 w-4 rounded-[4px] ${getColorClassName(
                      count,
                    )}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
