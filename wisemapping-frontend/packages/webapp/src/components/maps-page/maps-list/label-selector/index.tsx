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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LabelComponent from '../label';
import { Label, ErrorInfo, MapInfo } from '../../../../classes/client';
import { useQuery } from 'react-query';
import AddLabelDialog from '../../action-dispatcher/add-label-dialog';
import { LabelListContainer } from './styled';
import { ClientContext } from '../../../../classes/provider/client-context';
import {
  BscCheckboxUncheckedIcon,
  BscCheckboxCheckedIcon,
  checkboxBscCmbSx,
} from '../../../../theme/ui-checkbox-styles';

export type LabelSelectorProps = {
  maps: MapInfo[];
  onChange: (label: Label, checked: boolean) => void;
};

export function LabelSelector({ onChange, maps }: LabelSelectorProps): React.ReactElement {
  const client = useContext(ClientContext);
  const { data: labels = [] } = useQuery<unknown, ErrorInfo, Label[]>('labels', async () =>
    client.fetchLabels(),
  );

  const checkedLabelIds = useMemo(() => {
    return labels
      .map((l) => l.id)
      .filter((labelId) => maps.every((m) => m.labels.find((l) => l.id === labelId)));
  }, [labels, maps]);

  return (
    <Box>
      <AddLabelDialog onAdd={(label) => onChange(label, true)} />
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            padding: '6px 0',
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: '#333',
              fontFamily: '"Pretendard", sans-serif',
            }}
          >
            라벨 목록
          </Typography>
        </Box>
        <Box sx={{ padding: '4px 0', height: 200, minHeight: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <LabelListContainer>
          {labels.map(({ id, title, color }) => (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  id={`${id}`}
                  checked={checkedLabelIds.includes(id)}
                  onChange={(e) => {
                    onChange({ id, title, color }, e.target.checked);
                  }}
                  name={title}
                  icon={<BscCheckboxUncheckedIcon />}
                  checkedIcon={<BscCheckboxCheckedIcon />}
                  sx={checkboxBscCmbSx}
                />
              }
              label={<LabelComponent label={{ id, title, color }} size="small" />}
              sx={{
                margin: 0,
                marginLeft: 0,
                marginRight: 0,
                padding: 0,
                height: 50,
                maxHeight: 50,
                minHeight: 50,
                alignItems: 'center',
                '& .MuiFormControlLabel-label': {
                  marginLeft: '8px',
                },
              }}
            />
          ))}
          </LabelListContainer>
        </Box>
      </Box>
    </Box>
  );
}
