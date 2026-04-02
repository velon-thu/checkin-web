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
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-900">打卡历史</h2>
      <div className="mt-4 space-y-3">
        {historyRecords.length === 0 ? (
          <p className="text-sm text-zinc-400">今天还没有打卡记录</p>
        ) : (
          groupedHistory.map((group) => (
            <div
              key={group.date}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <h3 className="text-sm font-semibold text-zinc-700">
                {group.date}
              </h3>
              <div className="mt-3 space-y-2">
                {group.items.map((historyItem) => (
                  <div
                    key={`${historyItem.id}-${historyItem.date}`}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700"
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
  );
}
