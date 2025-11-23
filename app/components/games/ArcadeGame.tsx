import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ArcadeGameProps {
  url: string;
  title: string;
  onClose: () => void;
}

const ArcadeGame = ({ url, title, onClose }: ArcadeGameProps) => {
  
  // === AJOUT IMPORTANT : Bloquer le scroll de la page quand le jeu est ouvert ===
  useEffect(() => {
    // Quand le composant s'ouvre : on fige le corps de la page
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none'; // Bloque les gestes tactiles sur le body

    // Quand le composant se ferme : on remet tout normal
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    };
  }, []);

  return (
    // J'ai enlevé le flou et mis un fond noir uni pour la performance
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-0 md:p-4 overscroll-none">
      
      <div className="bg-white rounded-none md:rounded-3xl w-full h-full md:h-[90vh] md:max-w-4xl flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Header du jeu */}
        <div className="bg-rose-500 p-3 flex justify-between items-center text-white shrink-0 z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">🎮 {title}</h3>
            <div className="flex gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Ouvrir dans un nouvel onglet">
                    <ExternalLink className="w-5 h-5" />
                </a>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        {/* Zone de jeu (Iframe) */}
        {/* AJOUT DE 'touch-none' : C'est LA commande qui dit au téléphone "Donne le doigt au jeu, pas au scroll" */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden">
            <iframe 
                src={url} 
                className="absolute inset-0 w-full h-full border-0 touch-none"
                style={{ touchAction: 'none' }} // Double sécurité pour le tactile
                allow="autoplay; fullscreen; gyroscope; accelerometer"
                title={title}
            />
        </div>
      </div>
    </div>
  );
};

export default ArcadeGame;