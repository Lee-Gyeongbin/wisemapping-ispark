/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 */

package com.wisemapping.service;

import com.wisemapping.model.Account;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.wisemapping.security.Utils;

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

    public HcmAvtPlanServiceImpl(
            EntityManager entityManager,
            @Value("${app.hcm-avt-plan.table:HCM_AVT_PLAN}") String avtPlanTable) {
        this.entityManager = entityManager;
        this.avtPlanTable = avtPlanTable;
    }

    @Override
    public List<HcmAvtPlanItem> findForwardWorkOptions(String startDate, String endDate) {
        List<HcmAvtPlanItem> results = new ArrayList<>();
        try {
            final Account currentUser = Utils.getUser();
            // ERP iframe integration에서 userId는 (Account.firstname = userId/email)로 매핑된다.
            final String currentUserId = currentUser != null ? currentUser.getFirstname() : null;
            // 디버깅용: 운영/개발 로그 레벨에서 잘 보이도록 info로 출력
            logger.info("HcmAvtPlan: currentUserId(firstname)={}, startDate={}, endDate={}",
                    currentUserId, startDate, endDate);
            if (currentUserId == null) {
                return results;
            }

            final String sql = "SELECT A.PLAN_ID, A.PLAN_NM "
                    + "FROM " + avtPlanTable + " A "
                    + "WHERE 1=1 "
                    + "AND A.USER_ID = ?3 "
                    + "AND A.START_DT <= ?1 "
                    + "AND (A.END_DT >= ?2 OR A.END_DT IS NULL)";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, endDate);
            query.setParameter(2, startDate);
            query.setParameter(3, currentUserId);

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
