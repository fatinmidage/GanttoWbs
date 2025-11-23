import React, { useState, useRef, useEffect } from 'react';
import { TimelineData, DragState, TimelineItem, WBSItem } from '../types';
import { GridHeader, GridLines } from './GridBackground';
import { TimelineItemNode } from './TimelineItemNode';
import { dateToX, PIXELS_PER_DAY } from '../utils';
import { ListTree, ChevronDown, ChevronUp } from 'lucide-react';
import { WBSView } from './WBSView';

interface Props {
  data: TimelineData;
  onDataChange: (newData: TimelineData) => void;
  onUpdateRowWBS: (rowId: string, wbs: WBSItem[]) => void;
}

export const TimelineChart: React.FC<Props> = ({ data, onDataChange, onUpdateRowWBS }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    startX: 0,
    originalDate: 0,
    dragType: 'move'
  });

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate widths
  const startMs = new Date(data.startDate).getTime();
  const endMs = new Date(data.endDate).getTime();
  const totalDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
  const contentWidth = totalDays * PIXELS_PER_DAY;
  
  // Total Chart Width = Sidebar (160px) + Timeline Content Width
  const chartWidth = Math.max(contentWidth + 160, containerWidth);
  
  // Calculate total height for grid lines
  const totalHeight = data.rows.reduce((acc, row) => acc + row.height, 0);

  // --- Drag Handlers ---

  const handleMouseDown = (e: React.MouseEvent, item: TimelineItem, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      isDragging: true,
      itemId: item.id,
      startX: e.clientX,
      originalDate: new Date(item.date).getTime(),
      originalEndDate: item.endDate ? new Date(item.endDate).getTime() : undefined,
      dragType: type
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaDays = deltaX / PIXELS_PER_DAY;
    const deltaMs = deltaDays * 24 * 60 * 60 * 1000;

    const newItems = data.items.map(item => {
      if (item.id !== dragState.itemId) return item;

      if (dragState.dragType === 'move') {
        const newDate = new Date(dragState.originalDate + deltaMs);
        let newEndDate = undefined;
        if (item.type === 'range' && dragState.originalEndDate) {
            newEndDate = new Date(dragState.originalEndDate + deltaMs).toISOString().split('T')[0];
        }
        return {
          ...item,
          date: newDate.toISOString().split('T')[0],
          endDate: newEndDate
        };
      }
      return item;
    });

    onDataChange({ ...data, items: newItems });
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, itemId: null }));
    }
  };

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  const toggleRow = (rowId: string) => {
    setExpandedRowId(prev => prev === rowId ? null : rowId);
  };

  return (
    <div className="flex flex-col border border-gray-300 bg-white shadow-xl rounded-lg overflow-hidden w-full h-[800px]">
      {/* Title Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center z-50 relative shrink-0">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{data.title}</h2>
        <div className="text-xs text-gray-500 italic">Drag items to reschedule</div>
      </div>

      {/* Main Scrollable Area */}
      <div className="overflow-auto relative custom-scrollbar flex-1" ref={containerRef}>
        <div style={{ width: `${chartWidth}px`, position: 'relative' }}>
          
          {/* Layer 0: Background Grid Lines */}
          {/* Positioned absolute, starting AFTER the sidebar (160px) */}
          <div className="absolute top-20 left-40 right-0 bottom-0 z-0">
             <GridLines startDate={data.startDate} endDate={data.endDate} totalHeight={totalHeight + 1000} />
          </div>

          {/* Layer 3: Sticky Header (z-40 to cover rows z-20) */}
          <div className="h-20 sticky left-0 right-0 top-0 z-40 bg-white border-b border-gray-200 flex shadow-sm">
             {/* Sticky Top-Left Corner (matches sidebar width) */}
             <div className="w-40 shrink-0 bg-white border-r border-gray-200 sticky left-0 z-50 flex items-center justify-center font-bold text-gray-400 text-xs uppercase tracking-widest">
                Phases
             </div>
             {/* Scrollable Header Area */}
             <div className="flex-1 overflow-hidden relative">
                <GridHeader startDate={data.startDate} endDate={data.endDate} />
             </div>
          </div>

          {/* Layer 2: Rows Container */}
          <div className="relative z-20">
             {data.rows.map((row) => (
               <React.Fragment key={row.id}>
                 {/* The Gantt Row */}
                 <div 
                   className="flex border-b border-gray-200 hover:bg-gray-50/50 transition-colors group/row"
                   style={{ height: `${row.height}px` }}
                 >
                   {/* Row Header (Sticky Left) */}
                   <div className="sticky left-0 w-40 shrink-0 bg-white/95 backdrop-blur border-r border-gray-200 flex flex-col items-center justify-center p-2 z-30 shadow-sm transition-colors hover:bg-gray-50">
                     <div className="text-sm font-semibold text-gray-700 text-center mb-1 leading-tight">
                       {row.label}
                     </div>
                     <button 
                       onClick={() => toggleRow(row.id)}
                       className={`mt-1 flex items-center space-x-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                         expandedRowId === row.id 
                           ? 'bg-blue-100 text-blue-700 border-blue-300' 
                           : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                       }`}
                     >
                       <ListTree className="w-3 h-3" />
                       <span>WBS</span>
                       {expandedRowId === row.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                     </button>
                   </div>

                   {/* Row Content Area */}
                   <div className="relative flex-1 h-full">
                     {/* Horizontal Guide Line */}
                     <div className="absolute inset-0 pointer-events-none border-b border-gray-100/50" />
                     
                     {/* Items */}
                     {data.items
                       .filter(item => item.rowId === row.id)
                       .map(item => {
                         const x = dateToX(item.date, data.startDate);
                         let width = 0;
                         if (item.type === 'range' && item.endDate) {
                           width = dateToX(item.endDate, data.startDate) - x;
                         }

                         return (
                           <TimelineItemNode 
                             key={item.id}
                             item={item}
                             x={x}
                             width={width}
                             onMouseDown={(e, type) => handleMouseDown(e, item, type)}
                           />
                         );
                       })
                     }
                   </div>
                 </div>

                 {/* The WBS Inline Panel */}
                 {expandedRowId === row.id && (
                   <div className="w-full relative z-20">
                     <WBSView 
                       rowId={row.id} 
                       data={data} 
                       onUpdateRow={onUpdateRowWBS} 
                       onClose={() => setExpandedRowId(null)}
                     />
                   </div>
                 )}
               </React.Fragment>
             ))}
          </div>
          
          {/* Bottom padding */}
          <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
};