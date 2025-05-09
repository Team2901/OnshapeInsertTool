<?php
require_once 'config.php';

$logfile = NULL;

// If they ask for a log file to be written, open it up
function openalog()
{
    global $logfile, $logfilename, $enable_log;
    if ($enable_log) {
        $logfile = fopen($logfilename, "a");
    }
}

// Close out any open log file
function closealog()
{
    global $logfile;
    if ($logfile) {
        fclose($logfile);
        $logfile = NULL;
    }
}

// Output a log message to the logfile (if it is open)
function oalog($logstr)
{
    global $logfile;
    if ($logfile) {
        fwrite($logfile, $logstr);
    }
}

// Open the log file
openalog();

// Sanitize and validate input parameters
function sanitize($value) {
    return htmlspecialchars(strip_tags(trim($value)));
}

$redirectPath = $appname;

$clientId = isset($_GET['client_id']) ? sanitize($_GET['client_id']) : null;
$documentId = isset($_GET['documentId']) ? sanitize($_GET['documentId']) : null;
$workspaceOrVersionId = isset($_GET['workspaceId']) ? sanitize($_GET['workspaceId']) : null;
$elementId = isset($_GET['elementId']) ? sanitize($_GET['elementId']) : null;

// Ensure required parameters are present
if (!$clientId || !$documentId || !$workspaceOrVersionId || !$elementId) {
    oalog("Missing required parameters: client_id=$clientId, documentId=$documentId, workspaceOrVersionId=$workspaceOrVersionId, elementId=$elementId.\n");
    http_response_code(400);
    echo "Missing required parameters.";
    closealog();
    exit;
}

// Construct the redirect URL
$redirectUrl = "https://oauth.onshape.com/oauth/authorize?response_type=code&client_id={$clientId}&redirect_uri=" . 
    urlencode("https://ftconshape.com/{$redirectPath}/?documentId={$documentId}&workspaceId={$workspaceOrVersionId}&elementId={$elementId}");

oalog("Redirecting to: $redirectUrl\n");

// Perform the redirect
header("Location: $redirectUrl");

// Close the log file
closealog();
