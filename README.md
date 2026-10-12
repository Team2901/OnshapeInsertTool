# Onshape Insert Tool

Onshape Example Client using PHP (based off the [Onshape Oauth Example](https://github.com/toebes/onshape_oauthexample))

This example shows how to create an Onshape client with a PHP backend (basically no significant server)
and [OAuth authentication](https://onshape-public.github.io/docs/3-api-development/oauth/).
All of the backend support is handled by simple PHP LAMHDAs.

## Initial setup in Onshape

In order to be configured in Onshape you need to:

1. Clone/fork the repository to your own machine to edit
2. Identify a server where the minimal backend components will be hosted.  For purposes of this example, we shall assume that they are at `https://ftconshape.com/inserttool/`
3. Create an Onshape OAuth application at `https://dev-portal.onshape.com/oauthApps`.  When you create the App, remember the Secret (which you can only see once) and the client id.
4. In the settings, set the redirect URL to be the URL from step 2.  Also, make sure you select an Admin team who has access to the application.
5. Set the OAuth URL entry to be the same as step 2 with `oauthsignin.php` added to the end of it.  (in this case: `https://ftconshape.com/inserttool/oauthsignin.php`)
6. Copy example_config.php as config.php and update the client id and client secret.
7. For the settings in the Redirect URLs, point it to the location of the backend components (in this case `https://ftconshape.com/inserttool/`)
8. Create an extension entry (we are using an Element Right Panel here) and for the action URL, enter the following.  Note that you need to replace `<clientid>` with the client id you got in step 3 and the `<backenduri>` from step 2 but with the URL encoded (you can use `https://www.urlencoder.org/` to encode the URL).  While you are there, don't forget to update the icon with a `.svg` file.

     `https://oauth.onshape.com/oauth/authorize?response_type=code&client_id=<clientid>%3D&redirect_uri=<backenduri>%3FdocumentId%3D{$documentId}%26workspaceId%3D{$workspaceOrVersionId}%26elementId%3D{$elementId}`

9. Change `app/app_settings.json` to match the name of your application

    ```typescript
    {
       "appName": "inserttool"
    }
    ```
  
10. Edit the example_ftpdeploy.js file and save it as .ftpdeploy.js putting in your credentials for FTPing files to the server
11. Do a `npm run build` to ensure everything builds properly

## Normal Development

1. Once you are happy, you can do an `npm run deploy` to automatically copy all of the files to your server.
2. As a convenince you can also do `npm run deploy-dev` to build and deploy the development version of the code or `npm run deploy-prod` to deploy the production (mininized) version.

If you have done everything right, when you add the application to your account, you should see an icon appear on the right hand edge of the screen (along with the configuration and appearance icons).  When you click on it, it may promopt you for permissions and then once it has been granted will show a dump of all the files you have shared with you.

To make change to the application, edit the `app/app.ts` file.  It is built on top of the `app/baseapp.ts` file which has all the common routines.

## Preferences storage

Preferences normally live in a Blob element in an Onshape preferences document.
If Onshape rejects creation because a free account cannot use private documents,
the app stores preferences in browser local storage instead. This includes favorites,
Recently Inserted, custom settings, and the last browsing location. It does not
create a public preferences document as a fallback. Existing Onshape preferences
documents remain supported.

Local preferences stay in the current browser profile and app origin, scoped to
the app name and authenticated user ID. The app resolves identity before loading
stored preferences; when identity is unavailable, local preferences stay in the
current session and saves report failure. Old preferences stored without a user
ID are ignored because they cannot be safely assigned to an account.
Open panels read the latest stored preferences before updates and use browser
Web Locks, when available, to serialize writes. They do not sync between
browsers. Clearing site data removes them. If browser storage is unavailable,
preferences remain available for the current session, but saves report failure.
Other initialization errors stop startup with a retry message instead of continuing
with an invalid preferences location.

Startup reads the last browsing location once and remembers it so restoring the
same location does not write preferences again. Empty breadcrumbs and the home
location are treated as equivalent. Location changes are debounced for 500 ms,
with only the latest pending location saved. Failed reads do not count as saved
locations, and failed saves can be retried on a later navigation.

## API rate limiting

The app tracks `X-Rate-Limit-Remaining` separately for each API operation, sharing
the cooldown across document IDs and query configurations. A low quota on a
library read does not delay an assembly insertion. Calls to the affected operation
retain the existing conservative pacing and honor `Retry-After` when supplied.
The app does not automatically replay failed writes.

Both proxies follow up to three redirects for thumbnail GET requests. Each hop
must stay on the original HTTPS origin (scheme, host, and port) and have no URL
credentials. Redirect bodies are discarded; the final image is streamed normally.
Other API requests do not gain automatic redirect following.

Run `npm test` to validate rate limiting and browsing behavior.

Failed library reads are not cached. Reopen a library or folder to retry after
a temporary network or API error.

Proxy libraries and preferences share a document-to-workspace-ID cache in the
current app session. It retains up to 64 documents for five minutes and shares
concurrent lookups. Failed lookups and documents with no available workspace
are not cached. Workspace selection still uses the first workspace returned
by Onshape; operations that need the full workspace list continue to fetch it.

## PHP API proxy responses

The PHP API proxy forwards response body chunks as cURL receives them instead of
holding the entire response in a PHP string. It preserves the upstream status,
content type, rate-limit remaining count, and retry-after header. Optional logging
retains only the first 200 body bytes.

The proxy leaves hosting output buffers and compression settings unchanged.
PHP, the web server, or a reverse proxy may still buffer delivery, so earlier
arrival of bytes depends on the host. If an upstream transfer fails before body
output, the proxy returns a 502 JSON error. If it fails after output starts, the
response may be truncated; the proxy cannot replace its status and does not
append error text to the partially transmitted JSON or image.

Run `npm run test:php` with PHP, the cURL extension, and OpenSSL installed to
validate streaming and redirects against local HTTP and HTTPS upstreams.
Set `PHP_BIN` and `OPENSSL_BIN` to their executable paths if they are not on PATH.

## Having two deployment locations

When developming it is useful to have a test location as well as a production version.
To accomplish this, you need to set up a second application with a separate store entry (steps 2-10 above).
However so that you can keep separate copies of the location where you deploy as well as the
store `client_id`/`client_secret` values you need to create copies of the `server/config.php` and `.ftpdeploy.js` files
with the corresponding information.  You should make a copy of them in the same location, but append it with the name of the
application that you chose.

So if your main application was `inserttool` and the test version was `insertwork` you would have a total of 6 files

* `server/config.php.inserttool` - The `client_id/client_secret for the inserttool application
* `server/config.php.insertwork` - The `client_id/client_secret for the insertwork application
* `server/config.php` - the currently selected one (a copy of one of the above two files)
* `.ftpdeploy.js.inserttool` - The ftp credentials for copying to the inserttool location
* `.ftpdeploy.js.insertwork` - The ftp credentials for copying to the insertwork location
* `.ftpdeploy.js` - The currently selected one (a copy of one of the above two files)

To switch, you just run

```bash
   npm run switch inserttool
```

or

```bash
   npm run switch insertwork
```

## Calling Onshape APIs

All of the Onshape APIs are available via `this.onshape`.  Onshape has a [REST API EXPLORER](https://cad.onshape.com/glassworks/explorer/) explorer that you can view all of the calls and search them.  All of the APIs are made available as Typescript interfaces at through [onshape-typescript-fetch](https://github.com/toebes/onshape-typescript-fetch).  You can [find documentation here](https://toebes.github.io/onshape-typescript-fetch/).

## Updating Global Libraries

First add the desired global library to the "My Libraries" node by right clicking on the desired global library and selecting "Add library to My Libraries." 
Then, parts can be added and moved to the version of the global library in the aforementioned node by right clicking on any part and selecting "Add document to parts library" or "Add document to library folder," however the former puts the document in the root directory.
The latter of the two choices allows the user to select the proxy-folder that the document is put in, by selecting the desired global library and then a folder (top and bottom dropdown respectively).
