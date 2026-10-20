const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

function harness() {
    let now = 0;
    const waits = [];
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, '../app/common/ratelimit.ts'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(code, {
        exports, URL, Map, Number, Date: { now: () => now, parse: Date.parse },
        setTimeout: (resolve, delay) => { waits.push(delay); now += delay; resolve(); },
    });
    const limiter = new exports.RateLimitMiddleware();
    const context = (route, headers = {}, method = 'GET') => ({
        url: `https://test.example/api/v10/${route}`, init: { method },
        response: { headers: new Headers(headers) },
    });
    return { limiter, context, waits, advance: ms => { now += ms; } };
}

const doc = '0123456789abcdef01234567';
const other = 'abcdef0123456789abcdef01';
const insertables = `documents/d/${doc}/v/${doc}/insertables`;
const instances = `assemblies/d/${doc}/w/${doc}/e/${doc}/instances`;

test('insertable quota does not delay assembly insertion, but still protects insertable reads', async () => {
    const { limiter, context, waits } = harness();
    await limiter.post(context(insertables, { 'X-Rate-Limit-Remaining': '400' }));
    await limiter.pre(context(instances, {}, 'POST'));
    assert.deepEqual(waits, []);
    await limiter.pre(context(insertables.replaceAll(doc, other) + '?configuration=other'));
    assert.deepEqual(waits, [1000]);
});

test('low quota waits only for the cooldown time still remaining', async () => {
    const { limiter, context, waits, advance } = harness();
    await limiter.post(context(instances, { 'X-Rate-Limit-Remaining': '20' }, 'POST'));
    advance(4000);
    await limiter.pre(context(instances, {}, 'POST'));
    await limiter.pre(context(instances, {}, 'POST'));
    assert.deepEqual(waits, [11000]);
});

test('missing or invalid quota headers do not create a fifteen-second delay', async () => {
    for (const value of [null, '', 'unknown', '-1', 'Infinity']) {
        const { limiter, context, waits } = harness();
        await limiter.post(context(insertables, value === null ? {} : { 'X-Rate-Limit-Remaining': value }));
        await limiter.pre(context(insertables));
        assert.deepEqual(waits, []);
    }
});

test('Retry-After seconds or HTTP date holds only the affected operation', async () => {
    for (const retry of ['450', new Date(450000).toUTCString()]) {
        const { limiter, context, waits } = harness();
        await limiter.post(context(instances, { 'Retry-After': retry, 'X-Rate-Limit-Remaining': '0' }, 'POST'));
        await limiter.pre(context(instances)); // GET is a different operation.
        assert.deepEqual(waits, []);
        await limiter.pre(context(instances, {}, 'POST'));
        assert.deepEqual(waits, [450000]);
    }
});

test('a response from an unrelated endpoint cannot erase an existing cooldown', async () => {
    const { limiter, context, waits } = harness();
    await limiter.post(context(insertables, { 'X-Rate-Limit-Remaining': '400' }));
    await limiter.post(context(instances, { 'X-Rate-Limit-Remaining': '3000' }, 'POST'));
    await limiter.pre(context(insertables));
    assert.deepEqual(waits, [1000]);
});
