/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

import { createDocumentElement } from './common/htmldom';
import { onshapeConfig, OnshapeAPI } from './onshapeapi';

/**
 * BaseApp contains all the support routines that your application will need.
 * You should not need to make any changes in this file (except for potential bug fixes)
 * because everything you will want to override will be in app.ts (or other files you extend it with)
 */

export class BaseApp {
    public documentId = '';
    public workspaceId = '';
    public elementId = '';
    public server = 'https://cad.onshape.com';
    public myserver = ''; // Fill in with your server
    public onshape: OnshapeAPI;

    /**
     * Handle any post messages sent to us
     * @param e Event message
     */
    public handlePostMessage(e: MessageEvent<any>): any {
        console.log('Post message received in application extension.');
        console.log('e.origin = ' + e.origin);

        // Verify the origin matches the server iframe src query parameter
        if (this.server === e.origin) {
            // console.log(
            //     "Message safe and can be handled as it is from origin '" +
            //         e.origin +
            //         "', which matches server query parameter '" +
            //         this.server +
            //         "'."
            // );
            if (e.data && e.data.messageName) {
                console.log("Message name = '" + e.data.messageName + "'");
            } else {
                // console.log('Message name not found. Ignoring message.');
            }
        } else {
            // console.log('Message NOT safe and should be ignored.');
        }
    }
    /**
     * Replace the main app elements.  Note if there is no app div, the elements are appended to the main body so that they aren't lost
     * @param elem Element to replace
     */
    public setAppElements(elem: HTMLElement): void {
        let appelement = document.getElementById('app');
        if (appelement !== null) {
            appelement.innerHTML = '';
        } else {
            appelement = document.body;
        }
        appelement.append(elem);
    }
    /**
     * Create the initial page showing that we are initializing
     */
    public showInitializing() {
        // var h2 = document.createElement('h2');
        // h2.innerHTML = 'Initializing';
        // this.setAppElements(h2);
        const container = createDocumentElement('div', {
            style: `width:${document.documentElement.clientWidth}px;height:${document.documentElement.clientHeight}px;display:flex;justify-content:center;align-content:center;align-items:center;`,
        });
        const style = createDocumentElement('style');
        style.innerHTML = `
        @keyframes osSpinnerSpinning {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(1turn);
            transform: rotate(1turn);
          }
        }`;
        const spinner = createDocumentElement('div', {
            class: 'thumbnail-spinner os-spinner-medium os-spinner-spinning',
            style: `-webkit-animation:osSpinnerSpinning 1.1s linear infinite;animation:
             osSpinnerSpinning 1.1s linear infinite;border: 1.1em solid rgba(22,81,176,.2);
             border-left-color: #1651b0;border-radius: 50%;height: 10em;
             -webkit-transform:translateZ(0);transform: translateZ(0);width: 10em;font-size: 3px;`,
        });
        container.appendChild(style);
        container.appendChild(spinner);
        this.setAppElements(container);
    }
    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     * @param access_token Access token returned by Onshape
     * @param refresh_token Refresh token needed if the Access Token has to be refreshed
     * @param expires Time when the token expires and needs to be updated
     */
    public initApp() {
        this.ListenForAppClicks();
        this.AddPostMessageListener();
        this.NotifyOnshapeAppInit();
        this.startApp();
    }
    /**
     * Notify Onshape that we have initialized and are ready to do work
     * See: https://onshape-public.github.io/docs/clientmessaging/
     */
    public NotifyOnshapeAppInit() {
        let message = {
            documentId: this.documentId,
            workspaceId: this.workspaceId,
            elementId: this.elementId,
            messageName: 'applicationInit',
        };
        // console.log('Posting message: %o', message);
        window.parent.postMessage(message, '*');
    }
    /**
     * Add a listener for any post messages from Onshape.  When they come in,
     * they will be redirected to the handlePostmessage handler.
     */
    public AddPostMessageListener() {
        window.addEventListener(
            'message',
            (event: Event) => {
                this.handlePostMessage(event as MessageEvent<any>);
            },
            false
        );
    }
    /**
     * Listen for clicks in our application and post a message to the Onshape client
     */
    public ListenForAppClicks() {
        const topelement = document.getElementById('top');
        if (topelement !== null) {
            topelement.addEventListener(
                'click',
                () => {
                    // console.log('clicked!');
                    let message = {
                        documentId: this.documentId,
                        workspaceId: this.workspaceId,
                        elementId: this.elementId,
                        messageName: 'closeFlyoutsAndMenus',
                    };
                    // console.log('Posting message: %o', message);
                    window.parent.postMessage(message, '*');
                },
                true
            );
        }
    }
    /**
     * Get the contents of a file from Onshape
     * @param url URL of file to get from onshape
     * @returns Contents of the file
     */
    public getOnshapeFile(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let uri = `${this.myserver}/getfile.php?url=${url}`;
            xhr.open('GET', uri, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(xhr.responseText);
                    }
                }
            };
            xhr.send();
        });
    }
    /**
     * Patch in the CSS used by Onshape to our document so that we get the same styles
     * @param url URL of Onshape document to extract style sheets from
     * @returns
     */
    public insertOnshapeCSS(url: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.getOnshapeFile(url).then((css: string) => {
                // Extract all the <link html elements from the file.
                const re = new RegExp(/<link[^>]*>/g);
                const found = css.match(re);
                // Find the head element of the iframe so that we know where to patch in the stylesheets
                let headElement = document.getElementsByTagName('head')[0];
                if (headElement !== null && headElement !== undefined) {
                    const baseRef = createDocumentElement('base', {
                        href: this.myserver,
                    });
                    headElement.appendChild(baseRef);
                    if (found) {
                        found.forEach((item) => {
                            // The Links will be of the following form.  Note that
                            // we only want the stylesheet ones.  We can ignore the others
                            // <link rel="shortcut icon" href="/favicon.png">
                            // <link href="/js/vendor-bundle.372f38798a62e5110c68.css" rel="stylesheet">
                            // <link href="/css/woolsthorpe.17479501f16d0d4ce613.css" rel="stylesheet">
                            if (item.match(/rel *= *['"]stylesheet["']/) !== null) {
                                // Get the href portion of it.  Note that
                                // match returns us both the full match (element 0)
                                // and the exact match (element 1)
                                const hrefRegex = /href=["']([^'"]+)/;
                                const css = item.match(hrefRegex);
                                // Did we get a match at all?
                                if (css !== null && css.length > 1) {
                                    // We did.  Create a link element in the DOM
                                    var cssLink = createDocumentElement('link', {
                                        href: `${this.myserver}/getfile.php?url=${
                                            this.server + css[1]
                                        }`,
                                        rel: 'stylesheet',
                                        type: 'text/css',
                                    });
                                    // Insert the element into the head of the IFrame
                                    headElement.appendChild(cssLink);
                                }
                            }
                        });
                    }
                }
                resolve(true);
            });
        });
    }

    // /**
    // * Doesn't work because cannot get session info
    //  * Fixes onshape userId and adds freeUser boolean
    //  * @returns
    //  */
    // public patchOnshapeConfig(): Promise<void>{
    //   return new Promise((resolve,reject)=>{
    //     this.onshape.userApi.sessionInfo({}).then((res) => {
    //       if(res === undefined || res === null || (res && res.id === undefined))reject("Cannot get session info");
    //       this.onshape.userId = res.id;
    //       if(res.planGroup === "Free")this.onshape.freeUser = true;
    //       resolve();
    //     })
    //   })
    // }
    /**

    /**
     * The main entry point for an app
     */
    public startApp(): void {}
    /**
     * This is called when there is a problem in the application that can't be recovered from
     * @param reason Initialization failure reason
     */
    public failApp(reason: string): void {
        console.warn(reason);
        var div = document.createElement('div');
        var h2 = document.createElement('h2');
        h2.innerHTML = 'Unable to Start Application';
        var p = document.createElement('p');
        p.innerText = reason;
        div.append(h2);
        div.appendChild(p);
        this.setAppElements(div);
    }
    /**
     * The main initialization routine.  This is invoked once the web page is initially loaded
     */
    public init(): void {
        let config: onshapeConfig = { myserver: this.myserver };

        // Parse query parameters
        let queryParameters = decodeURIComponent(window.location.search.substring(1));
        let qp = document.getElementById('qp');
        if (qp !== null) {
            qp.innerHTML = queryParameters;
        }
        let queryParametersArray = queryParameters.split('&');
        for (var i = 0; i < queryParametersArray.length; i++) {
            let idx = queryParametersArray[i].indexOf('=');
            let parm = queryParametersArray[i].substring(0, idx);
            let val = queryParametersArray[i].substring(idx + 1);
            config[parm] = val;
        }
        // Figure out where Onshape was loaded from
        const redirectURL =
            config['redirectOnshapeUri'] == '' ? undefined : config['redirectOnshapeUri'];
        if (redirectURL !== undefined) {
            window.location = redirectURL;
            return;
        }
        this.showInitializing();
        const url =
            window.location != window.parent.location
                ? document.referrer
                : document.location.href;
        // Use that URL to scrape out the CSS and patch our Iframe to use the same CSS
        this.insertOnshapeCSS(url).then((_result) => {
            //
            // Cache the ones we need to work with overall
            //
            this.documentId = config.documentId;
            this.elementId = config.elementId;
            this.workspaceId = config.workspaceId;
            this.server = config.server;
            //
            // Initialize the Onshape APIs
            //
            this.onshape = new OnshapeAPI(config);
            this.onshape
                .init()
                .then(() => {
                    this.initApp();
                })
                .catch((reason: string) => {
                    this.failApp(reason);
                });
        });
    }
}
