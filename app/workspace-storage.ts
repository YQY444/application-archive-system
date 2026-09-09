'use client';

export type StoredMaterialFile = {
  id: string;
  projectId: string;
  materialId: string;
  name: string;
  type: string;
  size: number;
  updatedAt: string;
  blob: Blob;
};

const DATABASE_NAME = 'application-workbench-files';
const DATABASE_VERSION = 1;
const STORE_NAME = 'files';

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function putMaterialFile(
  projectId: string,
  materialId: string,
  file: File,
) {
  const record: StoredMaterialFile = {
    id: `${projectId}:${materialId}`,
    projectId,
    materialId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    updatedAt: new Date().toISOString(),
    blob: file,
  };
  return withStore('readwrite', (store) => store.put(record));
}

export function restoreMaterialFile(record: StoredMaterialFile) {
  return withStore('readwrite', (store) => store.put(record));
}

export function getMaterialFile(projectId: string, materialId: string) {
  return withStore<StoredMaterialFile | undefined>('readonly', (store) =>
    store.get(`${projectId}:${materialId}`),
  );
}

export function deleteMaterialFile(projectId: string, materialId: string) {
  return withStore('readwrite', (store) =>
    store.delete(`${projectId}:${materialId}`),
  );
}

export async function deleteProjectFiles(projectId: string) {
  const files = await listMaterialFiles();
  await Promise.all(
    files
      .filter((file) => file.projectId === projectId)
      .map((file) => deleteMaterialFile(file.projectId, file.materialId)),
  );
}

export function listMaterialFiles() {
  return withStore<StoredMaterialFile[]>('readonly', (store) => store.getAll());
}
