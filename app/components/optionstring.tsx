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
import { BTMConfigurationParameterString872 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

//         {
//             "btType": "BTMConfigurationParameterString-872",
//             "nodeId": "Mj6bWjD/bLdPLQbhf",
//             "parameterId": "TestVariable",
//             "parameterName": "TestVariable",
//             "defaultValue": "Some Value"
//         },
// CURRENT CONFIGURATION
//         {
//             "btType": "BTMParameterString-149",
//             "nodeId": "MYOSYLAAKhyIVRctv",
//             "parameterId": "TestVariable",
//             "value": "Some Value"
//         },

export const OptString = (props) => {
    const { value, index, onchange } = props;
    const optString = value as BTMConfigurationParameterString872;
    return (
        <os-string-parameter>
            <span
                class="os-param-wrapper os-param-container"
                data-parameter-id={optString.parameterId}
            >
                <label class="os-param-label">{optString.parameterName}</label>
                <input
                    class={
                        'os-param-text ng-pristine ng-untouched ng-valid ng-not-empty os-param-form-item cv' +
                        index
                    }
                    data-id={optString.parameterId}
                    type="text"
                    data-type="string"
                    autocomplete={optString.nodeId}
                    placeholder=""
                    value={optString.defaultValue}
                    onchange={onchange}
                    savedconfigurationvalue = {optString.defaultValue}
                />
            </span>
        </os-string-parameter>
    );
};
