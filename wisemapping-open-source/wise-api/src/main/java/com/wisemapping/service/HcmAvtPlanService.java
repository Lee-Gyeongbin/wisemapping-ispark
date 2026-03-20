/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import java.util.List;

/**
 * HCM_AVT_PLAN 테이블 조회 서비스.
 * 전방워크 콤보박스 옵션용.
 */
public interface HcmAvtPlanService {

    /**
     * 전방워크 옵션 목록 조회.
     *
     * @param startDate 시작일 (yyyyMMdd)
     * @param endDate   종료일 (yyyyMMdd)
     * @return PLAN_ID, PLAN_NM 리스트
     */
    List<HcmAvtPlanItem> findForwardWorkOptions(String startDate, String endDate);
}
