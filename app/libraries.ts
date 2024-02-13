import { BTGlobalTreeNodeInfo } from 'onshape-typescript-fetch/models/BTGlobalTreeNodeInfo';
import {
    BTGlobalTreeNodeMagicDataInfo,
    BTGlobalTreeProxyInfo,
    BTGlobalTreeProxyInfoJSONTyped,
    Preferences,
} from './preferences';
import { GetAssociativeDataWvmEnum } from 'onshape-typescript-fetch/apis/AppAssociativeDataApi';
import { TaskProcessingUnit } from './TaskProcessingUnit';
import { InformationReporter } from './InformationReporter';

const SPECIALCHAR = '⏍';

interface deltaInfo {
    type: string;
    folder?: BTGlobalTreeNodeInfo;
    proxy?: BTGlobalTreeNodeInfo;
}

export class Library extends Preferences {
    proxyChildrenName = SPECIALCHAR + 'children' + SPECIALCHAR;
    proxyDescendantName = SPECIALCHAR + 'descendant' + SPECIALCHAR;
    proxyParentFolder = SPECIALCHAR + 'parentfolder' + SPECIALCHAR;
    rawLibraryName = "︴RAW DON'T RENAME︴";
    libraryDifferenceName = 'Library Difference(You can delete)';

    bookIconDocument: BTGlobalTreeProxyInfo = {
        jsonType: 'document-summary',
        name: 'Book Icon',
        id: 'c13874b1920731d0c83c9290',
        wvmid: 'bf9bdc1a95485ec1268f609f',
        elementId: '8fdec5ea579c5832541cf59d',
    };

    public addNodeToProxyArray(
        node: BTGlobalTreeNodeInfo,
        contents: BTGlobalTreeNodeInfo[]
    ) {
        const newContents: BTGlobalTreeNodeMagicDataInfo[] = [];
        let contentNode: BTGlobalTreeNodeMagicDataInfo;
        let duplicate: BTGlobalTreeNodeMagicDataInfo;
        //Iterate contents and don't add duplicates to new list
        contents.unshift(node);
        for (let i in contents) {
            contentNode = contents[i];
            duplicate = newContents.find((element: BTGlobalTreeNodeMagicDataInfo) => {
                return (
                    element.id === contentNode.id &&
                    element.configuration === contentNode.configuration
                );
            });
            if (duplicate === undefined) newContents.push(contentNode);
        }
        return newContents;
    }

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
                    const newContents = this.addNodeToProxyArray(node, contents);
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

    /**
     * Adds node to proxy library
     * If folder doesn't exist, it will make one with the node as the only child
     * @param node node to add to proxy library
     * @param library library to add node to
     * @param folder proxy folder to add the node to
     * @param childOfLibrary folder is a child of the library, default is false
     * @returns proxy folder that node was added to
     */
    public addNodeToProxySafe(
        node: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeProxyInfo,
        folder?: BTGlobalTreeProxyInfo,
        childOfLibrary: boolean = false
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            let getChildrenPromise: Promise<BTGlobalTreeNodeInfo[]>;
            if (childOfLibrary) {
                //iterating library
                getChildrenPromise = new Promise(async (res, rej) => {
                    const result = await this.getProxyLibrary(undefined, library.id);
                    if (result !== undefined && result !== null) {
                        res(result.contents);
                    } else {
                        res(undefined);
                    }
                });
            } else {
                getChildrenPromise = this.getProxyFolder(library, folder.id);
            }
            getChildrenPromise.then(async (children: BTGlobalTreeNodeInfo[]) => {
                if (children !== undefined && children !== null) {
                    const newChildren = this.addNodeToProxyArray(node, children);
                    if (childOfLibrary) {
                        return this.setProxyLibrary(library, newChildren);
                    }
                    return this.setProxyFolder(library, folder, newChildren);
                } else {
                    this.createProxyFolder(
                        library,
                        folder,
                        undefined,
                        [node],
                        true,
                        true
                    );
                }
            });
            if (childOfLibrary) {
                this.addNodeToProxyLibrary(node, undefined, library.id);
            }
            return this.addNodeToProxyFolder(node, library, folder);
        });
    }

    //should maybe return promise
    private sortProxies(
        proxyArray: BTGlobalTreeNodeInfo[],
        returnSegments?: boolean
    ):
        | BTGlobalTreeNodeInfo[]
        | {
              sorted: BTGlobalTreeNodeInfo[];
              documents: BTGlobalTreeNodeInfo[];
              folders: BTGlobalTreeNodeInfo[];
              configurables: BTGlobalTreeNodeInfo[];
          } {
        console.log(proxyArray);
        const documents = [] as BTGlobalTreeNodeInfo[];
        const folders = [] as BTGlobalTreeNodeInfo[];
        const configurables = [] as BTGlobalTreeNodeMagicDataInfo[];
        // const limit = 200;
        // const aboveLimit = [] as BTGlobalTreeNodeInfo[];

        // sort into folders and documents
        proxyArray.forEach((child: BTGlobalTreeNodeInfo) => {
            if (child.jsonType === 'document-summary') {
                documents.push(child);
                // if(child.configurationParameters !== undefined &&
                //   child.configurationParameters !== null)configurables.push(child)
            } else if (child.jsonType === 'proxy-folder') {
                folders.push(child);
            }
        });

        //sort alphabetically
        folders.sort((doc1, doc2) => doc1.name.localeCompare(doc2.name));

        //sort by links
        documents.forEach((doc) => {
            if (
                doc['numberOfTimesReferenced'] === null ||
                doc['numberOfTimesReferenced'] === undefined
            )
                console.log(doc + ' no references');
        });
        documents.sort((doc1: BTGlobalTreeNodeInfo, doc2: BTGlobalTreeNodeInfo) => {
            if (doc1['numberOfTimesReferenced'] === doc2['numberOfTimesReferenced'])
                return 0;
            return doc1['numberOfTimesReferenced'] < doc2['numberOfTimesReferenced']
                ? 1
                : -1;
        });
        const sorted = folders.concat(documents);
        if (returnSegments) {
            return { sorted, documents, folders, configurables };
        }
        return sorted;
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
                            library,
                            this.proxyDescendantName,
                            newDescendants
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
                            library,
                            this.proxyDescendantName,
                            newDescendants
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
        recurseOnFolder?: Function // = this.cloneFolderIntoLibrary
    ): Promise<void> {
        if (recurseOnFolder === undefined)
            recurseOnFolder = (
                folder: BTGlobalTreeNodeInfo,
                library: BTGlobalTreeNodeInfo,
                isLibrary?: boolean,
                descendantArray?: BTGlobalTreeNodeInfo[],
                recurseOnFolder?: Function
            ) =>
                this.cloneFolderIntoLibrary(
                    folder,
                    library,
                    isLibrary,
                    descendantArray,
                    recurseOnFolder
                );
        return new Promise((resolve, reject) => {
            this.getAllGlobalTreeNodesFolderInsertables(folder.id)
                .then((res) => {
                    const children = res as BTGlobalTreeNodeInfo[];

                    //change folders to proxy-folders
                    children.forEach((child, index) => {
                        if (child.jsonType === 'folder') {
                            children[index] = this.generateProxyFolderInfo(
                                child,
                                library
                            );
                        }
                    });

                    const { sorted, documents, folders, configurables } =
                        this.sortProxies(children, true) as {
                            sorted: BTGlobalTreeNodeInfo[];
                            documents: BTGlobalTreeNodeInfo[];
                            folders: BTGlobalTreeNodeInfo[];
                            configurables: BTGlobalTreeNodeInfo[];
                        };
                    // console.log(sorted);

                    if (isLibrary === true) {
                        // console.log('cloning children into library');
                        folders.forEach((child) => {
                            recurseOnFolder(child, library, false, descendantArray);
                        });
                        this.setProxyLibrary(library, sorted).then(() => {
                            resolve();
                        });
                    } else {
                        // console.log('cloning children into folder');
                        this.createProxyFolder(
                            library,
                            folder,
                            undefined,
                            sorted,
                            true, //ADD STUFF IN THENEHENEJ CODE
                            true
                        )
                            .then((proxyFolder: BTGlobalTreeNodeInfo) => {
                                if (descendantArray !== undefined)
                                    descendantArray.push(proxyFolder);
                                folders.forEach((child) => {
                                    recurseOnFolder(
                                        child,
                                        library,
                                        false,
                                        descendantArray
                                    );
                                });
                                resolve();
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    }
                })
                .catch((err) => {
                    reject(err);
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

    public cloneProxyLibrary(parentLibrary: BTGlobalTreeNodeInfo, name?: string) {
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
                                newName:
                                    (name !== undefined && name) ||
                                    this.encodeLibraryName(
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
                                    // const promises = [];
                                    // promises.push(
                                    // this.setProxyLibrary(library, res.contents)
                                    // );
                                    // promises.push(
                                    //     this.getBTGArray(
                                    //         this.proxyDescendantName,
                                    //         parentLibrary
                                    //     )
                                    // );
                                    // Promise.all(promises).then((res) => {
                                    //     const descendants = res[1];
                                    //     this.setBTGArray(
                                    //         library,
                                    //         this.proxyDescendantName,
                                    //         descendants
                                    //     ).then(() => {
                                    //         resolve(library);
                                    //     });
                                    // });
                                    this.getBTGArray(
                                        this.proxyDescendantName,
                                        parentLibrary
                                    ).then((descendants) => {
                                        const info: {
                                            [
                                                pref_name: string
                                            ]: Array<BTGlobalTreeNodeInfo>;
                                        } = {};
                                        info[this.proxyDescendantName] = descendants;
                                        info[this.proxyChildrenName] = res.contents;
                                        this.setBTGArray(library, info);
                                        resolve(library);
                                    });
                                }
                            );
                        });
                }
            });
        });
    }

    /**
     *
     * @param library library chain is in
     * @param pathsToRoot array of folder references, in order child, parent
     * @returns array of proxy folders, in order child, parent
     */
    public createProxyFolderPathsToRoot(
        library: BTGlobalTreeNodeInfo,
        pathsToRoot: string[][]
    ): Promise<BTGlobalTreeNodeInfo[]> {
        return new Promise((resolve, reject) => {
            const folderInfo: { [id: string]: [] } = {};

            pathsToRoot.forEach((pathToRoot: string[]) => {});

            const TPU = new TaskProcessingUnit<
                {
                    reference: BTGlobalTreeNodeInfo;
                    contents: BTGlobalTreeNodeInfo[];
                    childOfLibrary: boolean;
                    chainStart?: boolean;
                },
                {
                    library: BTGlobalTreeNodeInfo;
                    folderChain: BTGlobalTreeNodeInfo[];
                }
            >(6);

            TPU.setGlobalTaskInfo({
                library,
                folderChain: [] as unknown as BTGlobalTreeNodeInfo[],
            });
            TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
                return new Promise((res, rej) => {
                    if (taskInfo.chainStart) {
                        if (taskInfo.childOfLibrary) {
                            this.setProxyLibrary(
                                globalTaskInfo.library,
                                taskInfo.contents
                            ).then(() => res());
                        } else {
                            this.createProxyFolder(
                                globalTaskInfo.library,
                                taskInfo.reference,
                                undefined,
                                taskInfo.contents,
                                true,
                                true
                            ).then(() => res());
                        }
                    }
                    this.addNodeToProxySafe(
                        taskInfo.contents[0],
                        globalTaskInfo.library,
                        taskInfo.reference,
                        taskInfo.childOfLibrary
                    ).then((folder) => {
                        if (folder !== undefined && folder !== null) {
                            globalTaskInfo.folderChain.push(folder);
                        }
                        res();
                    });
                });
            });
            // chain.forEach((folder, index) => {
            //     let contents: BTGlobalTreeNodeInfo[] = undefined;
            //     let childOfLibrary = false;
            //     if (index === 0) {
            //         contents = children;
            //     } else if (index < chain.length - 1) {
            //         contents = [chain[index + 1]];
            //     } else {
            //         childOfLibrary = true;
            //     }
            //     TPU.addTask({ reference: folder, contents, childOfLibrary });

            //     this.createProxyFolder(library, folder);
            // });
            TPU.runTasks().then(() => {
                resolve(TPU.globalTaskInfo.folderChain);
            });
        });
    }

    //   /**
    //    *
    //    * @param library library chain is in
    //    * @param chain array of folder references, in order child, parent
    //    * @returns array of proxy folders, in order child, parent
    //    */
    //   public createProxyFolderPathsToRoot(
    //       library: BTGlobalTreeNodeInfo,
    //       chain: BTGlobalTreeNodeInfo[],
    //       children: BTGlobalTreeNodeInfo[]
    //   ): Promise<BTGlobalTreeNodeInfo[]> {
    //       return new Promise((resolve, reject) => {
    //           const TPU = new TaskProcessingUnit<
    //               {
    //                   reference: BTGlobalTreeNodeInfo;
    //                   contents: BTGlobalTreeNodeInfo[];
    //                   childOfLibrary: boolean;
    //                   chainStart?: boolean;
    //               },
    //               {
    //                   library: BTGlobalTreeNodeInfo;
    //                   folderChain: BTGlobalTreeNodeInfo[];
    //               }
    //           >(6);

    //           TPU.setGlobalTaskInfo({
    //               library,
    //               folderChain: [] as unknown as BTGlobalTreeNodeInfo[],
    //           });
    //           TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
    //               return new Promise((res, rej) => {
    //                   if (taskInfo.chainStart) {
    //                       if (taskInfo.childOfLibrary) {
    //                           this.setProxyLibrary(
    //                               globalTaskInfo.library,
    //                               taskInfo.contents
    //                           ).then(() => res());
    //                       } else {
    //                           this.createProxyFolder(
    //                               globalTaskInfo.library,
    //                               taskInfo.reference,
    //                               undefined,
    //                               taskInfo.contents,
    //                               true,
    //                               true
    //                           ).then(() => res());
    //                       }
    //                   }
    //                   this.addNodeToProxySafe(
    //                       taskInfo.contents[0],
    //                       globalTaskInfo.library,
    //                       taskInfo.reference,
    //                       taskInfo.childOfLibrary
    //                   ).then((folder) => {
    //                       if (folder !== undefined && folder !== null) {
    //                           globalTaskInfo.folderChain.push(folder);
    //                       }
    //                       res();
    //                   });
    //               });
    //           });
    //           chain.forEach((folder, index) => {
    //               let contents: BTGlobalTreeNodeInfo[] = undefined;
    //               let childOfLibrary = false;
    //               if (index === 0) {
    //                   contents = children;
    //               } else if (index < chain.length - 1) {
    //                   contents = [chain[index + 1]];
    //               } else {
    //                   childOfLibrary = true;
    //               }
    //               TPU.addTask({ reference: folder, contents, childOfLibrary });

    //               this.createProxyFolder(library, folder);
    //           });
    //           TPU.runTasks().then(() => {
    //               resolve(TPU.globalTaskInfo.folderChain);
    //           });
    //       });
    //   }

    //create proxy library from folder
    //duplicate proxy library and rename library_raw for deltas
    public createLibraryFromFolder(
        folder: BTGlobalTreeNodeInfo,
        infoRep?: InformationReporter<{
            pfolders: number;
            tfolders: number;
            status?: string;
        }>
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            this.createProxyLibrary(undefined, folder.name).then((library) => {
                if (library === undefined) resolve(this.createLibraryFromFolder(folder)); //try again, onshape should find the document now
                const TPU = new TaskProcessingUnit<
                    { folder: BTGlobalTreeNodeInfo; isLibrary: boolean },
                    {
                        library: BTGlobalTreeNodeInfo;
                        descendantArray: BTGlobalTreeNodeInfo[];
                    }
                >(16);
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
                                infoRep.incrementNumber('tfolders', 1);
                                addTask({ folder, isLibrary: false }); //isLibrary === true only for first taskInfo
                            }
                        )
                            .then(() => {
                                infoRep.incrementNumber('pfolders', 1);
                                resolve2();
                            })
                            .catch((err) => {
                                //error can be in get app element too
                                // console.groupCollapsed();
                                // console.log('__', err, JSON.stringify(err));
                                // console.log(err.name, err.response, err.message);
                                // console.groupEnd();
                                if (
                                    (err.response && err.response.status === 500) ||
                                    err.name === 'SyntaxError'
                                ) {
                                    console.log('Task Added Again');
                                    addTask(taskInfo);
                                } else {
                                    console.warn('Critical Request Error', err);
                                }
                                // console.log(TPU);
                                resolve2();
                            });
                    });
                });
                TPU.addTask({
                    folder,
                    isLibrary: true,
                });
                // console.log(window);
                // window['TPU'] = TPU;
                const startTime = Date.now();
                infoRep.setString('status', 'Copy files');
                TPU.runTasks().then(() => {
                    infoRep.setString('status', 'Creating raw library');
                    this.setBTGArray(library, {
                        [this.proxyDescendantName]: TPU.globalTaskInfo.descendantArray,
                        [this.proxyParentFolder]: [folder],
                    });
                    library.resourceType = folder.id;
                    console.log(TPU.globalTaskInfo.descendantArray);
                    console.log(TPU.globalTaskInfo.descendantArray.length);
                    console.log((Date.now() - startTime) / 1000);
                    this.cloneProxyLibrary(
                        library,
                        this.encodeLibraryName(folder.name, true)
                    ).then((libraryRaw) => {
                        resolve(library);
                    });
                });
            });
        });
    }

    public refactorProxyLibrary(library: BTGlobalTreeNodeInfo): Promise<void> {
        console.log('cloning refactoring', arguments);
        return new Promise((resolve, reject) => {
            const TPU = new TaskProcessingUnit<
                { folder: BTGlobalTreeNodeInfo },
                {
                    library: BTGlobalTreeNodeInfo;
                    descendantArray: BTGlobalTreeNodeInfo[];
                }
            >(200);
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
                    )
                        .then(() => {
                            resolve2();
                        })
                        .catch((err) => {
                            console.groupCollapsed();
                            console.log('__', err, JSON.stringify(err));
                            console.log(err.name, err.response, err.message);
                            console.groupEnd();
                            if (
                                (err.response && err.response.status === 500) ||
                                err.name === 'SyntaxError'
                            ) {
                                console.log('Task Added Again');
                                addTask(taskInfo);
                            }
                            resolve2();
                        });
                });
            });
            TPU.addTask({
                folder: library,
            });
            TPU.runTasks().then(() => {
                this.setBTGArray(
                    library,
                    this.proxyDescendantName,
                    TPU.globalTaskInfo.descendantArray
                );
                console.log(TPU.globalTaskInfo.descendantArray);
                console.log(TPU.globalTaskInfo.descendantArray.length + ' descendants');
                resolve();
            });
        });
    }

    //compare library to library_raw
    //find additions, create library_diff with additions
    public scanLibraryDelta(
        library: BTGlobalTreeNodeInfo
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            console.log('_____________', library);
            const promises = [];
            promises.push(this.createProxyLibrary(undefined, library.name, true));
            promises.push(
                this.createProxyLibrary(
                    undefined,
                    library.name + this.libraryDifferenceName
                )
            );
            Promise.all(promises).then((res) => {
                if (res[0] === undefined || res[1] === undefined) resolve(undefined);
                const rawLibrary = res[0];
                const deltaLibrary = res[1];
                const TPU = new TaskProcessingUnit<
                    { folder: BTGlobalTreeNodeInfo; isLibrary?: boolean },
                    {
                        library: BTGlobalTreeNodeInfo;
                        deltaLibrary: BTGlobalTreeNodeInfo;
                        indexedFoldersInfo: {
                            [id: string]: {
                                folder: BTGlobalTreeNodeInfo;
                                children: BTGlobalTreeNodeInfo[];
                            };
                        };
                    }
                >(16);
                TPU.setGlobalTaskInfo({
                    library: rawLibrary,
                    deltaLibrary,
                    indexedFoldersInfo: {},
                });
                TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
                    return new Promise((resolve2, reject2) => {
                        this.scanFolderDelta(
                            taskInfo.folder,
                            globalTaskInfo.library,
                            globalTaskInfo.deltaLibrary,
                            (folder: BTGlobalTreeNodeInfo) => {
                                addTask({ folder });
                            },
                            taskInfo.isLibrary ? true : false
                        )
                            .then(
                                (indexedFolderInfo: {
                                    folder: BTGlobalTreeNodeInfo;
                                    children: BTGlobalTreeNodeInfo[];
                                }) => {
                                    if (indexedFolderInfo !== undefined) {
                                        const { folder, children } = indexedFolderInfo;
                                        if (
                                            globalTaskInfo.indexedFoldersInfo[
                                                folder.id
                                            ] === undefined ||
                                            globalTaskInfo.indexedFoldersInfo[
                                                folder.id
                                            ] === null
                                        ) {
                                            globalTaskInfo.indexedFoldersInfo[folder.id] =
                                                indexedFolderInfo;
                                        } else {
                                            globalTaskInfo.indexedFoldersInfo[
                                                folder.id
                                            ].children = children.concat(
                                                globalTaskInfo.indexedFoldersInfo[
                                                    folder.id
                                                ].children
                                            );
                                        }
                                    }

                                    resolve2();
                                }
                            )
                            .catch((err) => {
                                console.groupCollapsed();
                                console.log('__', err, JSON.stringify(err));
                                console.log(err.name, err.response, err.message);
                                console.groupEnd();
                                if (
                                    (err.response && err.response.status === 500) ||
                                    err.name === 'SyntaxError'
                                ) {
                                    console.log('Task Added Again');
                                    addTask(taskInfo);
                                }
                                resolve2();
                            });
                    });
                });
                const folder = Object.assign({}, library);
                let validateParentFolder = () => new Promise<void>((res) => res());
                if (folder.resourceType === undefined) {
                    validateParentFolder = () =>
                        new Promise<void>(() => {
                            this.getBTGArray(this.proxyParentFolder, folder).then(
                                (res) => {
                                    if (res === undefined || res[0] === undefined)
                                        return reject(
                                            'Library parent folder info does not exist'
                                        );
                                    folder.resourceType = res[0].id;
                                }
                            );
                        });
                }
                validateParentFolder().then(() => {
                    TPU.addTask({
                        folder: library,
                        isLibrary: true,
                    });
                    TPU.runTasks().then(() => {
                        const indexedFoldersInfo = TPU.globalTaskInfo.indexedFoldersInfo;

                        if (Object.keys(indexedFoldersInfo).length === 0) {
                            console.log('No difference', TPU);
                            resolve(deltaLibrary); //no difference?
                        }
                        let additions = [];
                        let info: {
                            folder: BTGlobalTreeNodeInfo;
                            children: BTGlobalTreeNodeInfo[];
                        };
                        for (let id in indexedFoldersInfo) {
                            info = indexedFoldersInfo[id];
                            additions = additions.concat(info.children);
                        }
                        this.setProxyLibrary(deltaLibrary, additions).then(() => {
                            resolve(deltaLibrary);
                        });
                        //createpathstoroot
                        //sort into {[id:string]:[/*children*/]}
                        //joing children if object[id] already exists
                    });
                });
            });
        });
    }

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
                    // console.log('ERROR_____', res);
                    // recurseOnFolder(folder,library,descendantArray)
                    reject(res);
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
                    this.setBTGArray(library, this.proxyDescendantName, descendantArray);
                    resolve();
                });
            });
        });
    }

    public scanFolderDelta(
        folder: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeNodeInfo,
        deltaLibrary: BTGlobalTreeNodeInfo,
        recurseOnFolder: Function = this.scanFolderDelta,
        isLibrary?: boolean
    ): Promise<{ folder: BTGlobalTreeNodeInfo; children: BTGlobalTreeNodeInfo[] }> {
        return new Promise((resolve, reject) => {
            let promises: Promise<BTGlobalTreeNodeInfo[]>[] = [];
            if (folder === library) {
                //iterating library
                promises.push(
                    new Promise(async (res, rej) => {
                        res((await this.getProxyLibrary(undefined, library.id)).contents);
                    })
                );
            } else {
                promises.push(this.getProxyFolder(library, folder.id));
            }
            let folderId: string = folder.id;
            if (isLibrary === true) folderId = folder.resourceType;
            promises.push(this.getAllGlobalTreeNodesFolderInsertables(folderId));
            Promise.all(promises)
                .then((res) => {
                    console.log(res);
                    const proxyChildren = res[0];
                    const folderChildren = res[1];
                    if (
                        proxyChildren === undefined ||
                        proxyChildren === null ||
                        folderChildren === undefined ||
                        folderChildren === null
                    ) {
                        return resolve(undefined);
                    }
                    const additions: BTGlobalTreeNodeInfo[] = [];
                    console.log("_____")
                    console.log(proxyChildren, folderChildren);

                    const proxyMap: { [id: string]: BTGlobalTreeNodeInfo } = {};
                    proxyChildren.forEach((child) => (proxyMap[child.id] = child));
                    console.log(proxyMap)
                    let searchedChild: BTGlobalTreeNodeInfo;
                    folderChildren.forEach((child) => {
                        searchedChild = proxyMap[child.id];
                        if (searchedChild === undefined || searchedChild === null) {
                            if (child.jsonType === 'folder') {
                                additions.push(
                                    this.generateProxyFolderInfo(child, deltaLibrary)
                                );
                                this.cloneFolderIntoLibrary(child, deltaLibrary, false);
                                delete proxyMap[child.id];
                            } else if (child.jsonType === 'document-summary') {
                                additions.push(child);
                            }
                        }
                    });
                    console.log(additions)
                    const indexedFolderInfo: {
                        folder: BTGlobalTreeNodeInfo;
                        children: BTGlobalTreeNodeInfo[];
                    } = {
                        folder,
                        children: proxyChildren,
                    };
                    console.log(proxyMap);
                    Object.values(proxyMap).forEach((child) => {
                        if (child.jsonType === 'proxy-folder') {
                            recurseOnFolder(child);
                        }
                    });
                    if (additions.length === 0) resolve(undefined);

                    this.setProxyFolder(deltaLibrary, folder, additions).then(() => {
                        resolve(indexedFolderInfo);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    public applyFolderDelta(deltaArray: deltaInfo[], library: BTGlobalTreeNodeInfo) {
        deltaArray.forEach((delta) => {
            if (delta.type === 'proxy-void') {
                // check if parent is library
                //add node to proxy library
                //add node to proxy folder
            }
        });
    }

    // scanLibraryDelta(library: BTGlobalTreeNodeInfo): Promise<Array<deltaInfo>> {
    //     return new Promise((resolve, reject) => {
    //         const deltaArray = [];
    //         this.scanFolderDelta(library, library, deltaArray).then(() => {
    //             resolve(deltaArray);
    //         });
    //     });
    // }

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
        name: string,
        rawLibrary: boolean = false
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, _reject) => {
            //get library name with symbols
            const libraryName = this.encodeLibraryName(name, rawLibrary);
            let accessorName = libraryName;
            //get raw library name without symbols but with raw warning
            if (rawLibrary) accessorName = this.decodeLibraryName(libraryName);
            this.getProxyLibrary(accessorName).then((res) => {
                if (res === undefined) {
                    this.onshape.documentApi
                        .copyWorkspace({
                            did: this.bookIconDocument.id,
                            wid: this.bookIconDocument['wvmid'], //might need to wrap this call in getProxyLibrary to make sure these properties exist
                            bTCopyDocumentParams: {
                                isPublic: false,
                                ownerId: this.onshape.userId, //parent,
                                newName: libraryName,
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
     * Creates a BTGlobalTreeNodeInfo object representing the proxy folder from the reference folder
     * @param reference onshape folder or object used to create the proxy folder
     * @param library library that the proxy folder is linked to
     * @returns proxy folder info
     */
    public generateProxyFolderInfo(
        reference: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeNodeInfo
    ): BTGlobalTreeNodeInfo {
        return {
            jsonType: 'proxy-folder',
            name: reference.name,
            id: reference.id,
            isContainer: true,
            projectId: library.id,
            owner: {
                id: this.onshape.userId,
            },
        };
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
                this.setProxyFolder(library, proxyFolder, contents)
                    .then(() => {
                        resolve(proxyFolder);
                    })
                    .catch((err) => {
                        _reject(err);
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
            this.setBTGArray(library, this.proxyChildrenName, entries).then((res) => {
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
            this.getProxyDocumentFromQuery(documents)
                .then((library: BTGlobalTreeProxyInfo) => {
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
                })
                .catch((err) => {
                    reject(err);
                });
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
                        this.getProxyLibraryFromDocuments(
                            { items: [library] },
                            this.decodeLibraryName(library.name),
                            getDescendants
                        )
                            .then((value) => {
                                resolve(value);
                            })
                            .catch((error) => {
                                reject(error);
                            });
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
                        if (err.type === 'TypeError') {
                            const response = new Response('', {
                                status: 403,
                                statusText: '',
                            });
                            return reject(response);
                        }
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
            this.getAppElement(folder.id, library)
                .then((folderElement: BTGlobalTreeNodeInfo) => {
                    // console.log(
                    //     'Setting proxy folder',
                    //     folder,
                    //     folderElement,
                    //     library,
                    //     entries
                    // );
                    this.setBTGArray(folderElement, this.proxyChildrenName, entries).then(
                        (res) => {
                            resolve(res);
                        }
                    );
                })
                .catch((err) => {
                    _reject(err);
                });
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
            this.getAppElement(folderId, library)
                .then((folder: BTGlobalTreeNodeInfo) => {
                    if (folder === undefined) resolve(undefined);
                    this.getBTGArray(this.proxyChildrenName, folder).then((res) => {
                        resolve(res);
                    });
                })
                .catch((err) => {
                    _reject(err);
                });
        });
    }

    private encodeLibraryName(name: string, rawLibrary: boolean = false) {
        if (rawLibrary) name = this.rawLibraryName + name;
        return SPECIALCHAR + name + SPECIALCHAR;
    }
    public decodeLibraryName(libraryName: string, rawLibrary: boolean = false) {
        let restring = SPECIALCHAR + '([^' + SPECIALCHAR + ']+)' + SPECIALCHAR;
        if (rawLibrary)
            restring =
                SPECIALCHAR +
                this.rawLibraryName +
                '([^' +
                SPECIALCHAR +
                ']+)' +
                SPECIALCHAR;
        const result = new RegExp(restring, 'gm').exec(libraryName);
        if (result !== null) {
            return result[1];
        }
        return undefined;
    }
}
