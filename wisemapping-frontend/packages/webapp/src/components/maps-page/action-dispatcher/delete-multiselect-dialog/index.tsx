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

import React, { useContext } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import Box from '@mui/material/Box';
import { handleOnMutationSuccess, MultiDialogProps } from '..';
import BaseDialog from '../base-dialog';
import { bscCmbAlertModalPaper } from '../../../../theme/ui-input-styles';
import { ClientContext } from '../../../../classes/provider/client-context';

const DeleteMultiselectDialog = ({ onClose, mapsId }: MultiDialogProps): React.ReactElement => {
  const client = useContext(ClientContext);
  const queryClient = useQueryClient();

  const mutation = useMutation((ids: number[]) => client.deleteMaps(ids), {
    onSuccess: () => handleOnMutationSuccess(() => onClose(true), queryClient),
    onError: (error) => {
      console.error(`Unexpected error ${error}`);
    },
  });

  const handleOnClose = (): void => {
    onClose();
  };

  const handleOnSubmit = (): void => {
    mutation.mutate(mapsId);
  };

  return (
    <div>
      <BaseDialog
        onClose={handleOnClose}
        onSubmit={handleOnSubmit}
        title={'선택된 맵 삭제 확인'}
        useBscCmbTitle={true}
        papercss={bscCmbAlertModalPaper}
        submitButton={'삭제'}
        isLoading={mutation.isLoading}
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
          {'선택된 모든 맵이 삭제되며 복구할 수 없습니다.'} 
          <br/>{'계속하시겠습니까?'}
        </Box>
      </BaseDialog>
    </div>
  );
};

export default DeleteMultiselectDialog;
