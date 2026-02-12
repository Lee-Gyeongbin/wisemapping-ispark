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

import React, { ErrorInfo, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import { ChangeHistory } from '../../../../classes/client';
import { SimpleDialogProps } from '..';
import BaseDialog from '../base-dialog';
import dayjs from 'dayjs';

import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import { ClientContext } from '../../../../classes/provider/client-context';
import { StyledTableContainer, StyledHeaderCell, StyledEmptyCell } from './styled';

const HistoryDialog = ({ mapId, onClose }: SimpleDialogProps): React.ReactElement => {
  const intl = useIntl();
  const client = useContext(ClientContext);
  const { data } = useQuery<unknown, ErrorInfo, ChangeHistory[]>(
    `history-${mapId}`,
    () => {
      return client.fetchHistory(mapId);
    },
    {
      cacheTime: 0, // Force reload...
    },
  );

  const changeHistory: ChangeHistory[] = data ? data : [];

  const handleOnClose = (): void => {
    onClose();
  };

  const handleOnClick = (event, vid: number): void => {
    event.preventDefault();
    client.revertHistory(mapId, vid).then(() => {
      handleOnClose();
      window.location.reload();
    });
  };

  return (
    <BaseDialog
      onClose={handleOnClose}
      title={'변경 이력'}
      useBscCmbTitle={true}
      description={'최근 90일 동안 변경된 내역입니다.'}
    >
      <StyledTableContainer sx={{ marginTop: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <StyledHeaderCell align="left">
                {'수정자'}
              </StyledHeaderCell>
              <StyledHeaderCell align="left">
                {'수정일'}
              </StyledHeaderCell>
              <StyledHeaderCell align="left"></StyledHeaderCell>
              <StyledHeaderCell align="left"></StyledHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changeHistory.length === 0 ? (
              <TableRow>
                <StyledEmptyCell colSpan={4}>
                  {'변경 이력이 없습니다.'}
                </StyledEmptyCell>
              </TableRow>
            ) : (
              changeHistory.map((row) => (
                <TableRow key={row.id}>
                  <TableCell align="left">{row.lastModificationBy}</TableCell>
                  <TableCell align="left">
                    <Tooltip
                      title={dayjs(row.lastModificationTime).format('lll')}
                      placement="bottom-start"
                    >
                      <span>{dayjs(row.lastModificationTime).fromNow()}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left">
                    <Link
                      href={`/c/maps/${mapId}/${row.id}/view`}
                      target="history"
                      sx={{
                        color: '#5d5dc4',
                        fontWeight: 700,
                        textDecorationColor: '#5d5dc4',
                        '&:hover': { color: '#555dc4', textDecorationColor: '#555dc4' },
                      }}
                    >
                      {'보기'}
                    </Link>
                  </TableCell>
                  <TableCell align="left">
                    <Link
                      href="#"
                      onClick={(e) => handleOnClick(e, row.id)}
                      sx={{
                        color: '#5d5dc4',
                        fontWeight: 700,
                        textDecorationColor: '#5d5dc4',
                        '&:hover': { color: '#555dc4', textDecorationColor: '#555dc4' },
                      }}
                    >
                      {'되돌리기'}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </BaseDialog>
  );
};

export default HistoryDialog;
