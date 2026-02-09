package com.wisemapping.filter;

import com.wisemapping.model.Account;
import com.wisemapping.security.CurrentUserHolder;
import com.wisemapping.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * ERP/BSC_CMB iframe 연동용 무상태(userId 기반) 사용자 컨텍스트 필터.
 *
 * <p>요청마다 다음 우선순위로 userId를 추출해 Account를 로드(없으면 생성)하고 ThreadLocal에 저장한다.</p>
 * <ul>
 *   <li>Query parameter: userId</li>
 *   <li>Header: X-User-Id</li>
 * </ul>
 *
 * <p>주의: 이 모드는 인증/권한을 제거하고 외부에서 넘어온 userId를 신뢰한다.
 * 내부망/게이트웨이 레벨에서 반드시 접근을 제한해야 한다.</p>
 */
@Component
public class ErpUserContextFilter extends OncePerRequestFilter {
    private static final Logger logger = LogManager.getLogger();

    public static final String USER_ID_PARAM = "userId";
    public static final String USER_ID_HEADER = "X-User-Id";

    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(
            @NotNull HttpServletRequest request,
            @NotNull HttpServletResponse response,
            @NotNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            final String userId = resolveUserId(request);
            if (userId != null && !userId.isBlank()) {
                final String normalized = userId.trim().toLowerCase();
                final Account account = userService.findOrCreateAccountByEmail(normalized);
                CurrentUserHolder.set(account);
            } else {
                CurrentUserHolder.clear();
            }
        } catch (Exception e) {
            // user context 실패가 전체 요청을 막지 않도록 한다.
            logger.warn("Failed to resolve ERP userId context: {}", e.getMessage());
            CurrentUserHolder.clear();
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // 요청 단위로 반드시 정리
            CurrentUserHolder.clear();
        }
    }

    private String resolveUserId(@NotNull HttpServletRequest request) {
        String userId = request.getParameter(USER_ID_PARAM);
        if (userId != null && !userId.isBlank()) {
            return userId;
        }
        userId = request.getHeader(USER_ID_HEADER);
        if (userId != null && !userId.isBlank()) {
            return userId;
        }
        return null;
    }
}

