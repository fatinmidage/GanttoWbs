import React from 'react';
import { getTimelineMonths, PIXELS_PER_DAY, dateToX } from '../utils';

interface GridProps {
  startDate: string;
  endDate: string;
}

interface GridLinesProps extends GridProps {
  totalHeight: number;
}

// Helper to calculate years and months data
const useGridData = (startDate: string, endDate: string) => {
  const months = getTimelineMonths(startDate, endDate);
  
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

  return { months, years };
};

export const GridHeader: React.FC<GridProps> = ({ startDate, endDate }) => {
  const { months, years } = useGridData(startDate, endDate);

  return (
    <div className="w-full h-full select-none bg-white">
      {/* Years Header */}
      <div className="flex h-10 border-b border-gray-300">
        {years.map((y, i) => {
          let totalDays = 0;
          for(let m = 0; m < y.count; m++) {
             const mDate = months[y.startMonthIndex + m];
             const daysInMonth = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0).getDate();
             totalDays += daysInMonth;
          }
          const width = totalDays * PIXELS_PER_DAY;
          
          return (
            <div 
              key={i} 
              className="flex items-center justify-center font-bold text-gray-700 border-r border-gray-300 bg-white"
              style={{ width: `${width}px` }}
            >
              {y.year}
            </div>
          );
        })}
      </div>

      {/* Months Header */}
      <div className="flex h-10 border-b border-gray-300 bg-gray-50">
        {months.map((m, i) => {
           const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
           const width = daysInMonth * PIXELS_PER_DAY;
           return (
            <div 
              key={i} 
              className="flex items-center justify-center text-sm text-gray-600 border-r border-dashed border-gray-300"
              style={{ width: `${width}px` }}
            >
              {m.getMonth() + 1}月
            </div>
           );
        })}
      </div>
    </div>
  );
};

export const GridLines: React.FC<GridLinesProps> = ({ startDate, endDate, totalHeight }) => {
  const { months } = useGridData(startDate, endDate);
  
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none select-none z-0" style={{ height: totalHeight }}>
       {/* Vertical Grid Lines */}
       {months.map((m, i) => {
           const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
           const width = daysInMonth * PIXELS_PER_DAY;
           return (
            <div 
              key={i} 
              className="absolute top-0 bottom-0 border-r border-gray-100"
              style={{ 
                left: `${dateToX(m.toISOString(), startDate) + width}px`, 
                height: '100%' 
              }}
            />
           );
        })}
        
        {/* Current Time Line (Mocked) */}
        <div 
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400 z-10"
          style={{ left: `${dateToX("2025-02-24", startDate)}px` }}
        >
          {/* We hide the label at the top of lines to avoid conflict with sticky header, 
              or we could render it in the header component instead. 
              For now keeping it simple as a background guide. */}
        </div>
    </div>
  );
};