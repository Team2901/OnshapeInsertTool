/** Bounded cache that also shares concurrent reads of the same resource. */
export class RequestCache<T> {
    private entries = new Map<string, { expires: number; request: Promise<T> }>();

    constructor(
        private ttl = 5 * 60 * 1000,
        private capacity = 64,
        private now: () => number = Date.now
    ) {}

    public get(key: string, load: () => Promise<T>): Promise<T> {
        const existing = this.entries.get(key);
        if (existing && existing.expires > this.now()) {
            this.entries.delete(key);
            this.entries.set(key, existing);
            return existing.request;
        }
        const entry = { expires: Infinity, request: undefined as Promise<T> };
        entry.request = Promise.resolve().then(load).then(
            (value) => {
                entry.expires = this.now() + this.ttl;
                return value;
            },
            (error) => {
                if (this.entries.get(key) === entry) this.entries.delete(key);
                throw error;
            }
        );
        this.entries.delete(key);
        this.entries.set(key, entry);
        while (this.entries.size > this.capacity) {
            this.entries.delete(this.entries.keys().next().value);
        }
        return entry.request;
    }
}
