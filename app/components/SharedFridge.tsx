import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

// --- TYPES ---
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

export default function SharedFridge({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Référence au tableau GÉANT (le contenu)
  const boardRef = useRef<HTMLDivElement>(null);
  // Référence à la fenêtre de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- COMPRESSION IMAGE ---
  const compressImage = async (file: File): Promise<string> => {
    // Import dynamique pour éviter l'erreur de build
    let imageToProcess = file;
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith('.heic')) {
        try {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            imageToProcess = new File([blob], "converted.jpg", { type: "image/jpeg" });
        } catch (e) { console.error("Erreur HEIC", e); }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageToProcess);
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

  // --- SYNC ---
  const fetchFridge = async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data && data.fridge) {
        // On ne met à jour la position que si on n'est pas en train de draguer (pour éviter les sauts)
        setItems(prevItems => {
            // Astuce : on garde les items mais on met à jour leur position si elle a changé sur le serveur
            return data.fridge; 
        });

        // Reset Crédits si Admin a vidé
        if (data.fridge.length === 0) {
             setDailyCount(0);
             localStorage.setItem('fridge_count', '0');
        }
      }
    } catch (e) { console.error("Erreur sync:", e); }
  };

  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 2000); // Sync rapide (2s)
    
    // Init Crédits
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('fridge_last_date');
    const savedCount = parseInt(localStorage.getItem('fridge_count') || '0');
    if (savedDate === today) setDailyCount(savedCount);
    else {
        localStorage.setItem('fridge_last_date', today);
        localStorage.setItem('fridge_count', '0');
        setDailyCount(0);
    }
    return () => clearInterval(interval);
  }, []);

  // --- DRAG & DROP (CALCUL ROBUSTE) ---
  const handleDragEnd = async (id: string, info: any) => {
    if (!boardRef.current) return;
    
    // On récupère la position réelle de l'élément à la fin du drag
    // info.point donne la position par rapport à l'écran
    const boardRect = boardRef.current.getBoundingClientRect();
    
    // Calcul de la position relative dans le tableau géant (en pixels)
    const relativeX = info.point.x - boardRect.left;
    const relativeY = info.point.y - boardRect.top;

    // Conversion en pourcentage (pour que ce soit responsive)
    // On clamp entre 0 et 90% pour pas que ça sorte
    const xPercent = Math.max(0, Math.min(90, (relativeX / boardRect.width) * 100));
    const yPercent = Math.max(0, Math.min(90, (relativeY / boardRect.height) * 100));

    // Update Local Immédiat
    setItems(prev => prev.map(item => item.id === id ? { ...item, x: xPercent, y: yPercent } : item));

    // Save Serveur
    await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update_fridge_item_pos',
            fridgeItemId: id,
            fridgeItem: { x: xPercent, y: yPercent }
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

        // On place au centre de l'écran visible (approximativement)
        const scrollX = scrollContainerRef.current ? scrollContainerRef.current.scrollLeft + 200 : 500;
        const scrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop + 200 : 500;
        
        // Convertir en % du tableau de 2000px
        const startX = (scrollX / 2000) * 100;
        const startY = (scrollY / 2000) * 100;

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
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('fridge_count', newCount.toString());
        setIsAdding(false);
        setNoteText(''); setPhotoFile(null); setPhotoCaption('');
    } catch (e) { alert("Erreur lors de l'ajout."); } 
    finally { setIsUploading(false); }
  };

  const handleClear = async () => {
      if(confirm("Tout effacer ?")) {
        await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ action: 'reset' }) });
        setItems([]); setDailyCount(0); localStorage.setItem('fridge_count', '0');
      }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <button onClick={onClose} className="absolute top-4 right-4 z-[100] text-white bg-black/20 p-2 rounded-full hover:bg-rose-500">
        <X className="w-6 h-6" />
      </button>

      {/* --- CADRE FENÊTRE --- */}
      <div className="bg-[#f0e6d2] w-full max-w-[95vw] h-[90vh] rounded-xl shadow-2xl relative flex flex-col border-8 border-[#e6dac0]">
        
        <div className="p-4 bg-white/50 border-b border-[#d3cbb8] flex justify-between items-center shrink-0 z-20">
            <div>
                <h2 className="font-bold text-gray-700 font-serif text-xl">Notre Frigo ❤️</h2>
                <div className="text-xs text-gray-500 italic">Crédits : {dailyCount}/3</div>
            </div>
            <button onClick={handleClear} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
        </div>

        {/* --- ZONE DE SCROLL (NATUREL) --- */}
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto relative bg-[#d3cbb8]/30 touch-auto"
        >
            {/* --- LE TABLEAU GÉANT (2000px) --- */}
            <div 
                ref={boardRef} 
                className="relative w-[2000px] h-[2000px] shadow-inner cursor-grab active:cursor-grabbing"
                style={{ 
                    backgroundImage: 'radial-gradient(#b0a695 2px, transparent 2px)', 
                    backgroundSize: '30px 30px',
                    backgroundColor: '#f0e6d2'
                }}
            >
                {items.length === 0 && (
                    <div className="absolute top-40 left-40 opacity-30 pointer-events-none">
                        <span className="text-4xl font-serif text-[#8c8270] rotate-[-10deg]">C'est vide...</span>
                    </div>
                )}

                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        drag
                        dragMomentum={false} // Important pour la précision
                        onDragEnd={(e, info) => handleDragEnd(item.id, info)}
                        initial={{ scale: 0 }}
                        animate={{ 
                            left: `${item.x}%`, 
                            top: `${item.y}%`, 
                            rotate: item.rotation,
                            scale: 1 
                        }}
                        className="absolute hover:z-50"
                        style={{ x: 0, y: 0 }} // Reset transformation framer pour utiliser left/top
                    >
                        {item.type === 'note' ? (
                            <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg leading-relaxed flex items-center justify-center text-center select-none hover:scale-105 transition-transform`}>
                                {item.content}
                            </div>
                        ) : (
                            <div className="bg-white p-2 pb-8 shadow-xl w-48 select-none hover:scale-105 transition-transform">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-white/40 rotate-1 backdrop-blur-sm border border-white/20 shadow-sm z-10"></div>
                                <div className="w-full h-40 bg-gray-100 overflow-hidden mb-2">
                                    <img src={item.content} alt="Souvenir" className="w-full h-full object-cover pointer-events-none" />
                                </div>
                                <p className="font-handwriting text-center text-gray-600 text-xs truncate px-1">{item.caption}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>

        <button 
            onClick={() => setIsAdding(true)}
            disabled={dailyCount >= 3}
            className={`absolute bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 border-4 border-white ${dailyCount >= 3 ? 'bg-gray-400 grayscale' : 'bg-rose-500 hover:bg-rose-600 text-white animate-bounce'}`}
        >
            <Plus className="w-8 h-8" />
        </button>
      </div>

      {isAdding && (
         <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
             <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Ajouter</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400"><X /></button>
                 </div>
                 
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setNewItemType('note')} className={`flex-1 py-2 rounded-xl font-bold ${newItemType === 'note' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Note</button>
                     <button onClick={() => setNewItemType('photo')} className={`flex-1 py-2 rounded-xl font-bold ${newItemType === 'photo' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Photo</button>
                 </div>

                 {newItemType === 'note' ? (
                     <>
                        {/* Text-16px ou text-base empêche le zoom auto sur iPhone */}
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ton message..." className="w-full h-32 p-4 bg-gray-50 rounded-2xl mb-4 focus:ring-2 focus:ring-rose-200 text-base" />
                        <div className="flex justify-center gap-3 mb-6">
                            {COLORS.map(c => ( <button key={c} onClick={() => setNoteColor(c)} className={`w-10 h-10 rounded-full ${c} border-2 ${noteColor === c ? 'border-gray-500 scale-110' : 'border-transparent'}`} /> ))}
                        </div>
                     </>
                 ) : (
                     <div className="space-y-4 mb-6">
                         <label className="block w-full aspect-video bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer">
                             {photoFile ? <div className="text-green-500 font-bold flex items-center gap-2 truncate px-4"><ImageIcon/> OK</div> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2"/> Image</div>}
                             <input type="file" accept="image/*,.heic,.HEIC" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="hidden"/>
                         </label>
                         {/* Text-base pour éviter zoom iPhone */}
                         <input type="text" placeholder="Légende..." value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-base focus:ring-2 focus:ring-rose-200" />
                     </div>
                 )}

                 <button onClick={handleAddItem} disabled={isUploading || (newItemType === 'note' && !noteText) || (newItemType === 'photo' && !photoFile)} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Coller !'}
                 </button>
             </div>
         </div>
      )}
    </div>
  );
}