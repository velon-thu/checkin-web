"use client";

type HistoryRecord = {
  id: string;
  name: string;
  date: string;
};

type HistoryListProps = {
  historyRecords: HistoryRecord[];
};

export default function HistoryList({ historyRecords }: HistoryListProps) {
  const groupedHistory = historyRecords.reduce<
    Array<{
      date: string;
      items: HistoryRecord[];
    }>
  >((groups, historyItem) => {
    const currentGroup = groups.find((group) => group.date === historyItem.date);

    if (currentGroup) {
      currentGroup.items.push(historyItem);
      return groups;
    }

    return [...groups, { date: historyItem.date, items: [historyItem] }];
  }, []);

  return (
    <div className="app-panel mt-8 rounded-[32px] p-5 sm:p-6">
      <div className="relative z-10">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-900">
          Check-in History
        </h2>
        <div className="mt-5 space-y-4">
          {historyRecords.length === 0 ? (
            <p className="soft-panel rounded-[24px] px-4 py-8 text-center text-sm text-zinc-400">
              No check-ins yet today
            </p>
          ) : (
            groupedHistory.map((group) => (
              <div
                key={group.date}
                className="soft-panel rounded-[24px] p-4 sm:p-5"
              >
                <h3 className="text-sm font-semibold tracking-[0.16em] text-zinc-500">
                  {group.date}
                </h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {group.items.map((historyItem) => (
                    <div
                      key={`${historyItem.id}-${historyItem.date}`}
                      className="rounded-[18px] border border-white/80 bg-white/82 px-4 py-3 text-sm font-medium text-zinc-700 shadow-[0_12px_24px_-20px_rgba(23,33,27,0.28)]"
                    >
                      {historyItem.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
