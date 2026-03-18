/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

/**
 * HCM_AVT_PLAN 테이블 조회 결과 DTO.
 */
public class HcmAvtPlanItem {
    private String planId;
    private String planNm;

    public HcmAvtPlanItem() {
    }

    public HcmAvtPlanItem(String planId, String planNm) {
        this.planId = planId;
        this.planNm = planNm;
    }

    public String getPlanId() {
        return planId;
    }

    public void setPlanId(String planId) {
        this.planId = planId;
    }

    public String getPlanNm() {
        return planNm;
    }

    public void setPlanNm(String planNm) {
        this.planNm = planNm;
    }
}
