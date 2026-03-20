/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * HCM_STD_MAP 테이블 조회 서비스 구현.
 */
@Service
public class HcmStdMapServiceImpl implements HcmStdMapService {

    private static final Logger logger = LogManager.getLogger(HcmStdMapServiceImpl.class);

    private final EntityManager entityManager;
    private final String tableName;

    public HcmStdMapServiceImpl(
            EntityManager entityManager,
            @Value("${app.hcm-std-map.table:HCM_STD_MAP}") String tableName) {
        this.entityManager = entityManager;
        this.tableName = tableName;
    }

    @Override
    public List<HcmStdMapItem> findForwardSystemOptions() {
        List<HcmStdMapItem> results = new ArrayList<>();
        try {
            final String sql = "WITH RECURSIVE STD_TREE AS ( "
                    + "    SELECT "
                    + "        STD_ID, "
                    + "        STD_NM, "
                    + "        UP_STD_ID, "
                    + "        CAST(STD_LEVEL_CD AS CHAR(10)) AS STD_LEVEL_CD, "
                    + "        STD_ATT_CD, "
                    + "        CAST(LPAD(SORT_ORDER, 10, '0') AS CHAR(4000)) AS SORT_PATH "
                    + "    FROM " + tableName + " "
                    + "    WHERE DELETE_DT IS NULL "
                    + "      AND STD_LEVEL_CD = 1 "
                    + "    UNION ALL "
                    + "    SELECT "
                    + "        A.STD_ID, "
                    + "        CONCAT(UP.STD_NM, ' > ', A.STD_NM) AS STD_NM, "
                    + "        A.UP_STD_ID, "
                    + "        CAST(UP.STD_LEVEL_CD + 1 AS CHAR(10)) AS STD_LEVEL_CD, "
                    + "        A.STD_ATT_CD, "
                    + "        CONCAT(UP.SORT_PATH, '-', LPAD(A.SORT_ORDER, 10, '0')) AS SORT_PATH "
                    + "    FROM " + tableName + " A "
                    + "    INNER JOIN STD_TREE UP "
                    + "        ON A.UP_STD_ID = UP.STD_ID "
                    + "    WHERE A.DELETE_DT IS NULL "
                    + ") "
                    + "SELECT "
                    + "    A.STD_ID, "
                    + "    A.STD_NM "
                    + "FROM STD_TREE A "
                    + "WHERE A.STD_LEVEL_CD = 3 "
                    + "  AND A.STD_ATT_CD = '001' "
                    + "ORDER BY A.SORT_PATH";

            Query query = entityManager.createNativeQuery(sql);
            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();

            for (Object[] row : rows) {
                String stdId = row[0] != null ? row[0].toString() : null;
                String stdNm = row[1] != null ? row[1].toString() : null;
                results.add(new HcmStdMapItem(stdId, stdNm));
            }
        } catch (Exception e) {
            logger.warn("HcmStdMap: failed to find forward system options: {}", e.getMessage());
        }
        return results;
    }
}
