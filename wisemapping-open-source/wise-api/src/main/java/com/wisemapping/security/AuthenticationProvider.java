/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 *   It is basically the Apache License, Version 2.0 (the "License") plus the
 *   "powered by wisemapping" text requirement on every single page;
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the license at
 *
 *       https://github.com/wisemapping/wisemapping-open-source/blob/main/LICENSE.md
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package com.wisemapping.security;


import com.wisemapping.exceptions.AccountDisabledException;
import com.wisemapping.exceptions.AccountSuspendedException;
import com.wisemapping.exceptions.WrongAuthenticationTypeException;
import com.wisemapping.model.Account;
import com.wisemapping.model.AuthenticationType;
import com.wisemapping.service.MetricsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.jetbrains.annotations.NotNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.StandardPasswordEncoder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Calendar;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


public class AuthenticationProvider implements org.springframework.security.authentication.AuthenticationProvider {
    private static final Logger logger = LogManager.getLogger();
    
    private UserDetailsService userDetailsService;
    private PasswordEncoder encoder;
    /** com_userinfo 비밀번호 매치용 (기존 passwordEncoder.matches(password, user.getPasswd()) 와 동일) */
    @SuppressWarnings("deprecation")
    private StandardPasswordEncoder standardPasswordEncoder;
    private MetricsService metricsService;
    private EntityManager entityManager;
    private TransactionTemplate transactionTemplate;

    /**
     * Legacy fallback: if enabled and the current HttpSession contains a non-empty userId attribute,
     * authentication will succeed for that user without checking password.
     *
     * NOTE: Default is disabled (false) for safety.
     */
    private boolean sessionUserIdBypassEnabled = false;

    /** HttpSession attribute name for bypass mode. */
    private String sessionUserIdAttribute = "userId";

    /** com_userinfo 테이블/컬럼명 (ID·PW 검증만 이 테이블 사용, COLLABORATOR/ACCOUNT는 검증에 사용 안 함) */
    private String comUserInfoTable = "com_userinfo";
    private String comUserInfoUserIdColumn = "USER_ID";
    private String comUserInfoPasswordColumn = "PASSWD";

    @Override()
    public Authentication authenticate(@NotNull final Authentication auth) throws AuthenticationException {

        final String inputUsername = auth.getName();
        String credentials = (String) auth.getCredentials();
        String username = inputUsername != null ? inputUsername.trim() : null;

        // Optional bypass if upstream app already authenticated and stored userId in session.
        // This is a fallback mechanism when integrating behind another app.
        final String sessionUserId = sessionUserIdBypassEnabled ? readSessionUserId() : null;
        final boolean bypassPassword = sessionUserId != null && !sessionUserId.isBlank();
        if (bypassPassword) {
            username = sessionUserId.trim();
            if (credentials == null) {
                credentials = "";
            }
            logger.debug("Session userId bypass enabled - authenticating as {}", username);
        } else {
            // Primary authentication: validate against com_userinfo(USER_ID, PASSWD)
            if (username == null || username.isBlank() || credentials == null) {
                throw new BadCredentialsException("Missing username/password");
            }
            // Canonicalize username to match JwtAuthController (it lowercases) and to avoid case issues.
            username = username.toLowerCase();
            if (!validateAgainstComUserInfo(username, credentials)) {
                logger.warn("Auth failed: com_userinfo validation failed for USER_ID={}", username);
                throw new BadCredentialsException("Username/Password does not match for " + auth.getPrincipal());
            }
        }

        // Ensure canonical username (lowercase) for downstream (JWT subject, Account email, etc.)
        if (username != null) {
            username = username.toLowerCase();
        }

        // Ensure a WiseMapping Account exists for the authenticated user.
        // The rest of the app (JWT, permissions, etc.) is based on Account/Collaborator entities.
        Account user = userDetailsService.getUserService().getUserBy(username);
        if (user == null) {
            createLocalAccount(username, credentials);
            user = userDetailsService.getUserService().getUserBy(username);
        }
        if (user == null) {
            logger.warn("Auth failed: Account is null after create for USER_ID={} (check COLLABORATOR/ACCOUNT or createLocalAccount)", username);
            throw new BadCredentialsException("User account is null for " + username);
        }

        // Users registered with OAuth (Google/Facebook) cannot login with username/password.
        if (user.getAuthenticationType() != AuthenticationType.DATABASE) {
            throw new WrongAuthenticationTypeException(user, "Wrong authentication method");
        }

        // Skip session validation when using session bypass (iframe/external integration)
        if (!bypassPassword) {
            if (!user.isActive()) {
                throw new AccountDisabledException("Account not activated for " + auth.getPrincipal());
            }
            if (user.isSuspended()) {
                throw new AccountSuspendedException("Account suspended for " + auth.getPrincipal());
            }
        }

        userDetailsService.getUserService().auditLogin(user);
        
        // Track login telemetry (custom source)
        metricsService.trackUserLogin(user, bypassPassword ? "session" : "com_userinfo");
        
        final UserDetails userDetails = getUserDetailsService().loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(userDetails, credentials, userDetails.getAuthorities());
    }

    @Override
    public boolean supports(final Class<?> authentication) {
        return (UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication));
    }

    public void setEncoder(@NotNull PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @SuppressWarnings("deprecation")
    public void setStandardPasswordEncoder(StandardPasswordEncoder standardPasswordEncoder) {
        this.standardPasswordEncoder = standardPasswordEncoder;
    }

    public UserDetailsService getUserDetailsService() {
        return userDetailsService;
    }

    public void setUserDetailsService(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    public void setMetricsService(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    public void setEntityManager(@NotNull EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public void setTransactionTemplate(@NotNull TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    public void setSessionUserIdBypassEnabled(boolean enabled) {
        this.sessionUserIdBypassEnabled = enabled;
    }

    public void setSessionUserIdAttribute(@NotNull String attributeName) {
        this.sessionUserIdAttribute = attributeName;
    }

    public void setComUserInfoTable(@NotNull String table) {
        this.comUserInfoTable = table;
    }

    public void setComUserInfoUserIdColumn(@NotNull String column) {
        this.comUserInfoUserIdColumn = column;
    }

    public void setComUserInfoPasswordColumn(@NotNull String column) {
        this.comUserInfoPasswordColumn = column;
    }

    /**
     * ID/PW 검증은 com_userinfo 테이블만 사용. COLLABORATOR/ACCOUNT는 검증에 사용하지 않음.
     * USER_ID는 대소문자 구분 없이 매칭 (LOWER 비교).
     */
    private boolean validateAgainstComUserInfo(@NotNull String userId, @NotNull String rawPassword) {
        if (entityManager == null) {
            logger.warn("EntityManager not configured; cannot query {}", comUserInfoTable);
            return false;
        }

        try {
            // 동적 테이블/컬럼명은 설정값만 사용 (SQL injection 방지)
            final String sql = "SELECT " + comUserInfoPasswordColumn + " FROM " + comUserInfoTable
                    + " WHERE LOWER(" + comUserInfoUserIdColumn + ") = LOWER(:userId)";
            logger.info("Auth: querying DB table={} for USER_ID={}", comUserInfoTable, userId);
            final Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();

            String stored = result != null ? result.toString() : null;
            if (stored == null) {
                logger.warn("Auth: {} returned null PASSWD for USER_ID={}", comUserInfoTable, userId);
                return false;
            }
            stored = stored.trim();
            if (!passwordMatches(stored, rawPassword)) {
                logPasswordFormatHint(userId, stored);
                return false;
            }
            logger.info("Auth: com_userinfo OK for USER_ID={}", userId);
            return true;
        } catch (NoResultException e) {
            logger.warn("Auth: no row in {} for USER_ID={} (check table/column: {}.{})", comUserInfoTable, userId, comUserInfoTable, comUserInfoUserIdColumn);
            return false;
        } catch (Exception e) {
            logger.warn("Auth: exception querying {}: {} - {}", comUserInfoTable, e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    /** DB에서 읽은 저장값 형식 힌트만 로그 (비밀번호 노출 없음) */
    private void logPasswordFormatHint(@NotNull String userId, @NotNull String stored) {
        String hint = "len=" + stored.length();
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            hint += ",format=bcrypt";
        } else if (stored.startsWith("*") && stored.length() == 41) {
            hint += ",format=mysql_native";
        } else if (stored.startsWith("ENC:")) {
            hint += ",format=ENC:sha1";
        } else if (stored.length() == 40 && isHexString(stored)) {
            hint += ",format=sha1_hex";
        } else if (stored.length() == 64 && isHexString(stored)) {
            hint += ",format=sha256_hex";
        } else if (stored.length() == 32 && isHexString(stored)) {
            hint += ",format=md5_hex";
        } else {
            hint += ",format=plain_or_unknown";
        }
        logger.warn("Auth: password mismatch for USER_ID={} - stored {} (supported: plain/bcrypt/SHA1/SHA256/MD5/MySQL/ENC:sha1)", userId, hint);
    }

    private boolean isHexString(@NotNull String s) {
        if (s.isEmpty()) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c < '0' || c > '9') && (c < 'a' || c > 'f') && (c < 'A' || c > 'F')) return false;
        }
        return true;
    }

    private boolean passwordMatches(@NotNull String stored, @NotNull String raw) {
        // Common patterns across legacy systems:
        // - plain text (trimmed)
        // - bcrypt ($2a/$2b/$2y)
        // - MySQL native password hash (* + SHA1(SHA1(password)) in HEX upper)
        // - SHA-1 hex (UTF-8 or ISO-8859-1)
        // - SHA-256 hex
        // - MD5 hex
        // - "ENC:" + SHA-1 hex
        final String rawTrimmed = raw != null ? raw.trim() : "";
        if (stored.equals(raw) || stored.equals(rawTrimmed)) {
            return true;
        }

        // StandardPasswordEncoder (기존 passwordEncoder.matches(password, user.getPasswd()) 와 동일)
        if (standardPasswordEncoder != null) {
            try {
                if (standardPasswordEncoder.matches(raw, stored) || standardPasswordEncoder.matches(rawTrimmed, stored)) {
                    return true;
                }
            } catch (Exception ignored) {
                // stored가 StandardPasswordEncoder 형식이 아닐 수 있음
            }
        }

        // bcrypt
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            try {
                return new BCryptPasswordEncoder().matches(raw, stored) || new BCryptPasswordEncoder().matches(rawTrimmed, stored);
            } catch (Exception ignored) {
                // fall through
            }
        }

        // MySQL native password hash format: *<40 hex upper>
        if (stored.startsWith("*") && stored.length() == 41) {
            final String mysqlHash = mysqlNativePasswordHash(raw);
            if (stored.equalsIgnoreCase(mysqlHash)) return true;
            final String mysqlHashTrimmed = mysqlNativePasswordHash(rawTrimmed);
            return stored.equalsIgnoreCase(mysqlHashTrimmed);
        }

        final String sha1 = sha1Hex(raw);
        final String sha1Trimmed = sha1Hex(rawTrimmed);
        if (stored.equalsIgnoreCase(sha1) || stored.equalsIgnoreCase(sha1Trimmed)) {
            return true;
        }
        final String sha1Latin1 = sha1Hex(raw, StandardCharsets.ISO_8859_1);
        if (!sha1Latin1.isEmpty() && stored.equalsIgnoreCase(sha1Latin1)) {
            return true;
        }
        final String sha256 = sha256Hex(raw);
        if (!sha256.isBlank() && (stored.equalsIgnoreCase(sha256) || stored.equalsIgnoreCase(sha256Hex(rawTrimmed)))) {
            return true;
        }
        final String md5 = md5Hex(raw);
        if (!md5.isBlank() && (stored.equalsIgnoreCase(md5) || stored.equalsIgnoreCase(md5Hex(rawTrimmed)))) {
            return true;
        }
        if (stored.regionMatches(true, 0, "ENC:", 0, 4)) {
            String encPart = stored.length() > 4 ? stored.substring(4).trim() : "";
            if (encPart.equalsIgnoreCase(sha1) || encPart.equalsIgnoreCase(sha1Trimmed) || encPart.equalsIgnoreCase(sha1Latin1)) {
                return true;
            }
        }
        return false;
    }

    private String sha1Hex(@NotNull String raw) {
        return sha1Hex(raw, StandardCharsets.UTF_8);
    }

    private String sha1Hex(@NotNull String raw, @NotNull Charset charset) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(raw.getBytes(charset));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    private String sha256Hex(@NotNull String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    private String md5Hex(@NotNull String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    private String mysqlNativePasswordHash(@NotNull String raw) {
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            byte[] stage1 = sha1.digest(raw.getBytes(StandardCharsets.UTF_8));
            byte[] stage2 = sha1.digest(stage1);
            return "*" + HexFormat.of().formatHex(stage2).toUpperCase();
        } catch (Exception e) {
            return "";
        }
    }

    private void createLocalAccount(@NotNull String email, @NotNull String rawPassword) {
        if (entityManager == null || encoder == null || transactionTemplate == null) {
            logger.warn("EntityManager/PasswordEncoder not configured; cannot auto-create local account for {}", email);
            return;
        }

        final Account newUser = new Account();
        newUser.setEmail(email);
        newUser.setFirstname(email);
        newUser.setLastname("User");
        newUser.setAuthenticationType(AuthenticationType.DATABASE);
        newUser.setAllowSendEmail(false);
        newUser.setCreationDate(Calendar.getInstance());
        newUser.setActivationCode(System.currentTimeMillis());
        newUser.setActivationDate(Calendar.getInstance()); // 활성화 처리
        final String raw = (rawPassword != null && !rawPassword.isBlank()) ? rawPassword : UUID.randomUUID().toString();
        newUser.setPassword(encoder.encode(raw));

        try {
            transactionTemplate.executeWithoutResult(status -> {
                entityManager.persist(newUser);
                entityManager.flush();
            });
            logger.info("Created local WiseMapping account for {}", email);
        } catch (Exception e) {
            logger.warn("Failed to create local account for {}: {}", email, e.getMessage());
        }
    }

    private String readSessionUserId() {
        try {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (!(attrs instanceof ServletRequestAttributes)) {
                return null;
            }
            HttpServletRequest request = ((ServletRequestAttributes) attrs).getRequest();
            if (request == null) {
                return null;
            }
            HttpSession session = request.getSession(false);
            if (session == null) {
                return null;
            }
            Object v = session.getAttribute(sessionUserIdAttribute);
            return v != null ? v.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
