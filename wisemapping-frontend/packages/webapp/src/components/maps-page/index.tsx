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
import React, { ReactElement, useEffect } from 'react';
import { useStyles } from './style';
import { MapsList } from './maps-list';
import { createIntl, createIntlCache, IntlProvider, useIntl } from 'react-intl';
import AppI18n, { Locales } from '../../classes/app-i18n';
import { trackPageView } from '../../utils/analytics';
import { SEOHead } from '../seo';

export type { Filter } from './maps-list';

const MapsPage = (): ReactElement => {
  const classes = useStyles();
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
        <main css={classes.content} role="main">
          <section
            aria-label={intl.formatMessage({ id: 'common.maps-list', defaultMessage: 'Maps list' })}
          >
            <MapsList />
          </section>
        </main>
      </div>
    </IntlProvider>
  );
};

export default MapsPage;
