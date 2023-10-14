import { BTGlobalTreeNodeInfo } from 'onshape-typescript-fetch/models/BTGlobalTreeNodeInfo';
import {
    BTGlobalTreeNodeMagicDataInfo,
    BTGlobalTreeProxyInfo,
    BTGlobalTreeProxyInfoJSONTyped,
    Preferences,
} from './preferences';
import { GetAssociativeDataWvmEnum } from 'onshape-typescript-fetch/apis/AppAssociativeDataApi';
import { OnshapeAPI } from './onshapeapi';
import {
    BTElementLibrarySummaryInfoFromJSON,
    BTFSValueUndefined2003FromJSON,
    BTLazilyParsedFeatureScript,
    PartNumberApi,
    ResolveReferencesWvmEnum,
} from 'onshape-typescript-fetch';

const SPECIALCHAR = '⏍';

export class Library extends Preferences {
    proxyChildrenName = SPECIALCHAR + 'children' + SPECIALCHAR;
    proxyDescendantName = SPECIALCHAR + 'descendant' + SPECIALCHAR;
    /**
     * Adds a document to a proxy library
     * @param node Document to add to proxy library
     * @param library Library (plain name) to add the document to
     */
    public addNodeToProxyLibrary(
        node: BTGlobalTreeNodeInfo,
        library: string,
        libraryId?: string
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyLibrary(library, libraryId).then((res) => {
                if (res !== undefined) {
                    const { contents, library } = res;
                    console.log('library contains when adding node', contents, node);
                    const newContents: BTGlobalTreeNodeMagicDataInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    let duplicate: BTGlobalTreeNodeMagicDataInfo;
                    //Iterate contents and don't add duplicates to new list
                    contents.unshift(node);
                    for (let i in contents) {
                        contentNode = contents[i];
                        duplicate = newContents.find(
                            (element: BTGlobalTreeNodeMagicDataInfo) => {
                                return (
                                    element.id === contentNode.id &&
                                    element.configuration === contentNode.configuration
                                );
                            }
                        );
                        console.log('Found duplicate: ', duplicate, contents, node);
                        if (duplicate === undefined) newContents.push(contentNode);
                    }
                    this.setProxyLibrary(library, newContents);
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    /**
     * Adds a document to a proxy library
     * @param node Document to add to proxy library
     * @param library Library to add the document to
     * @param folder Folder name to add the document to
     */
    public addNodeToProxyFolder(
        node: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeProxyInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyFolder(library, folder.id).then((contents) => {
                if (contents !== undefined) {
                    const newContents: BTGlobalTreeNodeMagicDataInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    let duplicate: BTGlobalTreeNodeMagicDataInfo;
                    //Iterate contents and don't add duplicates to new list
                    contents.unshift(node);
                    for (let i in contents) {
                        contentNode = contents[i];
                        duplicate = newContents.find(
                            (element: BTGlobalTreeNodeMagicDataInfo) => {
                                return (
                                    element.id === contentNode.id &&
                                    element.configuration === contentNode.configuration
                                );
                            }
                        );
                        if (duplicate === undefined) newContents.push(contentNode);
                    }
                    this.setProxyFolder(library, folder, newContents);
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    public removeNodeFromProxyLibrary(
        node: BTGlobalTreeNodeMagicDataInfo,
        library: string,
        libraryId?: string,
        skipUpdateDescendants?: boolean
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyLibrary(library, libraryId).then((res) => {
                if (res !== undefined) {
                    const { contents, library } = res;
                    const newContents: BTGlobalTreeNodeInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    //iterate over favorites list and add all the items that aren't like item
                    for (let i in contents) {
                        contentNode = contents[i];
                        if (
                            contentNode.id !== node.id ||
                            contentNode.configuration !== node.configuration
                        ) {
                            newContents.push(contentNode);
                        }
                    }
                    if (
                        node.jsonType === 'proxy-library' &&
                        skipUpdateDescendants !== true
                    ) {
                        this.updateLibraryDescendants(library, 1, [node]);
                    }
                    resolve(this.setProxyLibrary(library, newContents));
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    /**
     * Removes a node from a proxy library
     * @param node Document to add to proxy library
     * @param library Library to add the document to
     * @param folder Folder name to add the document to
     */
    public removeNodeFromProxyFolder(
        node: BTGlobalTreeNodeMagicDataInfo,
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeProxyInfo,
        skipUpdateDescendants?: boolean
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyFolder(library, folder.id).then((contents) => {
                if (contents !== undefined) {
                    console.log(contents);
                    const newContents: BTGlobalTreeNodeInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    //iterate over contents and add all the items that aren't like item
                    for (let i in contents) {
                        contentNode = contents[i];
                        if (
                            contentNode.id !== node.id ||
                            contentNode.configuration !== node.configuration
                        ) {
                            newContents.push(contentNode);
                        }
                    }

                    if (
                        node.jsonType === 'proxy-library' &&
                        skipUpdateDescendants !== true
                    ) {
                        this.updateLibraryDescendants(library, 1, [node]);
                    }
                    resolve(this.setProxyFolder(library, folder, newContents));
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    public updateLibraryDescendants(
        library: BTGlobalTreeProxyInfo,
        actionNumber: number,
        items: BTGlobalTreeProxyInfo[]
    ) {
        switch (actionNumber) {
            case 0: {
                //add document to descendants
                this.getBTGArray(this.proxyDescendantName, library).then(
                    (descendants) => {
                        const newDescendants: BTGlobalTreeNodeInfo[] = [];
                        let descendant: BTGlobalTreeNodeMagicDataInfo;
                        let duplicate: BTGlobalTreeNodeMagicDataInfo;
                        //Iterate favoriteList and don't add duplicates to new list
                        items.forEach((item) => {
                            descendants.unshift(item);
                        });
                        for (let i in descendants) {
                            descendant = descendants[i];
                            duplicate = newDescendants.find(
                                (element: BTGlobalTreeNodeMagicDataInfo) => {
                                    return (
                                        element.name === descendant.name // &&
                                        // element.projectId === descendant.projectId
                                    );
                                }
                            );
                            if (duplicate === undefined) newDescendants.push(descendant);
                        }
                        this.setBTGArray(
                            this.proxyDescendantName,
                            newDescendants,
                            library
                        );
                    }
                );
                break;
            }
            case 1: {
                //remove document from descendants
                this.getBTGArray(this.proxyDescendantName, library).then(
                    (descendants) => {
                        const newDescendants: BTGlobalTreeProxyInfo[] = [];
                        items.forEach((item) => {
                            for (let descendant of descendants) {
                                if (descendant.name !== item.name)
                                    newDescendants.push(descendant);
                            }
                        });
                        this.setBTGArray(
                            this.proxyDescendantName,
                            newDescendants,
                            library
                        );
                    }
                );
                break;
            }
        }
    }

    private cloneFolderIntoLibrary(
        folder: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeNodeInfo,
        parent?: BTGlobalTreeNodeInfo,
        isLibrary?: boolean,
        descendantArray?: BTGlobalTreeNodeInfo[]
    ) {
        console.log('cloning folder into library', arguments);
        return new Promise((resolve, reject) => {
            this.onshape.globalTreeNodesApi
                .globalTreeNodesFolderInsertables({
                    fid: folder.id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                .then((res) => {
                    //res.pathToRoot
                    //res.items
                    const promises = [];

                    const children = res.items;
                    const documentChildren = [];
                    const folderChildren = [];
                    children.forEach((child) => {
                        if (child.jsonType === 'document-summary') {
                            documentChildren.push(child);
                        } else if (child.jsonType === 'folder') {
                            folderChildren.push({
                                jsonType: 'proxy-folder',
                                name: child.name,
                                id: child.id,
                                isContainer: true,
                                projectId: library.id,
                            } as BTGlobalTreeNodeInfo);
                        }
                    });
                    console.log('children: ', children);
                    if (isLibrary === true) {
                        console.log('cloning children into library');
                        folderChildren.forEach((child) =>
                            promises.push(
                                this.cloneFolderIntoLibrary(
                                    child,
                                    library,
                                    undefined,
                                    false,
                                    descendantArray
                                )
                            )
                        );
                        promises.push(
                            this.setProxyLibrary(
                                library,
                                folderChildren.concat(documentChildren)
                            )
                        );
                        resolve(Promise.all(promises));
                    } else {
                        console.log('cloning children into folder');
                        this.createProxyFolder(
                            library,
                            folder,
                            parent,
                            folderChildren.concat(documentChildren),
                            true, //ADD STUFF IN THENEHENEJ CODE
                            true
                        ).then((proxyFolder: BTGlobalTreeNodeInfo) => {
                            descendantArray.push(proxyFolder);
                            console.log(proxyFolder, parent);
                            // if (parent !== undefined) {
                            //     console.log('parent', parent, children)
                            //     promises.push(
                            //         this.addNodeToProxyFolder(
                            //             proxyFolder,
                            //             library,
                            //             parent
                            //         )
                            //     );
                            // } else {
                            //     promises.push(
                            //         this.addNodeToProxyLibrary(
                            //             proxyFolder,
                            //             undefined,
                            //             library.id
                            //         )
                            //     );
                            // }
                            // this.setProxyFolder(library, proxyFolder, children);
                            folderChildren.forEach((child) =>
                                promises.push(
                                    this.cloneFolderIntoLibrary(
                                        child,
                                        library,
                                        proxyFolder,
                                        false,
                                        descendantArray
                                    )
                                )
                            );
                            resolve(Promise.all(promises));
                        });
                    }
                });
        });
    }

    public createLibraryFromFolder(
        folder: BTGlobalTreeNodeInfo
    ): Promise<BTGlobalTreeNodeInfo> {
        console.log('________________', folder);
        return new Promise((resolve, reject) => {
            this.createProxyLibrary(undefined, folder.name).then((library) => {
                if (library === undefined) resolve(this.createLibraryFromFolder(folder)); //try again, onshape should find the document now
                const descendantArray = [];
                this.cloneFolderIntoLibrary(
                    folder,
                    library,
                    undefined,
                    true,
                    descendantArray
                ).then(() => {
                    console.log('Library cloning finished');
                    this.setBTGArray(this.proxyDescendantName, descendantArray, library);
                    resolve(library);
                });
            });
        });
    }

    public cloneProxyLibrary(parentLibrary: BTGlobalTreeNodeInfo) {
        return new Promise<BTGlobalTreeNodeInfo>((resolve, reject) => {
            this.getProxyLibrary(undefined, parentLibrary.id).then((res) => {
                if (res.library !== undefined) {
                    parentLibrary = res.library;
                    console.log(parentLibrary);
                    this.onshape.documentApi
                        .copyWorkspace({
                            did: parentLibrary.id,
                            wid: parentLibrary['wvmid'], //might need to wrap this call in getProxyLibrary to make sure these properties exist
                            bTCopyDocumentParams: {
                                isPublic: false,
                                ownerId: this.onshape.userId,
                                newName: this.encodeLibraryName(
                                    'My ' + this.decodeLibraryName(parentLibrary.name)
                                ),
                            },
                        })
                        .then((res2) => {
                            this.getProxyLibrary(undefined, res2.newDocumentId).then(
                                (res3) => {
                                    const library = res3.library;
                                    // this.onshape.appElementApi.deleteAppElementContent({
                                    //   did:library.id,
                                    //   eid:library.elementId,
                                    //   wvm: 'w',
                                    //   wvmid: library.wvmid,
                                    //   sid: sd
                                    // })
                                    this.setBTGArray(
                                        this.proxyChildrenName,
                                        res.contents,
                                        library
                                    );
                                    this.getBTGArray(
                                        this.proxyDescendantName,
                                        parentLibrary
                                    ).then((descendants) => {
                                        this.setBTGArray(
                                            this.proxyDescendantName,
                                            descendants,
                                            library
                                        );
                                    });
                                    resolve(library);
                                }
                            );
                        });
                }
            });
        });
    }

    /*********************************************************************************
     *                         PROXY LIBRARY/FOLDER ROUTINES                         *
     *********************************************************************************/

    /**
     * Creates a proxy Library object as a real Onshape document in a given location.
     * Note that the parent must be a real Onshape folder location
     * @param parent Location in Onshape hierarchy to create the new folder object
     * @param name Name to associate with the library
     */
    public createProxyLibrary(
        parent: BTGlobalTreeNodeInfo,
        name: string
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, _reject) => {
            const libraryName = this.encodeLibraryName(name);
            this.getProxyLibrary(name).then((res) => {
                console.log(res);
                if (res === undefined) {
                    this.onshape.documentApi
                        .createDocument({
                            bTDocumentParams: {
                                ownerId: this.onshape.userId, //parent.id
                                name: libraryName,
                                description:
                                    'Document used to store ProxyLibrary ' + name,
                            },
                        })
                        .then((res2) => {
                            console.log('creating document yields', res2);
                            //NOT GOOD PRACTICE, but it takes onshape some time to make a file
                            setTimeout(() => {
                                this.getProxyLibrary(undefined, res2.id).then((res3) => {
                                    if (res3 === undefined) resolve(undefined);
                                    resolve(res3.library);
                                });
                            }, 5000);
                        });
                } else {
                    resolve(res.library);
                }
            });
        });
    }
    /**
     * Creates a proxy folder object inside a proxy library
     * Note that the parent must be a proxy-library type.  Entries return
     * @param library The library that the proxy folder is a descendant of
     * @param name Name to associate with the folder
     * @param parent Proxy Library object to contain the folder; will be library if undefined
     * @returns BTGlobalTreeNodeInfo associated with the newly created entry
     */
    public createProxyFolder(
        library: BTGlobalTreeProxyInfo,
        reference: BTGlobalTreeNodeInfo,
        parent?: BTGlobalTreeProxyInfo,
        contents?: BTGlobalTreeNodeInfo[],
        skipAddParent?: boolean,
        skipUpdateDescendants?: boolean
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const libraryName = this.decodeLibraryName(library.name) || library.name;
            const proxyFolder: BTGlobalTreeNodeInfo = {
                jsonType: 'proxy-folder',
                isContainer: true,
                id: reference.id || (parent || library).id + '.' + reference.name,
                name: reference.name,
                projectId: library.id, //This works for now, cheap fix
            };
            if (parent === undefined && skipAddParent !== true) {
                this.addNodeToProxyLibrary(proxyFolder, undefined, library.id);
            } else if (skipAddParent !== true) {
                proxyFolder.treeHref = parent.name; // This works for now, cheap fix
                this.addNodeToProxyFolder(proxyFolder, library, parent);
            }
            if (skipUpdateDescendants !== true)
                this.updateLibraryDescendants(library, 0, [proxyFolder]);
            if (contents !== undefined) {
                this.setProxyFolder(library, proxyFolder, contents).then(() => {
                    resolve(proxyFolder);
                });
            } else {
                resolve(proxyFolder);
            }
        });
    }
    // TODO: Do we need a setProxyMetaData/getProxyMetaData routine to store extra
    //       information with the proxy library objects (such as owner, contact info, website...)
    /**
     * Sets the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @param metadata Arbitrary metadata to set
     */
    public setProxyMetadata(
        entry: BTGlobalTreeNodeInfo,
        metadata: any
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Retrieves the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @returns Arbitrary metadata set with setProxyMetadata
     */
    getProxyMetadata(entry: BTGlobalTreeNodeInfo): Promise<any> {
        return new Promise((resolve, _reject) => {
            resolve(undefined);
        });
    }
    /**
     * Set the content for a proxy library object
     * @param library Previously created proxy library object (created with createProxyLibrary)
     * @param entries Sorted array of BTGlobalTreeNodeInfo objects representing the contents of the library
     */
    public setProxyLibrary(
        library: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        console.log('library set to : ', entries);
        return new Promise((resolve, _reject) => {
            console.log('-ElementID-', library['elementId']);
            console.trace();
            console.log(entries);
            console.log('_______');
            this.setBTGArray(this.proxyChildrenName, entries, library).then((res) => {
                resolve(res);
            });
        });
    }

    private getProxyLibraryFromDocuments(
        documents: Object,
        libraryName?: string,
        getDescendants?: boolean
    ): Promise<{
        contents: BTGlobalTreeNodeInfo[];
        library: BTGlobalTreeProxyInfo;
        descendants?: BTGlobalTreeNodeInfo[];
    }> {
        return new Promise((resolve, reject) => {
            if (documents['items'] && Array.isArray(documents['items'])) {
                documents['items'] = (
                    documents['items'] as Array<BTGlobalTreeNodeInfo>
                ).filter((document) => {
                    return document.name === this.encodeLibraryName(libraryName);
                });
            }
            this.getProxyDocumentFromQuery(documents).then(
                (library: BTGlobalTreeProxyInfo) => {
                    if (library === undefined) {
                        return resolve(undefined);
                    } else {
                        libraryName =
                            this.decodeLibraryName(library.name) || library.name;
                        console.log(library, libraryName);
                        this.getAppElement(library.id, library)
                            .then((res) => {
                                (getDescendants === true
                                    ? this.getBTGArray(
                                          [
                                              this.proxyChildrenName,
                                              this.proxyDescendantName,
                                          ],
                                          library
                                      )
                                    : this.getBTGArray(this.proxyChildrenName, library)
                                ).then(
                                    (
                                        res:
                                            | BTGlobalTreeNodeInfo[]
                                            | {
                                                  [
                                                      pref_name: string
                                                  ]: BTGlobalTreeNodeInfo[];
                                              }
                                    ) => {
                                        let contents: BTGlobalTreeNodeInfo[],
                                            descendants: BTGlobalTreeNodeInfo[];
                                        if (getDescendants) {
                                            contents = res[
                                                this.proxyChildrenName
                                            ] as BTGlobalTreeNodeInfo[];
                                            descendants = res[
                                                this.proxyDescendantName
                                            ] as BTGlobalTreeNodeInfo[];
                                        } else {
                                            contents = res as BTGlobalTreeNodeInfo[];
                                        }
                                        console.log(library, contents);
                                        library.jsonType = 'proxy-library';
                                        library.isContainer = true;
                                        library.name =
                                            this.encodeLibraryName(libraryName);
                                        resolve({ contents, library, descendants });
                                    }
                                );
                            })
                            .catch((err) => {
                                console.log(err);
                                resolve(undefined);
                            });
                    }
                }
            );
        });
    }
    /**
     * Gets the contents of a proxy library object
     * @param libraryName Name of proxy library (plain)
     * @param libraryId Id of proxy library, libraryName is ignored if libraryId is supplied
     * @returns An object containing the Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy library and the library node
     */
    public getProxyLibrary(
        libraryName: string,
        libraryId?: string,
        getDescendants?: boolean
    ): Promise<{
        contents: BTGlobalTreeNodeInfo[];
        library: BTGlobalTreeProxyInfo;
        descendants?: BTGlobalTreeNodeInfo[];
    }> {
        return new Promise((resolve, reject) => {
            console.log(libraryName, libraryId, this.encodeLibraryName(libraryName));
            if (libraryId !== undefined) {
                this.onshape.documentApi
                    .getDocument({ did: libraryId })
                    .then((library) => {
                        console.log(library);
                        resolve(
                            this.getProxyLibraryFromDocuments(
                                { items: [library] },
                                this.decodeLibraryName(library.name),
                                getDescendants
                            )
                        );
                    });
            } else {
                this.onshape.documentApi
                    .search({
                        bTDocumentSearchParams: {
                            ownerId: this.onshape.userId,
                            limit: 100,
                            when: 'LATEST',
                            sortColumn: '',
                            sortOrder: '',
                            rawQuery:
                                'type:document name:' +
                                this.encodeLibraryName(libraryName),
                            documentFilter: 0,
                        },
                    })
                    .then((res) => {
                        resolve(
                            this.getProxyLibraryFromDocuments(
                                res,
                                libraryName,
                                getDescendants
                            )
                        );
                    });
            }
        });
    }
    public getProxyDocumentFromQuery(res): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                const document = BTGlobalTreeProxyInfoJSONTyped(
                    { id: res.items[0].id, name: res.items[0].name },
                    true
                );
                console.log(document);

                this.onshape.documentApi
                    .getDocumentWorkspaces({ did: res.items[0].id })
                    .then((res) => {
                        console.log(res);
                        document.wvmid = res[0].id;
                        document.wvm = GetAssociativeDataWvmEnum['w'];

                        resolve(document);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                resolve(undefined);
            }
        });
    }
    /**
     * Set the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @param entries Sorted Array of BTGlobalTreeNodeInfo objects to store in the proxy folder
     * @returns Success/Failure
     */
    public setProxyFolder(
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            library = Object.assign({}, library);
            this.getAppElement(folder.id, library).then(
                (folderElement: BTGlobalTreeNodeInfo) => {
                    console.trace('Setting proxy folder');
                    console.log(
                        'Setting proxy folder',
                        folder,
                        folderElement,
                        library,
                        entries
                    );
                    console.log('FOLDER_EID_', folderElement['elementId']);
                    this.setBTGArray(this.proxyChildrenName, entries, folderElement).then(
                        (res) => {
                            resolve(res);
                        }
                    );
                }
            );
        });
    }
    /**
     * Get the content for a proxy folder object
     * @param library Library that the folder is a descendant of
     * @param folderId Id of proxy folder
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy folder
     */
    public getProxyFolder(
        library: BTGlobalTreeProxyInfo,
        folderId: string
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            this.getAppElement(folderId, library).then((folder: BTGlobalTreeNodeInfo) => {
                this.getBTGArray(this.proxyChildrenName, folder).then((res) => {
                    resolve(res);
                });
            });
        });
    }

    private encodeLibraryName(name: String) {
        return SPECIALCHAR + name + SPECIALCHAR;
    }
    public decodeLibraryName(libraryName: string) {
        const result = new RegExp(
            SPECIALCHAR + '([^' + SPECIALCHAR + ']+)' + SPECIALCHAR,
            'gm'
        ).exec(libraryName);
        if (result !== null) {
            return result[1];
        }
        return undefined;
    }
}
