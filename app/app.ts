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
import { BaseApp } from './baseapp';
import {
  BTAssemblyInstanceInfo,
    BTDocumentElementInfo,
    BTDocumentSummaryInfo,
    BTESVersionWorkspaceChoice,
    BTFSValueUndefined2003FromJSON,
    BTFlatSheetMetalFilter3018AllOfFromJSONTyped,
    BTGlobalTreeMagicNodeInfo,
    BTGlobalTreeNodeInfo,
    BTGlobalTreeNodesInfo,
    BTGlobalTreeNodesInfoFromJSON,
    BTInsertableInfo,
    BTInsertableInfoToJSON,
    BTInsertablesListResponse,
    BTInsertablesListResponseFromJSON,
    BTMEnumOption592,
    BTMIndividualQuery138,
    BTMMateRelation1412FromJSON,
    BTMParameter1,
    BTMParameterBoolean144,
    BTMParameterDerived864,
    BTMParameterEnum145,
    BTMParameterQuantity147,
    BTMParameterQueryList148,
    BTMParameterString149,
    BTPExpressionSwitch2632ToJSON,
    BTSingleAssemblyReferenceDisplayData1557AllOfFromJSONTyped,
    BTThumbnailInfo,
    FolderApi,
    GBTElementType,
    GetConfigurationWvmEnum,
    GetInsertablesRequest,
    GetWMVEPsMetadataWvmEnum,
    ItemSuperToJSON,
    ObjectId,
    instanceOfBTPFunctionOrPredicateDeclaration247,
    instanceOfGlobalPermissionInfo,
} from 'onshape-typescript-fetch';
import { createSVGIcon, OnshapeSVGIcon } from './onshape/svgicon';
import { JTTable } from './common/jttable';
import { classListAdd, createDocumentElement, waitForTooltip } from './common/htmldom';
import { genEnumOption } from './components/configurationoptions';
import {
    BTGlobalTreeNodeMagicDataInfo,
    BTGlobalTreeProxyInfo,
    BTGlobalTreeProxyInfoJSONTyped,
    Preferences,
} from './preferences';
import { Library } from './libraries';
import { appName as APP_NAME } from './app_settings.json';
import { InformationReporter } from './InformationReporter';
import { defaults, marked } from 'marked';
import { TaskProcessingUnit } from './TaskProcessingUnit';
import { FeatureStudios } from './featurestudios';

export interface magicIconInfo {
    label: string;
    icon: OnshapeSVGIcon;
    hideFromMenu?: boolean;
    search?: boolean;
}

export interface homeGroupInfo {
    title: string;
    children: string[];
}

export interface configInfo {
    type: string;
    id: string;
    value: string;
}

interface SearchInfoNode {
    id: string;
    partNumber?: string;
    name: string;
}

export interface configInsertInfo {
    configList: configInfo[];
    deterministicId?: string;
    libraryVersion?: number;
    microversionSkew?: boolean;
    rejectMicroversionSkew?: boolean;
    serializationVersion?: string;
    sourceMicroversion?: string;
}

export interface metaData {
    [key: string]: any;
}

export interface folderLocation {
    pathToRoot: BTGlobalTreeNodeInfo[];
    teamroot: BTGlobalTreeNodeInfo;
}

export interface documentChangeHistory {
    username: string;
    date: string;
    versionName: string;
}

export interface actionMenuOptionInfo {
    parentType: string[]; // parent json-type
    documentType?: string[]; //document json-type
    excludeParentType?: string[]; //don't render if parent json-type is one of these
    name: string; //name for ui classes
    label?: string; //label to be rendered in the contect menu
    element?: Element; //don't need this?
    input?: actionMenuOptionInputInfo[]; //input info
    deleteIcon?: boolean; //
    parentWithoutDocument?: string[]; // rendered if no document is selected and parent json type is one of these
    userOwned?: boolean; //document is owned by this user
    // multiSelect?: boolean; //options available for multiple documents selected
}

export interface actionMenuOptionInputInfo {
    name: string;
    label: string;
    type: string;
}

export class App extends BaseApp {
    public myserver = 'https://ftconshape.com/' + APP_NAME;
    public magic = 1;
    public loaded = 0;
    public loadedlimit = 2500; // Maximum number of items we will load
    public targetDocumentElementInfo: BTDocumentElementInfo = {};
    public appName: string = APP_NAME;
    public searchLoadChunk = 10; // Number of documents to load at a time for search results

    private globalLibrariesNodes: string[] = [
        '2fd951db6d0261aba5f16a5d', //AndyMark
        '65d1b86ea725f780582d9dd0', //GoBILDA
        'f4aa6bf18a572782640d6476', //Modern Robotics
        'f3b99a8450b4f983b1efa03c', //Pitsco
        'b71490095d0a6e87f29c4975', //REV Robotics
        '1348b49fc35396eed14d589b', //ServoCity
        '48ccfa30daa8fc8dad88f0eb', //Studica
        'ef69c7f97eac419fe24faf1d', //Other Robotics Vendors
        '07986b342f5e967bbfd021f8', //LoonyLib
    ];

    private communityLibraryNode = "accc43e0609b52ab0b86c15f";

    public magicInfo: { [item: string]: magicIconInfo } = {
        '0': { icon: 'svg-icon-recentlyOpened', label: 'Recently Opened', search: true },
        '1': { icon: 'svg-icon-myDocuments', label: 'My Onshape' /*, search: true*/ },
        '2': { icon: 'svg-icon-createdByMe', label: 'Created by Me', search: true },
        '3': { icon: 'svg-icon-public', label: 'Public', search: true },
        '4': { icon: 'svg-icon-trash', label: 'Trash' },
        '5': {
            icon: 'svg-icon-tutorial-element',
            label: 'Tutorials & Samples',
        },
        '6': {
            icon: 'svg-icon-tutorial-element',
            label: 'FeatureScript samples',
        },
        '7': {
            icon: 'svg-icon-tutorial-element',
            label: 'Community spotlight',
        },
        '8': { icon: 'svg-icon-help-ios', label: 'IOS Tutorials' },
        '9': { icon: 'svg-icon-help-android', label: 'Android Tutorials' },
        '10': { icon: 'svg-icon-label', label: 'Labels', hideFromMenu: true },
        '11': { icon: 'svg-icon-team', label: 'Teams' /*, search: true */ },
        '12': { icon: 'svg-icon-sharedWithMe', label: 'Shared with me' },
        '13': {
            icon: 'svg-icon-document-upload-cloud',
            label: 'Cloud Storage',
            hideFromMenu: true,
        },
        '14': {
            icon: 'svg-icon-tutorial-element',
            label: 'Custom table samples',
        },
        RI: { icon: 'svg-icon-recentlyOpened', label: 'Recently Inserted' },
        FV: { icon: 'svg-icon-filter-favorite', label: 'Favorited' },
        LI: { icon: 'svg-icon-libraries', label: 'My Libraries', search: true },
        GL: { icon: 'svg-icon-library-public', label: 'Global Libraries', search: true },
        HI: { icon: 'svg-icon-help-button', label: 'Help/Instructions' },
        CD: { icon: 'svg-icon-document', label: 'Current Document' },
        CL: { icon: 'svg-icon-team', label: 'Community Library' },
    };
    public homeGrouping: homeGroupInfo[] = [
        { title: '', children: ['LI', 'FV', 'RI', 'GL', '11', 'HI', 'CD', 'CL'] },
        { title: '━━━━━━━━', children: ['1', '0', '2', '12', '3'] },
        { title: 'Other', children: ['5', '6', '7', '8', '9', '14'] },
    ];
    public actionMenuOptions: { [item: string]: actionMenuOptionInfo } = {
        NAME: {
            parentType: ['any'],
            name: 'name',
            documentType: [
                'document-summary',
                'document-config',
                'folder',
                'magic',
                'proxy-library',
                'proxy-folder',
            ],
            parentWithoutDocument: ['proxy-folder', 'proxy-library', 'LI'],
            label: 'Name',
        },
        // REHOME: {
        //     parentType: ['home'],
        //     documentType: ['magic'],
        //     name: 'removehome',
        //     label: 'Remove from home (not implemented)',
        //     deleteIcon: true,
        // },
        OPEN: {
            parentType: ['any'],
            documentType: ['document-summary', 'document-summary-config'],
            name: 'open',
            label: 'Open document in new tab',
        },
        REPORT: {
            parentType: ['any'],
            documentType: ['document-summary', 'document-summary-config'],
            name: 'report',
            label: 'Report flaw in document',
        },
        FAVORITE: {
            parentType: ['any'],
            documentType: ['document-summary', 'proxy-folder', 'folder'],
            name: 'favorite',
            label: 'Loading favorite status...',
        },
        // CLONELIB: {
        //     parentType: ['any'], //exclude: LI / My Libraries
        //     excludeParentType: ['LI','GL'], //library in my libraries shouldn't be cloneable
        //     documentType: ['proxy-library'],
        //     name: 'clonepartslibrary',
        //     label: 'Clone this parts library into My Libraries',
        // },
        ADDLIB: {
            parentType: ['any'],
            documentType: ['proxy-library'],
            name: 'addproxylibrary',
            label: 'Loading My Libraries status...',
        },
        CREATELIB: {
            parentType: ['home', 'LI'],
            documentType: ['LI'],
            name: 'createproxylibrary',
            label: 'Create parts library',
            input: [
                {
                    name: 'lib-name',
                    label: 'Library Name',
                    type: 'text',
                },
            ],
            parentWithoutDocument: ['LI'],
        },
        ADDLIBDOC: {
            parentType: ['any'],
            documentType: ['document-summary'],
            name: 'adddocumenttolibrary',
            label: 'Add document to parts library',
            input: [
                {
                    name: 'lib-name',
                    label: 'Library Name',
                    type: 'select',
                },
            ],
        },
        ADDPROXYDOC: {
            parentType: ['any'],
            documentType: ['document-summary'],
            name: 'adddocumenttoproxy',
            label: 'Add document to library folder',
            input: [
                {
                    name: 'lib-name',
                    label: 'Library Name',
                    type: 'select',
                },
                {
                    name: 'proxy-name',
                    label: 'Proxy Name',
                    type: 'select',
                },
            ],
        },
        REPROXYDOC: {
            parentType: ['proxy-folder'],
            documentType: ['document-summary'],
            name: 'removedocumentfromproxy',
            label: 'Remove document from library folder',
            deleteIcon: true,
            userOwned: true,
        },
        RELIBDOC: {
            parentType: ['proxy-library'],
            documentType: ['document-summary'],
            name: 'removedocumentfromlibrary',
            label: 'Remove document from library',
            deleteIcon: true,
            userOwned: true,
        },
        CREATEPROXY: {
            parentType: ['any'],
            documentType: ['proxy-library', 'proxy-folder'],
            excludeParentType: ['GL'],
            name: 'createproxyfolder',
            label: 'Create folder for library',
            input: [
                {
                    name: 'proxy-name',
                    label: 'Proxy Name',
                    type: 'text',
                },
            ],
            parentWithoutDocument: ['proxy-library', 'proxy-folder'],
            userOwned: true,
        },
        DELPROXY: {
            parentType: ['proxy-library', 'proxy-folder'],
            documentType: ['proxy-folder'],
            name: 'deleteproxyfolder',
            label: 'Remove folder',
            deleteIcon: true,
            userOwned: true,
        },
        MOVEPROXY: {
            parentType: ['proxy-library', 'proxy-folder'],
            documentType: ['proxy-folder'],
            name: 'movefolder',
            label: 'Move Folder',
            userOwned: true,
            input: [
                {
                    name: 'lib-name',
                    label: 'Library',
                    type: 'select',
                },
                {
                    name: 'proxy-name',
                    label: 'Folder (Optional)',
                    type: 'select',
                },
            ],
        },
        MOVEDOC: {
            parentType: ['proxy-library', 'proxy-folder'],
            documentType: ['document-summary'],
            name: 'movedoc',
            label: 'Move document',
            userOwned: true,
            input: [
                {
                    name: 'lib-name',
                    label: 'Library',
                    type: 'select',
                },
                {
                    name: 'proxy-name',
                    label: 'Folder (Optional)',
                    type: 'select',
                },
            ],
        },
        CLONEFOLDER: {
            parentType: ['any'],
            documentType: ['folder'],
            name: 'createlibraryfromfolder',
            label: 'Create a parts library from folder',
        },
        BUILDDESC: {
            parentType: ['LI'], //any?
            documentType: ['proxy-library'],
            userOwned: true,
            name: 'rebuilddocdescendants',
            label: 'Refactor parts library',
        },
        SCANDELTA: {
            parentType: ['LI'], //any?
            documentType: ['proxy-library'],
            userOwned: true,
            name: 'scanproxylibrarydelta',
            label: 'Scan library for changes',
        },
        INSERTALL: {
            parentType: ['any'],
            documentType: ['document-summaries'],
            name: 'insertalldocuments',
            label: 'Insert Selected Documents',
            // multiSelect: true,
        },
        DOCHISTORY: {
            parentType: ['any'],
            documentType: ['document-summary'],
            name: 'getdocumenthistory',
            label: 'Get Document Changes History (csv)',
        },
    };
    public preferences: Preferences;
    public libraries: Library;
    public featureStudios: FeatureStudios;
    /**
     * The main entry point for an app
     */
    public startApp(): void {
        this.libraries = new Library(this.onshape);
        this.preferences = new Preferences(this.onshape);
        this.featureStudios = new FeatureStudios(this.onshape);
        this.startAppContent();
    }

    private initAppContent(): HTMLElement {
        // Create the main container
        const div = createDocumentElement('div', { id: 'apptop' });
        this.createPopupDialog(div);
        this.createActionMenu(div);
        this.createBoxSelect(div);

        //Create search div
        const searchdiv = createDocumentElement('div', {
            id: 'search',
            class: 'os-control-container document-version-picker-search-container',
            style: 'display:none;',
        });
        div.appendChild(searchdiv);
        this.createSearchBar(searchdiv);

        // Create the main div that shows where we are
        const bcdiv = createDocumentElement('div', {
            id: 'breadcrumbs',
            class: 'os-documents-heading-area disable-user-select os-row os-wrap os-align-baseline',
        });
        div.appendChild(bcdiv);

        // Create a place holder for the nodes to be dumped into
        const dumpNodes = createDocumentElement('div', {
            id: 'dump',
            class: 'y-overflow',
        });
        dumpNodes.oncontextmenu = (e) => e.preventDefault();
        div.appendChild(dumpNodes);

        return div;
    }

    public startAppContent() {
        this.preferences
            .initUserPreferences(this.appName)
            .then((_val) => {
                if (_val === undefined || _val === null) {
                    if (this.onshape.freeUser) {
                        return this.startAppContent();
                    } else {
                        console.error(
                            'Cannot create initialize user preferences. They are not a free user'
                        );
                    }
                }

                this.startAppPreferences()
                    .then((goto) => {
                        this.displayReady.then(() => {
                            this.setAppElements(this.initAppContent());
                            this.gotoFolder(goto);
                        });
                    })
                    .catch(() => {
                        this.startAppContent();
                    });
            })
            .catch((err) => {
                this.failApp(err);
            });
    }

    private startAppPreferences(): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            if (this.preferences.newUser) {
                resolve({
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'HI',
                    name: 'Help/Instructions',
                });
            }

            // const initMessage = {
            //   documentId:  this.onshape.documentId,    // required - parsed from action url
            //   workspaceId: this.onshape.workspaceId,   // required - parsed from action url
            //   elementId:   this.onshape.elementId,     // required - parsed from action url
            //   messageName: "applicationInit" // required
            // };

            // window.addEventListener('message',(e)=>console.log(e));
            // window.parent.postMessage(initMessage, '*');

            this.getDocumentElementInfo(this.documentId, this.workspaceId, this.elementId)
                .then((val: BTDocumentElementInfo) => {
                    this.targetDocumentElementInfo = val;

                    if (
                        val.elementType !== 'PARTSTUDIO' &&
                        val.elementType !== 'ASSEMBLY'
                    ) {
                        this.failApp(
                            `Only able to insert into PartStudios and Assemblies.  This page is of type ${val.elementType}`
                        );
                        return;
                    }
                })
                .catch((err) => {
                    this.failApp(err);
                });

            this.getLastLocation()
                .then((lastLocation) => {
                    if (lastLocation === undefined) {
                        resolve({ jsonType: 'home' });
                        return;
                    }
                    this.setBreadcrumbs(lastLocation, undefined, true);
                    resolve(lastLocation[0]);
                })
                .catch(() => {
                    reject();
                });
        });
    }

    /**
     * Handle when an app is unable to authenticate or has any other problem when starting
     * @param reason Reason for initialization failure
     */
    public failApp(reason: string): void {
        super.failApp(reason);
    }
    /**
     * Create the initial page showing that we are initializing
     */
    public showInitializing() {
        super.showInitializing();
    }
    /**
     * Preserve the last location that we were at
     * @param location Location to
     */
    public saveLastLocation(location: folderLocation): void {
        this.preferences.setLastKnownLocation(location.pathToRoot);
    }
    /**
     * Restore the last saved location
     * @returns Last saved location
     */
    public getLastLocation(): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            this.preferences
                .getLastKnownLocation()
                .then((locations) => {
                    if (
                        locations === null ||
                        locations === undefined ||
                        locations[0] === undefined
                    ) {
                        resolve([{ jsonType: 'home' }]);
                    } else {
                        resolve(locations);
                    }
                })
                .catch((err) => {
                    resolve([{ jsonType: 'home' }]);
                });
        });
    }
    currentBreadcrumbs: BTGlobalTreeNodeInfo[] = [];
    /**
     * Set the breadcrumbs in the header
     * @param node Node to add to breadcrumbs, if the node is already in the breadcrumbs, it will delete the more recent crumbs until that node
     * @param temporary true means that the node will not be saved to the preferences file
     */
    public addBreadcrumbNode(
        node: BTGlobalTreeMagicNodeInfo,
        temporary: boolean = false
    ): void {
        let itemInBreadcrumbsIndex: number;
        const itemInBreadcrumbs = this.currentBreadcrumbs.find((crumb, index) => {
            itemInBreadcrumbsIndex = index;
            return (
                crumb.jsonType === node.jsonType &&
                crumb.id === node.id &&
                crumb.projectId === node.projectId // &&
                // crumb.treeHref === item.treeHref // prevents recursion
            );
        });
        if (itemInBreadcrumbs !== undefined) {
            this.currentBreadcrumbs = this.currentBreadcrumbs.slice(
                itemInBreadcrumbsIndex + 1
            );
        }
        this.currentBreadcrumbs.unshift(node);
        this.setBreadcrumbs(this.currentBreadcrumbs, undefined, temporary);
    }
    /**
     * Set the breadcrumbs in the header
     * @param breadcrumbs Array of breadcrumbs (in reverse order)
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     * @param skipSave true means that the node will not be saved to the preferences file
     */
    public setBreadcrumbs(
        breadcrumbs: BTGlobalTreeNodeInfo[],
        teamroot?: BTGlobalTreeNodeInfo,
        skipSave: boolean = false
    ): void {
        if (skipSave !== true)
            this.saveLastLocation({
                pathToRoot: breadcrumbs,
                teamroot: teamroot,
            });
        this.currentBreadcrumbs = breadcrumbs;

        // Find where they want us to put the breadcrumbs
        const breadcrumbscontainer = document.getElementById('breadcrumbs');
        if (breadcrumbscontainer === undefined || breadcrumbscontainer === null) {
            // If we don't have a place for it, just skip out
            return;
        }
        // This is what Onshape Generates
        //
        // <span ng-if="!documentSearch.searchText" class="documents-filter-heading spaced-filter-name">
        //   <span ng-if="documentSearch.resourceType" class="documents-filter-heading">
        //     <os-breadcrumb breadcrumb-nodes="breadcrumbNodesList" expand-container-selectors="['.documents-filter-heading.spaced-filter-name', '.documents-filter-heading:not(.spaced-filter-name)']" lower-bound-selector="'.os-items-footer'" lower-bound-offset="12" allow-drop="true" on-drop-callback="onDropOverBreadCrumb(targetNodeId, targetNodeType)" on-dragover-callback-should-disable="shouldDisableDragoverForBreadCrumb(isMyOnshape, event)" class="">
        //       <div class="os-breadcrumb-container">
        //         <os-breadcrumb-node class="os-breadcrumb-root-node" ng-if="$ctrl.firstBreadcrumbNode()" breadcrumb-node="$ctrl.firstBreadcrumbNode()" hide-first-text="$ctrl.hideFirstNodeText" last="$ctrl.breadcrumbNodes.length === 1" first="true" dnd-list="" dnd-dragover="$ctrl.onDragOver({isFirstNode: true, isLastNode: $ctrl.breadcrumbNodes.length === 1, event})" dnd-drop="$ctrl.onDrop($ctrl.firstBreadcrumbNode().options)" os-drag-leave="">
        //           <div class="os-breadcrumb-node" ng-if="$ctrl.breadcrumbNode" ng-class="{'os-breadcrumb-leaf': $ctrl.last}">
        //             <svg class="breadcrumb-node-icon os-svg-icon node-icon" ng-if="$ctrl.breadcrumbNode.options.icon" icon="sharedWithMe" ng-class="{'node-icon': !$ctrl.last, 'breadcrumb-node-text-hidden': !$ctrl.shouldShowTitle() &amp;&amp; !$ctrl.last }" ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)" data-original-title="Shared with me" data-placement="bottom">
        //             <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-sharedWithMe" link="#svg-icon-sharedWithMe"></use>
        //             </svg>
        //             <div class="node-title" ng-class="{'hide-node-title': $ctrl.breadcrumbNode.uiSref || !$ctrl.shouldShowTitle()}" data-original-title="Shared with me" data-placement="bottom">
        //               <a ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)">Shared with me</a>
        //             </div>
        //             <div ng-hide="$ctrl.last" class="node-seperator">
        //               <svg class="os-svg-icon" icon="forward-tab">
        //                 <title></title>
        //                 <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
        //               </svg>
        //             </div>
        //           </div>
        //         </os-breadcrumb-node>
        //         <div class="os-breadcrumb-dropdown ng-hide" ng-class="{'os-breadcrumb-dropdown-drag-enter': $ctrl.isDropdownDragEnter }" ng-style="{ 'opacity': $ctrl.isInitialCalculation ? '0': '1'}" ng-show="$ctrl.isInitialCalculation || ($ctrl.collapsedBreadcrumbNodes &amp;&amp; $ctrl.collapsedBreadcrumbNodes.length)" style="opacity: 1;">
        //           <button type="button" class="os-breadcrumb-dropdown-toggle dropdown-toggle" data-toggle="dropdown">
        //             <svg class="os-svg-icon" icon="overflow">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-overflow" link="#svg-icon-overflow"></use>
        //             </svg>
        //           </button>
        //           <div class="os-breadcrumb-dropdown-menu dropdown-menu append-to-body-menu-a-6" ng-class="{ 'opened-from-drag': $ctrl.dropdownWasOpenedFromDrag }" menu-width="none" os-append-to-body="{ backdrop: false, lowerBound: $ctrl.getLowerBound(), lowerBoundOffset: $ctrl.getLowerBoundOffset() }" style="z-index: 1100;">
        //             <div class="os-breadcrumb-dropdown-scroll-container">
        //               <ul class="os-scroll-container-content">
        //               </ul>
        //             </div>
        //           </div>
        //           <div class="node-seperator">
        //             <svg class="os-svg-icon" icon="forward-tab">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
        //             </svg>
        //           </div>
        //         </div>
        //         <os-breadcrumb-node ng-repeat="node in $ctrl.displayBreadcrumbNodes" breadcrumb-node="node" hide-first-text="false" dnd-list="" dnd-dragover="$ctrl.onDragOver({isFirstNode: false, isLastNode: $last, event})" dnd-drop="$ctrl.onDrop(node.options)" os-drag-leave="" ng-style="{'flex-shrink': $ctrl.allowShrink ? '1' : '0'}" first="false" last="$last" style="flex-shrink: 0;">
        //           <div class="os-breadcrumb-node os-breadcrumb-leaf" ng-if="$ctrl.breadcrumbNode" ng-class="{'os-breadcrumb-leaf': $ctrl.last}">
        //             <svg class="breadcrumb-node-icon os-svg-icon" ng-if="$ctrl.breadcrumbNode.options.icon" icon="folder" ng-class="{'node-icon': !$ctrl.last, 'breadcrumb-node-text-hidden': !$ctrl.shouldShowTitle() &amp;&amp; !$ctrl.last }" ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)" data-original-title="ServoCity" data-placement="bottom">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-folder" link="#svg-icon-folder"></use>
        //             </svg>
        //             <div class="node-title hide-node-title" ng-class="{'hide-node-title': $ctrl.breadcrumbNode.uiSref || !$ctrl.shouldShowTitle()}" data-original-title="ServoCity" data-placement="bottom">
        //               <a ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)">ServoCity</a>
        //             </div>
        //             <div ng-if="$ctrl.last" class="node-title" data-original-title="ServoCity" data-placement="bottom">
        //               <span>ServoCity</span>
        //             </div>
        //             <div ng-hide="$ctrl.last" class="node-seperator ng-hide">
        //               <svg class="os-svg-icon" icon="forward-tab">
        //                 <title></title>
        //                 <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
        //               </svg>
        //             </div>
        //           </div>
        //         </os-breadcrumb-node>
        //       </div>
        //     </os-breadcrumb>
        //   </span>
        // </span>

        // This is what we will do
        //
        // <div class="os-breadcrumb-container">
        //     <div class="os-breadcrumb-node">   (onclick for the div)
        //        createSVGIcon('svg-icon-sharedWithMe','breadcrumb-node-icon os-svg-icon node-icon')
        //       <div class="node-title" data-original-title="Shared with me" data-placement="bottom">
        //         <a>Shared with me</a>
        //       </div>
        //       <div class="node-seperator">
        //         createSVGIcon('svg-icon-forward-tab','os-svg-icon')
        //       </div>
        //     </div>
        //
        //   If we need to have a ... to shorten it
        //   <div class="os-breadcrumb-dropdown" >
        //     <button type="button" class="os-breadcrumb-dropdown-toggle dropdown-toggle" data-toggle="dropdown">
        //        createSVGIcon('svg-icon-overflow','os-svg-icon')
        //     </button>
        //     <div class="node-seperator">
        //        createSVGIcon('svg-icon-forward-tab','os-svg-icon')
        //     </div>
        //   </div>
        //
        //   Typical folder at the end
        //   <div class="os-breadcrumb-node os-breadcrumb-leaf">  // Leaf goes on the end
        //      createSVGIcon('svg-icon-folder','breadcrumb-node-icon os-svg-icon')
        //     <div class="node-title" data-original-title="ServoCity" data-placement="bottom">
        //       ServoCity
        //     </div>
        //   </div>
        //
        // </div>

        // Always create a home button to go to the top level list
        const breadcrumbsdiv = createDocumentElement('div', {
            class: 'os-breadcrumb-container',
        });
        breadcrumbsdiv.appendChild(
            this.createBreadcrumbNode(
                'svg-icon-home-button',
                'Home',
                breadcrumbs.length === 0,
                () => {
                    this.gotoFolder({ jsonType: 'home' });
                }
            )
        );
        // Keep track of when we we need to override the next folder entry with the team icon
        let useteamicon = false;
        for (let i = breadcrumbs.length - 1; i >= 0; i--) {
            const node = breadcrumbs[i];

            let breadcrumbdiv: HTMLElement;
            const isLast = i == 0;
            // Assume we won't have to insert the fake team root into the breadcrumb list
            let addteamroot = false;
            if (node.resourceType === 'magic') {
                // This is one of the magic entries.
                let nodeid = node.id;
                let nodename = node.name;
                // When we are dealing with a team, the path to root doesn't tell you that
                // it is part of a team and instead says it is a shared folder.
                // So what we need to do in this case is to insert a magic
                if (nodeid === '12' && teamroot !== undefined) {
                    // 12 is "Shared with me"
                    nodeid = '11'; // 11 is Teams
                    nodename = this.magicInfo[nodeid].label;
                    addteamroot = true;
                    useteamicon = true;
                }
                let magicinfo = this.magicInfo[nodeid];
                if (magicinfo === undefined || magicinfo === null) {
                    // But we don't recognize which magic it is, so
                    breadcrumbdiv = this.createBreadcrumbNode(
                        'svg-icon-error',
                        `${node.id} - NOT FOUND (${node.name})`,
                        isLast && !addteamroot,
                        () => {
                            this.gotoFolder({ jsonType: 'home' });
                        }
                    );
                } else {
                    // We know which one it is, so use the proper icon
                    // And make it so that when they click they go to the right directory
                    breadcrumbdiv = this.createBreadcrumbNode(
                        magicinfo.icon,
                        nodename,
                        isLast && !addteamroot,
                        () => {
                            this.gotoFolder(node);
                        }
                    );
                }
            } else {
                // Just a normal folder.  make it so that clicking on it
                // navigates to the folder.  However we need to remember
                // that just because it is a folder, doesn't mean it wasn't shared with a team
                let icon: OnshapeSVGIcon = 'svg-icon-folder';
                if (useteamicon || node.resourceType === 'team') {
                    icon = 'svg-icon-team';
                    useteamicon = false;
                } else if (node.jsonType === 'proxy-library') {
                    icon = 'svg-icon-library';
                }
                breadcrumbdiv = this.createBreadcrumbNode(icon, node.name, isLast, () => {
                    this.gotoFolder(node, teamroot);
                });
            }
            breadcrumbsdiv.appendChild(breadcrumbdiv);
            // Did we need to put in the fake team root that was missed in the breadcrumb list?
            if (addteamroot) {
                let teamrootdiv = this.createBreadcrumbNode(
                    'svg-icon-team',
                    teamroot.name,
                    isLast,
                    () => {
                        this.gotoFolder(teamroot, teamroot);
                    }
                );
                breadcrumbsdiv.appendChild(teamrootdiv);
                useteamicon = false;
            }
        }
        breadcrumbscontainer.replaceChildren(breadcrumbsdiv);
    }
    /**
     * Create a single breadcrumb node (with separators as needed)
     * @param icon Icon for the node
     * @param title Title of the node
     * @param isLast This is the last in the list of nodes
     * @param onclickFunction Function to call when it is clicked on
     * @returns HTMLElement with all the UI elements in it
     */
    public createBreadcrumbNode(
        icon: OnshapeSVGIcon,
        title: string,
        isLast: boolean,
        onclickFunction: (e: any) => any
    ): HTMLElement {
        const div = createDocumentElement('div', {
            class: 'os-breadcrumb-node',
        });
        if (isLast) {
            div.classList.add('os-breadcrumb-leaf');
        }
        const nodeicon = createSVGIcon(icon);
        nodeicon.onclick = onclickFunction;
        div.appendChild(nodeicon);

        const titlediv = createDocumentElement('div', {
            class: 'node-title',
            title: title,
            'data-placement': 'bottom',
            textContent: title,
        });
        titlediv.onclick = onclickFunction;
        div.appendChild(titlediv);
        if (!isLast) {
            const seperatordiv = createDocumentElement('div', {
                class: 'node-seperator',
            });
            seperatordiv.appendChild(createSVGIcon('svg-icon-forward-tab'));
            div.appendChild(seperatordiv);
        }
        return div;
    }

    /**
     * Create searchbar
     * @param parent
     */
    public createSearchBar(parent: HTMLElement): void {
        const searchBarDiv = createDocumentElement('search-box', {
            class: 'os-row search-box select-item-document-search',
        });
        const searchBarDiv2 = createDocumentElement('ng-form', {});
        const searchBarDiv3 = createDocumentElement('div', {});

        searchBarDiv2.appendChild(searchBarDiv3);
        searchBarDiv.appendChild(searchBarDiv2);

        //button grayed out because its not implemented
        const filterButton = createDocumentElement('button', {
            class: 'toggle-filters os-btn os-clear',
            style: 'background-color: #cbcbcb',
            disabled: 'true',
        });
        const filterButtonContent = createDocumentElement('div', {
            class: 'button-content',
        });
        const filterIcon = createSVGIcon('svg-icon-filter-results-button');
        filterButtonContent.appendChild(filterIcon);
        filterButton.appendChild(filterButtonContent);

        //search input thingy
        const searchBoxDiv = createDocumentElement('os-search-box', {
            class: 'os-field',
        });
        const searchBoxInput = createDocumentElement('input', {
            type: 'text',
            id: 'searchboxinput',
            class: 'os-search-box-input os-grow ng-pristine ng-valid ng-empty ng-touched',
            placeholder: 'Search by name or part number',
            style: 'font-size: 12px',
        }) as HTMLButtonElement;
        const searchBoxClear = createDocumentElement('a', {
            id: 'search-box-clear-button ng-hide',
            class: 'os-search-box-clear-button',
        });
        const searchBoxClearIcon = createSVGIcon('svg-icon-clear-field-button');
        searchBoxClear.appendChild(searchBoxClearIcon);
        searchBoxDiv.appendChild(searchBoxInput);
        searchBoxDiv.appendChild(searchBoxClear);

        //create submit button
        const searchButton = createDocumentElement('button', {
            class: 'submit-search os-btn os-clear',
        }) as HTMLButtonElement;
        const searchButtonContent = createDocumentElement('div', {
            class: 'button-content',
        });
        const searchIcon = createSVGIcon('svg-icon-search');
        searchButtonContent.appendChild(searchIcon);
        searchButton.appendChild(searchButtonContent);

        searchBarDiv3.appendChild(filterButton);
        searchBarDiv3.appendChild(searchBoxDiv);
        searchBarDiv3.appendChild(searchButton);

        searchBoxClear.onclick = () => {
            searchBoxInput.value = '';
            searchBoxClear.classList.remove('ng-hide');
        };
        searchBoxInput.addEventListener('input', () => {
            const value = searchBoxInput.value;
            if (value !== undefined && value !== null && value !== '') {
                searchBoxClear.classList.remove('ng-hide');
                searchButton.disabled = false;
            } else {
                searchBoxClear.classList.add('ng-hide');
                searchButton.disabled = true;
            }
        });

        const onsubmit = () => {
            const value = searchBoxInput.value;
            if (value === undefined || value === null || value === '') return;
            this.gotoFolder({ jsonType: 'search', description: value });
        };

        searchButton.onclick = () => onsubmit();
        searchBoxInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchButtonContent.click();
        });
        parent.appendChild(searchBarDiv);
    }

    private showSearchBar(): void {
        const searchDiv = document.getElementById('search');
        if (searchDiv !== undefined && searchDiv !== null)
            searchDiv.style.display = 'block';
    }
    private hideSearchBar(): void {
        const searchDiv = document.getElementById('search');
        if (searchDiv !== undefined && searchDiv !== null)
            searchDiv.style.display = 'none';
    }

    private checkSearchBarEnabled(newFolder: BTGlobalTreeNodeInfo): void {
        switch (newFolder.jsonType || newFolder.resourceType) {
            case 'home': {
                this.hideSearchBar();
                break;
            }
            case 'magic': {
                if (this.magicInfo[newFolder.id].search !== true) break;
                // if (newFolder.id !== 'GL' && newFolder.id !== 'LI') break;
            }
            case 'team-summary':
            case 'proxy-library':
            case 'search': {
                this.showSearchBar();
                break;
            }
        }
    }

    /**
     *
     */
    private processHomeNode(magicid: string, table: JTTable) {
        const magicinfo = this.magicInfo[magicid];
        if (!magicinfo.hideFromMenu) {
            const magicNode: BTGlobalTreeNodeInfo = {
                jsonType: 'magic',
                id: magicid,
            };
            const row = table.addBodyRow();
            row.rowClass = 'os-selectable-item';
            const span = createDocumentElement('span');
            const icon = createSVGIcon(magicinfo.icon, 'documents-filter-icon');
            const onclick = () => {
                this.gotoFolder(magicNode);
            };
            const oncontextmenu = (event) => {
                event.preventDefault();
                let rect = textspan.getBoundingClientRect();
                this.showActionMenu(magicNode, { id: 'home', jsonType: 'magic' }, rect);
                this.hidePopup();
            };
            icon.onclick = onclick;
            icon.oncontextmenu = oncontextmenu;
            span.appendChild(icon);
            const textspan = createDocumentElement('span', {
                textContent: magicinfo.label,
            });
            // const spanParent = span.parentElement;
            row.attr({ class: 'os-selectable-item' });
            row.eventListen({ click: onclick, contextmenu: oncontextmenu });
            // span.onclick = onclick;
            // span.oncontextmenu = oncontextmenu;
            span.appendChild(textspan);
            row.add(span);
        }
    }
    /**
     * Show all of the selectable items on the home menu
     * @param elem DOM Element to put information into
     */
    public processHome(elem: HTMLElement) {
        this.removeFileBackground();
        const table = new JTTable({
            class: 'os-document-filter-table full-width',
        });
        for (const group of this.homeGrouping) {
            const row = table.addBodyRow();
            const span = createDocumentElement('span', {
                textContent: group.title,
                style: 'font-weight: bold;font-size: larger;font-style: italic; letter-spacing: -1px;',
            });
            row.add(span);
            for (const magicid of group.children) {
                this.processHomeNode(magicid, table);
            }
        }
        const genTable = table.generate();
        genTable.style.zIndex = '1';
        elem.appendChild(genTable);
        this.setBreadcrumbs([]);
    }

    private loadedElements: BTGlobalTreeMagicNodeInfo[];

    /**
     * Append a dump of elements to the current UI
     * @param items Items to append
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     */
    public appendElements(
        items: BTGlobalTreeMagicNodeInfo[],
        parentNode: BTGlobalTreeNodeInfo,
        teamroot: BTGlobalTreeNodeInfo,
        subsetConfigurables: boolean,
        accessId: string
    ): void {
        // Figure out where we are to add the entries
        let container = this.getFileListContainer();
        const dumpDiv = container.parentElement;
        dumpDiv.onmousedown = (event) => {
            if (event.button !== 0) return;
            this.boxSelectStart(event.clientX, event.clientY);
        };
        dumpDiv.onmousemove = (event) => {
            if (event.button !== 0) return;
            if (this.boxSelectUpdate(event.clientX, event.clientY)) {
                event.preventDefault();
            }
        };
        dumpDiv.onmouseup = (event) => {
            if (event.button !== 0) return;
            if (this.boxSelectEnd(dumpDiv.offsetTop - dumpDiv.scrollTop))
                event.preventDefault();
        };
        // Iterate over all the items
        const containerBackground = this.getFileBackground();
        containerBackground.oncontextmenu = (event) => {
            event.preventDefault();
            let rect = new DOMRect(
                event.clientX,
                event.clientY,
                (containerBackground.clientWidth / 3) * 2,
                0
            );
            this.showActionMenu(undefined, parentNode, rect);
            this.hidePopup();
        };

        if (this.loaded == 0) this.loadedElements = [];

        items.map((item) => {
            const itemInfo = item as BTDocumentSummaryInfo;
            // Have we hit the limit?  If so then just skip out
            if (this.loaded >= this.loadedlimit) {
                return;
            }
            // Count another entry output
            this.loaded++;
            this.loadedElements.push(item);
            ///
            // <table class="os-documents-list os-items-table full-width"><tbody>
            // <tr class="os-item-row os-document-in-list">
            // <td class="os-documents-thumbnail-column os-document-folder-thumbnail-column document-item"><svg class="os-svg-icon folder-list-icon"><use href="#svg-icon-folder"></use></svg></td>
            // <td class="os-document-name document-item">Visor - John Toebes</td></tr></tbody></table>
            ////
            const libraryName = this.libraries.decodeLibraryName(item.name);
            if (libraryName !== item.name) {
                if (item.name.indexOf('︴raw') !== -1) return;
                item.jsonType = 'proxy-library'; //just make sure
                item.isContainer = true; //also to make sure
                item.name = libraryName; //so it renders correctly
            }

            const lastLoaded = this.loaded;
            const rowContainer = createDocumentElement('div', {
                style: 'user-select:none',
            });
            rowContainer['document-id'] = item.id;
            rowContainer['jsonType'] = item.jsonType;

            let rowelem = createDocumentElement('div', {
                class: 'document-version-item-row select-item-dialog-item-row os-selectable-item',
            });
            rowContainer.appendChild(rowelem);

            let selectable = true;
            if (itemInfo.permissionSet !== undefined) {
                if (itemInfo.permissionSet.indexOf('LINK') === -1) {
                    selectable = false;
                    classListAdd(rowelem, 'select-item-disabled-item');
                }
            }

            let iconCol = createDocumentElement('div', {
                class: 'os-thumbnail-image',
            });
            let img = undefined;
            if (item.jsonType === 'team-summary') {
                img = createSVGIcon('svg-icon-team', 'folder-list-icon');
            } else if (
                item.jsonType === 'document-summary' ||
                this.globalLibrariesNodes.indexOf(item.id) !== -1
            ) {
                // It has an image, so request the thumbnail to be loaded for it
                img = this.onshape.createThumbnailImage(itemInfo);
                img.classList.add('os-thumbnail-image');
                img.setAttribute('draggable', 'false');
                img.setAttribute('alt', 'Thumbnail image for a document.');
                img.ondragstart = (_ev) => {
                    return false;
                };
            } else if (item.jsonType === 'proxy-library') {
                img = createSVGIcon('svg-icon-library', 'folder-list-icon');
            } else if (item.isContainer) {
                // if item is container
                img = createSVGIcon('svg-icon-folder', 'folder-list-icon');
            }
            if (img !== undefined) {
                iconCol.appendChild(img);
            }
            rowelem.appendChild(iconCol);

            // Document Name
            const docName = createDocumentElement('span', {
                class: 'select-item-dialog-document-name document-version-picker-document-item',
                textContent: item.name,
            });

            let textCol = createDocumentElement('div', {
                class: 'select-item-dialog-document-name-box os-col',
            });
            textCol.appendChild(docName);
            rowelem.appendChild(textCol);

            if (item.jsonType === 'no-content') {
                selectable = false;
                container.appendChild(rowContainer);
                rowelem.style.justifyContent = 'center';
                rowelem.style.cursor = 'default';
                rowelem.style.marginTop = '10%';
                rowelem.style.userSelect = 'none';
                rowelem.classList.remove('os-selectable-item');
                return;
            }

            if(item.jsonType === 'notification'){
                rowelem.style.justifyContent = 'center';
                rowelem.style.cursor = 'default';
                rowelem.style.marginTop = '2%';
                docName.style.textWrap = 'auto'
                selectable = false;
            }

            if (item.jsonType !== 'proxy-folder') {
                rowelem.onmouseover = (e) => {
                    waitForTooltip(
                        rowelem,
                        () => {
                            if (this.getActionMenuVisible()) return;
                            let rect = rowelem.getBoundingClientRect();
                            this.showPopup(item, rect);
                        },
                        () => {
                            this.hidePopup();
                        }
                    );
                };
            }
            if (selectable) {
                rowelem.oncontextmenu = (event) => {
                    event.preventDefault();
                    let rect = rowelem.getBoundingClientRect();
                    this.showActionMenu(itemInfo, parentNode, rect);
                    this.hidePopup();
                };
                if (item.isContainer) {
                    rowelem.onclick = () => {
                        this.gotoFolder(item, teamroot);
                    };
                } else if (item.jsonType === 'document-summary') {
                    rowelem.onclick = () => {
                        this.hidePopup();
                        this.hideActionMenu();
                        this.checkInsertItem(
                            itemInfo,
                            lastLoaded,
                            rowContainer,
                            true,
                            accessId
                        );
                    };
                }
            }

            container.appendChild(rowContainer);

            if (subsetConfigurables === true && item.jsonType === 'document-summary') {
                // The configurables should be rendered as subsets to the document
                this.checkRenderConfig(itemInfo).then((res) => {
                    if (res !== undefined) {
                        // rowContainer.className = "y-overflow"
                        rowelem.onclick = () => {};
                        this.showItemChoices(
                            item,
                            res,
                            item,
                            lastLoaded,
                            rowContainer,
                            false,
                            true
                        );
                    }
                });
            }
        });
    }
    /**
     * Finds the documents background the context menu to be linked to.
     * If one doesn't already exist it will add it in the proper place.
     * @returns Element behind the row entires
     */
    public getFileBackground(): HTMLElement {
        let container = document.getElementById('background');
        if (container === null) {
            container = createDocumentElement('div', {
                style: 'position:absolute;left:0px;top:0px;width:100%;height:100%;z-index:0;',
                id: 'background',
            });
            const dump = document.getElementById('dump');
            dump.append(container);
        }
        container.onclick = (event) => {
            container.remove();
            event.preventDefault();
            //Maybe they are trying to click something behind background
        };

        container.style.top = container.parentElement.offsetTop + 'px';
        return container;
    }

    public removeFileBackground() {
        let container = document.getElementById('background');
        if (container === null) return;
        container.remove();
    }

    /**
     * Finds the documents container to append entries to.  If one doesn't
     * already exist it will add it in the proper place.
     * @returns Table to append entries to
     */
    public getFileListContainer(): HTMLElement {
        let container = document.getElementById('glist');
        if (container === null) {
            container = createDocumentElement('div', {
                style: 'position:relative;width:90%;z-index:1', // allow for blank context menu on right
                class: 'os-documents-list full-width document-version-picker-section document-version-picker-document-list select-item-dialog-subdialog-content',
                id: 'glist',
            });
            const appelement = this.getAppElement();
            appelement.append(container);
        }
        return container;
    }
    /**
     * Get the element that represents the main container for the application
     * @returns HTMLElement for top of application
     */
    public getAppElement(): HTMLElement {
        let appelement = document.getElementById('app');
        // If for some reason we lost the place it is supposed to go, just append to the body
        if (appelement === null) {
            appelement = document.body;
        }
        return appelement;
    }
    /**
     *
     * @param item
     */
    public showPopup(item: BTGlobalTreeMagicNodeInfo, rect: DOMRect): void {
        const popup = document.getElementById('docinfo');
        if (popup !== null) {
            const itemInfo = item as BTDocumentSummaryInfo;
            // TODO: Move popup above item if it doesn't fit below
            popup.style.left = String(rect.left) + 'px';
            popup.style.top = String(rect.bottom) + 'px';
            popup.style.width = String(rect.width) + 'px';
            popup.style.maxWidth = String(rect.width) + 'px';
            let modifiedby = '';
            if (
                item.modifiedBy !== null &&
                item.modifiedBy !== undefined &&
                item.modifiedBy.name !== null &&
                item.modifiedBy.name !== undefined
            ) {
                modifiedby = item.modifiedBy.name;
            }
            let modifieddate = '';
            if (item.modifiedAt !== null && item.modifiedAt !== undefined) {
                modifieddate = item.modifiedAt.toLocaleString();
            }
            let ownedBy = '';
            if (
                item.owner !== null &&
                item.owner !== undefined &&
                item.owner.name !== null &&
                item.owner.name !== undefined
            ) {
                ownedBy = item.owner.name;
            }
            let createddate = '';
            if (item.createdAt !== null && item.createdAt !== undefined) {
                createddate = item.createdAt.toLocaleString();
            }
            let permissions = '';

            if (itemInfo.permissionSet !== undefined) {
                permissions = '[' + itemInfo.permissionSet.join(', ') + ']';
            }

            this.setElemText('docinfo_name', item.name);
            this.setElemText('docinfo_desc', item.description ?? '');
            // TODO: Reenable the div in the app.css when this gets working
            this.setElemText('docinfo_loc', 'LOCATION TBD');
            this.setElemText('docinfo_owner', ownedBy);
            this.setElemText('docinfo_datecreate', createddate);
            this.setElemText('docinfo_lastmod', modifieddate);
            this.setElemText('docinfo_modifier', modifiedby);
            this.setElemText('docinfo_permissions', permissions);
            popup.style.display = 'block';
        }
    }
    /**
     * Fill in the text content of an element
     * @param id ID of element to update
     * @param content Text content for element
     */
    setElemText(id: string, content: string) {
        const elem = document.getElementById(id);
        if (elem !== null) {
            elem.textContent = content;
        }
    }
    public hidePopup(): void {
        const popup = document.getElementById('docinfo');
        if (popup !== null) {
            popup.style.display = 'none';
        }
    }
    /**
     * Create the popup infrastructure for the file information
     * @param parent Place to put popup DOM element
     */
    public createPopupDialog(parent: HTMLElement): void {
        const popoverMainDiv = createDocumentElement('div', {
            id: 'docinfo',
            class: 'popover popup bs-popover-bottom',
            style: 'display:none',
        });
        popoverMainDiv.innerHTML = `<div class="popover-body">
            <div id="docinfo_name" class="popname"></div>
            <div id="docinfo_desc" class="popdesc"></div>
            <div class="poplocdiv">
               <span class="popttl">Location: </span>
               <span id="docinfo_loc" class="poploc">LOCATION TBD</span>
            </div>
            <div class="popusergrp">
               <strong>Owner:</strong> <span id="docinfo_owner"></span> created on <span id="docinfo_datecreate"></span>
            </div>
            <div class="popusergrp">
               <strong>Modified:</strong> <span id="docinfo_lastmod"></span> by <span id="docinfo_modifier"></span>
            </div>
            <div class="poppermit">
               <strong>Permissions:</strong> <span id="docinfo_permissions" class="popperm">LOCATION TBD</span>
            </div>
         </div>`;

        parent.appendChild(popoverMainDiv);
    }

    public createFreeUserInfo(parent: HTMLElement): void {
        const bannerDiv = createDocumentElement('div', {
            // class:
            id: 'freeuserbanner',
        });
        const bannerButton = createDocumentElement('button', {
            textContent: '⚠Free User⚠',
            class: 'btn btn-secondary',
        });
        bannerDiv.appendChild(bannerButton);

        bannerButton.addEventListener('click', () => {
            this.showFreeUserInfo();
        });

        const popupMainDiv = createDocumentElement('div', {
            id: 'freeuserpopup',
            class: 'popover popup bs-popover-bottom',
            style: 'width:95%border:none;display:none;',
        });

        const popupDiv = createDocumentElement('div', {
            class: 'context-menu-list contextmenu-list list-has-icons context-menu-root',
        });

        const popupTopDiv = createDocumentElement('div', {
            // style: 'width:100%;height:10%',
            class: 'document-panel-header',
        });
        const popupTopTitle = createDocumentElement('div', {
            class: 'document-panel-header-title',
            textContent: 'Free User Information',
        });
        popupTopDiv.appendChild(popupTopTitle);
        const popupTopRight = createDocumentElement('div', {
            class: 'os-row os-pin-right os-align-center',
        });
        const popupHideButton = createSVGIcon('svg-icon-close-x');
        popupHideButton.classList.add('document-panel-close');

        popupHideButton.addEventListener('click', () => {
            this.hideFreeUserInfo();
        });
        popupTopRight.appendChild(popupHideButton);
        popupTopDiv.appendChild(popupTopRight);

        const popupTextDiv = createDocumentElement('div', {
            // style: 'width:100%;height:90%',
            class: 'document-panel-main-content',
        });
        const popupTextP = createDocumentElement('p', {
            style: 'margin-left:5px',
            textContent:
                "Your Onshape Account is on the free plan and doesn't have the ability to create private documents. Your preferences file and any library you make will be public. ",
        });
        popupTextDiv.appendChild(popupTextP);

        popupDiv.appendChild(popupTopDiv);
        popupDiv.appendChild(popupTextDiv);

        popupMainDiv.appendChild(popupDiv);

        parent.insertBefore(popupMainDiv, parent.firstChild);
        parent.insertBefore(bannerDiv, parent.firstChild);
    }

    public showFreeUserInfo(): void {
        const popup = document.getElementById('freeuserpopup');
        const banner = document.getElementById('freeuserbanner');
        if (popup && banner) {
            popup.style.display = 'block';
            popup.style.top = banner.clientTop + banner.clientHeight + 'px';
            popup.style.width = '95%';
            popup.style.border = 'none';
        }
    }
    public hideFreeUserInfo(): void {
        const popup = document.getElementById('freeuserpopup');
        if (popup) popup.style.display = 'none';
    }

    /**
     *
     * @param item
     */
    public showActionMenu(
        item: BTGlobalTreeNodeMagicDataInfo,
        parentNode: BTGlobalTreeNodeInfo,
        rect: DOMRect
    ): void {
        const actionMenu = document.getElementById('docactionmenu');
        if (actionMenu != undefined) {
            // TODO: Same as popup, Move actionMenu above item if it doesn't fit below
            const actionMenuWidth = Math.max(300, rect.width);
            actionMenu.style.left = String(rect.left) + 'px';
            actionMenu.style.top = String(rect.bottom) + 'px';
            actionMenu.style.width = String(actionMenuWidth) + 'px';
            actionMenu.style.maxWidth = String(Math.max(300, rect.width)) + 'px';
            const actionMenuDiv = actionMenu.firstChild as HTMLDivElement;

            //Move actionMenu into view
            actionMenu.style.display = 'block';
            this.updateActionMenuTransforms();
            actionMenu.style.display = 'none';
            //Prune seperators
            actionMenuDiv.childNodes.forEach((elem) => {
                if (
                    elem['className'] ===
                    'context-menu-item context-menu-separator not-selectable'
                ) {
                    actionMenuDiv.removeChild(elem);
                }
            });

            const backgroundMenu = item === undefined || item === null;
            const multiSelect = item != null && item.jsonType === 'document-summaries';

            let availableOptions = 0;

            for (const id in this.actionMenuOptions) {
                const option = this.actionMenuOptions[id] as actionMenuOptionInfo;
                const optionId = 'docactionmenu_' + option.name;
                const optionElement = document.getElementById(optionId);
                optionElement.parentElement.style.display = 'inherit';

                let inputDiv: HTMLElement;
                let submitElement: HTMLButtonElement;
                let proxyLibrary: BTGlobalTreeNodeInfo;
                for (let crumb of this.currentBreadcrumbs) {
                    if (crumb.jsonType === 'proxy-library') {
                        proxyLibrary = crumb;
                        break;
                    }
                }
                if(proxyLibrary == undefined && item.jsonType == "proxy-library")proxyLibrary = item;

                if (option.input !== undefined) {
                    inputDiv = document.getElementById(optionId + '_inputdiv');
                    new ResizeObserver(() => this.updateActionMenuTransforms()).observe(
                        inputDiv
                    );
                    submitElement = document.getElementById(
                        optionId + '_submit'
                    ) as HTMLButtonElement;
                }

                //makes sure user ownership status and permissions are right
                if (option.userOwned) {
                    if (
                        proxyLibrary &&
                        proxyLibrary.owner &&
                        proxyLibrary.owner.id !== this.onshape.userId &&
                        !(
                            proxyLibrary &&
                            proxyLibrary['permissionSet'] &&
                            (proxyLibrary['permissionSet'] as Array<String>).indexOf(
                                'WRITE'
                            ) != -1
                        )
                    ) {
                        optionElement.parentElement.style.display = 'none';
                        continue;
                    }
                }

                if (backgroundMenu) {
                    item = parentNode;
                    if (option.parentWithoutDocument === undefined) {
                        optionElement.parentElement.style.display = 'none';
                        continue;
                    } else if (option.parentWithoutDocument[0] !== 'any') {
                        //make sure the parent type is allowed
                        let correctPlacement = false;
                        option.parentWithoutDocument.forEach((allowedType) => {
                            if (
                                allowedType === parentNode.jsonType ||
                                allowedType === parentNode.id
                            )
                                correctPlacement = true;
                        });
                        if (!correctPlacement) {
                            optionElement.parentElement.style.display = 'none';
                            continue;
                        }
                    }
                    // } else if (multiSelect) {
                } else {
                    //item doesn't exist so we don't need to do these checks

                    //Make sure that items's type is allowed for this option
                    if (option.documentType && option.documentType[0] !== 'any') {
                        let correctPlacement = false;
                        option.documentType.forEach((allowedType) => {
                            if (allowedType === item.jsonType || allowedType === item.id)
                                correctPlacement = true;
                        });
                        if (!correctPlacement) {
                            optionElement.parentElement.style.display = 'none';
                            continue;
                        }
                    }

                    //exclude item's type if property is there
                    if (option.excludeParentType) {
                        let correctPlacement = true;
                        option.excludeParentType.forEach((excludeType) => {
                            if (
                                excludeType === parentNode.jsonType ||
                                excludeType === parentNode.id
                            )
                                correctPlacement = false;
                        });
                        if (!correctPlacement) {
                            optionElement.parentElement.style.display = 'none';
                            continue;
                        }
                    }

                    //Make sure that parentNode's type is allowed for this option
                    //Magic types can be vague and have their ids a better representation of what document
                    if (option.parentType && option.parentType[0] !== 'any') {
                        let correctPlacement = false;
                        option.parentType.forEach((allowedType) => {
                            if (
                                allowedType === parentNode.jsonType ||
                                allowedType === parentNode.id
                            )
                                correctPlacement = true;
                        });
                        if (!correctPlacement) {
                            optionElement.parentElement.style.display = 'none';
                            continue;
                        }
                    }
                }

                availableOptions++;

                switch (id) {
                    case 'NAME': {
                        if (item.jsonType === 'magic') {
                            //add random whitespaces so the x isn't covering the name
                            this.setElemText(
                                optionId,
                                this.magicInfo[item.id].label + ' '
                            );
                        } else {
                            this.setElemText(optionId, item.name + ' ');
                        }
                        break;
                    }
                    case 'OPEN': {
                        optionElement.onclick = () => {
                            window
                                .open(
                                    `https://cad.onshape.com/documents/${item.id}`,
                                    '_blank'
                                )
                                .focus();
                        };
                        break;
                    }
                    case 'FAVORITE': {
                        this.setElemText(optionId, 'Loading favorited status...');
                        this.preferences
                            .getAllOfMagicType('favorited')
                            .then((favoriteList: BTGlobalTreeNodeMagicDataInfo[]) => {
                                let favoriteItem: BTGlobalTreeNodeMagicDataInfo;

                                for (let i in favoriteList) {
                                    favoriteItem = favoriteList[i];
                                    if (
                                        favoriteItem.id === item.id &&
                                        favoriteItem.configuration === item.configuration
                                    ) {
                                        break;
                                    } else {
                                        favoriteItem = undefined;
                                    }
                                }

                                const itemFavorited = favoriteItem !== undefined;

                                const documentName =
                                    item.jsonType === 'document-summary'
                                        ? 'document'
                                        : 'folder';
                                const favoritedStatus = itemFavorited
                                    ? ['Remove', 'from']
                                    : ['Add', 'to'];
                                this.setElemText(
                                    optionId,
                                    `${favoritedStatus[0]} ${documentName} ${favoritedStatus[1]} favorites`
                                );

                                optionElement.onclick = () => {
                                    if (itemFavorited) {
                                        this.preferences.removeMagicNode(
                                            item,
                                            'favorited'
                                        );
                                    } else {
                                        this.preferences.addMagicNode(item, 'favorited');
                                    }
                                    this.hideActionMenu();
                                };
                            });
                        break;
                    }
                    case 'REPORT': {
                        optionElement.onclick = () => {
                            this.hideActionMenuOptionInputs();
                            window.open(
                                `mailto:inserttoolbugs@ftconshape.com?subject=Flaw in document: ${item.name}&body=Document ${item.name} (${item.id}) has a flaw.`,
                                '_blank'
                            );
                            this.hideActionMenu();
                        };
                        break;
                    }
                    case 'CLONELIB': {
                        optionElement.onclick = () => {
                            const infoTextId = '';
                            const inforep = new InformationReporter<{
                                pfolders: number;
                                tfolders: number;
                            }>(
                                { pfolders: 0, tfolders: 0 },
                                (info: { pfolders: number; tfolders: number }) => {
                                    this.setElemText(
                                        infoTextId,
                                        `
                                ${info.pfolders} folders proccessed of ${info.tfolders} discovered
                              `
                                    );
                                }
                            );
                            this.libraries.cloneProxyLibrary(item).then((library) => {
                                this.hideActionMenu();
                            });
                        };

                        break;
                    }
                    case 'ADDLIB': {
                        this.setElemText(optionId, 'Loading library status...');
                        this.preferences
                            .getAllOfMagicType('library')
                            .then((libraryList: BTGlobalTreeNodeMagicDataInfo[]) => {
                                let libraryItem: BTGlobalTreeNodeMagicDataInfo;

                                for (let i in libraryList) {
                                    libraryItem = libraryList[i];
                                    if (libraryItem.id === item.id) {
                                        break;
                                    } else {
                                        libraryItem = undefined;
                                    }
                                }

                                const itemInLibrary = libraryItem !== undefined;
                                const libraryStatus = itemInLibrary
                                    ? ['Remove', 'from']
                                    : ['Add', 'to'];
                                this.setElemText(
                                    optionId,
                                    `${libraryStatus[0]} library ${libraryStatus[1]} My Libraries`
                                );

                                optionElement.onclick = () => {
                                    if (itemInLibrary) {
                                        this.preferences.removeMagicNode(item, 'library');
                                    } else {
                                        this.libraries
                                            .getProxyLibrary(undefined, item.id)
                                            .then((res) => {
                                                item['elementId'] = res.library.elementId;
                                                item['wvmid'] = res.library.wvmid;
                                                this.preferences.addMagicNode(
                                                    item,
                                                    'library'
                                                );
                                            });
                                    }
                                    this.hideActionMenu();
                                };
                            });
                        break;
                    }
                    case 'CREATELIB': {
                        optionElement.onclick = () => {
                            this.hideActionMenuOptionInputs();
                            const inputElement = document.getElementById(
                                optionId + '_lib-name'
                            ) as HTMLInputElement;

                            inputDiv.style.display = 'flex';
                            submitElement.onclick = (e) => {
                                e.preventDefault();
                                this.setInProgress(true);
                                this.libraries
                                    .createProxyLibrary(
                                        // this.currentBreadcrumbs[0],
                                        undefined,
                                        inputElement.value
                                    )
                                    .then((library) => {
                                        this.preferences
                                            .addMagicNode(library, 'library')
                                            .then(() => {
                                                setTimeout(() => {
                                                    this.setInProgress(false);
                                                    this.gotoFolder(
                                                        this.currentBreadcrumbs[0]
                                                    );
                                                }, 3000);
                                            });
                                        this.hideActionMenu();
                                    });
                            };
                        };
                        break;
                    }
                    case 'CREATEPROXY': {
                        optionElement.onclick = () => {
                            this.hideActionMenuOptionInputs();
                            const inputProxyElement = document.getElementById(
                                optionId + '_proxy-name'
                            ) as HTMLInputElement;
                            inputDiv.style.display = 'flex';
                            submitElement.onclick = (e) => {
                                e.preventDefault();
                                if (inputProxyElement.value === '') {
                                    //alert user that input must be filled
                                    return;
                                }
                                //let libraryName: string, libraryId: string;
                                let libraryId: string;
                                let parent: BTGlobalTreeProxyInfo;
                                if (backgroundMenu) {
                                    if (parentNode.jsonType === 'proxy-library') {
                                        libraryId = parentNode.id;
                                    } else if (parentNode.jsonType === 'proxy-folder') {
                                        libraryId = parentNode.projectId;
                                    }
                                    parent = parentNode;
                                } else {
                                    if (item.jsonType === 'proxy-library') {
                                        libraryId = item.id;
                                    } else if (item.jsonType === 'proxy-folder') {
                                        libraryId = item.projectId;
                                        parent = item;
                                    }
                                }
                                // if (item.jsonType === 'proxy-library') {
                                //     libraryName = item.name;
                                // } else if (item.jsonType === 'proxy-folder') {
                                //     libraryId = item.projectId;
                                //     parent = item;
                                // } else {
                                //     console.error(
                                //         'WHOOPS, this should not have been an availble option'
                                //     );
                                // }
                                this.setInProgress();
                                this.libraries
                                    .getProxyLibrary(undefined, libraryId)
                                    .then((res) => {
                                        if (res !== undefined) {
                                            this.libraries
                                                .createProxyFolder(
                                                    res.library,
                                                    {
                                                        jsonType: '',
                                                        name: inputProxyElement.value,
                                                    },
                                                    parent
                                                )
                                                .then(() => {
                                                    this.setInProgress(false);
                                                    this.gotoFolder(
                                                        this.currentBreadcrumbs[0]
                                                    );
                                                    this.hideActionMenu();
                                                });
                                        } else {
                                            //alert user that library is invalid
                                        }
                                    });
                            };
                        };
                        break;
                    }
                    case 'ADDLIBDOC': {
                        optionElement.onclick = () => {
                            this.hideActionMenuOptionInputs();
                            const inputLibElement = document.getElementById(
                                optionId + '_lib-name'
                            ) as HTMLInputElement;
                            this.updateActionMenuLibraryOptions(inputLibElement.id);
                            inputDiv.style.display = 'flex';
                            submitElement.onclick = (e) => {
                                e.preventDefault();
                                if (inputLibElement.value === '') {
                                    //alert user that input must be filled
                                    return;
                                }
                                this.libraries.addNodeToProxyLibrary(
                                    item,
                                    undefined,
                                    inputLibElement.value
                                );
                                this.hideActionMenu();
                            };
                        };

                        break;
                    }
                    case 'RELIBDOC': {
                        optionElement.onclick = () => {
                            //item's parent is another proxy-folder
                            this.setInProgress(true);
                            this.libraries
                                .removeNodeFromProxyLibrary(
                                    item,
                                    undefined,
                                    this.currentBreadcrumbs[0].id // works for now, cheap fix
                                )
                                .then((res) => {
                                    this.setInProgress(false);
                                    this.gotoFolder(this.currentBreadcrumbs[0]);
                                    this.hideActionMenu();
                                });
                        };
                        break;
                    }
                    case 'ADDPROXYDOC': {
                        optionElement.onclick = () => {
                            this.hideActionMenuOptionInputs();
                            const inputLibElement = document.getElementById(
                                optionId + '_lib-name'
                            ) as HTMLInputElement;
                            const inputProxyElement = document.getElementById(
                                optionId + '_proxy-name'
                            ) as HTMLInputElement;
                            this.preferences
                                .getAllOfMagicType('library')
                                .then((libraries) => {
                                    const libraryOptions: Array<{
                                        id: string;
                                        label: string;
                                    }> = [];
                                    libraries.forEach((library) => {
                                        libraryOptions.push({
                                            id: library.id,
                                            label: library.name,
                                        });
                                        this.updateActionMenuInputOptions(
                                            inputLibElement.id,
                                            libraryOptions
                                        );
                                    });
                                });
                            inputLibElement.onchange = () => {
                                const libraryId = inputLibElement.value;
                                this.libraries
                                    .getProxyLibrary(undefined, libraryId, true)
                                    .then((library) => {
                                        const descendants = library.descendants;
                                        if (!descendants) return;
                                        const folderOptions: Array<{
                                            id: string;
                                            label: string;
                                        }> = [];
                                        descendants.forEach((descendant) => {
                                            folderOptions.push({
                                                id: descendant.id,
                                                label: descendant.name,
                                            });
                                        });
                                        this.updateActionMenuInputOptions(
                                            inputProxyElement.id,
                                            folderOptions
                                        );
                                    });
                            };
                            inputDiv.style.display = 'flex';
                            submitElement.onclick = (e) => {
                                e.preventDefault();
                                if (
                                    inputLibElement.value === '' ||
                                    inputProxyElement.value === ''
                                ) {
                                    //alert user that input must be filled
                                    return;
                                }
                                this.libraries
                                    .getProxyLibrary(undefined, inputLibElement.value)
                                    .then((res) => {
                                        if (res !== undefined) {
                                            this.libraries
                                                .addNodeToProxyFolder(item, res.library, {
                                                    jsonType: 'proxy-folder',
                                                    id: inputProxyElement.value,
                                                })
                                                .then(() => {
                                                    this.hideActionMenu();
                                                });
                                        } else {
                                            //alert user that library is invalid
                                        }
                                    });
                            };
                        };
                        break;
                    }
                    case 'REPROXYDOC': {
                        optionElement.onclick = () => {
                            this.libraries
                                .getProxyLibrary(
                                    undefined,
                                    this.currentBreadcrumbs[0].projectId
                                ) // works for now, cheap fix
                                .then((res) => {
                                    if (res !== undefined) {
                                        this.libraries
                                            .removeNodeFromProxyFolder(
                                                item,
                                                res.library,
                                                {
                                                    jsonType: 'proxy-folder',
                                                    id: this.currentBreadcrumbs[0].id, //works for now, cheap fix
                                                }
                                            )
                                            .then(() => {
                                                this.hideActionMenu();
                                            });
                                    }
                                });
                        };
                        break;
                    }
                    case 'DELPROXY': {
                        optionElement.onclick = () => {
                            if (
                                item.treeHref === undefined ||
                                item.treeHref === item.projectId
                            ) {
                                //item's parent is library
                                this.libraries
                                    .removeNodeFromProxyLibrary(
                                        item,
                                        undefined,
                                        item.projectId
                                    )
                                    .then(() => {
                                        this.hideActionMenu();
                                    });
                            } else {
                                //item's parent is another proxy-folder
                                this.libraries
                                    .getProxyLibrary(undefined, item.projectId)
                                    .then((res) => {
                                        if (res !== undefined) {
                                            this.libraries
                                                .removeNodeFromProxyFolder(
                                                    item,
                                                    res.library,
                                                    {
                                                        jsonType: 'proxy-folder',
                                                        id: item.treeHref,
                                                    }
                                                )
                                                .then(() => {
                                                    this.hideActionMenu();
                                                });
                                        }
                                    });
                            }
                        };
                        break;
                    }
                    case 'MOVEDOC':
                    case 'MOVEPROXY': {
                        optionElement.onclick = () => {
                            let selectedLibrary: BTGlobalTreeMagicNodeInfo;
                            const inputLibElement = document.getElementById(
                                optionId + '_lib-name'
                            ) as HTMLInputElement;
                            const inputProxyElement = document.getElementById(
                                optionId + '_proxy-name'
                            ) as HTMLInputElement;
                            this.updateActionMenuLibraryOptions(inputLibElement.id);
                            inputLibElement.onchange = () => {
                                selectedLibrary = undefined;
                                const libraryId = inputLibElement.value;
                                this.updateActionMenuFolderOptions(
                                    libraryId,
                                    inputProxyElement.id
                                ).then((library) => {
                                    selectedLibrary = library;
                                });
                            };
                            inputDiv.style.display = 'flex';
                            submitElement.onclick = (e) => {
                                this.setInProgress();

                                e.preventDefault();
                                if (inputLibElement.value === '') {
                                    //alert user that input must be filled
                                    return;
                                }
                                let proxyId = inputProxyElement.value;
                                if (proxyId === '') proxyId = undefined;
                                const promises = [];
                                promises.push(
                                    new Promise((resolve, reject) => {
                                        if (selectedLibrary !== undefined)
                                            return resolve(selectedLibrary);
                                        this.libraries
                                            .getProxyLibrary(
                                                undefined,
                                                item.projectId,
                                                false
                                            )
                                            .then((res) => {
                                                if (res !== undefined)
                                                    return resolve(res.library);
                                                resolve(undefined);
                                            });
                                    })
                                );
                                promises.push(
                                    new Promise((resolve, reject) => {
                                        this.libraries
                                            .getProxyLibrary(
                                                undefined,
                                                inputLibElement.value
                                            )
                                            .then((res) => {
                                                if (
                                                    res === undefined ||
                                                    res.library === undefined
                                                )
                                                    return resolve(undefined);
                                                resolve(res.library);
                                            });
                                    })
                                );
                                Promise.all(promises).then((res) => {
                                    if (res !== undefined) {
                                        const library = res[0];
                                        const newLibrary = res[1];
                                        if (
                                            library === undefined ||
                                            newLibrary === undefined ||
                                            item.id === proxyId
                                        ) {
                                            console.warn(res);
                                            this.setInProgress(false);
                                        }
                                        this.libraries
                                            .moveProxyNode(
                                                item,
                                                library,
                                                {
                                                    jsonType: 'proxy-folder',
                                                    id: proxyId || newLibrary.id,
                                                },
                                                newLibrary
                                            )
                                            .then(() => {
                                                this.setInProgress(false);
                                                this.hideActionMenu();
                                                this.gotoFolder(
                                                    this.currentBreadcrumbs[0]
                                                );
                                            });
                                    } else {
                                        console.warn(res);
                                        this.setInProgress(false);
                                        //alert user that library is invalid
                                    }
                                });
                            };
                        };
                        break;
                    }
                    case 'CLONEFOLDER': {
                        optionElement.onclick = () => {
                            this.setInProgress();
                            const infoTextElement = createDocumentElement('span', {
                                class: 'context-menu-item',
                                style: 'padding:0px;',
                            });
                            optionElement.appendChild(infoTextElement);
                            let infoRep: any;
                            infoRep = new InformationReporter<{
                                pfolders: number;
                                tfolders: number;
                                status: string;
                            }>(
                                { pfolders: 0, tfolders: 0, status: '' },
                                (info: {
                                    pfolders: number;
                                    tfolders: number;
                                    status: string;
                                }) => {
                                    if (info.status === 'Copy files') {
                                        infoTextElement.innerText = `
                                    🞄 ${info.pfolders}/${info.tfolders} folders processed
                              `; //${info.pfolders} folders proccessed of ${info.tfolders} discovered
                                    } else {
                                        infoTextElement.innerText = '\n🞄 ' + info.status;
                                    }
                                }
                            );
                            this.libraries
                                .createLibraryFromFolder(item, infoRep)
                                .then((library) => {
                                    optionElement.removeChild(infoTextElement);
                                    this.preferences.addMagicNode(library, 'library');
                                    this.hideActionMenu();
                                    this.setInProgress(false);
                                });
                        };
                        break;
                    }
                    case 'BUILDDESC':
                        {
                            optionElement.onclick = () => {
                                this.libraries.refactorProxyLibrary(item).then(() => {
                                    console.log('refactoring done');
                                    this.hideActionMenu();
                                });
                            };
                        }
                        break;
                    case 'SCANDELTA': {
                        optionElement.onclick = () => {
                            this.setInProgress();
                            const infoTextElement = createDocumentElement('span', {
                                class: 'context-menu-item',
                                style: 'padding:0px;',
                            });
                            optionElement.appendChild(infoTextElement);
                            let infoRep: any;
                            infoRep = new InformationReporter<{
                                folders: number;
                                additions: number;
                                status: string;
                            }>(
                                { folders: 0, additions: 0, status: '' },
                                (info: {
                                    folders: number;
                                    additions: number;
                                    status: string;
                                }) => {
                                    if (info.status === 'Scanning folders') {
                                        infoTextElement.innerText = `
                                    🞄 ${info.folders} folders processed
                                    🞄 ${info.additions} additions found
                              `;
                                    } else {
                                        infoTextElement.innerText = '\n🞄 ' + info.status;
                                    }
                                }
                            );
                            this.libraries
                                .scanLibraryDelta(item, infoRep)
                                .then((deltaLibrary: BTGlobalTreeNodeInfo) => {
                                    if (
                                        deltaLibrary === undefined ||
                                        deltaLibrary === null
                                    ) {
                                        deltaLibrary = undefined;
                                    } else {
                                        this.preferences.addMagicNode(
                                            deltaLibrary,
                                            'library'
                                        );
                                    }
                                    console.log('Scanning ended');
                                    //setTimeout so user can see status
                                    setTimeout(() => {
                                        optionElement.removeChild(infoTextElement);
                                        this.hideActionMenu();
                                        this.setInProgress(false);
                                        if (deltaLibrary !== undefined)
                                            this.gotoFolder(deltaLibrary);
                                    }, 1000);
                                })
                                .catch((error) => {
                                    console.warn(error);
                                });
                        };
                        break;
                    }
                    case 'INSERTALL': {
                        optionElement.onclick = () => {
                            this.setInProgress();
                            this.lockInProgress();
                            const promises: Promise<void>[] = [];
                            this.selectedItems.forEach((item) => {
                                promises.push(
                                    // new Promise((resolve) => {
                                    this.quickInsertItem(item as BTDocumentSummaryInfo) //;
                                    // })
                                );
                            });
                            setTimeout(() => {
                                //in case of failed insertions that cannot be caught
                                if (!this.inProgressLocked) return;
                                this.lockInProgress(false);
                                this.setInProgress(false);
                                this.hideActionMenu();
                            }, 6000);
                            Promise.all(promises).then(() => {
                                this.lockInProgress(false);
                                this.setInProgress(false);
                                this.hideActionMenu();
                            });
                        };
                        break;
                    }
                    case 'DOCHISTORY': {
                        optionElement.onclick = () => {
                            const infoTextElement = createDocumentElement('span', {
                                class: 'context-menu-item',
                                style: 'padding:0px;',
                            });
                            optionElement.appendChild(infoTextElement);
                            let infoRep: any;
                            infoRep = new InformationReporter<{
                                found: number;
                                processed: number;
                                changesIndexed: number;
                                status: string;
                            }>(
                                { found: 0, processed: 0, changesIndexed: 0, status: '' },
                                (info: {
                                    found: number;
                                    processed: number;
                                    changesIndexed: number;
                                    status: string;
                                }) => {
                                    if (info.status === 'Fetching Changes') {
                                        infoTextElement.innerText = `
                                      🞄 ${info.processed}/${info.found} chunks of changes processed
                                      🞄 ${info.changesIndexed} changes indexed`;
                                    } else {
                                        infoTextElement.innerText = '\n🞄 ' + info.status;
                                    }
                                }
                            );
                            this.getDocumentChangesHistory(item.id, infoRep).then(
                                (documentChanges) => {
                                    if (
                                        documentChanges == undefined ||
                                        documentChanges.length === 0
                                    )
                                        return;
                                    let data = 'data:text/csv;charset=utf-8,';
                                    for (let change of documentChanges) {
                                        data += `${change.versionName},${change.username},${change.date}\n`;
                                    }
                                    //https://stackoverflow.com/a/14966131
                                    var encodedUri = encodeURI(data);
                                    var link = document.createElement('a');
                                    link.setAttribute('href', encodedUri);
                                    link.setAttribute(
                                        'download',
                                        `${item.name}_DocumentHistory.csv`
                                    );
                                    document.body.appendChild(link);

                                    link.click();

                                    optionElement.removeChild(infoTextElement);
                                    this.hideActionMenu();
                                }
                            );
                        };
                    }
                }

                if (id !== 'NAME') {
                    // optionElement.parentElement.onmouseover = () => {
                    //     optionElement.parentElement.className = 'context-menu-item hover';
                    // };
                    // optionElement.parentElement.onmouseleave = () => {
                    //     optionElement.parentElement.className = 'context-menu-item';
                    // };
                    //Add seperators back
                    actionMenuDiv.insertBefore(
                        createDocumentElement('li', {
                            class: 'context-menu-item context-menu-separator not-selectable',
                        }),
                        optionElement.parentElement
                    );
                }
            }
            // document.getElementById('docactionmenu_close').onclick = () => {
            //     this.hideActionMenu();
            // };

            document.getElementById('docactionmenu_no-options').style.display =
                availableOptions > 0 ? 'none' : 'flex';

            if (
                actionMenuDiv.lastChild['className'] ===
                'context-menu-item context-menu-separator not-selectable'
            ) {
                actionMenuDiv.removeChild(actionMenuDiv.lastChild);
            }

            actionMenu.style.display = 'block';
        }
    }

    public updateActionMenuTransforms(): void {
        const actionMenu = document.getElementById('docactionmenu');
        if (actionMenu == undefined) return;
        const actionMenuDiv = actionMenu.firstChild as HTMLDivElement;
        if (actionMenuDiv == undefined) return;

        const actionMenuRect = actionMenuDiv.getBoundingClientRect();
        if (actionMenuRect.left < 0) actionMenu.style.left = '0px';
        if (actionMenuRect.right > document.body.clientWidth)
            actionMenu.style.left =
                String(document.body.clientWidth - actionMenuDiv.clientWidth - 2) + 'px';
        if (actionMenuRect.top < 0) actionMenu.style.top = '0px';
        if (actionMenuRect.bottom > document.body.clientHeight)
            actionMenu.style.top =
                String(document.body.clientHeight - actionMenuRect.height - 2) + 'px';
    }

    public updateActionMenuInputOptions(
        id: string,
        list: Array<{ id: string; label: string }>
    ): void {
        const inputSelectElement = document.getElementById(id);
        if (inputSelectElement === undefined || inputSelectElement === null) return;
        inputSelectElement.innerHTML = '';
        inputSelectElement.appendChild(
            createDocumentElement('option', { innerHTML: 'Select One' })
        );
        list.forEach((input) => {
            const inputElementOption = createDocumentElement('option', {
                value: input.id,
                innerHTML: input.label,
            });
            inputElementOption.innerHTML = input.label;
            inputSelectElement.appendChild(inputElementOption);
        });
    }
    public hideActionMenu(): void {
        const actionMenu = document.getElementById('docactionmenu');
        if (actionMenu !== null) {
            actionMenu.style.display = 'none';
        }
        this.hideActionMenuOptionInputs();
        this.unselectItems();
    }
    public hideActionMenuOptionInputs(): void {
        const actionMenu = document.getElementById('docactionmenu');
        if (actionMenu !== null) {
            for (const id in this.actionMenuOptions) {
                const option = this.actionMenuOptions[id];
                const optionId = 'docactionmenu_' + option.name;

                if (option.input !== undefined) {
                    document.getElementById(optionId + '_inputdiv').style.display =
                        'none';
                    for (let input of option.input) {
                        const inputElement = document.getElementById(
                            'docactionmenu_' + option.name + '_' + input.name
                        ) as HTMLInputElement;
                        if (inputElement !== undefined) {
                            inputElement.value = '';
                        }
                    }
                }
            }
        }
    }
    public getActionMenuVisible(): boolean {
        if (document.getElementById('docactionmenu') !== undefined) {
            return document.getElementById('docactionmenu').style.display !== 'none';
        } else {
            return false;
        }
    }
    public createActionMenu(parent: HTMLElement): void {
        const actionMenuMainDiv = createDocumentElement('div', {
            id: 'docactionmenu',
            class: 'popover popup bs-popover-bottom',
            style: 'border:none;display:none;',
        });
        let actionMenuDiv = createDocumentElement('div', {
            class: 'context-menu-list contextmenu-list list-has-icons context-menu-root',
        });

        const closeActionMenu = createDocumentElement('li', {
            id: 'docactionmenu_close',
            class: 'context-menu-item',
            style: 'position:absolute;right:0px;top:0px;padding-right:3px;z-index:1;',
            textContent: '🞬',
        });
        closeActionMenu.onclick = () => {
            this.hideActionMenu();
        };
        actionMenuDiv.appendChild(closeActionMenu);

        for (const id in this.actionMenuOptions) {
            const option = this.actionMenuOptions[id];
            const actionMenuOptionList = createDocumentElement('li', {
                class: 'context-menu-item',
            });
            actionMenuOptionList.onmouseover = () => {
                actionMenuOptionList.className = 'context-menu-item hover';
            };
            actionMenuOptionList.onmouseleave = () => {
                actionMenuOptionList.className = 'context-menu-item';
            };
            const actionMenuOptionSpan = createDocumentElement('span', {
                id: 'docactionmenu_' + option.name,
                textContent: option.label,
            });
            if (option.deleteIcon === true) {
                const actionMenuOptionDeleteIcon = createDocumentElement('svg', {
                    class: 'context-menu-icon',
                    xmlns: 'http://www.w3.org/2000/svg',
                    innerHTML: '<use xlink:href="#svg-icon-clear-field-button"></use>',
                });
                actionMenuOptionList.appendChild(actionMenuOptionDeleteIcon);
            }
            actionMenuOptionList.appendChild(actionMenuOptionSpan);
            if (option.input !== undefined) {
                const actionMenuOptionInputParentDiv = createDocumentElement('div', {
                    id: 'docactionmenu_' + option.name + '_inputdiv',
                    style: 'display:none;flex-direction:column;',
                });
                for (let input of option.input) {
                    const actionMenuOptionInputDiv = createDocumentElement('div', {
                        // class:
                        style: 'flex-direction: row;align-items: flex-start;',
                    });
                    const actionMenuOptionInputLabel = createDocumentElement('label', {
                        textContent: input.label + ': ',
                        style: 'text-wrap: nowrap;',
                    });
                    actionMenuOptionInputDiv.appendChild(actionMenuOptionInputLabel);
                    if (input.type === 'text') {
                        const actionMenuOptionInputInput = createDocumentElement(
                            'input',
                            {
                                id: 'docactionmenu_' + option.name + '_' + input.name,
                                style: 'width: 5em;height: 1.5em;border: solid black 1px;border-top: 0px;border-left: 0px;border-right: 0px;outline: none;',
                            }
                        );
                        actionMenuOptionInputDiv.appendChild(actionMenuOptionInputInput);
                    } else if (input.type === 'select') {
                        const actionMenuOptionInputSelect = createDocumentElement(
                            'select',
                            {
                                id: 'docactionmenu_' + option.name + '_' + input.name,
                                style: 'width: 5em;height: 1.5em;border: solid black 1px;border-top: 0px;border-left: 0px;border-right: 0px;outline: none;',
                            }
                        );

                        actionMenuOptionInputDiv.appendChild(actionMenuOptionInputSelect);
                    }
                    actionMenuOptionInputParentDiv.appendChild(actionMenuOptionInputDiv);
                }
                const actionMenuOptionInputSubmit = createDocumentElement('button', {
                    id: 'docactionmenu_' + option.name + '_submit',
                    textContent: 'Enter',
                    style: 'border: solid gray 1px;background: rgb(232 232 232);',
                });
                actionMenuOptionInputParentDiv.appendChild(actionMenuOptionInputSubmit);
                actionMenuOptionList.appendChild(actionMenuOptionInputParentDiv);
            }
            switch (id) {
                case 'NAME': {
                    actionMenuOptionSpan.className += 'popname';
                    actionMenuOptionList.style.marginRight = '15px';
                    actionMenuOptionList.style.overflow = 'hidden';
                    actionMenuOptionList.style.paddingRight = '2px';
                    actionMenuOptionSpan.style.cssText = 'text-wrap:nowrap';
                    actionMenuOptionSpan.onmouseover = () => {};
                    actionMenuOptionSpan.onmouseleave = () => {};
                    break;
                }
                case '': {
                    break;
                }
            }
            actionMenuDiv.appendChild(actionMenuOptionList);
        }

        const noOptionsList = createDocumentElement('li', {
            id: 'docactionmenu_no-options',
            class: 'context-menu-item',
            textContent: 'No available options  ',
        });
        actionMenuDiv.appendChild(noOptionsList);

        actionMenuMainDiv.appendChild(actionMenuDiv);

        parent.appendChild(actionMenuMainDiv);
        this.hideActionMenu();
    }

    public updateActionMenuFolderOptions(
        libraryId: string,
        updateElementId: string
    ): Promise<BTGlobalTreeMagicNodeInfo> {
        return new Promise((resolve, reject) => {
            this.libraries.getProxyLibrary(undefined, libraryId, true).then((library) => {
                const descendants = library.descendants;
                if (!descendants) return;
                const folderOptions: Array<{
                    id: string;
                    label: string;
                }> = [];
                descendants.forEach((descendant) => {
                    folderOptions.push({
                        id: descendant.id,
                        label: descendant.name,
                    });
                });
                this.updateActionMenuInputOptions(updateElementId, folderOptions);
                resolve(library.library);
            });
        });
    }

    public updateActionMenuLibraryOptions(updateElementId: string): void {
        this.preferences.getAllOfMagicType('library').then((libraries) => {
            const libraryOptions: Array<{
                id: string;
                label: string;
            }> = [];
            libraries.forEach((library) => {
                libraryOptions.push({
                    id: library.id,
                    label: this.libraries.decodeLibraryName(library.name),
                });
            });
            this.updateActionMenuInputOptions(updateElementId, libraryOptions);
        });
    }

    // public renderActionMenuOptions(options: actionMenuOptionInfo[]) {}

    private selectedItems: BTGlobalTreeNodeInfo[] = [];
    private boxSelectActive: boolean = false;

    private setElementsUserSelect(selectable: boolean): void {
        const elementContainer = document.getElementById('glist');
        if (elementContainer == undefined) return;
        Array.from(elementContainer.children).forEach((child) => {
            if (selectable === true) {
                child.firstElementChild.classList.add('os-selectable-item');
            } else {
                child.firstElementChild.classList.remove('os-selectable-item');
            }
        });
    }

    private unselectItems(): void {
        this.selectedItems = [];

        const elementContainer = document.getElementById('glist');
        if (elementContainer == undefined) return;
        Array.from(elementContainer.children).forEach((child) => {
            (child.firstElementChild as HTMLDivElement).style.backgroundColor = '';
        });
    }

    private boxSelectStart(x: number, y: number) {
        const boxSelect = document.getElementById('boxselect');
        if (boxSelect == undefined) return;
        if (
            this.currentBreadcrumbs &&
            (this.currentBreadcrumbs.length === 0 ||
                (this.currentBreadcrumbs[0] &&
                    this.currentBreadcrumbs.length > 0 &&
                    this.currentBreadcrumbs[0].jsonType === 'home'))
        )
            return;

        const elementContainer = document.getElementById('glist');
        if (elementContainer == undefined) {
            boxSelect.style.display = 'none';
            return;
        }

        this.unselectItems();
        this.setElementsUserSelect(false);

        boxSelect['start-x'] = x;
        boxSelect['start-y'] = y;

        boxSelect.style.width = '0px';
        boxSelect.style.height = '0px';

        boxSelect.style.left = x + 'px';
        boxSelect.style.top = y + 'px';

        boxSelect.style.display = 'block';
        this.boxSelectActive = true;
    }

    private boxSelectUpdate(x: number, y: number): boolean {
        const boxSelect = document.getElementById('boxselect');
        if (boxSelect == undefined) return;
        if (boxSelect.style.display === 'none') return;

        const sx = boxSelect['start-x'],
            sy = boxSelect['start-y'];

        if (x > sx) {
            boxSelect.style.left = sx + 'px';
            boxSelect.style.width = x - sx + 'px';
        } else {
            boxSelect.style.left = x + 'px';
            boxSelect.style.width = sx - x + 'px';
        }
        if (y > sy) {
            boxSelect.style.top = sy + 'px';
            boxSelect.style.height = y - sy + 'px';
        } else {
            boxSelect.style.top = y + 'px';
            boxSelect.style.height = sy - y + 'px';
        }

        return true;
    }

    private boxSelectEnd(topOffset: number): boolean {
        this.setElementsUserSelect(true);

        const boxSelect = document.getElementById('boxselect');
        if (boxSelect == undefined) return;
        if (boxSelect.style.display === 'none') return;

        const width = boxSelect.offsetWidth;
        const height = boxSelect.offsetHeight;

        const elementContainer = document.getElementById('glist');
        if (elementContainer == undefined || width * height < 10) {
            boxSelect.style.display = 'none';
            return;
        }

        let upperB = boxSelect.offsetTop - topOffset;
        let lowerB = upperB + height;
        let leftB = boxSelect.offsetLeft;
        let rightB = leftB + width;

        this.selectedItems = [];
        const inRange: string[] = [];
        Array.from(elementContainer.children).forEach((child: HTMLDivElement) => {
            const top = child.offsetTop;
            const left = child.offsetLeft;

            if (
                top + child.offsetHeight < upperB ||
                left + child.offsetWidth < leftB ||
                top > lowerB ||
                left > rightB
            )
                return;

            const did = child['document-id'];
            const jsonType = child['jsonType'];
            if (did == undefined || jsonType == undefined) return;
            if (jsonType !== 'document-summary') return;

            (child.firstElementChild as HTMLDivElement).style.backgroundColor =
                'var(--os-hover-primary)';

            inRange.push(did);
        });

        this.loadedElements.forEach((elem) => {
            if (inRange.indexOf(elem.id) != -1) this.selectedItems.push(elem);
        });

        const rect = boxSelect.getBoundingClientRect();

        boxSelect.style.display = 'none';

        if (this.selectedItems.length > 0)
            this.showActionMenu(
                { jsonType: 'document-summaries' },
                this.currentBreadcrumbs[0],
                rect
            );

        return true;
    }

    private hideBoxSelect(): void {
        const boxSelect = document.getElementById('boxselect');
        if (boxSelect == undefined) return;
        boxSelect.style.display === 'none';
        this.unselectItems();
    }

    private createBoxSelect(parent: HTMLElement) {
        const boxSelect = createDocumentElement('div', {
            id: 'boxselect',
            class: 'popover popup bs-popover-bottom',
            style: 'border:none;display:none;background-color:rgba(178, 221, 246, 0.7);border: solid rgba(44, 165, 242 ,0.9) 1px;pointer-events:none;',
        });
        parent.appendChild(boxSelect);
    }

    /**
     * Get the elements in a document
     * @param documentId Document ID
     * @param workspaceId Workspace ID
     * @param elementId Specific element ID
     * @returns Array of BTDocumentElementInfo
     */

    public getDocumentElementInfo(
        documentId: string,
        workspaceId: string,
        elementId?: string
    ): Promise<BTDocumentElementInfo> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .getElementsInDocument({
                    did: documentId,
                    wvm: 'w',
                    wvmid: workspaceId,
                    elementId: elementId,
                })
                .then((val: BTDocumentElementInfo[]) => {
                    for (let elem of val) {
                        if (elem.id === this.elementId) {
                            resolve(elem);
                            return;
                        }
                    }
                    // We didn't find it, so return an empty structure
                    const result: BTDocumentElementInfo = {};
                    resolve(result);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    /**
     *
     * 1. Examine the document and determine if we can insert without prompting the user
     *    a. There is a parts studio tab with the same name as the main document with a single object on that tab
     *       (or one object named the same as the main document) and no configuration options for that object.
     *       If so, insert it
     *    b. If there is an assembly tab with the same name as the main document with no configuration options
     *       and we are inserting into an assembly, insert the entire assembly.
     *    c. If there is a single tab (only looking at Parts studios and Assemblies) parts studio
     *       with a single part with no configuration options, insert it
     *    d. If there is a single assembly (looking at parts studios/assemblies) with no configuration options
     *       and we are inserting into an assembly then insert the entire assembly
     *    e. If there are no (parts studios/assembly) tabs, give them a message about nothing to insert
     * 2. We know that we have to present them a choice of what to insert.
     *    Go through all the (part studios/assemblies) tabs
     *    [eliminate assemblies if we are inserting into a parts studio]
     *    to gather all that have at least one item in them
     *    a. Tabs that are assemblies count as a single item.
     *    b. For parts we only want actual parts/combined parts, not drawings, curves, surfaces
     *    c. For every part that is on a tab with a configuration, remember the configuration options
     *    d. For every assembly with a configuration, remember the configuration options
     *    e. Create an overlay dialog (leaving the underlying list of parts still loaded) that offers the options to choose to insert.
     *       If an item has configuration options, put them next to the part.
     *       The overlay dialog has a close button and doesn't auto close after inserting the part from the dialog.
     *  Ok that's the goal.  It that the insertables API does a good job of filtering for most of that in one call
     */
    /**
     * Find all potential items to insert.
     * @param item Document that we are trying to insert from
     * @param insertType The type of document that we are inserting into
     * @returns Array of InsertElementInfo entries so that the inserting code can make a descision
     */
    public async getInsertChoices(
        item: BTDocumentSummaryInfo,
        insertType: GBTElementType
    ): Promise<BTInsertableInfo[]> {
        return new Promise(async (resolve, _reject) => {
            let versionId: string = undefined;
            if (item.recentVersion !== null && item.recentVersion !== undefined) {
                versionId = item.recentVersion.id;
            }
            // If item.defaultWorkspace is empty or item.defaultWorkspace.id is null then we need to
            // call https://cad.onshape.com/glassworks/explorer/#/Document/getDocumentWorkspaces to get a workspace
            // for now we will assume it is always provided
            let wv = 'w';
            let wvid = '';
            if (versionId !== undefined) {
                wv = 'v';
                wvid = versionId;
            } else if (
                item.defaultWorkspace !== null &&
                item.defaultWorkspace !== undefined
            ) {
                wv = 'w';
                wvid = item.defaultWorkspace.id;
            }
            const parameters: GetInsertablesRequest = {
                did: item.id,
                wv: wv,
                wvid: wvid,
                includeParts: true,
                includeSurfaces: false,
                includeSketches: false,
                includeReferenceFeatures: false,
                includeAssemblies: true,
                includeFeatureStudios: true,
                includeBlobs: false,
                includePartStudios: true,
                includeFeatures: true,
                includeMeshes: false,
                includeWires: false,
                includeFlattenedBodies: false,
                includeApplications: false,
                includeCompositeParts: true,
                includeFSTables: false,
                includeFSComputedPartPropertyFunctions: false,
                includeVariables: false,
                includeVariableStudios: false,
            };

            let insertables = await this.onshape.documentApi.getInsertables(parameters);
            const result: BTInsertableInfo[] = [];
            let donotuseelement: BTInsertableInfo = undefined;
            const insertMap: { [key: string]: BTInsertableInfo } = {};
            const dropParents = new Map<string, Boolean>();
            while (insertables !== undefined && insertables.items.length > 0) {
                console.log(insertables);
                for (let element of insertables.items) {
                    if (
                        element.elementType === 'PARTSTUDIO' ||
                        (element.elementType === 'ASSEMBLY' &&
                            insertType === element.elementType) ||
                        element.elementType === 'FEATURESTUDIO'
                    ) {
                        let elementName = (element.elementName ?? '').toUpperCase();
                        let elementPartName = (element.partName ?? '').toUpperCase();

                        if (
                            elementName !== 'DO NOT USE ICON' &&
                            elementPartName.indexOf('LEGACY PART') < 0 &&
                            elementName.indexOf('LEGACY PART') < 0 //is this necessary?
                        ) {
                            // We want to save it
                            insertMap[element.id] = element;
                        } else {
                            // Save for the special case of the DO NOT USE ICON which would be the only object in the document
                            donotuseelement = element;
                        }
                        if (
                            elementPartName.indexOf('DO NOT USE THESE PARTS') >= 0 ||
                            elementPartName.indexOf('PARTS DO NOT USE') >= 0 ||
                            elementPartName.indexOf('DO NOT USE PARTS') >= 0 ||
                            elementName.indexOf('DO NOT USE THESE PARTS') >= 0 ||
                            elementName.indexOf('PARTS DO NOT USE') >= 0 ||
                            elementName.indexOf('DO NOT USE PARTS') >= 0
                        ) {
                            if (
                                element.parentId !== undefined &&
                                element.parentId !== null
                            ) {
                                dropParents[element.parentId] = true;
                            } else {
                                delete insertMap[element.id];
                            }
                        }
                    }
                }
                // If we are finished with the list return it
                if (insertables.next === undefined || insertables.next === null) {
                    insertables = undefined;
                } else {
                    insertables = (await this.onshape.OnshapeRequest(
                        insertables.next,
                        BTInsertablesListResponseFromJSON
                    )) as BTInsertablesListResponse;
                }
            }
            // We have built a map of all the options, now go through and prune any parents
            for (const id in insertMap) {
                const element = insertMap[id];
                if (
                    element !== undefined &&
                    element !== null &&
                    element.parentId !== undefined &&
                    element.parentId !== null
                ) {
                    insertMap[element.parentId] = undefined;
                }
            }
            for (const id in insertMap) {
                const element = insertMap[id];
                if (element !== undefined) {
                    if (!dropParents[element.parentId]) {
                        result.push(insertMap[id]);
                    }
                }
            }
            // Special case when we have a document with a do not use and it is the only thing, let them insert it
            if (result.length === 0 && donotuseelement !== undefined) {
                result.push(donotuseelement);
            }
            resolve(result);
        });
    }
    /**
     *
     * @param item Item to be checked for a version
     * @returns Updated document Summary with version identified
     */
    public resolveDocumentVersion(
        item: BTDocumentSummaryInfo
    ): Promise<BTDocumentSummaryInfo> {
        return new Promise((resolve, reject) => {
            // If we have a version in it, we can just resolve to use it
            if (
                item.recentVersion !== null &&
                item.recentVersion !== undefined &&
                item.recentVersion.id !== null &&
                item.recentVersion.id !== undefined
            ) {
                resolve(item);
            }
            this.onshape.documentApi
                .getDocumentVersions({ did: item.id })
                .then((versions) => {
                    if (versions.length > 0) {
                        const versionId = versions[versions.length - 1].id;
                        if (
                            item.recentVersion === undefined ||
                            item.recentVersion === null
                        ) {
                            item.recentVersion = { id: versionId };
                        } else {
                            item.recentVersion.id = versionId;
                        }
                    }
                    resolve(item);
                })
                .catch((err) => reject(err));
        });
    }
    /**
     * Checks if item is configurable.
     * @param item Item to check
     */
    public checkRenderConfig(
        itemRaw: BTDocumentSummaryInfo
    ): Promise<BTInsertableInfo[]> {
        return new Promise((resolve, reject) => {
            this.resolveDocumentVersion(itemRaw).then((item) => {
                this.getInsertChoices(
                    item,
                    this.targetDocumentElementInfo.elementType
                ).then((res) => {
                    const configurableItems: BTInsertableInfo[] = [];
                    res.forEach((item) => {
                        if (
                            res[0].configurationParameters !== undefined &&
                            res[0].configurationParameters !== null
                        ) {
                            configurableItems.push(item);
                        }
                    });
                    if (configurableItems.length > 0) {
                        resolve(configurableItems);
                    }
                    resolve(undefined);
                });
            });
        });
    }
    /**
     * Check if an item can be inserted or if we have to prompt the user for more choices.
     * @param item Item to check
     */
    public quickInsertItem(itemRaw: BTDocumentSummaryInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            this.resolveDocumentVersion(itemRaw).then((item) => {
                this.getInsertChoices(
                    item,
                    this.targetDocumentElementInfo.elementType
                ).then((res) => {
                    let itemToInsert = res[0];

                    if (res.length === 0) return resolve();

                    if (
                        res.length > 1 ||
                        itemToInsert.configurationParameters != null ||
                        itemToInsert.configurationParameterValues != null
                    ) {
                        //pick composite part to insert (if there is one)
                        res.forEach((elem) => {
                            if (elem.bodyType === 'COMPOSITE') {
                                itemToInsert = elem;
                                return;
                            }
                        });
                        this.findDeterministicPartId(itemToInsert)
                            .then(() => {
                                this.getMetaData(itemToInsert, '')
                                    .then(() => {
                                        this.insertToTarget(
                                            this.documentId,
                                            this.workspaceId,
                                            this.elementId,
                                            itemToInsert,
                                            undefined,
                                            itemRaw
                                        ).then(() => resolve());
                                    })
                                    .catch((err) => {
                                        this.insertToTarget(
                                            this.documentId,
                                            this.workspaceId,
                                            this.elementId,
                                            itemToInsert,
                                            undefined,
                                            itemRaw
                                        ).then(() => resolve());
                                    });
                            })
                            .catch((err) => {
                                this.insertToTarget(
                                    this.documentId,
                                    this.workspaceId,
                                    this.elementId,
                                    itemToInsert,
                                    undefined,
                                    itemRaw
                                ).then(() => resolve());
                            });
                    } else {
                        this.insertToTarget(
                            this.documentId,
                            this.workspaceId,
                            this.elementId,
                            itemToInsert,
                            undefined,
                            itemRaw
                        ).then(() => resolve());
                    }
                    // Perform an actual insert of an item. Note that we already know if we are
                    // going into a part studio or an assembly.
                    // const simpleItem = Object.assign({}, itemToInsert);
                    // const insertSimple = () => {
                    //     this.insertToTarget(
                    //         this.documentId,
                    //         this.workspaceId,
                    //         this.elementId,
                    //         simpleItem,
                    //         undefined,
                    //         itemRaw
                    //     ).then(() => resolve());
                    // };
                });
            });
        });
    }
    /**
     * Check if an item can be inserted or if we have to prompt the user for more choices.
     * @param item Item to check
     */
    public checkInsertItem(
        itemRaw: BTDocumentSummaryInfo,
        renderIndex: number,
        parentElement: HTMLElement,
        clearParentElement: boolean,
        accessId: string,
        simpleInsert?: boolean
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.resolveDocumentVersion(itemRaw).then((item) => {
                this.getInsertChoices(
                    item,
                    this.targetDocumentElementInfo.elementType
                ).then((res) => {
                    if (res.length === 0) {
                        // Nothing was insertable at all, so we just need to let them know that
                        if (this.targetDocumentElementInfo.elementType === 'PARTSTUDIO') {
                            this.getInsertChoices(item, 'ASSEMBLY').then((res) => {
                                if (res.length !== 0) {
                                    this.messaging.showMessageBubble(
                                        `Document: ${item.name} (${item.id}) only contains assembilies, so they cannot be inserted into the active partstudio`
                                    );
                                } else {
                                    this.messaging.showMessageBubble(
                                        `Nothing is insertable from document: ${item.name} (${item.id})`
                                    );
                                }
                            });
                        } else {
                            this.messaging.showMessageBubble(
                                `Nothing is insertable from document: ${item.name} (${item.id})`
                            );
                        }
                    } else if (res.length === 1) {
                        if (
                            simpleInsert !== true &&
                            res[0].configurationParameters !== undefined &&
                            res[0].configurationParameters !== null
                        ) {
                            this.showItemChoices(
                                item,
                                res,
                                itemRaw,
                                renderIndex,
                                undefined,
                                clearParentElement
                            );
                            resolve();
                        } else {
                            // Perform an actual insert of an item. Note that we already know if we are
                            // going into a part studio or an assembly.
                            this.insertToTarget(
                                this.documentId,
                                this.workspaceId,
                                this.elementId,
                                res[0],
                                undefined,
                                itemRaw
                            ).then(() => resolve());
                        }
                    } else if (simpleInsert !== true) {
                        this.showItemChoices(
                            item,
                            res,
                            itemRaw,
                            renderIndex,
                            undefined,
                            clearParentElement
                        );
                        resolve();
                    } else resolve();
                });
            });
        });
    }

    public getConfigValues(index: number): configInfo[] {
        const collection = document.getElementsByClassName(`cv${index}`);
        // const plist:BTMParameterReferenceWithConfiguration3028 = undefined;

        const result: configInfo[] = [];

        Array.from(collection).forEach((element) => {
            const elemtype = element.getAttribute('data-type');
            const elemid = element.getAttribute('data-id');
            const inputelem: HTMLInputElement =
                element instanceof HTMLInputElement
                    ? (element as HTMLInputElement)
                    : undefined;
            const selectelem: HTMLSelectElement =
                element instanceof HTMLSelectElement
                    ? (element as HTMLSelectElement)
                    : undefined;
            switch (elemtype) {
                case 'quantity': {
                    const expression = inputelem ? inputelem.value.replace('+', ' ') : ''; // TODO: Why did they do this???
                    result.push({
                        type: 'BTMParameterQuantity-147',
                        id: elemid,
                        value: expression,
                    });
                    break;
                }
                case 'string': {
                    result.push({
                        type: 'BTMParameterString-149',
                        id: elemid,
                        value: inputelem ? inputelem.value : '',
                    });
                    break;
                }
                case 'enum': {
                    result.push({
                        type: 'BTMParameterEnum-145',
                        id: elemid,
                        value: selectelem ? selectelem.value : '',
                    });
                    break;
                }
                case 'boolean': {
                    result.push({
                        type: 'BTMParameterBoolean-144',
                        id: elemid,
                        value: inputelem
                            ? inputelem.checked
                                ? 'true'
                                : 'false'
                            : 'false',
                    });
                    break;
                }
            }
        });
        return result;
    }

    /**
     * Show options for a configurable item to insert
     * @param item
     */
    public async showItemChoices(
        parent: BTDocumentSummaryInfo,
        items: BTInsertableInfo[],
        nodeInfo: BTGlobalTreeMagicNodeInfo,
        renderIndex: number,
        parentElement?: HTMLElement,
        clearParentElement?: boolean,
        pruneDocumentInfo?: boolean
    ): Promise<void> {
        // Clean up the UI so we can populate it with the list
        let uiDiv = parentElement || document.getElementById('dump');
        // this.getFileBackground();
        if (uiDiv === null) {
            uiDiv = document.body;
        }
        if (clearParentElement) {
            uiDiv.innerHTML = '';
        }
        this.hidePopup();
        // This is what we are creating in the DOM
        // itemTreeDiv                <div class="select-item-tree">
        //                                <!--Element level insertables-->
        // itemParentGroup                <div class="select-item-parent-group">
        // itemParentRow                      <div class="select-item-dialog-item-row parent-item-expander-row os-selectable-item">
        //                                        <!--Element level collapse/expand buttons-->
        // levelControlButtons                    <div class="ns-select-item-dialog-item-expand-collapse">
        // imgExpand                                 <img src="https://cad.onshape.com/images/expanded.svg">
        //                                        </div>
        // divParentItem                          <div class="select-item-dialog-item parent-item">
        //                                            <!--Element level image/icon/thumbnail container-->
        // divParentThumbnailContainer                <div class="select-item-dialog-thumbnail-container os-no-shrink">
        //                                            <!--Element level thumbnail-->
        // imgParentThumbnail                         <img src="data:image/png;base64,xxxxxx">
        //                                        </div>
        //                                        <!--Element level display name-->
        // divParentTitle                         <div class="select-item-dialog-item-name">
        //                                            Aluminum Channel (Configurable)
        //                                        </div>
        //                                    </div>
        //                                </div>
        //                                <!-- Configuration selector -->
        //                                <div class="select-item-configuration-selector">
        //  childContainerDiv        <div class="select-item-dialog-item-row child-item-container os-selectable-item" >
        //    dialogItemDiv              <div class="select-item-dialog-item child-item">
        //                                   <!--Child level image/icon/thumbnail container-->
        //      childThumbnailDiv            <div class="select-item-dialog-thumbnail-container os-no-shrink">
        //                                       <!--Child level thumbnail-->
        //        imgChildThumbnail              <img src="/api/thumbnails/22f83f1be3e53004c07b6a491ec84af2939961cc/s/70x40?t=18bdb24e5837e17e04fd00f7&amp;rejectEmpty=true">
        //                                   </div>
        //                                   <!--Child level display name-->
        //      childNameDiv                 <div class="select-item-dialog-item-name">
        //                                      3.00" Aluminum Channel 585442
        //                                   </div>
        //                               </div>
        //                           </div>

        const itemTreeDiv = createDocumentElement('div', {
            class: 'select-item-tree',
            style: 'position:relative;z-index:1;',
        });
        const itemParentGroup = createDocumentElement('div', {
            class: 'select-item-parent-group',
        });
        itemTreeDiv.append(itemParentGroup);

        if (pruneDocumentInfo !== true) {
            let itemParentRow = createDocumentElement('div', {
                class: 'select-item-dialog-item-row parent-item-expander-row os-selectable-item',
            });
            itemParentGroup.append(itemParentRow);
            const levelControlButtons = createDocumentElement('div', {
                class: 'ns-select-item-dialog-item-expand-collapse',
            });
            const imgExpand = createDocumentElement('img', {
                src: 'https://cad.onshape.com/images/expanded.svg',
            });
            levelControlButtons.append(imgExpand);
            itemParentRow.append(levelControlButtons);

            // Get the parent information
            const divParentItem = createDocumentElement('div', {
                class: 'select-item-dialog-item parent-item',
            });
            const divParentThumbnailContainer = createDocumentElement('div', {
                class: 'select-item-dialog-thumbnail-container os-no-shrink',
            });
            divParentItem.append(divParentThumbnailContainer);

            const imgParentThumbnail = this.onshape.createThumbnailImage(parent);
            itemParentRow.append(divParentItem);

            divParentThumbnailContainer.append(imgParentThumbnail);

            const divParentTitle = createDocumentElement('div', {
                class: 'select-item-dialog-item-name',
                textContent: parent.name,
            });

            itemParentRow.append(divParentTitle);
        }

        uiDiv.appendChild(itemTreeDiv);
        let insertInfo: configInsertInfo = undefined;

        // Start the process off with the first in the magic list
        items.map(async (item: BTInsertableInfo, index: number) => {
            if (pruneDocumentInfo) index = renderIndex;
            let configurable = false;
            if (
                item.configurationParameters !== undefined &&
                item.configurationParameters !== null
            ) {
                configurable = true;
                insertInfo = await this.outputConfigurationOptions(
                    item,
                    index,
                    itemParentGroup,
                    nodeInfo
                );
            }
            // Now we need to output the actual item.
            const childContainerDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item-row child-item-container os-selectable-item',
            });
            const dialogItemDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item child-item',
            });
            const childThumbnailDiv = createDocumentElement('div', {
                class: 'select-item-dialog-thumbnail-container os-no-shrink',
            });
            if (item.elementType == 'FEATURESTUDIO') {
                const featurescriptThumbnail = createSVGIcon(
                    'svg-icon-feature-studio-element'
                );
                featurescriptThumbnail.id = `ci${index}`;
                featurescriptThumbnail.style.width = '100%';
                featurescriptThumbnail.style.height = '100%';

                childThumbnailDiv.append(featurescriptThumbnail);
            } else {
                const thumbnailInfo = Object.assign({}, parent);
                thumbnailInfo['elementId'] = item.elementId;
                thumbnailInfo['elementType'] = item.elementType;
                const imgChildThumbnail = this.onshape.createThumbnailImage(
                    thumbnailInfo,
                    {
                        id: `ci${index}`,
                        thumbnailId:
                            item.predictableThumbnailId !== undefined &&
                            item.predictableThumbnailId !== null
                                ? item.predictableThumbnailId
                                : undefined,
                    }
                );
                childThumbnailDiv.append(imgChildThumbnail);
            }
            const childNameDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item-name',
                id: `ct${index}`,
                textContent: item.elementName,
            });
            dialogItemDiv.append(childThumbnailDiv);
            dialogItemDiv.append(childNameDiv);
            childContainerDiv.append(dialogItemDiv);

            if (configurable) {
                childContainerDiv.onclick = () => {
                    insertInfo.configList = this.getConfigValues(index);
                    this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item,
                        insertInfo,
                        nodeInfo
                    );
                };
            } else {
                childContainerDiv.onclick = () => {
                    this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item,
                        undefined,
                        nodeInfo
                    );
                };
            }
            itemParentGroup.append(childContainerDiv);
        });
        //}
    }
    /**
     * In order to insert a configured part, we need the part id.  For this we will look at the metadata
     * to find a part which has the same name as the one we are looking for.
     * Note that if it isn't a part, we can get out of here without doing any real work.  Otherwise
     * we will have to go back to Onshape to get the
     * @param item to look for.
     * @returns BTInsertableInfo with deterministicId filled in
     */
    public async findDeterministicPartId(
        item: BTInsertableInfo
    ): Promise<BTInsertableInfo> {
        return new Promise((resolve, _reject) => {
            // Make sure we have to do some work (if it isn't a part or we already know the id, get out of here)
            if (
                item.elementType !== 'PARTSTUDIO' ||
                (item.deterministicId !== undefined && item.deterministicId !== null)
            ) {
                console.log('findDeterminsticPartId Early Out');
                resolve(item);
            }
            // We have to retrieve the metadata, so figure out what version / workspace we want to ask for
            let wvm: GetWMVEPsMetadataWvmEnum = 'v';
            let wvmid = item.versionId ?? undefined;
            if (wvmid === undefined) {
                wvm = 'w';
                wvmid = item.workspaceId;
            }
            this.onshape.metadataApi
                .getWMVEPsMetadata({
                    did: item.documentId,
                    wvm: wvm,
                    wvmid: wvmid,
                    eid: item.elementId,
                })
                .then((metadata) => {
                    // Check the easy case - if there is only one item, then we can assume that it is the partid we are looking for
                    if (metadata.items.length === 1) {
                        item.deterministicId = metadata.items[0].partId;
                    } else {
                        // We need to go through all the metadata items and find one which has the name which is the same
                        // as our current item
                        const namedItem = metadata.items.find((metaItem) => {
                            const nameItem = metaItem.properties.find((prop) => {
                                return prop.name === 'Name';
                            });
                            return (
                                nameItem !== undefined &&
                                nameItem.value === item.elementName
                            );
                        });
                        // Searching is done.  If we found it, fill it in, otherwise complain loudly.
                        if (namedItem !== undefined) {
                            item.deterministicId = namedItem.partId;
                        } else {
                            // We can log the error, but just go on and let the application run without
                            // a deterministicId.  Eventually the insert will fail and it will be caught by
                            // the UI instead of rejecting it.
                            console.log(
                                `****Unable to find deterministicId - multiple metadata items ${metadata.items.length}`
                            );
                        }
                    }
                    resolve(item);
                })
                .catch((err) => {
                    _reject(err);
                });
        });
    }
    /**
     * In order to insert a configured part, we need the part id.  For this we will look at the metadata
     * to find a part which has the same name as the one we are looking for.
     * Note that if it isn't a part, we can get out of here without doing any real work.  Otherwise
     * we will have to go back to Onshape to get the
     * @param item to look for.
     * @returns BTInsertableInfo with deterministicId filled in
     */
    public async getMetaData(
        item: BTInsertableInfo,
        configuration: string
    ): Promise<metaData> {
        return new Promise((resolve, _reject) => {
            // We have to retrieve the metadata, so figure out what version / workspace we want to ask for
            let wvm: GetWMVEPsMetadataWvmEnum = 'v';
            let wvmid = item.versionId ?? undefined;
            if (wvmid === undefined) {
                wvm = 'w';
                wvmid = item.workspaceId;
            }
            this.onshape.metadataApi
                .getWMVEPsMetadata({
                    did: item.documentId,
                    wvm: wvm,
                    wvmid: wvmid,
                    eid: item.elementId,
                    thumbnail: true,
                    _configuration: configuration,
                })
                .then((metadata) => {
                    let result: metaData = {};
                    if (metadata.items.length > 0) {
                        if (metadata.items.length > 1) {
                            // Something is wrong, we got more than one item (which shouldn't happen).  Just let them know and ignore the extra items
                            console.log(
                                '***getWMVEPsMetadata returned more than one item'
                            );
                            console.log(item);
                            console.log(metadata);
                        }
                        let metaItem = metadata.items[0];
                        for (const item of metadata.items) {
                            if (item.partType === 'composite') {
                                metaItem = item;
                                break;
                            }
                        }
                        result['href'] = metaItem.href;
                        result['isFlattenedBody'] = metaItem.isFlattenedBody;
                        //result['isMesh'] = metaItem.isMesh  // TODO: This needs to be in the API
                        result['jsonType'] = metaItem.jsonType;
                        result['meshState'] = metaItem.meshState;
                        result['partId'] = metaItem.partId;
                        result['partType'] = metaItem.partType;
                        result['thumbnail'] = metaItem.thumbnail;

                        // Check the easy case - if there is only one item, then we can assume that it is the partid we are looking for
                        metaItem.properties.forEach((metaIitem) => {
                            result[metaIitem.name] = metaIitem.value;
                            if (metaIitem.valueType === 'ENUM') {
                                let enumEntry = metaIitem.enumValues.find((enumVal) => {
                                    return enumVal.value === metaIitem.value;
                                });
                                if (enumEntry !== undefined) {
                                    result[metaIitem.name] = enumEntry.label;
                                }
                            }
                        });
                        item.deterministicId = metaItem.partId;
                        resolve(result);
                    }
                })
                .catch((err) => _reject(err));
        });
    }

    /**
     * Display the configuration options for an element
     * @param item Configurable element to output
     * @param itemParentGroup Location to put the configuration option
     */
    public outputConfigurationOptions(
        item: BTInsertableInfo,
        index: number,
        itemParentGroup: HTMLElement,
        nodeInfo: BTGlobalTreeNodeInfo
    ): Promise<configInsertInfo> {
        return new Promise((resolve, _reject) => {
            // We have two pieces of information that we can actually ask for in parallel
            // First we need to know the deterministic part id if this is a partstudio item
            const findPartPromise = this.findDeterministicPartId(item);
            let wvm = 'v';
            let wvmid = item.versionId ?? undefined;
            if (wvmid === undefined) {
                wvm = 'w';
                wvmid = item.workspaceId;
            }
            // Second we need to get all the configuration information for the item
            const itemConfigPromise = this.onshape.elementApi.getConfiguration({
                did: item.documentId,
                wvm: wvm as GetConfigurationWvmEnum,
                wvmid: wvmid,
                eid: item.elementId,
            });
            // Run them both in parallel and when they are complete we can do our work
            Promise.all([findPartPromise, itemConfigPromise])
                .then(([item, itemConfig]) => {
                    const result: configInsertInfo = {
                        configList: [],
                        deterministicId: item.deterministicId,
                        libraryVersion: itemConfig.libraryVersion,
                        microversionSkew: itemConfig.microversionSkew,
                        rejectMicroversionSkew: itemConfig.rejectMicroversionSkew,
                        serializationVersion: itemConfig.serializationVersion,
                        sourceMicroversion: itemConfig.sourceMicroversion,
                    };
                    let onchange = () => {};
                    let ongenerate = () => {};
                    if (itemConfig.configurationParameters.length === 1) {
                        onchange = () => {
                            this.updateConfigurationUI(item, index);
                        };
                    } else {
                        onchange = () => {
                            console.log('Multi-item Configuration Change');
                            const btn = document.getElementById(`cb${index}`);
                            if (btn !== undefined && btn !== null) {
                                btn.removeAttribute('disabled');
                            }
                        };
                        ongenerate = () => {
                            console.log('Generated');
                            this.updateConfigurationUI(item, index);
                            const btn = document.getElementById(`cb${index}`);
                            if (btn !== undefined && btn !== null) {
                                btn.setAttribute('disabled', 'disabled');
                            }
                        };
                    }

                    const currentlySelectedConfig = nodeInfo['configuration'];
                    if (currentlySelectedConfig) {
                        let savedConfigObject = JSON.parse(currentlySelectedConfig);
                        for (let i in itemConfig.configurationParameters) {
                            const configurationParameters =
                                itemConfig.configurationParameters[i];

                            const savedConfigValue =
                                savedConfigObject[configurationParameters.parameterId];
                            configurationParameters['defaultValue'] = savedConfigValue;
                        }
                    }
                    itemParentGroup.append(
                        genEnumOption(itemConfig, index, onchange, ongenerate)
                    );
                    document
                        .querySelectorAll('select[savedconfigurationvalue]')
                        .forEach((elem: HTMLInputElement) => {
                            elem.value = elem.getAttribute('savedconfigurationvalue');
                        });
                    resolve(result);
                })
                .catch((err) => {
                    console.warn(err);
                });
        });
    }
    /**
     * Update the configuration image
     * @param item Item to be updated
     * @param index Configuration UI Index
     */
    public updateConfigurationUI(item: BTInsertableInfo, index: number) {
        const configList = this.getConfigValues(index);
        const configuration = this.buildAssemblyConfiguration(configList, '');

        const img = document.getElementById(`ci${index}`) as HTMLImageElement;

        if (img !== undefined && img !== null) {
            img.setAttribute(
                'src',
                'https://cad.onshape.com/images/default-document.png'
            );
        }
        this.getMetaData(item, configuration)
            .then((res) => {
                const txtdiv = document.getElementById(`ct${index}`);
                if (txtdiv !== undefined && txtdiv !== null) {
                    txtdiv.textContent = res['Name'];
                }
                const img = document.getElementById(`ci${index}`) as HTMLImageElement;

                if (img !== undefined && img !== null) {
                    this.onshape.replaceThumbnailImage(
                        img,
                        res['thumbnail'] as BTThumbnailInfo,
                        { retry: true, retryInterval: 5 }
                    );
                }
            })
            .catch((err) => {});
    }

    /**
     * Insert to an unknown tab (generally this is an error)
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToOther(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo,
        insertInfo: configInsertInfo
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.messaging.showMessageBubble(
                `Unable to determine how to insert item ${item.id} - ${item.elementName} into ${this.targetDocumentElementInfo.elementType} ${documentId}/w/${workspaceId}/e/${elementId}`
            );
            resolve();
        });
    }
    /**
     * Create the configuration structure for inserting into a part
     * @param configList List of chosen configurations
     * @param namespace Namespace to insert from
     * @returns Array of BTMParameter1 structures for the insert part operation
     */
    public buildPartConfiguration(
        configList: configInfo[],
        namespace: string
    ): Array<BTMParameter1> {
        const result: Array<BTMParameter1> = [];

        configList.forEach((item) => {
            switch (item.type) {
                case 'BTMParameterQuantity-147': {
                    const configItem: BTMParameterQuantity147 = {
                        btType: item.type,
                        isInteger: false,
                        value: 0,
                        units: '',
                        expression: item.value,
                    };
                    result.push(configItem);
                    break;
                }
                case 'BTMParameterString-149': {
                    const configItem: BTMParameterString149 = {
                        btType: item.type,
                        value: item.value,
                    };
                    result.push(configItem);
                    break;
                }
                case 'BTMParameterEnum-145': {
                    const configItem: BTMParameterEnum145 = {
                        btType: item.type,
                        namespace: namespace,
                        value: item.value,
                        parameterId: item.id,
                        enumName: `${item.id}_conf`,
                    };
                    result.push(configItem);
                    break;
                }
                case 'BTMParameterBoolean-144': {
                    const configItem: BTMParameterBoolean144 = {
                        btType: item.type,
                        value: item.value === 'true',
                    };
                    result.push(configItem);
                    break;
                }
            }
        });
        return result;
    }
    /**
     * Create the configuration structure for inserting into an assembly
     * @param configList List of chosen configurations
     * @param _namespace Namespace to insert from
     * @returns Array of BTMParameter1 structures for the insert part operation
     */
    public buildAssemblyConfiguration(
        configList: configInfo[],
        _namespace: string
    ): string {
        let result = '';
        let extra = '';

        configList.forEach((item) => {
            result += `${extra}${item.id}=${item.value}`;
            extra = ';';
        });
        return result;
    }

    public validAccessId(accessId: string): boolean {
        return accessId === document.getElementById('dump')['data-accessid'];
    }

    /**
     * Process and save a recently inserted item for Recently Inserted
     * @param item Document element to save
     * @param insertInfo Document configurations to save
     */
    public processRecentlyInserted(
        nodeInfo: BTGlobalTreeNodeInfo,
        insertInfo: configInsertInfo
    ) {
        let documentNodeInfo: BTGlobalTreeNodeInfo = nodeInfo;
        // this.currentNodes.items.forEach((nodeItem: BTGlobalTreeNodeInfo)=>{
        //   if(nodeItem.id == item.documentId)return documentNodeInfo = nodeItem;
        // })
        if (
            insertInfo !== undefined &&
            insertInfo !== null &&
            insertInfo.configList &&
            insertInfo.configList.length > 0
        ) {
            //Document has configurations
            const documentNodeInfoConfig: BTGlobalTreeNodeMagicDataInfo =
                documentNodeInfo as BTGlobalTreeNodeMagicDataInfo;
            let configInfo = {};
            insertInfo.configList.forEach((elem) => {
                configInfo[elem.id] = elem.value;
            });
            documentNodeInfoConfig.configuration = JSON.stringify(configInfo);

            this.preferences.addMagicNode(documentNodeInfoConfig, 'recentlyInserted');
        } else {
            this.preferences.addMagicNode(
                documentNodeInfo as BTGlobalTreeNodeInfo,
                'recentlyInserted'
            );
        }
    }

    public insertToTarget(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo,
        insertInfo: configInsertInfo,
        nodeInfo: BTGlobalTreeNodeInfo
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            let promise: Promise<configInsertInfo>;

            if (item.elementType === 'FEATURESTUDIO') {
                promise = this.insertToFeatureStudio(
                    item.documentId,
                    item.versionId,
                    item.elementId,
                    item.microversionId
                );
            } else if (this.targetDocumentElementInfo.elementType === 'PARTSTUDIO') {
                promise = this.insertToPartStudio(
                    documentId,
                    workspaceId,
                    elementId,
                    item,
                    insertInfo,
                    nodeInfo
                );
            } else if (this.targetDocumentElementInfo.elementType === 'ASSEMBLY') {
                promise = this.insertToAssembly(
                    documentId,
                    workspaceId,
                    elementId,
                    item,
                    insertInfo,
                    nodeInfo
                );
            } else {
                promise = new Promise<configInsertInfo>((resolve) => resolve(undefined));
                console.warn('insert element not handled');
                return;
            }

            this.setInProgress(true);

            promise.then((newInsertInfo) => {
                if (newInsertInfo != undefined) insertInfo = newInsertInfo;
                this.setInProgress(false);
                this.processRecentlyInserted(nodeInfo, insertInfo);
                resolve();
            });
        });
    }

    /**
     * Insert an item into a Parts Studio
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToPartStudio(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo,
        //        configList: configInfo[]
        insertInfo: configInsertInfo,
        nodeInfo: BTGlobalTreeNodeInfo
    ): Promise<configInsertInfo> {
        console.log(
            `Inserting item ${item.id} - ${item.elementName} into Part Studio ${documentId}/w/${workspaceId}/e/${elementId}`
        );
        // "feature": {
        //     "btType": "BTMFeature-134",
        //     "namespace": "",
        //     "name": `Derived ${insertable.name}`,
        //     "suppressed": false,
        //     "featureType": "importDerived",
        //     "subFeatures": [],
        //     "returnAfterSubfeatures": false,
        //     "parameters": [
        //       {
        //         "btType": "BTMParameterQueryList-148",
        //         "parameterId": "parts",
        //         "queries": [
        //           {
        //             "btType": "BTMIndividualQuery-138",
        //             "queryStatement": null,
        //             "queryString": insertable.type === "PART" ? `query=qTransient("${insertable.partId}");` : "query=qEverything(EntityType.BODY);"
        //           }
        //         ]
        //       },
        //       {
        //         "btType": "BTMParameterDerived-864",
        //         "parameterId": "buildFunction",
        //         "namespace": namespace,
        //         "imports": []
        //         "configuration": configList,
        //       }
        //     ],
        //   },
        //   "libraryVersion": 1746,
        //   "microversionSkew": false,
        //   "rejectMicroversionSkew": false,
        //   "serializationVersion": "1.1.23"

        // this.onshape.partStudioApi.evalFeatureScript({
        //   did: '',
        //   wvm: 'w',
        //   wvmid: '',
        //   eid: ''
        // });

        return new Promise(async (resolve, reject) => {
            const namespace = this.computeNamespace(item);

            let queryString = 'query=qEverything(EntityType.BODY);';
            if (item.elementType === 'PARTSTUDIO') {
                if (item.deterministicId !== undefined && item.deterministicId !== null) {
                    queryString = `query=qTransient("${item.deterministicId}");`;
                } else if (
                    item.insertableQuery !== undefined &&
                    item.insertableQuery !== null
                ) {
                    queryString = item.insertableQuery;
                }
            }
            // If we are doing a plain part, we may have to actually ask the configuration in order to get the version of the library that we are inserting from
            if (insertInfo == undefined) {
                // Pick some clean defaults to work from
                insertInfo = {
                    configList: [],
                    libraryVersion: 1746,
                    microversionSkew: false,
                    rejectMicroversionSkew: false,
                    serializationVersion: '1.1.23',
                    sourceMicroversion: undefined,
                };
                let wvm = 'w';
                let wvmid = item.workspaceId;
                if (item.versionId !== undefined && item.versionId !== null) {
                    wvm = 'v';
                    wvmid = item.versionId;
                }
                // Second we need to get all the configuration information for the item
                const config = await this.onshape.elementApi.getConfiguration({
                    did: item.documentId,
                    wvm: wvm as GetConfigurationWvmEnum,
                    wvmid: wvmid,
                    eid: item.elementId,
                });

                insertInfo.libraryVersion = config.libraryVersion;
                insertInfo.microversionSkew = config.microversionSkew;
                insertInfo.rejectMicroversionSkew = config.rejectMicroversionSkew;
                insertInfo.serializationVersion = config.serializationVersion;
                insertInfo.sourceMicroversion = config.sourceMicroversion;
            }

            const iquery: BTMIndividualQuery138 = {
                btType: 'BTMIndividualQuery-138',
                queryStatement: null,
                // item.insertableQuery,
                queryString: queryString,
            };
            const queryList: BTMParameterQueryList148 = {
                btType: 'BTMParameterQueryList-148',
                queries: [iquery],
                parameterId: 'parts',
            };
            const btparameterDerived: BTMParameterDerived864 = {
                btType: 'BTMParameterDerived-864',
                parameterId: 'buildFunction',
                namespace: namespace,
                imports: [],
                _configuration: insertInfo.configList
                    ? this.buildPartConfiguration(insertInfo.configList, namespace)
                    : undefined,
            };
            this.onshape.partStudioApi
                .addPartStudioFeature({
                    did: documentId,
                    wvm: 'w',
                    wvmid: workspaceId,
                    eid: elementId,
                    bTFeatureDefinitionCall1406: {
                        feature: {
                            btType: 'BTMFeature-134',
                            // featureId: "", // wasn't supplied
                            namespace: '', // Where does this come from?
                            name: `Derived ${item.elementName}`,
                            suppressed: false,
                            parameters: [queryList, btparameterDerived],
                            featureType: 'importDerived', // Where does this come from?
                            subFeatures: [],
                            // importMicroversion: "", // importMicroversion wasn't supplied
                            // nodeId: "", // NodeId wasn't supplied
                            returnAfterSubfeatures: false, // Why is this
                            // suppressionConfigured: false, // When would it be true
                            // variableStudioReference: false, // When would it be true
                        },
                        libraryVersion: insertInfo.libraryVersion,
                        microversionSkew: insertInfo.microversionSkew,
                        rejectMicroversionSkew: insertInfo.rejectMicroversionSkew,
                        serializationVersion: insertInfo.serializationVersion,
                        // sourceMicroversion: insertInfo.sourceMicroversion,  // Don't set this or it fails
                        // documentId: item.documentId,
                        // elementId: item.elementId,
                        // featureId: '', // item.featureId,
                        // isAssembly: item.elementType == 'ASSEMBLY',
                        // isWholePartStudio: false, // TODO: Figure this out
                        // microversionId: '', // item.microversionId,  // If you do this, it gives an error 400: Microversions may not be used with linked document references
                        // partId: item.deterministicId ?? '',
                        // versionId: item.versionId,
                    },
                })
                .then(() => {
                    resolve(insertInfo);
                })
                .catch((reason) => {
                    // TODO: Figure out why we don't get any output when it actually succeeds
                    if (reason !== 'Unexpected end of JSON input') {
                        console.log(`failed to create reason=${reason}`);
                    }
                    resolve(undefined);
                });
        });
    }
    public computeNamespace(item: BTInsertableInfo) {
        let wvid = `w${item.workspaceId}`;
        if (item.versionId !== undefined && item.versionId !== null) {
            wvid = `v${item.versionId}`;
        }
        let mvid = `m${item.microversionId ?? '0'}`;

        return `d${item.documentId}::${wvid}::e${item.elementId}::${mvid}`;
    }

    /**
     * Insert an item into an Assembly
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToAssembly(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo,
        insertInfo: configInsertInfo, // configList: configInfo[]
        nodeInfo: BTGlobalTreeNodeInfo
    ): Promise<configInsertInfo> {
        // console.log(
        //     `Inserting item ${item.id} - ${item.elementName} into Assembly ${documentId}/w/${workspaceId}/e/${elementId}`
        // );
        return new Promise((resolve, reject) => {
            let configuration = undefined;
            if (insertInfo !== undefined && insertInfo.configList !== undefined) {
                configuration = this.buildAssemblyConfiguration(
                    insertInfo.configList,
                    ''
                );
            }

            this.onshape.assemblyApi
                .createInstance({
                    did: documentId,
                    wid: workspaceId,
                    eid: elementId,
                    bTAssemblyInstanceDefinitionParams: {
                        _configuration: configuration,
                        documentId: item.documentId,
                        elementId: item.elementId,
                        featureId: '', // item.featureId,
                        isAssembly: item.elementType == 'ASSEMBLY',
                        isWholePartStudio: false, // TODO: Figure this out
                        microversionId: '', // item.microversionId,  // If you do this, it gives an error 400: Microversions may not be used with linked document references
                        partId: item.deterministicId ?? '',
                        versionId: item.versionId,
                    },
                })
                .then(() => {
                    // this.onshape.assemblyApi.getAssemblyDefinition({
                    //     did: documentId,
                    //     wvm: 'w',
                    //     wvmid: workspaceId,
                    //     eid: elementId,
                    // }).then((def)=>{
                      // if(def == undefined || !(def?.rootAssembly?.instances))return;
                      // const instances = def.rootAssembly.instances;
                      // let insertedInstance: BTAssemblyInstanceInfo;
                      // //iterate in reverse because recently inserted instances are last
                      // for(let i = instances.length -1; i >=0; i--){
                      //   const instance = instances[i];
                      //   if(instance.documentId == item.documentId && instance.elementId == item.elementId){
                      //     insertedInstance = instance;
                      //     break;
                      //   }
                      // }
                      // if(insertedInstance == undefined)return console.warn("Couldn't find inserted instance");
                      // this.onshape.sendMessage("requestSelectionHighlight",{selection: insertedInstance.id[0]})
                    // });
                    resolve(insertInfo);
                })
                .catch((reason) => {
                    // TODO: Figure out why we don't get any output when it actually succeeds
                    // post request returns undefined instead of {}
                    if (reason.message !== 'Unexpected end of JSON input') {
                        console.log('failed to create reason=', reason);
                    }
                    resolve(undefined);
                });
        });
    }

    public insertToFeatureStudio(
        documentId: string,
        versionId: string,
        elementId: string,
        microversionId: string
    ): Promise<configInsertInfo> {
        return new Promise((resolve, reject) => {
            this.featureStudios
                .appendToFeatureStudio(
                    [
                        {
                            did: documentId,
                            vid: versionId,
                            eid: elementId,
                            mvid: microversionId,
                        },
                    ],
                    this.documentId,
                    this.workspaceId
                )
                .then((res) => {
                    resolve(undefined);
                });
        });
    }

    private inProgressLocked = false;

    /**
     * Change the cursor while an operation is in progress
     * @param cursor Cursor to change to 'progress' and 'default' are good ones
     */
    public setInProgress(inprogress: boolean = true) {
        if (this.inProgressLocked) return;
        const element = document.getElementById('top');
        if (inprogress) {
            element.classList.add('waiting');
        } else {
            element.classList.remove('waiting');
        }
    }

    /**
     * Locked means that calling inProgress won't change the in progress status
     * Useful for performing multiple insertions or requests
     *  which call setInProgress individually
     * @param locked
     */
    private lockInProgress(locked: boolean = true) {
        this.inProgressLocked = locked;
    }

    /** */

    public getDocumentChangesHistory(
        did: string,
        infoRep: InformationReporter<{
            found: number;
            processed: number;
            changesIndexed: number;
            status: string;
        }>
    ): Promise<documentChangeHistory[]> {
        return new Promise((resolve, reject) => {
            infoRep.setString('status', 'Fetching Versions');
            this.onshape.documentApi
                // .getVersionGraph({
                //     did,
                //     bTVersionGraphRequestInfo: {
                //         includeAutoVersions: true,
                //         includeMerges: true,
                //         includeNonWorkspaceBranches: true,
                //         includeParentBranches: true,
                //         limit: 1000,
                //     },
                // })
                .getDocumentWorkspaces({ did })
                .then((workspaces) => {
                    if (workspaces == undefined || workspaces.length == 0)
                        return resolve(undefined);

                    infoRep.setString('status', 'Fetching Changes');
                    const TPU = new TaskProcessingUnit<
                        { versionName: string; wid: string; workspaceType: string },
                        {
                            did: string;
                            changeHistory: documentChangeHistory[];
                            indexedMicroversions: string[];
                        }
                    >(10);
                    TPU.setGlobalTaskInfo({
                        did,
                        changeHistory: [],
                        indexedMicroversions: [],
                    });
                    TPU.setProcessingFunction((taskInfo, addTask, globalTaskInfo) => {
                        return new Promise((resolve2, reject2) => {
                            this.onshape.documentApi
                                .getDocumentHistory({
                                    did,
                                    wm: taskInfo.workspaceType,
                                    wmid: taskInfo.wid,
                                })
                                .then((res) => {
                                    if (res == undefined) return resolve2();
                                    for (let node of res) {
                                        if (
                                            globalTaskInfo.indexedMicroversions.indexOf(
                                                node.microversionId
                                            ) !== -1
                                        )
                                            continue;
                                        globalTaskInfo.changeHistory.push({
                                            versionName: taskInfo.versionName,
                                            date: node.date.toString(),
                                            username: node.username,
                                        });
                                        globalTaskInfo.indexedMicroversions.push(
                                            node.microversionId
                                        );
                                        infoRep.incrementNumber('changesIndexed', 1);
                                    }
                                    infoRep.incrementNumber('processed', 1);
                                    if (res.length !== 50) return resolve2();
                                    addTask({
                                        versionName: taskInfo.versionName,
                                        workspaceType: 'm',
                                        wid: res[res.length - 1].nextMicroversionId,
                                    });
                                    infoRep.incrementNumber('found', 1);
                                    resolve2();
                                });
                        });
                    });
                    for (let node of workspaces) {
                        TPU.addTask({
                            versionName: node.name,
                            workspaceType: 'w',
                            wid: node.id,
                        });
                        infoRep.incrementNumber('found', 1);
                    }

                    const startTime = Date.now();
                    TPU.runTasks().then(() => {
                        console.log(TPU.globalTaskInfo.changeHistory.length);
                        console.log((Date.now() - startTime) / 1000);
                        return resolve(TPU.globalTaskInfo.changeHistory);
                    });
                });
        });
    }

    public processLibrariesNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[],
        index?: number,
        refreshNodes?: boolean
    ) {
        this.preferences
            .getMagicTypeByIndex(index, 'library', refreshNodes) //only refresh if we are getting first node
            .then((res: BTGlobalTreeNodeInfo[]) => {
                if (res === undefined || res === null) return;
                const recentNode: BTGlobalTreeNodesInfo = {
                    pathToRoot,
                    next: (index + 1).toString(),
                    href: undefined,
                    items: res,
                };
                this.ProcessNodeResults(recentNode, accessId, undefined, false);
            });
    }
    /**
     * Process the results of the recently inserted node
     * @param index what index recently inserted node it should fetch and process
     */
    public processFavoritedNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[],
        index?: number,
        refreshNodes?: boolean
    ) {
        this.preferences
            .getMagicTypeByIndex(index, 'favorited', refreshNodes) //only refresh if we are getting first node
            .then((res: BTGlobalTreeNodeInfo[]) => {
                if (res === undefined || res === null) {
                    return;
                }
                const recentNode: BTGlobalTreeNodesInfo = {
                    pathToRoot,
                    next: (index + 1).toString(),
                    href: undefined,
                    items: res,
                };
                this.ProcessNodeResults(recentNode, accessId, undefined, true);
            });
    }
    /**
     * Process the results of the recently inserted node
     * @param index what index recently inserted node it should fetch and process
     */
    public processRecentlyInsertedNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[],
        index?: number,
        refreshNodes?: boolean
    ) {
        this.preferences
            .getMagicTypeByIndex(index, 'recentlyInserted', refreshNodes) //only refresh if we are getting first node
            .then((res: BTGlobalTreeNodeInfo[]) => {
                if (res === undefined || res === null) {
                    return;
                }
                const recentNode: BTGlobalTreeNodesInfo = {
                    pathToRoot,
                    next: (index + 1).toString(),
                    href: undefined,
                    items: res,
                };
                this.ProcessNodeResults(recentNode, accessId, undefined, true);
            });
    }

    /**
     * Process the results of the global libraries node
     * @param index what index global library node it should fetch and process
     */
    public processGlobalLibrariesNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[],
        index?: number,
        refreshNodes?: boolean
    ) {
        const documentRequests: Promise<BTGlobalTreeNodeInfo>[] = [];
        for (let did of this.globalLibrariesNodes) {
            documentRequests.push(this.onshape.documentApi.getDocument({ did }));
        }
        Promise.all(documentRequests).then((documents: BTGlobalTreeNodeInfo[]) => {
            const recentNode: BTGlobalTreeNodesInfo = {
                pathToRoot,
                next: (index + 1).toString(),
                href: undefined,
                items: documents,
            };
            this.ProcessNodeResults(recentNode, accessId, undefined, true);
        });
    }

    public processInsertablesSearch(
        currentItem: BTGlobalTreeNodeInfo,
        match: string,
        accessId: string
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let context = 0;
            let ownerId = this.onshape.userId;
            if (currentItem.resourceType === 'magic') {
                context = {
                    // '0': 6, //Owned By Me
                    '0': 5, //Recently Opened
                    // '1':
                    '2': 1,
                    '3': 4,
                    '4': 3, //trash
                    '11': 9,
                    '12': 2,
                }[currentItem.id];
                // context = parseInt(currentItem.id);
            } else if (currentItem.resourceType === 'team') {
                context = 9;
                ownerId = currentItem.id;
            } else {
                console.log('other item', currentItem);
            }
            let offset =
                this.currentInsertablesSearch && this.currentInsertablesSearch.offset;
            if (!offset || offset < 0) offset = 0;
            // console.log('Document Filter: ' + context);
            this.onshape.documentApi
                .search({
                    bTDocumentSearchParams: {
                        documentFilter: context,
                        foundIn: 'w' as BTESVersionWorkspaceChoice,
                        ownerId,
                        limit: 30,
                        when: 'LATEST',
                        sortColumn: '',
                        sortOrder: '',
                        rawQuery: '_all:' + match + ' type:all',
                        offset,
                        // rawQuery: 'type:document name:' + match,
                    },
                })
                .then((res) => {
                    this.currentInsertablesSearch.offset = offset + 30;
                    // this.currentSearchItems = (
                    //     (res['items'] || []) as Array<
                    //         SearchInfoNode | BTGlobalTreeNodeInfo
                    //     >
                    // ).concat(this.currentSearchItems);
                    this.currentSearchItems = this.currentSearchItems.concat(
                        res['items'] || []
                    );
                    if (offset !== 0) return resolve(true);
                    resolve(this.getSearchItemByIndex(accessId, 0));
                });
        });
    }

    // public processInsertablesSearch(
    //     currentItem: BTGlobalTreeNodeInfo,
    //     match: string,
    //     accessId: string
    // ): Promise<boolean> {
    //     return new Promise((resolve, reject) => {
    //         let context = 0;
    //         if (currentItem.resourceType == 'magic') {
    //             context = {
    //                 '0': 5,
    //                 // '1':
    //                 '2': 1,
    //                 '3': 4,
    //                 '11': 9,
    //             }[currentItem.id];
    //         } else {
    //             console.log('other item', currentItem);
    //         }
    //         /**
    //          * Filters:
    //          * 1 - Created by me
    //          * 2 - Shared with me
    //          * 3 - imported (i think)
    //          * 4 - Public
    //          * 5 - Recently opened
    //          * 6 - Owned by me
    //          * 7 - Company
    //          * 8 - Onshape owned documents official (i think)
    //          * 9 - Team
    //          * 10 - Label (needs label param)
    //          * 11 - All
    //          * 12, 13 - something (didn't return anything)
    //          * 14 - Featurescript
    //          * 15, 16 - More Featurescript
    //          * 17 - Something about referencedByParameter
    //          * Everything else - Idk, something (recently edited?, not public)
    //          */
    //         this.onshape.documentApi
    //             .getInsertablesQuery({
    //                 filter: context, //9 for team, 11 for all
    //                 // getPathToRoot: true,
    //                 //owner & ownerId:
    //                 includeApplications: false,
    //                 includeAssemblies: true,
    //                 includeBlobs: false,
    //                 includeFSComputedPartPropertyFunctions: false,
    //                 includeFSTables: false,
    //                 includeFeatureStudios: false,
    //                 includeFeatures: false,
    //                 includeFlattenedBodies: true,
    //                 includePartStudios: false,
    //                 includeParts: true,
    //                 includeReferenceFeatures: false,
    //                 includeSketches: true,
    //                 includeSurfaces: true,
    //                 includeVariableStudios: false,
    //                 includeVariables: false,
    //                 includeWires: false,
    //                 limit: 30,
    //                 offset: 0,
    //                 q: '_all:' + match + ' type:all',
    //             })
    //             .then((results) => {
    //                 if (results === undefined || results === null) return resolve(false);
    //                 // if(!results.items || (results.items && results.items.length ===0))return resolve(false);
    //                 resolve(this.getSearchItemByIndex(accessId, 0));
    //             });
    //     });
    // }

    public processProxyLibrarySearch(
        id: string,
        match: string,
        accessId: string,
        skipRender?: boolean,
        exactMatches?: string[],
        exactSearch?: string
    ): Promise<boolean> {
        let exactMatchReg = undefined;
        if (
            exactMatches !== undefined &&
            exactMatches !== null &&
            exactMatches.length > 0
        ) {
            exactMatchReg = new RegExp('(' + exactMatches.join('|') + ')', 'gmi');
        }

        return new Promise((resolve, reject) => {
            this.libraries.getLibrarySearchInfo(id).then((res) => {
                if (res === undefined) res = [];
                let items = res as SearchInfoNode[];
                console.log(`library ${id} has ${items.length} items`)

                const re = new RegExp(match, 'gmi');
                this.currentSearchItems = (
                    this.currentSearchItems.concat(
                        items.filter((item) => {
                            if (exactMatchReg !== undefined) {
                                const matches = item.name
                                    .toLowerCase()
                                    .match(exactMatchReg);
                                if (
                                    matches === null ||
                                    (matches && exactMatches.length === 0)
                                )
                                    return false;
                            }
                            return (
                                (
                                    item.name.toLowerCase() +
                                    ' ' +
                                    (item.partNumber || '') +
                                    ' '
                                ).match(re) !== null
                            );
                        }) as Array<{ id: string; partNumber: string; name: string }>
                    ) as SearchInfoNode[]
                ).sort((a, b) => {
                    if (exactSearch != undefined) {
                        const exact =
                            (a.name.toLowerCase().indexOf(exactSearch) != -1 ? 0 : 1) -
                            (b.name.toLowerCase().indexOf(exactSearch) != -1 ? 0 : 1);
                        if (exact !== 0) return exact;
                    }
                    const config =
                        (a.name.toLowerCase().indexOf('configurable') > 0 ? 0 : 1) -
                        (b.name.toLowerCase().indexOf('configurable') > 0 ? 0 : 1);
                    if (config !== 0) return config;
                    return (
                        (b.name + ' ' + (b.partNumber || '') + ' ').match(re).length -
                        (a.name + ' ' + (a.partNumber || '') + ' ').match(re).length
                    );
                });

                if (skipRender) return resolve(this.currentSearchItems.length > 0);
                resolve(this.getSearchItemByIndex(accessId, 0));
            });
        });
    }

    /**
     * Process the results of the global libraries node
     * @param index what index global library node it should fetch and process
     */
    public processHelpInstructionsNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[],
        index?: number,
        refreshNodes?: boolean
    ) {
        //fetch md file
        fetch('./' + this.appName + '/INSTRUCTIONS_HELP.md').then((res) => {
            if (res === undefined) return;
            res.text().then((res2) => {
                this.processMarkdownFile(res2, accessId);
                if (this.onshape.freeUser)
                    this.createFreeUserInfo(document.getElementById('dump'));
            });
        });
    }

    public processCurrentDocumentNode(
        accessId: string,
        pathToRoot: BTGlobalTreeMagicNodeInfo[]
    ) {
        this.onshape.documentApi
            .getDocument({ did: this.onshape.documentId })
            .then((res) => {
                if (res === undefined && res === null)
                    console.error("Active document doesn't exist");
                // this.onshape.globalTreeNodesApi;
                this.checkInsertItem(res, this.loaded, undefined, true, accessId);
            });
    }

    public processCommunityLibraryNode(
      accessId:string,
      pathToRoot: BTGlobalTreeMagicNodeInfo[]
    ){
      this.gotoFolder({
        jsonType: "proxy-library",
        id: this.communityLibraryNode
      })
    }
    /**
     * Process a single node entry
     * @param uri URI node for the entries to be loaded
     */
    public processMagicNode(magic: string, accessId: string) {
        let pathToRoot = [];
        if (magic === 'RI') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'RI',
                    name: 'Recently Inserted',
                },
            ];
            this.processRecentlyInsertedNode(accessId, pathToRoot, 0, true);
        } else if (magic === 'FV') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'FV',
                    name: 'Favorited',
                },
            ];
            this.processFavoritedNode(accessId, pathToRoot, 0, true);
        } else if (magic === 'LI') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'LI',
                    name: 'Libraries',
                },
            ];
            this.processLibrariesNode(accessId, pathToRoot, 0, true);
        } else if (magic === 'GL') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'GL',
                    name: 'Global Libraries',
                },
            ];
            this.processGlobalLibrariesNode(accessId, pathToRoot, 0, true);
        } else if (magic === 'HI') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'HI',
                    name: 'Help/Instructions',
                },
            ];
            this.processHelpInstructionsNode(accessId, pathToRoot);
        } else if (magic === 'CD') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'CD',
                    name: 'Current Document',
                },
            ];
            this.processCurrentDocumentNode(accessId, pathToRoot);
        } else if (magic === 'CL') {
            pathToRoot = [
                {
                    jsonType: 'magic',
                    resourceType: 'magic',
                    id: 'CL',
                    name: 'Community Library',
                },
            ];
            this.processCommunityLibraryNode(accessId, pathToRoot);
        }

        if (pathToRoot.length !== 0) return this.setBreadcrumbs(pathToRoot);
        // uri: string) {
        // Get Onshape to return the list

        this.processGlobalTreeNodes(magic, accessId);
    }

    private currentInsertablesSearch: {
        item: BTGlobalTreeMagicNodeInfo;
        info: BTGlobalTreeNodeInfo;
        offset: number;
    };
    private currentSearchItems: Array<SearchInfoNode | BTGlobalTreeNodeInfo>;
    private lastSearchLibraries: Array<BTGlobalTreeNodeInfo>;

    public processSearch(searchInfo: BTGlobalTreeMagicNodeInfo, accessId: string) {
        //id is where to search under NOPE (not needed)
        //description is search input
        //resourceType is jsonType of item being searched NOPE (not needed yet?)
        let currentItem = this.currentBreadcrumbs[0];
        let reSearching = false;
        if (currentItem.jsonType === 'search') {
            currentItem = this.currentBreadcrumbs[1];
            reSearching = true;
        }
        let itemJsonType = currentItem.jsonType;
        if (itemJsonType === undefined) itemJsonType = currentItem.resourceType;

        searchInfo.description = searchInfo.description.toLowerCase();

        const searchRegExactArray = [];
        const searchRegNormalArray = [];

        const exactMatchReg = /\"([^\"]+)+\"/gm;
        const exactMatches = searchInfo.description.matchAll(exactMatchReg);
        for (const match of exactMatches) searchRegExactArray.push(match[1]);
        const resultingSearchString = searchInfo.description.replace(exactMatchReg, '');
        const normalMatchReg = /([^ ]+)/gm;
        const normalMatches = resultingSearchString.matchAll(normalMatchReg);
        for (const match of normalMatches) searchRegNormalArray.push(match[1]);

        let searchMatchReg = '';
        if (searchRegExactArray.length !== 0)
            searchMatchReg = '(?:^|\\W)(' + searchRegExactArray.join('|') + ')(?:$|\\W)|';
        searchMatchReg += '(' + searchRegNormalArray.join('|') + ')';
        this.currentInsertablesSearch = undefined;
        this.currentSearchItems = [];
        if (itemJsonType === 'proxy-library') {
            this.processProxyLibrarySearch(
                currentItem.id,
                searchMatchReg,
                accessId,
                false,
                searchRegExactArray,
                searchInfo.description
            ).then((content) => {
                if (content === false) {
                    this.processNoContent(accessId);
                }
            });
        } else if (
            itemJsonType === 'magic' &&
            (currentItem.id === 'LI' || currentItem.id === 'GL')
        ) {
            //currentNodes are all libraries
            const promises: Promise<boolean>[] = [];
            let libraries = this.currentNodeInfo.items;
            if (libraries != undefined && reSearching)
                libraries = this.lastSearchLibraries;
            this.lastSearchLibraries = libraries;
            for (let library of libraries) {
                console.log(`${library.name} has id ${library.id}`)
                promises.push(
                    this.processProxyLibrarySearch(
                        library.id,
                        searchMatchReg,
                        accessId,
                        true,
                        searchRegExactArray,
                        searchInfo.description
                    )
                );
            }
            Promise.all(promises).then((contentArray) => {
                let nocontent = true;
                for (let content of contentArray) {
                    if (content === true) nocontent = false;
                }
                if (nocontent) {
                    this.processNoSearchMatches(accessId);
                } else {
                    this.getSearchItemByIndex(accessId, 0);
                }
            });
        } else if (
            itemJsonType === 'folder' ||
            itemJsonType === 'magic' ||
            itemJsonType === 'team-summary'
        ) {
            this.currentInsertablesSearch = {
                item: currentItem,
                info: searchInfo,
                offset: 0,
            };
            this.processInsertablesSearch(
                currentItem,
                searchInfo.description,
                accessId
            ).then((content) => {
                if (content === false) {
                    this.processNoSearchMatches(accessId);
                }
            });
        }
    }

    public getSearchItemByIndex(accessId: string, index: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const pathToRoot = [
                {
                    jsonType: 'search',
                    id: 'SR',
                    name: 'Search Results',
                    resourceType: 'search',
                },
            ];

            const itemShell = this.currentSearchItems[index];
            if (itemShell === undefined || itemShell === null) return resolve(false);
            if ((itemShell as BTGlobalTreeNodeInfo).jsonType === 'document-summary') {
                const searchNodes: BTGlobalTreeNodesInfo = {
                    pathToRoot,
                    href: undefined,
                    next: (index + 1).toString(),
                    items: [itemShell as BTGlobalTreeNodeInfo],
                };

                if (index === 0) this.addBreadcrumbNode(pathToRoot[0], true);
                this.ProcessNodeResults(searchNodes, accessId);
                return resolve(true);
            }
            const promises = [];
            for (let i = 0; i < this.searchLoadChunk; i++) {
                if (index + i >= this.currentSearchItems.length) continue;
                promises.push(
                    this.getSearchDocumentInfo(
                        this.currentSearchItems[index + i] as SearchInfoNode
                    )
                );
            }
            Promise.all(promises).then((items) => {
                items = items.filter((item) => item != undefined);
                const searchNodes: BTGlobalTreeNodesInfo = {
                    pathToRoot,
                    href: undefined,
                    next: (index + this.searchLoadChunk).toString(),
                    items,
                };
                if (index === 0) this.addBreadcrumbNode(pathToRoot[0], true);
                this.ProcessNodeResults(searchNodes, accessId);
                resolve(true);
            });
        });
    }

    private getSearchDocumentInfo(
        itemShell: SearchInfoNode
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, reject) => {
            const promises = [
                this.onshape.documentApi.getDocument({ did: itemShell.id }),
                this.resolveDocumentVersion({
                    jsonType: 'document-summary',
                    id: itemShell.id,
                }),
            ];
            Promise.all(promises).then((res) => {
                if (res == undefined) return resolve(undefined);
                const item = res[0];
                if (item == undefined) return resolve(undefined);
                const versionInfo = res[1];
                if (
                    versionInfo &&
                    versionInfo.recentVersion &&
                    versionInfo.recentVersion.id
                )
                    item.recentVersion = { id: versionInfo.recentVersion.id };
                item.jsonType = 'document-summary';
                resolve(item);
            });
        });
    }

    public processNoSearchMatches(accessId: string) {
        this.addBreadcrumbNode(
            {
                jsonType: 'search',
                id: 'SR',
                name: 'Search Results',
                resourceType: 'search',
            },
            true
        );
        this.processNoContent(accessId);
    }

    public processNoContent(accessId: string, description?: string) {
        if (description === undefined) description = 'No parts matched your search.';
        this.ProcessNodeResults(
            {
                pathToRoot: this.currentBreadcrumbs,
                items: [
                    {
                        jsonType: 'no-content',
                        name: description,
                    },
                ],
            },
            accessId
        );
    }

    public processGlobalTreeNodes(magicId: string, accessId: string, offset?: number) {
        if (offset === undefined || offset === null || offset < 0) offset = 0;
        this.onshape.globalTreeNodesApi
            .globalTreeNodesMagic({
                mid: magicId,
                getPathToRoot: true,
                includeApplications: false,
                includeAssemblies: true,
                includeBlobs: false,
                includeFSComputedPartPropertyFunctions: false,
                includeFSTables: false,
                includeFeatureStudios: false,
                includeFeatures: false,
                includeFlattenedBodies: true,
                includePartStudios: magicId === '2',
                includeParts: true,
                includeReferenceFeatures: false,
                includeSketches: true,
                includeSurfaces: true,
                includeVariableStudios: false,
                includeVariables: false,
                includeWires: false,
                allowedApplicationMimeTypes: '',
                allowedBlobExtensions: '',
                allowedBlobMimeTypes: '',
                limit: 30,
                offset,
            })
            .then((res) => {
                this.setBreadcrumbs(res.pathToRoot);
                this.ProcessNodeResults(res, accessId);
            })
            .catch((err) => {
                // Something went wrong, some mark us as no longer running.
                console.log(`**** Call failed: ${err}`);
            });
    }

    public processNextNodes(
        info: BTGlobalTreeNodesInfo,
        accessId: string,
        teamroot?: BTGlobalTreeNodeInfo
    ): void {
        switch (info.pathToRoot[0].resourceType) {
            case 'folder': {
                this.onshape
                    .OnshapeRequest(info.next, BTGlobalTreeNodesInfoFromJSON)
                    .then((res: BTGlobalTreeNodesInfo) => {
                        this.ProcessNodeResults(res, accessId, teamroot);
                    });
                break;
            }
            case 'magic': {
                const id = info.pathToRoot[0].id;
                if (id === 'RI') {
                    this.processRecentlyInsertedNode(
                        accessId,
                        info.pathToRoot,
                        parseInt(info.next)
                    );
                } else if (id === 'FV') {
                    this.processFavoritedNode(
                        accessId,
                        info.pathToRoot,
                        parseInt(info.next)
                    );
                } else if (id === 'LI') {
                    this.processLibrariesNode(
                        accessId,
                        info.pathToRoot,
                        parseInt(info.next)
                    );
                } else if (id !== 'GL' && id !== 'HI' && id !== 'CD') {
                    let next = 0;
                    if (info.next !== undefined && info.next) {
                        const matches = info.next.match(/offset=(\d+)/);
                        if (
                            matches !== undefined &&
                            matches !== null &&
                            matches.length > 1
                        )
                            next = parseInt(matches[1]);
                    }
                    this.processGlobalTreeNodes(id, accessId, next);
                }
                break;
            }
            case 'search': {
                // if (next !== 0) {
                //     let currentItem = this.currentBreadcrumbs[0];
                //     if (currentItem.jsonType === 'search')
                //         currentItem = this.currentBreadcrumbs[1];
                //     this.processInsertablesSearch(
                //         currentItem,
                //         searchInfo.description,
                //         accessId
                //     );
                // }
                if (this.currentInsertablesSearch !== undefined) {
                    const search = this.currentInsertablesSearch;
                    this.processInsertablesSearch(
                        search.item,
                        search.info.description,
                        accessId
                    ).then(() => {
                        this.getSearchItemByIndex(accessId, parseInt(info.next));
                    });
                } else {
                    this.getSearchItemByIndex(accessId, parseInt(info.next));
                }
                break;
            }
        }
        // Request the UI to jump to the next entry in the list.
    }

    private currentNodeInfo: BTGlobalTreeNodesInfo;

    /**
     * Dump out all the elements that were returned from Onshape
     * @param info Node entry to be processed
     * @param teamroot TreeNode information for a team root if this folder came from a team
     */
    public ProcessNodeResults(
        info: BTGlobalTreeNodesInfo,
        accessId: string,
        teamroot?: BTGlobalTreeNodeInfo,
        subsetConfigurables?: boolean
    ) {
        if (this.validAccessId(accessId) === false) return;
        
        if (
            info &&
            info.items &&
            info.items.length > 0 &&
            this.currentBreadcrumbs &&
            !(
                this.currentBreadcrumbs.length > 1 &&
                this.currentBreadcrumbs[0].jsonType === 'search'
            )
        )
            this.currentNodeInfo = info;
        // When it does, append all the elements to the UI
        this.appendElements(
            info.items,
            info.pathToRoot[0],
            teamroot,
            subsetConfigurables,
            accessId
        );
        // Do we have any more in the list and are we under the limit for the UI
        if (
            info.next !== '' &&
            info.next !== undefined &&
            this.loaded < this.loadedlimit
        ) {
            if (this.validAccessId(accessId) === false)
                return console.log('Invalid access id', info);
            // We have more entries, so lets put a little "Loading More..." element at the
            // end of the list.  When it becomes visible because they scrolled down or because there
            // is more room on the screen, we will delete that Loading More element and then process
            // the next set of entries
            const container = this.getFileListContainer();
            let rowelem = createDocumentElement('div', {
                class: 'document-version-item-row select-item-dialog-item-row os-selectable-item',
            });

            let textCol = createDocumentElement('div', {
                class: 'select-item-dialog-document-name-box os-col',
                content: 'Loading More...',
            });
            rowelem.appendChild(textCol);
            container.appendChild(rowelem);
            // When the Loading More... becomes visible on the screen, we can load the next element
            const observer = new IntersectionObserver(
                (entry) => {
                    if (entry[0].isIntersecting) {
                        observer.disconnect();
                        rowelem.remove();
                        this.processNextNodes(info, accessId, teamroot);
                    }
                },
                { threshold: [0] }
            );
            observer.observe(rowelem);
        }
    }

    public processMarkdownFile(content: string, accessId: string) {
        if (this.validAccessId(accessId) === false) return;

        const uiDiv = document.getElementById('dump');
        const container = createDocumentElement('div', { class: 'markdown-body' });

        let parsed = marked.parse(content);

        if (this.validAccessId(accessId) === false) return;
        uiDiv.innerHTML = '';
        container.innerHTML = parsed;

        Array.from(container.getElementsByTagName('a')).forEach((link) => {
            link.target = '_blank';
            link.rel = 'noreferrer noopener';
            link.onclick = () => window.open(link.href);
        });

        uiDiv.appendChild(container);

        // if (!(parsed instanceof Promise)) parsed = new Promise((res) => res(parsed));

        // parsed.then((html) => {
        //     if (this.validAccessId(accessId) === false) return;
        //     uiDiv.innerHTML = '';
        //     container.innerHTML = html;

        //     Array.from(container.getElementsByTagName('a')).forEach((link) => {
        //         link.target = '_blank';
        //         link.rel = 'noreferrer noopener';
        //         link.onclick = () => window.open(link.href);
        //     });

        //     uiDiv.appendChild(container);
        // });
    }

    /**
     * Navigate into a folder and populate the UI with the contents
     * @param item Entry to be processed
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     */
    public gotoFolder(item: BTGlobalTreeNodeInfo, teamroot?: BTGlobalTreeNodeInfo): void {
        this.hidePopup();
        this.hideActionMenu();
        this.hideBoxSelect();

        // Note that we are running and reset the count of entries we have gotten
        this.loaded = 0;

        // Clean up the UI so we can populate it with new entries
        let dumpNodes = document.getElementById('dump');

        // Create access ID to prevent unwanted content rendering
        let accessId = crypto.randomUUID();
        if (dumpNodes !== null) {
            dumpNodes.innerHTML = '';
            dumpNodes['data-accessid'] = accessId;
        } else {
            console.warn('why does this happen');
            dumpNodes = document.body;
        }
        const container = this.getFileListContainer();
        container.innerHTML = '';
        dumpNodes.appendChild(container);
        if (item.jsonType === 'team-summary') {
            this.onshape.globalTreeNodesApi
                .globalTreeNodesTeamInsertables({
                    teamId: item.id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                .then((res) => {
                    if (
                        res.pathToRoot &&
                        res.pathToRoot[0] &&
                        res.pathToRoot[0].resourceType === 'team'
                    ) {
                        res.pathToRoot[0].jsonType = 'team-summary'; //fix pathToRoot because it has all the right information except jsonType
                    }
                    this.setBreadcrumbs(res.pathToRoot, item);
                    this.ProcessNodeResults(res, accessId, item);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                });
        } else if (item.jsonType === 'proxy-library') {
            this.libraries
                .getProxyLibrary(undefined, item.id)
                .then((res) => {
                    this.addBreadcrumbNode(item);
                    //add notification for community library, a little hacky but it will work
                    if(item.id === this.communityLibraryNode){
                        res.contents.unshift({
                            jsonType: "notification",
                            name: "To view document: Right-click > Open document in new tab.\n Please email robotics@cghsnc.org to share your open source parts here."
                        })
                    }
                    this.ProcessNodeResults(
                        {
                            items: res.contents,
                            pathToRoot: this.currentBreadcrumbs,
                        },
                        accessId,
                        teamroot
                    );
                })
                .catch((err) => {
                    if (err.status === 403) {
                        //User should delete library
                        dumpNodes.innerText =
                            'Library does not exist\nPlease recover it or remove this library';
                        this.processMagicNode(this.currentBreadcrumbs[0].id, accessId);
                    }
                });
        } else if (item.jsonType === 'proxy-folder') {
            this.libraries.getProxyLibrary(undefined, item.projectId).then((res) => {
                if (res !== undefined) {
                    const { library } = res;
                    this.addBreadcrumbNode(item);
                    //use breadcrumbs for library
                    this.libraries.getProxyFolder(library, item.id).then((res) => {
                        this.ProcessNodeResults(
                            {
                                items: res,
                                pathToRoot: this.currentBreadcrumbs,
                            },
                            accessId,
                            teamroot
                        );
                    });
                }
            });
        } else if (item.jsonType === 'home') {
            this.processHome(dumpNodes);
        } else if (item.jsonType === 'magic' || item.resourceType === 'magic') {
            this.processMagicNode(item.id, accessId);
        } else if (item.jsonType === 'search') {
            if (item.description === '' || item.description == undefined) {
                const searchBoxInput = document.getElementById('searchboxinput');
                if (searchBoxInput != null)
                    item.description = (searchBoxInput as HTMLInputElement).value;
                if (item.description === '')
                    return this.gotoFolder(this.currentBreadcrumbs[1]);
            }
            this.processSearch(item, accessId);
        } else {
            this.onshape.globalTreeNodesApi
                .globalTreeNodesFolderInsertables({
                    fid: item.id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                .then((res) => {
                    this.addBreadcrumbNode(
                        (res && res.pathToRoot && res.pathToRoot[0]) || item
                    );
                    this.ProcessNodeResults(res, accessId, teamroot);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                });
        }
        this.checkSearchBarEnabled(item);
    }
}
