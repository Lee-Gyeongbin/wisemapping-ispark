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
import { alpha, useTheme } from '@mui/material/styles';

import useClasses from '../../../theme/useStyles';

export const useStyles = () => {
  const theme = useTheme();
  const smMediaQuery = theme.breakpoints.down('sm');

  return useClasses({
    root: {
      width: '100%',
    },
    paper: {
      marginTop: 0,
      marginBottom: theme.spacing(2),
      backgroundColor: 'transparent',
      marginLeft: 0,
      marginRight: 0,
      [smMediaQuery]: {
        marginTop: 0,
      },
    },
    cards: {
      display: 'none',
      [smMediaQuery]: {
        display: 'block',
      },
    },
    table: {
      [smMediaQuery]: {
        display: 'none',
      },
      minWidth: 750,
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: '"Pretendard", sans-serif',
      '& thead': {
        position: 'sticky',
        top: 0,
        zIndex: 10,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          borderTop: '1px solid #586166',
          backgroundColor: '#e6e8ea',
          zIndex: -1,
        },
      },
      '& tbody tr': {
        backgroundColor: '#fff',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: '#f1f3f5',
        },
        '&.Mui-selected': {
          backgroundColor: '#ecedf8',
        },
        '&:last-child td': {
          borderBottom: 'none',
        },
      },
      '& th, & td': {
        height: 34,
        padding: '4px 8px',
        verticalAlign: 'middle',
        border: '1px solid #cdd1d5',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '-0.5px',
      },
    },
    headerCell: {
      backgroundColor: '#e6e8ea',
      color: '#1e2124',
      fontWeight: 700,
      fontSize: 14,
      textAlign: 'center',
      fontFamily: '"Pretendard", sans-serif',
      border: '1px solid #cdd1d5',
      padding: '4px 8px',
      height: 34,
      '& .MuiTableSortLabel-root': {
        fontWeight: 700,
      },
    },
    headerCellLeft: {
      textAlign: 'left',
    },
    bodyCell: {
      fontSize: 14,
      fontWeight: 500,
      color: '#464c53',
      textAlign: 'center',
      fontFamily: '"Pretendard", sans-serif',
      padding: '4px 8px',
      height: 34,
      border: '1px solid #cdd1d5',
      '& a': {
        color: '#464c53',
        textDecoration: 'underline',
        letterSpacing: '-0.5px',
        '&:hover': {
          color: '#5d5dc4',
        },
      },
    },
    labelsCell: {
      maxWidth: '300px',
      overflow: 'hidden',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
    descriptionCell: {
      maxWidth: '200px',
      minWidth: 0,
      textAlign: 'left',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      '& .MuiTypography-root': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
    bodyCellLeft: {
      textAlign: 'left',
    },
    visuallyHidden: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      top: 20,
      width: 1,
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0',
      paddingTop: '16px',
      paddingBottom: '30px',
      marging: '0',
      boxShadow: 'none',
      backgroundColor: 'transparent',
      [smMediaQuery]: {
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    filterBarWrapper: {
      width: '100%',
      [smMediaQuery]: {
        padding: '8px',
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
    tableContainer: {
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      overflowY: 'auto',
      overflowX: 'hidden',
      borderBottom: '1px solid #cdd1d5',
      [smMediaQuery]: {
        borderBottom: 'none',
      },
    },
    toolbarActions: {
      flex: '1 1 0',
      minWidth: 0,
      '& .MuiButton-root': {
        [smMediaQuery]: {
          minWidth: 'auto',
          padding: '6px 8px',
          '& .MuiButton-startIcon': {
            margin: 0,
          },
        },
      },
      '& .button-text': {
        [smMediaQuery]: {
          display: 'none',
        },
      },
    },
    searchContainer: {
      [smMediaQuery]: {
        '& .search-item': {
          display: 'none',
        },
      },
    },
    search: {
      borderRadius: 9,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      margin: '10px 0px',
      width: 'auto',
    },
    paginationDesktop: {
      display: 'block',
      backgroundColor: 'transparent',
      [smMediaQuery]: {
        display: 'none',
      },
    },
    paginationMobile: {
      display: 'none',
      backgroundColor: 'transparent',
      [smMediaQuery]: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '16px',
        marginLeft: '16px',
        marginRight: '16px',
        backgroundColor: 'transparent',
      },
    },
    tablePagination: {
      width: 'auto',
      display: 'inline-flex',
      backgroundColor: 'transparent',
      border: '1px solid rgba(128, 128, 128, 0.15)',
      borderRadius: '8px',
      padding: '0',
      margin: '0',
      '& .MuiTablePagination-toolbar': {
        minHeight: '40px',
        paddingLeft: '22px',
        paddingRight: '12px',
        minWidth: 'auto',
        backgroundColor: 'transparent',
      },
      '& .MuiTablePagination-spacer': {
        display: 'none',
      },
      '& .MuiTablePagination-selectLabel': {
        margin: 0,
      },
      '& .MuiTablePagination-displayedRows': {
        margin: 0,
      },
      [smMediaQuery]: {
        width: '50%',
        overflow: 'hidden',
        marginRight: '0',
      },
    },
    searchIcon: {
      padding: '6px 0 0 5px',
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchInputRoot: {
      color: 'inherit',
    },
    toolbalLeft: {
      float: 'right',
    },
    searchInputInput: {
      '& .MuiInputBase-input': {
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: 4,
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
          width: '24ch',
          '&:focus': {
            width: '39ch',
          },
        },
      },
    },
    cardHeader: {
      padding: '4px',
    },
    cardTitle: {
      maxWidth: '70vw',
      fontSize: '0.875rem',
      fontFamily: '"Pretendard", sans-serif',
    },
    // Skeleton styles
    skeletonBase: {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
    },
    skeletonDrawer: {
      backgroundColor:
        theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.11)',
    },
    skeletonTextLarge: {
      fontSize: '0.96rem',
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
    },
    skeletonTextSmall: {
      fontSize: '0.96rem',
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
    },
    cardSkeletonContainer: {
      maxWidth: '94vw',
      margin: '3vw',
    },
    // MapsPageLoading styles
    loadingContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme.palette.background.paper,
    },
    loadingDrawer: {
      width: 240,
      flexShrink: 0,
      background:
        theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.grey[900],
      borderRight: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2),
    },
    loadingDrawerLogo: {
      padding: '20px 0 20px 0',
    },
    loadingDrawerList: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
    loadingDrawerFooter: {
      marginTop: 'auto',
      paddingTop: theme.spacing(2),
    },
    loadingMainContent: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    loadingAppBar: {
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    loadingSkeletonButton: {
      borderRadius: theme.spacing(0.5),
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
    },
    loadingSkeletonCircle: {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
    },
    loadingTableContainer: {
      marginTop: theme.spacing(10),
      marginBottom: theme.spacing(4),
      marginLeft: 0,
      marginRight: 0,
      padding: '0 !important',
    },
    loadingSearchToolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0',
      paddingTop: '30px',
      paddingBottom: '30px',
      margin: '0',
      boxShadow: 'none',
      backgroundColor: theme.palette.background.paper,
    },
    loadingToolbarLeft: {
      flex: '1 1 0',
      paddingLeft: '23px',
      minWidth: 0,
    },
    loadingToolbarCenter: {
      flex: '1 1 0',
      display: 'flex',
      justifyContent: 'center',
      minWidth: 0,
    },
    loadingToolbarRight: {
      flex: '1 1 0',
      display: 'flex',
      justifyContent: 'flex-end',
      minWidth: 0,
    },
  });
};
