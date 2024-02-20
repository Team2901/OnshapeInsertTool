/**
 * Copyright (c) 2023 John Toebes, Chris Peratrovich
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

import { exists } from 'onshape-typescript-fetch/runtime';
import { OnshapeAPI } from './onshapeapi';
import {
    BTDocumentElementInfo,
    BTGlobalTreeNodeInfo,
    BTGlobalTreeNodeInfoFromJSONTyped,
    GetAssociativeDataWvmEnum,
    GetElementsInDocumentRequest,
    UploadFileCreateElementRequest,
} from 'onshape-typescript-fetch';
import { magicIconInfo } from './app';
import { OnshapeSVGIcon } from './onshape/svgicon';

const PREFERENCE_FILE_NAME = '⚙ Preferences ⚙';

export interface BTGlobalTreeProxyInfo extends BTGlobalTreeNodeInfo {
    // jsonType = 'proxy-library', 'proxy-folder', or 'proxy-element'
    wvm?: typeof GetAssociativeDataWvmEnum;
    wvmid?: string;
    elementId?: string;
}

export function BTGlobalTreeProxyInfoJSONTyped(
    json: any,
    ignoreDiscriminator: boolean
): BTGlobalTreeProxyInfo {
    if (json === undefined || json === null) {
        return json;
    }
    return {
        ...BTGlobalTreeNodeInfoFromJSONTyped(json, ignoreDiscriminator),
        wvm: !exists(json, 'wvm') ? undefined : json['wvm'],
        wvmid: !exists(json, 'wvmid') ? undefined : json['wvmid'],
        elementId: !exists(json, 'elementId') ? undefined : json['elementId'],
    };
}

export interface BTGlobalTreeNodeMagicDataInfo extends BTGlobalTreeNodeInfo {
    jsonType: string; //"document-summary-configured"
    configuration?: string;
}

export function BTGlobalTreeNodeMagicDataInfoJSONTyped(
    json: any,
    ignoreDiscriminator: boolean
): BTGlobalTreeNodeMagicDataInfo {
    if (json === undefined || json === null) {
        return json;
    }
    return {
        ...BTGlobalTreeProxyInfoJSONTyped(json, ignoreDiscriminator),
        jsonType: !exists(json, 'jsonType') ? undefined : json['jsonType'],
        configuration: !exists(json, 'configuration') ? undefined : json['configuration'],
    };
}

export class Preferences {
    /**
     * main.ts is the main entry point for running all the typescript client code
     */
    public onshape: OnshapeAPI;
    public userPreferencesInfo: BTGlobalTreeProxyInfo = undefined;
    public newUser: boolean = false;

    //magic nodes cache for getting by index
    magicNodes: { [name: string]: BTGlobalTreeNodeInfo[] } = {
        recentlyInserted: [],
        favorited: [],
        library: [],
        // globalLibraries: [],
    };

    magicTypeToBTGType: { [magicType: string]: string } = {
        recentlyInserted: 'recent',
        favorited: 'favorited',
        library: 'libraries',
        // globalLibraries: 'global_libraries',
    };

    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     */
    public constructor(onshape: OnshapeAPI) {
        this.onshape = onshape;
    }

    /**
     * Initialize the preferences API for an application named 'appName'
     */
    public initUserPreferences(appName: string): Promise<BTGlobalTreeProxyInfo> {
        // matches the app name.
        this.newUser = false;
        return new Promise((resolve, _reject) => {
            this.getPreferencesDoc()
                .then((res) => {
                    this.getAppElement(appName, this.userPreferencesInfo)
                        .then((res) => {
                            console.log(res);
                            resolve(this.userPreferencesInfo);
                        })
                        .catch((err) => {
                            console.log(err);
                            resolve(undefined);
                        });
                })
                .catch((err) => {
                    console.log(err);
                    resolve(undefined);
                });
        });
    }

    /**
     * Creates an empty JSON element stored in the user preferences with the given name.  If it already exists, it returns false (does not throw an exception).
     * @param name String for entry to be created, generally associated with the application name
     */
    public createCustom(
        name: string,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            /* Backward compatability from when this was needed for JsonPatch */
            this.setCustom(name, '', libInfo)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    /**
     * Stores the element as JSON in the preferences associated with the name.
     * If the element doesn’t exist in the preferences, it returns false (does not thrown an exception)
     * @param name Name of element to set
     * @param element Value to be stored into element
     */
    public setCustom(
        name: string,
        element: any,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getAppJson(libInfo)
                .then((res) => {
                    res[name] = element;
                    this.onshape.blobElementApi
                        .uploadFileUpdateElement({
                            encodedFilename: res['appName'],
                            did: libInfo.id,
                            wid: libInfo.wvmid,
                            eid: libInfo.elementId,

                            // HACK The API expects a Blob type, however if you pass it a blob it formats
                            // and POSTs it as a binary file no matter what. This needs to be passed as a string for
                            // the needs of the Preferences API.
                            file: JSON.stringify(res) as unknown as Blob,
                        })
                        .then((res2) => {
                            resolve(true);
                        })
                        .catch((err) => {
                            resolve(false);
                        });

                    resolve(true);
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    /**
     * Returns the element which was stored as a JSON object as an object.
     * If the element doesn’t exist the default value is returned.
     * @param name Name of element to retrieve
     * @param default_val Default value to return if the element wasn't already set
     */
    public getCustom(
        name: string,
        default_val: any,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<any> {
        return new Promise((resolve, _reject) => {
            this.getAppJson(libInfo)
                .then((res) => {
                    resolve(res[name]);
                })
                .catch((err) => {
                    console.log(err);
                    resolve(default_val);
                });
        });
    }

    /**
     * Retrieve the last location saved with setLastKnownLocation
     * @returns Saved Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public getLastKnownLocation(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('last_known_location', libInfo);
    }

    /**
     * Preserve the last location that we were at
     * @param location Location to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setLastKnownLocation(
        location: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return this.setBTGArray(libInfo, 'last_known_location', location);
    }

    /**
     * Set an arbitrary list of entries for the application to use as the home
     * @param items Array of items to store
     * @returns Success/failure indicator
     */
    public setHome(
        items: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return this.setBTGArray(libInfo, 'home', items);
    }

    /**
     * returns what was sent to setHome
     * @returns Array of BTGlobalTreeNodeInfo items previously stored (or [] if none had ever been stored)
     */
    public getHome(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('home', libInfo);
    }

    /**
     * Add an item to the list of the magicNodes type associated with the application.  Note that it only stores the limit amount if input
     * @param item Item to add to the insert list
     */
    public addMagicNode(
        item: BTGlobalTreeNodeMagicDataInfo,
        magicType: string,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo,
        limit?: number
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            const BTGType = this.magicTypeToBTGType[magicType];
            this.getAllOfMagicType(magicType).then((nodes: BTGlobalTreeNodeInfo[]) => {
                const newNodes: BTGlobalTreeNodeInfo[] = [];
                let node: BTGlobalTreeNodeMagicDataInfo;
                let duplicate: BTGlobalTreeNodeMagicDataInfo;
                //Iterate nodes and don't add duplicates to new list
                nodes.unshift(item);
                for (let i in nodes) {
                    node = nodes[i];
                    duplicate = newNodes.find(
                        (element: BTGlobalTreeNodeMagicDataInfo) => {
                            return (
                                element.id === node.id &&
                                element.configuration === node.configuration
                            );
                        }
                    );
                    if (duplicate === undefined) newNodes.push(node);
                }
                if (
                    limit !== undefined &&
                    limit !== null &&
                    limit > 0 &&
                    nodes.length >= limit
                )
                    newNodes.pop();
                this.setBTGArray(libInfo, BTGType, newNodes);
            });
            resolve(false);
        });
    }

    /**
     * Remove an item to the list of magicType associated with the application.
     * @param item Item to remove from the magicType list
     */
    public removeMagicNode(
        item: BTGlobalTreeNodeMagicDataInfo,
        magicType: string,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            const BTGType = this.magicTypeToBTGType[magicType];
            this.getAllOfMagicType(magicType, libInfo).then(
                (nodes: BTGlobalTreeNodeInfo[]) => {
                    const newNodes: BTGlobalTreeNodeInfo[] = [];
                    let node: BTGlobalTreeNodeMagicDataInfo;
                    //iterate over favorites list and add all the items that aren't like item
                    for (let i in nodes) {
                        node = nodes[i];
                        if (
                            node.id !== item.id ||
                            node.configuration !== item.configuration
                        ) {
                            newNodes.push(node);
                        }
                    }
                    this.setBTGArray(libInfo, BTGType, newNodes);
                }
            );
            resolve(false);
        });
    }

    public getAllOfMagicType(
        magicType: string,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        let BTType = this.magicTypeToBTGType[magicType];
        if (BTType === undefined || BTType === null)
            console.error(magicType + ' is not a valid magicType');
        return this.getBTGArray(BTType, libInfo);
    }

    /**
     *  Get a magictype by index.
     * @returns
     */
    public getMagicTypeByIndex(
        index: number,
        magicType: string,
        refreshNodeResults?: boolean,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise(async (resolve, reject) => {
            if (refreshNodeResults === true) {
                const result = await this.getAllOfMagicType(magicType, libInfo);
                if (result === undefined || result.length === 0) {
                    this.magicNodes[magicType] = [];
                    resolve(undefined);
                }
                this.magicNodes[magicType] = result;
            }
            const currentNodes = this.magicNodes[magicType];
            if (index >= currentNodes.length) {
                resolve(undefined);
            }
            resolve([currentNodes[index]]);
        });
    }
    /**
     *  Get a recently inserted item by index.
     * @returns
     */
    // public getRecentlyInsertedByIndex(
    //     index: number,
    //     refreshNodeResults?: boolean,
    //     libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    // ): Promise<Array<BTGlobalTreeNodeInfo>> {
    //     return new Promise(async (resolve, reject) => {
    //         if (refreshNodeResults === true) {
    //             const result = await this.getAllRecentlyInserted(libInfo);
    //             if (result === undefined || result.length === 0) {
    //                 this.magicNodes.recentlyInserted = [];
    //                 resolve(undefined);
    //             }
    //             this.magicNodes.recentlyInserted = result;
    //         }
    //         const currentNodes = this.magicNodes.recentlyInserted;
    //         if (index >= currentNodes.length) {
    //             resolve(undefined);
    //         }
    //         resolve([currentNodes[index]]);
    //     });
    // }

    // public getFavoritedByIndex(
    //     index: number,
    //     refreshNodeResults?: boolean,
    //     libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    // ): Promise<Array<BTGlobalTreeNodeInfo>> {
    //     return new Promise(async (resolve, reject) => {
    //         if (refreshNodeResults === true) {
    //             const result = await this.getAllFavorited(libInfo);
    //             if (result === undefined || result.length === 0) {
    //                 this.magicNodes.favorited = [];
    //                 resolve(undefined);
    //             }
    //             this.magicNodes.favorited = result;
    //         }
    //         const currentNodes = this.magicNodes.favorited;
    //         if (index >= currentNodes.length) {
    //             resolve(undefined);
    //         }
    //         resolve([currentNodes[index]]);
    //     });
    // }

    // public getLibraryByIndex(
    //     index: number,
    //     refreshNodeResults?: boolean,
    //     libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    // ): Promise<Array<BTGlobalTreeNodeInfo>> {
    //     return new Promise(async (resolve, reject) => {
    //         if (refreshNodeResults === true) {
    //             const result = await this.getAllLibraries(libInfo);
    //             if (result === undefined || result.length === 0) {
    //                 this.magicNodes.library = [];
    //                 resolve(undefined);
    //             }
    //             this.magicNodes.library = result;
    //         }
    //         const currentNodes = this.magicNodes.library;
    //         if (index >= currentNodes.length) {
    //             resolve(undefined);
    //         }
    //         resolve([currentNodes[index]]);
    //     });
    // }
    /**
     * 
     * @param libInfo library object with element id to save to
     * @param info object with {pref_name: array} for multiple entries
     */
    public setBTGArray(
        libInfo: BTGlobalTreeProxyInfo,
        info: { [pref_name: string]: BTGlobalTreeNodeInfo[] }
    ): Promise<boolean>;
    /**
     * 
     * @param libInfo library object with element id to save to
     * @param pref_name  key to save the array under
     * @param array Array to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setBTGArray(
        libInfo: BTGlobalTreeProxyInfo,
        pref_name: string,
        array: BTGlobalTreeNodeInfo[]
    ): Promise<boolean>;
    /**
     * @param libInfo library object with element id to save to
     * @param param2 key or info
     * @param param3 array or undefined
     */
    public setBTGArray(
        libInfo: BTGlobalTreeProxyInfo,
        param2: string | { [pref_name: string]: Array<BTGlobalTreeNodeInfo> },
        param3?: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        let info: { [pref_name: string]: Array<BTGlobalTreeNodeInfo> } = {};
        if (typeof param2 === 'string') {
            //param2 is 
            info[param2] = param3;
        } else {
            info = param2;
        }
        return new Promise((resolve, _reject) => {
            this.getAppJson(libInfo)
                .then((res) => {
                    let pref_name: string;
                    for (pref_name in info) {
                        res[pref_name] = info[pref_name];
                    }
                    this.onshape.blobElementApi
                        .uploadFileUpdateElement({
                            encodedFilename: res['appName'],
                            did: libInfo.id,
                            wid: libInfo.wvmid,
                            eid: libInfo.elementId,

                            // HACK The API expects a Blob type, however if you pass it a blob it formats
                            // and POSTs it as a binary file no matter what. This needs to be passed as a string for
                            // the needs of the Preferences API.
                            file: JSON.stringify(res) as unknown as Blob,
                        })
                        .then((res) => {
                            resolve(true);
                        })
                        .catch((err) => {
                            resolve(false);
                        });
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    public getBTGArray(
        pref_name: string,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>>;
    public getBTGArray(
        pref_name: Array<string>,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<{ [pref_name: string]: Array<BTGlobalTreeNodeInfo> }>;
    public getBTGArray(
        pref_name: string | Array<string>,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<
        Array<BTGlobalTreeNodeInfo> | { [pref_name: string]: Array<BTGlobalTreeNodeInfo> }
    > {
        return new Promise((resolve, _reject) => {
            this.getAppJson(libInfo)
                .then((res) => {
                    if (Array.isArray(pref_name)) {
                        const pref_names = pref_name;
                        let allResults: {
                            [pref_name: string]: Array<BTGlobalTreeNodeInfo>;
                        } = {};
                        for (let pref_name of pref_names) {
                            allResults[pref_name] = res[pref_name] || [];
                            // for (let btg_json of res[pref_name]) {
                            //     allResults[pref_name].push(
                            //         BTGlobalTreeNodeMagicDataInfoJSONTyped(
                            //             btg_json,
                            //             false
                            //         )
                            //     );
                            // }
                        }
                        resolve(allResults);
                    } else {
                        const result: Array<BTGlobalTreeNodeInfo> = res[pref_name] || [];
                        // for (let btg_json of res[pref_name]) {
                        //     result.push(
                        //         BTGlobalTreeNodeMagicDataInfoJSONTyped(btg_json, false)
                        //     );
                        // }
                        resolve(result);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    resolve([]);
                });
        });
    }

    /**
     * Returns the underlying JSON storage for this application.
     *
     * @param libinfo The BTGTree containing info about which blob element to pull from./
     */
    public getAppJson(libInfo: BTGlobalTreeProxyInfo): Promise<JSON> {
        return new Promise((resolve, _reject) => {
            if(libInfo.wvmid === undefined || libInfo.wvmid === null)return console.error("NO WVMID", libInfo)
            this.onshape.blobElementApi
                .downloadFileWorkspace({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wid: libInfo.wvmid,
                })
                .then((res) => {
                    const resJson: JSON = JSON.parse(String(res));
                    resolve(resJson);
                })
                .catch((err) => {
                    console.warn(err);
                    resolve({} as JSON);
                });
        });
    }

    //simple element caching, needs update when element is created
    private cachedElementsInDocument: { [did: string]: BTDocumentElementInfo[] } = {};

    private getElementsInDocument(
        requestParameters: GetElementsInDocumentRequest
    ): Promise<Array<BTDocumentElementInfo>> {
        return new Promise((resolve, reject) => {
            if (this.cachedElementsInDocument[requestParameters.did]) {
                resolve(this.cachedElementsInDocument[requestParameters.did]);
            } else {
                this.onshape.documentApi
                    .getElementsInDocument(requestParameters)
                    .then((res) => {
                        this.cachedElementsInDocument[requestParameters.did] = res;
                        resolve(res);
                    });
            }
        });
    }

    public getAppElement(
        appName: string,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.getElementsInDocument({
                did: libInfo.id,
                wvm: 'w',
                wvmid: libInfo.wvmid,
            })
                // this.onshape.documentApi
                //     .getElementsInDocument({
                //         did: libInfo.id,
                //         wvm: 'w',
                //         wvmid: libInfo.wvmid,
                //     })
                .then((res) => {
                    this.processAppElements(appName, res, libInfo)
                        .then((res) => {
                            resolve(res);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    console.log(err);
                    // console.log('STUFF THAT ERRORS', appName);
                    reject(err);
                });
        });
    }

    public processAppElements(
        appName: string,
        elements,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            let elem_found: Boolean = false;
            // console.log(elements.length);
            for (let element of elements) {
                if (element.name === appName && element.type === 'Blob') {
                    libInfo.elementId = element.id;
                    resolve(libInfo);
                    elem_found = true;
                }
            }

            if (!elem_found) {
                const str = JSON.stringify({ appName: appName });

                this.onshape.blobElementApi
                    .uploadFileCreateElement({
                        encodedFilename: appName,
                        did: libInfo.id,
                        wid: libInfo.wvmid,

                        // HACK The API expects a Blob type, however if you pass it a blob it formats
                        // and POSTs it as a binary file no matter what. This needs to be passed as a string for
                        // the needs of the Preferences API.
                        file: str as unknown as Blob,
                        storeInDocument: true,
                    })
                    .then((res) => {
                        libInfo.elementId = res.id;
                        this.cachedElementsInDocument = {}; //delete cache so next next it will be update
                        // console.log(/*'Created new app element since it did not exist.: ' +*/ appName);
                        resolve(libInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }

    /**
     * Retrieve the user preferences document which should be in the top level folder of Onshape
     * for this user.
     */
    public getPreferencesDoc(): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .search({
                    bTDocumentSearchParams: {
                        ownerId: this.onshape.userId,
                        limit: 100,
                        when: 'LATEST',
                        sortColumn: '',
                        sortOrder: '',
                        rawQuery: 'type:document name:⚙ Preferences ⚙',
                        documentFilter: 0,
                    },
                })
                .then((res) => {
                    this.getDocFromQuery(res).then((res2) => {
                        resolve(res2);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Retrieve the user preferences document which should be in the top level folder of Onshape
     * for this user. If the document does not exists, create the document for the user.
     */
    public getDocFromQuery(res): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                    { id: res.items[0].id, owner: res.items[0].owner },
                    true
                );

                this.onshape.documentApi
                    .getDocumentWorkspaces({ did: res.items[0].id })
                    .then((res) => {
                        this.userPreferencesInfo.wvmid = res[0].id;
                        this.userPreferencesInfo.wvm = GetAssociativeDataWvmEnum['w'];

                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                // The user preferences document does not exist, so make a new one and return the
                // BTG info for the newly created document.
                this.onshape.documentApi
                    .createDocument({
                        bTDocumentParams: {
                            ownerId: this.onshape.userId,
                            name: '⚙ Preferences ⚙',
                            description: 'Document used to store application preferences',
                        },
                    })
                    .then((res) => {
                        console.log(
                            'Created new preferences document since it did not exist.'
                        );
                        this.newUser = true;
                        this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                            {
                                id: res.id,
                                wvmid: res.defaultWorkspace.id,
                                wvm: GetAssociativeDataWvmEnum['w'],
                            },
                            true
                        );
                        resolve(this.userPreferencesInfo);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    }

    // /*********************************************************************************
    //  *                         PROXY LIBRARY/FOLDER ROUTINES                         *
    //  *********************************************************************************/
    // /**
    //  * Creates a proxy Library object as a real Onshape document in a given location.
    //  * Note that the parent must be a real Onshape folder location
    //  * @param parent Location in Onshape hierarchy to create the new folder object
    //  * @param name Name to associate with the library
    //  */
    // public createProxyLibrary(
    //     parent: BTGlobalTreeNodeInfo,
    //     name: string
    // ): Promise<BTGlobalTreeNodeInfo> {
    //     return new Promise((resolve, _reject) => {
    //          const result: BTGlobalTreeNodeInfo = {
    //              jsonType: 'proxy-library',
    //              name: name,
    //         };
    //         resolve(undefined);
    //     });
    // }
    // /**
    //  * Creates a proxy folder object inside a proxy library
    //  * Note that the parent must be a proxy-library type.  Entries return
    //  * @param parent Proxy Library object to contain the folder
    //  * @param name Name to associate with the folder
    //  * @returns BTGlobalTreeNodeInfo associated with the newly created entry
    //  */
    // public createProxyFolder(
    //     parent: BTGlobalTreeNodeInfo,
    //     name: string
    // ): Promise<BTGlobalTreeNodeInfo> {
    //     return new Promise((resolve, _reject) => {
    //         const result: BTGlobalTreeNodeInfo = {
    //             jsonType: 'proxy-foler',
    //             name: name,
    //         };
    //         resolve(undefined);
    //     });
    // }
    // // TODO: Do we need a setProxyMetaData/getProxyMetaData routine to store extra
    // //       information with the proxy library objects (such as owner, contact info, website...)
    // /**
    //  * Sets the metadata for a proxy item
    //  * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
    //  * @param metadata Arbitrary metadata to set
    //  */
    // public setProxyMetadata(
    //     entry: BTGlobalTreeNodeInfo,
    //     metadata: any
    // ): Promise<boolean> {
    //     return new Promise((resolve, _reject) => {
    //         resolve(false);
    //     });
    // }
    // /**
    //  * Retrieves the metadata for a proxy item
    //  * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
    //  * @returns Arbitrary metadata set with setProxyMetadata
    //  */
    // getProxyMetadata(entry: BTGlobalTreeNodeInfo): Promise<any> {
    //     return new Promise((resolve, _reject) => {
    //         resolve(undefined);
    //     });
    // }
    // /**
    //  * Set the content for a proxy library object
    //  * @param library Previously created proxy library object (created with createProxyLibrary)
    //  * @param entries Sorted array of BTGlobalTreeNodeInfo objects representing the contents of the library
    //  */
    // public setProxyLibrary(
    //     library: BTGlobalTreeNodeInfo,
    //     entries: Array<BTGlobalTreeNodeInfo>
    // ): Promise<boolean> {
    //     return new Promise((resolve, _reject) => {
    //         resolve(false);
    //     });
    // }
    // /**
    //  * Gets the contents of a proxy library object
    //  * @param library Previously created proxy library object (created with createProxyLibrary)
    //  * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy library
    //  */
    // public getProxyLibrary(
    //     library: BTGlobalTreeNodeInfo
    // ): Promise<Array<BTGlobalTreeNodeInfo>> {
    //     return new Promise((resolve, _reject) => {
    //         resolve([]);
    //     });
    // }
    // /**
    //  * Set the content for a proxy folder object
    //  * @param folder Previously created proxy folder object (created with createProxyFolder)
    //  * @param entries Sorted Array of BTGlobalTreeNodeInfo objects to store in the proxy folder
    //  * @returns Success/Failure
    //  */
    // public setProxyFolder(
    //     folder: BTGlobalTreeNodeInfo,
    //     entries: Array<BTGlobalTreeNodeInfo>
    // ): Promise<boolean> {
    //     return new Promise((resolve, _reject) => {
    //         resolve(false);
    //     });
    // }
    // /**
    //  * Get the content for a proxy folder object
    //  * @param folder Previously created proxy folder object (created with createProxyFolder)
    //  * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy folder
    //  */
    // public getProxyFolder(
    //     folder: BTGlobalTreeNodeInfo
    // ): Promise<Array<BTGlobalTreeNodeInfo>> {
    //     return new Promise((resolve, _reject) => {
    //         resolve([]);
    //     });
    // }
}
