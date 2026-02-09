# Backend API Docker 실행 (MySQL 사용)

ERP 시스템과 연동하기 위한 WiseMapping Backend API를 Docker로 실행하는 방법입니다.

## 요약

| 구성        | 실행 방법 |
|------------|-----------|
| **Backend**  | Docker (API 이미지, 포트 8081) |
| **Database** | 외부 MySQL 서버 (61.97.187.218:3307) |

---

## 1. Backend API Docker 이미지 빌드

**wisemapping-open-source** 프로젝트 루트에서 실행하세요.

### 방법 A: Maven 없이 Docker만 사용 (권장)

호스트에 Maven이 없어도 됩니다. Docker가 소스에서 JAR을 빌드합니다.

```bash
cd wisemapping-open-source

docker build -f distribution/api/Dockerfile.from-source -t wisemapping-api .
```

### 방법 B: Maven으로 JAR 빌드 후 이미지 빌드

Maven이 설치되어 있다면:

```bash
cd wisemapping-open-source

mvn -f wise-api/pom.xml clean package -DskipTests
docker build -f distribution/api/Dockerfile -t wisemapping-api .
```

---

## 2. 설정 파일 수정

`app.yml` 파일을 열어서 MySQL 연결 정보를 확인/수정하세요:

```yaml
spring:
  datasource:
    url: jdbc:mysql://YOUR_MYSQL_HOST:PORT/DATABASE_NAME?...
    username: YOUR_USERNAME
    password: YOUR_PASSWORD
```

---

## 3. Backend 실행

이 디렉터리에서 Docker Compose를 실행하세요:

```bash
cd distribution/api-only-mysql

# Windows PowerShell
docker-compose up -d

# Linux/Mac
docker-compose up -d
```

- API: http://localhost:8081 (기본값, `API_PORT` 환경변수로 변경 가능)
- DB: 외부 MySQL 서버 사용

---

## 4. 동작 확인

1. Backend가 8081에서 떠 있는지 확인:
   ```bash
   curl http://localhost:8081/api/restful/app/config
   ```
   또는 브라우저에서 http://localhost:8081/api/restful/app/config 접속 (JSON이 보이면 정상)

2. 로그 확인:
   ```bash
   docker logs wisemapping-api
   ```

---

## 5. ERP 시스템 연동

ERP 시스템의 `global.properties` 설정:

```properties
wisemapping.enabled=true
wisemapping.baseUrl=http://localhost:3000
wisemapping.contextPath=
wisemapping.loginPath=/c/login
```

**중요**: 
- `wisemapping.baseUrl`은 프론트엔드 URL입니다 (포트 3000)
- Backend API는 포트 8081에서 실행됩니다
- 프론트엔드가 별도로 실행되어야 하며, 프론트엔드가 `/api` 요청을 `http://localhost:8081`로 프록시해야 합니다

---

## 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `API_PORT` | 아니오 | `8081` | API 노출 포트 (호스트) |
| `JAVA_OPTS` | 아니오 | `-Xmx1024m -Xms512m` | JVM 옵션 |

---

## 문제 해결

### 포트 충돌

다른 포트를 사용하려면:

```bash
# Windows PowerShell
$env:API_PORT="8082"
docker-compose up -d
```

### MySQL 연결 실패

1. `app.yml`의 MySQL 연결 정보 확인
2. Docker 컨테이너에서 외부 MySQL 서버 접근 가능한지 확인:
   ```bash
   docker exec -it wisemapping-api ping 61.97.187.218
   ```

### 로그 확인

```bash
# 실시간 로그
docker logs -f wisemapping-api

# 최근 100줄
docker logs --tail 100 wisemapping-api
```

---

## 컨테이너 중지/제거

```bash
# 중지
docker-compose stop

# 중지 및 제거
docker-compose down
```

