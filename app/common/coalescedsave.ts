/** Debounce JSON snapshots and serialize writes, keeping only the latest pending value. */
export class CoalescedSave<T> {
    private pending: { key: string; value: T };
    private savedKey: string;
    private saving = false;
    private timer: ReturnType<typeof setTimeout>;

    constructor(private save: (value: T) => Promise<boolean>, private delay = 500, savedValue?: T) {
        if (savedValue !== undefined) this.savedKey = JSON.stringify(savedValue);
    }

    public schedule(value: T): void {
        const key = JSON.stringify(value);
        // Breadcrumb arrays and their nodes can be mutated before the request starts.
        this.pending = { key, value: JSON.parse(key) };
        if (this.timer !== undefined) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), this.delay);
    }

    public flush(): void {
        if (this.timer !== undefined) clearTimeout(this.timer);
        this.timer = undefined;
        if (this.saving || !this.pending) return;
        const next = this.pending;
        this.pending = undefined;
        if (next.key === this.savedKey) return;

        this.saving = true;
        Promise.resolve()
            .then(() => this.save(next.value))
            .then(
                (success) => { this.savedKey = success ? next.key : undefined; },
                () => { this.savedKey = undefined; }
            )
            .then(() => {
                this.saving = false;
                // If the quiet period elapsed during the write, save the latest value now.
                if (this.pending && this.timer === undefined) this.flush();
            });
    }
}
