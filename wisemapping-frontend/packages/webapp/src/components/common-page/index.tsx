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
import React, { useEffect } from 'react';
import { Outlet } from 'react-router';
import { captureErpUserIdFromUrl } from '../../classes/erp-user-id';

/**
 * ERP/BSC_CMB iframe 연동용 공통 페이지.
 *
 * - 세션/JWT 로그인 플로우를 사용하지 않는다.
 * - 최초 로드 시 URL의 userId를 sessionStorage에 캡처한다.
 */
const CommonPage = (): React.ReactElement => {
  useEffect(() => {
    captureErpUserIdFromUrl();
  }, []);

  return <Outlet />;
};

export default CommonPage;
