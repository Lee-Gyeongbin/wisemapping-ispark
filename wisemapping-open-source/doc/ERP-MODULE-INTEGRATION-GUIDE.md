# WiseMapping → ERP 시스템 모듈 통합 가이드

이 문서는 WiseMapping 오픈소스를 **현재 개발 중인 ERP 시스템에 모듈로 붙여 쓰기 위한** 전체 구조 분석과 통합 방안을 정리한 것입니다.  
**배포:** 같은 **AWS 톰캣 서버**에 **ERP와 WiseMapping을 두 개의 애플리케이션으로 분리**해 띄우는 구성을 기준으로 하며, §7에서 상세히 다룹니다.

---

## 1. WiseMapping 전체 구조 요약

### 1.1 레포지토리/모듈 구성

| 구분 | 저장소/경로 | 기술 스택 | 역할 |
|------|-------------|-----------|------|
| **백엔드 API** | 이 레포 `wise-api/` | Java 24, Spring Boot 3.5.5, JPA/Hibernate | REST API, 인증, DB, 비즈니스 로직 |
| **프론트엔드** | 별도 레포 [wisemapping-frontend](https://github.com/wisemapping/wisemapping-frontend) | React, Node 24+, Yarn 12+ | 마인드맵 편집/보기 UI |
| **배포** | `distribution/` | Docker, docker-compose, Nginx | API·앱 이미지 및 PostgreSQL 예제 |

**정리:**  
- **ERP에 “마인드맵 기능만 붙인다”**면 → **백엔드(wise-api) + 프론트엔드(wisemapping-frontend)** 둘 다 필요합니다.  
- **API만 쓰고 UI는 ERP 쪽에서 직접 만든다**면 → **wise-api만** 가져가면 됩니다.

### 1.2 Java 버전 호환성 (ERP가 Java 8인 경우)

**현재 WiseMapping(wise-api)은 Java 8에서 그대로 실행할 수 없습니다.**

| 항목 | WiseMapping 요구사항 | Java 8 호환 여부 |
|------|----------------------|------------------|
| JDK | Java 24 (pom.xml 기준) | ❌ |
| Spring Boot | 3.5.5 | ❌ (Spring Boot 3.x는 **Java 17 최소**) |
| API 스타일 | Jakarta EE (javax → jakarta 패키지) | ❌ (Java 8 환경은 javax 기반) |

**가능한 대안:**

1. **WiseMapping API를 별도 서비스로 두고 HTTP로만 연동 (권장)**  
   - WiseMapping만 **Java 17 이상** JVM에서 별도 프로세스(또는 Docker)로 실행.  
   - ERP(Java 8)는 그대로 두고, 마인드맵 기능만 필요할 때 **REST API**(`/api/restful/*`)를 호출.  
   - 같은 서버에 두 개의 JVM(ERP=Java 8, WiseMapping=Java 17+)을 띄우거나, WiseMapping만 다른 서버/컨테이너에 배포하면 됨.  
   - **ERP 소스/빌드는 Java 8 유지**, WiseMapping 소스는 현재 그대로(Java 24) 사용 가능.  
   - 필요 시 WiseMapping만 Java 17로 낮추려면 `pom.xml`의 `maven.compiler.source/target`를 17로 변경하고, Java 24 전용 API를 쓰는 부분이 없다면 빌드 가능.

2. **ERP를 Java 17 이상으로 업그레이드**  
   - ERP 전체를 Java 17(또는 21 LTS)로 올리면, 같은 JVM 안에 WiseMapping 모듈을 포함시키는 방식도 가능.  
   - 레거시 규모에 따라 작업량이 클 수 있음.

3. **WiseMapping을 Java 8로 포크/다운그레이드**  
   - Spring Boot 2.x + Java 8 조합으로 전체를 되돌리는 작업은 **Jakarta 전환 취소, 의존성 대량 교체**가 필요해 비현실적에 가깝습니다.  
   - 공식적으로 Java 8 지원 버전이 없으므로 권장하지 않음.

**요약:** ERP는 Java 8을 유지한 채, **WiseMapping API만 별도 서비스(Java 17 이상)로 띄우고 REST로 붙이는 방식**이 현실적입니다.  
→ **같은 AWS 서버에서 톰캣을 두 개(또는 톰캣 1대 + WiseMapping JAR 1개) 띄우는 구성**은 §6에서 정리합니다.

---

## 2. 백엔드(wise-api) 상세 구조

### 2.1 디렉터리/패키지 구조

```
wise-api/
├── pom.xml                          # Maven 빌드 (Spring Boot 3.5.5, Java 24)
├── 6.6-mysql.sql                    # MySQL 마이그레이션 스크립트
└── src/
    ├── main/
    │   ├── java/com/wisemapping/
    │   │   ├── Application.java     # 진입점 (SpringApplicationBuilder → AppConfig)
    │   │   ├── config/               # Spring 설정
    │   │   │   ├── AppConfig.java    # 메인 설정, Security, CORS, WebMvc
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   ├── LdapProperties.java
    │   │   │   └── common/
    │   │   │       ├── JPAConfig.java      # EntityScan, JpaRepositories
    │   │   │       └── SecurityConfig.java # 인증 Provider (DB, LDAP)
    │   │   ├── dao/                  # 데이터 접근 (EntityManager 기반)
    │   │   │   ├── MindmapManager(Impl)
    │   │   │   ├── UserManager(Impl)
    │   │   │   ├── LabelManager(Impl)
    │   │   │   └── InactiveMindmapManager(Impl)
    │   │   ├── exceptions/           # 비즈니스/보안 예외
    │   │   ├── filter/
    │   │   │   └── JwtAuthenticationFilter.java  # JWT Bearer 처리
    │   │   ├── listener/              # Startup, UnlockOnExpire
    │   │   ├── metrics/              # 메트릭
    │   │   ├── mindmap/              # 마인드맵 도메인 (파서, 모델, 검증)
    │   │   ├── model/                # JPA 엔티티
    │   │   ├── rest/                 # REST 컨트롤러 + DTO
    │   │   ├── scheduler/            # 배치/스케줄러
    │   │   ├── security/             # 인증/권한 (JWT, OAuth2, LDAP)
    │   │   ├── service/              # 비즈니스 로직
    │   │   ├── util/, validator/, view/
    │   │   └── ...
    │   └── resources/
    │       ├── application.yml       # 기본 설정 (DB, JWT, OAuth2, LDAP, 배치 등)
    │       ├── schema-*.sql          # PostgreSQL/MySQL/HSQLDB 스키마
    │       ├── data-*.sql            # 초기 데이터
    │       ├── ehcache.xml
    │       ├── mail/*.vm             # Velocity 메일 템플릿
    │       ├── messages_*.properties # 다국어
    │       └── public/               # 정적 리소스 (CSS, 이미지)
    └── test/
        └── java/ + resources/       # 테스트, 샘플 마인드맵 JSON
```

### 2.2 계층별 역할

| 계층 | 패키지 | 역할 |
|------|--------|------|
| **진입/설정** | `Application`, `config` | Spring Boot 기동, Security, CORS, JPA 스캔 |
| **REST** | `rest` | `/api/restful/*` 컨트롤러, 요청/응답 DTO |
| **비즈니스** | `service` | 마인드맵/유저/라벨/협업/스팸/배치 등 서비스 |
| **데이터** | `dao`, `model` | JPA 엔티티, EntityManager 기반 DAO (Repository 인터페이스 없음) |
| **인증/보안** | `security`, `filter` | JWT, DB/LDAP/OAuth2 인증, 권한 평가 |
| **도메인** | `mindmap`, `validator` | 마인드맵 XML 파싱/검증, 노트 HTML 검증 |

### 2.3 REST API prefix 및 컨트롤러

**Base path:** `/api/restful`

| 컨트롤러 | 경로 prefix | 주요 기능 |
|----------|-------------|-----------|
| JwtAuthController | `/api/restful` | POST `/authenticate`, `/logout` |
| AppController | `/api/restful/app` | GET `/config` (공개) |
| UserController | `/api/restful/users` | 회원가입, 비밀번호 리셋, 활성화 |
| AccountController | `/api/restful/account` | 내 계정 조회/수정/삭제 |
| MindmapController | `/api/restful/maps` | 마인드맵 CRUD, XML, 협업, 라벨, 히스토리, 잠금 등 |
| LabelController | `/api/restful/labels` | 라벨 CRUD |
| AdminController | `/api/restful/admin` | 사용자/마인드맵 관리, 시스템 정보 (ADMIN 역할) |
| OAuth2Controller | `/api/restful/oauth2` | OAuth2 콜백 처리 |

인증 제외 경로 예: `/api/restful/authenticate`, `/api/restful/users/`, `/api/restful/app/config`, `/api/restful/maps/*/metadata`, `/api/restful/maps/*/document/xml`, `/api/restful/users/resetPassword`, `/api/restful/users/activation`, `/login/oauth2/**`, `/oauth2/**`.  
나머지는 `USER` 또는 `ADMIN` 역할 필요.

---

## 3. 인증/보안 구조 (ERP 연동 시 중요)

### 3.1 인증 방식

- **JWT (Bearer)**  
  - `Authorization: Bearer <token>`  
  - `/api/restful/authenticate` 에 email/password 로 로그인 → 토큰 발급  
  - `JwtAuthenticationFilter` 가 요청마다 토큰 검증 후 `SecurityContext` 설정

- **DB 로그인**  
  - `AuthenticationProvider` (DB) + `UserDetailsService`  
  - 비밀번호는 `DefaultPasswordEncoderFactories.createDelegatingPasswordEncoder()` (BCrypt 등)

- **LDAP**  
  - `app.ldap.enabled=true` 시 `AuthenticationProviderLDAP` 사용  
  - ERP가 이미 LDAP를 쓰면 동일 LDAP로 WiseMapping 로그인 연동 가능

- **OAuth2 (Google/Facebook)**  
  - `spring.security.oauth2.client.registration.*` 설정 시 사용  
  - ERP에서 SSO만 쓰고 WiseMapping 자체 회원가입을 끄는 구성 가능

### 3.2 권한

- 역할: `USER`, `ADMIN`  
- `/api/restful/admin/**` → `ADMIN`만  
- 마인드맵 단위 권한은 `MapAccessPermissionEvaluation` 등으로 협업(편집/읽기) 제어

ERP와 연동 시:

- **옵션 A:** ERP가 로그인 후 JWT를 발급해 주고, WiseMapping API는 같은 JWT를 그대로 사용 (ERP와 토큰/클레임 규약 통일 필요).
- **옵션 B:** ERP 사용자가 WiseMapping `/authenticate`를 호출해 WiseMapping 전용 JWT 발급 (ERP 사용자 테이블과 WiseMapping Account 동기화 필요).
- **옵션 C:** LDAP만 사용하고, WiseMapping DB에는 LDAP 첫 로그인 시 자동 생성되는 Account만 사용.

---

## 4. 데이터 모델 및 DB

### 4.1 주요 테이블 (PostgreSQL 기준)

| 테이블 | 설명 |
|--------|------|
| COLLABORATOR | 공통 사용자 식별자 (id, email, creation_date) |
| ACCOUNT | Collaborator 확장, 로그인 정보 (비밀번호, 인증타입, 활성화, 정지 등) |
| MINDMAP | 마인드맵 메타 (제목, 설명, 공개여부, 생성/수정일, creator_id, last_editor_id) |
| MINDMAP_XML | 마인드맵 본문 (mindmap_id, xml BYTEA) |
| MINDMAP_HISTORY | 버전별 XML (히스토리) |
| MINDMAP_LABEL | 라벨 정의 |
| R_LABEL_MINDMAP | 마인드맵–라벨 N:M |
| COLLABORATION | 마인드맵별 협업자/역할 |
| COLLABORATION_PROPERTIES | 협업별 설정 (별표 등) |
| MINDMAP_SPAM_INFO | 스팸 판정 정보 (선택적) |
| ACCESS_AUDITORY | 로그인 감사 (선택적) |
| mindmap_inactive_user | 비활성 마인드맵 마이그레이션용 (선택적) |

스키마 파일: `wise-api/src/main/resources/schema-postgresql.sql`, `schema-mysql.sql` 등.

### 4.2 ERP와 DB 통합 시

- **독립 DB:** WiseMapping 전용 스키마/DB를 두고 ERP와 분리 (구현 난이도 낮음).
- **공유 DB:**  
  - ERP 사용자 테이블과 WiseMapping `COLLABORATOR`/`ACCOUNT`를 동기화하거나,  
  - WiseMapping을 “ERP 사용자 id”를 외래키로 두는 방식으로 확장하려면,  
  **엔티티/스키마 수정**이 필요합니다.  
  - 예: `ACCOUNT`에 `erp_user_id` 컬럼 추가, 또는 Collaborator 식별을 email 대신 ERP 사용자 id로 할지 정책 결정.

---

## 5. ERP 통합 시나리오별 “어떤 소스를 어떻게 가져갈지”

### 시나리오 1: ERP에 “마인드맵 기능”만 붙이고, UI도 WiseMapping 프론트 사용

**가져갈 것**

1. **백엔드**
   - `wise-api/` 전체를 ERP 프로젝트의 **하위 모듈**로 복사하거나, Git submodule로 포함.
   - 또는 `wise-api`만 별도 서비스로 두고 ERP에서 HTTP로만 호출.

2. **프론트엔드**
   - [wisemapping-frontend](https://github.com/wisemapping/wisemapping-frontend) 클론 후 빌드.
   - ERP에서 `app.site.api-base-url`을 ERP가 노출하는 WiseMapping API 주소로 설정 (예: `https://erp.example.com/wisemapping-api`).
   - 프론트는 해당 URL로 REST 호출 (로그인 시 JWT 받아서 사용).

3. **설정**
   - `application.yml` (또는 ERP 쪽 설정)에서:
     - `app.site.ui-base-url`: ERP 프론트 주소.
     - `app.site.api-base-url`: WiseMapping API 주소 (프론트와 동일 도메인/경로일 수 있음).
     - `app.security.corsAllowedOrigins`: ERP 프론트 오리진.
     - DB: PostgreSQL/MySQL 등 ERP와 동일 DB 사용 시 URL/스키마만 맞추기.

**붙이는 방법**

- **A: 같은 AWS 톰캣 서버에 두 개 애플리케이션으로 분리 (권장)**  
  - ERP: 기존 톰캣(Java 8) 포트 8080. WiseMapping: `java -jar` 또는 별도 톰캣(Java 17+) 포트 8081, `server.servlet.context-path=/wisemapping-api`.  
  - Nginx 등 리버스 프록시로 `/` → ERP, `/wisemapping-api/` → WiseMapping.  
  - 상세: **§7 같은 AWS 톰캣 서버에 ERP · WiseMapping 분리 배포**.
- **B: ERP와 같은 도메인, 경로만 분리**  
  - 예: `https://erp.example.com/wisemapping-api/` → Spring Boot `server.servlet.context-path=/wisemapping-api` 로 기동.  
  - 프론트는 `api-base-url = https://erp.example.com/wisemapping-api` 로 설정.
- **C: 완전 별도 서비스**  
  - WiseMapping API를 `https://mindmap.erp.example.com` 등으로 두고, CORS만 ERP 도메인 허용.

필수로 가져가야 할 **소스/디렉터리**:

- `wise-api/` 전체 (소스 + `src/main/resources` 포함).
- 프론트는 별도 레포 전체 (ERP 정책에 따라 빌드 결과만 ERP 정적 서버에 두거나, 별도 앱으로 배포).

---

### 시나리오 2: API만 ERP에서 사용하고, UI는 ERP 쪽에서 직접 구현

**가져갈 것**

- **wise-api 전체** (동일).
- 프론트엔드 레포는 참고만 하거나 사용하지 않음.
- ERP 쪽에서 OpenAPI 스펙(`doc/api-documentation/backend/openapi-specs/`)으로 클라이언트 생성 후:
  - `/api/restful/authenticate` 로 JWT 발급,
  - `/api/restful/maps`, `/account`, `/labels` 등 필요한 엔드포인트만 호출.

**필수 소스**

- `wise-api/` 전체.
- `doc/api-documentation/` (OpenAPI, REST 설명) — 통합 시 API 계약서로 활용.

---

### 시나리오 3: ERP 사용자와 WiseMapping 사용자 통합 (SSO/단일 로그인)

**가져갈 것**

- wise-api 전체.
- 추가로 **수정**이 필요한 부분:
  - **인증**
    - 옵션 1: ERP가 JWT를 발급하고, WiseMapping이 “같은 서명/issuer”를 검증하도록 `JwtAuthenticationFilter` 또는 `JwtTokenUtil` 수정.
    - 옵션 2: WiseMapping `/authenticate`를 그대로 쓰되, ERP 로그인 후 ERP 백엔드가 WiseMapping `/authenticate`를 대신 호출해 토큰을 받아 ERP 세션/쿠키에 넣어 주는 방식.
  - **사용자 동기화**
    - LDAP 사용: 이미 구현됨. `app.ldap.enabled=true` 및 LDAP 설정만 하면 됨.
    - DB 사용: ERP 사용자 생성/수정 시 WiseMapping `COLLABORATOR`/`ACCOUNT`에 동일인 생성/갱신하는 연동 코드를 ERP 쪽에 추가하거나, WiseMapping 쪽에 “ERP 사용자 id 기반 조회” API를 추가.

**필수 소스**

- `wise-api/` 전체.
- `wise-api/src/main/java/com/wisemapping/security/` (JWT, UserDetails 등).
- `wise-api/src/main/java/com/wisemapping/filter/JwtAuthenticationFilter.java`.
- `wise-api/src/main/java/com/wisemapping/config/AppConfig.java` (Security, CORS).

---

## 6. 통합 시 반드시 건드릴 설정 요약

| 설정 항목 | 파일/위치 | 설명 |
|-----------|-----------|------|
| DB URL/계정 | `application.yml` 또는 외부 설정 | ERP DB와 같은 서버/스키마 쓸지 결정 |
| API/UI base URL | `app.site.api-base-url`, `app.site.ui-base-url` | ERP 도메인/경로에 맞게 설정 |
| CORS | `app.security.corsAllowedOrigins` | ERP 프론트 오리진 허용 |
| JWT secret | `app.jwt.secret` | ERP와 공유 시 동일 시크릿 사용 가능 (정책에 따라) |
| Context path | `server.servlet.context-path` (없으면 추가) | 예: `/wisemapping-api` |
| LDAP | `app.ldap.*`, `spring.ldap.*` | ERP LDAP와 동일하게 하면 단일 로그인 가능 |
| OAuth2 | `spring.security.oauth2.client.registration.*` | ERP에서 Google 등 SSO 쓰면 동일 클라이언트로 설정 가능 |

---

## 7. 같은 AWS 톰캣 서버에 ERP · WiseMapping 분리 배포

같은 **AWS 인스턴스(EC2 등) 한 대**에서 **톰캣 위에 ERP와 WiseMapping을 두 개의 애플리케이션으로 분리**해 띄우는 구성을 기준으로 합니다.

### 7.1 배포 구조 개요

```
                    [ AWS EC2 (같은 서버) ]
    ┌─────────────────────────────────────────────────────────────┐
    │  Nginx / Apache (선택)                                       │
    │  - / 또는 /erp        → ERP (8080)                            │
    │  - /wisemapping-api/  → WiseMapping (8081)                     │
    ├─────────────────────────────────────────────────────────────┤
    │  톰캣 1 (Java 8)          │  톰캣 2 또는 Spring Boot JAR (Java 17+)  │
    │  포트 8080                 │  포트 8081                              │
    │  ERP WAR (context: /erp)   │  WiseMapping (context: /wisemapping-api) │
    └─────────────────────────────────────────────────────────────┘
```

- **ERP**: 기존 톰캣(Java 8)에 ERP WAR 배포, context path 예: `/` 또는 `/erp`.
- **WiseMapping**: 별도 포트(예: 8081)에서 실행. **같은 JVM/같은 톰캣에 넣지 않으므로** Java 17 이상만 있으면 됨.

### 7.2 방식 A: 한 서버에 톰캣 두 대 (포트 분리) — 권장 (ERP Java 8 유지)

ERP는 Java 8 톰캣, WiseMapping은 Java 17 이상에서 별도로 실행합니다.

| 항목 | ERP | WiseMapping |
|------|-----|-------------|
| **실행 방식** | 기존 톰캣에 WAR 배포 | **실행 가능 JAR**(`java -jar`) 또는 톰캣(Java 17)에 WAR 배포 |
| **포트** | 8080 (기존 유지) | **8081** (또는 다른 비충돌 포트) |
| **Context path** | `/` 또는 `/erp` | **`/wisemapping-api`** (아래 설정 참고) |
| **JDK** | Java 8 | Java 17 이상 (같은 서버에 JDK 17 설치 후 사용) |

**WiseMapping 실행 예 (같은 서버에서)**

- WiseMapping은 현재 **실행 가능 JAR**로 빌드됨. 별도 톰캣에 올리지 않고 **Spring Boot 내장 톰캣**으로 8081에서 띄우면 됨.

```bash
# 빌드
mvn -f wise-api/pom.xml clean package -DskipTests

# 포트·context path 지정 후 실행 (같은 서버에서)
java -jar wise-api/target/wisemapping-api.jar \
  --server.port=8081 \
  --server.servlet.context-path=/wisemapping-api
```

- 서버 재기동 시에도 WiseMapping만 8081로 띄우면 되므로, **systemd / 스크립트**로 ERP 톰캣과 WiseMapping 프로세스를 각각 등록해 두면 됨.

**설정 파일로 고정하려면** (외부 `application.yml` 또는 프로파일):

```yaml
# 예: /opt/wisemapping/application-erp.yml
server:
  port: 8081
  servlet:
    context-path: /wisemapping-api

app:
  site:
    api-base-url: https://your-domain.com/wisemapping-api   # 외부에서 접근할 최종 URL
    ui-base-url: https://your-domain.com                    # ERP 프론트 주소
  security:
    corsAllowedOrigins: https://your-domain.com
```

실행 시:

```bash
java -jar wisemapping-api.jar --spring.config.additional-location=file:/opt/wisemapping/application-erp.yml
```

### 7.3 방식 B: 한 톰캣에 WAR 두 개 (context path만 분리)

**한 대의 톰캣**에 ERP WAR와 WiseMapping WAR를 **둘 다** 배포하려면, 톰캣과 두 애플리케이션 모두 **Java 17 이상**이어야 합니다. (Spring Boot 3 = Java 17 최소)

- ERP를 Java 17로 올릴 수 있을 때만 선택하는 방식입니다.
- 톰캣 한 대, 포트 하나(예: 8080).
  - ERP: context path 예: `/erp` (WAR 이름 또는 `context.xml`로 지정).
  - WiseMapping: context path 예: `/wisemapping-api` (WAR 배포 시 해당 경로로 노출).

WiseMapping을 **WAR로 배포**하려면:

- `pom.xml`: `<packaging>war</packaging>`, `spring-boot-starter-tomcat`을 `<scope>provided</scope>` 로 두고,
- `Application`에서 `SpringBootServletInitializer` 상속해 `configure()` 오버라이드하는 방식으로 변경이 필요합니다. (현재 레포는 JAR 기준이라, WAR 화는 별도 작업입니다.)

**정리:**  
- **ERP Java 8 유지**가 목표라면 **방식 A(톰캣 두 대 또는 톰캣 + JAR)** 를 쓰고,  
- **한 톰캣에 WAR 두 개**로 가려면 ERP를 Java 17로 올린 뒤 방식 B를 검토하면 됩니다.

### 7.4 리버스 프록시로 단일 진입점 (선택)

같은 도메인에서 `/`는 ERP, `/wisemapping-api/`는 WiseMapping으로 보내려면 Nginx 등에서 포트만 분기하면 됩니다.

**Nginx 예시**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # ERP (기존 톰캣)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WiseMapping API (별도 포트)
    location /wisemapping-api/ {
        proxy_pass http://127.0.0.1:8081/wisemapping-api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- HTTPS는 AWS ALB/ACM 또는 Nginx에서 SSL 처리 후 위와 동일하게 `proxy_pass`만 적용하면 됨.
- 이렇게 하면 **외부 기준 API 주소**는 `https://your-domain.com/wisemapping-api` 가 되고, `app.site.api-base-url` 에 이 값을 넣으면 됨.

### 7.5 같은 서버 배포 시 체크리스트

- [ ] **포트**: ERP 톰캣(예: 8080), WiseMapping(예: 8081) 충돌 없이 할당.
- [ ] **Context path**: WiseMapping `server.servlet.context-path=/wisemapping-api` 로 고정.
- [ ] **URL 설정**: `app.site.api-base-url` = `https://your-domain.com/wisemapping-api` (리버스 프록시 사용 시).
- [ ] **CORS**: `app.security.corsAllowedOrigins` 에 ERP/프론트 오리진(예: `https://your-domain.com`) 포함.
- [ ] **DB**: WiseMapping 전용 스키마/DB 또는 ERP와 공유 시 connection 풀·URL 분리 여부 확인.
- [ ] **프로세스 관리**: ERP 톰캣 + WiseMapping JAR 각각 systemd 또는 배포 스크립트로 기동/재기동.

---

## 8. 라이선스 및 의무 사항

- **WiseMapping Public License, Version 1.0**  
  - Apache 2.0 기반 + **“powered by WiseMapping”** 문구를 각 UI 화면에 노출해야 함.  
  - 상세: `LICENSE.md` 참고.  
- ERP UI에 WiseMapping 화면을 그대로 포함하면, 해당 화면에 위 문구가 보이도록 해야 합니다.  
- 상표 “WiseMapping” 사용 권한은 라이선스에 따르며, 필요 시 권리자와 협의하는 것이 좋습니다.

---

## 9. 체크리스트 — ERP 모듈로 붙일 때

- [ ] **백엔드**: `wise-api/` 전체를 ERP 레포에 포함할지, 별도 서비스로 둘지 결정.
- [ ] **프론트**: WiseMapping 프론트를 쓸지, ERP만 쓸지 결정.
- [ ] **인증**: ERP SSO/JWT와 WiseMapping JWT/LDAP 중 어떤 방식으로 통합할지 결정.
- [ ] **배포 방식**: 같은 AWS 서버에서 **톰캣 두 대(또는 톰캣 + WiseMapping JAR)** 로 분리할지 결정 (§7).
- [ ] **DB**: 독립 스키마 vs ERP와 공유 (공유 시 엔티티/스키마 변경 계획).
- [ ] **URL/경로**: context-path (`/wisemapping-api`), api-base-url, ui-base-url, CORS 설정.
- [ ] **같은 서버 배포**: 포트(ERP 8080, WiseMapping 8081), context-path, 리버스 프록시(Nginx 등) (§7.5).
- [ ] **설정 분리**: `application.yml`은 기본값만 두고, ERP 환경별로 `spring.config.additional-location` 등으로 덮어쓰기.
- [ ] **라이선스**: “powered by WiseMapping” 노출 및 라이선스 준수.

이 가이드를 기준으로 “어떤 소스를 어디에 두고, 어떤 시나리오로 붙일지”만 정하면, 실제 통합 작업은 단계별로 진행할 수 있습니다.  
특정 시나리오(예: “우리 ERP는 JWT만 쓰고 DB는 완전 분리”)를 정해 주시면, 그에 맞춰 더 구체적인 단계별 작업 목록도 정리해 드릴 수 있습니다.
