
import React, { useState, useRef } from 'react';
import { FileImage, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { TimelineChart } from './components/TimelineChart';
import { parseGanttImage } from './services/geminiService';
import { TimelineData, WBSItem } from './types';
import { INITIAL_DATA } from './constants';

const App: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineData>(INITIAL_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Strip prefix "data:image/jpeg;base64,"
        const base64Data = base64String.split(',')[1];
        
        try {
          const newData = await parseGanttImage(base64Data);
          setTimelineData(newData);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze image. Ensure the image is a clear Gantt chart and try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Error reading file.");
      setIsAnalyzing(false);
    }
  };

  const handleUpdateWBS = (rowId: string, wbs: WBSItem[]) => {
    setTimelineData(prev => ({
      ...prev,
      rows: prev.rows.map(row => 
        row.id === rowId ? { ...row, wbs } : row
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-blue-100">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                G
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
               Intelligent Gantt Digitizer
             </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* Hidden File Input */}
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handleFileUpload}
             />
             
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isAnalyzing}
               className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
             >
               {isAnalyzing ? (
                 <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
               ) : (
                 <Sparkles className="w-4 h-4 text-purple-600" />
               )}
               <span>{isAnalyzing ? 'Analyzing...' : 'Import Image'}</span>
             </button>
             
             <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-medium">
               Export JSON
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[98%] mx-auto py-8">
        
        {/* Error Banner */}
        {error && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
            </div>
        )}

        {/* Empty State */}
        {!timelineData && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileImage className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Timeline Loaded</h3>
            <p className="mt-1 text-gray-500">Upload a Gantt chart image to get started.</p>
          </div>
        )}

        {/* Timeline Chart */}
        {timelineData && (
            <TimelineChart 
              data={timelineData} 
              onDataChange={setTimelineData} 
              onUpdateRowWBS={handleUpdateWBS}
            />
        )}
        
        {timelineData && (
            <div className="mt-8 text-center text-sm text-gray-400">
                <p>Tips: Drag milestones horizontally to reschedule. Click "WBS" on rows to break down tasks inline.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
