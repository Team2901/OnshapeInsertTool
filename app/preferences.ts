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
    BTGlobalTreeNodeInfo,
    BTGlobalTreeNodeInfoFromJSONTyped,
    GetAssociativeDataWvmEnum,
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
        return new Promise((resolve, _reject) => {
            this.getPreferencesDoc()
                .then((res) => {
                    this.getAppElement(appName, this.userPreferencesInfo)
                        .then((res) => {
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
            this.existsEntry(name, libInfo)
                .then((res) => {
                    if (!res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "add", "path": "/${name}", "value": "" }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((create_res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                console.log(err);
                                resolve(false);
                            });
                    } else {
                        // The entry already existed!
                        resolve(false);
                    }
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
            this.existsEntry(name, libInfo)
                .then((res) => {
                    if (res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "replace", "path": "/${name}", "value": "${element}" }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    } else {
                        // The entry did not exist, it must be created first!
                        resolve(false);
                    }
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
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    resolve(res.tree[name]);
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
        console.log('-------', location);
        return this.setBTGArray('last_known_location', location, libInfo);
    }

    public translateHomeItemsToBTGlobalTreeNodeInfo(
      items: { [item: string]: magicIconInfo | BTGlobalTreeNodeInfo }
    ): Array<BTGlobalTreeNodeInfo>{
      const itemInfoArray: BTGlobalTreeNodeInfo[] = [];
      let itemInfo: magicIconInfo | BTGlobalTreeNodeInfo;
      for(let id in items){
        itemInfo = items[id];
        if(itemInfo['jsonType'] !== undefined && itemInfo['jsonType'] !== null)itemInfoArray.push(itemInfo as BTGlobalTreeNodeInfo)
        itemInfo = itemInfo as magicIconInfo;
        itemInfoArray.push({
          jsonType: "magicHome",
          id,
          name: itemInfo.label,
          description: itemInfo.icon
        })
      }
      return itemInfoArray
    }
    public translateHomeItemsFromBTGlobalTreeNodeInfo(
      items: Array<BTGlobalTreeNodeInfo>
    ): { [item: string]: magicIconInfo | BTGlobalTreeNodeInfo}{
      const homeObject: { [item: string]: magicIconInfo | BTGlobalTreeNodeInfo } = {};
      items.forEach((item)=>{
        if(item.jsonType === 'magicHome'){
          homeObject[item.id] = {
            label: item.name,
            icon: item.description as OnshapeSVGIcon
          }
        }else{
          homeObject[item.jsonType] = item;
        }
      })
      return homeObject;
    }
    /**
     * Adds an home item to the home menu
     * @param item item to add
     * @returns Success/failure indicator
     */
    public addHomeItem(
        item: BTGlobalTreeNodeInfo | magicIconInfo,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const BTItem = this.translateHomeItemsToBTGlobalTreeNodeInfo({" ":item})[0];
            this.getBTGArray('home', libInfo).then((homeList) => {
                const newHomeList: BTGlobalTreeNodeInfo[] = [];
                let homeItem: BTGlobalTreeNodeMagicDataInfo;
                let duplicate: BTGlobalTreeNodeMagicDataInfo;
                //Iterate favoriteList and don't add duplicates to new list
                homeList.unshift(BTItem);
                for (let i in homeList) {
                    homeItem = homeList[i];
                    duplicate = newHomeList.find(
                        (element: BTGlobalTreeNodeMagicDataInfo) => {
                            return (
                                element.id === homeItem.id &&
                                element.jsonType === homeItem.jsonType
                            );
                        }
                    );
                    if (duplicate === undefined) newHomeList.push(homeItem);
                }
                resolve(this.setHome(homeList));
            });
        });
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
        return this.setBTGArray('home', items, libInfo);
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
     * Add an item to the list of favorited items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public addFavorited(
        item: BTGlobalTreeNodeMagicDataInfo,
        limit: number = 50,
        name: string = 'favorited',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            console.log(item);
            this.getAllFavorited().then((favoriteList: BTGlobalTreeNodeInfo[]) => {
                const newFavoriteList: BTGlobalTreeNodeInfo[] = [];
                let favoriteItem: BTGlobalTreeNodeMagicDataInfo;
                let duplicate: BTGlobalTreeNodeMagicDataInfo;
                //Iterate favoriteList and don't add duplicates to new list
                favoriteList.unshift(item);
                for (let i in favoriteList) {
                    favoriteItem = favoriteList[i];
                    duplicate = newFavoriteList.find(
                        (element: BTGlobalTreeNodeMagicDataInfo) => {
                            return (
                                element.id === favoriteItem.id &&
                                element.configuration === favoriteItem.configuration
                            );
                        }
                    );
                    if (duplicate === undefined) newFavoriteList.push(favoriteItem);
                }
                if (favoriteList.length >= limit) newFavoriteList.pop(); //is this necessary?
                this.setBTGArray(name, newFavoriteList, libInfo);
            });
            resolve(false);
        });
    }

    /**
     * Add an item to the list of favorited items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public addLibrary(
        item: BTGlobalTreeNodeMagicDataInfo,
        limit: number = 50,
        name: string = 'libraries',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            console.log(item);
            this.getAllLibraries().then((libraryList: BTGlobalTreeNodeInfo[]) => {
                const newLibraryList: BTGlobalTreeNodeInfo[] = [];
                let libraryItem: BTGlobalTreeNodeMagicDataInfo;
                let duplicate: BTGlobalTreeNodeMagicDataInfo;
                //Iterate favoriteList and don't add duplicates to new list
                libraryList.unshift(item);
                for (let i in libraryList) {
                    libraryItem = libraryList[i];
                    duplicate = newLibraryList.find(
                        (element: BTGlobalTreeNodeMagicDataInfo) => {
                            return (
                                element.id === libraryItem.id &&
                                element.configuration === libraryItem.configuration
                            );
                        }
                    );
                    if (duplicate === undefined) newLibraryList.push(libraryItem);
                }
                if (libraryList.length >= limit) newLibraryList.pop(); //is this necessary?
                this.setBTGArray(name, newLibraryList, libInfo);
            });
            resolve(false);
        });
    }

    /**
     * Remove an item to the list of favorited items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public removeFavorited(
        item: BTGlobalTreeNodeMagicDataInfo,
        limit: number = 50,
        name: string = 'favorited',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            console.log(item);
            this.getAllFavorited().then((favoriteList: BTGlobalTreeNodeInfo[]) => {
                const newFavoriteList: BTGlobalTreeNodeInfo[] = [];
                let favoriteItem: BTGlobalTreeNodeMagicDataInfo;
                //iterate over favorites list and add all the items that aren't like item
                for (let i in favoriteList) {
                    favoriteItem = favoriteList[i];
                    if (
                        favoriteItem.id !== item.id ||
                        favoriteItem.configuration !== item.configuration
                    ) {
                        newFavoriteList.push(favoriteItem);
                    }
                }
                this.setBTGArray(name, newFavoriteList, libInfo);
            });
            resolve(false);
        });
    }
    /**
     * Remove an item to the list of favorited items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public removeLibrary(
        item: BTGlobalTreeNodeMagicDataInfo,
        limit: number = 50,
        name: string = 'libraries',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            console.log(item);
            this.getAllLibraries().then((libraryList: BTGlobalTreeNodeInfo[]) => {
                const newLibraryList: BTGlobalTreeNodeInfo[] = [];
                let libraryItem: BTGlobalTreeNodeMagicDataInfo;
                //iterate over favorites list and add all the items that aren't like item
                for (let i in libraryList) {
                    libraryItem = libraryList[i];
                    if (
                        libraryItem.id !== item.id ||
                        libraryItem.configuration !== item.configuration
                    ) {
                        newLibraryList.push(libraryItem);
                    }
                }
                this.setBTGArray(name, newLibraryList, libInfo);
            });
            resolve(false);
        });
    }
    /**
     * Add an item to the list of recently inserted items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public addRecentlyInserted(
        item: BTGlobalTreeNodeInfo,
        limit: number = 50,
        name: string = 'recent',
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            console.log(item);
            this.getAllRecentlyInserted().then((recentList: BTGlobalTreeNodeInfo[]) => {
                const newRecentList: BTGlobalTreeNodeInfo[] = [];
                let recentItem: BTGlobalTreeNodeMagicDataInfo;
                let duplicate: BTGlobalTreeNodeMagicDataInfo;
                //Iterate recentList and don't add duplicates to new list
                recentList.unshift(item);
                for (let i in recentList) {
                    recentItem = recentList[i];
                    duplicate = newRecentList.find(
                        (element: BTGlobalTreeNodeMagicDataInfo) => {
                            return (
                                element.id === recentItem.id &&
                                element.configuration === recentItem.configuration
                            ); //needs configurable check as well
                        }
                    );
                    if (duplicate === undefined) newRecentList.push(recentItem);
                }
                if (recentList.length >= limit) newRecentList.pop();
                this.setBTGArray(name, newRecentList, libInfo);
            });
            resolve(false);
        });
    }
    public getAllLibraries(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('libraries', libInfo);
    }

    public getAllFavorited(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('favorited', libInfo);
    }
    /**
     *  Last 50 entries sent to addRecentlyInserted sorted by date.
     * @returns
     */
    public getAllRecentlyInserted(
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return this.getBTGArray('recent', libInfo);
    }
    recentlyInsertedNodes: BTGlobalTreeNodeInfo[];
    /**
     *  Get a recently inserted item by index.
     * @returns
     */
    public getRecentlyInsertedByIndex(
        index: number,
        refreshNodeResults?: boolean,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise(async (resolve, reject) => {
            if (refreshNodeResults === true) {
                const result = await this.getAllRecentlyInserted(libInfo);
                if (result === undefined || result.length === 0) {
                    this.recentlyInsertedNodes = [];
                    resolve(undefined);
                }
                this.recentlyInsertedNodes = result;
            }
            const currentNodes = this.recentlyInsertedNodes;
            if (index >= currentNodes.length) {
                resolve(undefined);
            }
            resolve([currentNodes[index]]);
        });
    }

    favoritedNodes: BTGlobalTreeNodeInfo[];

    public getFavoritedByIndex(
        index: number,
        refreshNodeResults?: boolean,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise(async (resolve, reject) => {
            if (refreshNodeResults === true) {
                const result = await this.getAllFavorited(libInfo);
                if (result === undefined || result.length === 0) {
                    this.favoritedNodes = [];
                    resolve(undefined);
                }
                this.favoritedNodes = result;
            }
            const currentNodes = this.favoritedNodes;
            if (index >= currentNodes.length) {
                resolve(undefined);
            }
            resolve([currentNodes[index]]);
        });
    }

    libraryNodes: BTGlobalTreeNodeInfo[];

    public getLibraryByIndex(
        index: number,
        refreshNodeResults?: boolean,
        libInfo: BTGlobalTreeProxyInfo = this.userPreferencesInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise(async (resolve, reject) => {
            if (refreshNodeResults === true) {
                const result = await this.getAllLibraries(libInfo);
                if (result === undefined || result.length === 0) {
                    this.libraryNodes = [];
                    resolve(undefined);
                }
                this.libraryNodes = result;
            }
            const currentNodes = this.libraryNodes;
            if (index >= currentNodes.length) {
                resolve(undefined);
            }
            resolve([currentNodes[index]]);
        });
    }

    /**
     * @param array Array to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setBTGArray(
        pref_name: string,
        array: Array<BTGlobalTreeNodeInfo>,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.existsEntry(pref_name, libInfo)
                .then((res) => {
                    if (res) {
                        this.onshape.appElementApi
                            .updateAppElement({
                                bTAppElementUpdateParams: {
                                    jsonPatch: `[{ "op": "replace", "path": "/${pref_name}", "value": ${JSON.stringify(
                                        array
                                    )} }]`,
                                },
                                did: libInfo.id,
                                eid: libInfo.elementId,
                                wvmid: libInfo.wvmid,
                                wvm: 'w',
                            })
                            .then((res) => {
                                resolve(true);
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    } else {
                        // The entry did not exist, so create the entry then call this method again.
                        this.createCustom(pref_name, libInfo)
                            .then((res) => {
                                this.setBTGArray(pref_name, array, libInfo)
                                    .then((res2) => resolve(res2))
                                    .catch((err) => {
                                        resolve(false);
                                    });
                            })
                            .catch((err) => {
                                resolve(false);
                            });
                    }
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
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    console.log(res.tree);
                    console.log(pref_name);
                    if (Array.isArray(pref_name)) {
                        const pref_names = pref_name;
                        let allResults: {
                            [pref_name: string]: Array<BTGlobalTreeNodeInfo>;
                        } = {};
                        for (let pref_name of pref_names) {
                            allResults[pref_name] = [];
                            for (let btg_json of res.tree[pref_name]) {
                                allResults[pref_name].push(
                                    BTGlobalTreeNodeMagicDataInfoJSONTyped(
                                        btg_json,
                                        false
                                    )
                                );
                            }
                        }
                        console.log(allResults);
                        resolve(allResults);
                    } else {
                        const result: Array<BTGlobalTreeNodeInfo> = [];
                        pref_name = pref_name as string;
                        for (let btg_json of res.tree[pref_name]) {
                            console.log(pref_name);
                            result.push(
                                BTGlobalTreeNodeMagicDataInfoJSONTyped(btg_json, false)
                            );
                        }
                        console.log(result);
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
     * Returns if there already exists a preference JSON entry for 'name' in the user
     * preferences app element data.
     *
     * @param name Name of element to retrieve
     */
    public existsEntry(name: string, libInfo: BTGlobalTreeProxyInfo): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.onshape.appElementApi
                .getJson({
                    did: libInfo.id,
                    eid: libInfo.elementId,
                    wvmid: libInfo.wvmid,
                    wvm: 'w',
                })
                .then((res) => {
                    resolve(res.tree.hasOwnProperty(name));
                })
                .catch((err) => {
                    resolve(false);
                });
        });
    }

    public getAppElement(
        appName: string,
        libInfo: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .getElementsInDocument({
                    did: libInfo.id,
                    wvm: 'w',
                    wvmid: libInfo.wvmid,
                })
                .then((res) => {
                    this.processAppElements(appName, res, libInfo).then((res) => {
                        resolve(res);
                    });
                })
                .catch((err) => {
                    console.log(err);
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
            for (let element of elements) {
                if (
                    element.name == appName &&
                    element.dataType == 'onshape-app/preferences'
                ) {
                    libInfo.elementId = element.id;
                    resolve(libInfo);
                    elem_found = true;
                }
            }

            if (!elem_found) {
                this.onshape.appElementApi
                    .createElement({
                        bTAppElementParams: {
                            formatId: 'preferences',
                            name: appName,
                        },
                        did: libInfo.id,
                        wid: libInfo.wvmid,
                    })
                    .then((res) => {
                        libInfo.elementId = res.elementId;
                        console.log('Created new app element since it did not exist.');
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
                    { id: res.items[0].id },
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
                // The user preferences document did not exists, so make a new one and return the
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

                        this.userPreferencesInfo = BTGlobalTreeProxyInfoJSONTyped(
                            {
                                id: res.id,
                                wvmid: res.id,
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
    //         const result: BTGlobalTreeNodeInfo = {
    //             jsonType: 'proxy-library',
    //             name: name,
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
