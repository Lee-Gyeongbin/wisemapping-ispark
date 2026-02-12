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
import React, { ReactElement, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardShorcutsHelp from './index';

type KeyboardShortcutDialogProps = {
  closeModal: () => void;
};

/**
 * 키보드 단축키 도움말을 오른쪽 도구(Theme/Layout)와 동일하게 Dialog로 띄움.
 * 상단 툴바 포함 에디터 전역에 백드롭이 적용됨.
 */
const KeyboardShortcutDialog = ({ closeModal }: KeyboardShortcutDialogProps): ReactElement => {
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

  return (
    <Dialog
      open={true}
      onClose={closeModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          boxShadow: 'none',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          pr: 0.5,
        }}
      >
        <FormattedMessage
          id="visualization-toolbar.tooltip-keyboard"
          defaultMessage="Keyboard Shortcuts"
        />
        <IconButton
          onClick={closeModal}
          size="small"
          sx={{ '& .MuiSvgIcon-root': { fontSize: '20px' } }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <KeyboardShorcutsHelp closeModal={closeModal} embedInDialog />
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutDialog;
