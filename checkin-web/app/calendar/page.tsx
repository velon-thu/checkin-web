import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Nav from "@/components/nav";
import prisma from "@/lib/prisma";

const DAYS_TO_SHOW = 365;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getColorClassName = (count: number) => {
  if (count >= 3) {
    return "bg-emerald-900 shadow-[0_10px_18px_-12px_rgba(20,61,45,0.95)]";
  }

  if (count === 2) {
    return "bg-emerald-600 shadow-[0_10px_16px_-12px_rgba(30,106,75,0.82)]";
  }

  if (count === 1) {
    return "bg-emerald-200";
  }

  return "bg-white/80 ring-1 ring-zinc-900/6";
};

export const metadata: Metadata = {
  title: "Check-in Calendar",
};

export const dynamic = "force-dynamic";

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
  const totalWeeks = Math.ceil((leadingEmptyCells + recentDates.length) / 7);

  return (
    <main className="page-shell min-h-screen overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
      <section className="flex min-h-[calc(100vh-2rem)] w-full flex-col gap-6 sm:min-h-[calc(100vh-3rem)]">
        <div className="flex justify-center sm:justify-start">
          <Nav />
        </div>

        <div className="app-panel rounded-[34px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">Last 365 Days</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-zinc-900">
                Check-in Calendar
              </h1>
            </div>
          </div>
        </div>

        <div
          className="flex flex-1 items-center justify-center"
          style={
            {
              "--calendar-cell-size": `clamp(0.3rem, calc((100vw - 8rem) / ${
                totalWeeks + 8
              }), 1.1rem)`,
              "--calendar-gap": "clamp(0.12rem, 0.35vw, 0.45rem)",
            } as CSSProperties
          }
        >
          <div className="w-full">
            <div className="mx-auto flex w-full items-start justify-center gap-[var(--calendar-gap)]">
              <div className="grid grid-rows-7 gap-[var(--calendar-gap)] pt-[calc(var(--calendar-gap)/2)]">
                {WEEKDAY_LABELS.map((label) => (
                  <span
                    key={label}
                    className="flex h-[var(--calendar-cell-size)] items-center text-[10px] font-medium text-zinc-400 sm:text-[11px]"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div
                className="grid grid-flow-col grid-rows-7 gap-[var(--calendar-gap)]"
                style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: leadingEmptyCells }, (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="h-[var(--calendar-cell-size)] w-[var(--calendar-cell-size)]"
                  />
                ))}

                {recentDates.map((date) => {
                  const count = historyCountByDate[date] ?? 0;

                  return (
                    <div
                      key={date}
                      title={`${date}: ${count} check-ins`}
                      className={`h-[var(--calendar-cell-size)] w-[var(--calendar-cell-size)] rounded-[max(3px,min(6px,0.33rem))] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.08] ${getColorClassName(
                        count,
                      )}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
