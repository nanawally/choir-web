import { getToken } from "./api";

/**
 * For a list of items that may have an imageUrl, fetch each image with auth
 * headers and replace the URL with a blob URL for display.
 */
export async function fetchAuthImages<T extends { id: string; imageUrl: string | null }>(
  items: T[],
  getImageUrl: (id: string) => string,
): Promise<T[]> {
  const token = getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return Promise.all(
    items.map(async (item) => {
      if (!item.imageUrl) return item;
      try {
        const res = await fetch(getImageUrl(item.id), { headers });
        if (!res.ok) return { ...item, imageUrl: null };
        const blob = await res.blob();
        return { ...item, imageUrl: URL.createObjectURL(blob) };
      } catch {
        return { ...item, imageUrl: null };
      }
    }),
  );
}
