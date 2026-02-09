# WiseMapping 전체 Docker 실행 (MySQL 사용)

ERP 시스템과 연동하기 위한 WiseMapping 전체 애플리케이션(Frontend + Backend)을 Docker로 실행하는 방법입니다.

## 요약

| 구성        | 실행 방법 |
|------------|-----------|
| **Frontend + Backend**  | Docker (포트 3000) |
| **Database** | 외부 MySQL 서버 (61.97.187.218:3307) |

---

## 1. Docker 이미지 빌드

**wisemapping-open-source** 프로젝트 루트에서 실행하세요.

```bash
cd wisemapping-open-source

docker build -f distribution/app/Dockerfile -t wisemapping-app .
```

> **참고**: 이 이미지는 프론트엔드와 백엔드를 모두 포함합니다. 빌드에 시간이 걸릴 수 있습니다.

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

## 3. 애플리케이션 실행

이 디렉터리에서 Docker Compose를 실행하세요:

```bash
cd distribution/app-mysql

# Windows PowerShell
docker-compose up -d

# Linux/Mac
docker-compose up -d
```

- Frontend + Backend: http://localhost:3000
- DB: 외부 MySQL 서버 사용

---

## 4. 동작 확인

1. 브라우저에서 http://localhost:3000 접속
2. API 확인:
   ```bash
   curl http://localhost:3000/api/restful/app/config
   ```
3. 로그 확인:
   ```bash
   docker logs wisemapping-app
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

이제 ERP 시스템에서 `http://localhost:3000`으로 WiseMapping에 접근할 수 있습니다.

---

## 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `APP_PORT` | 아니오 | `3000` | 애플리케이션 노출 포트 (호스트) |
| `JAVA_OPTS` | 아니오 | `-Xmx1024m -Xms512m` | JVM 옵션 |

---

## 문제 해결

### 포트 충돌

다른 포트를 사용하려면:

```bash
# Windows PowerShell
$env:APP_PORT="8080"
docker-compose up -d
```

그리고 ERP 시스템의 `global.properties`도 수정:
```properties
wisemapping.baseUrl=http://localhost:8080
```

### MySQL 연결 실패

1. `app.yml`의 MySQL 연결 정보 확인
2. Docker 컨테이너에서 외부 MySQL 서버 접근 가능한지 확인:
   ```bash
   docker exec -it wisemapping-app ping 61.97.187.218
   ```

### 로그 확인

```bash
# 실시간 로그
docker logs -f wisemapping-app

# 최근 100줄
docker logs --tail 100 wisemapping-app
```

---

## 컨테이너 중지/제거

```bash
# 중지
docker-compose stop

# 중지 및 제거
docker-compose down
```

