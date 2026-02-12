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

import React, { useEffect } from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';

import { FormattedMessage } from 'react-intl';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import { useFetchMapById } from '../../../classes/middleware';
import { trackMindmapListAction } from '../../../utils/analytics';
export type ActionType =
  | 'open'
  | 'share'
  | 'import'
  | 'delete'
  | 'info'
  | 'create'
  | 'duplicate'
  | 'export'
  | 'label'
  | 'rename'
  | 'print'
  | 'info'
  | 'publish'
  | 'history'
  | 'theme'
  | 'back'
  | undefined;

interface ActionProps {
  onClose: (action: ActionType) => void;
  anchor?: HTMLElement;
  mapId: number;
}

const BACKDROP_SX = { backgroundColor: 'rgba(0, 0, 0, 0.3) !important' as const };

const ActionChooser = (props: ActionProps): React.ReactElement => {
  const { anchor, onClose, mapId } = props;
  const isOpen = Boolean(anchor);

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top || !isOpen) return;
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
  }, [isOpen]);

  const handleOnClose = (
    action: ActionType,
  ): ((event: React.MouseEvent<HTMLLIElement>) => void) => {
    return (event): void => {
      event.stopPropagation();
      if (action) {
        trackMindmapListAction(action);
      }
      onClose(action);
    };
  };

  const { data: mapData } = useFetchMapById(mapId);
  const role = mapData?.role;
  return (
    <Menu
      anchorEl={anchor}
      keepMounted
      open={isOpen}
      onClose={handleOnClose(undefined)}
      elevation={1}
      slotProps={{
        backdrop: { sx: BACKDROP_SX },
      }}
    >
      <MenuItem onClick={handleOnClose('open')} style={{ width: '220px' }}>
        <ListItemIcon>
          <DescriptionOutlinedIcon />
        </ListItemIcon>
        열기
      </MenuItem>

      <Divider />

      <MenuItem onClick={handleOnClose('duplicate')}>
        <ListItemIcon>
          <FileCopyOutlinedIcon />
        </ListItemIcon>
        맵 복사하기
      </MenuItem>

      {role == 'owner' && (
        <MenuItem onClick={handleOnClose('rename')}>
          <ListItemIcon>
            <EditOutlinedIcon />
          </ListItemIcon>
          이름 변경
        </MenuItem>
      )}

      <MenuItem onClick={handleOnClose('label')}>
        <ListItemIcon>
          <LabelOutlined />
        </ListItemIcon>
        라벨 추가
      </MenuItem>

      <MenuItem onClick={handleOnClose('delete')}>
        <ListItemIcon>
          <DeleteOutlinedIcon />
        </ListItemIcon>
        삭제
      </MenuItem>
      <Divider />

      {role == 'owner' && (
        <MenuItem onClick={handleOnClose('share')}>
          <ListItemIcon>
            <ShareOutlinedIcon />
          </ListItemIcon>
          협업하기
        </MenuItem>
      )}
      <Divider />

      <MenuItem onClick={handleOnClose('info')}>
        <ListItemIcon>
          <InfoOutlinedIcon />
        </ListItemIcon>
        맵 정보
      </MenuItem>

      {role != 'viewer' && (
        <MenuItem onClick={handleOnClose('history')}>
          <ListItemIcon>
            <HistoryOutlined />
          </ListItemIcon>
          변경 이력
        </MenuItem>
      )}
    </Menu>
  );
};

export default ActionChooser;
