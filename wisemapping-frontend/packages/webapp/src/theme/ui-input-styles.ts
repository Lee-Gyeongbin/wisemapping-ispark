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
 * BSC_CMB ui-input / filter-bar 스타일
 * - ui.css .ui-input
 * - ui.css .filter-bar__item, .filter-bar__label
 */

/** ui-input size-md - 기본 텍스트 입력 스타일 (InputBase용) */
export const uiInputSizeMd = {
  fontFamily: '"Pretendard", sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.5,
  height: 30,
  color: '#464c53',
  borderRadius: 1,
  border: '1px solid #6d7882',
  backgroundColor: '#fff',
  '& .MuiInputBase-input': {
    padding: '3px 8px',
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#b1b8be',
  },
  '&.Mui-focused, &:focus-within': {
    borderColor: '#5d5dc4',
    outline: 'none',
  },
  '&:hover': {
    borderColor: '#5d5dc4',
  },
};

/** filter-bar__item - 라벨+입력 래퍼 */
export const filterBarItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

/** filter-bar__label - 필터 라벨 (한글 지원 시스템 폰트 사용) */
export const filterBarLabel = {
  fontFamily:
    '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Pretendard", sans-serif',
  fontSize: 16,
  fontWeight: 700,
  lineHeight: 1.4,
  color: '#1e2124',
  whiteSpace: 'nowrap' as const,
};

/** filter-bar - BSC_CMB 필터바 전체 wrapper */
export const filterBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '9px 12px',
  backgroundColor: '#fff',
  border: '1px solid #cdd1d5',
  borderRadius: 2,
  gap: '4px',
  marginBottom: '12px',
};

/** filter-bar__filters - 필터 아이템들 컨테이너 */
export const filterBarFilters = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  minWidth: 0,
};
