/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import org.jetbrains.annotations.Nullable;

import java.util.List;
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

    /**
     * USER_ID로 com_userinfo.USER_STATUS_CD 조회.
     *
     * @param userId com_userinfo.USER_ID (Account.firstname과 매핑)
     * @return USER_STATUS_CD, 없으면 empty
     */
    Optional<String> findUserStatusCdByUserId(@Nullable String userId);

    /**
     * com_userinfo 테이블에서 사용자 검색 (협업자 검색용).
     * DELETE_DT가 NULL이 아닌 사용자만 조회하며, 부서정보도 함께 조회.
     *
     * @param searchTerm 검색어 (USER_NM 또는 EMAIL로 검색, null이면 전체 조회)
     * @param limit 최대 조회 개수
     * @return 사용자 정보 리스트 (USER_ID, USER_NM, EMAIL, DEPT_NM 포함)
     */
    List<ComUserinfoSearchResult> searchUsers(@Nullable String searchTerm);
}
