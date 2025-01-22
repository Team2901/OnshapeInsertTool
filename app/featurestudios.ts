import { OnshapeAPI } from './onshapeapi';

export interface featureScriptImport {
    did: string;
    vid: string;
    eid: string;
    mvid: string;
}

export class FeatureStudios {
    public onshape: OnshapeAPI;

    private FEATURESTUDIO_NAME = 'Imported Features|FTC Insert Tool';
    private PREFIX_COMMENT =
        '//DO NOT EDIT\n//This feature studio was generated by the FTC Insert Tool\n//Access the imported features with the "Custom features in this workspace"';

    private FEATURE_SCRIPT_VERSION = '2543.0';

    /**
     * Initialize the app because we have gotten permission from Onshape to access content
     */
    public constructor(onshape: OnshapeAPI) {
        this.onshape = onshape;
    }

    public hasDocumentFeatureStudio(
        documentId: string,
        workspaceId: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .getElementsInDocument({
                    did: documentId,
                    wvm: 'w',
                    wvmid: workspaceId,
                })
                .then((res) => {
                    if (res == undefined) return resolve(undefined);
                    for (let element of res) {
                        if (
                            element.elementType === 'FEATURESTUDIO' &&
                            element.name === this.FEATURESTUDIO_NAME
                        ) {
                            return resolve(element.id);
                        }
                    }
                    resolve(undefined);
                });
        });
    }

    public getDocumentFeatureStudio(
        documentId: string,
        workspaceId: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.hasDocumentFeatureStudio(documentId, workspaceId).then((res) => {
                if (res !== undefined) return resolve(res);
                this.onshape.featureStudioApi
                    .createFeatureStudio({
                        did: documentId,
                        wid: workspaceId,
                        bTModelElementParams: { name: this.FEATURESTUDIO_NAME },
                    })
                    .then((res) => {
                        if (res === undefined)
                            console.error('Create feature studio failed');
                        return resolve(res.id);
                    })
                    .catch((err) => {
                        console.warn(err);
                    });
            });
        });
    }

    public appendToFeatureStudio(
        imports: featureScriptImport[],
        documentId: string,
        workspaceId: string
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.getDocumentFeatureStudio(documentId, workspaceId).then((studioId) => {
                if (studioId == undefined) {
                    console.warn('getDocumentFeatureStudio failed');
                    resolve(undefined);
                }

                this.onshape.featureStudioApi
                    .getFeatureStudioContents({
                        did: documentId,
                        wvm: 'w',
                        wvmid: workspaceId,
                        eid: studioId,
                    })
                    .then((res) => {
                        const script = res.contents;
                        const importRegex =
                            /path ?: ?"([A-z,0-9]+\/[A-z,0-9]+\/[A-z,0-9]+", ?version ?: ?"[A-z,0-9]+")/gim;
                        const importSingleRegex = /[A-z,0-9]+(?=[\",\/])/gm;
                        const importMatches = script.matchAll(importRegex);
                        for (const match of importMatches) {
                            const importSingleMatches = match[1].match(importSingleRegex);
                            const addImport = {
                                did: importSingleMatches[0],
                                vid: importSingleMatches[1],
                                eid: importSingleMatches[2],
                                mvid: importSingleMatches[3],
                            };
                            let uniqueImport = true;
                            for (let imp of imports) {
                                if (
                                    imp.did == addImport.did &&
                                    imp.vid == addImport.vid &&
                                    imp.eid == addImport.eid &&
                                    imp.mvid == addImport.mvid
                                )
                                    uniqueImport = false;
                            }
                            if (uniqueImport) imports.push(addImport);
                        }
                        let updatedScript = this.PREFIX_COMMENT + '\n';
                        updatedScript += `FeatureScript ${Number(
                            this.FEATURE_SCRIPT_VERSION
                        )};\nimport(path : "onshape/std/geometry.fs", version : "${
                            this.FEATURE_SCRIPT_VERSION
                        }");\n`;
                        for (let importFeature of imports) {
                            updatedScript += `export import ( path : "${importFeature.did}/${importFeature.vid}/${importFeature.eid}", version: "${importFeature.mvid}");\n`;
                        }

                        this.onshape.featureStudioApi
                            .updateFeatureStudioContents({
                                did: documentId,
                                wvm: 'w',
                                wvmid: workspaceId,
                                eid: studioId,
                                bTFeatureStudioContents2239: { contents: updatedScript },
                            })
                            .then(() => {
                                resolve(true);
                            });
                    });
            });
        });
    }
}
