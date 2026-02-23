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

package com.wisemapping.service;

import com.wisemapping.exceptions.AccessDeniedSecurityException;
import com.wisemapping.exceptions.LockException;
import com.wisemapping.model.Mindmap;
import com.wisemapping.model.Account;
import org.jetbrains.annotations.NotNull;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

class LockManagerImpl implements LockManager {
    // Maximum number of concurrent locks to prevent unbounded memory growth
    // This represents a reasonable limit for concurrent editing sessions
    private static final int MAX_LOCKS = 1000;
    private static final int WARN_THRESHOLD = (int) (MAX_LOCKS * 0.8); // Warn at 80% capacity
    
    private final Map<Integer, LockInfo> lockInfoByMapId;
    final private static Logger logger = LogManager.getLogger();

    @Override
    public boolean isLocked(@NotNull Mindmap mindmap) {
        return this.getLockInfo(mindmap) != null;
    }

    @Override
    public LockInfo getLockInfo(@NotNull Mindmap mindmap) {
        return lockInfoByMapId.get(mindmap.getId());
    }

    @Override
    public void unlockAll(@NotNull final Account user) throws LockException, AccessDeniedSecurityException {
        final Set<Integer> mapIds = lockInfoByMapId.keySet();
        for (final Integer mapId : mapIds) {
            final LockInfo lockInfo = lockInfoByMapId.get(mapId);
            if (lockInfo.getUser().identityEquality(user)) {
                unlock(mapId);
            }
        }
    }

    @Override
    public void unlock(@NotNull Mindmap mindmap, @NotNull Account user) throws LockException, AccessDeniedSecurityException {
        verifyHasLock(mindmap, user);
        this.unlock(mindmap.getId());
    }

    private void unlock(int mapId) {
        logger.debug("Unlock map id:" + mapId);
        lockInfoByMapId.remove(mapId);
    }

    @Override
    public boolean isLockedBy(@NotNull Mindmap mindmap, @NotNull Account collaborator) {
        boolean result = false;
        final LockInfo lockInfo = this.getLockInfo(mindmap);
        if (lockInfo != null && lockInfo.getUser().identityEquality(collaborator)) {
            result = true;
        }
        return result;
    }


    @Override
    public long generateSession() {
        return System.nanoTime();
    }

    @NotNull
    @Override
    public LockInfo lock(@NotNull Mindmap mindmap, @NotNull Account user) throws LockException {
        LockInfo result = lockInfoByMapId.get(mindmap.getId());
        if (result == null) {
            int currentSize = lockInfoByMapId.size();
            if (currentSize >= MAX_LOCKS) {
                logger.error("LockException: Maximum lock limit ({}) reached. mapId={}, user={}. " +
                           "This may indicate expired locks are not being cleaned up properly.",
                           MAX_LOCKS, mindmap.getId(), user.getEmail());
                throw new LockException("Maximum concurrent locks reached. Please try again later.");
            }
            if (currentSize >= WARN_THRESHOLD) {
                logger.warn("Lock map size ({}) approaching maximum limit ({}). " +
                          "Consider investigating if locks are being properly expired.",
                          currentSize, MAX_LOCKS);
            }
            logger.debug("Creating new lock for map id:" + mindmap.getId() + " (current locks: " + currentSize + ")");
            result = new LockInfo(user, mindmap);
            lockInfoByMapId.put(mindmap.getId(), result);
        } else if (!isLockedBy(mindmap, user)) {
            // Lock held by another user - deny (lock 정상 적용 유지)
            logger.warn("LockException: lock held by another user - mapId={}, requester={}, lockHolder={}",
                    mindmap.getId(), user.getEmail(), result.getUser().getEmail());
            throw LockException.createLockLost(mindmap, user, this);
        }
        logger.debug("Updating timeout:" + result);
        result.updateTimeout();
        return result;
    }

    @Override
    public void forceUnlock(@NotNull Mindmap mindmap) {
        if (lockInfoByMapId.remove(mindmap.getId()) != null) {
            logger.debug("Force unlock map id: {}", mindmap.getId());
        }
    }

    private void verifyHasLock(@NotNull Mindmap mindmap, @NotNull Account user) throws LockException, AccessDeniedSecurityException {
        if (isLocked(mindmap) && !isLockedBy(mindmap, user)) {
            LockInfo current = getLockInfo(mindmap);
            logger.warn("LockException: unlock denied - mapId={}, requester={}, lockHolder={}",
                    mindmap.getId(), user.getEmail(), current != null ? current.getUser().getEmail() : "null");
            throw LockException.createLockLost(mindmap, user, this);
        }
    }

    public LockManagerImpl() {
        lockInfoByMapId = new ConcurrentHashMap<>();
    }
}
