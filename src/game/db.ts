import { freshSave, normalizeSave } from './progress'
import type { Save } from './types'

const KEY = 'zizi-islands-save-v1'
const DB = 'zizi-islands'
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(): Promise<Save | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY)
    req.onsuccess = () => resolve((req.result as Save) || null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(save: Save) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(save, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadSave(): Promise<Save> {
  try {
    const fromIdb = await idbGet()
    if (fromIdb) return normalizeSave(fromIdb)
  } catch {
    /* localStorage fallback */
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalizeSave(JSON.parse(raw))
  } catch {
    /* fresh */
  }
  return freshSave()
}

export async function persistSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    /* ignore quota */
  }
  try {
    await idbSet(save)
  } catch {
    /* localStorage already has it */
  }
}

export async function wipeSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* ignore */
  }
}
