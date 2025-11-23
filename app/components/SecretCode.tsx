import React, { useState } from 'react';
import { X, Key, Gift, Lock, Sparkles, Check } from 'lucide-react';

const SECRET_CODE = "1401"; // Le code qu'elle doit trouver
const RIDDLE = "Je suis tout le temps à coter de toi quand tu dors. Je suis dans le dernier de la liste. Où-suis-je ?"; //

const SecretCode = ({ onClose }: { onClose: () => void }) => {
  const [input, setInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === SECRET_CODE) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden border-4 border-amber-200" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>

        {!isUnlocked ? (
          // ÉTAPE 1 : L'ÉNIGME
          <div className="space-y-6">
             <div className="inline-block p-4 bg-amber-100 rounded-full mb-2 animate-bounce">
                <Key className="w-8 h-8 text-amber-600" />
             </div>
             <h2 className="text-3xl font-bold text-gray-800">Chasse au Trésor 🕵️‍♀️</h2>
             
             <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300">
               <p className="text-sm text-gray-500 uppercase font-bold mb-2">Ton indice :</p>
               <p className="text-lg font-medium text-gray-800 italic">
                 "{RIDDLE}"
               </p>
             </div>

             <form onSubmit={handleUnlock} className="space-y-4">
               <p className="text-sm text-gray-600">Entre le code trouvé sur le cadeau :</p>
               <div className="relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={4}
                    placeholder="0000"
                    className="w-full text-center text-4xl tracking-[0.5em] font-mono font-bold py-4 border-b-4 border-amber-300 focus:border-amber-500 outline-none bg-transparent"
                 />
                 <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
               </div>
               
               {error && <p className="text-red-500 font-bold animate-pulse">Code incorrect 🚫</p>}
               
               <button 
                 type="submit"
                 className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg mt-4"
               >
                 Déverrouiller
               </button>
             </form>
          </div>
        ) : (
          // ÉTAPE 2 : LE TICKET D'OR (BONUS)
          <div className="animate-in zoom-in duration-700 space-y-6">
             <div className="relative">
               <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
               <Gift className="w-24 h-24 text-amber-500 mx-auto relative z-10" />
               <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-10 animate-spin" />
             </div>
             
             <h2 className="text-4xl font-satisfy font-bold text-amber-600">Félicitations !</h2>
             <p className="text-gray-600">Tu as trouvé le trésor caché.</p>

             {/* LE TICKET D'OR */}
             <div className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 p-1 rounded-xl shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
               <div className="bg-white/90 backdrop-blur-sm border-2 border-yellow-600 p-6 rounded-lg border-dashed">
                 <h3 className="text-2xl font-bold text-yellow-800 uppercase tracking-widest mb-2">Ticket d'Or</h3>
                 <div className="h-px bg-yellow-600 w-full mb-4"></div>
                 <p className="text-gray-800 font-medium text-lg leading-relaxed">
                   Bon pour un <br/>
                   <span className="text-3xl font-bold text-rose-600 font-satisfy">Vœu Irrévocable</span>
                 </p>
                 <p className="text-xs text-gray-500 mt-4">
                   Valable pour n'importe quoi, n'importe quand.<br/>
                   Ramzi est obligé de dire OUI.
                 </p>
               </div>
             </div>

             <p className="text-sm text-gray-400 italic">Fais une capture d'écran pour l'utiliser ! 📸</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretCode;