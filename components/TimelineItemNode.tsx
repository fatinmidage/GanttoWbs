import React from 'react';
import { TimelineItem } from '../types';
import { Star } from 'lucide-react';
import { formatDateShort } from '../utils';

interface Props {
  item: TimelineItem;
  x: number;
  width?: number; // For ranges
  onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => void;
  // Note: We don't strictly need pixelsPerDay here if x/width are passed from parent, 
  // but if we do internal calc we might. Currently parent calc is fine.
}

export const TimelineItemNode: React.FC<Props> = ({ item, x, width, onMouseDown }) => {
  const isRange = item.type === 'range';
  const colorClass = item.color ? '' : 'bg-blue-600'; // Default blue
  const styleColor = item.color || undefined;

  return (
    <div 
      className="absolute top-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing"
      style={{ left: x, width: isRange ? width : 0 }}
    >
      {/* Render based on Type */}
      
      {/* MILESTONE / POINT */}
      {!isRange && (
        <div 
          className="relative flex flex-col items-center"
          onMouseDown={(e) => onMouseDown(e, 'move')}
        >
          {/* Critical Star */}
          {item.isCritical && (
            <Star className="w-6 h-6 text-red-600 fill-red-600 absolute -top-8 animate-pulse" />
          )}

          {/* Diamond Shape */}
          <div 
            className={`w-5 h-5 transform rotate-45 ${colorClass} border border-white shadow-sm z-20 hover:scale-110 transition-transform`}
            style={{ backgroundColor: styleColor }}
          />

          {/* Labels */}
          <div className="mt-2 flex flex-col items-center text-xs font-medium text-gray-800 whitespace-nowrap bg-white/80 backdrop-blur-sm px-1 rounded pointer-events-none z-30">
             <span>{formatDateShort(item.date)}</span>
             <span className="font-bold">{item.label}</span>
          </div>
        </div>
      )}

      {/* RANGE / BAR */}
      {isRange && width && (
        <div className="relative h-6 group">
          {/* Main Bar */}
          <div 
            className="absolute top-0 h-full w-full opacity-80 hover:opacity-100 transition-opacity rounded-sm shadow-sm cursor-move flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: styleColor || '#84cc16' }}
            onMouseDown={(e) => onMouseDown(e, 'move')}
          >
             <span className="text-xs text-white font-bold drop-shadow-md whitespace-nowrap px-2 pointer-events-none">
               {item.label}
             </span>
          </div>

          {/* Start Date Label */}
          <div className="absolute -bottom-8 left-0 -translate-x-1/2 text-[10px] text-gray-600 flex flex-col items-center pointer-events-none">
             <div className="w-3 h-3 rotate-45 mb-1" style={{ backgroundColor: '#3b82f6' }}></div> {/* Blue start diamond */}
             {formatDateShort(item.date)}
          </div>

          {/* End Date Label */}
           <div className="absolute -bottom-8 right-0 translate-x-1/2 text-[10px] text-gray-600 flex flex-col items-center pointer-events-none">
             <div className="w-3 h-3 rotate-45 mb-1" style={{ backgroundColor: '#3b82f6' }}></div> {/* Blue end diamond */}
             {item.endDate && formatDateShort(item.endDate)}
          </div>
          
           {/* Milestone delivery note for ranges (Specific to image: "首批交付") */}
           {item.label === "B样生产" && (
             <div className="absolute -bottom-8 -right-16 text-[10px] text-gray-600 whitespace-nowrap">
                首批交付
             </div>
           )}
        </div>
      )}
    </div>
  );
};