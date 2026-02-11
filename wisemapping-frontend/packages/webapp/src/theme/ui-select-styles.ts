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
 * BSC_CMB ui-select size-md 스타일 (theme 구조에 맞춘 공통 스타일)
 * - ui.css .ui-select.size-md
 */

/** ui-select size-md - 셀렉트 박스 트리거 스타일 (드롭다운 열기 버튼) */
export const uiSelectSizeMd = {
  fontFamily: '"Pretendard", sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  minHeight: 30,
  height: 30,
  py: 0.375,
  pl: 1,
  pr: 4,
  borderRadius: 1,
  border: '1px solid #6d7882',
  backgroundColor: '#fff',
  color: '#464c53',
  textTransform: 'none',
  justifyContent: 'flex-start',
  '&:hover': {
    backgroundColor: '#fff',
    borderColor: '#6d7882',
  },
  '&.Mui-focusVisible, &[aria-expanded="true"]': {
    borderColor: '#5560c4',
    outline: 'none',
  },
};
