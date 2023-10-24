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

// Open any log file if needed
openalog();

// Figure out where we were invoked from
$script_uri = $_SERVER['SCRIPT_URI'];

// Find the position of the last slash
$lastSlashPos = strrpos($script_uri, '/');

if ($lastSlashPos !== false) {
  // Get rid of the name of this script so that we will come back to the main entry
  $script_uri = substr($script_uri, 0, $lastSlashPos + 1); // Add 1 to include the last slash itself
}

global $client_id;

$redirect_uri = $_GET['redirectOnshapeUri'];

$onshape_uri = "https://oauth.onshape.com/oauth/authorize?response_type=code" .
  "&redirect_uri=" . urlencode($script_uri . "?redirectOnshapeUri=" . $redirect_uri) .
  "&client_id=" . $client_id;


header("Location: " . $onshape_uri, true, 302);

// Close the log file
closealog();
