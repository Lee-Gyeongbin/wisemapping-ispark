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
import Client, { ErrorInfo, MapInfo } from '../../../classes/client';
import ActionChooser, { ActionType } from '../action-chooser';
import ActionDispatcher from '../action-dispatcher';
import ThemeToggleButton from '../../common/theme-toggle-button';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import relativeTime from 'dayjs/plugin/relativeTime';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ko';
import AppI18n from '../../../classes/app-i18n';
import ScatterPlotTwoTone from '@mui/icons-material/ScatterPlotTwoTone';
import PersonOutlineTwoTone from '@mui/icons-material/PersonOutlineTwoTone';
import ShareTwoTone from '@mui/icons-material/ShareTwoTone';
import StarTwoTone from '@mui/icons-material/StarTwoTone';
import { CSSObject, Interpolation, Theme } from '@emotion/react';
import RoleIcon from '../role-icon';
import Box from '@mui/material/Box';
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
} from '../../../theme/ui-button-styles';
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

function getComparator(
  order: Order,
  orderBy: keyof MapInfo,
): (a: MapInfo, b: MapInfo) => number {
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
        style: { width: '25%', whiteSpace: 'nowrap' },
      },
      {
        id: 'description',
        numeric: false,
        label: '설명',
        style: { width: '20%', whiteSpace: 'nowrap' },
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

        <TableCell
          key="rowNumber"
          style={{ width: '3%', whiteSpace: 'nowrap' }}
          css={classes.headerCell}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: '"Pretendard", sans-serif',
            }}
          >
            {'No'}
          </Typography>
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

        <TableCell padding="checkbox" key="collaboration" css={classes.headerCell} style={{ width: '8%', whiteSpace: 'nowrap' }}>
          <TableSortLabel active={false} hideSortIcon>
            협업/권한
          </TableSortLabel>
        </TableCell>
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

export type Filter = GenericFilter;

export interface GenericFilter {
  type: 'public' | 'all' | 'starred' | 'shared' | 'owned';
}

interface MapsListProps {}

const mapsFilter = (filter: Filter, search: string): ((mapInfo: MapInfo) => boolean) => {
  return (mapInfo: MapInfo) => {
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
      case 'public':
        result = mapInfo.public;
        break;
      default:
        result = false;
    }

    if (search && result) {
      result = mapInfo.title.toLowerCase().indexOf(search.toLowerCase()) != -1;
    }

    return result;
  };
};

export const MapsList = (_props: MapsListProps): React.ReactElement => {
  const classes = useStyles();
  const [order, setOrder] = React.useState<Order>('desc');
  const [filter, setFilter] = React.useState<Filter>({ type: 'all' });

  const [orderBy, setOrderBy] = React.useState<keyof MapInfo>('lastModificationTime');
  const [selected, setSelected] = React.useState<number[]>([]);
  const [searchCondition, setSearchCondition] = React.useState<string>('');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const client = useContext(ClientContext);
  const intl = useIntl();
  const queryClient = useQueryClient();

  const handleMenuClick = (newFilter: Filter) => {
    queryClient.invalidateQueries('maps');
    setFilter(newFilter);
  };
  const mainFilterValue = filter.type as 'all' | 'owned' | 'starred' | 'shared';

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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'wisemapping-list-loaded' }, '*');
    }
  }, [mapsData]);

  const filteredMaps: MapInfo[] = useMemo(() => {
    const predicate = mapsFilter(filter, searchCondition);
    return mapsData.filter(predicate);
  }, [mapsData, filter, searchCondition]);

  const sortedMaps = useMemo(() => {
    return stableSort(filteredMaps, getComparator(order, orderBy));
  }, [filteredMaps, order, orderBy]);

  // 최종 수정(asc) 기준으로 정렬한 목록 (번호 계산용 - 역순)
  const sortedMapsByLastModAsc = useMemo(() => {
    return stableSort(filteredMaps, getComparator('asc', 'lastModificationTime'));
  }, [filteredMaps]);

  const pagedMaps = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedMaps.slice(start, start + rowsPerPage);
  }, [sortedMaps, page, rowsPerPage]);

  // 페이징 계산
  const totalPages = Math.ceil(filteredMaps.length / rowsPerPage);
  const pagesPerGroup = 5; // 한 그룹에 표시할 페이지 수
  const currentGroup = Math.floor(page / pagesPerGroup);
  const startPage = currentGroup * pagesPerGroup;
  const endPage = Math.min(startPage + pagesPerGroup, totalPages);
  const displayPages = Array.from({ length: endPage - startPage }, (_, i) => startPage + i + 1);
  const prevGroupPage = startPage > 0 ? startPage : null;
  const nextGroupPage = endPage < totalPages ? endPage + 1 : null;

  const handleGoToPrevGroup = () => {
    if (prevGroupPage !== null) {
      setPage(prevGroupPage - 1);
    }
  };

  const handleGoToNextGroup = () => {
    if (nextGroupPage !== null) {
      setPage(nextGroupPage - 1);
    }
  };

  const handlePageClick = (newPage: number) => {
    setPage(newPage - 1);
  };

  const [activeRowAction, setActiveRowAction] = React.useState<ActionPanelState | undefined>(
    undefined,
  );

  type ActiveDialog = {
    actionType: ActionType;
    mapsId: number[];
  };

  const [activeDialog, setActiveDialog] = React.useState<ActiveDialog | undefined>(undefined);

  const handleEditMapClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'wisemapping-show-loading' }, '*');
    }
  };

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
                  title={'협업 맵'}
                >
                  <ShareTwoTone color="secondary" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

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
          </Box>
        </Box>


        <Box
          css={{
            minHeight: '600px',
          }}
        >
          <TableContainer css={classes.tableContainer as Interpolation<Theme>}>
          <Box css={classes.cards}>
            {filteredMaps.length === 0 ? (
              <Card>
                <CardContent> 
                  {'조회된 결과가 없습니다.'}
                </CardContent>
              </Card>
            ) : (
              pagedMaps.map((row: MapInfo) => {
                return (
                  <Card key={row.id} css={{ maxWidth: '94vw', margin: '3vw' }}>
                    <Link
                      href={`/c/maps/${row.id}/edit`}
                      underline="none"
                      onClick={handleEditMapClick}
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
                                    color: row.starred ? '#FFB800' : 'gray',
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
                              <span>{dayjs(row.lastModificationTime).format('YYYY-MM-DD HH:mm')}</span>
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
                  <TableCell colSpan={9} style={{ textAlign: 'center' }}>
                    {'조회된 결과가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                pagedMaps.map((row: MapInfo, index: number) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = row.id;
                  // 최종 수정(asc) 기준으로 전체 정렬된 목록에서의 번호 계산 (역순)
                  const rowNumber = sortedMapsByLastModAsc.findIndex((m) => m.id === row.id) + 1;

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

                      <TableCell css={classes.bodyCell} style={{ width: '3%' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily: '"Pretendard", sans-serif',
                          }}
                        >
                          {rowNumber}
                        </Typography>
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
                            onClick={handleEditMapClick}
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

                      <TableCell
                        css={[classes.bodyCell, classes.descriptionCell as CSSObject]}
                        title={row.description || ''}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily: '"Pretendard", sans-serif',
                          }}
                        >
                          {row.description || '-'}
                        </Typography>
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
                            {dayjs(row.lastModificationTime).format('YYYY-MM-DD HH:mm')}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell css={classes.bodyCell} style={{ width: '8%' }}>
                        {row.role === 'owner' ? (
                          row.collaboratorCount && row.collaboratorCount > 0 ? (
                            <Tooltip 
                              arrow={true} 
                              title={`${row.collaboratorCount}명과 공유 중`}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShareTwoTone color="primary" />
                              </Box>
                            </Tooltip>
                          ) : null
                        ) : row.role === 'editor' || row.role === 'viewer' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RoleIcon role={row.role} />
                          </Box>
                        ) : null}
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
                                color: row.starred ? '#FFB800' : 'gray',
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
        </Box>

        {/* Pagination below table */}
        {filteredMaps.length > rowsPerPage && totalPages > 0 && (
          <Box
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: '8px',
              padding: '12px 0',
              marginBottom: '12px',
            }}
          >
            <Button
              type="button"
              onClick={handleGoToPrevGroup}
              disabled={prevGroupPage === null}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'auto',
                height: '32px',
                padding: '0 10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#464c53',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Pretendard", sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.5,
                gap: '4px',
                paddingLeft: '4px',
                paddingRight: '8px',
                '&:hover:not(:disabled)': {
                  backgroundColor: '#f0f2ff',
                  color: '#5d5dc4',
                },
                '&:disabled': {
                  backgroundColor: 'transparent',
                  color: '#b1b8be',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                },
                '& .MuiSvgIcon-root': {
                  width: '20px',
                  height: '20px',
                },
                '& span': {
                  fontSize: '17px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                },
              }}
            >
              <ChevronLeftIcon />
              <span>이전</span>
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                margin: '0 4px',
              }}
            >
              {displayPages.map((pageNum) => (
                <Button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageClick(pageNum)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    height: '32px',
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: page === pageNum - 1 ? '#2e3484' : 'transparent',
                    color: page === pageNum - 1 ? '#fff' : '#464c53',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Pretendard", sans-serif',
                    fontSize: '14px',
                    fontWeight: page === pageNum - 1 ? 700 : 400,
                    lineHeight: 1.5,
                    '&:hover:not(:disabled)': {
                      backgroundColor: page === pageNum - 1 ? '#3b43aa' : '#f0f2ff',
                      color: page === pageNum - 1 ? '#fff' : '#5d5dc4',
                    },
                  }}
                >
                  {pageNum}
                </Button>
              ))}
            </Box>

            <Button
              type="button"
              onClick={handleGoToNextGroup}
              disabled={nextGroupPage === null}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'auto',
                height: '32px',
                padding: '0 10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#464c53',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Pretendard", sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.5,
                gap: '4px',
                paddingLeft: '4px',
                paddingRight: '8px',
                '&:hover:not(:disabled)': {
                  backgroundColor: '#f0f2ff',
                  color: '#5d5dc4',
                },
                '&:disabled': {
                  backgroundColor: 'transparent',
                  color: '#b1b8be',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                },
                '& .MuiSvgIcon-root': {
                  width: '20px',
                  height: '20px',
                },
                '& span': {
                  fontSize: '17px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                },
              }}
            >
              <span>다음</span>
              <ChevronRightIcon />
            </Button>
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
    </div>
  );
};
