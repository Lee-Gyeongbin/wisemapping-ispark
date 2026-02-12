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

import React, { useContext, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { ErrorInfo, Permission, UserSearchResult } from '../../../../classes/client';
import { SimpleDialogProps } from '..';
import BaseDialog from '../base-dialog';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useStyles } from './style';
import RoleIcon from '../../role-icon';
import Tooltip from '@mui/material/Tooltip';
import { Interpolation, Theme } from '@emotion/react';
import { ClientContext } from '../../../../classes/provider/client-context';
import AsyncButton from '../../../form/async-button';
import {
  filterBarItem,
  filterBarLabel,
  bscCmbOutlinedInputSx,
  bscCmbTypeInfoButtonSx,
} from '../../../../theme/ui-input-styles';
import {
  BscCheckboxUncheckedIcon,
  BscCheckboxCheckedIcon,
  checkboxBscCmbSxLarge,
} from '../../../../theme/ui-checkbox-styles';

type ShareModel = {
  selectedUsers: UserSearchResult[];
  canEdit: boolean;
};

const defaultModel: ShareModel = { selectedUsers: [], canEdit: true };
const ShareDialog = ({ mapId, onClose }: SimpleDialogProps): React.ReactElement => {
  const intl = useIntl();
  const client = useContext(ClientContext);
  const queryClient = useQueryClient();
  const classes = useStyles();
  const [model, setModel] = React.useState<ShareModel>(defaultModel);
  const [error, setError] = React.useState<ErrorInfo>();
  const [searchInput, setSearchInput] = useState<string>('');

  const deleteMutation = useMutation(
    (email: string) => {
      return client.deleteMapPermission(mapId, email);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(`perm-${mapId}`);
        setModel(defaultModel);
      },
      onError: (error: ErrorInfo) => {
        setError(error);
      },
    },
  );

  // 사용자 전체 목록을 한 번만 조회하고, 입력값으로 클라이언트에서 필터링
  const { data: allUsers = [], isLoading: isSearching } = useQuery<UserSearchResult[], ErrorInfo>(
    ['user-search', mapId],
    () => client.searchUsersForCollaboration(mapId, '', 1000),
    {
      staleTime: 30000, // 30초간 캐시
    },
  );

  const addMutation = useMutation(
    (model: ShareModel) => {
      const permissions = model.selectedUsers.map((user) => {
        // firstname에 userId가 저장되어 있으므로, userId를 email 필드에 전달
        const userId = user.firstname;
        return {
          email: userId || user.email, // userId를 email 필드에 전달 (collaborator의 email 컬럼에 userId가 저장됨)
          userId: userId, // userId도 함께 전달
          role: model.canEdit ? ('editor' as const) : ('viewer' as const),
        };
      });
      return client.addMapPermissions(mapId, '', permissions);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(`perm-${mapId}`);
        setModel(defaultModel);
        setSearchInput('');
      },
      onError: (error: ErrorInfo) => {
        setError(error);
      },
    },
  );

  const handleOnClose = (): void => {
    // Invalidate cache ...
    queryClient.invalidateQueries(`perm-${mapId}`);
    setSearchInput('');
    onClose();
  };

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const name = event.target.name;
    const value =
      event.target.type === 'checkbox'
        ? (event.target as HTMLInputElement).checked
        : event.target.value;
    setModel({ ...model, [name as keyof ShareModel]: value });
  };

  const handleUserSelectionChange = (
    _event: React.SyntheticEvent,
    newValue: UserSearchResult[],
  ) => {
    setModel({ ...model, selectedUsers: newValue });
  };

  const handleOnAddClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    event.stopPropagation();
    addMutation.mutate(model);
    event.stopPropagation();
  };

  const handleOnDeleteClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    email: string,
  ): void => {
    event.stopPropagation();
    // Prevent duplicate requests if already deleting
    if (!deleteMutation.isLoading) {
      deleteMutation.mutate(email);
    }
  };

  const { isLoading, data: permissions = [] } = useQuery<unknown, ErrorInfo, Permission[]>(
    `perm-${mapId}`,
    () => {
      return client.fetchMapPermissions(mapId);
    },
  );

  const formatName = (perm: Permission): string => {
    const name = perm.name || perm.email;
    return perm.deptNm ? `${name} <${perm.deptNm}>` : name;
  };

  // 선택된 사용자가 있는지 확인
  const isValid = model.selectedUsers.length > 0;

  return (
    <div>
      <BaseDialog
        onClose={handleOnClose}
        title={'협업자 설정'}
        useBscCmbTitle={true}
        maxWidth="md"
        papercss={classes.paper}
        error={error}
      >
        <div css={classes.actionContainer as Interpolation<Theme>}>
          <Box
            sx={[filterBarItem, { minWidth: 0, flex: 1 }]}
            css={[classes.fullWidthInMobile, classes.email]}
          >
            <Box component="label" sx={filterBarLabel}></Box>
            <Autocomplete
              multiple
              id="user-search"
              size="small"
              options={allUsers}
              getOptionLabel={(option) => option.fullName || option.email}
              value={model.selectedUsers}
              onChange={handleUserSelectionChange}
              inputValue={searchInput}
              onInputChange={(_event, newInputValue) => {
                setSearchInput(newInputValue);
              }}
              loading={isSearching}
              disabled={addMutation.isLoading}
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={searchInput || model.selectedUsers.length ? '' : '협업자 검색'}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={[bscCmbOutlinedInputSx, { minWidth: 200, flex: 1 }]}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.email}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="body2">{option.fullName || option.email}</Typography>
                    {option.deptNm && (
                      <Typography variant="caption" color="text.secondary">
                        {option.deptNm}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              sx={{ minWidth: 200, flex: 1 }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={model.canEdit}
                onChange={handleOnChange}
                name="canEdit"
                disabled={addMutation.isLoading}
                disableRipple
                icon={<BscCheckboxUncheckedIcon />}
                checkedIcon={<BscCheckboxCheckedIcon />}
                sx={checkboxBscCmbSxLarge}
              />
            }
            label={<Typography variant="subtitle2">{'수정 권한'}</Typography>}
            css={classes.role}
          />

          <AsyncButton
            type="button"
            variant="contained"
            disableElevation={true}
            onClick={handleOnAddClick}
            disabled={!isValid}
            isLoading={addMutation.isLoading}
            loadingText={'협업중...'}
            sx={[bscCmbTypeInfoButtonSx, { minWidth: 80 }]}
            css={classes.shareButton}
          >
            {'협업하기'}
          </AsyncButton>
        </div>

        {!isLoading && permissions && permissions.length > 0 && (
          <TableContainer
            component={Paper}
            elevation={1}
            variant="outlined"
            css={classes.tableContainer as Interpolation<Theme>}
          >
            <Table size="small" aria-label="collaborators table">
              <TableHead css={classes.tableHead as Interpolation<Theme>}>
                <TableRow>
                  <TableCell>{'협업자'}</TableCell>
                  <TableCell align="center">{'권한'}</TableCell>
                  <TableCell align="center">{'삭제'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow
                    key={permission.email}
                    hover
                    css={classes.tableRow as Interpolation<Theme>}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      css={classes.emailCell as Interpolation<Theme>}
                    >
                      {formatName(permission)}
                    </TableCell>
                    <TableCell align="center">
                      <RoleIcon role={permission.role} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={'협업취소'}>
                        <span>
                          <IconButton
                            disabled={permission.role === 'owner' || deleteMutation.isLoading}
                            onClick={(e) => handleOnDeleteClick(e, permission.email)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" color="action" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </BaseDialog>
    </div>
  );
};

export default ShareDialog;
