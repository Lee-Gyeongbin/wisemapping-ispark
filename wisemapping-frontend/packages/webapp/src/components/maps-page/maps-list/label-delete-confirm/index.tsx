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

import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import BaseDialog from '../../action-dispatcher/base-dialog';
import { Label } from '../../../../classes/client';
import { bscCmbAlertModalPaper } from '../../../../theme/ui-input-styles';

export type LabelDeleteConfirmType = {
  label: Label;
  onClose: () => void;
  onConfirm: () => void;
};

const LabelDeleteConfirm = ({
  label,
  onClose,
  onConfirm,
}: LabelDeleteConfirmType): React.ReactElement => {
  const intl = useIntl();

  return (
    <div>
      <BaseDialog
        onClose={onClose}
        onSubmit={onConfirm}
        title={`라벨 삭제 확인`}
        useBscCmbTitle={true}
        papercss={bscCmbAlertModalPaper}
        submitButton={'삭제'}
      >
        <Box
          sx={{
            padding: '40px 30px',
            textAlign: 'left',
            fontFamily: '"Pretendard", sans-serif',
            fontSize: 15,
            color: '#333',
            lineHeight: 1.6,
            '& .MuiTypography-root': {
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: 'inherit',
            },
          }}
        >
          <Typography fontWeight="bold" component="span" >
            {label.title}{' '}
          </Typography>
          {'라벨이 삭제되고, 모든 마인드맵에서 연결된 라벨도 삭제됩니다.'}<br/>{'계속하시겠습니까?'}
          
        </Box>
      </BaseDialog>
    </div>
  );
};

export default LabelDeleteConfirm;
