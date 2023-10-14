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
import { BTMConfigurationParameterEnum105 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

//         {
//             "btType": "BTMConfigurationParameterEnum-105",
//             "nodeId": "M3EHnVsn3XTZa53Ke",
//             "parameterId": "List_xhwsnzXruq3Ri4",
//             "parameterName": "Which Extra Block",
//             "defaultValue": "Default",
//             "enumName": "List_xhwsnzXruq3Ri4_conf",
//             "namespace": "",
//             "options": [
//                 {
//                     "btType": "BTMEnumOption-592",
//                     "nodeId": "MnV7gQh05+fQmuqci",
//                     "option": "Default",
//                     "optionName": "Item1"
//                 },
//                 {
//                     "btType": "BTMEnumOption-592",
//                     "nodeId": "MGhqJCa5OPBd4+lLL",
//                     "option": "Item2",
//                     "optionName": "Item2"
//                 },
//                 {
//                     "btType": "BTMEnumOption-592",
//                     "nodeId": "MPOPNFAzj/yIOshGn",
//                     "option": "Item_3",
//                     "optionName": "Item 3"
//                 }
//             ]
//         },
//         {
//             "btType": "BTMConfigurationParameterEnum-105",
//             "nodeId": "M4uNTty2y5T8l/CFE",
//             "parameterId": "List_qZ128Eq2HMz4pF",
//             "parameterName": "Bottom Square Color",
//             "defaultValue": "Default",
//             "enumName": "List_qZ128Eq2HMz4pF_conf",
//             "namespace": "",
//             "options": [
//                 {
//                     "btType": "BTMEnumOption-592",
//                     "nodeId": "MZ95LPxFsFeoDzfu7",
//                     "option": "Default",
//                     "optionName": "Red"
//                 },
//                 {
//                     "btType": "BTMEnumOption-592",
//                     "nodeId": "MzaWkmJyhZdMunIkc",
//                     "option": "R",
//                     "optionName": "Blue"
//                 }
//             ]
//         }
// Current Configuration
//         {
//             "btType": "BTMParameterEnum-145",
//             "nodeId": "MIHuR+jMFKM3B4EUN",
//             "parameterId": "List_xhwsnzXruq3Ri4",
//             "enumName": "List_xhwsnzXruq3Ri4_conf",
//             "namespace": "",
//             "value": "Default"
//         },
//         {
//             "btType": "BTMParameterEnum-145",
//             "nodeId": "MIVPvJnDzaK8lFe2F",
//             "parameterId": "List_qZ128Eq2HMz4pF",
//             "enumName": "List_qZ128Eq2HMz4pF_conf",
//             "namespace": "",
//             "value": "Default"
//         }

export const OptEnum = (props) => {
    const { value, index, onchange } = props;
    const optEnum = value as BTMConfigurationParameterEnum105;

    return (
        <os-enum-parameter>
            <span class="os-param-wrapper os-param-select">
                <label class="os-param-label">
                    <span>{optEnum.parameterName}</span>
                </label>
                <div class="os-select-container os-select-bootstrap dropdown ng-not-empty ng-valid">
                    <span class="os-select-match-text float-start">
                        <select
                            data-id={optEnum.parameterId}
                            style="border:none; width:100%"
                            class={'cv' + index}
                            data-type="enum"
                            onchange={onchange}
                            savedconfigurationvalue = {optEnum.defaultValue}
                        >
                            {optEnum.options.map((enumopt) => (
                                <option value={enumopt.option}>
                                    {enumopt.optionName}
                                </option>
                            ))}
                        </select>
                    </span>
                </div>
            </span>
        </os-enum-parameter>
    );
};
