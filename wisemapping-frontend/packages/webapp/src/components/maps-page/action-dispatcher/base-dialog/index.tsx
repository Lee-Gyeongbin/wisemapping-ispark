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

import React, { useContext, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Box from '@mui/material/Box';
import { ErrorInfo } from '../../../../classes/client';
import { StyledDialog, StyledDialogActions, StyledDialogContent, StyledDialogTitle } from './style';
import GlobalError from '../../../form/global-error';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import { CSSObject } from '@emotion/react';
import { KeyboardContext } from '../../../../classes/provider/keyboard-context';
import AsyncButton from '../../../form/async-button';
import { bscCmbTypeSecondaryButtonSx, bscCmbTypeInfoButtonSx } from '../../../../theme/ui-input-styles';
import { uiPageHeaderTitle, uiPageHeaderStarIcon } from '../../../../theme/ui-page-header-styles';

export type DialogProps = {
  onClose: () => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  children: unknown;
  error?: ErrorInfo;

  title: string;
  /** BSC_CMB ui-page-header 스타일 사용 시 true, titleStartIcon과 함께 사용 */
  useBscCmbTitle?: boolean;
  /** BSC_CMB 스타일 사용 시 제목 앞 아이콘 (기본: icon-star) */
  titleStartIcon?: React.ReactNode;
  description?: string;

  submitButton?: string;
  /** 닫기/취소 버튼 문구 (기본: '닫기') */
  closeButton?: string;
  actionUrl?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  papercss?: CSSObject;
  isDangerousAction?: boolean;
  isLoading?: boolean;
};

const BaseDialog = (props: DialogProps): React.ReactElement => {
  const { setHotkeyEnabled } = useContext(KeyboardContext);
  const intl = useIntl();
  useEffect(() => {
    setHotkeyEnabled(false);
    return () => {
      setHotkeyEnabled(true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;
    try {
      window.parent.postMessage({ type: 'wisemapping-modal-open' }, '*');
    } catch (_) {
      /* cross-origin 무시 */
    }
    return () => {
      try {
        window.parent.postMessage({ type: 'wisemapping-modal-close' }, '*');
      } catch (_) {
        /* cross-origin 무시 */
      }
    };
  }, []);
  const { onClose, onSubmit, maxWidth = 'sm', papercss, isLoading = false, useBscCmbTitle, titleStartIcon, closeButton = '닫기' } = props;

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const description = props.description ? (
    <DialogContentText>{props.description}</DialogContentText>
  ) : null;
  return (
    <div>
      <StyledDialog
        open={true}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth={!papercss}
        PaperProps={papercss ? { css: papercss } : undefined}
      >
        <form autoComplete="off" onSubmit={handleOnSubmit}>
          <StyledDialogTitle
            sx={
              useBscCmbTitle
                ? [
                    uiPageHeaderTitle,
                    {
                      padding: '20px 32px 16px 32px !important',
                      marginBottom: 0,
                    },
                  ]
                : undefined
            }
          >
            {useBscCmbTitle ? (
              <>
                {titleStartIcon ?? (
                  <Box
                    component="span"
                    sx={uiPageHeaderStarIcon}
                  />
                )}
                {props.title}
              </>
            ) : (
              props.title
            )}
          </StyledDialogTitle>

          <StyledDialogContent>
            <>
              {description}
              <GlobalError error={props.error} />
              {props.children}
            </>
          </StyledDialogContent>

          <StyledDialogActions>
            <Button
              type="button"
              variant="contained"
              onClick={onClose}
              disabled={isLoading}
              sx={bscCmbTypeSecondaryButtonSx}
            >
              {closeButton}
            </Button>
            {onSubmit && (
              <AsyncButton
                variant="contained"
                type="submit"
                disableElevation={true}
                isLoading={isLoading}
                sx={bscCmbTypeInfoButtonSx}
              >
                {props.submitButton}
              </AsyncButton>
            )}
          </StyledDialogActions>
        </form>
      </StyledDialog>
    </div>
  );
};

export default BaseDialog;
