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
  kissCount: number;       // NOUVEAU : Compteur de bisous
  finalMessage: string;    // NOUVEAU : Le message du dernier jour
}

// === GET : LIRE LES DONNÉES ===
export async function GET() {
  try {
    const data = await kv.get<CalendarData>(DATA_KEY);
    
    // Données par défaut si rien n'existe
    const defaultData: CalendarData = { 
      foundDays: [], 
      loginCount: 0, 
      totalTime: 0,
      lastConnection: '', 
      lastDevice: '',
      kissCount: 0,
      finalMessage: ''
    };
    
    return NextResponse.json(data || defaultData, { status: 200 });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

// === POST : MODIFIER LES DONNÉES ===
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, days, time, device, message } = body; 
    // action: 'update_days' | 'increment_login' | 'update_time' | 'reset' | 'send_kiss' | 'save_message'

    // 1. Récupérer l'état actuel
    let currentData = await kv.get<CalendarData>(DATA_KEY) || { 
      foundDays: [], 
      loginCount: 0,
      totalTime: 0,
      lastConnection: '',
      lastDevice: '',
      kissCount: 0,
      finalMessage: ''
    };

    // 2. Appliquer les changements selon l'action
    if (action === 'update_days' && Array.isArray(days)) {
      currentData.foundDays = days;
    } 
    else if (action === 'increment_login') {
      currentData.loginCount += 1;
      currentData.lastConnection = new Date().toISOString();
      if (device) currentData.lastDevice = device;
    }
    else if (action === 'update_time') {
      currentData.totalTime = time;
    }
    else if (action === 'send_kiss') {
      currentData.kissCount += 1; // Elle t'envoie un bisou
    }
    else if (action === 'save_message') {
      currentData.finalMessage = message; // Elle sauvegarde son message final
    }
    else if (action === 'reset') {
      // On remet tout à zéro
      currentData = { 
        foundDays: [], 
        loginCount: 0, 
        totalTime: 0,
        lastConnection: '',
        lastDevice: '',
        kissCount: 0,
        finalMessage: ''
      };
    }

    // 3. Sauvegarder
    await kv.set(DATA_KEY, currentData);

    return NextResponse.json({ success: true, data: currentData }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}