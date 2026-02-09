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
package com.wisemapping.config;

import com.wisemapping.filter.ErpUserContextFilter;
import com.wisemapping.model.Account;
import com.wisemapping.security.Utils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Locale;

@SpringBootApplication(scanBasePackages = "com.wisemapping")
@Import({ com.wisemapping.config.common.JPAConfig.class, com.wisemapping.config.common.SecurityConfig.class })
@EnableScheduling
@EnableAsync
@EnableWebSecurity
@Configuration
@EnableWebMvc
public class AppConfig implements WebMvcConfigurer {

    @Value("${app.api.http-basic-enabled:false}")
    private boolean enableHttpBasic;

    @Value("${app.security.corsAllowedOrigins:}")
    private String corsAllowedOrigins;
    
    @Value("${app.site.ui-base-url:}")
    private String uiBaseUrl;

    @Autowired
    private ErpUserContextFilter erpUserContextFilter;
    
    @Bean
    SecurityFilterChain apiSecurityFilterChain(@NotNull final HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults()) // enables WebMvcConfigurer CORS
                .securityMatcher("/**")
                // ERP iframe 연동: userId 기반 컨텍스트 주입 (무상태)
                .addFilterBefore(erpUserContextFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // 인증/권한 제거: 전체 permitAll (현재 사용자는 ErpUserContextFilter가 userId로 결정)
                        .anyRequest().permitAll())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            // 인증을 사용하지 않으므로 기본적으로 401을 내지 않게 한다.
                            response.sendError(HttpServletResponse.SC_FORBIDDEN);
                        }));

        http
                .csrf(AbstractHttpConfigurer::disable)
                // 서버 세션 미사용(무상태). userId는 매 요청마다 전달되어야 함.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        // Content Security Policy for HTML content
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"))
                        // Prevent MIME type sniffing
                        .contentTypeOptions(Customizer.withDefaults())
                        // Prevent clickjacking
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                        // HSTS (HTTP Strict Transport Security)
                        .httpStrictTransportSecurity(hsts -> hsts
                                .maxAgeInSeconds(31536000))
                        // Referrer Policy
                        .referrerPolicy(referrerPolicy -> referrerPolicy
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        // Custom headers
                        .addHeaderWriter((request, response) -> response.setHeader("Server", "WiseMapping")));

        // Http basic / OAuth2 / JWT 로그인은 비활성화 (ERP userId 기반 연동)

        return http.build();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (!corsAllowedOrigins.isEmpty()) {
            // Split comma-separated origins and trim whitespace
            String[] origins = corsAllowedOrigins.split(",");
            for (int i = 0; i < origins.length; i++) {
                origins[i] = origins[i].trim();
            }

            registry.addMapping("/api/**")
                    .exposedHeaders("*")
                    .allowedHeaders("*")
                    .allowedMethods("*")
                    .allowedOrigins(origins)
                    .maxAge(3600);
        }
    }

    @Bean(name = "taskExecutor")
    @Primary
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Limit to single thread to prevent parallel execution and reduce memory pressure
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("AsyncTask-");
        executor.setAllowCoreThreadTimeOut(true);
        // Use CallerRunsPolicy to prevent task rejection and provide backpressure
        // This will cause the calling thread to execute the task if queue is full
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    @Bean
    @Primary
    public LocaleResolver customLocaleResolver() {
        return new AcceptHeaderLocaleResolver() {
            @Override
            public @NotNull Locale resolveLocale(@NotNull HttpServletRequest request) {
                final Account user = Utils.getUser();
                Locale result;
                if (user != null && user.getLocale() != null) {
                    String locale = user.getLocale();
                    final String locales[] = locale.split("_");

                    Locale.Builder builder = new Locale.Builder().setLanguage(locales[0]);
                    if (locales.length > 1) {
                        builder.setRegion(locales[1]);
                    }
                    result = builder.build();
                } else {
                    result = super.resolveLocale(request);
                }
                return result;
            }
        };
    }
}
