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

import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';

import { ErrorInfo, MapInfo } from '../../../../classes/client';
import BaseDialog from '../base-dialog';
import { SimpleDialogProps } from '..';
import {
  StyledScrollContainer,
  InfoSection,
  SectionTitle,
  InfoRow,
  InfoLabel,
  InfoValue,
  StyledDivider,
} from './styled';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { useFetchMapById } from '../../../../classes/middleware';

// Load fromNow plugin
dayjs.extend(LocalizedFormat);

const InfoDialog = ({ mapId, onClose }: SimpleDialogProps): React.ReactElement => {
  const queryClient = useQueryClient();
  const { data: map } = useFetchMapById(mapId);
  const [error, setError] = React.useState<ErrorInfo>();

  // 메타데이터 API는 starred를 안 주는 경우가 있어, 맵 목록 캐시에 있으면 그걸 씀
  const mapsList = queryClient.getQueryData<MapInfo[]>('maps');
  const starredFromList = mapsList?.find((m) => m.id === mapId)?.starred;
  const starred = starredFromList ?? map?.starred ?? false;

  const intl = useIntl();

  const handleOnClose = (): void => {
    onClose();
    setError(undefined);
  };

  return (
    <BaseDialog
      onClose={handleOnClose}
      error={error}
      title={'맵 정보'}
      useBscCmbTitle={true}
      submitButton={'확인'}
    >
      <StyledScrollContainer>
        <InfoSection>
          <SectionTitle variant="body1">
            {'기본 정보'}
          </SectionTitle>

          <InfoRow>
            <InfoLabel variant="caption">
              {'마인드맵 명'}
            </InfoLabel>
            <InfoValue variant="body2">{map?.title}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'설명'}
            </InfoLabel>
            <InfoValue variant="body2">{map?.description}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'생성자'}
            </InfoLabel>
            <InfoValue variant="body2">{map?.createdBy}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'생성일'}
            </InfoLabel>
            <InfoValue variant="body2">{dayjs(map?.creationTime).format('LLL')}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'마지막 수정자'}
            </InfoLabel>
            <InfoValue variant="body2">{map?.lastModificationBy}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'마지막 수정일'}
            </InfoLabel>
            <InfoValue variant="body2">{dayjs(map?.lastModificationTime).format('LLL')}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel variant="caption">
              {'즐겨찾기'}
            </InfoLabel>
            <InfoValue variant="body2">{starred ? 'Y' : 'N'}</InfoValue>
          </InfoRow>
        </InfoSection>


      </StyledScrollContainer>
    </BaseDialog>
  );
};

export default InfoDialog;
