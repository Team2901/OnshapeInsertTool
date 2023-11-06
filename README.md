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
