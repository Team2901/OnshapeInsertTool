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
import { BTMConfigurationParameterBoolean2550 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

//         {
//             "btType": "BTMConfigurationParameterBoolean-2550",
//             "nodeId": "MfEnrg6caclWD4RLi",
//             "parameterId": "CheckBox",
//             "parameterName": "MakeItRed",
//             "defaultValue": true
//         },
// Configuration value
//         {
//             "btType": "BTMParameterBoolean-144",
//             "nodeId": "MfG9Ciu94p/l7et/Z",
//             "parameterId": "CheckBox",
//             "value": true
//         },

export const OptBool = (props) => {
    const { value, index, onchange } = props;
    const optBool = value as BTMConfigurationParameterBoolean2550;
    {
        return (
            <os-boolean-parameter>
                <div
                    class="os-param-wrapper os-param-container"
                    data-parameter-id={optBool.parameterId}
                >
                    <label
                        class="os-param-checkbox"
                        data-bs-html="true"
                        data-bs-original-title={optBool.parameterName}
                        data-bs-placement="right"
                    >
                        <input
                            class={
                                'os-param-checkbox-input ng-pristine ng-untouched ng-valid ng-not-empty cv' +
                                index
                            }
                            data-id={optBool.parameterId}
                            type="checkbox"
                            data-type="boolean"
                            data-parameter-value="true"
                            onchange={onchange}
                            checked={optBool.defaultValue}
                            savedconfigurationvalue = {optBool.defaultValue}
                        />
                        <span class="os-checkbox-indicator"></span>
                        <span class="os-param-checkbox-label">
                            {optBool.parameterName}
                        </span>
                    </label>
                </div>
            </os-boolean-parameter>
        );
    }
};
