import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Loader2, ZoomIn, ZoomOut, Maximize, Trash2 } from 'lucide-react';

interface FridgeItem {
  id: string;
  type: 'note' | 'photo';
  content: string; 
  caption?: string;
  x: number;
  y: number;
  rotation: number;
  color?: string;
  createdAt: number;
}

const COLORS = ['bg-yellow-200', 'bg-rose-200', 'bg-blue-200', 'bg-green-200'];
const BOARD_SIZE = 2000; 

// Utilitaire distance pour le pinch-to-zoom
const getDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export default function SharedFridge({ onClose, currentUser }: { onClose: () => void, currentUser: string }) {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  // Vue (Zoom/Pan)
  const [viewState, setViewState] = useState({ scale: 0.2, x: 0, y: 0 });
  
  // Formulaire Ajout
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- REFS POUR LE DRAG MANUEL (ITEMS) ---
  const dragItemRef = useRef<{
      id: string;
      startX: number;
      startY: number;
      initialItemX: number;
      initialItemY: number;
  } | null>(null);

  // --- REFS POUR LE DRAG MANUEL & ZOOM (BOARD/FOND) ---
  // On utilise une Map pour suivre tous les doigts posés sur l'écran
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setPhotoFile(e.target.files[0]);
  }
};
  // Pour le PAN (déplacement 1 doigt)
  const lastPanPoint = useRef<{ x: number, y: number } | null>(null);

  const isDraggingItemRef = useRef(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // --- SYNCHRO ---
  const fetchFridge = async () => {
    if (isDraggingItemRef.current) return;

    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data) {
        if(data.fridge && Array.isArray(data.fridge)) {
            const uniqueItems = Array.from(new Map(data.fridge.map((item: any) => [item.id, item])).values());
            const safeItems = uniqueItems.map((item: any) => ({
                ...item,
                x: (typeof item.x === 'number' && !isNaN(item.x)) ? item.x : 0,
                y: (typeof item.y === 'number' && !isNaN(item.y)) ? item.y : 0
            }));
            setItems(safeItems as FridgeItem[]);
        }
        if (data.credits && data.credits[currentUser]) {
            setDailyCount(data.credits[currentUser].count);
        }
      }
    } catch (e) { console.error("Sync error", e); }
  };

  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 4000); 
    return () => clearInterval(interval);
  }, [currentUser]);

  // =========================================
  // --- LOGIQUE ITEMS ---
  // =========================================
  
  const onItemDragStart = (e: React.PointerEvent, item: FridgeItem) => {
      e.preventDefault();
      e.stopPropagation();

      dragItemRef.current = {
          id: item.id,
          startX: e.clientX,
          startY: e.clientY,
          initialItemX: item.x,
          initialItemY: item.y
      };
      isDraggingItemRef.current = true;

      window.addEventListener('pointermove', onItemDragMove);
      window.addEventListener('pointerup', onItemDragEnd);
  };

  const onItemDragMove = (e: PointerEvent) => {
      if (!dragItemRef.current) return;
      const { startX, startY, initialItemX, initialItemY, id } = dragItemRef.current;
      
      const deltaX = (e.clientX - startX) / viewState.scale;
      const deltaY = (e.clientY - startY) / viewState.scale;

      let newX = initialItemX + deltaX;
      let newY = initialItemY + deltaY;

      newX = Math.max(0, Math.min(newX, BOARD_SIZE - 200));
      newY = Math.max(0, Math.min(newY, BOARD_SIZE - 200));

      const el = document.getElementById(`item-${id}`);
      if (el) {
          el.style.transform = `translate(${newX}px, ${newY}px) rotate(${items.find(i => i.id === id)?.rotation || 0}deg)`;
          el.dataset.tempX = newX.toString();
          el.dataset.tempY = newY.toString();
      }
  };

  const onItemDragEnd = async () => {
      if (!dragItemRef.current) return;
      const { id } = dragItemRef.current;

      window.removeEventListener('pointermove', onItemDragMove);
      window.removeEventListener('pointerup', onItemDragEnd);

      const el = document.getElementById(`item-${id}`);
      if (el && el.dataset.tempX && el.dataset.tempY) {
          const finalX = parseFloat(el.dataset.tempX);
          const finalY = parseFloat(el.dataset.tempY);

          setItems(prev => prev.map(i => i.id === id ? { ...i, x: finalX, y: finalY } : i));

          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_fridge_item_pos',
                fridgeItemId: id,
                fridgeItem: { x: finalX, y: finalY }
            })
        });
      }

      dragItemRef.current = null;
      setTimeout(() => { isDraggingItemRef.current = false; }, 500);
  };

  // =========================================
  // --- LOGIQUE BOARD (PAN & PINCH ZOOM) ---
  // =========================================

  const onBoardPointerDown = (e: React.PointerEvent) => {
      // On capture le pointeur pour ne pas le perdre
      (e.target as Element).setPointerCapture(e.pointerId);
      
      // On ajoute le doigt à la liste
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Si on a 2 doigts -> Début du PINCH ZOOM
      if (activePointers.current.size === 2) {
          const points = Array.from(activePointers.current.values());
          initialPinchDist.current = getDistance(points[0], points[1]);
          initialScale.current = viewState.scale;
          lastPanPoint.current = null; // On arrête le pan quand on zoom
      } 
      // Si on a 1 doigt -> Début du PAN
      else if (activePointers.current.size === 1) {
          lastPanPoint.current = { x: e.clientX, y: e.clientY };
      }
  };

  const onBoardPointerMove = (e: React.PointerEvent) => {
      // Mise à jour de la position du doigt actuel
      if (activePointers.current.has(e.pointerId)) {
          activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // --- CAS 1 : PINCH ZOOM (2 doigts) ---
      if (activePointers.current.size === 2 && initialPinchDist.current) {
          const points = Array.from(activePointers.current.values());
          const currentDist = getDistance(points[0], points[1]);
          
          // Ratio de zoom
          const scaleFactor = currentDist / initialPinchDist.current;
          let newScale = initialScale.current * scaleFactor;
          
          // Limites Zoom
          newScale = Math.min(Math.max(0.1, newScale), 3);
          
          setViewState(prev => ({ ...prev, scale: newScale }));
          return;
      }

      // --- CAS 2 : PAN (1 doigt) ---
      if (activePointers.current.size === 1 && lastPanPoint.current) {
          const deltaX = e.clientX - lastPanPoint.current.x;
          const deltaY = e.clientY - lastPanPoint.current.y;
          
          setViewState(prev => ({
              ...prev,
              x: prev.x + deltaX,
              y: prev.y + deltaY
          }));

          lastPanPoint.current = { x: e.clientX, y: e.clientY };
      }
  };

  const onBoardPointerUp = (e: React.PointerEvent) => {
      (e.target as Element).releasePointerCapture(e.pointerId);
      activePointers.current.delete(e.pointerId);

      // Si on passe de 2 à 1 doigt, on réinitialise le pan pour éviter un saut
      if (activePointers.current.size < 2) {
          initialPinchDist.current = null;
      }
      if (activePointers.current.size === 1) {
          const point = activePointers.current.values().next().value;
          lastPanPoint.current = point; // On reprend le pan là où est le doigt restant
      } else {
          lastPanPoint.current = null;
      }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); 
    const zoomFactor = -e.deltaY * 0.001; 
    setViewState(prev => {
      let newScale = Math.min(Math.max(0.1, prev.scale + zoomFactor), 3);
      return { ...prev, scale: newScale };
    });
  };

  // --- UI & Helpers ---
  const fitScreen = () => {
      if (!boardContainerRef.current) return;
      const { clientWidth: w, clientHeight: h } = boardContainerRef.current;
      const newScale = Math.min((w - 40) / BOARD_SIZE, (h - 40) / BOARD_SIZE, 1);
      setViewState({ scale: newScale, x: (w - BOARD_SIZE * newScale) / 2, y: (h - BOARD_SIZE * newScale) / 2 });
  };

  useEffect(() => { setTimeout(fitScreen, 100); }, []);

  const handleClearFridge = async () => {
      if (!confirm("Tout vider ?")) return;
      setItems([]); 
      isDraggingItemRef.current = true; 
      await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_fridge' }) 
      });
      setTimeout(() => { isDraggingItemRef.current = false; }, 2000); 
  };

  const handleAddItem = async () => {
    if (dailyCount >= 3) return;
    setIsUploading(true);
    try {
        let content = noteText;
        if (newItemType === 'photo' && photoFile) {
            content = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(photoFile);
            });
        }

        const newItem: FridgeItem = {
            id: Date.now().toString() + Math.random().toString().slice(2,5),
            type: newItemType,
            content: content,
            caption: photoCaption,
            color: noteColor,
            x: BOARD_SIZE / 2 - 100 + (Math.random() * 50), 
            y: BOARD_SIZE / 2 - 100 + (Math.random() * 50), 
            rotation: Math.random() * 6 - 3,
            createdAt: Date.now()
        };

        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_fridge_item', fridgeItem: newItem, currentUser: currentUser })
        });
        
        if(res.ok) {
            setItems(prev => [...prev, newItem]);
            setDailyCount(prev => prev + 1);
            setIsAdding(false);
            setNoteText(''); setPhotoFile(null); setPhotoCaption('');
        } else if(res.status === 403) { alert("Limite atteinte !"); }
    } catch (e) { alert("Erreur ajout"); } 
    finally { setIsUploading(false); }
  };

  return (
    <div 
        className="fixed inset-0 z-[90] bg-gray-900 touch-none overflow-hidden" 
        ref={boardContainerRef} 
        onWheel={handleWheel}
        // Événements globaux du conteneur pour le Pan/Zoom tactile
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onPointerLeave={onBoardPointerUp}
    >
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-200 pointer-events-auto">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">❄️ Frigo ({items.length})</h2>
              <div className="text-xs text-gray-500 font-mono">Crédits : {dailyCount}/3</div>
          </div>
          <div className="flex gap-2 pointer-events-auto">
              <div className="flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg">
                  <button onClick={() => setViewState(v => ({...v, scale: Math.min(v.scale + 0.1, 3)}))} className="p-2 hover:bg-gray-100 rounded"><ZoomIn className="w-5 h-5"/></button>
                  <button onClick={() => setViewState(v => ({...v, scale: Math.max(v.scale - 0.1, 0.1)}))} className="p-2 hover:bg-gray-100 rounded"><ZoomOut className="w-5 h-5"/></button>
                  <button onClick={fitScreen} className="p-2 hover:bg-gray-100 rounded"><Maximize className="w-5 h-5"/></button>
              </div>
              <button onClick={onClose} className="bg-rose-500 text-white p-3 rounded-xl shadow-lg h-fit"><X className="w-6 h-6"/></button>
          </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[100] pointer-events-auto">
          <button onClick={handleClearFridge} className="bg-red-500 text-white p-4 rounded-full shadow-2xl border-4 border-white active:scale-90 transition-transform">
            <Trash2 className="w-6 h-6" />
          </button>
      </div>

      {/* BOARD (LE FOND) */}
      <div className="w-full h-full touch-none select-none">
          <motion.div
            ref={boardRef}
            animate={{ x: viewState.x, y: viewState.y, scale: viewState.scale }}
            transition={{ type: "tween", duration: 0 }} 
            className="shadow-2xl relative origin-top-left bg-[#f0e6d2]"
            style={{ 
                width: BOARD_SIZE, height: BOARD_SIZE,
                border: '20px solid #e6dac0',
                backgroundImage: 'repeating-linear-gradient(45deg, #e6dac0 25%, transparent 25%, transparent 75%, #e6dac0 75%, #e6dac0), repeating-linear-gradient(45deg, #e6dac0 25%, #f0e6d2 25%, #f0e6d2 75%, #e6dac0 75%, #e6dac0)',
                backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px',
            }}
          >
             {items.map((item) => (
                <div
                    id={`item-${item.id}`}
                    key={item.id}
                    onPointerDown={(e) => onItemDragStart(e, item)}
                    className="absolute hover:z-[999] cursor-move touch-none"
                    style={{ 
                        left: 0, top: 0,
                        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`,
                        width: '200px',
                        touchAction: 'none'
                    }} 
                >
                    {item.type === 'note' ? (
                        <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg flex items-center justify-center text-center select-none pointer-events-none`}>
                            {item.content}
                        </div>
                    ) : (
                        <div className="bg-white p-2 pb-8 shadow-xl w-48 select-none pointer-events-none">
                            <div className="w-full h-40 bg-gray-100 overflow-hidden mb-2 relative">
                                <img src={item.content} alt="img" className="w-full h-full object-cover" />
                            </div>
                            <p className="font-handwriting text-center text-xs truncate px-1">{item.caption}</p>
                        </div>
                    )}
                </div>
             ))}
          </motion.div>
      </div>

      {/* BOUTON AJOUT */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <button onClick={() => setIsAdding(true)} disabled={dailyCount >= 3} className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl border-4 border-white font-bold text-lg transition-transform active:scale-95 ${dailyCount >= 3 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'}`}>
            <Plus className="w-6 h-6" /> {dailyCount >= 3 ? 'À demain !' : 'Ajouter'}
        </button>
      </div>

{/* MODAL AJOUT */}
      {isAdding && (
         <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsAdding(false)} style={{ touchAction: 'auto' }}>
             <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                 <h3 className="text-xl font-bold mb-4">Ajouter sur le frigo</h3>
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setNewItemType('note')} className={`flex-1 py-2 rounded-xl font-bold ${newItemType === 'note' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100'}`}>Note 📝</button>
                     <button onClick={() => setNewItemType('photo')} className={`flex-1 py-2 rounded-xl font-bold ${newItemType === 'photo' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100'}`}>Photo 📸</button>
                 </div>
                 {newItemType === 'note' ? (
                     <>
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Message..." className="w-full h-32 p-4 bg-gray-50 rounded-xl mb-4 resize-none text-base" />
                        <div className="flex justify-center gap-3 mb-4">
                            {COLORS.map(c => ( <button key={c} onClick={() => setNoteColor(c)} className={`w-8 h-8 rounded-full ${c} border-2 ${noteColor === c ? 'border-gray-500' : 'border-transparent'}`} /> ))}
                        </div>
                     </>
                 ) : (
                     <div className="mb-4 space-y-2">
                         <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" 
                         />
                         <input type="text" placeholder="Légende..." value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full p-2 border rounded text-base" />
                     </div>
                 )}
                 <button onClick={handleAddItem} disabled={isUploading} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold">
                     {isUploading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'Coller'}
                 </button>
             </div>
         </div>
      )}
    </div>
  );
}