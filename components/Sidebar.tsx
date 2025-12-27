
import React from 'react';
import { TextOverlay, FontOption } from '../types';

interface Props {
  overlays: TextOverlay[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<TextOverlay>) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
}

const FONTS: FontOption[] = [
  'Inter', 
  'Noto Sans TC',
  'Noto Serif TC',
  'Ma Shan Zheng',
  'Zhi Mang Xing',
  'Long Cang',
  'Playfair Display', 
  'Roboto Mono', 
  'Bebas Neue', 
  'Montserrat', 
  'Pacifico',
  'Lora',
  'Caveat',
  'Oswald',
  'Dancing Script',
  'Anton'
];

const Sidebar: React.FC<Props> = ({ overlays, selectedId, onSelect, onUpdate, onRemove, onExport }) => {
  const selectedOverlay = overlays.find(o => o.id === selectedId);

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
      {/* Action Section */}
      <div className="pb-2">
        <button
          onClick={onExport}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Result
        </button>
      </div>

      {/* Layer Stack */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Layers</label>
          <span className="text-[10px] font-bold text-slate-300">{overlays.length} layers</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {overlays.length === 0 && <p className="text-xs text-slate-300 italic py-2">No active text layers...</p>}
          {overlays.map((o) => (
            <div
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                selectedId === o.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-4 h-4 rounded-full shadow-inner border border-white shrink-0" style={{ backgroundColor: o.color }} />
                <span className={`text-xs font-bold truncate ${selectedId === o.id ? 'text-indigo-900' : 'text-slate-600'}`}>{o.text || 'Empty Layer'}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(o.id); }}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedOverlay && (
        <div className="space-y-5 pt-5 border-t border-slate-100 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Editing Layer</label>
             <button 
                onClick={() => onSelect(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                DONE
              </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">Layer Text</label>
              <textarea
                rows={2}
                value={selectedOverlay.text}
                onChange={(e) => onUpdate(selectedOverlay.id, { text: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter font-inter">Typography Library (Supports 中文)</label>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1 custom-scrollbar">
                {FONTS.map(f => (
                  <button
                    key={f}
                    onClick={() => onUpdate(selectedOverlay.id, { fontFamily: f })}
                    className={`px-3 py-4 rounded-xl text-center text-sm transition-all border flex flex-col items-center justify-center gap-1 ${
                      selectedOverlay.fontFamily === f 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200 ring-offset-1' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <span style={{ fontFamily: f }} className="text-lg leading-tight">Aa/中</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">{f}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">Size ({selectedOverlay.fontSize}px)</label>
                <input 
                  type="range" 
                  min="10" 
                  max="400" 
                  value={selectedOverlay.fontSize} 
                  onChange={(e) => onUpdate(selectedOverlay.id, { fontSize: parseInt(e.target.value) })} 
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter">Thickness</label>
                <select 
                   value={selectedOverlay.fontWeight}
                   onChange={(e) => onUpdate(selectedOverlay.id, { fontWeight: e.target.value })}
                   className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                   <option value="300">Light</option>
                   <option value="400">Regular</option>
                   <option value="600">SemiBold</option>
                   <option value="700">Bold</option>
                   <option value="900">Black</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter text-center">Color</label>
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="color" 
                    value={selectedOverlay.color} 
                    onChange={(e) => onUpdate(selectedOverlay.id, { color: e.target.value })} 
                    className="w-10 h-10 p-0 bg-transparent border-none rounded-full cursor-pointer shadow-md overflow-hidden" 
                  />
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{selectedOverlay.color}</span>
                </div>
              </div>
              <div className="w-px bg-slate-200 h-12 self-center"></div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-tighter text-center">Opacity</label>
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={selectedOverlay.opacity} 
                    onChange={(e) => onUpdate(selectedOverlay.id, { opacity: parseFloat(e.target.value) })} 
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-indigo-600" 
                  />
                   <span className="text-[10px] font-bold text-slate-400">{Math.round(selectedOverlay.opacity * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;