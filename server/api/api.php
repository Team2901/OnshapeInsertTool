<?php
//
//  Copyright (c) 2023 John Toebes
// 
//  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
// 
//  1. Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
// 
//  2. Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
// 
//  3. Neither the name of the copyright holder nor the names of its contributors
//     may be used to endorse or promote products derived from this software
//     without specific prior written permission.
// 
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
require_once 'config.php';
$logfile = NULL;

// If they ask for a log file to be written, open it up
function openalog() {
  global $logfile, $logfilename, $enable_log;
  if ($enable_log) {
    $logfile = fopen($logfilename, "a");
  }
}

// Close out any open log file
function closealog() {
  global $logfile;
  if ($logfile) {
    fclose($logfile);
    $logfile = NULL;
  }
}

// Output a log message to the logfile (if it is open)
function oalog($logstr) {
  global $logfile;
  if ($logfile) {
    fwrite($logfile, $logstr);
  }
}

function getPost() {
    if(!empty($_POST)) {
        // when using application/x-www-form-urlencoded or multipart/form-data as the HTTP Content-Type in the request
        // NOTE: if this is the case and $_POST is empty, check the variables_order in php.ini! - it must contain the letter P
        return $_POST;
    }

    // when using application/json as the HTTP Content-Type in the request 
    return file_get_contents('php://input');
}

// Open any log file if needed
openalog();

oalog("\n****Making request V1.0.3\n");
oalog(print_r($_SERVER, true)."\n");

// Get the path to our script
$pieces = explode('/', $_SERVER[PHP_SELF]);
// And throw away the last two elements (i.e. if we are  /oauthexample/api/api.php then we want to get rid of the /api/api.php )
array_splice($pieces, -2, 2);
$choice = implode('/', $pieces);
// And remove what was left from the URL to construct our actual API request.
$apiurl = substr($_SERVER[REDIRECT_URL], strlen($choice));

// Capture all the other relevant parameters from the request.
$authorization = $_SERVER[HTTP_AUTHORIZATION];
$querystring = $_SERVER[QUERY_STRING];
$method = $_SERVER[REQUEST_METHOD];
$content_type = $_SERVER[CONTENT_TYPE];
$user_agent = $_SERVER[HTTP_USER_AGENT];
$platform = $_SERVER[HTTP_SEC_CH_UA_PLATFORM];
$accept = $_SERVER[HTTP_ACCEPT];
$onshapeserver = $_SERVER[HTTP_X_SERVER];

$onshapeapi = $onshapeserver.$apiurl .'?'.$querystring;

oalog('url='. $onshapeapi."\n");
oalog('authorization='. $authorization."\n");
oalog('method='.$method ."\n");
oalog('content_type='.$content_type ."\n");
oalog('user_agent='. $user_agent."\n");
oalog('platform='.$platform ."\n");
oalog('accept='.$accept ."\n");

// // Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $onshapeapi);
curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);

curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: '.$content_type,
    'sec-ch-ua-platform: '.$platform,
    'authorization: '.$authorization,
    'method: '.$method,
    'accept: '.$accept
    ));


curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLINFO_HEADER_OUT, true);
curl_setopt($ch, CURLINFO_HEADER, true);

if ($method == "POST") {
    $postData = getPost();
    oalog("POSTDATA:\n $postData\n");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
}
// Make the request
$response = curl_exec($ch);
$err = curl_error($ch);

// Dump out the headers so we can confirm what we asked for
$headers = curl_getinfo($ch, CURLINFO_HEADER_OUT);
oalog("HEADERS:\n".$headers."\n");
oalog("TIME:\n".date("h:i:sa")."\n");
$start_time = microtime(true);

// Log what we got back
$limit = strlen($response);
if ($limit > 80) {
  $limit = 80;
}
$out = "";
for ($i = 0; $i < $limit; $i++) {
    $out .= str_pad(dechex(ord($response[$i])), 2, '0', STR_PAD_LEFT);
}

oalog("RESPONSE:\n".$out."\nERR: ".$err."\n");
oalog("Timing".(round(microtime(true)-$start_time,2)*1000));
// Log all the information about the request/response
$info = curl_getinfo($ch);
oalog("INFO:\n".print_r($info, true));

curl_close($ch);

header('Content-Type: '.$info['content_type']);
echo $response;
  
// Close the log file
closealog();
