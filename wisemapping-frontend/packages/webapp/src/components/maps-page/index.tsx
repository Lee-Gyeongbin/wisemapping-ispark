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
import React, { ErrorInfo, ReactElement, useContext, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import { useStyles } from './style';
import { MapsList } from './maps-list';
import { createIntl, createIntlCache, FormattedMessage, IntlProvider, useIntl } from 'react-intl';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Label } from '../../classes/client';
import ActionDispatcher from './action-dispatcher';
import { ActionType } from './action-chooser';
import ThemeToggleButton from '../common/theme-toggle-button';
import AppI18n, { Locales } from '../../classes/app-i18n';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import AddCircleTwoTone from '@mui/icons-material/AddCircleTwoTone';
import ClearIcon from '@mui/icons-material/Clear';
import LabelTwoTone from '@mui/icons-material/LabelTwoTone';
import PersonOutlineTwoTone from '@mui/icons-material/PersonOutlineTwoTone';
import ScatterPlotTwoTone from '@mui/icons-material/ScatterPlotTwoTone';
import ShareTwoTone from '@mui/icons-material/ShareTwoTone';
import StarTwoTone from '@mui/icons-material/StarTwoTone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import LabelDeleteConfirm from './maps-list/label-delete-confirm';
import { trackPageView } from '../../utils/analytics';
import { Interpolation, Theme } from '@emotion/react';
import { ClientContext } from '../../classes/provider/client-context';
import { SEOHead } from '../seo';

export type Filter = GenericFilter | LabelFilter;

export interface GenericFilter {
  type: 'public' | 'all' | 'starred' | 'shared' | 'label' | 'owned';
}

export interface LabelFilter {
  type: 'label';
  label: Label;
}

const MapsPage = (): ReactElement => {
  const [filter, setFilter] = React.useState<Filter>({ type: 'all' });
  const client = useContext(ClientContext);
  const queryClient = useQueryClient();
  const [activeDialog, setActiveDialog] = React.useState<ActionType | undefined>(undefined);
  const [labelToDelete, setLabelToDelete] = React.useState<number | null>(null);
  const [labelsMenuAnchor, setLabelsMenuAnchor] = React.useState<null | HTMLElement>(null);
  const classes = useStyles();

  const getIconColor = () => undefined;

  // Reload based on user preference ...
  const userLocale = AppI18n.getUserLocale();

  const cache = createIntlCache();
  const intl = createIntl(
    {
      defaultLocale: userLocale.code,
      locale: Locales.EN.code,
      messages: userLocale.message,
    },
    cache,
  );

  useEffect(() => {
    document.title = intl.formatMessage({
      id: 'maps.page-title',
      defaultMessage: 'My Maps | WiseMapping',
    });
    window.scrollTo(0, 0);
    trackPageView(window.location.pathname, 'Maps List');
  }, []);

  const mutation = useMutation((id: number) => client.deleteLabel(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('labels');
      queryClient.invalidateQueries('maps');
    },
    onError: (error) => {
      console.error(`Unexpected error ${error}`);
    },
  });

  const handleMenuClick = (filter: Filter) => {
    queryClient.invalidateQueries('maps');
    setFilter(filter);
    setLabelsMenuAnchor(null);
  };

  const handleLabelDelete = (id: number) => {
    mutation.mutate(id);
  };

  const { data } = useQuery<unknown, ErrorInfo, Label[]>('labels', () => {
    return client.fetchLabels();
  });

  const labels: Label[] = data ? data : [];

  const mainFilterValue =
    filter.type === 'label' ? null : (filter.type as 'all' | 'owned' | 'starred' | 'shared');
  const labelsMenuOpen = Boolean(labelsMenuAnchor);
  const label: Label | undefined = labels.find((l) => l.id === labelToDelete);
  return (
    <IntlProvider
      locale={userLocale.code}
      defaultLocale={Locales.EN.code}
      messages={userLocale.message}
    >
      <SEOHead
        title="My Maps | WiseMapping"
        description="Access and manage your mind maps in WiseMapping. Create, edit, share, and collaborate on your visual thinking projects. Organize your ideas with our powerful mind mapping tool."
        keywords="my maps, mind maps, visual thinking, collaboration, organize ideas, brainstorming, project management"
        canonicalUrl="/c/maps/"
        ogType="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'My Maps - WiseMapping',
          description:
            'Access and manage your mind maps in WiseMapping. Create, edit, share, and collaborate on your visual thinking projects.',
          url: 'https://www.wisemapping.com/c/maps/',
          mainEntity: {
            '@type': 'WebApplication',
            name: 'WiseMapping',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Web Browser',
          },
        }}
      />
      <div css={classes.root}>
        <AppBar
          position="fixed"
          css={[classes.appBar, classes.appBarShift]}
          variant="outlined"
          elevation={0}
          component="header"
        >
          <Toolbar role="banner" css={classes.toolbarContent}>
            {/* Filter: All, My Maps, Starred, Shared */}
            <ToggleButtonGroup
              value={mainFilterValue}
              exclusive
              onChange={(_e, value: 'all' | 'owned' | 'starred' | 'shared' | null) => {
                if (value != null) handleMenuClick({ type: value });
              }}
              aria-label="map filter"
              css={classes.filterButtonGroup}
              size="small"
            >
              <ToggleButton value="all" aria-label="All maps">
                <Tooltip title={intl.formatMessage({ id: 'maps.nav-all', defaultMessage: 'All' })}>
                  <ScatterPlotTwoTone
                    htmlColor={getIconColor()}
                    color={getIconColor() ? undefined : 'secondary'}
                  />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="owned" aria-label="My maps">
                <Tooltip
                  title={intl.formatMessage({ id: 'maps.nav-onwned', defaultMessage: 'My Maps' })}
                >
                  <PersonOutlineTwoTone
                    htmlColor={getIconColor()}
                    color={getIconColor() ? undefined : 'secondary'}
                  />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="starred" aria-label="Starred">
                <Tooltip
                  title={intl.formatMessage({ id: 'maps.nav-starred', defaultMessage: 'Starred' })}
                >
                  <StarTwoTone
                    htmlColor={getIconColor()}
                    color={getIconColor() ? undefined : 'secondary'}
                  />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="shared" aria-label="Shared with me">
                <Tooltip
                  title={intl.formatMessage({
                    id: 'maps.nav-shared',
                    defaultMessage: 'Shared with me',
                  })}
                >
                  <ShareTwoTone
                    htmlColor={getIconColor()}
                    color={getIconColor() ? undefined : 'secondary'}
                  />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Labels dropdown */}
            <Button
              id="labels-button"
              size="small"
              variant={filter.type === 'label' ? 'contained' : 'outlined'}
              onClick={(e) => setLabelsMenuAnchor(e.currentTarget)}
              endIcon={<ExpandMoreIcon />}
              startIcon={<LabelTwoTone />}
              css={classes.labelsButton}
              aria-controls={labelsMenuOpen ? 'labels-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={labelsMenuOpen ? 'true' : undefined}
            >
              {filter.type === 'label'
                ? (filter as LabelFilter).label.title
                : intl.formatMessage({ id: 'maps.nav-labels', defaultMessage: 'Labels' })}
            </Button>
            <Menu
              id="labels-menu"
              anchorEl={labelsMenuAnchor}
              open={labelsMenuOpen}
              onClose={() => setLabelsMenuAnchor(null)}
              MenuListProps={{ 'aria-labelledby': 'labels-button' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { maxHeight: 320 } } }}
            >
              {labels.length === 0 ? (
                <MenuItem disabled>
                  <ListItemText
                    primary={intl.formatMessage({
                      id: 'maps.no-labels',
                      defaultMessage: 'No labels',
                    })}
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
                      aria-label={intl.formatMessage({ id: 'common.delete', defaultMessage: 'Delete' })}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLabelToDelete(l.id);
                        setLabelsMenuAnchor(null);
                      }}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Box component="span" css={classes.toolbarSpacer} />

            <Tooltip
              arrow={true}
              title={intl.formatMessage({
                id: 'maps.create-tooltip',
                defaultMessage: 'Create a new mindmap',
              })}
            >
              <Button
                color="primary"
                data-testid="create"
                size="medium"
                variant="contained"
                type="button"
                disableElevation={true}
                startIcon={<AddCircleTwoTone />}
                css={classes.newMapButton}
                onClick={() => setActiveDialog('create')}
              >
                <span className="message">
                  <FormattedMessage id="action.new" defaultMessage="New map" />
                </span>
              </Button>
            </Tooltip>

            {/* AI Copilot 버튼 제거됨 */}
            {/*
            <Tooltip
              arrow={true}
              title={intl.formatMessage({
                id: 'maps.copilot-tooltip',
                defaultMessage: 'Start a mindmap with ChatGPT-powered AI Copilot',
              })}
            >
              <Button
                color="primary"
                size="medium"
                variant="outlined"
                type="button"
                disableElevation={true}
                startIcon={<SmartToyTwoTone />}
                css={classes.copilotButton}
                onClick={handleMindMapCopilotDialogOpen}
              >
                <span className="message">
                  <FormattedMessage id="maps.copilot-button" defaultMessage="AI Copilot" />
                </span>
              </Button>
            </Tooltip>
            */}

            {/* Import 버튼 임시 비활성화 */}
            {/*
            <Tooltip
              arrow={true}
              title={intl.formatMessage({
                id: 'maps.import-desc',
                defaultMessage: 'Import from other tools',
              })}
            >
              <Button
                color="primary"
                size="medium"
                variant="outlined"
                type="button"
                disableElevation={true}
                startIcon={<CloudUploadTwoTone />}
                css={classes.importButton}
                onClick={() => setActiveDialog('import')}
              >
                <span className="message">
                  <FormattedMessage id="action.import" defaultMessage="Import" />
                </span>
              </Button>
            </Tooltip>
            */}
            <ActionDispatcher
              action={activeDialog}
              onClose={() => setActiveDialog(undefined)}
              mapsId={[]}
              fromEditor
            />

            <div css={classes.rightButtonGroup as Interpolation<Theme>}>
              <ThemeToggleButton />
            </div>
          </Toolbar>
        </AppBar>
        <main css={classes.content} role="main">
          <div css={classes.toolbar} />
          <section
            aria-label={intl.formatMessage({ id: 'common.maps-list', defaultMessage: 'Maps list' })}
          >
            <MapsList filter={filter} />
          </section>
        </main>

        {/* Floating Help Button */}
        {/* <Box
          sx={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <HelpMenu />
        </Box> */}
      </div>
      {label && labelToDelete != null && (
        <LabelDeleteConfirm
          onClose={() => setLabelToDelete(null)}
          onConfirm={() => {
            handleLabelDelete(labelToDelete);
            setLabelToDelete(null);
          }}
          label={label}
        />
      )}
    </IntlProvider>
  );
};

export default MapsPage;
