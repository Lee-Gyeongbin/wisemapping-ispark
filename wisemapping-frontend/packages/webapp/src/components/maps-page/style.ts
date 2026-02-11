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

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useTheme } from '@mui/material/styles';
import useClasses from '../../theme/useStyles';

export const mobileAppbarButton = {
  padding: 0,
  minWidth: 'unset',
  '& .message': {
    display: 'none',
  },
  '& .MuiButton-startIcon': {
    margin: 0,
    padding: 10,
  },
};

export function useStyles(_drawerOpen?: boolean) {
  const theme = useTheme();
  const smMediaQuery = theme.breakpoints.down('sm');
  return useClasses({
    root: {
      display: 'flex',
    },
    appBar: {
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      zIndex: theme.zIndex.appBar,
    },
    appBarShift: {
      width: '100%',
    },
    toolbarContent: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      minHeight: 56,
      [smMediaQuery]: {
        gap: theme.spacing(0.5),
      },
    },
    filterButtonGroup: {
      marginRight: theme.spacing(1),
      '& .MuiToggleButtonGroup-grouped': {
        padding: theme.spacing(0.75, 1),
      },
    },
    labelsButton: {
      marginRight: theme.spacing(1),
      minWidth: 240,
      width: 240,
      maxWidth: 280,
      position: 'relative',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      [smMediaQuery]: {
        minWidth: 180,
        width: 'auto',
        maxWidth: 200,
        '& .MuiButton-endIcon': { marginLeft: 0 },
      },
    },
    toolbarSpacer: {
      flex: 1,
      minWidth: theme.spacing(2),
    },
    copilotButton: {
      marginRight: 10,
      minWidth: '130px',
      [smMediaQuery]: mobileAppbarButton,
    },
    newMapButton: {
      marginRight: 10,
      minWidth: 56, // size-md
      [smMediaQuery]: mobileAppbarButton,
    },
    importButton: {
      marginRight: 10,
      minWidth: '130px',
      [smMediaQuery]: mobileAppbarButton,
    },
    rightButtonGroup: {
      marginRight: 10,
      flexGrow: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '8px',
      [smMediaQuery]: {
        minWidth: 'unset',
        marginRight: 0,
      },
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'flex-end',
      minHeight: '44px',
    },
    content: {
      flexGrow: 1,
      padding: '0px 0px',
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
  });
}
