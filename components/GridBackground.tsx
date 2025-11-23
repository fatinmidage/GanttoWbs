import React from 'react';
import { getTimelineMonths, getTimelineWeeks, getTimelineDays, dateToX } from '../utils';

export interface ViewLevels {
  year: boolean;
  month: boolean;
  week: boolean;
  day: boolean;
}

interface GridProps {
  startDate: string;
  endDate: string;
  pixelsPerDay: number;
  visibleLevels: ViewLevels;
}

interface GridLinesProps extends GridProps {
  totalHeight: number;
}

// Helper to calculate data
const useGridData = (startDate: string, endDate: string) => {
  const months = getTimelineMonths(startDate, endDate);
  
  // Years
  const years: { year: number; startMonthIndex: number; count: number }[] = [];
  months.forEach((m, idx) => {
    const y = m.getFullYear();
    const lastYear = years[years.length - 1];
    if (lastYear && lastYear.year === y) {
      lastYear.count++;
    } else {
      years.push({ year: y, startMonthIndex: idx, count: 1 });
    }
  });

  // Weeks
  const weeks = getTimelineWeeks(startDate, endDate);

  // Days
  // We only generate days if needed to avoid massive array creation when not visible, 
  // but for calculating width we usually iterate logic.
  // Here we'll generate them on demand in the render if needed.

  return { months, years, weeks };
};

export const GridHeader: React.FC<GridProps> = ({ startDate, endDate, pixelsPerDay, visibleLevels }) => {
  const { months, years, weeks } = useGridData(startDate, endDate);
  const timelineStartMs = new Date(startDate).getTime();

  // Helper for width
  const getWidth = (days: number) => days * pixelsPerDay;

  return (
    <div className="w-full h-full select-none bg-white flex flex-col border-b border-gray-200">
      
      {/* YEARS */}
      {visibleLevels.year && (
        <div className="flex h-6 shrink-0 border-b border-gray-300">
          {years.map((y, i) => {
            let totalDays = 0;
            for(let m = 0; m < y.count; m++) {
               const mDate = months[y.startMonthIndex + m];
               const daysInMonth = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0).getDate();
               totalDays += daysInMonth;
            }
            
            // Adjust width for the first year if timeline doesn't start Jan 1st?
            // The logic above assumes we are rendering based on full months returned by getTimelineMonths
            // `getTimelineMonths` returns months fully covering the range.
            
            return (
              <div 
                key={i} 
                className="flex items-center justify-center font-bold text-xs text-gray-700 border-r border-gray-300 bg-gray-50"
                style={{ width: `${getWidth(totalDays)}px` }}
              >
                {y.year}
              </div>
            );
          })}
        </div>
      )}

      {/* MONTHS */}
      {visibleLevels.month && (
        <div className="flex h-6 shrink-0 border-b border-gray-300 bg-white">
          {months.map((m, i) => {
             const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
             return (
              <div 
                key={i} 
                className="flex items-center justify-center text-xs text-gray-600 border-r border-gray-200"
                style={{ width: `${getWidth(daysInMonth)}px` }}
              >
                {m.getMonth() + 1}月
              </div>
             );
          })}
        </div>
      )}

      {/* WEEKS */}
      {visibleLevels.week && (
        <div className="flex h-6 shrink-0 border-b border-gray-300 bg-gray-50 relative overflow-hidden">
           {weeks.map((w, i) => {
              // Calculate position absolutely to be safe against varying week lengths near edges,
              // but standard flow is better. 
              // Standard week is 7 days.
              // We need to clip weeks that are outside the view?
              // For simplicity, we render 7 days width for each week start.
              const x = dateToX(w.toISOString(), startDate, pixelsPerDay);
              const width = 7 * pixelsPerDay;
              
              // Get ISO week number roughly
              const onejan = new Date(w.getFullYear(), 0, 1);
              const weekNum = Math.ceil((((w.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);

              return (
                 <div
                   key={i}
                   className="absolute top-0 bottom-0 border-r border-gray-200 flex items-center justify-center text-[10px] text-gray-500"
                   style={{ left: x, width: width }}
                 >
                   {pixelsPerDay > 5 ? `W${weekNum}` : ''}
                 </div>
              )
           })}
        </div>
      )}

      {/* DAYS */}
      {visibleLevels.day && (
        <div className="flex h-6 shrink-0 border-b border-gray-300 bg-white relative">
            {/* 
              Optimization: Only render days if pixelsPerDay is large enough to see them, 
              or render simple ticks. 
              Rendering thousands of DOM nodes for days can be slow if range is large.
              We used absolute positioning for weeks, let's use absolute for days to ensure precision.
            */}
             {(() => {
                const days = getTimelineDays(startDate, endDate);
                return days.map((d, i) => {
                    const x = dateToX(d.toISOString(), startDate, pixelsPerDay);
                    const dayNum = d.getDate();
                    return (
                        <div 
                           key={i}
                           className="absolute top-0 bottom-0 border-r border-gray-100 flex items-center justify-center text-[10px] text-gray-400"
                           style={{ left: x, width: pixelsPerDay }}
                        >
                            {pixelsPerDay > 15 ? dayNum : ''}
                        </div>
                    );
                });
             })()}
        </div>
      )}
    </div>
  );
};

export const GridLines: React.FC<GridLinesProps> = ({ startDate, endDate, totalHeight, pixelsPerDay, visibleLevels }) => {
  const { months, weeks } = useGridData(startDate, endDate);
  
  // Determine what lines to draw based on granularity
  // Priority: Day > Week > Month
  
  const showDayLines = visibleLevels.day;
  const showWeekLines = visibleLevels.week && !showDayLines;
  const showMonthLines = visibleLevels.month && !showWeekLines && !showDayLines;
  
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none select-none z-0" style={{ height: totalHeight }}>
       
       {/* MONTH LINES (Always nice to have subtle structure even if overlaid) */}
       {months.map((m, i) => {
           const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
           const width = daysInMonth * pixelsPerDay;
           const x = dateToX(m.toISOString(), startDate, pixelsPerDay);
           return (
            <div 
              key={`m-${i}`} 
              className="absolute top-0 bottom-0 border-r border-gray-200"
              style={{ 
                left: `${x + width}px`, 
                height: '100%' 
              }}
            />
           );
        })}

        {/* WEEK LINES */}
        {(showWeekLines || showDayLines) && weeks.map((w, i) => {
             const x = dateToX(w.toISOString(), startDate, pixelsPerDay);
             return (
               <div 
                 key={`w-${i}`}
                 className={`absolute top-0 bottom-0 border-r ${showDayLines ? 'border-gray-50' : 'border-gray-100'}`}
                 style={{ left: x, height: '100%' }}
               />
             );
        })}

        {/* DAY LINES */}
        {showDayLines && (() => {
             const days = getTimelineDays(startDate, endDate);
             return days.map((d, i) => {
                 const x = dateToX(d.toISOString(), startDate, pixelsPerDay);
                 return (
                     <div 
                        key={`d-${i}`}
                        className="absolute top-0 bottom-0 border-r border-gray-50"
                        style={{ left: x, height: '100%' }}
                     />
                 );
             });
        })()}
        
        {/* Current Time Line */}
        <div 
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400 z-10"
          style={{ left: `${dateToX(new Date().toISOString(), startDate, pixelsPerDay)}px` }}
        />
    </div>
  );
};