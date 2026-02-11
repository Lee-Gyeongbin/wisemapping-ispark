/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import org.jetbrains.annotations.Nullable;

import java.util.Optional;

/**
 * com_userinfo 테이블 조회 서비스.
 * Account.firstname(=USER_ID)로 USER_NM을 조회.
 */
public interface ComUserinfoService {

    /**
     * USER_ID로 USER_NM 조회.
     *
     * @param userId com_userinfo.USER_ID (Account.firstname과 매핑)
     * @return USER_NM, 없으면 empty
     */
    Optional<String> findUserNmByUserId(@Nullable String userId);

    /**
     * USER_ID로 com_userinfo.DEPT_ID → com_deptinfo 조인하여 DEPT_NM 조회.
     *
     * @param userId com_userinfo.USER_ID (Account.firstname과 매핑)
     * @return DEPT_NM, 없으면 empty
     */
    Optional<String> findDeptNmByUserId(@Nullable String userId);
}
