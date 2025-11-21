import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Clés pour stocker les données
const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V3'; 

// Interface des données stockées
interface CalendarData {
  foundDays: number[];
  loginCount: number;
  totalTime: number;       
  lastConnection: string;  
  lastDevice: string;
  kissCount: number;       
  finalMessage: string;    
}

// Données par défaut (pour éviter la répétition)
const defaultData: CalendarData = { 
    foundDays: [], 
    loginCount: 0, 
    totalTime: 0,
    lastConnection: '', 
    lastDevice: '',
    kissCount: 0,
    finalMessage: ''
};

// Fonction utilitaire pour récupérer les données actuelles ou par défaut
const getCurrentData = async (): Promise<CalendarData> => {
    const data = await kv.get<CalendarData>(DATA_KEY);
    return data || defaultData;
};


// === GET : LIRE LES DONNÉES ===
export async function GET() {
  try {
    const data = await getCurrentData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

// === POST : MODIFIER LES DONNÉES ===
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, days, time, device, message } = body as {
        action: 'update_days' | 'increment_login' | 'update_time' | 'reset' | 'send_kiss' | 'save_message';
        days?: number[];
        time?: number;
        device?: string;
        message?: string;
    }; 
    
    // 1. Récupérer l'état actuel
    let currentData = await getCurrentData();

    // 2. Appliquer les changements selon l'action
    if (action === 'update_days' && Array.isArray(days)) {
      currentData.foundDays = days;
    } 
    else if (action === 'increment_login') {
      currentData.loginCount += 1;
      currentData.lastConnection = new Date().toISOString();
      if (device) currentData.lastDevice = device;
    }
    else if (action === 'update_time' && typeof time === 'number') {
      currentData.totalTime = time;
    }
    else if (action === 'send_kiss') {
      currentData.kissCount += 1; 
    }
    else if (action === 'save_message' && typeof message === 'string') {
      currentData.finalMessage = message; 
    }
    else if (action === 'reset') {
      // Utilise les données par défaut pour réinitialiser
      currentData = defaultData;
    } else {
        // Optionnel: Log d'une action inconnue
        console.warn('POST API received unknown action:', action);
        return NextResponse.json({ success: false, error: 'Unknown or invalid action' }, { status: 400 });
    }

    // 3. Sauvegarder
    await kv.set(DATA_KEY, currentData);

    return NextResponse.json({ success: true, data: currentData }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}