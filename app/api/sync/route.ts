import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Clés pour stocker les données
const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V3'; 

// --- 1. DÉFINITION DES TYPES ---

// Type pour le jeu "Love Clicker"
interface ClickerData {
  bisous: number;
  totalAccumulated: number;
  clickPower: number;
  autoBisousPerSecond: number;
  purchasedUpgrades: number[]; // IDs des upgrades achetés
  gameWon: boolean;
  chestOpened: boolean;
  bonusClaimed: boolean;
}

// Type pour le "Frigo Connecté"
interface FridgeItem {
  id: string;
  type: 'note' | 'photo';
  content: string; // Texte ou URL image
  caption?: string;
  x: number;       // Position X en %
  y: number;       // Position Y en %
  rotation: number;
  color?: string;  // Couleur du post-it
  createdAt: number;
}

// Interface GLOBALE des données stockées
interface CalendarData {
  // Données Calendrier
  foundDays: number[];
  loginCount: number;
  totalTime: number;       
  lastConnection: string;  
  lastDevice: string;
  kissCount: number;       
  finalMessage: string;    
  
  // Données Love Clicker (Nouveau)
  clicker: ClickerData;

  // Données Frigo (Nouveau)
  fridge: FridgeItem[];
}

// --- 2. DONNÉES PAR DÉFAUT ---
const defaultClicker: ClickerData = {
  bisous: 0,
  totalAccumulated: 0,
  clickPower: 1,
  autoBisousPerSecond: 0,
  purchasedUpgrades: [],
  gameWon: false,
  chestOpened: false,
  bonusClaimed: false
};

const defaultData: CalendarData = { 
    foundDays: [], 
    loginCount: 0, 
    totalTime: 0,
    lastConnection: '', 
    lastDevice: '',
    kissCount: 0,
    finalMessage: '',
    clicker: defaultClicker, // Init du jeu
    fridge: []               // Init du frigo vide
};

// Fonction utilitaire pour récupérer les données actuelles ou par défaut
const getCurrentData = async (): Promise<CalendarData> => {
    const data = await kv.get<CalendarData>(DATA_KEY);
    // On fusionne avec defaultData pour s'assurer que les nouveaux champs (clicker, fridge) existent
    // même si la base de données contient une vieille version des données.
    return { ...defaultData, ...data };
};


// === GET : LIRE LES DONNÉES ===
export async function GET() {
  try {
    const data = await kv.get<CalendarData>(DATA_KEY);
    // Si aucune donnée, on retourne les valeurs par défaut
    const finalData = data ? { ...defaultData, ...data } : defaultData;
    return NextResponse.json(finalData, { status: 200 });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json(defaultData, { status: 200 }); // Retourner les données par défaut en cas d'erreur
  }
}

// === POST : MODIFIER LES DONNÉES ===
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // On définit les types possibles pour le body
    const { 
        action, 
        days, time, device, message, // Params existants
        clickerState, // Param pour le Clicker
        fridgeItem, fridgeItemId // Params pour le Frigo
    } = body; 
    
    // 1. Récupérer l'état actuel
    let currentData = await getCurrentData();

    // 2. Appliquer les changements selon l'action
    switch (action) {
        // --- CALENDRIER (EXISTANT) ---
        case 'update_days':
            if (Array.isArray(days)) currentData.foundDays = days;
            break;
        case 'increment_login':
            currentData.loginCount += 1;
            currentData.lastConnection = new Date().toISOString();
            if (device) currentData.lastDevice = device;
            break;
        case 'update_time':
            if (typeof time === 'number') currentData.totalTime = time;
            break;
        case 'send_kiss':
            currentData.kissCount += 1;
            break;
        case 'save_message':
            if (typeof message === 'string') currentData.finalMessage = message;
            break;

        // --- LOVE CLICKER (NOUVEAU) ---
        case 'update_clicker':
            // On met à jour l'état du jeu
            if (clickerState) {
                currentData.clicker = { ...currentData.clicker, ...clickerState };
            }
            break;

        // --- FRIGO CONNECTÉ (NOUVEAU) ---
        case 'add_fridge_item':
            if (fridgeItem) {
                // On limite à 50 items max pour pas surcharger KV
                if (currentData.fridge.length >= 50) {
                    currentData.fridge.shift(); // Enlève le plus vieux
                }
                currentData.fridge.push(fridgeItem);
            }
            break;
        case 'update_fridge_item_pos':
            // Met à jour la position d'un item spécifique
            if (fridgeItemId && fridgeItem) {
                const index = currentData.fridge.findIndex(i => i.id === fridgeItemId);
                if (index !== -1) {
                    currentData.fridge[index].x = fridgeItem.x;
                    currentData.fridge[index].y = fridgeItem.y;
                }
            }
            break;
        case 'remove_fridge_item':
             if (fridgeItemId) {
                 currentData.fridge = currentData.fridge.filter(i => i.id !== fridgeItemId);
             }
             break;

        // --- RESET GLOBAL (ADMIN) ---
        case 'reset':
            // Remet TOUT à zéro (Calendrier + Clicker + Frigo)
            currentData = defaultData;
            break;
            
        default:
            console.warn('POST API received unknown action:', action);
            return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    // 3. Sauvegarder
    await kv.set(DATA_KEY, currentData);

    return NextResponse.json({ success: true, data: currentData }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}