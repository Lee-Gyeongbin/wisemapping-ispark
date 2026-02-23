/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * com_userinfo 테이블에서 USER_ID로 USER_NM 조회.
 */
@Service
public class ComUserinfoServiceImpl implements ComUserinfoService {

    private static final Logger logger = LogManager.getLogger(ComUserinfoServiceImpl.class);
    private static final String USER_NM_COLUMN = "USER_NM";
    private static final String USER_STATUS_CD_COLUMN = "USER_STATUS_CD";

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

    @Override
    public Optional<String> findDeptNmByUserId(@Nullable String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        try {
            final String deptTable = "com_deptinfo";
            final String sql = "SELECT d.DEPT_NM FROM " + tableName + " u "
                    + "LEFT JOIN " + deptTable + " d ON u.DEPT_ID = d.DEPT_ID "
                    + "WHERE LOWER(u." + userIdColumn + ") = LOWER(:userId)";
            final Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();
            if (result != null && !result.toString().trim().isEmpty()) {
                return Optional.of(result.toString().trim());
            }
        } catch (NoResultException e) {
            // USER_ID에 해당하는 행이 없음
        } catch (Exception e) {
            logger.warn("ComUserinfo: failed to lookup DEPT_NM for USER_ID={}: {}", userId, e.getMessage());
        }
        return Optional.empty();
    }

    @Override
    public Optional<String> findUserStatusCdByUserId(@Nullable String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        try {
            final String sql = "SELECT " + USER_STATUS_CD_COLUMN + " FROM " + tableName
                    + " WHERE LOWER(" + userIdColumn + ") = LOWER(:userId)";
            final Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();
            if (result != null && !result.toString().trim().isEmpty()) {
                return Optional.of(result.toString().trim());
            }
        } catch (NoResultException e) {
            // USER_ID에 해당하는 행이 없음
        } catch (Exception e) {
            logger.warn("ComUserinfo: failed to lookup USER_STATUS_CD for USER_ID={}: {}", userId, e.getMessage());
        }
        return Optional.empty();
    }

    @Override
    public List<ComUserinfoSearchResult> searchUsers(@Nullable String searchTerm) {
        List<ComUserinfoSearchResult> results = new ArrayList<>();
        try {
            final String deptTable = "com_deptinfo";
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT u.").append(userIdColumn).append(", u.USER_NM, u.EMAIL, d.DEPT_NM, u.USER_STATUS_CD ");
            sql.append("FROM ").append(tableName).append(" u ");
            sql.append("LEFT JOIN ").append(deptTable).append(" d ON u.DEPT_ID = d.DEPT_ID ");
            sql.append("WHERE u.DELETE_DT IS NULL ");
            // sql.append("AND u.USER_ID NOT LIKE '%admin%' "); // 관리자 제외 TODO : 필요시 주석 해제
            
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                String search = searchTerm.trim();
                sql.append("AND (LOWER(u.USER_NM) LIKE LOWER(:search) OR LOWER(u.EMAIL) LIKE LOWER(:search)) ");
            }
            
            sql.append("ORDER BY u.USER_NM ");
            // sql.append("LIMIT :limit");
            
            Query query = entityManager.createNativeQuery(sql.toString());
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                query.setParameter("search", "%" + searchTerm.trim() + "%");
            }
            // query.setParameter("limit", limit);
            
            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            
            for (Object[] row : rows) {
                String userId = row[0] != null ? row[0].toString() : null;
                String userNm = row[1] != null ? row[1].toString() : null;
                String email = row[2] != null ? row[2].toString() : null;
                String deptNm = row[3] != null ? row[3].toString() : null;
                String userStatusCd = row.length > 4 && row[4] != null ? row[4].toString() : null;
                
                results.add(new ComUserinfoSearchResult(userId, userNm, email, deptNm, userStatusCd));
            }
        } catch (Exception e) {
            logger.warn("ComUserinfo: failed to search users: {}", e.getMessage());
        }
        return results;
    }
}
