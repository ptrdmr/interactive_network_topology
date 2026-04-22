/** Legacy key used before per-account scoping — must not be read for signed-in cloud users after login. */
export const MAP_DATA_STORAGE_KEY = "concourse-map-data";

export function mapStorageKeyForUser(userId: string): string {
  return `${MAP_DATA_STORAGE_KEY}:u:${userId}`;
}

/** Remove the shared slot so the next account on this browser cannot inherit the previous user's map from localStorage. */
export function removeLegacySharedMapStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MAP_DATA_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
