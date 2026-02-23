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
interface MapInfo {
  isStarred(): Promise<boolean>;

  updateStarred(value: boolean): Promise<void>;

  getTitle(): string;

  updateTitle(title: string): Promise<void>;

  getCreatorFullName(): string;

  isLocked(): boolean;

  getLockedMessage(): string;

  /** 잠금 보유자(편집 중인 사용자) 식별자. 없으면 빈 문자열 */
  getLockedBy?(): string;

  getZoom(): number;

  getId(): string;

  /** owner | editor | viewer. viewer인 경우 편집 권한 없음 */
  getRole?(): string;

  /** 현재 사용자로 편집 Lock 획득. 다른 사용자가 Lock 보유 시 실패. */
  acquireLock?(): Promise<void>;
  /** 기존 Lock을 해제하고 현재 사용자로 Lock 획득 (다른 사용자 편집 중 확인 후 사용). */
  forceAcquireLock?(): Promise<void>;
  /** 편집 Lock 해제 (저장 후 호출). */
  releaseLock?(): Promise<void>;
  /** 최신 Lock 정보 조회 (저장 전 Lock 보유자 비교용). */
  fetchLatestLockInfo?(): Promise<{ isLocked: boolean; lockedByUserId?: string }>;
  /** 현재 로그인 사용자 ID (firstname). */
  getCurrentUserId?(): Promise<string | null>;
}
export default MapInfo;
