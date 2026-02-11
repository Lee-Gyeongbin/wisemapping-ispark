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

import React, { useEffect, useMemo, CSSProperties, useContext } from 'react';

import { useStyles } from './styled';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import Client, { ErrorInfo, Label, MapInfo } from '../../../classes/client';
import ActionChooser, { ActionType } from '../action-chooser';
import ActionDispatcher from '../action-dispatcher';
import ThemeToggleButton from '../../common/theme-toggle-button';
import LabelDeleteConfirm from './label-delete-confirm';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl } from 'react-intl';
import { trackToolbarAction } from '../../../utils/analytics';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import Link from '@mui/material/Link';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';

import relativeTime from 'dayjs/plugin/relativeTime';
import { LabelsCell } from './labels-cell';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ko';
import AppI18n from '../../../classes/app-i18n';
import LabelTwoTone from '@mui/icons-material/LabelTwoTone';
import ScatterPlotTwoTone from '@mui/icons-material/ScatterPlotTwoTone';
import PersonOutlineTwoTone from '@mui/icons-material/PersonOutlineTwoTone';
import ShareTwoTone from '@mui/icons-material/ShareTwoTone';
import StarTwoTone from '@mui/icons-material/StarTwoTone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { CSSObject, Interpolation, Theme } from '@emotion/react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import { ClientContext } from '../../../classes/provider/client-context';
import {
  uiInputSizeMd,
  filterBar,
  filterBarItem,
  filterBarLabel,
  filterBarFilters,
} from '../../../theme/ui-input-styles';
import {
  uiButtonTypeLineSecondarySizeMd,
  uiButtonTypeSecondarySizeMd,
  uiButtonIconOnlyLineSecondary,
} from '../../../theme/ui-button-styles';
import { uiSelectSizeMd } from '../../../theme/ui-select-styles';
import {
  uiPageHeader,
  uiPageHeaderTop,
  uiPageHeaderTitle,
  uiPageHeaderStarIcon,
} from '../../../theme/ui-page-header-styles';
import {
  BscCheckboxUncheckedIcon,
  BscCheckboxCheckedIcon,
  BscCheckboxIndeterminateIcon,
  checkboxBscCmbSx,
} from '../../../theme/ui-checkbox-styles';

dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string | boolean | Label[] | undefined },
  b: { [key in Key]: number | string | Label[] | boolean },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  id: keyof MapInfo;
  label?: string;
  numeric: boolean;
  style?: CSSProperties;
}

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>;
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof MapInfo) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const intl = useIntl();

  const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;

  const createSortHandler = (property: keyof MapInfo) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  const headCells: HeadCell[] = useMemo(
    () => [
      {
        id: 'title',
        numeric: false,
        label: '마인드맵 명',
        style: { width: '35%', whiteSpace: 'nowrap' },
      },
      {
        id: 'labels',
        numeric: false,
        label: '라벨',
        style: { width: '15%', whiteSpace: 'nowrap' },
      },
      {
        id: 'createdBy',
        numeric: false,
        label: '생성자',
        style: { width: '10%', whiteSpace: 'nowrap' },
      },
      {
        id: 'lastModificationTime',
        numeric: true,
        label: '최종 수정',
        style: { width: '15%', whiteSpace: 'nowrap' },
      },
    ],
    [intl],
  );

  return (
    <TableHead>
      <TableRow>
        <TableCell
          padding="checkbox"
          key="select"
          style={{ width: '3%', whiteSpace: 'nowrap' }}
          css={classes.headerCell}
        >
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            icon={<BscCheckboxUncheckedIcon />}
            checkedIcon={<BscCheckboxCheckedIcon />}
            indeterminateIcon={<BscCheckboxIndeterminateIcon />}
            inputProps={{ 'aria-label': 'select all desserts' }}
            sx={checkboxBscCmbSx}
          />
        </TableCell>

        {headCells.map((headCell) => {
          return (
            <TableCell
              key={headCell.id}
              sortDirection={orderBy === headCell.id ? order : false}
              style={headCell.style}
              css={classes.headerCell}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}

                {orderBy === headCell.id && (
                  <span css={classes.visuallyHidden as Interpolation<Theme>}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                )}
              </TableSortLabel>
            </TableCell>
          );
        })}

        <TableCell padding="checkbox" key="starred" css={classes.headerCell} style={{ width: '5%', whiteSpace: 'nowrap' }}>
          <TableSortLabel active={false} hideSortIcon>
            즐겨찾기
          </TableSortLabel>
        </TableCell>
        <TableCell padding="checkbox" key="action" css={classes.headerCell} style={{ width: '5%', whiteSpace: 'nowrap' }}>
        <TableSortLabel active={false} hideSortIcon>
            더보기
          </TableSortLabel>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

type ActionPanelState = {
  el: HTMLElement | undefined;
  mapId: number;
};

export type Filter = GenericFilter | LabelFilter;

export interface GenericFilter {
  type: 'public' | 'all' | 'starred' | 'shared' | 'label' | 'owned';
}

export interface LabelFilter {
  type: 'label';
  label: Label;
}

interface MapsListProps {}

const isLabelFilter = (filter: Filter): filter is LabelFilter => filter.type === 'label';

const mapsFilter = (filter: Filter, search: string): ((mapInfo: MapInfo) => boolean) => {
  return (mapInfo: MapInfo) => {
    // Check for filter condition
    let result = false;
    switch (filter.type) {
      case 'all':
        result = true;
        break;
      case 'starred':
        result = mapInfo.starred;
        break;
      case 'owned':
        result = mapInfo.role == 'owner';
        break;
      case 'shared':
        result = mapInfo.role != 'owner';
        break;
      case 'label':
        result =
          !mapInfo.labels ||
          mapInfo.labels.some((label) => label.id === (filter as LabelFilter).label.id);
        break;
      case 'public':
        result = mapInfo.public;
        break;
      default:
        result = false;
    }

    // Does it match search filter criteria...
    if (search && result) {
      result = mapInfo.title.toLowerCase().indexOf(search.toLowerCase()) != -1;
    }

    return result;
  };
};

export type ChangeLabelMutationFunctionParam = { maps: MapInfo[]; label: Label; checked: boolean };

export const getChangeLabelMutationFunction =
  (client: Client) =>
  async ({ maps, label, checked }: ChangeLabelMutationFunctionParam): Promise<void> => {
    if (!label.id) {
      label.id = await client.createLabel(label.title, label.color);
    }
    if (checked) {
      const toAdd = maps.filter((m) => !m.labels.find((l) => l.id === label.id));
      await Promise.all(toAdd.map((m) => client.addLabelToMap(label.id, m.id)));
    } else {
      const toRemove = maps.filter((m) => m.labels.find((l) => l.id === label.id));
      await Promise.all(toRemove.map((m) => client.deleteLabelFromMap(label.id, m.id)));
    }
    return Promise.resolve();
  };

export const MapsList = (_props: MapsListProps): React.ReactElement => {
  const classes = useStyles();
  const [order, setOrder] = React.useState<Order>('desc');
  const [filter, setFilter] = React.useState<Filter>({ type: 'all' });
  const [labelToDelete, setLabelToDelete] = React.useState<number | null>(null);
  const [labelsMenuAnchor, setLabelsMenuAnchor] = React.useState<null | HTMLElement>(null);

  const [orderBy, setOrderBy] = React.useState<keyof MapInfo>('lastModificationTime');
  const [selected, setSelected] = React.useState<number[]>([]);
  const [searchCondition, setSearchCondition] = React.useState<string>('');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const client = useContext(ClientContext);
  const intl = useIntl();
  const queryClient = useQueryClient();

  const { data: labelsData = [] } = useQuery<unknown, ErrorInfo, Label[]>('labels', () =>
    client.fetchLabels(),
  );
  const labels: Label[] = labelsData;
  const deleteLabelMutation = useMutation((id: number) => client.deleteLabel(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('labels');
      queryClient.invalidateQueries('maps');
    },
    onError: (error) => {
      console.error(error);
    },
  });
  const handleMenuClick = (newFilter: Filter) => {
    queryClient.invalidateQueries('maps');
    setFilter(newFilter);
    setLabelsMenuAnchor(null);
  };
  const handleLabelDelete = (id: number) => {
    deleteLabelMutation.mutate(id);
  };
  const mainFilterValue =
    filter.type === 'label' ? null : (filter.type as 'all' | 'owned' | 'starred' | 'shared');
  const labelsMenuOpen = Boolean(labelsMenuAnchor);
  const labelToDeleteObj = labels.find((l) => l.id === labelToDelete);

  const userLocale = AppI18n.getUserLocale();
  useEffect(() => {
    dayjs.locale('ko');
  }, [userLocale.code]);

  const { data: mapsData = [] } = useQuery<unknown, ErrorInfo, MapInfo[]>(
    'maps',
    () => {
      return client.fetchAllMaps();
    },
    { suspense: true },
  );

  const filteredMaps: MapInfo[] = useMemo(() => {
    const predicate = mapsFilter(filter, searchCondition);
    return mapsData.filter(predicate);
  }, [mapsData, filter, searchCondition]);

  const sortedMaps = useMemo(() => {
    return stableSort(filteredMaps, getComparator(order, orderBy));
  }, [filteredMaps, order, orderBy]);

  const pagedMaps = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedMaps.slice(start, start + rowsPerPage);
  }, [sortedMaps, page, rowsPerPage]);

  const [activeRowAction, setActiveRowAction] = React.useState<ActionPanelState | undefined>(
    undefined,
  );

  type ActiveDialog = {
    actionType: ActionType;
    mapsId: number[];
  };

  const [activeDialog, setActiveDialog] = React.useState<ActiveDialog | undefined>(undefined);
  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof MapInfo) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.checked) {
      const newSelecteds = filteredMaps.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleRowClick = (event: React.MouseEvent<unknown>, id: number): void => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionClick = (mapId: number): ((event) => void) => {
    return (event): void => {
      setActiveRowAction({
        mapId: mapId,
        el: event.currentTarget,
      });
      event.preventDefault();
    };
  };

  const starredMultation = useMutation<void, ErrorInfo, number>(
    (id: number) => {
      const map = filteredMaps.find((m) => m.id == id);
      const starred = !map?.starred;

      // Follow a optimistic update approach ...
      queryClient.setQueryData<MapInfo[]>('maps', (currentMaps) => {
        if (map) {
          map.starred = starred;
        }
        return currentMaps || [];
      });
      return client.updateStarred(id, starred);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('maps');
      },
      onError: (error) => {
        queryClient.invalidateQueries('maps');
        console.error(error);
      },
    },
  );

  const handleStarred = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => {
    event.stopPropagation();
    event.preventDefault();
    starredMultation.mutate(id);
  };

  const handleActionMenuClose = (action: ActionType): void => {
    if (action) {
      const mapId = activeRowAction?.mapId;

      setActiveDialog({
        actionType: action as ActionType,
        mapsId: [mapId] as number[],
      });
    }
    setActiveRowAction(undefined);
  };

  const handleOnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCondition(e.target.value);
  };

  const handleDeleteClick = () => {
    trackToolbarAction('delete_selected', `count:${selected.length}`);
    setActiveDialog({
      actionType: 'delete',
      mapsId: selected,
    });
  };

  const handleAddLabelClick = () => {
    trackToolbarAction('add_label_selected', `count:${selected.length}`);
    setActiveDialog({
      actionType: 'label',
      mapsId: selected,
    });
  };

  const removeLabelMultation = useMutation<
    void,
    ErrorInfo,
    { mapId: number; labelId: number },
    number
  >(
    ({ mapId, labelId }) => {
      return client.deleteLabelFromMap(labelId, mapId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('maps');
      },
      onError: (error) => {
        console.error(error);
      },
    },
  );

  const handleRemoveLabel = (mapId: number, labelId: number) => {
    removeLabelMultation.mutate({ mapId, labelId });
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;
  return (
    <div css={classes.root}>
      {activeRowAction?.mapId !== undefined && (
        <ActionChooser
          anchor={activeRowAction?.el}
          onClose={handleActionMenuClose}
          mapId={activeRowAction.mapId}
        />
      )}

      <Paper css={classes.paper} elevation={0}>
        <Box sx={uiPageHeader}>
          <Box sx={uiPageHeaderTop}>
            <Box component="h1" sx={uiPageHeaderTitle}>
              <Box component="span" sx={uiPageHeaderStarIcon} aria-hidden />
              <FormattedMessage id="maps.page-header" defaultMessage="Mind map name" />
            </Box>
            <Box sx={{ flexShrink: 0 }} />
          </Box>
        </Box>
        <Box sx={filterBar} css={classes.filterBarWrapper}>
          <Box sx={filterBarFilters} css={classes.searchContainer as Interpolation<Theme>}>
            <ToggleButtonGroup
              value={mainFilterValue}
              exclusive
              onChange={(_e, value: 'all' | 'owned' | 'starred' | 'shared' | null) => {
                if (value != null) handleMenuClick({ type: value });
              }}
              aria-label="map filter"
              sx={classes.filterButtonGroup}
              size="small"
            >
              <ToggleButton value="all" aria-label="All maps">
                <Tooltip title={intl.formatMessage({ id: 'maps.nav-all', defaultMessage: 'All' })}>
                  <ScatterPlotTwoTone color="secondary" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="owned" aria-label="My maps">
                <Tooltip
                  title={intl.formatMessage({ id: 'maps.nav-onwned', defaultMessage: 'My Maps' })}
                >
                  <PersonOutlineTwoTone color="secondary" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="starred" aria-label="Starred">
                <Tooltip
                  title={intl.formatMessage({ id: 'maps.nav-starred', defaultMessage: 'Starred' })}
                >
                  <StarTwoTone color="secondary" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="shared" aria-label="Shared with me">
                <Tooltip
                  title={intl.formatMessage({
                    id: 'maps.nav-shared',
                    defaultMessage: 'Shared with me',
                  })}
                >
                  <ShareTwoTone color="secondary" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              id="labels-button"
              variant="text"
              disableElevation
              onClick={(e) => setLabelsMenuAnchor(e.currentTarget)}
              endIcon={<ExpandMoreIcon sx={{ color: '#464c53', ml: 0 }} />}
              startIcon={
                <LabelTwoTone
                  sx={{
                    color:
                      filter.type === 'label'
                        ? (filter as LabelFilter).label.color || 'inherit'
                        : 'inherit',
                    mr: 0.5,
                  }}
                />
              }
              css={classes.labelsButton}
              sx={[
                uiSelectSizeMd,
                {
                  '& .MuiButton-endIcon': {
                    position: 'absolute',
                    right: 10,
                    marginLeft: 0,
                  },
                },
              ]}
              aria-controls={labelsMenuOpen ? 'labels-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={labelsMenuOpen ? 'true' : undefined}
            >
              {filter.type === 'label'
                ? (filter as LabelFilter).label.title
                : intl.formatMessage({ id: 'maps.nav-all', defaultMessage: 'All' })}
            </Button>
            <Menu
              id="labels-menu"
              anchorEl={labelsMenuAnchor}
              open={labelsMenuOpen}
              onClose={() => setLabelsMenuAnchor(null)}
              MenuListProps={{ 'aria-labelledby': 'labels-button' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { maxHeight: 320, minWidth: 240 } } }}
            >
              <MenuItem
                selected={filter.type !== 'label'}
                onClick={() => handleMenuClick({ type: 'all' })}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LabelTwoTone color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary={intl.formatMessage({ id: 'maps.nav-all', defaultMessage: 'All' })}
                />
              </MenuItem>
              {labels.length === 0 ? (
                <MenuItem disabled>
                  <ListItemText
                    primary={'라벨이 없습니다.'}
                  />
                </MenuItem>
              ) : (
                labels.map((l) => (
                  <MenuItem
                    key={l.id}
                    selected={filter.type === 'label' && (filter as LabelFilter).label.id === l.id}
                    onClick={() => handleMenuClick({ type: 'label', label: l })}
                    sx={{ pr: 6 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LabelTwoTone style={{ color: l.color ? l.color : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary={l.title} />
                    <IconButton
                      size="small"
                      aria-label={intl.formatMessage({
                        id: 'common.delete',
                        defaultMessage: 'Delete',
                      })}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLabelToDelete(l.id);
                        setLabelsMenuAnchor(null);
                      }}
                      sx={[
                        uiButtonIconOnlyLineSecondary,
                        {
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        },
                      ]}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Box className="search-item" sx={[filterBarItem, { minWidth: 0 }]}>
              <Box component="label" sx={filterBarLabel}>
                <FormattedMessage id="maps.search-label" defaultMessage="Mind map name" />
              </Box>
              <InputBase
                placeholder={intl.formatMessage({
                  id: 'maps.search-action',
                  defaultMessage: 'Search ...',
                })}
                sx={[uiInputSizeMd, { minWidth: 200, flex: 1 }]}
                inputProps={{ 'aria-label': 'search' }}
                onChange={handleOnSearchChange}
              />
            </Box>

          </Box>

          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip
              arrow={true}
              title={'신규 맵 생성'}
            >
              <Button
                data-testid="create"
                variant="outlined"
                type="button"
                disableElevation={true}
                sx={uiButtonTypeLineSecondarySizeMd}
                onClick={() => setActiveDialog({ actionType: 'create', mapsId: [] })}
              >
                <span className="message">
                  <FormattedMessage id="action.new" defaultMessage="???" />
                </span>
              </Button>
            </Tooltip>
            <Tooltip
              arrow={true}
              title={'선택된 맵에 라벨 추가'}
            >
              <Button
                variant="outlined"
                type="button"
                disableElevation={true}
                sx={uiButtonTypeLineSecondarySizeMd}
                disabled={selected.length === 0}
                onClick={handleAddLabelClick}
              >
                <span className="button-text">
                  라벨 추가
                </span>
              </Button>
            </Tooltip>
            <Tooltip
              arrow={true}
              title={'선택된 맵 삭제'}
            >
              <span>
                <Button
                  variant="contained"
                  type="button"
                  disableElevation={true}
                  disabled={selected.length === 0}
                  sx={uiButtonTypeSecondarySizeMd}
                  onClick={handleDeleteClick}
                >
                  <span className="button-text">
                    삭제
                  </span>
                </Button>
              </span>
            </Tooltip>
            {/* <ThemeToggleButton /> */}
            {/* Pagination on desktop */}
            {filteredMaps.length > rowsPerPage && (
              <Box css={classes.paginationDesktop as Interpolation<Theme>}>
                <TablePagination
                  css={classes.tablePagination as Interpolation<Theme>}
                  count={filteredMaps.length}
                  rowsPerPageOptions={[]}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                />
              </Box>
            )}
          </Box>
        </Box>


        <TableContainer css={classes.tableContainer as Interpolation<Theme>}>
          <Box css={classes.cards}>
            {filteredMaps.length === 0 ? (
              <Card>
                <CardContent>
                  <FormattedMessage
                    id="maps.empty-result"
                    defaultMessage="No matching mindmap found with the current filter criteria."
                  />
                </CardContent>
              </Card>
            ) : (
              pagedMaps.map((row: MapInfo) => {
                return (
                  <Card key={row.id} css={{ maxWidth: '94vw', margin: '3vw' }}>
                    <Link
                      href={`/c/maps/${row.id}/edit`}
                      underline="none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CardHeader
                        css={classes.cardHeader}
                        avatar={
                          <Tooltip
                            arrow={true}
                            title={intl.formatMessage({
                              id: 'maps.tooltip-starred',
                              defaultMessage: 'Starred',
                            })}
                          >
                            <div className="hola" onClick={(e) => e.stopPropagation()}>
                              <IconButton size="small" onClick={(e) => handleStarred(e, row.id)}>
                                <StarRateRoundedIcon
                                  color="action"
                                  style={{
                                    color: row.starred ? 'yellow' : 'gray',
                                  }}
                                />
                              </IconButton>
                            </div>
                          </Tooltip>
                        }
                        action={
                          <Tooltip
                            arrow={true}
                            title={intl.formatMessage({
                              id: 'map.more-actions',
                              defaultMessage: 'More Actions',
                            })}
                          >
                            <IconButton
                              aria-label={intl.formatMessage({
                                id: 'common.settings',
                                defaultMessage: 'Settings',
                              })}
                              onClick={handleActionClick(row.id)}
                            >
                              <MoreVertIcon color="action" />
                            </IconButton>
                          </Tooltip>
                        }
                        title={
                          <Typography
                            css={classes.cardTitle}
                            noWrap
                            color="text.secondary"
                            sx={{
                              fontSize: '14px',
                              fontWeight: '500',
                              fontFamily:
                                '"Pretendard", sans-serif',
                            }}
                          >
                            {row.title}
                          </Typography>
                        }
                        subheader={
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontSize: '0.75rem',
                              fontFamily:
                                '"Pretendard", sans-serif',
                            }}
                          >
                            {intl.formatMessage({
                              id: 'map.last-update',
                              defaultMessage: 'Last Update',
                            })}
                            <span>: </span>
                            <Tooltip
                              arrow={true}
                              title={intl.formatMessage(
                                {
                                  id: 'maps.modified-by-desc',
                                  defaultMessage: 'Modified by {by} on {on}',
                                },
                                {
                                  by: row.lastModificationBy,
                                  on: dayjs(row.lastModificationTime).format('lll'),
                                },
                              )}
                              placement="bottom-start"
                            >
                              <span>{dayjs(row.lastModificationTime).fromNow()}</span>
                            </Tooltip>
                          </Typography>
                        }
                      />
                    </Link>
                  </Card>
                );
              })
            )}
          </Box>
          <Table css={classes.table} size="small" stickyHeader>
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={filteredMaps.length}
            />

            <TableBody>
              {filteredMaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center' }}>
                    <FormattedMessage
                      id="maps.empty-result"
                      defaultMessage="No matching mindmap found with the current filter criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pagedMaps.map((row: MapInfo) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = row.id;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleRowClick(event, row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox" css={classes.bodyCell} style={{ width: '3%' }}>
                        <Checkbox
                          checked={isItemSelected}
                          icon={<BscCheckboxUncheckedIcon />}
                          checkedIcon={<BscCheckboxCheckedIcon />}
                          inputProps={{
                            'aria-labelledby': String(labelId),
                          }}
                          sx={checkboxBscCmbSx}
                        />
                      </TableCell>

                      <TableCell css={[classes.bodyCell, classes.bodyCellLeft as CSSObject]}>
                        <Tooltip
                          arrow={true}
                          title={`${row.title} 마인드맵 수정하기`}
                          placement="bottom-start"
                        >
                          <Link
                            href={`/c/maps/${row.id}/edit`}
                            color="textPrimary"
                            underline="always"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              fontSize: '14px',
                              fontWeight: '500',
                              fontFamily:
                                '"Pretendard", sans-serif',
                            }}
                          >
                            {row.title}
                          </Link>
                        </Tooltip>
                      </TableCell>

                      <TableCell css={[classes.bodyCell, classes.labelsCell as CSSObject]}>
                        <LabelsCell
                          labels={row.labels}
                          onDelete={(lbl) => {
                            handleRemoveLabel(row.id, lbl.id);
                          }}
                        />
                      </TableCell>

                      <TableCell css={classes.bodyCell}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily:
                              '"Pretendard", sans-serif',
                          }}
                        >
                          {row.createdBy}
                        </Typography>
                      </TableCell>

                      <TableCell css={classes.bodyCell}>
                        <Tooltip
                          arrow={true}
                          title={`'${row.lastModificationBy}'님에 의해 ${dayjs(row.lastModificationTime).format('lll')}에 수정됨`}
                          placement="bottom-start"
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: '500',
                              fontFamily:
                                '"Pretendard", sans-serif',
                            }}
                          >
                            {dayjs(row.lastModificationTime).fromNow()}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell padding="checkbox" css={classes.bodyCell}>
                        <Tooltip
                          arrow={true}
                          title={`${row.starred ? '즐겨찾기 해제' : '즐겨찾기 설정'}`}
                        >
                          <IconButton size="small" onClick={(e) => handleStarred(e, row.id)}>
                            <StarRateRoundedIcon
                              color="action"
                              style={{
                                color: row.starred ? 'yellow' : 'gray',
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      <TableCell css={classes.bodyCell}>
                        <Tooltip
                          arrow={true}
                          title='더 많은 옵션 보기'
                        >
                          <IconButton
                            aria-label={intl.formatMessage({
                              id: 'common.others',
                              defaultMessage: 'Others',
                            })}
                            size="small"
                            onClick={handleActionClick(row.id)}
                          >
                            <MoreHorizIcon color="action" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination on mobile only - below table */}
        {filteredMaps.length > rowsPerPage && (
          <Box css={classes.paginationMobile as Interpolation<Theme>}>
            <TablePagination
              css={classes.tablePagination as Interpolation<Theme>}
              count={filteredMaps.length}
              rowsPerPageOptions={[]}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              component="div"
            />
          </Box>
        )}
      </Paper>

      <ActionDispatcher
        action={activeDialog?.actionType}
        onClose={(success) => {
          setActiveDialog(undefined);
          if (success) {
            setSelected([]);
          }
        }}
        mapsId={activeDialog ? activeDialog.mapsId : []}
        fromEditor
      />
      {labelToDeleteObj && labelToDelete != null && (
        <LabelDeleteConfirm
          onClose={() => setLabelToDelete(null)}
          onConfirm={() => {
            handleLabelDelete(labelToDelete);
            setLabelToDelete(null);
          }}
          label={labelToDeleteObj}
        />
      )}
    </div>
  );
};
