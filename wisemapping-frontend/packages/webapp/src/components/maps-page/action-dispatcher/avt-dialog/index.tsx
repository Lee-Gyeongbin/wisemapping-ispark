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

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import BaseDialog from '../base-dialog';
import { SimpleDialogProps } from '..';
import { useFetchMapById } from '../../../../classes/middleware';
import { ClientContext } from '../../../../classes/provider/client-context';
import { ErrorInfo, ForwardSystemItem, ForwardWorkItem } from '../../../../classes/client';
import { InfoRow, InfoLabel, InfoValue } from '../info-dialog/styled';
import {
  bscCmbAlertModalPaper,
  bscCmbOutlinedInputSx,
  bscCmbTypeInfoButtonSx,
} from '../../../../theme/ui-input-styles';

const formatDateLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = (): { start: string; end: string } => {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return {
    start: formatDateLocal(threeMonthsAgo),
    end: formatDateLocal(today),
  };
};

const AvtDialog = ({ mapId, onClose }: SimpleDialogProps): React.ReactElement => {
  const client = useContext(ClientContext);
  const queryClient = useQueryClient();
  const { data: map } = useFetchMapById(mapId);
  const { data: forwardSystemOptions = [], isLoading: isForwardSystemLoading } = useQuery<
    ForwardSystemItem[],
    ErrorInfo
  >('forward-system-options', () => client.fetchForwardSystemOptions(), {
    staleTime: 60000, // 1분 캐시
  });
  const [forwardSystem, setForwardSystem] = useState<ForwardSystemItem | null>(null);
  const [forwardWork, setForwardWork] = useState<ForwardWorkItem | null>(null);
  const [forwardSystemInput, setForwardSystemInput] = useState<string>('');
  const [forwardWorkInput, setForwardWorkInput] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => getDefaultDateRange().start);
  const [endDate, setEndDate] = useState<string>(() => getDefaultDateRange().end);
  const [forwardWorkOptions, setForwardWorkOptions] = useState<ForwardWorkItem[]>([]);
  const [isForwardWorkLoading, setIsForwardWorkLoading] = useState<boolean>(false);
  const [isSaveAlertOpen, setIsSaveAlertOpen] = useState<boolean>(false);

  const initialPlanIdApplied = useRef(false);

  const fetchForwardWorkOptions = useCallback(
    (stdId: string, planIdToSelect?: string) => {
      const sd = startDate.replaceAll('-', '');
      const ed = endDate.replaceAll('-', '');
      setIsForwardWorkLoading(true);
      client
        .fetchForwardWorkOptions(sd, ed, stdId)
        .then((items) => {
          setForwardWorkOptions(items);
          if (planIdToSelect) {
            const matched = items.find((opt) => opt.id === planIdToSelect);
            if (matched) {
              setForwardWork(matched);
              setForwardWorkInput(matched.label);
              return;
            }
          }
          setForwardWork(null);
          setForwardWorkInput('');
        })
        .catch(() => {
          setForwardWorkOptions([]);
        })
        .finally(() => {
          setIsForwardWorkLoading(false);
        });
    },
    [client, startDate, endDate],
  );

  useEffect(() => {
    if (map?.stdId && forwardSystemOptions.length > 0) {
      const matched = forwardSystemOptions.find((opt) => opt.id === map.stdId);
      if (matched) {
        setForwardSystem(matched);
        setForwardSystemInput(matched.label);
      }
    }
  }, [map?.stdId, forwardSystemOptions]);

  useEffect(() => {
    if (forwardSystem) {
      const planId = !initialPlanIdApplied.current && map?.planId ? map.planId : undefined;
      if (planId) initialPlanIdApplied.current = true;
      fetchForwardWorkOptions(forwardSystem.id, planId);
    } else {
      setForwardWorkOptions([]);
      setForwardWork(null);
      setForwardWorkInput('');
    }
  }, [forwardSystem]);

  const handleSearch = (): void => {
    if (forwardSystem) {
      fetchForwardWorkOptions(forwardSystem.id);
    }
  };

  const handleOnSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!mapId) {
      return;
    }

    const stdId = forwardSystem ? forwardSystem.id : null;
    const planId = forwardWork ? forwardWork.id : null;

    await client.updateForwardMapping(mapId, stdId, planId);
    // 목록 및 메타데이터 갱신
    queryClient.invalidateQueries('maps');
    queryClient.invalidateQueries(`maps-metadata-${mapId}`);
    // CMB 스타일 저장 완료 모달 알림 오픈
    setIsSaveAlertOpen(true);
  };

  return (
    <>
      {!isSaveAlertOpen && (
        <BaseDialog
          onClose={onClose}
          onSubmit={handleOnSubmit}
          title={'전략및전방워크매핑'}
          useBscCmbTitle={true}
          closeButton={'닫기'}
          submitButton={'저장'}
          maxWidth="md"
        >
          <Box
        sx={(theme) => ({
          padding: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        })}
      >
        <InfoRow>
          <InfoLabel variant="caption">{'• 마인드맵명 :'}</InfoLabel>
          <InfoValue variant="body2" sx={{ flex: 1 }}>{map?.title ?? '-'}</InfoValue>
        </InfoRow>

        <InfoRow sx={{ alignItems: 'center' }}>
          <InfoLabel variant="caption">
            {'전방체계'}
            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              {'*'}
            </Box>
          </InfoLabel>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={forwardSystemOptions}
              getOptionLabel={(option) => option.label}
              value={forwardSystem}
              onChange={(_event, newValue) => setForwardSystem(newValue)}
              inputValue={forwardSystemInput}
              onInputChange={(_event, newInputValue) => setForwardSystemInput(newInputValue)}
              loading={isForwardSystemLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={'전방체계 검색'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isForwardSystemLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={[bscCmbOutlinedInputSx, { minWidth: 200, flex: 1 }]}
                />
              )}
            />
          </Box>
        </InfoRow>

        <InfoRow sx={{ alignItems: 'center' }}>
          <InfoLabel variant="caption">{'• 실행기간'}</InfoLabel>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <TextField
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={[bscCmbOutlinedInputSx, { minWidth: 140 }]}
            />
            <Typography variant="body2" color="text.secondary">
              {'~'}
            </Typography>
            <TextField
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={[bscCmbOutlinedInputSx, { minWidth: 140 }]}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              size="small"
              onClick={handleSearch}
              sx={bscCmbTypeInfoButtonSx}
            >
              {'검색'}
            </Button>
          </Box>
        </InfoRow>

        <InfoRow sx={{ alignItems: 'center' }}>
          <InfoLabel variant="caption">
            {'전방워크'}
            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              {'*'}
            </Box>
          </InfoLabel>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={forwardWorkOptions}
              getOptionLabel={(option) => option.label}
              value={forwardWork}
              onChange={(_event, newValue) => setForwardWork(newValue)}
              inputValue={forwardWorkInput}
              onInputChange={(_event, newInputValue) => setForwardWorkInput(newInputValue)}
              loading={isForwardWorkLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={'전방워크 검색'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isForwardWorkLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={[bscCmbOutlinedInputSx, { minWidth: 200, flex: 1 }]}
                />
              )}
            />
          </Box>
          </InfoRow>
          </Box>
        </BaseDialog>
      )}
      {isSaveAlertOpen && (
        <BaseDialog
          onClose={() => {
            setIsSaveAlertOpen(false);
            onClose(true);
          }}
          title={'저장 완료'}
          useBscCmbTitle={true}
          papercss={bscCmbAlertModalPaper}
          closeButton="확인"
          maxWidth="sm"
        >
          <Box
            sx={{
              padding: '40px 30px',
              textAlign: 'left',
              fontFamily: '"Pretendard", sans-serif',
              fontSize: 15,
              color: '#333',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              '& .MuiTypography-root': {
                fontFamily: 'inherit',
                fontSize: 'inherit',
                color: 'inherit',
              },
            }}
          >
            <Typography>{'저장이 완료되었습니다.'}</Typography>
          </Box>
        </BaseDialog>
      )}
    </>
  );
};

export default AvtDialog;
