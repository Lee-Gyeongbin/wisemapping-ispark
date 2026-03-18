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
 * HCM_AVT_PLAN 테이블 조회 서비스 구현.
 */
@Service
public class HcmAvtPlanServiceImpl implements HcmAvtPlanService {

    private static final Logger logger = LogManager.getLogger(HcmAvtPlanServiceImpl.class);

    private final EntityManager entityManager;
    private final String avtPlanTable;
    private final String stdMapTable;

    public HcmAvtPlanServiceImpl(
            EntityManager entityManager,
            @Value("${app.hcm-avt-plan.table:HCM_AVT_PLAN}") String avtPlanTable,
            @Value("${app.hcm-std-map.table:HCM_STD_MAP}") String stdMapTable) {
        this.entityManager = entityManager;
        this.avtPlanTable = avtPlanTable;
        this.stdMapTable = stdMapTable;
    }

    @Override
    public List<HcmAvtPlanItem> findForwardWorkOptions(String startDate, String endDate, String stdId) {
        List<HcmAvtPlanItem> results = new ArrayList<>();
        try {
            final String sql = "SELECT A.PLAN_ID, A.PLAN_NM "
                    + "FROM " + avtPlanTable + " A, " + stdMapTable + " B "
                    + "WHERE 1=1 "
                    + "AND A.USER_ID = B.CREATE_USER_ID "
                    + "AND A.START_DT <= ?1 "
                    + "AND (A.END_DT >= ?2 OR A.END_DT IS NULL) "
                    + "AND B.STD_ID = ?3";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, endDate);
            query.setParameter(2, startDate);
            query.setParameter(3, stdId);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();

            for (Object[] row : rows) {
                String planId = row[0] != null ? row[0].toString() : null;
                String planNm = row[1] != null ? row[1].toString() : null;
                results.add(new HcmAvtPlanItem(planId, planNm));
            }
        } catch (Exception e) {
            logger.warn("HcmAvtPlan: failed to find forward work options: {}", e.getMessage());
        }
        return results;
    }
}
