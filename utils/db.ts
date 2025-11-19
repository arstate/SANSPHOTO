
import { HistoryEntry } from '../types';

const DB_NAME = 'SansPhotoDB';
const DB_VERSION = 2; // Naikkan versi untuk memicu pembaruan skema
const HISTORY_STORE_NAME = 'history';
const IMAGE_CACHE_STORE_NAME = 'imageCache';

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        const store = db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // Tambahkan object store baru untuk cache gambar
      if (!db.objectStoreNames.contains(IMAGE_CACHE_STORE_NAME)) {
        db.createObjectStore(IMAGE_CACHE_STORE_NAME);
      }
    };
  });
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error adding entry:', request.error);
      reject('Error adding entry');
    };
  });
}

export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort descending by timestamp
      const result = request.result as HistoryEntry[];
      const sortedResult = result ? result.sort((a, b) => b.timestamp - a.timestamp) : [];
      resolve(sortedResult);
    };
    request.onerror = () => {
      console.error('Error getting all entries:', request.error);
      reject('Error getting all entries');
    };
  });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error deleting entry:', request.error);
      reject('Error deleting entry');
    };
  });
}

// --- Fungsi Cache Gambar ---

// Menyimpan blob gambar ke IndexedDB dengan URL sebagai kuncinya.
export async function storeImageInCache(url: string, blob: Blob): Promise<void> {
  if (!url || !blob) return;
  try {
    const db = await openDB();
    const transaction = db.transaction(IMAGE_CACHE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);
    // Gunakan URL asli sebagai kunci.
    store.put(blob, url);
  } catch (error) {
    console.error(`Gagal menyimpan blob untuk ${url} ke cache:`, error);
  }
}


// Mengambil blob gambar dari IndexedDB.
export async function getCachedImage(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(IMAGE_CACHE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
          resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('Gagal mendapatkan gambar dari cache:', request.error);
        resolve(null); // Selesaikan dengan null pada kesalahan untuk memungkinkan fallback
      };
    });
  } catch (error) {
    console.error('Gagal membuka DB untuk mendapatkan gambar dari cache:', error);
    return null;
  }
}