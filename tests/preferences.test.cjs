const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

function harness(storage = new Map(), options = {}) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(require.resolve('../app/preferences.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 },
    });
    const localStorage = {
        getItem: key => storage.has(key) ? storage.get(key) : null,
        setItem: (key, value) => { if (options.blockWrite) throw new Error('blocked'); storage.set(key, value); },
    };
    vm.runInNewContext(code.outputText, { exports, localStorage, navigator: { locks: options.locks }, console: { info() {}, warn() {}, log() {} },
        require: name => name === 'onshape-typescript-fetch' ? {
            GetAssociativeDataWvmEnum: { w: 'w' },
            BTGlobalTreeNodeInfoFromJSONTyped: value => value,
        } : name.endsWith('/runtime') ? { exists: (value, key) => value[key] !== undefined } : {},
    });
    const calls = { create: 0, writes: [], reads: 0 };
    const restriction = { response: new Response(JSON.stringify({ message: 'Free accounts only allow access to public documents. Upgrade your account to get full access to private documents.' }), { status: 409 }) };
    const onshape = { server: 'https://cad.onshape.com', userId: options.user || 'user', freeUser: false,
        getAccessToken: async () => 'test-access-token',
        userApi: { sessionInfo: async (init) => {
            assert.equal(init.headers.Authorization, 'Bearer test-access-token');
            calls.identityAuthenticated = true;
            if (options.identityError) throw new Error('identity unavailable');
            return { id: options.user || 'user' };
        } },
        globalTreeNodesApi: { globalTreeNodesMagic: async () => ({ items: [] }) },
        documentApi: { createDocument: async () => { calls.create++; throw options.error || restriction; } },
        blobElementApi: {
            downloadFileWorkspace: async () => { calls.reads++; if (options.readError) throw new Error('read failed'); return '{"appName":"App","favorited":[{"id":"old"}]}'; },
            uploadFileUpdateElement: async value => { calls.writes.push(value); },
        },
    };
    return { prefs: new exports.Preferences(onshape), storage, calls, onshape };
}

test('free-account rejection enables durable local favorites, recent items, and last location without public writes', async () => {
    const h = harness();
    const info = await h.prefs.initUserPreferences('App');
    assert.equal(info.jsonType, 'local-preferences');
    assert.equal(await h.prefs.addMagicNode({ id: 'part' }, 'recentlyInserted'), true);
    assert.equal(await h.prefs.addMagicNode({ id: 'favorite' }, 'favorited'), true);
    assert.equal(await h.prefs.setBTGArray(info, 'last_known_location', [{ id: 'folder' }]), true);
    assert.equal(h.calls.create, 1);
    assert.equal(h.calls.writes.length, 0);
    const reload = harness(h.storage);
    await reload.prefs.initUserPreferences('App');
    assert.equal(reload.calls.create, 0);
    assert.equal((await reload.prefs.getAllOfMagicType('recentlyInserted'))[0].id, 'part');
    assert.equal((await reload.prefs.getAllOfMagicType('favorited'))[0].id, 'favorite');
    assert.equal((await reload.prefs.getLastKnownLocation())[0].id, 'folder');
    const copy = await reload.prefs.getAllOfMagicType('favorited');
    copy[0].id = 'mutated';
    assert.equal((await reload.prefs.getAllOfMagicType('favorited'))[0].id, 'favorite');
});

test('local preferences are isolated by app and known user', async () => {
    const h = harness(); await h.prefs.initUserPreferences('App');
    await h.prefs.addMagicNode({ id: 'favorite' }, 'favorited');
    for (const [app, user] of [['Other App', 'user'], ['App', 'other-user']]) {
        const other = harness(h.storage, { user }); await other.prefs.initUserPreferences(app);
        assert.equal((await other.prefs.getAllOfMagicType('favorited')).length, 0);
    }
});

test('missing and incomplete locations reject promptly and writes report failure', async () => {
    const { prefs } = harness();
    await assert.rejects(prefs.getAppJson(undefined), /unavailable/);
    await assert.rejects(prefs.getAppJson({ id: 'doc' }), /unavailable/);
    assert.equal(await prefs.setCustom('setting', true), false);
    assert.equal(await prefs.setBTGArray(undefined, 'favorited', []), false);
});

test('non-account initialization failures do not become local mode or hang discovery', async () => {
    for (const error of [new Error('network'), { response: new Response('{}', { status: 403 }) },
        { response: new Response('{"message":"unrelated conflict"}', { status: 409 }) }]) {
        const { prefs } = harness(new Map(), { error });
        assert.equal(await prefs.initUserPreferences('App'), undefined);
    }
    const { prefs, onshape } = harness();
    onshape.globalTreeNodesApi.globalTreeNodesMagic = async () => { throw new Error('discovery failed'); };
    await assert.rejects(prefs.getPreferencesDoc(), /discovery failed/);
});

test('remote preferences are reused, invalid cache entries are ignored, and failed reads never overwrite remote data', async () => {
    const h = harness();
    const key = 'insert-tool:preferences-location:' + JSON.stringify([h.onshape.server, h.onshape.userId, 'App']);
    h.storage.set(key, '{broken');
    await h.prefs.initUserPreferences('App');
    assert.equal(h.calls.create, 1);
    const remote = harness(new Map(), { readError: true });
    remote.storage.set(key, JSON.stringify({ id: 'doc', wvmid: 'workspace', elementId: 'blob' }));
    const info = await remote.prefs.initUserPreferences('App');
    assert.equal(remote.calls.create, 0);
    assert.equal(info.id, 'doc');
    assert.equal(await remote.prefs.setCustom('setting', true), false);
    assert.equal(remote.calls.writes.length, 0);
});

test('storage write failure keeps session preferences but reports that persistence failed', async () => {
    const h = harness(new Map(), { blockWrite: true });
    await h.prefs.initUserPreferences('App');
    assert.equal(await h.prefs.setCustom('setting', 'value'), false);
    assert.equal(await h.prefs.getCustom('setting', 'default'), 'value');
    assert.equal(await h.prefs.getCustom('missing', 'default'), 'default');
});

test('simultaneous local updates retain all recent items and unrelated settings', async () => {
    const { prefs } = harness(); await prefs.initUserPreferences('App');
    await Promise.all([
        prefs.addMagicNode({ id: 'one' }, 'recentlyInserted'),
        prefs.addMagicNode({ id: 'two' }, 'recentlyInserted'),
        prefs.setCustom('setting', true),
    ]);
    const recent = await prefs.getAllOfMagicType('recentlyInserted');
    assert.equal(recent.length, 2);
    assert.equal(recent[0].id, 'two');
    assert.equal(await prefs.getCustom('setting', false), true);
});

test('successful remote writes preserve existing settings and send the selected document location', async () => {
    const { prefs, calls } = harness();
    const info = { id: 'doc', wvmid: 'workspace', elementId: 'blob' };
    prefs.userPreferencesInfo = info;
    assert.equal(await prefs.setCustom('setting', true), true);
    assert.equal(calls.writes.length, 1);
    const request = calls.writes[0];
    assert.equal(request.did, 'doc'); assert.equal(request.wid, 'workspace'); assert.equal(request.eid, 'blob');
    const body = JSON.parse(request.file);
    assert.equal(body.setting, true);
    assert.equal(body.favorited[0].id, 'old');
});

test('launches without user IDs resolve identity before reading storage and ignore unscoped preferences', async () => {
    const storage = new Map();
    const unscoped = 'insert-tool:local-preferences:' + JSON.stringify(['https://cad.onshape.com', '', 'App']);
    storage.set(unscoped, '{"favorited":[{"id":"unscoped"}]}');
    const alice = harness(storage, { user: 'alice' }); alice.onshape.userId = '';
    await alice.prefs.initUserPreferences('App');
    assert.equal(alice.calls.identityAuthenticated, true);
    assert.equal((await alice.prefs.getAllOfMagicType('favorited')).length, 0);
    await alice.prefs.addMagicNode({ id: 'alice-part' }, 'favorited');
    const bob = harness(storage, { user: 'bob' }); bob.onshape.userId = '';
    await bob.prefs.initUserPreferences('App');
    assert.equal((await bob.prefs.getAllOfMagicType('favorited')).length, 0);
    assert.equal(bob.onshape.userId, 'bob');
    const unknown = harness(storage, { identityError: true });
    await unknown.prefs.initUserPreferences('App');
    assert.equal((await unknown.prefs.getAllOfMagicType('favorited')).length, 0);
    const before = JSON.stringify([...storage]);
    assert.equal(await unknown.prefs.addMagicNode({ id: 'session-part' }, 'favorited'), false);
    assert.equal((await unknown.prefs.getAllOfMagicType('favorited'))[0].id, 'session-part');
    assert.equal(JSON.stringify([...storage]), before);
});

test('two panels preserve additions, removals and unrelated settings through shared writes', async () => {
    let queue = Promise.resolve();
    const locks = { request: (_key, save) => {
        const next = queue.then(save); queue = next.catch(() => {}); return next;
    } };
    const storage = new Map();
    const one = harness(storage, { locks }), two = harness(storage, { locks });
    await one.prefs.initUserPreferences('App'); await two.prefs.initUserPreferences('App');
    await Promise.all([
        one.prefs.addMagicNode({ id: 'one' }, 'favorited'),
        two.prefs.addMagicNode({ id: 'two' }, 'favorited'),
        one.prefs.setCustom('setting', true),
        two.prefs.setLastKnownLocation([{ id: 'folder' }]),
    ]);
    assert.equal((await one.prefs.getAllOfMagicType('favorited')).length, 2);
    await Promise.all([
        one.prefs.removeMagicNode({ id: 'one' }, 'favorited'),
        two.prefs.addMagicNode({ id: 'three' }, 'favorited'),
    ]);
    const reload = harness(storage); await reload.prefs.initUserPreferences('App');
    assert.equal(JSON.stringify((await reload.prefs.getAllOfMagicType('favorited')).map(node => node.id)), '["three","two"]');
    assert.equal(await reload.prefs.getCustom('setting', false), true);
    assert.equal((await reload.prefs.getLastKnownLocation())[0].id, 'folder');
});
