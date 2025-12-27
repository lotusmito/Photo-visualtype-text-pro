
import React, { useState, useRef } from 'react';
import { TextOverlay, DetectedText } from './types';
import EditorCanvas from './components/EditorCanvas';
import Sidebar from './components/Sidebar';
import { getCaptionSuggestions, detectTextInImage } from './services/geminiService';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced color sampling: samples multiple points around the text box to find the best background match
  const getBestBackgroundColor = (ctx: CanvasRenderingContext2D, pxX: number, pxY: number, pxW: number, pxH: number): string => {
    const points = [
      { x: pxX - 5, y: pxY - 5 }, // Top-left outer
      { x: pxX + pxW + 5, y: pxY - 5 }, // Top-right outer
      { x: pxX - 5, y: pxY + pxH + 5 }, // Bottom-left outer
      { x: pxX + pxW + 5, y: pxY + pxH + 5 } // Bottom-right outer
    ];

    const colors = points.map(p => {
      const x = Math.max(0, Math.min(ctx.canvas.width - 1, p.x));
      const y = Math.max(0, Math.min(ctx.canvas.height - 1, p.y));
      const d = ctx.getImageData(x, y, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2] };
    });

    // Simple average for background estimation
    const avg = colors.reduce((acc, curr) => ({
      r: acc.r + curr.r,
      g: acc.g + curr.g,
      b: acc.b + curr.b
    }), { r: 0, g: 0, b: 0 });

    const r = Math.round(avg.r / colors.length);
    const g = Math.round(avg.g / colors.length);
    const b = Math.round(avg.b / colors.length);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const processAndCleanImage = async (dataUrl: string, detected: DetectedText[]): Promise<{ cleanedUrl: string, layers: TextOverlay[] }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve({ cleanedUrl: dataUrl, layers: [] });

        ctx.drawImage(img, 0, 0);

        const layers: TextOverlay[] = detected.map((d, i) => {
          const pxX = (d.xmin / 1000) * canvas.width;
          const pxY = (d.ymin / 1000) * canvas.height;
          const pxW = ((d.xmax - d.xmin) / 1000) * canvas.width;
          const pxH = ((d.ymax - d.ymin) / 1000) * canvas.height;

          // 1. Determine background color
          const bgColor = getBestBackgroundColor(ctx, pxX, pxY, pxW, pxH);

          // 2. DESTRUCTIVE REMOVAL: Actually paint over the original text on the base image
          ctx.fillStyle = bgColor;
          // Apply a "bleed" area to ensure edges of characters are fully covered
          ctx.fillRect(pxX - 4, pxY - 4, pxW + 8, pxH + 8);

          // 3. Create editable replacement layer
          return {
            id: `layer-${i}-${Date.now()}`,
            text: d.text,
            x: d.xmin / 10,
            y: d.ymin / 10,
            fontSize: Math.round((d.ymax - d.ymin) * 0.8),
            color: '#000000',
            backgroundColor: 'transparent', // The original text is already gone from the base
            padding: 0,
            fontFamily: 'Inter',
            fontWeight: '600',
            opacity: 1,
          };
        });

        resolve({
          cleanedUrl: canvas.toDataURL('image/jpeg', 0.98),
          layers
        });
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const originalResult = event.target?.result as string;
        setImage(originalResult);
        setOverlays([]);
        setSelectedId(null);
        
        setIsAnalyzing(true);
        try {
          const detected = await detectTextInImage(originalResult);
          
          if (detected && detected.length > 0) {
            // STEP: Permanently erase pixels and swap the image
            const { cleanedUrl, layers } = await processAndCleanImage(originalResult, detected);
            setImage(cleanedUrl); 
            setOverlays(layers);
          }
          
          // Background suggestion update
          const suggested = await getCaptionSuggestions(originalResult);
          setSuggestions(suggested);
          
        } catch (err) {
          console.error("AI Text Removal failed", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addText = (text: string = 'New Text', x: number = 40, y: number = 45) => {
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      x,
      y,
      fontSize: 50,
      color: '#000000',
      backgroundColor: 'transparent',
      padding: 4,
      fontFamily: 'Inter',
      fontWeight: '600',
      opacity: 1,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setSelectedId(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const exportImage = async () => {
    if (!image) return;

    const img = new Image();
    img.src = image;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    overlays.forEach(o => {
      const realX = (o.x / 100) * canvas.width;
      const realY = (o.y / 100) * canvas.height;
      const scaleFactor = canvas.height / 1000;
      const scaledFontSize = o.fontSize * scaleFactor;

      ctx.font = `${o.fontWeight} ${scaledFontSize}px "${o.fontFamily}"`;
      ctx.textBaseline = 'top';
      ctx.globalAlpha = o.opacity;
      ctx.fillStyle = o.color;
      ctx.fillText(o.text, realX, realY);
      ctx.globalAlpha = 1.0;
    });

    const link = document.createElement('a');
    link.download = 'cleaned-and-edited.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
        <header className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">VisualType Pro</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Automatic Text Eraser</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <section>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <svg className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 uppercase tracking-tight">Upload Image to Erase</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </section>

          {image && (
            <>
              <section>
                <button
                  onClick={() => addText()}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Text Layer
                </button>
              </section>

              <Sidebar
                overlays={overlays}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={updateOverlay}
                onRemove={removeOverlay}
                onExport={exportImage}
              />
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 flex items-center justify-center relative bg-slate-100 overflow-hidden">
        {!image ? (
          <div className="text-center p-16 bg-white rounded-[2rem] shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800">Clear Original Text</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Upload any image and we'll swap original text with editable layers automatically.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Start Erasing
            </button>
          </div>
        ) : (
          <div className="relative">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[2rem] border-2 border-indigo-400/30">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-indigo-800 font-black text-sm uppercase tracking-widest animate-pulse">Scanning Pixels...</p>
                  <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-tighter">Replacing original text with background patches</p>
                </div>
              </div>
            )}
            <EditorCanvas
              image={image}
              overlays={overlays}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateOverlay={updateOverlay}
            />
          </div>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
