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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import React, { ReactElement, useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SvgIcon from '@mui/material/SvgIcon';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { LayoutType } from '@wisemapping/mindplot';
import NodeProperty from '../../../../classes/model/node-property';
import Model from '../../../../classes/model/editor';
import { trackEditorInteraction } from '../../../../utils/analytics';
import {
  uiPageHeaderTitle,
  uiPageHeaderStarIcon,
} from '../../../../../../webapp/src/theme/ui-page-header-styles';
import { bscCmbTypeInfoButtonSx, bscCmbTypeSecondaryButtonSx } from '../../../../../../webapp/src/theme/ui-input-styles';

// Custom SVG icon for mindmap layout
const MindmapIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    {/* Central node */}
    <rect x="18" y="20" width="12" height="8" rx="2" fill="currentColor" />

    {/* Left branch */}
    <path d="M 18 24 L 8 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="2" y="20" width="6" height="8" rx="1.5" fill="currentColor" />
    <path d="M 18 24 L 8 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="2" y="10" width="6" height="8" rx="1.5" fill="currentColor" />
    <path d="M 18 24 L 8 34" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="2" y="30" width="6" height="8" rx="1.5" fill="currentColor" />

    {/* Right branch */}
    <path d="M 30 24 L 40 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="40" y="20" width="6" height="8" rx="1.5" fill="currentColor" />
    <path d="M 30 24 L 40 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="40" y="10" width="6" height="8" rx="1.5" fill="currentColor" />
    <path d="M 30 24 L 40 34" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="40" y="30" width="6" height="8" rx="1.5" fill="currentColor" />
  </SvgIcon>
);

type LayoutSelectorProps = {
  closeModal: () => void;
  layoutModel: NodeProperty<LayoutType>;
  model: Model;
};

const LayoutSelector = ({ closeModal, layoutModel, model }: LayoutSelectorProps): ReactElement => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(
    layoutModel.getValue() || 'mindmap',
  );
  const intl = useIntl();

  const layouts = [
    {
      id: 'mindmap' as LayoutType,
      name: 'Mindmap',
      description: '가로 방향의 레이아웃. 양쪽에 균형잡힌 가지가 있습니다.전통적인 마인드맵과 브레인스토밍에 적합합니다.',
      icon: <MindmapIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
    },
    {
      id: 'tree' as LayoutType,
      name: 'Tree',
      description: '세로 방향의 레이아웃. 위에서 아래로 흐르는 계층 구조. 조직도와 계층 구조에 적합합니다.',
      icon: <AccountTreeIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
    },
  ];

  const handleLayoutSelect = (layout: LayoutType) => {
    setSelectedLayout(layout);
    console.log(`[LayoutSelector] User selected layout: ${layout}`);
  };

  const handleAccept = async () => {
    const setValue = layoutModel.setValue;
    if (setValue) {
      const previousLayout = layoutModel.getValue();
      console.log(
        `[LayoutSelector] Applying layout change: ${previousLayout} -> ${selectedLayout}`,
      );

      setValue(selectedLayout);

      // Trigger a full page refresh if the layout changed
      if (previousLayout !== selectedLayout) {
        // Track layout change
        trackEditorInteraction('layout_change', selectedLayout);

        // Force save with the new layout before refreshing
        // Use saveHistory=true to bypass saveRequired check and ensure save happens
        console.log('[LayoutSelector] Saving map with new layout before refresh');
        await model.save(true);
        console.log('[LayoutSelector] Save complete, refreshing page');
        window.location.reload();
      }
    }
    closeModal();
  };

  const handleCancel = () => {
    // Reset to original layout
    setSelectedLayout(layoutModel.getValue());
    closeModal();
  };

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;
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
  }, []);

  return (
    <Dialog
      open={true}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '300px',
          boxShadow: 'none',
        },
      }}
    >
      <DialogTitle
        sx={[
          uiPageHeaderTitle,
          {
            padding: '20px 32px 16px 32px !important',
            marginBottom: 0,
          },
        ]}
      >
        <Box component="span" sx={uiPageHeaderStarIcon} />
        {'레이아웃 변경'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.4 }}>
          {'레이아웃(Layout)은 마인드맵에서 주제가 어떻게 구성되고 연결되는지를 정의합니다.'}<br />{'주제의 배치와 연결 방식이 포함됩니다.'}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {layouts.map((layoutOption) => (
            <Card
              key={layoutOption.id}
              sx={{
                cursor: 'pointer',
                border:
                  selectedLayout === layoutOption.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': {
                  border: '2px solid #1976d2',
                  boxShadow: 2,
                },
              }}
              onClick={() => handleLayoutSelect(layoutOption.id)}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {layoutOption.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      component="div"
                      sx={{ fontWeight: 'bold', mb: 0.25, fontSize: '0.875rem' }}
                    >
                      {layoutOption.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.2, fontSize: '0.75rem' }}
                    >
                      {layoutOption.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '13px 13px 13px 13px' }}>
        <Button type="button" variant="contained" onClick={handleCancel} sx={bscCmbTypeSecondaryButtonSx}>
          {'닫기'}
        </Button>
        <Button type="button" variant="contained" onClick={handleAccept} sx={bscCmbTypeInfoButtonSx}>
          {'레이아웃 적용'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LayoutSelector;
