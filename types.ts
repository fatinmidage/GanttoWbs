
export type ItemType = 'milestone' | 'task' | 'range';

export interface WBSItem {
  id: string;
  taskName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  duration: string;
  owner: string;
  status: 'Pending' | 'In Progress' | 'Done';
  subTasks?: WBSItem[]; // Recursive structure for Level 2/3 WBS
}

export interface TimelineItem {
  id: string;
  rowId: string;
  label: string;
  date: string; // ISO Date string YYYY-MM-DD
  endDate?: string; // For ranges
  type: ItemType;
  isCritical?: boolean; // For the red star (PPAP)
  color?: string;
}

export interface TimelineRow {
  id: string;
  label: string;
  height: number;
  wbs?: WBSItem[];
}

export interface TimelineData {
  title: string;
  rows: TimelineRow[];
  items: TimelineItem[];
  startDate: string; // Overall start
  endDate: string; // Overall end
}

export interface DragState {
  isDragging: boolean;
  itemId: string | null;
  startX: number;
  originalDate: number; // Timestamp
  originalEndDate?: number; // Timestamp for ranges
  dragType: 'move' | 'resize-left' | 'resize-right';
}
