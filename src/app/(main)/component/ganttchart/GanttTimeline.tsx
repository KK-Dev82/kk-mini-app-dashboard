"use client";

import React from "react";

export type GanttTimelineBar = {
  id: string;
  title: string;
  startM: number; // 0..11
  endM: number; // 0..11
  className: string; // ใส่สี/gradient ได้เอง
  onClick?: () => void;

  // สำหรับหลายแถว (modal tasks)
  lane?: number; // 0..n
};

export default function GanttTimeline({
  bars,
  months = 12,
  height,
  laneHeight = 52,
  barHeight = 40,
  showMonthSeparators = true,
}: {
  bars: GanttTimelineBar[];
  months?: number;
  height?: number;
  laneHeight?: number;
  barHeight?: number;
  showMonthSeparators?: boolean;
}) {
  const maxLane = Math.max(0, ...bars.map((b) => b.lane ?? 0));
  const computedHeight =
    height ?? Math.max(laneHeight, (maxLane + 1) * laneHeight);

  return (
    <div className="relative w-full" style={{ height: computedHeight }}>
      {/* month separators */}
      {showMonthSeparators && (
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` }}>
          {Array.from({ length: months }).map((_, i) => (
            <div
              key={i}
              className="border-l border-slate-200/70 first:border-l-0"
            />
          ))}
        </div>
      )}

      {/* bars */}
      <div className="absolute inset-0">
        {bars.map((b) => {
          const lane = b.lane ?? 0;
          const top = lane * laneHeight + (laneHeight - barHeight) / 2;

          const colStart = b.startM + 1;
          const colEnd = b.endM + 2;

          const shared =
            "h-[40px] rounded-lg px-4 flex items-center text-[11px] font-medium text-white shadow-sm hover:brightness-110 transition-all";

          const style: React.CSSProperties = {
            top,
          };

          const innerStyle: React.CSSProperties = {
            gridColumnStart: colStart,
            gridColumnEnd: colEnd,
            height: barHeight,
          };

          return (
            <div key={b.id} className="absolute left-0 right-0" style={style}>
              <div
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))`,
                }}
              >
                {b.onClick ? (
                  <button
                    type="button"
                    onClick={b.onClick}
                    className={[shared, b.className].join(" ")}
                    style={innerStyle}
                    title={b.title}
                  >
                    <span className="truncate">{b.title}</span>
                  </button>
                ) : (
                  <div
                    className={[shared, b.className].join(" ")}
                    style={innerStyle}
                    title={b.title}
                    role="img"
                    aria-label={b.title}
                  >
                    <span className="truncate">{b.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
