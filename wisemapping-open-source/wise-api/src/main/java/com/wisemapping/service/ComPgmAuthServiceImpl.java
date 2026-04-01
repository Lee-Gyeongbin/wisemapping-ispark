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
import org.springframework.stereotype.Service;

/**
 * COM_ADMIN, COM_PGM_AUTH 테이블 기반 권한 조회 구현.
 */
@Service
public class ComPgmAuthServiceImpl implements ComPgmAuthService {

    private static final Logger logger = LogManager.getLogger(ComPgmAuthServiceImpl.class);

    private static final String SQL_AUTH_YN = "SELECT CASE "
            + "WHEN :userId IN ("
            + "  SELECT USER_ID FROM COM_ADMIN "
            + "  WHERE AUTH_GUBUN IN ("
            + "    SELECT AUTH_GUBUN FROM COM_PGM_AUTH WHERE PGM_ID = :pgmId"
            + "  )"
            + ") THEN 'Y' "
            + "ELSE 'N' "
            + "END AS AUTH_YN";

    private final EntityManager entityManager;

    public ComPgmAuthServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public String resolveAuthYn(@Nullable String userId, String pgmId) {
        if (userId == null || userId.isBlank() || pgmId == null || pgmId.isBlank()) {
            return "N";
        }
        try {
            Query query = entityManager.createNativeQuery(SQL_AUTH_YN);
            query.setParameter("userId", userId);
            query.setParameter("pgmId", pgmId);
            Object result = query.getSingleResult();
            if (result == null) {
                return "N";
            }
            String yn = result.toString().trim();
            return "Y".equalsIgnoreCase(yn) ? "Y" : "N";
        } catch (NoResultException e) {
            return "N";
        } catch (Exception e) {
            logger.warn("ComPgmAuth: failed to resolve auth for USER_ID={}, PGM_ID={}: {}",
                    userId, pgmId, e.getMessage());
            return "N";
        }
    }
}
