import type { Middleware, RequestContext, ResponseContext } from 'onshape-typescript-fetch/runtime';

/** Onshape reports quotas per endpoint, not across all API calls. */
export class RateLimitMiddleware implements Middleware {
    private limits = new Map<string, number>();

    private endpoint(context: RequestContext): string {
        const url = new URL(context.url);
        // Share a quota across documents/configurations of the same operation.
        const path = url.pathname.replace(/\b[a-f0-9]{24}\b/gi, ':id');
        return `${(context.init.method || 'GET').toUpperCase()} ${url.origin}${path}`;
    }

    async post(context: ResponseContext) {
        const now = Date.now();
        const header = context.response.headers.get('X-Rate-Limit-Remaining');
        const remaining = header === null || header.trim() === '' ? NaN : Number(header);
        let timeout = 0;
        if (Number.isFinite(remaining) && remaining >= 0) {
            if (remaining < 50) timeout = 15000;
            else if (remaining < 75) timeout = 10000;
            else if (remaining < 100) timeout = 5000;
            else if (remaining < 300) timeout = 2000;
            else if (remaining < 500) timeout = 1000;
            else if (remaining < 750) timeout = 100;
            else if (remaining < 1000) timeout = 10;
        }
        const retry = context.response.headers.get('Retry-After');
        if (retry !== null && retry.trim() !== '') {
            const seconds = Number(retry);
            const retryTime = Number.isFinite(seconds) ? now + Math.max(0, seconds) * 1000 : Date.parse(retry);
            if (Number.isFinite(retryTime)) timeout = Math.max(timeout, retryTime - now);
        }
        const key = this.endpoint(context);
        if (timeout > 0) this.limits.set(key, Math.max(this.limits.get(key) || 0, now + timeout));
        else if ((this.limits.get(key) || 0) <= now) this.limits.delete(key);
        return context.response;
    }

    async pre(context: RequestContext) {
        const key = this.endpoint(context);
        let delay: number;
        // Another response can extend the cooldown while this request is waiting.
        while ((delay = (this.limits.get(key) || 0) - Date.now()) > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.limits.delete(key);
        return context;
    }
}
