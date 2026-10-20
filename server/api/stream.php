<?php

/**
 * Forward an upstream response without retaining its full body in PHP memory.
 * Leave PHP, web-server, and reverse-proxy buffering under the host's control.
 */
function streamProxyResponse($ch, $log, $thumbnailUrl = null)
{
    $status = 502;
    $headers = array();
    $bodyStarted = false;
    $preview = '';

    $sendHeaders = function () use (&$status, &$headers) {
        http_response_code($status);
        foreach ($headers as $name => $value) {
            header($name . ': ' . $value);
        }
    };

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($handle, $line) use (&$status, &$headers) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $line, $matches)) {
            // A new block replaces informational responses (e.g. 100 Continue).
            $status = (int) $matches[1];
            $headers = array();
        } else {
            $colon = strpos($line, ':');
            if ($colon !== false) {
                $name = strtolower(trim(substr($line, 0, $colon)));
                if (in_array($name, array('content-type', 'x-rate-limit-remaining', 'retry-after'), true)) {
                    $headers[$name] = trim(substr($line, $colon + 1));
                }
            }
        }
        return strlen($line);
    });
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($handle, $chunk) use (&$bodyStarted, &$preview, &$status, $thumbnailUrl, $sendHeaders) {
        // Discard redirect bodies until the destination has passed the origin check.
        if ($thumbnailUrl !== null && $status >= 300 && $status < 400) return strlen($chunk);
        if (!$bodyStarted) {
            $sendHeaders();
            $bodyStarted = true;
        }
        // Keep only the bounded preview used by existing optional logging.
        if (strlen($preview) < 200) {
            $preview .= substr($chunk, 0, 200 - strlen($preview));
        }
        echo $chunk;
        return strlen($chunk);
    });

    for ($redirects = 0; ; $redirects++) {
        $success = curl_exec($ch);
        $info = curl_getinfo($ch);
        if ($success === false || $thumbnailUrl === null || $status < 300 || $status >= 400) break;
        // cURL resolves relative Location values without following them.
        $destination = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        $source = parse_url($thumbnailUrl);
        $target = $destination ? parse_url($destination) : false;
        if ($redirects >= 3 || !$source || !$target ||
            strtolower($source['scheme'] ?? '') !== 'https' ||
            strtolower($target['scheme'] ?? '') !== 'https' ||
            strtolower($source['host'] ?? '') !== strtolower($target['host'] ?? '') ||
            ($source['port'] ?? 443) !== ($target['port'] ?? 443) ||
            isset($target['user']) || isset($target['pass'])) {
            http_response_code(502);
            header('Content-Type: application/json');
            echo '{"error":"Thumbnail redirect refused"}';
            return $info;
        }
        curl_setopt($ch, CURLOPT_URL, $destination);
        $status = 502;
        $headers = array();
    }
    if ($success === false) {
        $log('Upstream transfer failed: ' . curl_error($ch) . "\n");
        if (!$bodyStarted) {
            http_response_code(502);
            header('Content-Type: application/json');
            echo '{"error":"Upstream request failed"}';
        }
        // After output starts, don't append an error message to JSON or binary.
        // The response may be incomplete; its HTTP status cannot be replaced.
    } elseif (!$bodyStarted) {
        // HEAD, 204, 304, and other empty responses still need their final headers.
        $sendHeaders();
    }
    $log("RESPONSE BODY (first 200 chars):\n" . $preview . "\n");
    return $info;
}
