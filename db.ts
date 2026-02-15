
import { Portfolio, UserProfile, AppSettings } from './types';

const DB_NAME = 'FinVueDB';
const DB_VERSION = 1;
const STORES = {
  PORTFOLIOS: 'portfolios',
  PROFILE: 'profile',
  SETTINGS: 'settings'
};

export class InternalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.PORTFOLIOS)) {
          db.createObjectStore(STORES.PORTFOLIOS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE);
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
      };
    });
  }

  async getAllPortfolios(): Promise<Portfolio[]> {
    return this.getAll<Portfolio>(STORES.PORTFOLIOS);
  }

  async savePortfolio(p: Portfolio): Promise<void> {
    return this.put(STORES.PORTFOLIOS, p);
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.delete(STORES.PORTFOLIOS, id);
  }

  async getProfile(): Promise<UserProfile | null> {
    return this.get<UserProfile>(STORES.PROFILE, 'user_profile');
  }

  async saveProfile(p: UserProfile): Promise<void> {
    return this.put(STORES.PROFILE, p, 'user_profile');
  }

  async getSettings(): Promise<AppSettings | null> {
    return this.get<AppSettings>(STORES.SETTINGS, 'app_settings');
  }

  async saveSettings(s: AppSettings): Promise<void> {
    return this.put(STORES.SETTINGS, s, 'app_settings');
  }

  async clearAll(): Promise<void> {
    const stores = [STORES.PORTFOLIOS, STORES.PROFILE, STORES.SETTINGS];
    const tx = this.db!.transaction(stores, 'readwrite');
    stores.forEach(s => tx.objectStore(s).clear());
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }

  // Generic helpers
  private async getAll<T>(storeName: string): Promise<T[]> {
    const tx = this.db!.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    const tx = this.db!.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async put(storeName: string, value: any, key?: string): Promise<void> {
    const tx = this.db!.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value, key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    const tx = this.db!.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }
}

export const db = new InternalDB();
