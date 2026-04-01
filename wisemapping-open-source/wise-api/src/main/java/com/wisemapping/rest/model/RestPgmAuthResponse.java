/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.rest.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;

/**
 * PGM별 화면 권한 여부 REST 응답 DTO.
 */
@JsonAutoDetect(
        fieldVisibility = JsonAutoDetect.Visibility.NONE,
        getterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY,
        isGetterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY)
public class RestPgmAuthResponse {
    private String authYn;

    public RestPgmAuthResponse() {
    }

    public RestPgmAuthResponse(String authYn) {
        this.authYn = authYn;
    }

    public String getAuthYn() {
        return authYn;
    }

    public void setAuthYn(String authYn) {
        this.authYn = authYn;
    }
}
