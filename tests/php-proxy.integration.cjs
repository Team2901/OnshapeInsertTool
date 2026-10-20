const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { before, after, test } = require('node:test');

const php = process.env.PHP_BIN || 'php';
const binary = Buffer.alloc(2 * 1024 * 1024);
for (let i = 0; i < binary.length; i++) binary[i] = i % 256;
let upstream, secureUpstream, child, temporary, proxyOrigin, upstreamOrigin, secureOrigin, slowFinished;
const redirectRequests = [];
const stopped = () => new Promise(resolve => child.once('exit', resolve));

async function listen(server) {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return server.address().port;
}

before(async () => {
    const check = spawnSync(php, ['-r', 'exit(extension_loaded("curl") ? 0 : 1);'], { encoding: 'utf8' });
    assert.equal(check.status, 0, 'PHP with cURL is required. Set PHP_BIN if needed. ' + (check.error?.message || check.stderr));
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'onshape-php-proxy-'));
    const cert = path.join(temporary, 'cert.pem'), key = path.join(temporary, 'key.pem');
    const tls = spawnSync(process.env.OPENSSL_BIN || 'openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1'], { encoding: 'utf8' });
    assert.equal(tls.status, 0, 'OpenSSL is required for HTTPS redirect tests. Set OPENSSL_BIN if needed. ' + (tls.error?.message || tls.stderr));
    secureUpstream = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, (req, res) => {
        redirectRequests.push({ path: req.url, method: req.method, auth: req.headers.authorization });
        if (req.url === '/binary') { res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(binary); return; }
        const destinations = {
            '/relative': '/binary', '/absolute': secureOrigin + '/binary', '/chain': '/relative', '/loop': '/loop',
            '/foreign': 'https://example.invalid/image', '/port': 'https://127.0.0.1:1/image',
            '/downgrade': upstreamOrigin + '/binary', '/credentials': secureOrigin.replace('https://', 'https://user:password@') + '/binary',
        };
        res.writeHead(307, { Location: destinations[req.url] || '/binary', 'Content-Type': 'text/plain' });
        res.end('redirect body must not reach client');
    });
    secureOrigin = 'https://127.0.0.1:' + await listen(secureUpstream);
    upstream = http.createServer((req, res) => {
        if (req.url === '/disconnect') { req.socket.destroy(); return; }
        if (req.url === '/empty') { res.writeHead(204, { 'X-Rate-Limit-Remaining': '99' }); res.end(); return; }
        if (req.url === '/binary') { res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(binary); return; }
        if (req.url === '/partial') {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '100' });
            res.write('{"unfinished":');
            setTimeout(() => req.socket.destroy(), 100);
            return;
        }
        if (req.url === '/slow') {
            slowFinished = false;
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('first');
            setTimeout(() => { slowFinished = true; res.end('last'); }, 500);
            return;
        }
        if (req.url === '/hints') res.writeEarlyHints({ link: '</unused.css>; rel=preload', 'content-type': 'text/plain' });
        const status = req.url === '/error' ? 429 : 200;
        res.writeHead(status, { 'Content-Type': 'application/json', 'X-Rate-Limit-Remaining': '0', 'Retry-After': '7' });
        res.end('{"ok":true}');
    });
    upstreamOrigin = 'http://127.0.0.1:' + await listen(upstream);
    const reservation = net.createServer();
    const port = await listen(reservation);
    await new Promise(resolve => reservation.close(resolve));
    const helper = path.resolve(__dirname, '../server/api/stream.php').replaceAll('\\', '/');
    // Test the exact production response handler, independent of Apache routing.
    const router = `<?php
require ${JSON.stringify(helper)};
$thumbnail = isset($_GET['thumbnail']);
$url = getenv($thumbnail ? 'PROXY_TEST_SECURE' : 'PROXY_TEST_UPSTREAM') . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cert.pem');
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer test-token'));
if ($_SERVER['REQUEST_METHOD'] === 'POST') curl_setopt($ch, CURLOPT_POST, true);
if ($_SERVER['REQUEST_METHOD'] === 'HEAD') curl_setopt($ch, CURLOPT_NOBODY, true);
streamProxyResponse($ch, function ($message) {}, $thumbnail && $_SERVER['REQUEST_METHOD'] === 'GET' ? $url : null);
`;
    fs.writeFileSync(path.join(temporary, 'router.php'), router);
    proxyOrigin = 'http://127.0.0.1:' + port;
    child = spawn(php, ['-d', 'output_buffering=0', '-d', 'display_errors=0', '-S', '127.0.0.1:' + port, path.join(temporary, 'router.php')], {
        env: { ...process.env, PROXY_TEST_UPSTREAM: upstreamOrigin, PROXY_TEST_SECURE: secureOrigin }, stdio: 'ignore', windowsHide: true,
    });
    for (let i = 0; i < 100; i++) {
        try { const response = await fetch(proxyOrigin + '/empty'); await response.body?.cancel(); return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('PHP test server did not start');
});

after(async () => {
    if (child && child.exitCode === null) { const done = stopped(); child.kill(); await done; }
    if (upstream) await new Promise(resolve => upstream.close(resolve));
    if (secureUpstream) await new Promise(resolve => secureUpstream.close(resolve));
    if (temporary) {
        const target = path.resolve(temporary);
        assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
        assert.ok(path.basename(target).startsWith('onshape-php-proxy-'));
        fs.rmSync(target, { recursive: true, force: true });
    }
});

test('response chunks arrive before the upstream finishes', async () => {
    const response = await fetch(proxyOrigin + '/slow');
    const reader = response.body.getReader();
    const first = await reader.read();
    assert.equal(Buffer.from(first.value).toString(), 'first');
    assert.equal(slowFinished, false, 'first bytes must arrive before upstream completion');
    let rest = '';
    for (;;) { const chunk = await reader.read(); if (chunk.done) break; rest += Buffer.from(chunk.value).toString(); }
    assert.equal(rest, 'last');
});

test('binary responses preserve every byte', async () => {
    const response = await fetch(proxyOrigin + '/binary');
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), binary);
});

test('upstream error statuses, rate limits and JSON bodies are preserved', async () => {
    const response = await fetch(proxyOrigin + '/error');
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '7');
    assert.equal(response.headers.get('x-rate-limit-remaining'), '0');
    assert.equal(response.headers.get('content-type'), 'application/json');
    assert.equal(await response.text(), '{"ok":true}');
});

test('informational headers are replaced by final response headers', async () => {
    const response = await fetch(proxyOrigin + '/hints');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/json');
    assert.equal(await response.text(), '{"ok":true}');
});

test('HEAD and empty responses retain status and headers without a body', async () => {
    const empty = await fetch(proxyOrigin + '/empty');
    assert.equal(empty.status, 204);
    assert.equal(empty.headers.get('x-rate-limit-remaining'), '99');
    assert.equal(await empty.text(), '');
    const head = await fetch(proxyOrigin + '/error', { method: 'HEAD' });
    assert.equal(head.status, 429);
    assert.equal(head.headers.get('retry-after'), '7');
    assert.equal(await head.text(), '');
});

test('failure before any body produces a clean 502', async () => {
    const response = await fetch(proxyOrigin + '/disconnect');
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'Upstream request failed' });
});

test('failure after body output never appends error text to the partial response', async () => {
    const response = await fetch(proxyOrigin + '/partial');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '{"unfinished":');
});

test('thumbnail GETs follow same HTTPS origin redirects and stream only the final image', async () => {
    for (const route of ['/relative', '/absolute', '/chain']) {
        const start = redirectRequests.length;
        const response = await fetch(proxyOrigin + route + '?thumbnail=1');
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'image/png');
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), binary);
        for (const request of redirectRequests.slice(start)) {
            assert.equal(request.method, 'GET'); assert.equal(request.auth, 'Bearer test-token');
        }
    }
});

test('thumbnail redirects reject foreign hosts, ports, schemes, credentials and loops', async () => {
    for (const route of ['/foreign', '/port', '/downgrade', '/credentials', '/loop']) {
        const start = redirectRequests.length;
        const response = await fetch(proxyOrigin + route + '?thumbnail=1');
        assert.equal(response.status, 502);
        assert.deepEqual(await response.json(), { error: 'Thumbnail redirect refused' });
        assert.equal(redirectRequests.length - start, route === '/loop' ? 4 : 1);
    }
    const response = await fetch(proxyOrigin + '/relative?thumbnail=1', { method: 'POST', redirect: 'manual' });
    assert.equal(response.status, 307);
});
