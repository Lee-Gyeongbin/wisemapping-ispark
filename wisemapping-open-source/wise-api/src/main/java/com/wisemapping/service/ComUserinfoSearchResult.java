/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

/**
 * com_userinfo 테이블 검색 결과 DTO.
 */
public class ComUserinfoSearchResult {
    private String userId;
    private String userNm;
    private String email;
    private String deptNm;
    private String userStatusCd;

    public ComUserinfoSearchResult() {
    }

    public ComUserinfoSearchResult(String userId, String userNm, String email, String deptNm, String userStatusCd) {
        this.userId = userId;
        this.userNm = userNm;
        this.email = email;
        this.deptNm = deptNm;
        this.userStatusCd = userStatusCd;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserNm() {
        return userNm;
    }

    public void setUserNm(String userNm) {
        this.userNm = userNm;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDeptNm() {
        return deptNm;
    }

    public void setDeptNm(String deptNm) {
        this.deptNm = deptNm;
    }

    public String getUserStatusCd() {
        return userStatusCd;
    }

    public void setUserStatusCd(String userStatusCd) {
        this.userStatusCd = userStatusCd;
    }
}
