const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 },
        reportDiagnostics: true,
    });
    assert.equal(code.diagnostics.length, 0);
    const exports = {};
    vm.runInNewContext(code.outputText, {
        exports, require: (name) => dependencies[name] || {}, console,
        ...globals,
    }, { filename: file });
    return exports;
}

const { RequestCache } = load('app/common/requestcache.ts');

test('failed library root, folder and search downloads are retried after recovery', async () => {
    const { Preferences } = load('app/preferences.ts');
    const { Library } = load('app/libraries.ts', { './preferences': { Preferences } });
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} }, './common/requestcache': { RequestCache },
    });
    const library = Object.create(Library.prototype);
    library.proxyChildrenName = 'children'; library.searchInfoName = 'search';
    library.encodeLibraryName = library.decodeLibraryName = value => value;
    library.getProxyDocumentFromQuery = async () => ({ id: 'global', wvmid: 'workspace' });
    library.getAppElement = async (name, location) => Object.assign(location, { elementId: name });
    let failing = true, reads = 0;
    library.onshape = { blobElementApi: { downloadFileWorkspace: async () => {
        reads++;
        if (failing) throw new Error('rate limited');
        return '{"children":[{"id":"part"}],"all":[{"id":"search-part"}]}';
    } } };
    library.getProxyLibrary = () => library.getProxyLibraryFromDocuments({ items: [{ name: 'Global' }] }, 'Global');
    const app = Object.create(App.prototype);
    app.libraries = library; app.globalLibrariesNodes = ['global']; app.currentBreadcrumbs = [];
    const loaders = {
        root: () => library.getProxyLibrary(),
        folder: () => library.getProxyFolder({ id: 'global', wvmid: 'workspace' }, 'folder'),
        search: () => library.getLibrarySearchInfo('global'),
    };
    for (const [key, read] of Object.entries(loaders)) {
        await assert.rejects(app.getGlobalLibraryRead('global', key, read), /rate limited/);
    }
    failing = false;
    assert.equal((await app.getGlobalLibraryRead('global', 'root', loaders.root)).contents[0].id, 'part');
    assert.equal((await app.getGlobalLibraryRead('global', 'folder', loaders.folder))[0].id, 'part');
    assert.equal((await app.getGlobalLibraryRead('global', 'search', loaders.search))[0].id, 'search-part');
    const recoveredReads = reads;
    await app.getGlobalLibraryRead('global', 'folder', loaders.folder);
    assert.equal(reads, recoveredReads);
});

test('concurrent and repeat browsing reads share a request for 5 minutes without extending expiry', async () => {
    let now = 0;
    let calls = 0;
    const cache = new RequestCache(undefined, 64, () => now);
    const read = () => Promise.resolve(++calls);
    const results = await Promise.all([cache.get('folder', read), cache.get('folder', read)]);
    assert.deepEqual(results, [1, 1]);
    now = 30000;
    await cache.get('folder', read);
    now = 5 * 60 * 1000 - 1;
    await cache.get('folder', read);
    assert.equal(calls, 1);
    now++;
    await cache.get('folder', read);
    assert.equal(calls, 2);
});

function saveHarness(save) {
    let now = 0;
    let id = 0;
    const timers = new Map();
    const { CoalescedSave } = load('app/common/coalescedsave.ts', {}, {
        setTimeout: (callback, delay) => {
            timers.set(++id, { callback, due: now + delay });
            return id;
        },
        clearTimeout: (id) => timers.delete(id),
    });
    return {
        CoalescedSave,
        saver: new CoalescedSave(save),
        advance: async (ms) => {
            now += ms;
            for (const [id, timer] of timers) {
                if (timer.due <= now) {
                    timers.delete(id);
                    timer.callback();
                }
            }
            await new Promise(setImmediate);
        },
    };
}

test('last-location bursts save only the latest snapshot and skip successful duplicates', async () => {
    const saved = [];
    const { saver, advance } = saveHarness(async (value) => {
        saved.push(value);
        return true;
    });
    saver.schedule([{ id: 'a' }]);
    await advance(300);
    const breadcrumbs = [{ id: 'b' }];
    saver.schedule(breadcrumbs);
    breadcrumbs[0].id = 'mutated';
    breadcrumbs.push({ id: 'parent' });
    await advance(499);
    assert.equal(saved.length, 0);
    await advance(1);
    assert.equal(JSON.stringify(saved), '[[{"id":"b"}]]');
    saver.schedule([{ id: 'b' }]);
    await advance(500);
    assert.equal(saved.length, 1);
});

test('updates during a slow save are serialized and intermediate locations are dropped', async () => {
    const saved = [];
    const completions = [];
    const { saver, advance } = saveHarness((value) => {
        saved.push(value);
        return new Promise((resolve) => completions.push(resolve));
    });
    saver.schedule('a');
    await advance(500);
    saver.schedule('b');
    saver.schedule('c');
    await advance(500);
    assert.deepEqual(saved, ['a']);
    completions.shift()(true);
    await advance(0);
    assert.deepEqual(saved, ['a', 'c']);
    completions.shift()(true);
    await advance(0);
});

test('returning to the previously saved location during another write still restores it', async () => {
    const saved = [];
    let finish;
    const { saver, advance } = saveHarness((value) => {
        saved.push(value);
        return value === 'b'
            ? new Promise((resolve) => { finish = resolve; })
            : Promise.resolve(true);
    });
    saver.schedule('a');
    await advance(500);
    saver.schedule('b');
    await advance(500);
    saver.schedule('a');
    // Finishing a write must not shorten the quiet period of a newer update.
    finish(true);
    await advance(499);
    assert.deepEqual(saved, ['a', 'b']);
    await advance(1);
    assert.deepEqual(saved, ['a', 'b', 'a']);
});

test('false, rejected and synchronous failures allow a later retry without an automatic retry loop', async () => {
    let calls = 0;
    const { saver, advance } = saveHarness(() => {
        calls++;
        if (calls === 1) return Promise.resolve(false);
        if (calls === 2) return Promise.reject(new Error('offline'));
        if (calls === 3) throw new Error('offline');
        return Promise.resolve(true);
    });
    for (let attempt = 1; attempt <= 4; attempt++) {
        saver.schedule('a');
        await advance(500);
        assert.equal(calls, attempt);
        await advance(10000);
        assert.equal(calls, attempt);
    }
    saver.schedule('a');
    await advance(500);
    assert.equal(calls, 4);
});

test('App coalesces breadcrumb saves and flushes pending work when hidden', async () => {
    const saved = [];
    const { CoalescedSave, advance } = saveHarness(() => Promise.resolve(true));
    const events = {};
    const doc = {
        visibilityState: 'visible',
        addEventListener: (event, callback) => { events[event] = callback; },
    };
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/coalescedsave': { CoalescedSave },
    }, {
        window: { addEventListener: (event, callback) => { events[event] = callback; } },
        document: doc,
    });
    const app = Object.create(App.prototype);
    app.preferences = { setLastKnownLocation: async (value) => {
        saved.push(value);
        return true;
    } };
    app.saveLastLocation({ pathToRoot: [{ id: 'a' }] });
    app.saveLastLocation({ pathToRoot: [{ id: 'b' }] });
    await advance(499);
    assert.equal(saved.length, 0);
    doc.visibilityState = 'hidden';
    events.visibilitychange();
    await advance(0);
    assert.equal(JSON.stringify(saved), '[[{"id":"b"}]]');
    app.saveLastLocation({ pathToRoot: [{ id: 'c' }] });
    events.pagehide();
    await advance(0);
    assert.equal(JSON.stringify(saved), '[[{"id":"b"}],[{"id":"c"}]]');
    await advance(1000);
    assert.equal(saved.length, 2);
});

test('failed reads can be retried and least recently used pages are evicted', async () => {
    const cache = new RequestCache(30, 2, () => 0);
    await assert.rejects(cache.get('a', () => Promise.reject(new Error('offline'))));
    let calls = 0;
    const read = () => Promise.resolve(++calls);
    await cache.get('a', read);
    await cache.get('b', read);
    await cache.get('a', read);
    await cache.get('c', read);
    await cache.get('b', read);
    assert.equal(calls, 4);
});

test('rapid navigation ignores old responses, and revisiting renders a clean cached copy', async () => {
    const dump = { innerHTML: '', appendChild() {} };
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/requestcache': { RequestCache },
    }, {
        document: { getElementById: () => dump },
        crypto: { randomUUID: (() => { let id = 0; return () => String(++id); })() },
    });
    const app = Object.create(App.prototype);
    app.folderPages = new RequestCache();
    app.libraryContexts = new RequestCache();
    for (const method of ['hidePopup', 'hideActionMenu', 'hideBoxSelect', 'checkSearchBarEnabled'])
        app[method] = () => {};
    app.getFileListContainer = () => ({ innerHTML: '' });
    const breadcrumbs = [];
    app.addBreadcrumbNode = (node) => breadcrumbs.push(node.id);
    const rendered = [];
    app.ProcessNodeResults = (info) => {
        rendered.push(info.items[0].name);
        info.items[0].name = 'normalized by rendering';
    };
    const pending = {};
    let calls = 0;
    app.onshape = {
        cancelPendingThumbnails() {},
        globalTreeNodesApi: { globalTreeNodesFolderInsertables: ({ fid }) => {
            calls++;
            return new Promise((resolve) => { pending[fid] = resolve; });
        } },
    };
    const flush = () => new Promise(setImmediate);
    app.gotoFolder({ id: 'a', jsonType: 'folder' });
    app.gotoFolder({ id: 'b', jsonType: 'folder' });
    await flush();
    pending.b({ items: [{ name: 'B' }], pathToRoot: [{ id: 'b' }] });
    await flush();
    pending.a({ items: [{ name: 'A' }], pathToRoot: [{ id: 'a' }] });
    await flush();
    assert.deepEqual(breadcrumbs, ['b']);
    assert.deepEqual(rendered, ['B']);
    app.gotoFolder({ id: 'b', jsonType: 'folder' });
    await flush();
    assert.equal(calls, 2);
    assert.deepEqual(rendered, ['B', 'B']);

    let libraryReads = 0;
    let folderReads = 0;
    app.libraries = {
        getProxyLibrary: () => {
            libraryReads++;
            return Promise.resolve({ library: { id: 'library', wvmid: 'workspace' } });
        },
        getProxyFolder: (library, id) => {
            assert.equal(library.wvmid, 'workspace');
            folderReads++;
            return Promise.resolve([{ name: id }]);
        },
    };
    app.gotoFolder({ id: 'child1', projectId: 'library', jsonType: 'proxy-folder' });
    await flush();
    app.gotoFolder({ id: 'child2', projectId: 'library', jsonType: 'proxy-folder' });
    await flush();
    assert.equal(libraryReads, 1);
    assert.equal(folderReads, 2);
});

test('offscreen thumbnail work waits for visibility and is discarded on navigation', () => {
    let observer;
    const { OnshapeAPI } = load('app/onshapeapi.ts', {
        './common/requestcache': { RequestCache },
    }, {
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; observer = this; }
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    });
    const api = Object.create(OnshapeAPI.prototype);
    api.pendingThumbnails = new Map();
    let calls = 0;
    const visible = { isConnected: true };
    const hidden = { isConnected: true };
    api.loadVisibleThumbnail(visible, () => calls++);
    api.loadVisibleThumbnail(hidden, () => calls++);
    observer.callback([{ target: visible, isIntersecting: false }]);
    assert.equal(calls, 0);
    observer.callback([{ target: visible, isIntersecting: true }]);
    assert.equal(calls, 1);
    api.cancelPendingThumbnails();
    observer.callback([{ target: hidden, isIntersecting: true }]);
    assert.equal(calls, 1);
});

test('HTTP thumbnail failures reject blob requests and allow another attempt', async () => {
    let requests = 0;
    const { OnshapeAPI } = load('app/onshapeapi.ts', {
        './common/requestcache': { RequestCache },
    }, {
        XMLHttpRequest: class {
            open() {}
            setRequestHeader() {}
            get responseText() { throw new Error('Cannot read responseText for a blob'); }
            send() {
                requests++;
                this.readyState = 4;
                this.status = 503;
                this.onreadystatechange();
            }
        },
    });
    const api = Object.create(OnshapeAPI.prototype);
    api.thumbnailCache = new RequestCache();
    api.myserver = 'https://example.com';
    for (let i = 0; i < 2; i++) {
        await assert.rejects(api.getThumbnail('/api/thumbnails/image'), /503/);
    }
    assert.equal(requests, 2);
});

test('global library reads are cached for 3 hours, personal reads stay fresh', async () => {
    let now = 0;
    class TimedCache extends RequestCache {
        constructor(ttl, capacity) { super(ttl, capacity, () => now); }
    }
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/requestcache': { RequestCache: TimedCache },
    });
    const app = Object.create(App.prototype);
    app.globalLibrariesNodes = ['global'];
    app.currentBreadcrumbs = [];
    app.libraries = { browseRevision: 0 };
    let calls = 0;
    const read = () => {
        calls++;
        return Promise.resolve([{ name: 'Original' }]);
    };
    const first = await app.getGlobalLibraryRead('global', 'folder:global:child', read);
    first[0].name = 'Changed by rendering';
    const second = await app.getGlobalLibraryRead('global', 'folder:global:child', read);
    assert.equal(second[0].name, 'Original');
    assert.equal(calls, 1);
    now = 5 * 60 * 1000;
    await app.getGlobalLibraryRead('global', 'folder:global:child', read);
    now = 3 * 60 * 60 * 1000 - 1;
    await app.getGlobalLibraryRead('global', 'folder:global:child', read);
    assert.equal(calls, 1);
    now++;
    await app.getGlobalLibraryRead('global', 'folder:global:child', read);
    assert.equal(calls, 2);
    await app.getGlobalLibraryRead('personal', 'folder:personal:child', read);
    await app.getGlobalLibraryRead('personal', 'folder:personal:child', read);
    assert.equal(calls, 4);
    app.currentBreadcrumbs = [{ id: 'GL' }];
    await app.getGlobalLibraryRead('nested', 'library:nested', read);
    app.currentBreadcrumbs = [];
    await app.getGlobalLibraryRead('nested', 'library:nested', read);
    assert.equal(calls, 5);
});

test('library writes invalidate browsing reads before and after completion', async () => {
    const { Library } = load('app/libraries.ts', {
        './preferences': { Preferences: class {} },
    });
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/requestcache': { RequestCache },
    });
    const library = Object.create(Library.prototype);
    library.browseRevision = 0;
    library.getAppElement = async () => ({ id: 'folder' });
    const app = Object.create(App.prototype);
    app.libraries = library;
    app.globalLibrariesNodes = ['global'];
    let contents;
    const read = () => app.getGlobalLibraryRead('global', 'folder', async () => contents);
    let finish;
    library.setBTGArray = () => new Promise((resolve) => { finish = resolve; });
    for (const write of [
        () => library.setProxyLibrary({ id: 'global' }, []),
        () => library.setProxyFolder({ id: 'global' }, { id: 'folder' }, []),
        () => library.setLibrarySearchInfo([], { id: 'global' }),
    ]) {
        app.globalLibraryReads = new RequestCache();
        contents = 'before write';
        assert.equal(await read(), 'before write');
        contents = 'during write';
        const pending = write();
        assert.equal(await read(), 'during write');
        await new Promise(setImmediate);
        contents = 'after write';
        finish(true);
        await pending;
        assert.equal(await read(), 'after write');
        contents = 'uncached change';
        assert.equal(await read(), 'after write');
    }
});

test('known part versions avoid version lookups; unresolved versions are still fetched', async () => {
    const { App } = load('app/app.ts', { './baseapp': { BaseApp: class {} } });
    const app = Object.create(App.prototype);
    let calls = 0;
    app.onshape = { documentApi: { getDocumentVersions: async () => {
        calls++;
        return [{ id: 'v1' }, { id: 'v2' }];
    } } };
    const known = { id: 'part', recentVersion: { id: 'v1' } };
    assert.equal(await app.resolveDocumentVersion(known), known);
    assert.equal(calls, 0);
    const resolved = await app.resolveDocumentVersion({ id: 'part' });
    assert.equal(resolved.recentVersion.id, 'v2');
    assert.equal(calls, 1);
});

test('published insert choices share reads, isolate mutations, and distinguish versions and targets', async () => {
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/requestcache': { RequestCache },
    });
    const app = Object.create(App.prototype);
    let calls = 0;
    app.onshape = { documentApi: { getInsertables: async (request) => {
        calls++;
        return { items: [
            { id: 'part', elementType: 'PARTSTUDIO', versionId: request.wvid },
            { id: 'assembly', elementType: 'ASSEMBLY', versionId: request.wvid },
        ] };
    } } };
    const item = { id: 'document', recentVersion: { id: 'v1' } };
    const [first, second] = await Promise.all([
        app.getInsertChoices(item, 'ASSEMBLY'),
        app.getInsertChoices(item, 'ASSEMBLY'),
    ]);
    assert.equal(calls, 1);
    first[0].deterministicId = 'configured-part';
    assert.equal(second[0].deterministicId, undefined);
    assert.equal((await app.getInsertChoices(item, 'ASSEMBLY'))[0].deterministicId, undefined);
    assert.equal(calls, 1);
    assert.equal((await app.getInsertChoices(item, 'PARTSTUDIO')).length, 1);
    await app.getInsertChoices({ ...item, recentVersion: { id: 'v2' } }, 'ASSEMBLY');
    assert.equal(calls, 3);
    const live = { id: 'document', defaultWorkspace: { id: 'workspace' } };
    await app.getInsertChoices(live, 'ASSEMBLY');
    await app.getInsertChoices(live, 'ASSEMBLY');
    assert.equal(calls, 5);
});

test('failed insert-choice reads reject and can be retried', async () => {
    const { App } = load('app/app.ts', {
        './baseapp': { BaseApp: class {} },
        './common/requestcache': { RequestCache },
    });
    const app = Object.create(App.prototype);
    let calls = 0;
    app.onshape = { documentApi: { getInsertables: async () => {
        if (++calls === 1) throw new Error('rate limited');
        return { items: [] };
    } } };
    const item = { id: 'document', recentVersion: { id: 'v1' } };
    await assert.rejects(app.getInsertChoices(item, 'ASSEMBLY'), /rate limited/);
    assert.equal((await app.getInsertChoices(item, 'ASSEMBLY')).length, 0);
    assert.equal(calls, 2);
});
