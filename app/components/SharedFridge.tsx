import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

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
  
  // États formulaire
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. FONCTION MAGIQUE : COMPRESSER L'IMAGE ---
  // Transforme le fichier en petit texte Base64 pour le stocker dans KV
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // On réduit la taille max à 500px pour pas saturer la DB
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compression JPEG qualité 0.7
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };


  // --- 2. CHARGEMENT ET SYNCHRO ---
const fetchFridge = async () => {
    try {
      const res = await fetch('/api/route');
      const data = await res.json();
      if (data && data.fridge) {
        setItems(data.fridge);
        
        // --- AJOUT : Si le frigo est vide (Reset Admin), on reset tes crédits locaux ---
        if (data.fridge.length === 0) {
            setDailyCount(0);
            localStorage.setItem('fridge_count', '0');
        }
        // -----------------------------------------------------------------------------
      }
    } catch (e) {
      console.error("Erreur sync frigo:", e);
    }
  };

  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 5000); // Sync toutes les 5 sec
    
    // Gestion limite journalière
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('fridge_last_date');
    const savedCount = parseInt(localStorage.getItem('fridge_count') || '0');
    if (savedDate === today) {
        setDailyCount(savedCount);
    } else {
        localStorage.setItem('fridge_last_date', today);
        localStorage.setItem('fridge_count', '0');
        setDailyCount(0);
    }

    return () => clearInterval(interval);
  }, []);

  // --- 3. DÉPLACEMENT (DRAG & DROP) ---
  const handleDragEnd = async (id: string, info: any) => {
    if (!containerRef.current) return;
    
    const parentRect = containerRef.current.getBoundingClientRect();
    const xPercent = (info.point.x - parentRect.left) / parentRect.width * 100;
    const yPercent = (info.point.y - parentRect.top) / parentRect.height * 100;

    // Optimistic UI update
    setItems(prev => prev.map(item => 
        item.id === id ? { ...item, x: xPercent, y: yPercent } : item
    ));

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

  // --- 4. AJOUTER ITEM (AVEC COMPRESSION) ---
  const handleAddItem = async () => {
    if (dailyCount >= 3) {
      alert("Tu as atteint la limite de 3 créations par jour !");
      return;
    }
    
    setIsUploading(true);

    try {
        let content = noteText;
        
        // Si c'est une photo, on la compresse en texte Base64
        if (newItemType === 'photo') {
          if (!photoFile) {
            alert("Sélectionne une photo d'abord !");
            setIsUploading(false);
            return;
          }
          content = await compressImage(photoFile);
        }

        const newItem: FridgeItem = {
            id: Date.now().toString(),
            type: newItemType,
            content: content,
            caption: newItemType === 'photo' ? photoCaption : undefined,
            color: newItemType === 'note' ? noteColor : undefined,
            x: 50,
            y: 50,
            rotation: Math.random() * 20 - 10,
            createdAt: Date.now()
        };


        // SAUVEGARDER D'ABORD SUR LE SERVEUR
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_fridge_item',
                fridgeItem: newItem
            })
        });

        if (!response.ok) {
          throw new Error('Erreur serveur');
        }

        // Update local APRÈS confirmation serveur
        setItems(prev => [...prev, newItem]);
        
        // Update compteur
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('fridge_count', newCount.toString());

        // Reset form
        setIsAdding(false);
        setNoteText('');
        setPhotoFile(null);
        setPhotoCaption('');
        
        // Refresh immédiat
        setTimeout(fetchFridge, 500);
        
    } catch (e) {
      console.error("Erreur ajout:", e);
      alert("Oups, une erreur est survenue. L'image est peut-être trop lourde, essaie une plus petite !");
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <button onClick={onClose} className="absolute top-4 right-4 z-[100] text-white hover:text-rose-400">
        <X className="w-8 h-8" />
      </button>

      <div className="bg-[#f0e6d2] w-full h-full max-w-6xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col"></div>
        <div className="p-4 bg-white/50 border-b border-[#d3cbb8] flex justify-between items-center">
            <h2 className="font-bold text-gray-700 font-serif text-xl">Notre endroit en commun ❤️</h2>
            <div className="text-sm text-gray-500 italic">Crédits créatifs : {dailyCount}/3 aujourd'hui</div>
        </div>

<div className="flex-1 relative overflow-auto touch-action-pan-x touch-action-pan-y bg-[#d3cbb8]/20">
            {/* On crée un conteneur INTERNE géant et fixe (le "Vrai Tableau") */}
            <div 
                ref={containerRef} 
                className="relative w-[1000px] h-[1000px] cursor-crosshair shadow-inner"
                // L'image de fond se met sur ce grand carré
                style={{ backgroundImage: 'radial-gradient(#d3cbb8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
                {items.map((item) => (
                <motion.div
                    key={item.id}
                    drag
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(item.id, info)}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{ 
                        x: 0, 
                        y: 0,
                        left: `${item.x}%`, 
                        top: `${item.y}%`, 
                        rotate: item.rotation,
                        scale: 1 
                    }}
                    className="absolute cursor-grab active:cursor-grabbing hover:z-50"
                    style={{ position: 'absolute' }}
                >
                    {item.type === 'note' ? (
                        <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg leading-relaxed flex items-center justify-center text-center transform hover:scale-105 transition-transform`}>
                            {item.content}
                        </div>
                    ) : (
                        <div className="bg-white p-3 pb-8 shadow-xl transform hover:scale-105 transition-transform w-56">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-white/30 rotate-1 backdrop-blur-sm border border-white/20 shadow-sm z-10"></div>
                            <div className="w-full h-48 bg-gray-100 overflow-hidden mb-2">
                                {/* ICI, content est maintenant une chaîne Base64 (data:image/jpeg...), ça marche direct ! */}
                                <img src={item.content} alt="Souvenir" className="w-full h-full object-cover" draggable={false} />
                            </div>
                            <p className="font-handwriting text-center text-gray-600 text-sm">{item.caption}</p>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>

        <button 
            onClick={() => setIsAdding(true)}
            disabled={dailyCount >= 3}
            className={`absolute bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${dailyCount >= 3 ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
        >
            <Plus className="w-8 h-8" />
        </button>
      </div>

      {isAdding && (
         <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                 <h3 className="text-xl font-bold mb-4 text-gray-800">Ajouter un souvenir</h3>
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setNewItemType('note')} className={`flex-1 py-2 rounded-lg font-bold ${newItemType === 'note' ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>Note</button>
                     <button onClick={() => setNewItemType('photo')} className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${newItemType === 'photo' ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}><ImageIcon className="w-4 h-4"/> Photo</button>
                 </div>

                 {newItemType === 'note' ? (
                     <>
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Écris un mot doux..." className="w-full h-32 p-3 bg-gray-50 rounded-xl mb-4 resize-none focus:outline-rose-500" />
                        <div className="flex gap-2 mb-6">
                            {COLORS.map(c => ( <button key={c} onClick={() => setNoteColor(c)} className={`w-8 h-8 rounded-full ${c} border-2 ${noteColor === c ? 'border-gray-400' : 'border-transparent'}`} /> ))}
                        </div>
                     </>
                 ) : (
                     <div className="space-y-4 mb-6">
                         <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"/>
                         <input type="text" placeholder="Légende (Optionnel)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-rose-300 outline-none" />
                     </div>
                 )}

                 <div className="flex gap-2">
                     <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Annuler</button>
                     <button onClick={handleAddItem} disabled={isUploading} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                         {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Coller !'}
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}