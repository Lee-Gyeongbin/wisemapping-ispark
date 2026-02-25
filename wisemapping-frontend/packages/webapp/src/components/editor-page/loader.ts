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

import { ErrorInfo, MapMetadata } from '../../classes/client';
import type { EditorRenderMode } from '@wisemapping/mindplot';
import AppConfig from '../../classes/app-config';
import queryClient from '../../queryClient';
import Client from '../../classes/client';
import { createJsonResponse } from '../../utils/response';

export type EditorMetadata = {
  editorMode: EditorRenderMode;
  mapMetadata: MapMetadata;
  zoom: number;
  bootstrapXML?: string; // Bootstrap XML to use instead of fetching from server
};

export type PageModeType = 'edit' | 'try' | 'view-public' | 'view-private';

/**
 * Fetches map metadata using React Query cache.
 * Will return cached data if available and not stale, otherwise fetches from API.
 * @param mapId - The ID of the map to fetch metadata for
 * @param client - The client instance to use for fetching
 * @param includeXml - Whether to include XML in the metadata response
 * @returns Promise resolving to MapMetadata
 */
async function fetchMapMetadataWithCache(
  mapId: number,
  client: Client,
  includeXml = false,
): Promise<MapMetadata> {
  const cacheKey = includeXml ? `maps-metadata-xml-${mapId}` : `maps-metadata-${mapId}`;
  return queryClient.fetchQuery<unknown, ErrorInfo, MapMetadata>(cacheKey, () =>
    client.fetchMapMetadata(mapId, includeXml),
  );
}

const isErrorInfo = (error: unknown): error is ErrorInfo =>
  typeof error === 'object' &&
  error !== null &&
  ('msg' in error || 'isAuth' in error || 'fields' in error || 'status' in error);

const PUBLIC_MAP_REMOVED_MESSAGE = 'The map you are looking for is no longer available.';

export const loader = (pageMode: PageModeType, bootstrap = false) => {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return async ({ params, request }): Promise<Response> => {
    const client = AppConfig.getClient();
    let result: Response | undefined;

    // loader에서는 자동 로그인을 시도하지 않음 (CommonPage에서 처리)
    // 여기서는 맵 메타데이터만 로드

    // Validate that params.id exists and is a valid number
    if (!params.id || params.id === 'undefined') {
      return new Response('Map ID is required', {
        status: 400,
        statusText: 'Bad Request',
      });
    }

    const mapId = Number.parseInt(params.id, 10);
    if (Number.isNaN(mapId)) {
      return new Response('Invalid map ID', {
        status: 400,
        statusText: 'Bad Request',
      });
    }

    switch (pageMode) {
      case 'try': {
        const value = await Promise.resolve({
          editorMode: 'showcase',
          mapMetadata: {
            id: mapId,
            title: 'What is WiseMapping ?',
            creatorFullName: 'Paulo Gustavo Veiga',
            isLocked: false,
            jsonProps: '{ "zoom": 0.8 }',
            role: 'owner' as const,
          },
          zoom: 0.8,
        });
        result = createJsonResponse(value);
        break;
      }
      case 'edit': {
        try {
          const mapMetadata = await fetchMapMetadataWithCache(mapId, client, bootstrap);

          let editorMode: EditorRenderMode;
          // 편집하기 버튼 클릭으로 진입한 경우( requestEdit=Y ) role 기반 편집 모드, 아니면 뷰어 모드
          const url = new URL(request.url);
          const requestEdit = url.searchParams.get('requestEdit') === 'Y'
          editorMode = requestEdit
            ? (`edition-${mapMetadata.role}` as EditorRenderMode)
            : 'edition-viewer';

          // Build result ...
          // Safely parse jsonProps with fallback to default zoom
          let zoom = 0.8; // Default zoom value
          if (mapMetadata.jsonProps && mapMetadata.jsonProps.trim()) {
            try {
              const parsedProps = JSON.parse(mapMetadata.jsonProps.trim());
              if (parsedProps && typeof parsedProps === 'object' && 'zoom' in parsedProps) {
                zoom = typeof parsedProps.zoom === 'number' ? parsedProps.zoom : zoom;
              }
            } catch (error) {
              console.warn(
                `Failed to parse jsonProps for map ${mapMetadata.id}:`,
                mapMetadata.jsonProps,
                error,
              );
              // Use default zoom value on parse error
            }
          }
          const data: EditorMetadata = {
            editorMode: editorMode,
            mapMetadata: mapMetadata,
            zoom: zoom,
          };

          // Include XML if requested and available
          if (bootstrap && mapMetadata.xml) {
            data.bootstrapXML = mapMetadata.xml;
          }

          result = createJsonResponse(data);
        } catch (e) {
          const error = e as ErrorInfo;
          if (!error.isAuth) {
            console.warn(`Map could not be loaded`);
            console.warn(e);
          }
          throw e;
        }
        break;
      }
      case 'view-private': {
        try {
          const mapMetadata = await fetchMapMetadataWithCache(mapId, client, bootstrap);

          let editorMode: EditorRenderMode;
          // mapMetadata.role => owner, editor, viewer
          editorMode = `edition-viewer`; // 편집 버튼 클릭 후 편집모드로 전환

          // Build result ...
          // Safely parse jsonProps with fallback to default zoom
          let zoom = 0.8; // Default zoom value
          if (mapMetadata.jsonProps && mapMetadata.jsonProps.trim()) {
            try {
              const parsedProps = JSON.parse(mapMetadata.jsonProps.trim());
              if (parsedProps && typeof parsedProps === 'object' && 'zoom' in parsedProps) {
                zoom = typeof parsedProps.zoom === 'number' ? parsedProps.zoom : zoom;
              }
            } catch (error) {
              console.warn(
                `Failed to parse jsonProps for map ${mapMetadata.id}:`,
                mapMetadata.jsonProps,
                error,
              );
              // Use default zoom value on parse error
            }
          }
          const data: EditorMetadata = {
            editorMode: editorMode,
            mapMetadata: mapMetadata,
            zoom: zoom,
          };

          // Include XML if requested and available (히스토리 뷰가 아닐 때만 — 히스토리 뷰는 loadMapDom으로 해당 버전 로드)
          if (bootstrap && mapMetadata.xml && !params.hid) {
            data.bootstrapXML = mapMetadata.xml;
          }

          result = createJsonResponse(data);
        } catch (e) {
          const error = e as ErrorInfo;
          if (!error.isAuth) {
            console.warn(`Map could not be loaded`);
            console.warn(e);
          }
          throw e;
        }
        break;
      }
      case 'view-public': {
        try {
          const mapMetadata = await fetchMapMetadataWithCache(mapId, client, bootstrap);
          const data: EditorMetadata = {
            editorMode: 'viewonly-public',
            mapMetadata: mapMetadata,
            zoom: 0.8,
          };

          // Include XML if requested and available
          if (bootstrap && mapMetadata.xml) {
            data.bootstrapXML = mapMetadata.xml;
          }

          result = createJsonResponse(data);
        } catch (error) {
          if (isErrorInfo(error) && error.status === 410) {
            throw new Response(error.msg ?? PUBLIC_MAP_REMOVED_MESSAGE, {
              status: 410,
              statusText: 'Gone',
            });
          }
          throw error;
        }
        break;
      }
      default: {
        const exhaustiveCheck: never = pageMode;
        throw new Error(exhaustiveCheck);
      }
    }

    // If result has not been set, redict to the login with the original url
    if (!result) {
      const url = window.location.pathname + window.location.search;
      result = new Response('Map could not be loaded, redirect to login.', {
        status: 302,
        headers: {
          Location: `/c/login?redirect=${encodeURIComponent(url)}`,
        },
      });
    }

    return result;
  };
};
