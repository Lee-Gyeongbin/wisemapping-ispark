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
import React, { ReactElement, useEffect, useState, useRef, useMemo } from 'react';
import Box from '@mui/material/Box';
import MaterialToolbar from '@mui/material/Toolbar';
import MaterialAppBar from '@mui/material/AppBar';
import { ToolbarMenuItem } from '../toolbar';
import ActionConfig from '../../classes/action/action-config';
import Editor from '../../classes/model/editor';
import Capability from '../../classes/action/capability';
import Tooltip from '@mui/material/Tooltip';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';
import HelpOutlineOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import Typography from '@mui/material/Typography';
import UndoAndRedo from '../action-widget/button/undo-and-redo';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { ToolbarActionType } from '../toolbar/ToolbarActionType';
import MapInfo from '../../classes/model/map-info';
import { useIntl } from 'react-intl';
import ThemeEditor from '../action-widget/pane/theme-editor';
import LayoutSelector from '../action-widget/pane/layout-selector';
import NodePropertyValueModelBuilder from '../../classes/model/node-property-builder';
import TextField from '@mui/material/TextField';
import { $notify } from '@wisemapping/mindplot';
import { useTheme } from '../../contexts/ThemeContext';
import { trackAppBarAction } from '../../utils/analytics';
import debounce from 'lodash/debounce';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import BaseDialog from '../../../../webapp/src/components/maps-page/action-dispatcher/base-dialog';
import {
  bscCmbAlertModalPaper,
  bscCmbOutlinedInputSx,
  bscCmbTypeInfoButtonSx,
} from '../../../../webapp/src/theme/ui-input-styles';
import { uiButtonTypeLineSecondarySizeMd } from '../../../../webapp/src/theme/ui-button-styles';

interface AppBarProps {
  model: Editor | undefined;
  mapInfo: MapInfo;
  capability: Capability;
  onAction: (type: ToolbarActionType) => void;
  accountConfig?;
}

const appBarDivisor = {
  render: () => <Typography component="div" sx={{ flexGrow: 1 }} />,
};

const keyTooltip = (msg: string, key: string): string => {
  const isMac = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return `${msg} (${isMac ? '⌘' : 'Ctrl'} + ${key})`;
};

const StarredOnStyle = {
  color: '#FDDA0D',
};

const StarredOffStyle = {
  color: 'gray',
};

const AppBar = ({
  model,
  mapInfo,
  capability,
  onAction,
  accountConfig,
}: AppBarProps): ReactElement => {
  const [isStarred, setStarred] = useState<undefined | boolean>(undefined);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentTitle, setCurrentTitle] = useState<string>(mapInfo.getTitle());
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(() => model?.isMapLoadded() ?? false);
  const [lockConfirmDialog, setLockConfirmDialog] = useState<{
    open: boolean;
    message: string;
    lockedBy?: string;
  }>({ open: false, message: '' });
  const [saveBlockedDialog, setSaveBlockedDialog] = useState<{
    open: boolean;
    mapId?: string;
  }>({ open: false });
  const [saveCompleteModal, setSaveCompleteModal] = useState<boolean>(false);
  const [isAcquiringLock, setIsAcquiringLock] = useState<boolean>(false);
  const canRename = !capability.isHidden('rename');
  const inputRef = useRef<HTMLInputElement>(null);
  const lockPollStoppedRef = useRef(false);
  const intl = useIntl();
  const { mode, toggleMode } = useTheme();
  const muiTheme = useMuiTheme();

  const handleStarredOnClick = () => {
    const newStatus = !isStarred;
    trackAppBarAction('starred', newStatus ? 'star' : 'unstar');
    mapInfo.updateStarred(newStatus).then(() => setStarred(newStatus));
  };

  const handleTitleClick = () => {
    if (!canRename) {
      return;
    }
    trackAppBarAction('rename_map');
    setIsEditingTitle(true);
    setEditedTitle(currentTitle);
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim() === '' || editedTitle === currentTitle) {
      setIsEditingTitle(false);
      return;
    }

    setIsSaving(true);
    try {
      await mapInfo.updateTitle(editedTitle.trim());
      setCurrentTitle(editedTitle.trim());
      setIsEditingTitle(false);
      // Update the document title as well
      document.title = `${editedTitle.trim()} | WiseMapping`;
      // Show success notification
      $notify(
        intl.formatMessage({
          id: 'appbar.title-renamed',
          defaultMessage: 'Mind map has been renamed',
        }),
      );
    } catch (error) {
      console.error(
        intl.formatMessage({
          id: 'appbar.error-saving-title',
          defaultMessage: 'Error saving title:',
        }),
        error,
      );
      // Revert to original title on error
      setEditedTitle(currentTitle);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleTitleSave();
    } else if (event.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle(currentTitle);
  };

  const showLoadingInParent = () => {
    try {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'wisemapping-show-loading' }, '*');
      }
    } catch (_) {
      /* cross-origin 무시 */
    }
  };

  const proceedToEdit = () => {
    trackAppBarAction('edit');
    const mapId = mapInfo.getId();
    showLoadingInParent();
    window.location.href = `/c/maps/${mapId}/edit?requestEdit=Y`;
  };

  const handleEditClick = async () => {
    const locked =
      typeof mapInfo.isLocked === 'function' ? mapInfo.isLocked() : false;
    if (locked) {
      const lockedBy = mapInfo.getLockedBy?.()?.trim();
      const message = lockedBy
        ? `${lockedBy}님이 수정 중인 맵입니다.\n수정중인 정보가 사라질 수 있습니다.\n계속하시겠습니까?`
        : '다른 사용자가 수정 중인 맵입니다.\n수정중인 정보가 사라질 수 있습니다.\n계속하시겠습니까?';
      setLockConfirmDialog({ open: true, message, lockedBy });
      return;
    }
    if (typeof mapInfo.acquireLock !== 'function') {
      proceedToEdit();
      return;
    }
    setIsAcquiringLock(true);
    try {
      await mapInfo.acquireLock();
      proceedToEdit();
    } catch (err) {
      const status = err && typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 0;
      if (status === 409) {
        const message =
          '다른 사용자가 수정 중인 맵입니다.\n수정중인 정보가 사라질 수 있습니다.\n계속하시겠습니까?';
        setLockConfirmDialog({ open: true, message, lockedBy: undefined });
      } else {
        console.error('Lock acquire failed:', err);
      }
    } finally {
      setIsAcquiringLock(false);
    }
  };

  const handleLockConfirmClose = () => {
    setLockConfirmDialog({ open: false, message: '', lockedBy: undefined });
  };

  const handleSaveBlockedClose = () => {
    const mapId = saveBlockedDialog.mapId;
    setSaveBlockedDialog({ open: false, mapId: undefined });
    if (mapId) {
      window.location.href = `/c/maps/${mapId}/edit`;
    }
  };

  const handleLockConfirmSubmit = async (_e: React.FormEvent<HTMLFormElement>) => {
    setLockConfirmDialog({ open: false, message: '', lockedBy: undefined });
    if (typeof mapInfo.forceAcquireLock !== 'function') {
      proceedToEdit();
      return;
    }
    setIsAcquiringLock(true);
    try {
      await mapInfo.forceAcquireLock();
      proceedToEdit();
    } catch (err) {
      console.error('Force lock acquire failed:', err);
      $notify(
        intl.formatMessage({
          id: 'appbar.edit-force-lock-failed',
          defaultMessage: '편집 권한을 가져오지 못했습니다. 다시 시도해 주세요.',
        }),
      );
    } finally {
      setIsAcquiringLock(false);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      const inputElement = inputRef.current.querySelector('input');
      if (inputElement) {
        inputElement.focus();
        // Position cursor at the end of the text instead of selecting all
        const length = inputElement.value.length;
        inputElement.setSelectionRange(length, length);
      }
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!canRename && isEditingTitle) {
      setIsEditingTitle(false);
      setEditedTitle(currentTitle);
    }
  }, [canRename, isEditingTitle, currentTitle]);

  // Debounced save handler - first save is immediate, subsequent saves within 5 seconds are debounced
  // First save executes immediately, intermediate saves are discarded (only the last save within 5 seconds executes)
  const handleDebouncedSave = useMemo(
    () =>
      debounce(
        async () => {
          if (!model) {
            return;
          }
          if (typeof mapInfo.fetchLatestLockInfo === 'function' && typeof mapInfo.getCurrentUserId === 'function') {
            try {
              const [lockInfo, currentUserId] = await Promise.all([
                mapInfo.fetchLatestLockInfo(),
                mapInfo.getCurrentUserId(),
              ]);
              const lockUserId = lockInfo.lockedByUserId?.trim();
              const userId = currentUserId?.trim();
              if (lockInfo.isLocked && lockUserId && userId && lockUserId !== userId) {
                setSaveBlockedDialog({ open: true, mapId: mapInfo.getId() });
                return;
              }
            } catch (e) {
              console.warn('Lock check before save failed:', e);
            }
          }
          trackAppBarAction('save');
          const mapId = mapInfo.getId();
          model
            .save(true)
            .then(() => mapInfo.releaseLock?.()?.catch((err) => console.warn('Unlock after save failed:', err)))
            .then(() => {
              showLoadingInParent();
              window.location.href = `/c/maps/${mapId}/edit?saveComplete=1`;
            })
            .catch((error) => {
              console.error('Save failed from app bar:', error);
            });
        },
        5000,
        { leading: true, trailing: true },
      ),
    [model, mapInfo, intl],
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      handleDebouncedSave.cancel();
    };
  }, [handleDebouncedSave]);

  // 저장 후 조회 모드로 돌아온 경우(saveComplete=1) 저장 완료 모달 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('saveComplete') === '1') {
      setSaveCompleteModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('saveComplete');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // 편집 화면에 머물 때 3초마다 Lock 정보 조회, 다른 사용자가 Lock 보유 시 모달 후 리다이렉트
  const isEditScreen =
    capability.mode !== 'edition-viewer' && Boolean(model?.isMapLoadded());
  useEffect(() => {
    if (
      !isEditScreen ||
      saveBlockedDialog.open ||
      typeof mapInfo.fetchLatestLockInfo !== 'function' ||
      typeof mapInfo.getCurrentUserId !== 'function'
    ) {
      return;
    }
    lockPollStoppedRef.current = false;
    const tick = () => {
      if (
        lockPollStoppedRef.current ||
        typeof mapInfo.fetchLatestLockInfo !== 'function' ||
        typeof mapInfo.getCurrentUserId !== 'function'
      ) {
        return;
      }
      Promise.all([
        mapInfo.fetchLatestLockInfo!(),
        mapInfo.getCurrentUserId!(),
      ])
        .then(([lockInfo, userId]) => {
          if (lockPollStoppedRef.current) return;
          const lockUserId = lockInfo.lockedByUserId?.trim();
          const uid = (userId ?? '').trim();
          if (
            lockInfo.isLocked &&
            lockUserId &&
            uid &&
            lockUserId !== uid
          ) {
            lockPollStoppedRef.current = true;
            setSaveBlockedDialog({ open: true, mapId: mapInfo.getId() });
          }
        })
        .catch((err) => {
          console.warn('Lock poll tick failed:', err);
        });
    };
    const id = setInterval(tick, 3000);
    tick();
    return () => clearInterval(id);
  }, [isEditScreen, mapInfo, saveBlockedDialog.open]);

  useEffect(() => {
    const latestTitle = mapInfo.getTitle();
    setCurrentTitle(latestTitle);
    setEditedTitle(latestTitle);
  }, [mapInfo]);

  const readOnlyTitleField = (
    <TextField
      value={currentTitle}
      variant="outlined"
      size="small"
      InputProps={{ readOnly: true }}
      onClick={canRename ? handleTitleClick : undefined}
      data-testid="app-bar-title"
      sx={[
        bscCmbOutlinedInputSx,
        {
          cursor: canRename ? 'pointer' : 'default',
          '& .MuiOutlinedInput-input': {
            cursor: canRename ? 'pointer' : 'default',
          },
        },
      ]}
    />
  );

  const readOnlyTitleDisplay = canRename ? (
    <Tooltip
      title={'마인드맵 명 변경'}
    >
      {readOnlyTitleField}
    </Tooltip>
  ) : (
    readOnlyTitleField
  );

  useEffect(() => {
    if (!capability.isHidden('starred')) {
      mapInfo
        .isStarred()
        .then((value) => setStarred(value))
        .catch((e) => {
          console.error(`Unexpected error loading starred status-> ${e}`);
        });
    }
  }, []);

  useEffect(() => {
    if (!model) {
      setIsMapLoaded(false);
      return;
    }

    if (model.isMapLoadded()) {
      setIsMapLoaded(true);
      return;
    }

    const designer = (() => {
      try {
        return model.getDesigner();
      } catch {
        return undefined;
      }
    })();

    if (!designer) {
      return;
    }

    const handleLoadSuccess = (): void => {
      setIsMapLoaded(true);
    };

    designer.addEvent('loadSuccess', handleLoadSuccess);

    return () => {
      designer.removeEvent('loadSuccess', handleLoadSuccess);
    };
  }, [model]);

  const config: (ActionConfig | undefined)[] = [
    {
      icon: <ArrowBackIosNewOutlinedIcon />,
      tooltip: '목록으로 돌아가기',
      'data-testid': 'app-bar-back-button',
      onClick: () => {
        trackAppBarAction('back_to_maps_list');
        onAction('back');
      },
    },
    {
      render: () => (
        <div
          style={{
            marginLeft: '1.5rem',
            marginRight: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isEditingTitle && canRename ? (
            <TextField
              ref={inputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleSave}
              variant="outlined"
              size="small"
              data-testid="app-bar-title"
              sx={bscCmbOutlinedInputSx}
              disabled={isSaving}
            />
          ) : (
            readOnlyTitleDisplay
          )}
        </div>
      ),
      visible: !capability.isHidden('appbar-title'),
    },
    ...(!capability.isHidden('undo-changes') || !capability.isHidden('redo-changes')
      ? [
          undefined,
          {
            render: () => (
              <UndoAndRedo
                configuration={{
                  icon: <UndoOutlinedIcon />,
                  tooltip: keyTooltip(
                    '되돌리기',
                    'Z',
                  ),
                  onClick: () => {
                    trackAppBarAction('undo');
                    model!.getDesigner().undo();
                  },
                }}
                disabledCondition={(event) => event.undoSteps > 0}
                model={model}
              />
            ),
            visible: !capability.isHidden('undo-changes'),
            disabled: () => !model?.isMapLoadded(),
          },
          {
            render: () => (
              <UndoAndRedo
                configuration={{
                  icon: <RedoOutlinedIcon />,
                  tooltip: keyTooltip(
                    '다시 실행',
                    'Shift + Z',
                  ),
                  onClick: () => {
                    trackAppBarAction('redo');
                    model!.getDesigner().redo();
                  },
                }}
                disabledCondition={(event) => event.redoSteps > 0}
                model={model}
              />
            ),
            visible: !capability.isHidden('redo-changes'),
            disabled: () => !model?.isMapLoadded(),
          },
          undefined,
        ]
      : [undefined]),
    {
      icon: <HelpOutlineOutlinedIcon />,
      onClick: () => {
        trackAppBarAction('info');
        onAction('info');
      },
      tooltip: '마인드맵 정보',
      visible: !capability.isHidden('info'),
    },
    {
      icon: <RestoreOutlinedIcon />,
      onClick: () => {
        trackAppBarAction('history');
        onAction('history');
      },
      tooltip: '변경 이력',
      visible: !capability.isHidden('history'),
    },
    {
      render: () => (
        <Tooltip
          title={'즐겨찾기'}
        >
          <IconButton size="small" onClick={handleStarredOnClick}>
            <StarRateRoundedIcon
              color="action"
              style={isStarred ? StarredOnStyle : StarredOffStyle}
            />
          </IconButton>
        </Tooltip>
      ),
      visible: !capability.isHidden('starred'),
      disabled: () => isStarred !== undefined,
    },
    appBarDivisor,
    {
      icon: <PaletteOutlinedIcon />,
      tooltip: '맵 테마 변경',
      options: [
        {
          render: (closeModal) => {
            if (model) {
              const modelBuilder = new NodePropertyValueModelBuilder(model.getDesigner());
              return (
                <ThemeEditor closeModal={closeModal} themeModel={modelBuilder.getThemeModel()} />
              );
            }
            return <div>Theme Editor not available</div>;
          },
        },
      ],
      visible: !capability.isHidden('theme'),
      disabled: () => !isMapLoaded,
    },
    {
      icon: <AccountTreeIcon />,
      tooltip: '레이아웃 변경',
      options: [
        {
          render: (closeModal) => {
            if (model) {
              const modelBuilder = new NodePropertyValueModelBuilder(model.getDesigner());
              return (
                <LayoutSelector
                  closeModal={closeModal}
                  layoutModel={modelBuilder.getLayoutModel()}
                  model={model}
                />
              );
            }
            return <div>Layout Selector not available</div>;
          },
        },
      ],
      visible: !capability.isHidden('layout'),
      disabled: () => !isMapLoaded,
    },
    {
      icon: <FileDownloadOutlinedIcon />,
      onClick: () => {
        trackAppBarAction('export');
        onAction('export');
      },
      tooltip: '맵 내보내기',
      visible: !capability.isHidden('export'),
      disabled: () => !isMapLoaded,
    },
    // {
    //   render: () => (
    //     <Tooltip title={'다른 사용자와 협업하기'}>
    //       <Button
    //         variant="outlined"
    //         disableElevation
    //         sx={[bscCmbTypeInfoButtonSx, { minWidth: 80 }]}
    //         onClick={() => {
    //           trackAppBarAction('share');
    //           onAction('share');
    //         }}
    //       >
    //         {'협업하기'}
    //       </Button>
    //     </Tooltip>
    //   ),
    //   visible: !capability.isHidden('share'),
    // },
    {
      render: () => (
        <Tooltip title={'수정하기'}>
          <Button
            variant="outlined"
            disableElevation
            sx={[bscCmbTypeInfoButtonSx, { minWidth: 80 }]}
            onClick={handleEditClick}
            startIcon={<EditIcon />}
            disabled={isAcquiringLock}
          >
            {isAcquiringLock ? '...' : '수정'}
          </Button>
        </Tooltip>
      ),
      visible:
        capability.mode === 'edition-viewer' &&
        (typeof mapInfo.getRole !== 'function' || mapInfo.getRole?.() !== 'viewer'),
    },
    {
      render: () => (
        <Tooltip title={keyTooltip('저장', 'S')}>
          <Button
            variant="outlined"
            disableElevation
            sx={[bscCmbTypeInfoButtonSx, { minWidth: 80 }]}
            onClick={handleDebouncedSave}
            startIcon={<SaveOutlinedIcon />}
            disabled={!model?.isMapLoadded()}
          >
            {'저장'}
          </Button>
        </Tooltip>
      ),
      visible: !capability.isHidden('save'),
      disabled: () => !model?.isMapLoadded(),
    },
    {
      render: () => accountConfig,
      visible: !capability.isHidden('account'),
    },
    {
      render: () => (
        <Tooltip
          title={intl.formatMessage({ id: 'appbar.tooltip-signup', defaultMessage: 'Sign Up' })}
        >
          <Button
            size="medium"
            variant="outlined"
            color="primary"
            disableElevation
            onClick={() => {
              trackAppBarAction('sign_up');
              window.location.href = '/c/registration';
            }}
          >
            {intl.formatMessage({ id: 'appbar.button-signup', defaultMessage: 'Sign Up' })}
          </Button>
        </Tooltip>
      ),
      visible: !capability.isHidden('sign-up'),
    },
  ];

  return (
    <>
      <MaterialAppBar
        role="menubar"
        position="absolute"
        color="default"
        elevation={0}
        className="material-menubar"
        sx={{
          width: '100%',
          backgroundColor: muiTheme.palette.background.paper,
          color: muiTheme.palette.text.primary,
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          '& MuiButtonBase-root': {
            marginX: '0.25rem',
          },
        }}
      >
        <MaterialToolbar
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: muiTheme.spacing(1),
            minHeight: 56,
            // 목록 상단 툴바와 동일: 아이콘 버튼을 토글 그룹 스타일로
            '& .MuiIconButton-root': {
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: muiTheme.palette.background.paper,
              padding: muiTheme.spacing(0.75),
              '&:hover': {
                backgroundColor: muiTheme.palette.action.hover,
              },
              '&.Mui-disabled': {
                borderColor: 'divider',
                backgroundColor: muiTheme.palette.action.disabledBackground,
              },
            },
            '& .MuiIconButton-root[aria-pressed="true"]': {
              backgroundColor: muiTheme.palette.action.selected,
              '&:hover': {
                backgroundColor: muiTheme.palette.action.selected,
              },
            },
            '& .MuiDivider-root': {
              margin: `0 ${muiTheme.spacing(0.5)}`,
            },
          }}
        >
          {config.map((c, i) => {
            return <ToolbarMenuItem key={i} configuration={c} />;
          })}
        </MaterialToolbar>
      </MaterialAppBar>

      {lockConfirmDialog.open && (
        <BaseDialog
          onClose={handleLockConfirmClose}
          onSubmit={handleLockConfirmSubmit}
          title="수정하기"
          useBscCmbTitle={true}
          papercss={bscCmbAlertModalPaper}
          submitButton="수정"
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
            {lockConfirmDialog.lockedBy ? (
              <>
                <strong>{lockConfirmDialog.lockedBy}</strong>
                {'님이 수정 중인 맵입니다.\n수정중인 정보가 사라질 수 있습니다.\n계속하시겠습니까?'}
              </>
            ) : (
              lockConfirmDialog.message
            )}
          </Box>
        </BaseDialog>
      )}

      {saveBlockedDialog.open && (
        <BaseDialog
          onClose={handleSaveBlockedClose}
          title="저장 불가"
          useBscCmbTitle={true}
          papercss={bscCmbAlertModalPaper}
          closeButton="확인"
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
            {'다른 사용자가 수정 중인 맵입니다.\n조회화면으로 이동합니다.'}
          </Box>
        </BaseDialog>
      )}

      {saveCompleteModal && (
        <BaseDialog
          onClose={() => setSaveCompleteModal(false)}
          title={intl.formatMessage({
            id: 'appbar.save-complete-title',
            defaultMessage: '저장 완료',
          })}
          useBscCmbTitle={true}
          papercss={bscCmbAlertModalPaper}
          closeButton="확인"
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
            {intl.formatMessage({
              id: 'appbar.save-complete-message',
              defaultMessage: '저장이 완료되었습니다.',
            })}
          </Box>
        </BaseDialog>
      )}
    </>
  );
};

export default AppBar;
