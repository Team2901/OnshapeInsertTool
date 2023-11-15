import { BTGlobalTreeNodeInfo } from 'onshape-typescript-fetch/models/BTGlobalTreeNodeInfo';
import {
    BTGlobalTreeNodeMagicDataInfo,
    BTGlobalTreeProxyInfo,
    BTGlobalTreeProxyInfoJSONTyped,
    Preferences,
} from './preferences';
import { GetAssociativeDataWvmEnum } from 'onshape-typescript-fetch/apis/AppAssociativeDataApi';
import { TaskProcessingUnit } from './TaskProcessingUnit';

const SPECIALCHAR = '⏍';

interface deltaInfo {
    before: BTGlobalTreeNodeInfo;
    after: BTGlobalTreeNodeInfo;
}

export class Library extends Preferences {
    proxyChildrenName = SPECIALCHAR + 'children' + SPECIALCHAR;
    proxyDescendantName = SPECIALCHAR + 'descendant' + SPECIALCHAR;
    bookIconDocument: BTGlobalTreeProxyInfo = {
        jsonType: 'document-summary',
        name: 'Book Icon',
        id: 'c13874b1920731d0c83c9290',
        wvmid: 'bf9bdc1a95485ec1268f609f',
        elementId: '8fdec5ea579c5832541cf59d',
    };
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
                    // console.log('library contains when adding node', contents, node);
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
                        // console.log('Found duplicate: ', duplicate, contents, node);
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
                    resolve(true);
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
                    if (skipUpdateDescendants !== true) {
                        this.updateLibraryDescendants(library, 1, [node]);
                    }
                    this.setProxyLibrary(library, newContents);
                    resolve(true);
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

                    if (skipUpdateDescendants !== true) {
                        this.updateLibraryDescendants(library, 1, [node]);
                    }
                    this.setProxyFolder(library, folder, newContents);
                    resolve(true);
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
                        //Iterate descendants and don't add duplicates to new list
                        items.forEach((item) => {
                            descendants.unshift(item);
                        });
                        for (let i in descendants) {
                            descendant = descendants[i];
                            duplicate = newDescendants.find(
                                (element: BTGlobalTreeNodeMagicDataInfo) => {
                                    return (
                                        element.id === descendant.id // &&
                                        // element.projectId === descendant.projectId
                                    );
                                }
                            );
                            if (duplicate === undefined) newDescendants.push(descendant);
                        }
                        console.log(
                            'newdecendants',
                            newDescendants,
                            newDescendants.length
                        );
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
                                if (descendant.id !== item.id)
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
        isLibrary?: boolean,
        descendantArray?: BTGlobalTreeNodeInfo[],
        recurseOnFolder: Function = this.cloneFolderIntoLibrary
    ): Promise<void> {
        // console.log('cloning folder into library', arguments);
        // console.group();
        // console.trace();
        // console.groupEnd();
        return new Promise((resolve, reject) => {
            this.getAllGlobalTreeNodesFolderInsertables(folder.id)
                .then((res) => {
                    const children = res;
                    const documentChildren = [];
                    const folderChildren = [];
                    children.sort((child1, child2) =>
                        child1.name.localeCompare(child2.name)
                    );
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
                                owner: {
                                    id: this.onshape.userId,
                                },
                            } as BTGlobalTreeNodeInfo);
                        }
                    });
                    // console.log('children: ', children);
                    if (isLibrary === true) {
                        // console.log('cloning children into library');
                        folderChildren.forEach((child) => {
                            recurseOnFolder(child, library, false, descendantArray);
                        });
                        this.setProxyLibrary(
                            library,
                            folderChildren.concat(documentChildren)
                        ).then(() => {
                            resolve();
                        });
                    } else {
                        // console.log('cloning children into folder');
                        this.createProxyFolder(
                            library,
                            folder,
                            undefined,
                            folderChildren.concat(documentChildren),
                            true, //ADD STUFF IN THENEHENEJ CODE
                            true
                        ).then((proxyFolder: BTGlobalTreeNodeInfo) => {
                            descendantArray.push(proxyFolder);
                            folderChildren.forEach((child) => {
                                recurseOnFolder(child, library, false, descendantArray);
                            });
                            resolve();
                        });
                    }
                })
                .catch((err) => {
                    reject(err);
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
                this.cloneFolderIntoLibrary(folder, library, true, descendantArray).then(
                    () => {
                        console.log('Library cloning finished');
                        this.setBTGArray(
                            this.proxyDescendantName,
                            descendantArray,
                            library
                        );
                        resolve(library);
                    }
                );
            });
        });
    }

    public getAllGlobalTreeNodesFolderInsertables(
        id: string,
        addto?: BTGlobalTreeNodeInfo[],
        offset?: number
    ): Promise<BTGlobalTreeNodeInfo[]> {
        return new Promise((res, rej) => {
            offset = offset !== undefined && offset !== null ? offset : 0;
            this.onshape.globalTreeNodesApi
                .globalTreeNodesFolderInsertables({
                    fid: id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                    limit: 50,
                    offset: offset !== undefined ? offset : 0,
                })
                .then((res1) => {
                    if (res1.items && res1.items.length === 50) {
                        res(
                            this.getAllGlobalTreeNodesFolderInsertables(
                                id,
                                res1.items,
                                offset + 50
                            )
                        );
                    }
                    if (addto) {
                        res1.items.forEach((item) => addto.push(item));
                        res(addto);
                    }
                    res(res1.items);
                })
                .catch((err) => {
                    rej(err);
                });
        });
    }

    public cloneProxyLibrary(parentLibrary: BTGlobalTreeNodeInfo) {
        return new Promise<BTGlobalTreeNodeInfo>((resolve, reject) => {
            this.getProxyLibrary(undefined, parentLibrary.id).then((res) => {
                if (res.library !== undefined) {
                    parentLibrary = res.library;
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

    public createLibraryFromFolder2(
        folder: BTGlobalTreeNodeInfo
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            this.createProxyLibrary(undefined, folder.name).then((library) => {
                if (library === undefined) resolve(this.createLibraryFromFolder2(folder)); //try again, onshape should find the document now
                const TPU = new TaskProcessingUnit<
                    { folder: BTGlobalTreeNodeInfo; isLibrary: boolean },
                    {
                        library: BTGlobalTreeNodeInfo;
                        descendantArray: BTGlobalTreeNodeInfo[];
                    }
                >(5);
                TPU.setGlobalTaskInfo({ library, descendantArray: [] });
                TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
                    return new Promise((resolve2, reject2) => {
                        this.cloneFolderIntoLibrary(
                            taskInfo.folder,
                            globalTaskInfo.library,
                            taskInfo.isLibrary,
                            globalTaskInfo.descendantArray,
                            (folder: BTGlobalTreeNodeInfo) => {
                                // console.log('Adding task, info: ', folder);
                                addTask({ folder, isLibrary: false }); //isLibrary === true only for first taskInfo
                            }
                        )
                            .then(() => {
                                resolve2();
                            })
                            .catch((res) => {
                                //error can be in get app element too
                                console.log(
                                    '))SADO)ASDIA)SID)AISD',
                                    res,
                                    JSON.stringify(res)
                                );
                                console.log(res.name, res.response);
                                if (res.response && res.response.status === 500) {
                                    addTask({ folder, isLibrary: false });
                                }
                            });
                    });
                });
                TPU.addTask({
                    folder,
                    isLibrary: true,
                });
                TPU.runTasks().then(() => {
                    this.setBTGArray(
                        this.proxyDescendantName,
                        TPU.globalTaskInfo.descendantArray,
                        library
                    );
                    console.log(TPU.globalTaskInfo.descendantArray.length);
                    resolve(library);
                });
            });
        });
    }

    public refactorProxyLibrary2(library: BTGlobalTreeNodeInfo): Promise<void> {
        console.log('cloning refactoring', arguments);
        return new Promise((resolve, reject) => {
            const TPU = new TaskProcessingUnit<
                { folder: BTGlobalTreeNodeInfo },
                {
                    library: BTGlobalTreeNodeInfo;
                    descendantArray: BTGlobalTreeNodeInfo[];
                }
            >(5);
            TPU.setGlobalTaskInfo({ library, descendantArray: [] });
            TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
                return new Promise((resolve2, reject2) => {
                    this.refactorFolder(
                        taskInfo.folder,
                        globalTaskInfo.library,
                        globalTaskInfo.descendantArray,
                        (folder: BTGlobalTreeNodeInfo) => {
                            addTask({ folder });
                        }
                    ).then(() => {
                        resolve2();
                    });
                });
            });
            TPU.addTask({
                folder: library,
            });
            TPU.runTasks().then(() => {
                this.setBTGArray(
                    this.proxyDescendantName,
                    TPU.globalTaskInfo.descendantArray,
                    library
                );
                resolve();
            });
        });
    }

    // private cloneProxyLibrary2(){
    //   //create document
    //   //call update library descendants on it;
    // }

    public refactorFolder(
        folder: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeNodeInfo,
        descendantArray?: BTGlobalTreeNodeInfo[],
        recurseOnFolder: Function = this.refactorFolder
    ): Promise<void> {
        // console.log('cloning refactoring', arguments);
        return new Promise((resolve, reject) => {
            let getChildrenPromise: Promise<BTGlobalTreeNodeInfo[]>;
            if (folder === library) {
                //iterating library
                getChildrenPromise = new Promise(async (res, rej) => {
                    res((await this.getProxyLibrary(undefined, library.id)).contents);
                });
            } else {
                getChildrenPromise = this.getProxyFolder(library, folder.id);
            }
            getChildrenPromise
                .then((children) => {
                    if (children === undefined || children === null) {
                        console.log('))))))))(((((((((((((', folder);
                        return resolve(undefined);
                    }
                    // console.log('iterating folder ', folder, ' and children', children);
                    children.forEach((child) => {
                        if (child.jsonType === 'proxy-folder') {
                            descendantArray.push(child);
                            recurseOnFolder(child, library, descendantArray);
                        }
                    });
                    resolve();
                })
                .catch((res) => {
                    console.log('ERROR_____', res);
                    // recurseOnFolder(folder,library,descendantArray)
                });
        });
    }

    refactorLibrary(library: BTGlobalTreeNodeInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            this.getProxyLibrary(undefined, library.id).then((res) => {
                library = res.library;
                const descendantArray = [];
                this.refactorFolder(library, library, descendantArray).then(() => {
                    console.log(descendantArray);
                    this.setBTGArray(this.proxyDescendantName, descendantArray, library);
                    resolve();
                });
            });
        });
    }

    scanFolderDelta(
        folder: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeNodeInfo,
        deltaArray: deltaInfo[]
    ) {
        return new Promise((resolve, reject) => {
            let getChildrenPromise: Promise<BTGlobalTreeNodeInfo[]>;
            if (folder === library) {
                //iterating library
                getChildrenPromise = new Promise(async (res, rej) => {
                    res((await this.getProxyLibrary(undefined, library.id)).contents);
                });
            } else {
                getChildrenPromise = this.getProxyFolder(library, folder.id);
            }
            getChildrenPromise.then((children) => {
                if (children === undefined || children === null) {
                    return resolve(undefined);
                }
                const promises = [];
                console.log('iterating folder ', folder, ' and children', children);
                children.forEach((child) => {
                    if (child.jsonType === 'proxy-folder') {
                        this.scanFolderDelta(child, library, deltaArray);
                    }
                });
                resolve(Promise.all(promises));
            });
        });
    }

    scanLibraryDelta(library: BTGlobalTreeNodeInfo): Promise<Array<deltaInfo>> {
        return new Promise((resolve, reject) => {
            const deltaArray = [];
            this.scanFolderDelta(library, library, deltaArray).then(() => {
                resolve(deltaArray);
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
                if (res === undefined) {
                    this.onshape.documentApi
                        .copyWorkspace({
                            did: this.bookIconDocument.id,
                            wid: this.bookIconDocument['wvmid'], //might need to wrap this call in getProxyLibrary to make sure these properties exist
                            bTCopyDocumentParams: {
                                isPublic: false,
                                ownerId: this.onshape.userId, //pareFnt,
                                newName: this.encodeLibraryName(name),
                            },
                        })
                        .then((res2) => {
                            //NOT GOOD PRACTICE, but it takes onshape some time to make a file
                            setTimeout(() => {
                                this.getProxyLibrary(undefined, res2.newDocumentId).then(
                                    (res3) => {
                                        if (res3 === undefined) resolve(undefined);
                                        resolve(res3.library);
                                    }
                                );
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
                owner: {
                    id: this.onshape.userId,
                },
            };
            // console.log('proxy folder looking like ', proxyFolder);
            if (
                (parent === undefined || parent.id === library.id) &&
                skipAddParent !== true
            ) {
                this.addNodeToProxyLibrary(proxyFolder, undefined, library.id);
            } else if (parent !== undefined && skipAddParent !== true) {
                proxyFolder.treeHref = parent.id; // This works for now, cheap fix
                console.log('parent', parent);
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
        // console.log('library set to : ', entries);
        return new Promise((resolve, _reject) => {
            // console.log('-ElementID-', library['elementId']);
            // console.log('_______');
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
            if (libraryId !== undefined) {
                this.onshape.documentApi
                    .getDocument({ did: libraryId })
                    .then((library) => {
                        // console.log(library);
                        resolve(
                            this.getProxyLibraryFromDocuments(
                                { items: [library] },
                                this.decodeLibraryName(library.name),
                                getDescendants
                            )
                        );
                    })
                    .catch((err) => reject(err));
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
                    })
                    .catch((err) => reject(err));
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

                this.onshape.documentApi
                    .getDocumentWorkspaces({ did: res.items[0].id })
                    .then((res) => {
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
                    // console.log(
                    //     'Setting proxy folder',
                    //     folder,
                    //     folderElement,
                    //     library,
                    //     entries
                    // );
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
            library = Object.assign({}, library);
            this.getAppElement(folderId, library).then((folder: BTGlobalTreeNodeInfo) => {
                if (folder === undefined) resolve(undefined);
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
