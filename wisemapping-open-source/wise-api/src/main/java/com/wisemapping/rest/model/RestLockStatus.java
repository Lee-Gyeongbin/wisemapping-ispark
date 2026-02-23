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

package com.wisemapping.rest.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wisemapping.service.LockInfo;

@JsonAutoDetect(
        fieldVisibility = JsonAutoDetect.Visibility.NONE,
        getterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY,
        isGetterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY)
@JsonIgnoreProperties(ignoreUnknown = true)
public class RestLockStatus {

    private final boolean locked;
    private final String lockedByUserId;

    public RestLockStatus(boolean locked, String lockedByUserId) {
        this.locked = locked;
        this.lockedByUserId = lockedByUserId;
    }

    public static RestLockStatus from(LockInfo lockInfo) {
        if (lockInfo == null) {
            return new RestLockStatus(false, null);
        }
        String userId = lockInfo.getUser().getFirstname();
        return new RestLockStatus(true, userId);
    }

    public boolean isLocked() {
        return locked;
    }

    public String getLockedByUserId() {
        return lockedByUserId;
    }
}
