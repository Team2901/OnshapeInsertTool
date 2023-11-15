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

import { ExchangeToken, IExchangeToken, RefreshToken } from './oauth';
import * as runtime from 'onshape-typescript-fetch/runtime';
import { URLApi } from './urlapi';
import {
    GlobalTreeNodesApi,
    MetadataApi,
    ElementApi,
    DocumentApi,
    PartApi,
    PartStudioApi,
    AssemblyApi,
    ThumbnailApi,
    InsertableApi,
    BTDocumentSummaryInfo,
    APIApplicationApi,
    AccountApi,
    AliasApi,
    AppAssociativeDataApi,
    AppElementApi,
    BillingApi,
    BlobElementApi,
    CommentApi,
    CompanyApi,
    DrawingApi,
    EventApi,
    ExportRuleApi,
    FeatureStudioApi,
    FolderApi,
    MetadataCategoryApi,
    OpenApiApi,
    PartNumberApi,
    PropertiesTableTemplateApi,
    PublicationApi,
    ReleasePackageApi,
    RevisionApi,
    SketchApi,
    TeamApi,
    TranslationApi,
    UserApi,
    VariablesApi,
    VersionApi,
    WebhookApi,
    WorkflowApi,
    BTThumbnailInfo,
} from 'onshape-typescript-fetch';
import { createDocumentElement } from './common/htmldom';

// Optional parameters when creating a thumbnail
type createThumbnailOptions = {
    width?: number;
    height?: number;
    retry?: boolean;
    retryInterval?: number;
    id?: string;
};

// A function to notify in the case of catastrophic failure
export type failAppFunc = (reason: string) => void;

// General configuration options
export type onshapeConfig = {
    documentId?: string; // The main document we are referencing
    workspaceId?: string; // THe work
    elementId?: string;
    server?: string;
    userId?: string;
    clientId?: string;
    companyId?: string;
    code?: string;
    myserver?: string;
    failApp?: failAppFunc;
};
/**
 * BaseApp contains all the support routines that your application will need.
 * You should not need to make any changes in this file (except for potential bug fixes)
 * because everything you will want to override will be in app.ts (or other files you extend it with)
 */

export class OnshapeAPI {
    public documentId = '';
    public workspaceId = '';
    public elementId = '';
    public server = 'https://cad.onshape.com';
    public baseserver = '';
    public userId = '';
    public clientId = '';
    public companyId = '';
    public code = '';
    public myserver = '';
    public access_token: string;
    public refresh_token: string;
    public expires_token: Date;

    public apiApplicationApi: APIApplicationApi;
    public accountApi: AccountApi;
    public aliasApi: AliasApi;
    public appAssociativeDataApi: AppAssociativeDataApi;
    public appElementApi: AppElementApi;
    public assemblyApi: AssemblyApi;
    public billingApi: BillingApi;
    public blobElementApi: BlobElementApi;
    public commentApi: CommentApi;
    public companyApi: CompanyApi;
    public documentApi: DocumentApi;
    public drawingApi: DrawingApi;
    public elementApi: ElementApi;
    public eventApi: EventApi;
    public exportRuleApi: ExportRuleApi;
    public featureStudioApi: FeatureStudioApi;
    public folderApi: FolderApi;
    public globalTreeNodesApi: GlobalTreeNodesApi;
    public insertableApi: InsertableApi;
    public metadataApi: MetadataApi;
    public metadataCategoryApi: MetadataCategoryApi;
    public openApiApi: OpenApiApi;
    public partApi: PartApi;
    public partNumberApi: PartNumberApi;
    public partStudioApi: PartStudioApi;
    public propertiesTableTemplateApi: PropertiesTableTemplateApi;
    public publicationApi: PublicationApi;
    public releasePackageApi: ReleasePackageApi;
    public revisionApi: RevisionApi;
    public sketchApi: SketchApi;
    public teamApi: TeamApi;
    public thumbnailApi: ThumbnailApi;
    public translationApi: TranslationApi;
    public userApi: UserApi;
    public variablesApi: VariablesApi;
    public versionApi: VersionApi;
    public webhookApi: WebhookApi;
    public workflowApi: WorkflowApi;

    public urlAPI: URLApi;
    public configuration: runtime.Configuration;
    public failApp: failAppFunc;

    // Initializes the object
    constructor(config: onshapeConfig) {
        if (config !== undefined) {
            if (config.documentId !== undefined) {
                this.documentId = config.documentId;
            }
            if (config.workspaceId !== undefined) {
                this.workspaceId = config.workspaceId;
            }
            if (config.elementId !== undefined) {
                this.elementId = config.elementId;
            }
            if (config.server !== undefined) {
                this.server = config.server;
            }
            if (config.userId !== undefined) {
                this.userId = config.userId;
            }
            if (config.clientId !== undefined) {
                this.clientId = config.clientId;
            }
            if (config.companyId !== undefined) {
                this.companyId = config.companyId;
            }
            if (config.code !== undefined) {
                this.code = config.code;
            }
            if (config.myserver !== undefined) {
                this.myserver = config.myserver;
            }
            if (config.failApp !== undefined) {
                this.failApp = config.failApp;
            }
        }
    }
    public defaultAppFailure(reason: String): void {
        console.log(`Uncaught app failure`);
    }
    /**
     * Request refreshing the token because it has expired
     */
    public refreshtoken(): void {
        let xhr = new XMLHttpRequest();
        let url = this.myserver + '/refresh.php?code=' + this.clientId;
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
            }
        };
        xhr.send();
    }
    /**
     * Get the current access token (refreshing it if it has expired)
     * @returns Promise to the access token
     */
    public getAccessToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const now = new Date();
            if (now >= this.expires_token) {
                RefreshToken(this.myserver + '/refresh.php', this.refresh_token)
                    .then((v: IExchangeToken) => {
                        const now = new Date();

                        // We have successfully refreshed the token so let the app continue
                        this.access_token = v.access_token;
                        this.refresh_token = v.refresh_token;
                        this.expires_token = new Date(
                            now.getTime() + v.expires_in * 1000
                        );

                        resolve('Bearer ' + this.access_token);
                    })
                    .catch((reason: string) => {
                        // Something went wrong, so let the user know
                        if (this.failApp !== undefined) {
                            this.failApp(reason);
                        }
                        reject(reason);
                    });
            } else {
                resolve('Bearer ' + this.access_token);
            }
        });
    }
    /**
     * Get the initial authentication token and initialize the apis
     * @returns
     */
    public init(): Promise<void> {
        //
        // We need to reconstruct the redirect_uri which was used to start the application.
        // It must match EXACTLY what is put into the ActionURL redirect_uri for the extension
        // See https://onshape-public.github.io/docs/oauth/#exchanging-the-code-for-a-token
        //
        const redirect_uri = `${this.myserver}/?documentId=${this.documentId}&workspaceId=${this.workspaceId}&elementId=${this.elementId}`;
        //
        // Next we need to take the code and exchange it for authentication tokens
        // Until we get a response, we don't do anything
        //
        return new Promise((resolve, reject) => {
            ExchangeToken(this.myserver + '/oauth.php', redirect_uri, this.code)
                .then((v: IExchangeToken) => {
                    const now = new Date();
                    const expires = new Date(now.getTime() + v.expires_in * 1000);
                    this.initAPIs(v.access_token, v.refresh_token, expires);
                    resolve();
                })
                .catch((reason: string) => {
                    reject(reason);
                });
        });
    }
    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     * @param access_token Access token returned by Onshape
     * @param refresh_token Refresh token needed if the Access Token has to be refreshed
     * @param expires Time when the token expires and needs to be updated
     */
    public initAPIs(access_token: string, refresh_token: string, expires: Date) {
        // We want to strip off everything before the /api/
        const apipos = runtime.BASE_PATH.lastIndexOf('/api/');
        this.baseserver = runtime.BASE_PATH.substring(0, apipos);
        const apipart = runtime.BASE_PATH.substring(apipos);
        // No trailing slash on the target server
        const myserver = this.myserver.replace(/\/+$/, '');

        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_token = expires;

        const uriconfigparams: runtime.ConfigurationParameters = {
            basePath: myserver, // override base path
            accessToken: (name?: string, scopes?: string[]): Promise<string> => {
                return this.getAccessToken();
            },
            headers: { 'X-Server': this.server },
            //header params we want to use on every request
        };
        //
        // For the URLs that get returned from Onshape APIs, we need to
        // be able to clean them up and send them to our Lambda.  Since they
        // are likely to have the right /api/ prefix (or /api/v5) we want to
        // take them as is and pass it straight to the server.
        //
        const urlConfiguration = new runtime.Configuration(uriconfigparams);

        this.urlAPI = new URLApi(urlConfiguration);

        // For the other standard apis, we need to include the /api/ prefix
        const configparams = { ...uriconfigparams };
        configparams.basePath = myserver + apipart;

        // Initialize all the APIs that we need to support
        this.configuration = new runtime.Configuration(configparams);

        this.apiApplicationApi = new APIApplicationApi(this.configuration);
        this.accountApi = new AccountApi(this.configuration);
        this.aliasApi = new AliasApi(this.configuration);
        this.appAssociativeDataApi = new AppAssociativeDataApi(this.configuration);
        this.appElementApi = new AppElementApi(this.configuration);
        this.assemblyApi = new AssemblyApi(this.configuration);
        this.billingApi = new BillingApi(this.configuration);
        this.blobElementApi = new BlobElementApi(this.configuration);
        this.commentApi = new CommentApi(this.configuration);
        this.companyApi = new CompanyApi(this.configuration);
        this.documentApi = new DocumentApi(this.configuration);
        this.drawingApi = new DrawingApi(this.configuration);
        this.elementApi = new ElementApi(this.configuration);
        this.eventApi = new EventApi(this.configuration);
        this.exportRuleApi = new ExportRuleApi(this.configuration);
        this.featureStudioApi = new FeatureStudioApi(this.configuration);
        this.folderApi = new FolderApi(this.configuration);
        this.globalTreeNodesApi = new GlobalTreeNodesApi(this.configuration);
        this.insertableApi = new InsertableApi(this.configuration);
        this.metadataApi = new MetadataApi(this.configuration);
        this.metadataCategoryApi = new MetadataCategoryApi(this.configuration);
        this.openApiApi = new OpenApiApi(this.configuration);
        this.partApi = new PartApi(this.configuration);
        this.partNumberApi = new PartNumberApi(this.configuration);
        this.partStudioApi = new PartStudioApi(this.configuration);
        this.propertiesTableTemplateApi = new PropertiesTableTemplateApi(
            this.configuration
        );
        this.publicationApi = new PublicationApi(this.configuration);
        this.releasePackageApi = new ReleasePackageApi(this.configuration);
        this.revisionApi = new RevisionApi(this.configuration);
        this.sketchApi = new SketchApi(this.configuration);
        this.teamApi = new TeamApi(this.configuration);
        this.thumbnailApi = new ThumbnailApi(this.configuration);
        this.translationApi = new TranslationApi(this.configuration);
        this.userApi = new UserApi(this.configuration);
        this.variablesApi = new VariablesApi(this.configuration);
        this.versionApi = new VersionApi(this.configuration);
        this.webhookApi = new WebhookApi(this.configuration);
        this.workflowApi = new WorkflowApi(this.configuration);
    }
    /**
     * Get a thumbnail for an Onshape hosted image
     * This addresses the issue where we want to do <img src="https://cad.onshape.com/...">
     * But it can't be displayed by the browser because we don't have the Bearer token on the request
     * This will effectively be a lazy load, populating the image when it becomes available
     * @param url URL of image to retrieve
     * @returns base 64 image data string
     */
    public getThumbnail(urlReq: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();

            const url = this.myserver + this.fixOnshapeURI(urlReq);
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + this.access_token);
            xhr.setRequestHeader('X-Server', this.server);
            xhr.setRequestHeader(
                'Accept',
                'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            );
            // We want to get a blob so that it isn't UTF-8 encoded along the way
            xhr.responseType = 'blob';

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (
                            xhr.response.size === 0 ||
                            xhr.response.type === 'text/xml' ||
                            xhr.response.type === 'application/json'
                        ) {
                            reject('Not Found');
                        } else {
                            // Parse out the downloaded image into a data URL (this automatically base64 encodes it)
                            var reader = new FileReader();
                            reader.readAsDataURL(xhr.response);
                            reader.onloadend = function () {
                                resolve(reader.result.toString());
                            };
                        }
                    } else {
                        reject(xhr.responseText);
                    }
                }
            };
            xhr.send();
        });
    }
    /**
     *
     * @param item Onshape element to display thumbnail for
     * @param options Options to control the display
     *                height (default 40) is height of the image to request
     *                width (default 70) is the width of the image to request
     *                retry indicates that we should retry the image if it isn't found
     *                retryInterval (default 2) is how frequently in seconds we should retry to get the image
     * @returns HTMLElement of the image dom element
     */
    public createThumbnailImage(
        item: BTDocumentSummaryInfo,
        options?: createThumbnailOptions
    ): HTMLElement {
        const {
            height = 40,
            width = 70,
            retry = false,
            retryInterval = 2,
            id = undefined,
        } = options || {};
        // // Override any defaults
        // if (options !== undefined) {
        //     if (options.height !== undefined) {
        //         height = options.height;
        //     }
        //     if (options.width !== undefined) {
        //         width = options.width;
        //     }
        //     if (options.retry !== undefined) {
        //         retry = options.retry;
        //     }
        //     if (options.retryInterval !== undefined) {
        //         retryInterval = options.retryInterval;
        //     }
        //     if (options.id !== undefined) {
        //         id = options.id;
        //     }
        // }
        const targetsize = `${width}x${height}`;
        let verPart = '';
        if (
            item.recentVersion !== undefined &&
            item.recentVersion !== null &&
            item.recentVersion.id !== undefined &&
            item.recentVersion.id !== null
        ) {
            verPart = `/v/${item.recentVersion.id}`;
        }
        console.log(item, 'for image thumbnail creation');
        let imageURL = `${this.myserver}/api/thumbnails/d/${item.id}`;
        if (item['elementType'] === 'PARTSTUDIO' && item.defaultWorkspace !== undefined) {
            imageURL += `/w/${item.defaultWorkspace.id}`;
            imageURL += `/e/${item['elementId']}`;
        } else {
            imageURL += `${verPart}`;
        }
        imageURL += `/s/${width}x${height}`;

        if (item.thumbnail !== undefined && item.thumbnail !== null && item['elementType'] !== 'PARTSTUDIO') {
            // We have a potential thumbnail URI we can work from
            // See if we can find a URI that matches
            for (let thumbnailInfo of item.thumbnail.sizes) {
                if (
                    thumbnailInfo.size === targetsize &&
                    thumbnailInfo.href !== undefined &&
                    thumbnailInfo.href !== null
                ) {
                    imageURL = thumbnailInfo.href;
                    break;
                }
            }
        }
        // if (retry) {
        //     imageURL += '&rejectEmpty=true';
        // }
        const imgChildThumbnail = createDocumentElement('img', {
            src: 'https://cad.onshape.com/images/default-document.png',
            width: String(width),
            height: String(height),
            id: id,
        }) as HTMLImageElement;

        this.getThumbnail(imageURL)
            .then((src) => {
                imgChildThumbnail.setAttribute('src', src);
            })
            .catch((err) => {
                if (retry) {
                    this.retryThumbnail(imgChildThumbnail, imageURL, retryInterval, 20);
                }
            });
        return imgChildThumbnail;
    }
    /**
     * Attempt to reload an image for a period of time.
     * @param elem Element to update image on
     * @param imageURL URL for image to load
     * @param interval Interval to wait
     * @param retries Maximum number of times to retry the image
     */
    public retryThumbnail(
        elem: HTMLImageElement,
        imageURL: string,
        interval: number,
        retries: number
    ) {
        retries--;
        if (retries > 0 && elem.isConnected) {
            setTimeout(() => {
                this.getThumbnail(imageURL)
                    .then((src) => {
                        elem.setAttribute('src', src);
                    })
                    .catch((err) => {
                        this.retryThumbnail(elem, imageURL, interval, retries);
                    });
            }, 1000 * interval);
        }
    }
    /**
     *
     * @param elem Element to update image on
     * @param thumbnail Thumbnail information
     * @param options Options to control the display
     *                height (default 40) is height of the image to request
     *                width (default 70) is the width of the image to request
     *                retry indicates that we should retry the image if it isn't found
     *                retryInterval (default 2) is how frequently in seconds we should retry to get the image
     */
    public replaceThumbnailImage(
        elem: HTMLImageElement,
        thumbnail: BTThumbnailInfo,
        options?: createThumbnailOptions
    ): void {
        const {
            height = 40,
            width = 70,
            retry = false,
            retryInterval = 2,
            id = undefined,
        } = options || {};
        const targetsize = `${width}x${height}`;

        if (thumbnail !== undefined && thumbnail !== null) {
            let imageURL = '';
            // We have a potential thumbnail URI we can work from
            // See if we can find a URI that matches
            for (let thumbnailInfo of thumbnail.sizes) {
                if (
                    thumbnailInfo.size === targetsize &&
                    thumbnailInfo.href !== undefined &&
                    thumbnailInfo.href !== null
                ) {
                    imageURL = thumbnailInfo.href;
                    break;
                }
            }
            // if (retry) {
            //     imageURL += '&rejectEmpty=true';
            // }
            this.getThumbnail(imageURL)
                .then((src) => {
                    elem.setAttribute('src', src);
                })
                .catch((_err) => {
                    if (retry) {
                        this.retryThumbnail(elem, imageURL, retryInterval, 20);
                    }
                });
        }
    }

    /**
     *
     * @param uri URI returned from Onshape
     * @returns Cleaned up URI that can be passed to
     */
    public fixOnshapeURI(uri: string): string {
        if (uri === undefined || uri === null) {
            return '';
        }
        const apipos = uri.indexOf('/api/');
        if (apipos >= 0) {
            uri = uri.substring(apipos);
        }
        return uri;
    }
    /**
     * Call a generic URL returned from an Onshape response and transform it to the correct type
     * @param url Url to call
     * @param infoFromJSON Transformation function pointer that takes a JSON result and converts it to the right type
     * @param method  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' Default='GET'
     * @param initOverrides Any overrides specific to this one request
     * @returns A promise that will return the result of the call
     */
    public async OnshapeRequest(
        url: string,
        infoFromJSON: (json: any) => any,
        method: runtime.HTTPMethod = 'GET',
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<any> {
        // console.log(`***Onshape Request ${url}`);
        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            // oauth required
            headerParameters['Authorization'] = await this.configuration.accessToken(
                'OAuth2',
                ['OAuth2Read']
            );
        }

        if (
            this.configuration &&
            (this.configuration.username !== undefined ||
                this.configuration.password !== undefined)
        ) {
            headerParameters['Authorization'] =
                'Basic ' +
                btoa(this.configuration.username + ':' + this.configuration.password);
        }

        const response = await this.urlAPI.request({
            path: this.fixOnshapeURI(url),
            method: method,
            headers: headerParameters,
            query: {},
        });

        const result = new runtime.JSONApiResponse(response, (jsonValue) =>
            infoFromJSON(jsonValue)
        );
        return await result.value();
    }
}
