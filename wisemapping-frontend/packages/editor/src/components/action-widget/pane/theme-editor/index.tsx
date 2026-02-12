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
import React, { ReactElement, useState, useMemo, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import NodeProperty from '../../../../classes/model/node-property';
import { ThemeType } from '@wisemapping/mindplot';
import { uiPageHeaderTitle, uiPageHeaderStarIcon } from '../../../../../../webapp/src/theme/ui-page-header-styles';
import { bscCmbTypeSecondaryButtonSx, bscCmbTypeInfoButtonSx } from '../../../../../../webapp/src/theme/ui-input-styles';

const ThemeEditor = (props: {
  closeModal: () => void;
  themeModel: NodeProperty<ThemeType>;
}): ReactElement => {
  const [theme, setTheme] = useState(props.themeModel.getValue());
  const intl = useIntl();

  // Memoize themes array to avoid recreating and calling intl.formatMessage on every render
  const themes = useMemo(
    () => [
      {
        id: 'prism' as ThemeType,
        name: 'Summer',
        description: '밝고 활기찬 오렌지 테마. 창의적인 프로젝트와 활기찬 발표에 적합합니다.',
      },
      {
        id: 'aurora' as ThemeType,
        name: 'Aurora',
        description: '네온 영감의 그라데이션 테마. 몰입감 있는 스토리텔링을 위한 볼드한 글꼴과 고대비 커넥터가 포함되어 있습니다.',
      },
      {
        id: 'retro' as ThemeType,
        name: '80s Retro Night',
        description: '80s 시네웨이브 팔레트. 네온 림, 크롬 그라데이션, 그리드 라인 캔버스가 포함되어 있습니다.',
      },
      {
        id: 'sunrise' as ThemeType,
        name: 'Sunrise',
        description: 'Sunrise 테마. 라이트/다크 모드 변형. 더 나은 가독성을 위한 강조된 색상과 대비.',
      },
      {
        id: 'ocean' as ThemeType,
        name: 'Ocean',
        description: '바다를 모티브로 한 파란색 테마로, 라이트/다크 모드가 있습니다. 차분하고 전문적인 색감이라 비즈니스와 크리에이티브 작업 모두에 잘 어울립니다.',
      },
      {
        id: 'classic' as ThemeType,
        name: 'Classic',
        description: '파란색 강조가 있는 깔끔하고 전문적인 디자인. 비즈니스 발표와 공식 문서에 적합합니다.',
      },
      {
        id: 'robot' as ThemeType,
        name: 'Robot',
        description: '기술 영감의 녹색 테마. 기술 문서와 미래적인 발표에 적합합니다.',
      },
    ],
    [intl],
  );

  const handleThemeSelect = (selectedTheme: ThemeType) => {
    setTheme(selectedTheme);
  };

  const handleAccept = () => {
    const setValue = props.themeModel.setValue;
    if (setValue) {
      setValue(theme);
    }
    props.closeModal();
  };

  const handleCancel = () => {
    // Reset to original theme
    setTheme(props.themeModel.getValue());
    props.closeModal();
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
          minHeight: '350px',
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
        {'맵 테마 변경'}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.4 }}>
          {'테마(Theme)는 마인드맵의 시각적 스타일을 정의합니다.'}<br />{'여기에는 색상, 글꼴, 전체적인 외형이 포함됩니다.'}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {themes.map((themeOption) => (
            <Card
              key={themeOption.id}
              sx={{
                cursor: 'pointer',
                border: theme === themeOption.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': {
                  border: '2px solid #1976d2',
                  boxShadow: 2,
                },
              }}
              onClick={() => handleThemeSelect(themeOption.id)}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant="subtitle2"
                  component="div"
                  sx={{ fontWeight: 'bold', mb: 0.25, fontSize: '0.875rem' }}
                >
                  {themeOption.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2, fontSize: '0.75rem' }}
                >
                  {themeOption.description}
                </Typography>
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
          {'테마 적용'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThemeEditor;
