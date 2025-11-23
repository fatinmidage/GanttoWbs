
import React, { useState, useRef, useEffect } from 'react';
import { TimelineData, WBSItem } from '../types';
import { Sparkles, Loader2, X, Plus, ChevronRight, ChevronDown, Calendar, Trash2, Save } from 'lucide-react';
import { generateWBS } from '../services/geminiService';
import { dateToX, formatDateShort } from '../utils';

interface Props {
  rowId: string;
  data: TimelineData;
  onUpdateRow: (rowId: string, wbs: WBSItem[]) => void;
  onClose: () => void;
}

interface EditState {
  item: WBSItem;
  top: number;
  left: number;
}

export const WBSView: React.FC<Props> = ({ rowId, data, onUpdateRow, onClose }) => {
  const row = data.rows.find(r => r.id === rowId);
  const rowItems = data.items.filter(i => i.rowId === rowId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<EditState | null>(null);

  // Form state for the editing modal
  const [editForm, setEditForm] = useState<{taskName: string, startDate: string, endDate: string}>({
    taskName: '', startDate: '', endDate: ''
  });

  if (!row) return null;

  const wbsItems = row.wbs || [];

  // --- Handlers ---

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newItems = await generateWBS(row.label, rowItems);
      // Auto-expand new parent items
      const newExpanded = new Set(expandedItems);
      newItems.forEach(i => {
          if (i.subTasks && i.subTasks.length > 0) newExpanded.add(i.id);
      });
      setExpandedItems(newExpanded);
      onUpdateRow(rowId, newItems);
    } catch (e) {
      console.error(e);
      alert("Failed to generate WBS");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const updateItemRecursively = (items: WBSItem[], id: string, updates: Partial<WBSItem> | null): WBSItem[] => {
    // If updates is null, it means delete
    return items.reduce((acc, item) => {
      if (item.id === id) {
        if (updates === null) return acc; // Delete: don't push to acc
        acc.push({ ...item, ...updates });
      } else {
        const newItem = { ...item };
        if (item.subTasks) {
          newItem.subTasks = updateItemRecursively(item.subTasks, id, updates);
        }
        acc.push(newItem);
      }
      return acc;
    }, [] as WBSItem[]);
  };

  const handleSaveEdit = () => {
    if (!editState) return;
    const newItems = updateItemRecursively(wbsItems, editState.item.id, editForm);
    onUpdateRow(rowId, newItems);
    setEditState(null);
  };

  const handleDeleteItem = () => {
    if (!editState) return;
    if (confirm("Delete this task?")) {
      const newItems = updateItemRecursively(wbsItems, editState.item.id, null);
      onUpdateRow(rowId, newItems);
      setEditState(null);
    }
  };

  const openEditModal = (e: React.MouseEvent, item: WBSItem) => {
    e.stopPropagation();
    // Calculate position relative to the container view
    // We'll just position it near the click, clamped to viewport logic if needed, 
    // but for simplicity we use the client coords transformed or absolute offsets.
    // Since the container is scrollable, fixed position or absolute relative to a parent is tricky.
    // We will render the modal absolutely within this component, using the click event's offset relative to the component? 
    // Simpler: Use e.clientY and e.clientX relative to the container logic, or just a fixed centered modal if it's too complex.
    // Let's try a popover near the bar.
    
    // We use the bar's bounding rect
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // We need coordinates relative to the `WBSView` container if we position absolutely inside it.
    // Actually, fixed position for the modal is easiest to handle z-index and scrolling.
    
    setEditForm({
      taskName: item.taskName,
      startDate: item.startDate,
      endDate: item.endDate
    });
    setEditState({
      item,
      top: rect.bottom + window.scrollY + 10, 
      left: Math.max(160, rect.left + window.scrollX) // Prevent going too far left
    });
  };

  // --- Recursive Render ---

  const renderRow = (item: WBSItem, level: number = 0): React.ReactNode[] => {
    const isExpanded = expandedItems.has(item.id);
    const hasSubs = item.subTasks && item.subTasks.length > 0;
    
    let nodes: React.ReactNode[] = [];

    // Coordinates
    const startX = dateToX(item.startDate, data.startDate);
    const endX = dateToX(item.endDate, data.startDate);
    const width = Math.max(endX - startX, 20); // Min width for visibility

    // Row Element
    nodes.push(
      <div key={item.id} className="flex h-12 border-b border-gray-100 hover:bg-gray-50 group transition-colors">
        
        {/* Sticky Left: Hierarchy Controls (Matches Header Width w-40 = 160px) */}
        <div 
          className="sticky left-0 w-40 shrink-0 bg-white/95 backdrop-blur border-r border-gray-200 flex items-center z-10"
          style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
           {hasSubs && (
             <button 
                onClick={() => toggleExpand(item.id)}
                className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
             >
               {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
             </button>
           )}
           {/* Visual Guide Line for hierarchy could go here */}
           {!hasSubs && <div className="w-6" />} 
           
           {/* Tiny label for deep nested items if they get lost? No, user wanted to delete text. */}
        </div>

        {/* Timeline Area */}
        <div className="relative flex-1">
           {/* Grid Lines (Visual aid) */}
           <div className="absolute inset-0 border-l border-gray-50 pointer-events-none" />

           {/* The Bar */}
           <div 
              className={`absolute top-2 h-8 rounded-md shadow-sm border border-white/20 cursor-pointer group/bar flex flex-col justify-center px-2 overflow-hidden
                ${hasSubs ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-blue-500 hover:bg-blue-600'}
                transition-all hover:shadow-md hover:scale-[1.01]
              `}
              style={{ left: startX, width: width }}
              onClick={(e) => openEditModal(e, item)}
           >
              {/* Bar Content */}
              <div className="text-xs font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm">
                {item.taskName}
              </div>
              
              {/* Dates Subtitle */}
              {width > 60 && (
                <div className="text-[10px] text-white/90 whitespace-nowrap overflow-hidden opacity-0 group-hover/bar:opacity-100 transition-opacity">
                  {formatDateShort(item.startDate)} - {formatDateShort(item.endDate)}
                </div>
              )}
           </div>

           {/* Outside Label if bar is too small */}
           {width < 60 && (
             <div 
                className="absolute top-3 text-xs text-gray-500 whitespace-nowrap pointer-events-none"
                style={{ left: startX + width + 8 }}
             >
               {item.taskName}
             </div>
           )}
        </div>
      </div>
    );

    // Children
    if (hasSubs && isExpanded) {
      item.subTasks!.forEach(sub => {
        nodes = nodes.concat(renderRow(sub, level + 1));
      });
    }

    return nodes;
  };

  return (
    <div className="w-full flex flex-col bg-white border-b-4 border-gray-200 shadow-inner min-h-[150px]">
      
      {/* Toolbar */}
      <div className="sticky left-0 right-0 top-0 z-30 flex items-center justify-between p-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center space-x-2 pl-4">
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">WBS Editor</span>
            <span className="font-semibold text-gray-700 text-sm">{row.label}</span>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-50 text-xs shadow-sm transition-colors font-medium"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>AI Breakdown</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-300 rounded text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Main Content List */}
      <div className="flex flex-col relative pb-8">
        {wbsItems.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
             <Sparkles className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-sm italic">No breakdown yet.</p>
             <p className="text-xs mt-1">Click "AI Breakdown" to generate tasks automatically.</p>
          </div>
        ) : (
          wbsItems.map(item => renderRow(item))
        )}
      </div>

      {/* Edit Popover (Fixed positioning for simplicity in handling stacking context) */}
      {editState && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setEditState(null)} />
          
          {/* Modal */}
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 flex flex-col space-y-3 animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: Math.min(editState.top, window.innerHeight - 250), // Prevent bottom overflow
              left: Math.min(editState.left, window.innerWidth - 300) // Prevent right overflow
            }}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-bold text-gray-800">Edit Task</h3>
              <button onClick={() => setEditState(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">Task Name</label>
              <input 
                autoFocus
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={editForm.taskName}
                onChange={e => setEditForm(prev => ({ ...prev, taskName: e.target.value }))}
              />
            </div>

            <div className="flex space-x-2">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Start</label>
                <input 
                  type="date"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  value={editForm.startDate}
                  onChange={e => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">End</label>
                <input 
                  type="date"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  value={editForm.endDate}
                  onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100 mt-1">
              <button 
                onClick={handleDeleteItem}
                className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center space-x-1 shadow-sm transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
