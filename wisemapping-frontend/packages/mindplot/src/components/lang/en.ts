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

interface LanguageStrings {
  [key: string]: string;
  LOADING: string;
  SAVING: string;
  SAVE_COMPLETE: string;
  ZOOM_IN_ERROR: string;
  ZOOM_ERROR: string;
  ONLY_ONE_TOPIC_MUST_BE_SELECTED: string;
  ONE_TOPIC_MUST_BE_SELECTED: string;
  ONLY_ONE_TOPIC_MUST_BE_SELECTED_COLLAPSE: string;
  SAVE_COULD_NOT_BE_COMPLETED: string;
  MAIN_TOPIC: string;
  SUB_TOPIC: string;
  ISOLATED_TOPIC: string;
  CENTRAL_TOPIC: string;
  ENTITIES_COULD_NOT_BE_DELETED: string;
  CLIPBOARD_IS_EMPTY: string;
  CENTRAL_TOPIC_CAN_NOT_BE_DELETED: string;
  RELATIONSHIP_COULD_NOT_BE_CREATED: string;
  SESSION_EXPIRED: string;
  MINDMAP_IS_LOCKED: string;
  CENTRAL_TOPIC_CONNECTION_STYLE_CAN_NOT_BE_CHANGED: string;
  CENTRAL_TOPIC_STYLE_CAN_NOT_BE_CHANGED: string;
  TAB_TO_CREATE_CHILD: string;
  ENTER_TO_CREATE_SIBLING: string;
  PLUS_TOOLTIP_CREATE_CHILD: string;
  PLUS_TOOLTIP_CREATE_SIBLING: string;
}

const EN: LanguageStrings = {
  LOADING: 'Loading ..',
  SAVING: '저장중 ...',
  SAVE_COMPLETE: '저장되었습니다',
  ZOOM_IN_ERROR: '확대 비율이 너무 높습니다.',
  ZOOM_ERROR: '더 이상 확대할 수 없습니다.',
  ONLY_ONE_TOPIC_MUST_BE_SELECTED: '주제를 생성할 수 없습니다. 최소한 하나의 주제를 선택해야 합니다.',
  ONE_TOPIC_MUST_BE_SELECTED: '주제를 생성할 수 없습니다. 최소한 하나의 주제를 선택해야 합니다.',
  ONLY_ONE_TOPIC_MUST_BE_SELECTED_COLLAPSE: '하위 주제를 축소할 수 없습니다. 최소한 하나의 주제를 선택해야 합니다.',
  SAVE_COULD_NOT_BE_COMPLETED: '저장할 수 없습니다. 다시 시도해주세요.',
  MAIN_TOPIC: '주제',
  SUB_TOPIC: '하위 주제',
  ISOLATED_TOPIC: '독립 주제',
  CENTRAL_TOPIC: '중심 주제',
  ENTITIES_COULD_NOT_BE_DELETED: '주제나 관계를 삭제할 수 없습니다. 최소한 하나의 맵 엔티티를 선택해야 합니다.',
  CLIPBOARD_IS_EMPTY: '복사할 내용이 없습니다. 클립보드가 비어 있습니다.',
  CENTRAL_TOPIC_CAN_NOT_BE_DELETED: '중심 주제를 삭제할 수 없습니다.',
  RELATIONSHIP_COULD_NOT_BE_CREATED: '관계를 생성할 수 없습니다. 부모 관계 주제를 먼저 선택해야 합니다.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  MINDMAP_IS_LOCKED: '다른 사용자가 이 맵을 편집 중입니다.',
  CENTRAL_TOPIC_CONNECTION_STYLE_CAN_NOT_BE_CHANGED: '중심 주제의 연결 스타일을 변경할 수 없습니다.',
  CENTRAL_TOPIC_STYLE_CAN_NOT_BE_CHANGED: '중심 주제를 선 스타일로 변경할 수 없습니다.',
  TAB_TO_CREATE_CHILD: '하위 주제 생성',
  ENTER_TO_CREATE_SIBLING: '동일 레벨 주제 생성',
  PLUS_TOOLTIP_CREATE_CHILD: '하위 주제 생성',
  PLUS_TOOLTIP_CREATE_SIBLING: '동일 레벨 주제 생성',
};

export default EN;
