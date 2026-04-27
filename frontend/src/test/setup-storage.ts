/**
 * Node / Vitest may expose a partial `localStorage` (e.g. missing `clear`) when
 * `--localstorage-file` is invalid — Zustand `persist` then throws on `setItem`.
 * Install a minimal in-memory Storage when the runtime API is incomplete.
 */
const g = globalThis as typeof globalThis & { localStorage?: Storage };

function ensureFullLocalStorage(): void {
  const cur = g.localStorage;
  if (
    cur &&
    typeof cur.getItem === "function" &&
    typeof cur.setItem === "function" &&
    typeof cur.removeItem === "function" &&
    typeof cur.clear === "function"
  ) {
    return;
  }

  const memory = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return memory.size;
    },
    clear: () => {
      memory.clear();
    },
    getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key: string, value: string) => {
      memory.set(key, String(value));
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    key: (index: number) => [...memory.keys()][index] ?? null,
  };

  Object.defineProperty(g, "localStorage", {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
}

ensureFullLocalStorage();
