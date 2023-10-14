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
import { BTMConfigurationParameterQuantity1826 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

//         {
//             "btType": "BTMConfigurationParameterQuantity-1826",
//             "nodeId": "Mmo70rFbGwU68Df/1",
//             "parameterId": "LengthVariable",
//             "parameterName": "LengthVariable",
//             "quantityType": "LENGTH",
//             "rangeAndDefault": {
//                 "btType": "BTQuantityRange-181",
//                 "defaultValue": 1,
//                 "location": {
//                     "btType": "BTLocationInfo-226",
//                     "character": 0,
//                     "column": 0,
//                     "document": "",
//                     "elementMicroversion": "",
//                     "endCharacter": 0,
//                     "endColumn": 0,
//                     "endLine": 0,
//                     "languageVersion": 0,
//                     "line": 0,
//                     "moduleIds": {
//                         "btType": "BTDocumentVersionElementIds-1897",
//                         "documentId": "",
//                         "elementId": "",
//                         "versionId": ""
//                     },
//                     "nodeId": "OM199BEOlSat7Lax",
//                     "parseNodeId": "",
//                     "topLevel": "",
//                     "version": ""
//                 },
//                 "maxValue": 100000,
//                 "minValue": 0,
//                 "units": "millimeter"
//             }
//         },
//         {
//             "btType": "BTMConfigurationParameterQuantity-1826",
//             "nodeId": "M/seEMAIsBKBBZYWx",
//             "parameterId": "Angle_Variable",
//             "parameterName": "Angle Variable",
//             "quantityType": "ANGLE",
//             "rangeAndDefault": {
//                 "btType": "BTQuantityRange-181",
//                 "defaultValue": 1,
//                 "location": {
//                     "btType": "BTLocationInfo-226",
//                     "character": 0,
//                     "column": 0,
//                     "document": "",
//                     "elementMicroversion": "",
//                     "endCharacter": 0,
//                     "endColumn": 0,
//                     "endLine": 0,
//                     "languageVersion": 0,
//                     "line": 0,
//                     "moduleIds": {
//                         "btType": "BTDocumentVersionElementIds-1897",
//                         "documentId": "",
//                         "elementId": "",
//                         "versionId": ""
//                     },
//                     "nodeId": "AaJGdfFtZIPTXkkl",
//                     "parseNodeId": "",
//                     "topLevel": "",
//                     "version": ""
//                 },
//                 "maxValue": 180,
//                 "minValue": 0,
//                 "units": "degree"
//             }
//         },
//         {
//             "btType": "BTMConfigurationParameterQuantity-1826",
//             "nodeId": "MRa0AD/lJCJExUBuN",
//             "parameterId": "Integer_Variable",
//             "parameterName": "Holes",
//             "quantityType": "INTEGER",
//             "rangeAndDefault": {
//                 "btType": "BTQuantityRange-181",
//                 "defaultValue": 1,
//                 "location": {
//                     "btType": "BTLocationInfo-226",
//                     "character": 0,
//                     "column": 0,
//                     "document": "",
//                     "elementMicroversion": "",
//                     "endCharacter": 0,
//                     "endColumn": 0,
//                     "endLine": 0,
//                     "languageVersion": 0,
//                     "line": 0,
//                     "moduleIds": {
//                         "btType": "BTDocumentVersionElementIds-1897",
//                         "documentId": "",
//                         "elementId": "",
//                         "versionId": ""
//                     },
//                     "nodeId": "w2Y9xvyKSWPVRqea",
//                     "parseNodeId": "",
//                     "topLevel": "",
//                     "version": ""
//                 },
//                 "maxValue": 42,
//                 "minValue": 0,
//                 "units": ""
//             }
//         },
//         {
//             "btType": "BTMConfigurationParameterQuantity-1826",
//             "nodeId": "Mv1mu6Q3Y3AK0CpWS",
//             "parameterId": "RealVariable",
//             "parameterName": "RealVariable",
//             "quantityType": "REAL",
//             "rangeAndDefault": {
//                 "btType": "BTQuantityRange-181",
//                 "defaultValue": 1,
//                 "location": {
//                     "btType": "BTLocationInfo-226",
//                     "character": 0,
//                     "column": 0,
//                     "document": "",
//                     "elementMicroversion": "",
//                     "endCharacter": 0,
//                     "endColumn": 0,
//                     "endLine": 0,
//                     "languageVersion": 0,
//                     "line": 0,
//                     "moduleIds": {
//                         "btType": "BTDocumentVersionElementIds-1897",
//                         "documentId": "",
//                         "elementId": "",
//                         "versionId": ""
//                     },
//                     "nodeId": "k0PqqEWhhn+5RtpL",
//                     "parseNodeId": "",
//                     "topLevel": "",
//                     "version": ""
//                 },
//                 "maxValue": 4242,
//                 "minValue": 0,
//                 "units": ""
//             }
//         },
// CURRENT CONFIGURATION
//         {
//             "btType": "BTMParameterQuantity-147",
//             "nodeId": "Mc29VgTsa8DroMmRF",
//             "parameterId": "LengthVariable",
//             "expression": "1 mm",
//             "isInteger": false,
//             "units": "millimeter",
//             "value": 1
//         },
//         {
//             "btType": "BTMParameterQuantity-147",
//             "nodeId": "MfOOsDGbkJP0eGPPv",
//             "parameterId": "Angle_Variable",
//             "expression": "1 deg",
//             "isInteger": false,
//             "units": "degree",
//             "value": 1
//         },
//         {
//             "btType": "BTMParameterQuantity-147",
//             "nodeId": "MOexZL5H5t709dSXe",
//             "parameterId": "Integer_Variable",
//             "expression": "1",
//             "isInteger": false,
//             "units": "",
//             "value": 1
//         },
//         {
//             "btType": "BTMParameterQuantity-147",
//             "nodeId": "M6jIL2Bz4RrleG0oB",
//             "parameterId": "RealVariable",
//             "expression": "1",
//             "isInteger": false,
//             "units": "",
//             "value": 1
//         },

export const OptQuantity = (props) => {
    const { value, index, onchange } = props;
    const optQuantity = value as BTMConfigurationParameterQuantity1826;

    const initialValue =
        optQuantity.rangeAndDefault.defaultValue +
        ' ' +
        optQuantity.rangeAndDefault.units;
    return (
        <os-quantity-parameter>
            <div
                class="os-param-wrapper os-param-container"
                data-parameter-id={optQuantity.parameterId}
            >
                <label
                    class="os-param-label"
                    data-bs-html="true"
                    data-bs-original-title={optQuantity.parameterName}
                    data-bs-placement="right"
                >
                    {optQuantity.parameterName}
                </label>
                <div
                    class="quantity-autocomplete-holder dropdown"
                    is-open="$ctrl.btParameter.isAutocompleteOpen"
                >
                    <input
                        class={
                            'os-param-number dropdown-source ng-pristine ng-untouched ng-valid ng-not-empty os-param-form-item cv' +
                            index
                        }
                        data-id={optQuantity.parameterId}
                        data-type="quantity"
                        type="text"
                        autocomplete="off"
                        value={initialValue}
                        onchange={onchange}
                        savedconfigurationvalue = {value.defaultValue}
                    />
                </div>
            </div>
        </os-quantity-parameter>
    );
};
