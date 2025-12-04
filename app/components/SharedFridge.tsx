import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Loader2, Trash2, ZoomIn, ZoomOut, Move } from 'lucide-react';

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

// On ajoute la prop currentUser pour séparer les crédits
export default function SharedFridge({ onClose, currentUser }: { onClose: () => void, currentUser: string }) {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  // États Zoom & Pan
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  
  // États Ajout
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- GESTION HEIC ---
  const compressImage = async (file: File): Promise<string> => {
    let imageToProcess = file;
    // Vérification simplifiée de l'extension
    if (file.name.toLowerCase().endsWith('.heic')) {
        try {
            // Import dynamique sécurisé
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.6 });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            imageToProcess = new File([blob], "converted.jpg", { type: "image/jpeg" });
        } catch (e) { 
            console.error("Erreur HEIC (le fichier sera traité comme tel):", e);
            alert("Attention : Le format HEIC a posé problème, on essaie quand même.");
        }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageToProcess);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // Réduit pour perf
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (err) => reject(err);
      };
    });
  };

  // --- SYNC ---
  const fetchFridge = async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data && data.fridge) {
        setItems(data.fridge);
      }
    } catch (e) { console.error("Erreur sync:", e); }
  };

  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 3000);
    
    // GESTION CRÉDITS PAR UTILISATEUR
    // On utilise une clé unique basée sur le pseudo (minou ou ramzi2010)
    const storageKey = `fridge_credits_${currentUser}`;
    const dateKey = `fridge_date_${currentUser}`;
    
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(dateKey);
    const savedCount = parseInt(localStorage.getItem(storageKey) || '0');
    
    if (savedDate === today) {
        setDailyCount(savedCount);
    } else {
        localStorage.setItem(dateKey, today);
        localStorage.setItem(storageKey, '0');
        setDailyCount(0);
    }
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // --- GESTION DU DRAG & DROP CORRECT ---
  const handleDragEnd = async (id: string, info: any) => {
    if (!boardRef.current) return;
    
    // On récupère l'élément déplacé
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Calcul de la nouvelle position en pourcentage
    // info.offset contient le déplacement en pixels depuis le début du drag
    // On doit prendre en compte le ZOOM (scale)
    const deltaX = info.offset.x / scale;
    const deltaY = info.offset.y / scale;

    const boardWidth = 2000; // Taille fixe du board
    const boardHeight = 2000;

    // Conversion en %
    let newX = item.x + (deltaX / boardWidth) * 100;
    let newY = item.y + (deltaY / boardHeight) * 100;

    // Limites (pour pas sortir du frigo)
    newX = Math.max(0, Math.min(90, newX));
    newY = Math.max(0, Math.min(90, newY));

    // Update optimiste local
    setItems(prev => prev.map(i => i.id === id ? { ...i, x: newX, y: newY } : i));

    // Save
    await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update_fridge_item_pos',
            fridgeItemId: id,
            fridgeItem: { x: newX, y: newY }
        })
    });
  };

  // --- AJOUT ---
  const handleAddItem = async () => {
    if (dailyCount >= 3) return;
    setIsUploading(true);

    try {
        let content = noteText;
        if (newItemType === 'photo' && photoFile) content = await compressImage(photoFile);

        // On place l'item au centre de la VUE ACTUELLE
        // On annule le déplacement (position) et on centre par rapport au scale
        const boardWidth = 2000;
        const boardHeight = 2000;
        
        // Calcul un peu arbitraire mais centré "visuellement"
        // On prend le centre du board (50%) moins le déplacement actuel divisé par la taille
        let startX = 50 - (position.x / scale / boardWidth * 100);
        let startY = 50 - (position.y / scale / boardHeight * 100);
        
        startX = Math.max(10, Math.min(90, startX));
        startY = Math.max(10, Math.min(90, startY));

        const newItem: FridgeItem = {
            id: Date.now().toString(),
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
            body: JSON.stringify({ action: 'add_fridge_item', fridgeItem: newItem })
        });
        
        if(!res.ok) throw new Error('Erreur');

        setItems(prev => [...prev, newItem]);
        
        // Update Crédits
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem(`fridge_credits_${currentUser}`, newCount.toString());
        
        setIsAdding(false);
        setNoteText(''); setPhotoFile(null); setPhotoCaption('');
    } catch (e) { alert("Erreur lors de l'ajout."); } 
    finally { setIsUploading(false); }
  };

  // --- GESTION DU PAN (DÉPLACEMENT DU BOARD) ---
  const handleBoardDrag = (e: any, info: any) => {
      setPosition({
          x: position.x + info.delta.x,
          y: position.y + info.delta.y
      });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
      
      {/* UI HEADER FLOTTANT */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-200 pointer-events-auto">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">❄️ Frigo de {currentUser === 'ramzi2010' ? 'Ramzi' : 'Minou'}</h2>
              <div className="text-xs text-gray-500 font-mono">Crédits : {dailyCount}/3 aujourd'hui</div>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
              <div className="flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-gray-200">
                  <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-2 hover:bg-gray-100 rounded-lg"><ZoomIn className="w-5 h-5 text-gray-600"/></button>
                  <button onClick={() => setScale(s => Math.max(s - 0.1, 0.3))} className="p-2 hover:bg-gray-100 rounded-lg"><ZoomOut className="w-5 h-5 text-gray-600"/></button>
                  <button onClick={() => { setScale(0.5); setPosition({x:0, y:0}); }} className="p-2 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500">Reset</button>
              </div>
              <button onClick={onClose} className="bg-rose-500 text-white p-3 rounded-xl shadow-lg hover:bg-rose-600 h-fit">
                <X className="w-6 h-6" />
              </button>
          </div>
      </div>

      {/* --- LE BOARD INTERACTIF --- */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-move overflow-hidden bg-[#e5e5f7] relative"
        style={{ touchAction: 'none' }} // Crucial pour mobile
      >
          {/* Grille de fond */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#444cf7 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />

          <motion.div
            ref={boardRef}
            drag
            dragMomentum={false}
            onDrag={handleBoardDrag}
            // On utilise x et y au lieu de la transformation CSS directe pour mieux gérer le re-render
            animate={{ x: position.x, y: position.y, scale: scale }}
            className="w-[2000px] h-[2000px] bg-[#f0e6d2] shadow-2xl relative origin-center"
            style={{ 
                border: '20px solid #e6dac0',
                backgroundImage: 'repeating-linear-gradient(45deg, #e6dac0 25%, transparent 25%, transparent 75%, #e6dac0 75%, #e6dac0), repeating-linear-gradient(45deg, #e6dac0 25%, #f0e6d2 25%, #f0e6d2 75%, #e6dac0 75%, #e6dac0)',
                backgroundPosition: '0 0, 10px 10px',
                backgroundSize: '20px 20px'
            }}
          >
             {/* Logo central pour se repérer */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-center">
                 <span className="text-9xl">❄️</span>
                 <p className="text-4xl font-serif text-[#8c8270] mt-4">Notre Espace</p>
             </div>

             {items.map((item) => (
                <motion.div
                    key={item.id}
                    drag
                    dragMomentum={false}
                    // IMPORTANT : On arrête la propagation pour ne pas bouger le board quand on bouge un item
                    onPointerDown={(e) => e.stopPropagation()} 
                    onDragEnd={(e, info) => handleDragEnd(item.id, info)}
                    initial={{ scale: 0 }}
                    animate={{ 
                        left: `${item.x}%`, 
                        top: `${item.y}%`, 
                        rotate: item.rotation,
                        scale: 1 
                    }}
                    className="absolute hover:z-50 cursor-grab active:cursor-grabbing"
                    style={{ position: 'absolute' }} // Force absolute
                >
                    {item.type === 'note' ? (
                        <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg leading-relaxed flex items-center justify-center text-center select-none hover:shadow-2xl transition-shadow`}>
                            {item.content}
                        </div>
                    ) : (
                        <div className="bg-white p-2 pb-8 shadow-xl w-48 select-none hover:shadow-2xl transition-shadow">
                            <div className="w-full h-40 bg-gray-100 overflow-hidden mb-2 relative">
                                <img src={item.content} alt="Souvenir" className="w-full h-full object-cover pointer-events-none" />
                            </div>
                            <p className="font-handwriting text-center text-gray-600 text-xs truncate px-1">{item.caption}</p>
                        </div>
                    )}
                </motion.div>
             ))}
          </motion.div>
      </div>

      {/* BOUTON AJOUTER (BAS) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <button 
            onClick={() => setIsAdding(true)}
            disabled={dailyCount >= 3}
            className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl border-4 border-white font-bold text-lg transition-transform hover:scale-105 active:scale-95 ${dailyCount >= 3 ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'}`}
        >
            <Plus className="w-6 h-6" /> {dailyCount >= 3 ? 'Reviens demain' : 'Ajouter un mot'}
        </button>
      </div>

      {/* MODAL D'AJOUT */}
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
                             {photoFile ? <div className="text-green-500 font-bold flex items-center gap-2 truncate px-4"><ImageIcon/> {photoFile.name.slice(0, 15)}...</div> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2"/> Choisir une image</div>}
                             <input type="file" accept="image/*,.heic,.HEIC" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="hidden"/>
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