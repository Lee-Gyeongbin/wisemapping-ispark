/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

/**
 * HCM_STD_MAP 테이블 조회 결과 DTO.
 */
public class HcmStdMapItem {
    private String stdId;
    private String stdNm;

    public HcmStdMapItem() {
    }

    public HcmStdMapItem(String stdId, String stdNm) {
        this.stdId = stdId;
        this.stdNm = stdNm;
    }

    public String getStdId() {
        return stdId;
    }

    public void setStdId(String stdId) {
        this.stdId = stdId;
    }

    public String getStdNm() {
        return stdNm;
    }

    public void setStdNm(String stdNm) {
        this.stdNm = stdNm;
    }
}
