
import { Portfolio, UserProfile, AppSettings, Transaction, Goal, Trade, Snapshot } from './types';

const DB_NAME = 'VantageDB';
const DB_VERSION = 5; // Upgraded for Snapshots
const STORES = {
  PORTFOLIOS: 'portfolios',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  TRANSACTIONS: 'transactions',
  GOALS: 'goals',
  TRADES: 'trades',
  SNAPSHOTS: 'snapshots'
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
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('portfolioId', 'portfolioId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.GOALS)) {
          db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.TRADES)) {
          db.createObjectStore(STORES.TRADES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
          db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id' });
        }
      };
    });
  }

  async getAllSnapshots(): Promise<Snapshot[]> {
    return this.getAll<Snapshot>(STORES.SNAPSHOTS);
  }

  async saveSnapshot(s: Snapshot): Promise<void> {
    return this.put(STORES.SNAPSHOTS, s);
  }

  async deleteSnapshot(id: string): Promise<void> {
    return this.delete(STORES.SNAPSHOTS, id);
  }

  async getAllTrades(): Promise<Trade[]> {
    return this.getAll<Trade>(STORES.TRADES);
  }

  async saveTrade(t: Trade): Promise<void> {
    return this.put(STORES.TRADES, t);
  }

  async deleteTrade(id: string): Promise<void> {
    return this.delete(STORES.TRADES, id);
  }

  async getAllPortfolios(): Promise<Portfolio[]> {
    return this.getAll<Portfolio>(STORES.PORTFOLIOS);
  }

  async savePortfolio(p: Portfolio): Promise<void> {
    return this.put(STORES.PORTFOLIOS, p);
  }

  async deletePortfolio(id: string): Promise<void> {
    const txs = await this.getTransactionsByPortfolio(id);
    for (const t of txs) {
      await this.delete(STORES.TRANSACTIONS, t.id);
    }
    // Also remove portfolio from any goals
    const goals = await this.getAllGoals();
    for (const g of goals) {
      if (g.portfolioIds.includes(id)) {
        g.portfolioIds = g.portfolioIds.filter(pid => pid !== id);
        await this.saveGoal(g);
      }
    }
    return this.delete(STORES.PORTFOLIOS, id);
  }

  async getAllGoals(): Promise<Goal[]> {
    return this.getAll<Goal>(STORES.GOALS);
  }

  async saveGoal(g: Goal): Promise<void> {
    return this.put(STORES.GOALS, g);
  }

  async deleteGoal(id: string): Promise<void> {
    return this.delete(STORES.GOALS, id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.getAll<Transaction>(STORES.TRANSACTIONS);
  }

  async getTransactionsByPortfolio(portfolioId: string): Promise<Transaction[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORES.TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const index = store.index('portfolioId');
      const request = index.getAll(portfolioId);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async saveTransaction(t: Transaction): Promise<void> {
    return this.put(STORES.TRANSACTIONS, t);
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.delete(STORES.TRANSACTIONS, id);
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
    if (!this.db) return;
    const stores = [STORES.PORTFOLIOS, STORES.PROFILE, STORES.SETTINGS, STORES.TRANSACTIONS, STORES.GOALS, STORES.TRADES, STORES.SNAPSHOTS];
    const tx = this.db.transaction(stores, 'readwrite');
    stores.forEach(s => tx.objectStore(s).clear());
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) return [];
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) return null;
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async put(storeName: string, value: any, key?: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value, key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }
}

export const db = new InternalDB();
