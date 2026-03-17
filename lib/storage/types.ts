export type StoredFile = {
  fileUrl: string;
  storageKey: string;
};

export type FileStorageVisibility = "private" | "public";

export type StoreFileInput = {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  pathPrefix?: string;
  visibility?: FileStorageVisibility;
  storageKey?: string;
};

export interface FileStorage {
  store(input: StoreFileInput): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
  getBuffer(storageKey: string): Promise<Buffer>;
}
