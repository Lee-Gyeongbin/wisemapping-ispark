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

type ShareModel = {
  selectedUsers: UserSearchResult[];
  canEdit: boolean;
  message: string;
};

const defaultModel: ShareModel = { selectedUsers: [], canEdit: true, message: '' };
const ShareDialog = ({ mapId, onClose }: SimpleDialogProps): React.ReactElement => {
  const intl = useIntl();
  const client = useContext(ClientContext);
  const queryClient = useQueryClient();
  const classes = useStyles();
  const [showMessage, setShowMessage] = React.useState<boolean>(false);
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
        return { email: user.email, role: model.canEdit ? ('editor' as const) : ('viewer' as const) };
      });
      return client.addMapPermissions(mapId, model.message, permissions);
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
    event.preventDefault();

    const name = event.target.name;
    const value =
      event.target.type === 'checkbox'
        ? (event.target as HTMLInputElement).checked
        : event.target.value;
    setModel({ ...model, [name as keyof ShareModel]: value });
    event.stopPropagation();
  };

  const handleUserSelectionChange = (_event: React.SyntheticEvent, newValue: UserSearchResult[]) => {
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
    return perm.name ? `${perm.name}<${perm.email}>` : perm.email;
  };

  // 선택된 사용자가 있는지 확인
  const isValid = model.selectedUsers.length > 0;

  return (
    <div>
      <BaseDialog
        onClose={handleOnClose}
        title={intl.formatMessage({
          id: 'share.delete-title',
          defaultMessage: '협업자 설정',
        })}
        description={intl.formatMessage({
          id: 'share.delete-description',
          defaultMessage:
            'Invite people to collaborate with you in the creation of your mindmap. They will be notified by email. ',
        })}
        maxWidth="md"
        papercss={classes.paper}
        error={error}
      >
        <div css={classes.actionContainer as Interpolation<Theme>}>
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
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={intl.formatMessage({
                  id: 'share.search-users-placeholder',
                  defaultMessage: 'Search users by name or email...',
                })}
                label={intl.formatMessage({
                  id: 'share.select-users',
                  defaultMessage: 'Select users',
                })}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                css={[classes.fullWidthInMobile, classes.email]}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.email}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Typography variant="body2">{option.fullName || option.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            css={[classes.fullWidthInMobile, classes.email]}
            sx={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '300px' }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={model.canEdit}
                onChange={handleOnChange}
                name="canEdit"
                color="primary"
                disabled={addMutation.isLoading}
              />
            }
            label={
              <Typography variant="subtitle2">
                <FormattedMessage id="share.can-edit" defaultMessage="Can edit" />
              </Typography>
            }
            css={classes.role}
          />

          <FormControlLabel
            value="start"
            onChange={(event, value) => {
              setShowMessage(value);
            }}
            style={{ fontSize: '5px' }}
            control={<Checkbox color="primary" disabled={addMutation.isLoading} />}
            label={
              <Typography variant="subtitle2">
                <FormattedMessage id="share.add-message" defaultMessage="Customize share message" />
              </Typography>
            }
            labelPlacement="end"
            css={classes.checkbox}
          />

          <AsyncButton
            color="primary"
            type="button"
            variant="contained"
            disableElevation={true}
            onClick={handleOnAddClick}
            disabled={!isValid}
            isLoading={addMutation.isLoading}
            loadingText={intl.formatMessage({
              id: 'share.adding-button',
              defaultMessage: 'Sharing...',
            })}
            css={classes.shareButton}
          >
            {intl.formatMessage({ id: 'share.add-button', defaultMessage: 'Share' })}
          </AsyncButton>

          {showMessage && (
            <TextField
              multiline
              rows={3}
              maxRows={3}
              css={classes.textArea}
              variant="filled"
              name="message"
              onChange={handleOnChange}
              value={model.message}
              disabled={addMutation.isLoading}
              label={intl.formatMessage({
                id: 'share.message',
                defaultMessage: 'Message',
              })}
            />
          )}
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
                  <TableCell>
                    <FormattedMessage id="share.table.collaborator" defaultMessage="Collaborator" />
                  </TableCell>
                  <TableCell align="center">
                    <FormattedMessage id="share.table.role" defaultMessage="Role" />
                  </TableCell>
                  <TableCell align="center">
                    <FormattedMessage id="share.table.actions" defaultMessage="Actions" />
                  </TableCell>
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
                      <Tooltip
                        title={
                          <FormattedMessage
                            id="share.delete"
                            defaultMessage="Delete collaborator"
                          />
                        }
                      >
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
