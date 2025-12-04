import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V4'; // Changement de version pour éviter conflits

interface ClickerData {
  bisous: number;
  totalAccumulated: number;
  clickPower: number;
  autoBisousPerSecond: number;
  purchasedUpgrades: number[];
  gameWon: boolean;
  chestOpened: boolean;
  startTime: number | null; // AJOUT
  endTime: number | null;   // AJOUT
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
}

const defaultClicker: ClickerData = {
  bisous: 0, totalAccumulated: 0, clickPower: 1, autoBisousPerSecond: 0,
  purchasedUpgrades: [], gameWon: false, chestOpened: false, 
  startTime: null, endTime: null
};

const defaultData: CalendarData = { 
    foundDays: [], loginCount: 0, totalTime: 0, lastConnection: '', lastDevice: '',
    kissCount: 0, finalMessage: '', clicker: defaultClicker, fridge: []
};

const getCurrentData = async (): Promise<CalendarData> => {
    const data = await kv.get<CalendarData>(DATA_KEY);
    return { ...defaultData, ...data }; // Fusion pour la sécurité
};

export async function GET() {
  try {
    const data = await getCurrentData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(defaultData, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, days, time, device, message, clickerState, fridgeItem, fridgeItemId } = body; 
    
    let currentData = await getCurrentData();

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
            if (fridgeItem) {
                if (currentData.fridge.length >= 50) currentData.fridge.shift();
                currentData.fridge.push(fridgeItem);
            }
            break;
        case 'update_fridge_item_pos':
            if (fridgeItemId && fridgeItem) {
                const index = currentData.fridge.findIndex(i => i.id === fridgeItemId);
                if (index !== -1) {
                    currentData.fridge[index].x = fridgeItem.x;
                    currentData.fridge[index].y = fridgeItem.y;
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
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}