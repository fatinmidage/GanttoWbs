import { TimelineItem } from "./types";

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const getMonthYearLabel = (date: Date) => {
  return `${date.getFullYear()} ${MONTHS[date.getMonth()]}`;
};

export const getDaysDiff = (start: Date, end: Date) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay));
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Generate months between two dates
export const getTimelineMonths = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= last) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

// Scale helpers
export const PIXELS_PER_DAY = 3; // Adjust for zoom

export const dateToX = (dateStr: string, timelineStartStr: string): number => {
  const date = new Date(dateStr).getTime();
  const start = new Date(timelineStartStr).getTime();
  const diffDays = (date - start) / (1000 * 60 * 60 * 24);
  return diffDays * PIXELS_PER_DAY;
};

export const xToDate = (x: number, timelineStartStr: string): string => {
  const start = new Date(timelineStartStr).getTime();
  const daysToAdd = x / PIXELS_PER_DAY;
  const newDate = new Date(start + daysToAdd * 24 * 60 * 60 * 1000);
  return newDate.toISOString().split('T')[0];
};

export const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  const yy = d.getFullYear().toString().slice(-2);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${yy}/${m}/${day}`;
};
