/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * com_userinfo 테이블에서 USER_ID로 USER_NM 조회.
 */
@Service
public class ComUserinfoServiceImpl implements ComUserinfoService {

    private static final Logger logger = LogManager.getLogger(ComUserinfoServiceImpl.class);
    private static final String USER_NM_COLUMN = "USER_NM";

    private final EntityManager entityManager;
    private final String tableName;
    private final String userIdColumn;

    public ComUserinfoServiceImpl(
            EntityManager entityManager,
            @Value("${app.auth.com-userinfo.table:com_userinfo}") String tableName,
            @Value("${app.auth.com-userinfo.user-id-column:USER_ID}") String userIdColumn) {
        this.entityManager = entityManager;
        this.tableName = tableName;
        this.userIdColumn = userIdColumn;
    }

    @Override
    public Optional<String> findUserNmByUserId(@Nullable String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        try {
            final String sql = "SELECT " + USER_NM_COLUMN + " FROM " + tableName
                    + " WHERE LOWER(" + userIdColumn + ") = LOWER(:userId)";
            final Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();
            if (result != null) {
                return Optional.of(result.toString().trim());
            }
        } catch (NoResultException e) {
            // USER_ID에 해당하는 행이 없음 - fallback으로 getFullName() 사용
        } catch (Exception e) {
            logger.warn("ComUserinfo: failed to lookup USER_NM for USER_ID={}: {}", userId, e.getMessage());
        }
        return Optional.empty();
    }
}
