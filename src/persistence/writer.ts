/**
 * Serialised, debounced writes for one storage key.
 *
 * Only the LATEST value is ever written; at most one write is in flight. When a write
 * finishes and a newer value has arrived meanwhile, that newer value is written next.
 * So an older snapshot can never land after (and overwrite) a newer one.
 */
export interface Writer<T> {
  save(value: T): void;
  /** Writes any pending value now and resolves when storage is up to date. */
  flush(): Promise<void>;
}

export function createWriter<T>(
  write: (serialized: string) => Promise<void>,
  serialize: (value: T) => string,
  debounceMs = 120,
): Writer<T> {
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;

  async function drain() {
    while (pending !== null) {
      const next = pending;
      pending = null;
      try {
        await write(next);
      } catch {
        // Storage failures must never break play; the next save retries with newer data.
      }
    }
  }

  function start(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!running) {
      running = drain().finally(() => {
        running = null;
      });
    }
    return running;
  }

  return {
    save(value) {
      pending = serialize(value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void start();
      }, debounceMs);
    },
    async flush() {
      // Loop: a save may arrive while the current drain is finishing.
      while (pending !== null || running) {
        await start();
      }
    },
  };
}
