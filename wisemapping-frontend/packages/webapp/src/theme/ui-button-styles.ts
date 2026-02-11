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

/**
 * BSC_CMB ui-button 스타일 (theme/index.ts 구조에 맞춘 공통 스타일)
 * - ui.css .ui-button.type-line-secondary.size-md
 * - ui.css .ui-button.type-info.size-md
 */

const uiButtonBase = {
  fontFamily: '"Pretendard", sans-serif',
  fontWeight: 700,
  fontSize: 14,
  minHeight: 28,
  height: 28,
  borderRadius: 1,
};

const uiButtonSizeMd = {
  ...uiButtonBase,
  minWidth: 56,
  py: 0.5,
  px: 1,
};

const uiButtonSizeMdWithIcon = {
  ...uiButtonBase,
  minWidth: 72,
  py: 0.75,
  px: 1.5,
};

/** ui-button type-line-secondary size-md - 흰 배경, 회색 테두리 */
export const uiButtonTypeLineSecondarySizeMd = {
  ...uiButtonSizeMd,
  backgroundColor: '#fff',
  borderColor: '#6d7882',
  color: '#6d7882',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#6d7882',
    color: '#6d7882',
  },
  '&:active': {
    backgroundColor: '#e9ecef',
  },
  '&:focus': {
    boxShadow: '0 0 0 2px rgba(85, 96, 196, 0.2)',
  },
};

/** ui-button type-secondary size-md - BSC_CMB 삭제 버튼 스타일 (진한 회색 배경) */
export const uiButtonTypeSecondarySizeMd = {
  ...uiButtonSizeMd,
  backgroundColor: '#586166',
  color: '#fff',
  border: '1px solid #586166',
  '&:hover': {
    backgroundColor: '#4a5158',
    borderColor: '#4a5158',
    color: '#fff',
  },
  '&:active': {
    backgroundColor: '#3c4347',
    borderColor: '#3c4347',
    color: '#fff',
  },
};

/** ui-button type-info size-md - 하늘색 배경 (아이콘 포함용) */
export const uiButtonTypeInfoSizeMd = {
  ...uiButtonSizeMdWithIcon,
  backgroundColor: '#00aaff',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#0099e6',
  },
  '&:active': {
    backgroundColor: '#0088cc',
  },
};

/** ui-button type-line-secondary icon-only - 라벨 삭제 등 작은 아이콘 버튼용 */
export const uiButtonIconOnlyLineSecondary = {
  width: 24,
  minWidth: 24,
  height: 24,
  padding: 0,
  border: 'none',
  borderRadius: 1,
  color: '#6d7882',
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    color: '#6d7882',
  },
  '&:active': {
    backgroundColor: '#e9ecef',
  },
};
