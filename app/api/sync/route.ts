import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// --- FONCTION DE NETTOYAGE (ANTI-CRASH & ANTI-DOUBLON) ---
function cleanData(items: any[]) {
  if (!Array.isArray(items)) return [];
  
  // 1. Map pour éliminer les doublons d'ID strictement
  const uniqueMap = new Map();
  items.forEach(item => {
    if (item && item.id) {
      uniqueMap.set(item.id, item);
    }
  });

  // 2. Conversion en tableau + Correction des coordonnées
  return Array.from(uniqueMap.values()).map((item: any) => ({
    ...item,
    x: (typeof item.x === 'number' && !isNaN(item.x)) ? item.x : 0,
    y: (typeof item.y === 'number' && !isNaN(item.y)) ? item.y : 0,
    type: item.type || 'note',
    content: item.content || '',
    rotation: item.rotation || 0,
  }));
}

export async function GET() {
  try {
    // Récupération PARALLÈLE des données
    const [fridgeRaw, credits, clicker, days, loginCount, time, lastConn, lastDev, kiss, msg] = await Promise.all([
      kv.get('fridge_items'),
      kv.get('fridge_credits'),
      kv.get('clicker_state'),
      kv.get('calendar_days'),
      kv.get('login_count'),
      kv.get('total_time'),
      kv.get('last_connection'),
      kv.get('last_device'),
      kv.get('kiss_count'),
      kv.get('final_message')
    ]);

    const fridge = cleanData(fridgeRaw as any[]);

    return NextResponse.json({
      fridge,
      credits: credits || {},
      clicker: clicker || { bisous: 0, totalAccumulated: 0, clickPower: 1, autoBisousPerSecond: 0, purchasedUpgrades: [] },
      foundDays: days || [],
      loginCount: loginCount || 0,
      totalTime: time || 0,
      lastConnection: lastConn || '',
      lastDevice: lastDev || '',
      kissCount: kiss || 0,
      finalMessage: msg || ''
    });
  } catch (error) {
    console.error('Sync GET Error:', error);
    return NextResponse.json({ fridge: [], foundDays: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, fridgeItem, fridgeItemId, currentUser, clickerState, days, time, device, message } = body;

    // --- 1. GESTION DU FRIGO & CRÉDITS (RESET ICI) ---
    
    if (action === 'add_fridge_item') {
      const currentItems = (await kv.get<any[]>('fridge_items')) || [];
      const cleanItems = cleanData(currentItems);
      
      // === LOGIQUE DE RESET DE CRÉDIT JOURNALIER ===
      if (currentUser) {
         const credits: any = (await kv.get('fridge_credits')) || {};
         
         // On force la date en format Français (JJ/MM/AAAA) sur le fuseau horaire de Paris
         // Cela garantit que le reset se fait à minuit heure française
         const today = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
         
         // SI l'utilisateur n'existe pas OU SI la date enregistrée n'est pas "today"
         // ALORS on remet le compteur à 0
         if (!credits[currentUser] || credits[currentUser].date !== today) {
             credits[currentUser] = { count: 0, date: today };
         }
         
         // Vérification de la limite
         if (credits[currentUser].count >= 3) {
             return NextResponse.json({ error: 'Limite quotidienne atteinte' }, { status: 403 });
         }
         
         // On valide l'ajout : on incrémente et on sauvegarde
         credits[currentUser].count += 1;
         await kv.set('fridge_credits', credits);
      }

      // Ajout de l'item au frigo
      cleanItems.push(fridgeItem);
      
      // Limite de sécurité (max 50 items pour éviter de surcharger)
      if (cleanItems.length > 50) cleanItems.shift(); 
      
      await kv.set('fridge_items', cleanItems);
    }

    if (action === 'update_fridge_item_pos') {
        const currentItems = (await kv.get<any[]>('fridge_items')) || [];
        let cleanItems = cleanData(currentItems);

        let updated = false;
        cleanItems = cleanItems.map((item: any) => {
            if (item.id === fridgeItemId) {
                updated = true;
                const safeX = Math.max(0, Math.min(fridgeItem.x, 2000)); 
                const safeY = Math.max(0, Math.min(fridgeItem.y, 2000));
                return { ...item, x: safeX, y: safeY };
            }
            return item;
        });

        if (updated) await kv.set('fridge_items', cleanItems);
    }

    if (action === 'clear_fridge') {
        await kv.set('fridge_items', []);
    }

    // --- 2. GESTION DU CLICKER ---
    if (action === 'update_clicker') {
        await kv.set('clicker_state', clickerState);
    }

    // --- 3. GESTION CALENDRIER & ADMIN ---
    if (action === 'update_days') await kv.set('calendar_days', days);
    
    if (action === 'update_time') await kv.set('total_time', time);
    
    if (action === 'increment_login') {
        await kv.incr('login_count');
        await kv.set('last_connection', new Date().toISOString());
        if (device) await kv.set('last_device', device);
    }
    
    if (action === 'send_kiss') await kv.incr('kiss_count');
    
    if (action === 'save_message') await kv.set('final_message', message);
    
    // RESET TOTAL (ADMIN)
    if (action === 'reset') {
        await kv.flushall();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync POST Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}