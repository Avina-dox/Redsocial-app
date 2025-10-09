// lib/storage.ts
import * as SecureStore from "expo-secure-store";

const canUseSecureStore = !!SecureStore?.getItemAsync;

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (canUseSecureStore) {
        return (await SecureStore.getItemAsync(key)) ?? null;
      }
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (canUseSecureStore) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch {}
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (canUseSecureStore) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {}
  },
};
