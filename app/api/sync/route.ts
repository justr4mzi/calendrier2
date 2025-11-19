import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Clés pour stocker les données
const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V2'; 

// Interface des données stockées
interface CalendarData {
  foundDays: number[];
  loginCount: number;
  totalTime: number;       // Temps passé en secondes
  lastConnection: string;  // Date format ISO
  lastDevice: string;      // "Mobile" ou "Ordi"
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
      lastDevice: '' 
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
    const { action, days, time, device } = body; 
    // action: 'update_days' | 'increment_login' | 'update_time' | 'reset'

    // 1. Récupérer l'état actuel
    let currentData = await kv.get<CalendarData>(DATA_KEY) || { 
      foundDays: [], 
      loginCount: 0,
      totalTime: 0,
      lastConnection: '',
      lastDevice: ''
    };

    // 2. Appliquer les changements selon l'action
    if (action === 'update_days' && Array.isArray(days)) {
      currentData.foundDays = days;
    } 
    else if (action === 'increment_login') {
      currentData.loginCount += 1;
      // On met à jour la date et l'appareil à chaque connexion
      currentData.lastConnection = new Date().toISOString();
      if (device) currentData.lastDevice = device;
    }
    else if (action === 'update_time') {
      currentData.totalTime = time;
    }
    else if (action === 'reset') {
      // On remet tout à zéro
      currentData = { 
        foundDays: [], 
        loginCount: 0, 
        totalTime: 0,
        lastConnection: '',
        lastDevice: ''
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