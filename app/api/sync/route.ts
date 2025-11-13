// app/api/sync/route.ts

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Clé fixe que tous les utilisateurs vont partager
const SHARED_KEY = 'CALENDAR_DEBORAH_FOUND_DAYS'; 

// === GESTION DES REQUÊTES GET (LIRE LES DONNÉES) ===
export async function GET() {
  try {
    // 1. Lire le JSON stocké sous la clé unique
    const foundDays = await kv.get<number[]>(SHARED_KEY);

    // 2. Si la clé n'existe pas encore, retourner un tableau vide
    if (!foundDays) {
      return NextResponse.json({ days: [] }, { status: 200 });
    }

    // 3. Renvoyer les jours trouvés
    return NextResponse.json({ days: foundDays }, { status: 200 });
  } catch (error) {
    console.error('KV GET Error:', error);
    // En cas d'erreur serveur, retourner une erreur 500
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

// === GESTION DES REQUÊTES POST (ÉCRIRE/METTRE À JOUR LES DONNÉES) ===
export async function POST(request: Request) {
  try {
    // 1. Lire le corps de la requête JSON (doit contenir 'days')
    const body = await request.json();
    const newFoundDays = body.days;

    // Validation rapide
    if (!Array.isArray(newFoundDays)) {
      return NextResponse.json({ error: 'Invalid data format: expected array' }, { status: 400 });
    }

    // 2. Mettre à jour la clé unique avec la nouvelle liste de jours
    // NX: Garantit l'écriture seulement si la clé n'existe pas (non utilisé ici, mais bonne pratique)
    // EX: Durée de vie (non nécessaire ici car l'état doit être permanent)
    await kv.set(SHARED_KEY, newFoundDays);

    // 3. Renvoyer une confirmation
    return NextResponse.json({ success: true, days: newFoundDays }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}