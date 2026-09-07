// db.ts

export interface ShelfItem {
  id: string;
  filename: string;
  fileType: string;
  progress: number; // 0 to 1
  currentPage: number;
  currentSentence: number;
  currentWord: number;
  lastOpenedTime: number;
}

export type ThemeMode = 'light' | 'sepia' | 'amoled' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  lineHeight: number;
  readingWidth: number;
  focusColor: string;
  wpm: number;
  readingMode: 'sentence' | 'word';
}

const DB_NAME = 'ZenReaderDB';
const DB_VERSION = 1;
const SHELF_STORE = 'shelf';
const SETTINGS_STORE = 'settings';

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SHELF_STORE)) {
        db.createObjectStore(SHELF_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function saveShelfItem(item: ShelfItem): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHELF_STORE, 'readwrite');
    const store = tx.objectStore(SHELF_STORE);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getShelfItems(): Promise<ShelfItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHELF_STORE, 'readonly');
    const store = tx.objectStore(SHELF_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getShelfItem(id: string): Promise<ShelfItem | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHELF_STORE, 'readonly');
    const store = tx.objectStore(SHELF_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const defaultSettings: AppSettings = {
  theme: 'light',
  fontSize: 24,
  lineHeight: 1.5,
  readingWidth: 800,
  focusColor: '#ff0000',
  wpm: 250,
  readingMode: 'sentence',
};

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: 'app_settings', ...settings });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSettings(): Promise<AppSettings> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get('app_settings');
    request.onsuccess = () => {
      if (request.result) {
        // Strip id and return
        const { id, ...rest } = request.result;
        resolve({ ...defaultSettings, ...rest });
      } else {
        resolve(defaultSettings);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
