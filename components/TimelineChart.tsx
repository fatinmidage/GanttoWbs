import React, { useState, useRef, useEffect } from 'react';
import { TimelineData, DragState, TimelineItem, WBSItem } from '../types';
import { GridHeader, GridLines, ViewLevels } from './GridBackground';
import { TimelineItemNode } from './TimelineItemNode';
import { dateToX } from '../utils';
import { ListTree, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
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

  // --- View Configuration State ---
  const [pixelsPerDay, setPixelsPerDay] = useState(3);
  const [visibleLevels, setVisibleLevels] = useState<ViewLevels>({
    year: true,
    month: true,
    week: false,
    day: false
  });
  const [showViewMenu, setShowViewMenu] = useState(false);

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
  const contentWidth = totalDays * pixelsPerDay;
  
  // Total Chart Width = Sidebar (160px) + Timeline Content Width
  const chartWidth = Math.max(contentWidth + 160, containerWidth);
  
  // Calculate total height for grid lines
  const totalHeight = data.rows.reduce((acc, row) => acc + row.height, 0);

  // --- Handlers ---
  
  const updateViewLevel = (level: keyof ViewLevels, value: boolean) => {
    setVisibleLevels(prev => ({ ...prev, [level]: value }));
  };

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
    const deltaDays = deltaX / pixelsPerDay;
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
  }, [dragState, pixelsPerDay]); // Added pixelsPerDay dependency to ensure correct calc

  const toggleRow = (rowId: string) => {
    setExpandedRowId(prev => prev === rowId ? null : rowId);
  };

  return (
    <div className="flex flex-col border border-gray-300 bg-white shadow-xl rounded-lg overflow-hidden w-full h-[800px]">
      {/* Title Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center z-50 relative shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{data.title}</h2>
            <div className="text-xs text-gray-500 italic">Drag items to reschedule</div>
        </div>
        
        {/* View Settings Control */}
        <div className="relative">
            <button 
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-700 shadow-sm"
            >
                <Settings2 className="w-4 h-4" />
                <span>View Options</span>
            </button>
            
            {showViewMenu && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Time Granularity</h4>
                    <div className="space-y-2 mb-4">
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={visibleLevels.year} onChange={e => updateViewLevel('year', e.target.checked)} className="rounded text-blue-600" />
                            <span>Year</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={visibleLevels.month} onChange={e => updateViewLevel('month', e.target.checked)} className="rounded text-blue-600" />
                            <span>Month</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={visibleLevels.week} onChange={e => updateViewLevel('week', e.target.checked)} className="rounded text-blue-600" />
                            <span>Week</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={visibleLevels.day} onChange={e => updateViewLevel('day', e.target.checked)} className="rounded text-blue-600" />
                            <span>Day</span>
                        </label>
                    </div>

                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Zoom Level</h4>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Wide</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="50" 
                            step="1"
                            value={pixelsPerDay} 
                            onChange={(e) => setPixelsPerDay(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                         <span className="text-xs text-gray-500">Zoom</span>
                    </div>
                     <div className="text-center text-[10px] text-gray-400 mt-1">{pixelsPerDay}px / day</div>
                </div>
                </>
            )}
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="overflow-auto relative custom-scrollbar flex-1" ref={containerRef}>
        <div style={{ width: `${chartWidth}px`, position: 'relative' }}>
          
          {/* Layer 0: Background Grid Lines */}
          <div className="absolute top-20 left-40 right-0 bottom-0 z-0">
             <GridLines 
                startDate={data.startDate} 
                endDate={data.endDate} 
                totalHeight={totalHeight + 1000} 
                pixelsPerDay={pixelsPerDay}
                visibleLevels={visibleLevels}
             />
          </div>

          {/* Layer 3: Sticky Header */}
          <div className="sticky left-0 right-0 top-0 z-40 bg-white border-b border-gray-200 flex shadow-sm min-h-[80px]">
             {/* Sticky Top-Left Corner */}
             <div className="w-40 shrink-0 bg-white border-r border-gray-200 sticky left-0 z-50 flex items-center justify-center font-bold text-gray-400 text-xs uppercase tracking-widest">
                Phases
             </div>
             {/* Scrollable Header Area */}
             <div className="flex-1 overflow-hidden relative">
                <GridHeader 
                    startDate={data.startDate} 
                    endDate={data.endDate} 
                    pixelsPerDay={pixelsPerDay}
                    visibleLevels={visibleLevels}
                />
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
                         const x = dateToX(item.date, data.startDate, pixelsPerDay);
                         let width = 0;
                         if (item.type === 'range' && item.endDate) {
                           width = dateToX(item.endDate, data.startDate, pixelsPerDay) - x;
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
                       pixelsPerDay={pixelsPerDay}
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