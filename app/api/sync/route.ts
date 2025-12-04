import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V5'; // Passage en V5 pour reset propre

interface ClickerData {
  bisous: number;
  totalAccumulated: number;
  clickPower: number;
  autoBisousPerSecond: number;
  purchasedUpgrades: number[];
  gameWon: boolean;
  chestOpened: boolean;
  startTime: number | null;
  endTime: number | null;
}

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

// NOUVEAU : Gestion des crédits serveur
interface UserCredit {
    count: number;
    lastDate: string;
}

interface CalendarData {
  foundDays: number[];
  loginCount: number;
  totalTime: number;       
  lastConnection: string;  
  lastDevice: string;
  kissCount: number;       
  finalMessage: string;    
  clicker: ClickerData;
  fridge: FridgeItem[];
  credits: Record<string, UserCredit>; // Stockage des crédits par user (minou, ramzi2010)
}

const defaultClicker: ClickerData = {
  bisous: 0, totalAccumulated: 0, clickPower: 1, autoBisousPerSecond: 0,
  purchasedUpgrades: [], gameWon: false, chestOpened: false, 
  startTime: null, endTime: null
};

const defaultData: CalendarData = { 
    foundDays: [], loginCount: 0, totalTime: 0, lastConnection: '', lastDevice: '',
    kissCount: 0, finalMessage: '', clicker: defaultClicker, fridge: [],
    credits: {
        'ramzi2010': { count: 0, lastDate: '' },
        'minou': { count: 0, lastDate: '' }
    }
};

const getCurrentData = async (): Promise<CalendarData> => {
    const data = await kv.get<CalendarData>(DATA_KEY);
    // Fusion pour éviter les crashs si champs manquants
    return { 
        ...defaultData, 
        ...data, 
        clicker: { ...defaultClicker, ...(data?.clicker || {}) },
        credits: { ...defaultData.credits, ...(data?.credits || {}) }
    };
};

export async function GET() {
  try {
    const data = await getCurrentData();
    
    // Vérification date crédits au chargement (optionnel mais propre)
    const today = new Date().toDateString();
    let updated = false;
    
    Object.keys(data.credits).forEach(user => {
        if (data.credits[user].lastDate !== today) {
            data.credits[user] = { count: 0, lastDate: today };
            updated = true;
        }
    });

    if(updated) await kv.set(DATA_KEY, data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(defaultData, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, days, time, device, message, clickerState, fridgeItem, fridgeItemId, currentUser } = body; 
    
    let currentData = await getCurrentData();
    const today = new Date().toDateString();

    // Reset journalier des crédits si besoin avant action
    if (currentUser && currentData.credits[currentUser]) {
        if (currentData.credits[currentUser].lastDate !== today) {
            currentData.credits[currentUser] = { count: 0, lastDate: today };
        }
    } else if (currentUser && !currentData.credits[currentUser]) {
        currentData.credits[currentUser] = { count: 0, lastDate: today };
    }

    switch (action) {
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
        case 'update_clicker':
            if (clickerState) currentData.clicker = { ...currentData.clicker, ...clickerState };
            break;
        
        case 'add_fridge_item':
            // Vérification Serveur des crédits
            if (currentUser && fridgeItem) {
                const userCredit = currentData.credits[currentUser];
                if (userCredit.count < 3) {
                    if (currentData.fridge.length >= 50) currentData.fridge.shift();
                    currentData.fridge.push(fridgeItem);
                    // Incrémenter crédit
                    currentData.credits[currentUser].count += 1;
                } else {
                    return NextResponse.json({ error: 'Limite atteinte' }, { status: 403 });
                }
            }
            break;

        case 'update_fridge_item_pos':
            if (fridgeItemId && fridgeItem) {
                const index = currentData.fridge.findIndex(i => i.id === fridgeItemId);
                if (index !== -1) {
                    // Force les limites serveur (0-90%)
                    let cleanX = Math.max(0, Math.min(90, fridgeItem.x));
                    let cleanY = Math.max(0, Math.min(90, fridgeItem.y));
                    
                    currentData.fridge[index].x = cleanX;
                    currentData.fridge[index].y = cleanY;
                }
            }
            break;
        case 'reset':
            currentData = defaultData;
            break;
    }

    await kv.set(DATA_KEY, currentData);
    return NextResponse.json({ success: true, data: currentData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}