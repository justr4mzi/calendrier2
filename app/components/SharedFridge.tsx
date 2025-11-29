import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Loader2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import heic2any from 'heic2any'; // N'oublie pas : npm install heic2any

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
  const [zoom, setZoom] = useState(1); // État pour le zoom
  
  // États formulaire
  const [newItemType, setNewItemType] = useState<'note' | 'photo'>('note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(COLORS[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. FONCTION MAGIQUE : HEIC + COMPRESSION ---
  const compressImage = async (file: File): Promise<string> => {
    // 1. Conversion HEIC (iPhone) vers JPEG si nécessaire
    let imageToProcess = file;
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith('.heic')) {
        try {
            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
            // heic2any peut retourner un tableau, on prend le premier
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            imageToProcess = new File([blob], "converted.jpg", { type: "image/jpeg" });
        } catch (e) {
            console.error("Erreur conversion HEIC", e);
            // On continue avec le fichier original au cas où
        }
    }

    // 2. Compression Classique (Canvas)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageToProcess);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Un peu plus grand pour la qualité
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
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
        // Reset auto des crédits si admin a vidé le frigo
        if (data.fridge.length === 0) {
            const today = new Date().toDateString();
            const savedDate = localStorage.getItem('fridge_last_date');
            if (savedDate === today && localStorage.getItem('fridge_count') !== '0') {
                setDailyCount(0);
                localStorage.setItem('fridge_count', '0');
            }
        }
      }
    } catch (e) { console.error("Erreur sync:", e); }
  };

  useEffect(() => {
    fetchFridge();
    const interval = setInterval(fetchFridge, 3000);
    
    // Si on est sur mobile, on dézoome un peu par défaut pour voir plus de choses
    if (window.innerWidth < 768) {
        setZoom(0.6);
    }

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

  // --- 3. DÉPLACEMENT (DRAG & DROP) ---
  const handleDragEnd = async (id: string, info: any) => {
    // On sauvegarde juste la position relative, pas besoin de calcul savant ici
    // Framer Motion gère le visuel, l'API stocke juste pour dire "ça a bougé"
    await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update_fridge_item_pos',
            fridgeItemId: id,
            fridgeItem: { x: 0, y: 0 } 
        })
    });
  };

  // --- 4. AJOUTER ITEM ---
  const handleAddItem = async () => {
    if (dailyCount >= 3) return;
    setIsUploading(true);

    try {
        let content = noteText;
        // On passe par la nouvelle fonction qui gère HEIC
        if (newItemType === 'photo' && photoFile) content = await compressImage(photoFile);

        const newItem: FridgeItem = {
            id: Date.now().toString(),
            type: newItemType,
            content: content,
            caption: photoCaption,
            color: noteColor,
            x: 50, y: 50, rotation: Math.random() * 20 - 10, createdAt: Date.now()
        };

        const response = await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_fridge_item', fridgeItem: newItem })
        });

        if (!response.ok) throw new Error("Erreur serveur");

        setItems(prev => [...prev, newItem]);
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('fridge_count', newCount.toString());
        
        setIsAdding(false);
        setNoteText(''); setPhotoFile(null); setPhotoCaption('');
    } catch (e) { 
        console.error(e);
        alert("Erreur. Si c'est une photo iPhone, ça peut prendre quelques secondes de conversion."); 
    } 
    finally { setIsUploading(false); }
  };

  const handleClearFridge = async () => {
      if(confirm("Vider tout le frigo ?")) {
        await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset' })
        });
        setItems([]);
        setDailyCount(0);
        localStorage.setItem('fridge_count', '0');
      }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <button onClick={onClose} className="absolute top-4 right-4 z-[100] text-white bg-black/20 p-2 rounded-full hover:bg-rose-500 transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="bg-[#f0e6d2] w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl relative flex flex-col overflow-hidden border-8 border-[#e6dac0]">
        
        <div className="p-4 bg-white/50 border-b border-[#d3cbb8] flex justify-between items-center shrink-0 z-20 shadow-sm">
            <div>
                <h2 className="font-bold text-gray-700 font-serif text-xl">Notre Frigo ❤️</h2>
                <div className="text-sm text-gray-500 italic">Crédits : {dailyCount}/3</div>
            </div>
            <button onClick={handleClearFridge} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
        </div>

        {/* --- ZONE SCROLLABLE AVEC ZOOM --- */}
        <div className="flex-1 overflow-auto relative bg-[#d3cbb8]/30 touch-action-pan-x touch-action-pan-y">
            
            {/* Conteneur transformable pour le zoom */}
            <div style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top left',
                width: '1000px', 
                height: '1000px',
                transition: 'transform 0.2s ease-out'
            }}>
                <div 
                    ref={containerRef} 
                    className="relative w-full h-full shadow-inner"
                    style={{ 
                        backgroundImage: 'radial-gradient(#b0a695 2px, transparent 2px)', 
                        backgroundSize: '30px 30px',
                        backgroundColor: '#f0e6d2'
                    }}
                >
                    {items.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                            <span className="text-4xl font-serif text-[#8c8270] rotate-[-10deg]">C'est vide...</span>
                        </div>
                    )}

                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            drag
                            dragMomentum={false}
                            dragElastic={0} // EMPECHE DE SORTIR DU CADRE (Mur rigide)
                            dragConstraints={containerRef} // Reste dans le grand tableau
                            initial={{ x: 0, y: 0, scale: 0 }}
                            animate={{ 
                                left: item.x ? `${item.x}%` : '50%', 
                                top: item.y ? `${item.y}%` : '50%', 
                                rotate: item.rotation,
                                scale: 1 
                            }}
                            className="absolute cursor-grab active:cursor-grabbing hover:z-50 top-1/2 left-1/2 touch-none"
                        >
                            {item.type === 'note' ? (
                                <div className={`${item.color || 'bg-yellow-200'} w-48 h-48 p-4 shadow-lg text-gray-800 font-handwriting text-lg leading-relaxed flex items-center justify-center text-center transform transition-transform select-none`}>
                                    {item.content}
                                </div>
                            ) : (
                                <div className="bg-white p-2 pb-8 shadow-xl transform transition-transform w-48 select-none">
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
        </div>

        {/* BOUTONS CONTROLE ZOOM (En bas à gauche) */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-50">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="bg-white p-2 rounded-full shadow-lg border border-gray-200 text-gray-700 active:scale-90"><ZoomIn className="w-6 h-6"/></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="bg-white p-2 rounded-full shadow-lg border border-gray-200 text-gray-700 active:scale-90"><ZoomOut className="w-6 h-6"/></button>
        </div>

        {/* FAB AJOUT */}
        <button 
            onClick={() => setIsAdding(true)}
            disabled={dailyCount >= 3}
            className={`absolute bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all active:scale-90 z-50 border-4 border-white ${dailyCount >= 3 ? 'bg-gray-400 grayscale' : 'bg-rose-500 hover:bg-rose-600 text-white animate-bounce'}`}
        >
            <Plus className="w-8 h-8" />
        </button>
      </div>

      {isAdding && (
         <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
             <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Nouveau souvenir</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400"><X /></button>
                 </div>
                 
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setNewItemType('note')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newItemType === 'note' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Note 📝</button>
                     <button onClick={() => setNewItemType('photo')} className={`flex-1 py-2 rounded-xl font-bold transition-colors ${newItemType === 'photo' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-300' : 'bg-gray-100 text-gray-400'}`}>Photo 📸</button>
                 </div>

                 {newItemType === 'note' ? (
                     <>
                        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Écris un mot doux..." className="w-full h-32 p-4 bg-gray-50 rounded-2xl mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 text-lg" />
                        <div className="flex justify-center gap-3 mb-6">
                            {COLORS.map(c => ( <button key={c} onClick={() => setNoteColor(c)} className={`w-10 h-10 rounded-full ${c} border-2 transition-transform active:scale-90 ${noteColor === c ? 'border-gray-500 scale-110 shadow-md' : 'border-transparent'}`} /> ))}
                        </div>
                     </>
                 ) : (
                     <div className="space-y-4 mb-6">
                         <label className="block w-full aspect-video bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                             {photoFile ? (
                                 <div className="text-green-500 font-bold flex items-center gap-2 truncate px-4"><ImageIcon/> {photoFile.name}</div>
                             ) : (
                                 <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2"/> Choisir une image</div>
                             )}
                             {/* Accepte HEIC explicitement */}
                             <input type="file" accept="image/*,.heic,.HEIC" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="hidden"/>
                         </label>
                         <input type="text" placeholder="Légende (Optionnel)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200" />
                     </div>
                 )}

                 <button 
                    onClick={handleAddItem} 
                    disabled={isUploading || (newItemType === 'note' && !noteText) || (newItemType === 'photo' && !photoFile)} 
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-rose-600 transition-all"
                 >
                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Coller sur le frigo !'}
                 </button>
             </div>
         </div>
      )}
    </div>
  );
}