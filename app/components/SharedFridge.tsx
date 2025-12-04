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

export default function SharedFridge({ onClose, currentUser }: { onClose: () => void, currentUser: string }) {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  const [viewState, setViewState] = useState({ scale: 0.2, x: 0, y: 0 });
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Ref pour empêcher la synchro pendant qu'on vide ou qu'on bouge un truc
  const skipSyncRef = useRef(false);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // --- FONCTION DE SYNCHRO (CORRIGÉE ANTI-CRASH) ---
  const fetchFridge = async () => {
    // 1. Si on vide le frigo, on ne sync pas
    if (skipSyncRef.current) return;
    
    // 2. CRUCIAL : Si l'utilisateur est en train de bouger un objet, ON STOPPE LA SYNC
    // Sinon le serveur remet l'objet à son ancienne place pendant que tu le bouges -> CRASH
    if (draggingId) return;

    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data) {
        if(data.fridge && Array.isArray(data.fridge)) {
            // Nettoyage Client : Anti-Doublon et Anti-NaN
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
        } else {
            setDailyCount(0);
        }
      }
    } catch (e) { console.error("Erreur sync:", e); }
  };

  // Intervalle de synchro
  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 4000); 
    return () => clearInterval(interval);
  }, [currentUser, draggingId]); // On ajoute draggingId pour que l'effet réagisse

  const fitScreen = () => {
      if (!boardContainerRef.current) return;
      const { clientWidth: w, clientHeight: h } = boardContainerRef.current;
      const padding = 20; 
      const ratioW = (w - padding) / BOARD_SIZE;
      const ratioH = (h - padding) / BOARD_SIZE;
      const newScale = Math.min(ratioW, ratioH, 1);
      const startX = (w - BOARD_SIZE * newScale) / 2;
      const startY = (h - BOARD_SIZE * newScale) / 2;
      setViewState({ scale: newScale, x: startX, y: startY });
  };

  useEffect(() => {
      const timer = setTimeout(fitScreen, 100);
      return () => clearTimeout(timer);
  }, []);

  // --- DRAG LOGIQUE ---
  const handleItemPointerDown = (e: React.PointerEvent, item: FridgeItem) => {
    e.stopPropagation(); 
    e.preventDefault();
    
    // On met draggingId TOUT DE SUITE pour bloquer le fetchFridge
    setDraggingId(item.id);

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const mouseXOnBoard = (e.clientX - rect.left) / viewState.scale;
    const mouseYOnBoard = (e.clientY - rect.top) / viewState.scale;
    
    dragOffset.current = { x: mouseXOnBoard - item.x, y: mouseYOnBoard - item.y };
    
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleItemPointerMove = (e: React.PointerEvent) => {
      if (!draggingId || !boardRef.current) return;
      e.preventDefault();
      
      const rect = boardRef.current.getBoundingClientRect();
      const mouseXOnBoard = (e.clientX - rect.left) / viewState.scale;
      const mouseYOnBoard = (e.clientY - rect.top) / viewState.scale;

      let newX = mouseXOnBoard - dragOffset.current.x;
      let newY = mouseYOnBoard - dragOffset.current.y;

      const ITEM_SIZE = 200; 
      newX = Math.max(0, Math.min(newX, BOARD_SIZE - ITEM_SIZE));
      newY = Math.max(0, Math.min(newY, BOARD_SIZE - ITEM_SIZE));

      // Mise à jour locale optimiste
      setItems(prev => prev.map(i => i.id === draggingId ? { ...i, x: newX, y: newY } : i));
  };

  const handleItemPointerUp = async (e: React.PointerEvent) => {
      if (!draggingId) return;
      const currentId = draggingId; // On capture l'ID
      const item = items.find(i => i.id === currentId);
      
      // On relâche le drag
      setDraggingId(null);
      (e.target as Element).releasePointerCapture(e.pointerId);

      // On envoie la position finale au serveur
      if (item) {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_fridge_item_pos',
                fridgeItemId: item.id,
                fridgeItem: { x: item.x, y: item.y }
            })
        });
      }
  };

  const handleBoardDrag = (e: any, info: any) => {
      setViewState(prev => ({ ...prev, x: prev.x + info.delta.x, y: prev.y + info.delta.y }));
  };

  const handleClearFridge = async () => {
      if (!confirm("Es-tu sûr de vouloir TOUT retirer du frigo ?")) return;
      setItems([]); 
      skipSyncRef.current = true;
      setTimeout(() => { skipSyncRef.current = false; }, 2000); 

      await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_fridge' }) 
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
          alert("Capture d'écran requise pour les photos iPhone !");
          setPhotoFile(null); return;
      }
      setPhotoFile(file);
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
      };
    });
  };

  const handleAddItem = async () => {
    if (dailyCount >= 3) return;
    setIsUploading(true);
    try {
        let content = noteText;
        if (newItemType === 'photo' && photoFile) content = await compressImage(photoFile);

        const startX = BOARD_SIZE / 2 - 100 + (Math.random() * 40 - 20);
        const startY = BOARD_SIZE / 2 - 100 + (Math.random() * 40 - 20);

        const newItem: FridgeItem = {
            id: Date.now().toString() + Math.random().toString().slice(2, 8),
            type: newItemType,
            content: content,
            caption: photoCaption,
            color: noteColor,
            x: startX, y: startY, 
            rotation: Math.random() * 10 - 5,
            createdAt: Date.now()
        };

        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_fridge_item', fridgeItem: newItem, currentUser: currentUser })
        });
        
        if(!res.ok) {
            if(res.status === 403) alert("Limite atteinte pour aujourd'hui !");
        } else {
            setItems(prev => [...prev, newItem]);
            setDailyCount(prev => prev + 1);
            setIsAdding(false);
            setNoteText(''); setPhotoFile(null); setPhotoCaption('');
        }
    } catch (e) { alert("Erreur."); } 
    finally { setIsUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-gray-900 touch-none overflow-hidden" ref={boardContainerRef}>
      
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-200 pointer-events-auto">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">❄️ Frigo de {currentUser === 'ramzi2010' ? 'Ramzi' : 'Minou'}</h2>
              <div className="text-xs text-gray-500 font-mono">Crédits : {dailyCount}/3</div>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
              <div className="flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-gray-200">
                  <button onClick={() => setViewState(v => ({...v, scale: Math.min(v.scale + 0.1, 2)}))} className="p-2 hover:bg-gray-100 rounded-lg"><ZoomIn className="w-5 h-5 text-gray-600"/></button>
                  <button onClick={() => setViewState(v => ({...v, scale: Math.max(v.scale - 0.1, 0.1)}))} className="p-2 hover:bg-gray-100 rounded-lg"><ZoomOut className="w-5 h-5 text-gray-600"/></button>
                  <button onClick={fitScreen} className="p-2 hover:bg-gray-100 rounded-lg" title="Recentrer"><Maximize className="w-5 h-5 text-gray-600"/></button>
              </div>
              <button onClick={onClose} className="bg-rose-500 text-white p-3 rounded-xl shadow-lg hover:bg-rose-600 h-fit">
                <X className="w-6 h-6" />
              </button>
          </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[100] pointer-events-auto">
          <button onClick={handleClearFridge} className="bg-red-500 text-white p-4 rounded-full shadow-2xl hover:bg-red-600 border-4 border-white transition-transform active:scale-90" title="Tout vider">
            <Trash2 className="w-6 h-6" />
          </button>
      </div>

      <div className="w-full h-full touch-none select-none">
          <motion.div
            ref={boardRef}
            drag
            dragMomentum={false}
            onDrag={handleBoardDrag}
            dragListener={!draggingId} 
            animate={{ x: viewState.x, y: viewState.y, scale: viewState.scale }}
            transition={{ type: "tween", duration: draggingId ? 0 : 0.2 }}
            className="shadow-2xl relative origin-top-left bg-[#f0e6d2]"
            style={{ 
                width: BOARD_SIZE,
                height: BOARD_SIZE,
                border: '20px solid #e6dac0',
                backgroundImage: 'repeating-linear-gradient(45deg, #e6dac0 25%, transparent 25%, transparent 75%, #e6dac0 75%, #e6dac0), repeating-linear-gradient(45deg, #e6dac0 25%, #f0e6d2 25%, #f0e6d2 75%, #e6dac0 75%, #e6dac0)',
                backgroundPosition: '0 0, 10px 10px',
                backgroundSize: '20px 20px',
                touchAction: 'none'
            }}
            onPointerMove={handleItemPointerMove}
            onPointerUp={handleItemPointerUp}
            onPointerLeave={handleItemPointerUp}
          >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-center">
                 <span className="text-9xl">❄️</span>
                 <p className="text-4xl font-serif text-[#8c8270] mt-4">Notre Espace</p>
             </div>

             {items.map((item) => (
                <div
                    key={item.id}
                    onPointerDown={(e) => handleItemPointerDown(e, item)}
                    className="absolute hover:z-50 cursor-move active:cursor-grabbing touch-none"
                    style={{ 
                        left: 0, top: 0,
                        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`,
                        width: '200px', touchAction: 'none'
                    }} 
                >
                    {item.type === 'note' ? (
                        <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg leading-relaxed flex items-center justify-center text-center select-none hover:shadow-2xl transition-shadow pointer-events-none`}>
                            {item.content}
                        </div>
                    ) : (
                        <div className="bg-white p-2 pb-8 shadow-xl w-48 select-none hover:shadow-2xl transition-shadow pointer-events-none">
                            <div className="w-full h-40 bg-gray-100 overflow-hidden mb-2 relative">
                                <img src={item.content} alt="Souvenir" className="w-full h-full object-cover" />
                            </div>
                            <p className="font-handwriting text-center text-gray-600 text-xs truncate px-1">{item.caption}</p>
                        </div>
                    )}
                </div>
             ))}
          </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <button 
            onClick={() => setIsAdding(true)}
            disabled={dailyCount >= 3}
            className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl border-4 border-white font-bold text-lg transition-transform hover:scale-105 active:scale-95 ${dailyCount >= 3 ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'}`}
        >
            <Plus className="w-6 h-6" /> {dailyCount >= 3 ? 'Reviens demain' : 'Ajouter un mot'}
        </button>
      </div>

      {isAdding && (
         <div className="absolute inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
             <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10" onClick={(e) => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Ajouter sur le frigo</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400 p-2"><X /></button>
                 </div>
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setNewItemType('note')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newItemType === 'note' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Note 📝</button>
                     <button onClick={() => setNewItemType('photo')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newItemType === 'photo' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Photo 📸</button>
                 </div>
                 {newItemType === 'note' ? (
                     <>
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ton message..." className="w-full h-32 p-4 bg-gray-50 rounded-2xl mb-4 focus:ring-2 focus:ring-rose-200 text-base resize-none" autoFocus />
                        <div className="flex justify-center gap-3 mb-6">
                            {COLORS.map(c => ( <button key={c} onClick={() => setNoteColor(c)} className={`w-8 h-8 rounded-full ${c} border-2 ${noteColor === c ? 'border-gray-500 scale-125' : 'border-transparent'}`} /> ))}
                        </div>
                     </>
                 ) : (
                     <div className="space-y-4 mb-6">
                         <label className="block w-full aspect-video bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                             {photoFile ? <div className="text-green-500 font-bold flex items-center gap-2 truncate px-4"><ImageIcon/> {photoFile.name.slice(0, 15)}...</div> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2"/> Choisir une image (JPG/PNG)</div>}
                             <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden"/>
                         </label>
                         <input type="text" placeholder="Légende..." value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-base focus:ring-2 focus:ring-rose-200" />
                     </div>
                 )}
                 <button onClick={handleAddItem} disabled={isUploading || (newItemType === 'note' && !noteText) || (newItemType === 'photo' && !photoFile)} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-rose-600 transition-colors">
                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Coller sur le frigo !'}
                 </button>
             </div>
         </div>
      )}
    </div>
  );
}