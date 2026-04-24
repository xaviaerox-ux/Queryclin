/**
 * DB optimizada para Big Data: Soporte para índice fragmentado.
 */
export const db = {
  dbName: 'QueryclinDB',
  version: 6,
  stores: {
    patients: 'patients',
    metadata: 'metadata',
    search_index: 'search_index' 
  },

  _db: null as IDBDatabase | null,
  
  async open(): Promise<IDBDatabase> {
    if (this._db) return this._db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: any) => {
        const database = e.target.result;
        
        // Almacenes estándar (KV simple)
        const stores = Object.values(this.stores);
        stores.forEach(s => {
          if (database.objectStoreNames.contains(s)) {
            // En V5 limpiamos para asegurar consistencia con el nuevo modelo
            database.deleteObjectStore(s);
          }
          database.createObjectStore(s);
        });
      };
      request.onsuccess = () => {
        this._db = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async saveBatch(storeName: string, items: Record<string, any>): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      for (const key in items) {
        store.put(items[key], key);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async addBatch(storeName: string, items: any[]): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      for (const item of items) {
        store.add(item);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async getBatch(storeName: string, keys: string[]): Promise<Record<string, any>> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const results: Record<string, any> = {};
      let count = 0;

      if (keys.length === 0) return resolve({});

      keys.forEach(key => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result !== undefined) {
            results[key] = request.result;
          }
          count++;
          if (count === keys.length) resolve(results);
        };
        request.onerror = () => {
          console.error(`[DB] Error crítico al leer clave "${key}" en ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    });
  },


  async getFromStore(storeName: string, key: string): Promise<any> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  async getAllKeys(storeName: string): Promise<string[]> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  async getAllByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(Object.values(this.stores), 'readwrite');
      Object.values(this.stores).forEach(s => {
        transaction.objectStore(s).clear();
      });
      transaction.oncomplete = () => {
        console.log("[DB] Base de datos limpiada íntegramente.");
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
