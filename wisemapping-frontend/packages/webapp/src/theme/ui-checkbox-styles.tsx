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
 */

/**
 * BSC_CMB ui-checkbox 스타일
 */

import React from 'react';
import { SvgIcon } from '@mui/material';

/** BSC_CMB 체크박스 미체크 아이콘 - 14x14 박스 */
export const BscCheckboxUncheckedIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props} viewBox="0 0 14 14" sx={{ width: 14, height: 14 }}>
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="13"
      rx="4"
      ry="4"
      fill="#fff"
      stroke="currentColor"
      strokeWidth="1"
    />
  </SvgIcon>
);

/** BSC_CMB 체크박스 체크 아이콘 - 14x14 박스 + 체크마크 */
export const BscCheckboxCheckedIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props} viewBox="0 0 14 14" sx={{ width: 14, height: 14 }}>
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="13"
      rx="4"
      ry="4"
      fill="#fff"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path
      d="M3 7 L6 10 L11 4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

/** BSC_CMB 체크박스 indeterminate 아이콘 */
export const BscCheckboxIndeterminateIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props} viewBox="0 0 14 14" sx={{ width: 14, height: 14 }}>
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="13"
      rx="4"
      ry="4"
      fill="#fff"
      stroke="currentColor"
      strokeWidth="1"
    />
    <line
      x1="4"
      y1="7"
      x2="10"
      y2="7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </SvgIcon>
);

/** BSC_CMB 체크박스용 MUI Checkbox sx */
export const checkboxBscCmbSx = {
  padding: 4,
  color: '#58616a',
  '&.Mui-checked': { color: '#555dc4' },
  '&.MuiCheckbox-indeterminate': { color: '#555dc4' },
  '&:hover': {
    backgroundColor: 'transparent',
    color: '#555dc4',
  },
};
