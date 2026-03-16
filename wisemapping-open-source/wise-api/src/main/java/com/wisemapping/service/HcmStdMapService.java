/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import java.util.List;

/**
 * HCM_STD_MAP 테이블 조회 서비스.
 * 전방체계 콤보박스 옵션용.
 */
public interface HcmStdMapService {

    /**
     * HCM_STD_MAP에서 IS_LEAF='Y', DELETE_DT IS NULL인 항목을 SORT_ORDER 순으로 조회.
     *
     * @return STD_ID, STD_NM 리스트
     */
    List<HcmStdMapItem> findForwardSystemOptions();
}
