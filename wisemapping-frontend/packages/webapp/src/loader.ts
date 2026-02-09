/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 *   It is basically the Apache License, Version 2.0 (the "License") plus the
 *   "powered by wisemapping" text requirement on every single page;
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the license at
 *
 *       https://github.com/wisemapping/wisemapping-open-source/blob/main/LICENSE.md
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import AppConfig from './classes/app-config';
import ReactGA from 'react-ga4';
import { createJsonResponse } from './utils/response';
import { setAnalyticsUserId } from './utils/analytics';
import { captureErpUserIdFromUrl, getErpUserId } from './classes/erp-user-id';

export const loader = async (): Promise<Response> => {
  // Ensure configuration is loaded before continuing.
  await AppConfig.initialize();

  // ERP iframe integration: userId를 URL에서 캡처해 sessionStorage에 저장
  captureErpUserIdFromUrl();

  // Google Analytics Initialization.
  const trackingId = AppConfig.getGoogleAnalyticsAccount();
  if (trackingId) {
    ReactGA.initialize([
      {
        trackingId: trackingId,
      },
    ]);

    // ERP userId가 있으면 계정정보를 조회해 analytics userId를 세팅(비동기)
    if (getErpUserId()) {
      AppConfig.getClient()
        .fetchAccountInfo()
        .then((accountInfo) => setAnalyticsUserId(accountInfo.email))
        .catch(() => {
          // ignore
        });
    }
  }
  return createJsonResponse('Load success');
};
