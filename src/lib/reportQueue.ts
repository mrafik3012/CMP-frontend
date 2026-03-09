/**
 * IndexedDB queue for report actions (daily/weekly/monthly PDF requests and create daily).
 * Processed when back online; JWT from cookie sent with fetch (no token cache).
 */

const DB_NAME = "builddesk-report-queue";
const STORE = "queue";
const DB_VERSION = 1;

export type ReportQueueType = "daily_pdf" | "weekly_pdf" | "monthly_pdf" | "create_daily";

export interface QueuedReport {
  id: string;
  type: ReportQueueType;
  payload: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "processing" | "failed";
  error?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
    };
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  });
}

export const reportQueue = {
  async add(item: Omit<QueuedReport, "id" | "createdAt" | "status">): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const record: QueuedReport = {
      ...item,
      id,
      createdAt: Date.now(),
      status: "pending",
    };
    await withStore("readwrite", (store) => store.add(record));
    return id;
  },

  async getAll(): Promise<QueuedReport[]> {
    return withStore("readonly", (store) => store.getAll()).then((rows) =>
      (rows as QueuedReport[]).sort((a, b) => a.createdAt - b.createdAt)
    );
  },

  async getPending(): Promise<QueuedReport[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === "pending");
  },

  async count(): Promise<number> {
    const pending = await this.getPending();
    return pending.length;
  },

  async delete(id: string): Promise<void> {
    await withStore("readwrite", (store) => store.delete(id));
  },

  async setStatus(id: string, status: QueuedReport["status"], error?: string): Promise<void> {
    const all = await this.getAll();
    const one = all.find((r) => r.id === id);
    if (!one) return;
    one.status = status;
    if (error) one.error = error;
    await withStore("readwrite", (store) => store.put(one));
  },

  async remove(id: string): Promise<void> {
    await this.delete(id);
  },
};
