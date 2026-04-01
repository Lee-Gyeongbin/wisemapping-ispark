/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import org.jetbrains.annotations.Nullable;

/**
 * COM_ADMIN / COM_PGM_AUTH 기반 프로그램 권한 조회.
 */
public interface ComPgmAuthService {

    /**
     * 사용자가 해당 PGM_ID에 대응하는 AUTH_GUBUN을 COM_ADMIN에서 보유하는지 여부.
     *
     * @param userId ERP USER_ID (Account.firstname)
     * @param pgmId  COM_PGM_AUTH.PGM_ID
     * @return {@code "Y"} 또는 {@code "N"}
     */
    String resolveAuthYn(@Nullable String userId, String pgmId);
}
