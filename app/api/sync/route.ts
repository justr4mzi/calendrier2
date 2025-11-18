import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Clés pour stocker les données
const DATA_KEY = 'CALENDAR_DEBORAH_DATA_V2'; 

// Interface des données stockées
interface CalendarData {
  foundDays: number[];
  loginCount: number;
}

// === GET : LIRE LES DONNÉES ===
export async function GET() {
  try {
    const data = await kv.get<CalendarData>(DATA_KEY);
    
    // Données par défaut si rien n'existe
    const defaultData: CalendarData = { foundDays: [], loginCount: 0 };
    
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
    const { action, days, value } = body; 
    // action: 'update_days' | 'increment_login' | 'reset'

    // 1. Récupérer l'état actuel
    let currentData = await kv.get<CalendarData>(DATA_KEY) || { foundDays: [], loginCount: 0 };

    // 2. Appliquer les changements selon l'action
    if (action === 'update_days' && Array.isArray(days)) {
      currentData.foundDays = days;
    } 
    else if (action === 'increment_login') {
      currentData.loginCount += 1;
    }
    else if (action === 'reset') {
      currentData = { foundDays: [], loginCount: 0 };
    }

    // 3. Sauvegarder
    await kv.set(DATA_KEY, currentData);

    return NextResponse.json({ success: true, data: currentData }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}