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

import React, { useContext, useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LabelComponent from '../label';
import { Label, ErrorInfo, MapInfo } from '../../../../classes/client';
import { useQuery } from 'react-query';
import AddLabelDialog from '../../action-dispatcher/add-label-dialog';
import { ClientContext } from '../../../../classes/provider/client-context';
import { useStyles } from '../styled';
import {
  BscCheckboxUncheckedIcon,
  BscCheckboxCheckedIcon,
  BscCheckboxIndeterminateIcon,
  checkboxBscCmbSx,
} from '../../../../theme/ui-checkbox-styles';
import { CSSObject } from '@emotion/react';

export type LabelSelectorProps = {
  maps: MapInfo[];
  onChange: (label: Label, checked: boolean) => void;
};

export function LabelSelector({ onChange, maps }: LabelSelectorProps): React.ReactElement {
  const client = useContext(ClientContext);
  const classes = useStyles();
  const { data: labels = [] } = useQuery<unknown, ErrorInfo, Label[]>('labels', async () =>
    client.fetchLabels(),
  );

  const checkedLabelIds = useMemo(() => {
    return labels
      .map((l) => l.id)
      .filter((labelId) => maps.every((m) => m.labels.find((l) => l.id === labelId)));
  }, [labels, maps]);

  const numChecked = checkedLabelIds.length;
  const rowCount = labels.length;
  const isAllChecked = rowCount > 0 && numChecked === rowCount;
  const isIndeterminate = numChecked > 0 && numChecked < rowCount;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    labels.forEach((label) => onChange(label, checked));
  };

  return (
    <Box>
      <AddLabelDialog onAdd={(label) => onChange(label, true)} />
      <Box
        sx={{
          mt: 1,
          marginBottom: '16px',
          paddingBottom: '16px',
        }}
      >
        <TableContainer sx={{ minHeight: 150, maxHeight: 150, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 200 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  style={{ width: '3%', whiteSpace: 'nowrap' }}
                  css={classes.headerCell}
                >
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllChecked}
                    onChange={handleSelectAllClick}
                    icon={<BscCheckboxUncheckedIcon />}
                    checkedIcon={<BscCheckboxCheckedIcon />}
                    indeterminateIcon={<BscCheckboxIndeterminateIcon />}
                    inputProps={{ 'aria-label': '전체 선택' }}
                    disableRipple
                    sx={checkboxBscCmbSx}
                  />
                </TableCell>
                <TableCell css={classes.headerCell} style={{ width: '97%' }}>
                  {'라벨'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labels.map(({ id, title, color }) => (
                <TableRow key={id} hover>
                  <TableCell padding="checkbox" css={classes.bodyCell} style={{ width: '3%' }}>
                    <Checkbox
                      id={`label-checkbox-${id}`}
                      checked={checkedLabelIds.includes(id)}
                      onChange={(e) => onChange({ id, title, color }, e.target.checked)}
                      name={title}
                      disableRipple
                      icon={<BscCheckboxUncheckedIcon />}
                      checkedIcon={<BscCheckboxCheckedIcon />}
                      sx={checkboxBscCmbSx}
                    />
                  </TableCell>
                  <TableCell css={[classes.bodyCell]}>
                    <LabelComponent label={{ id, title, color }} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
