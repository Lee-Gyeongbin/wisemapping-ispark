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
import BaseDialog from '../base-dialog';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  Designer,
  TextExporterFactory,
  ImageExporterFactory,
  Exporter,
  Mindmap,
  SizeType,
} from '@wisemapping/editor';
import ThemeType from '@wisemapping/mindplot/src/components/model/ThemeType';
import { fetchMindmap } from '../../../editor-page/PersistenceManagerUtils';
import { useFetchMapMetadata } from '../../../../classes/middleware';
import { trackExport } from '../../../../utils/analytics';
import { bscCmbOutlinedInputSx } from '../../../../theme/ui-input-styles';

type ExportFormat = 'svg' | 'jpg' | 'png' | 'pdf' | 'txt' | 'mm' | 'mmx' | 'wxml' | 'md';

type ExportDialogProps = {
  mapId: number;
  enableImgExport: boolean;
  svgXml?: string;
  onClose: () => void;
};

const ExportDialog = ({
  mapId,
  onClose,
  enableImgExport,
}: ExportDialogProps): React.ReactElement => {
  const [submit, setSubmit] = React.useState<boolean>(false);
  const { data: mapMetadata } = useFetchMapMetadata(mapId);

  const [exportFormat, setExportFormat] = React.useState<ExportFormat>('svg');

  // Center/zoom 옵션은 이미지가 잘리는 이슈가 있어 UI 제거 + 항상 false로 export
  const zoomToFit = false;
  const exportTheme: ThemeType = 'prism';

  const handleOnExportFormatChange = (_event: React.SyntheticEvent, newValue: ExportFormat | null) => {
    if (newValue) {
      setExportFormat(newValue);
    }
  };

  const handleOnClose = (): void => {
    onClose();
  };

  const handleOnSubmit = (): void => {
    setSubmit(true);
  };

  const exporter = async (formatType: ExportFormat): Promise<string> => {
    let svgElement: Element | undefined;
    let size: SizeType;
    let mindmap: Mindmap;
    let originalTheme: ThemeType | undefined;

    const designer: Designer = globalThis.designer;
    // exporting from editor toolbar action

    if (designer != null) {
      // Depending on the type of export. It will require differt POST.
      const workspace = designer.getWorkSpace();
      svgElement = workspace.getSVGElement();
      size = { width: window.innerWidth, height: window.innerHeight };
      mindmap = designer.getMindmap();

      // Store original theme and apply export theme
      originalTheme = mindmap.getTheme();
      if (originalTheme !== exportTheme) {
        designer.applyTheme(exportTheme);
        // Re-render to apply new theme
        workspace.getSVGElement();
      }
    } else {
      // exporting from map list
      mindmap = await fetchMindmap(mapId);
      // Store original theme and apply export theme
      originalTheme = mindmap.getTheme();
      if (originalTheme !== exportTheme) {
        mindmap.setTheme(exportTheme);
      }
    }

    let exporter: Exporter;
    switch (formatType) {
      case 'png':
      case 'jpg':
      case 'svg':
      case 'pdf': {
        exporter = ImageExporterFactory.create(
          formatType,
          svgElement!,
          size!.width,
          size!.height,
          zoomToFit,
        );
        break;
      }
      case 'wxml':
      case 'mm':
      case 'mmx':
      case 'md':
      case 'txt': {
        exporter = TextExporterFactory.create(formatType, mindmap);
        break;
      }
      default: {
        const exhaustiveCheck: never = formatType;
        throw new Error(`Unhandled color case: ${exhaustiveCheck}`);
      }
    }

    return exporter.exportAndEncode();
  };

  useEffect(() => {
    if (submit) {
      exporter(exportFormat)
        .then((url: string) => {
          // Track specific export format in Google Analytics
          trackExport(exportFormat, 'image');

          // Create hidden anchor to force download ...
          const anchor: HTMLAnchorElement = document.createElement('a');
          anchor.style.display = 'display: none';
          anchor.download = `${mapMetadata?.title ?? 'mindmap'}.${exportFormat}`;
          anchor.href = url;
          document.body.appendChild(anchor);

          // Trigger click ...
          anchor.click();

          // Clean up ...
          URL.revokeObjectURL(url);
          document.body.removeChild(anchor);
        })
        .catch((fail) => {
          console.error('Unexpected error during export:' + fail);
        });

      onClose();
    }
  }, [submit]);

  return (
    <div>
      <BaseDialog
        onClose={handleOnClose}
        onSubmit={handleOnSubmit}
        title={'맵 내보내기'}
        description={'맵을 색상과 도형을 모두 포함한 이미지로 얻을 수 있습니다.'}
        useBscCmbTitle
        submitButton={'내보내기'}
      >
        {!enableImgExport && (
          <Alert severity="info">
            {'이미지(SVG, PNG, JPEG, PDF) 내보내기는 에디터 툴바에서만 가능합니다.'}
          </Alert>
        )}
        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            p: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: (theme) => theme.shape.borderRadius,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              component="label"
              variant="body1"
              color="text.secondary"
              sx={{ flexShrink: 0 }}
            >
              이미지 형식
            </Typography>
            <Autocomplete
              value={exportFormat}
              onChange={handleOnExportFormatChange}
              options={['svg', 'png', 'jpg', 'pdf'] as ExportFormat[]}
              getOptionLabel={(option) => {
                const labels: Partial<Record<ExportFormat, string>> = {
                  svg: 'SVG',
                  png: 'PNG',
                  jpg: 'JPEG',
                  pdf: 'PDF',
                };
                return labels[option] || option;
              }}
              disableClearable
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="형식 선택"
                  sx={[
                    bscCmbOutlinedInputSx,
                    {
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        minHeight: 26,
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '4px 8px',
                        fontSize: 12,
                      },
                    },
                  ]}
                />
              )}
              sx={{ flex: 1, minWidth: 0 }}
            />
          </Box>
        </Paper>
      </BaseDialog>
    </div>
  );
};

export default ExportDialog;
