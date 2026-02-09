# Backend Docker + Frontend 로컬 실행

Backend만 Docker 이미지로 띄우고, Frontend는 로컬에서 개발 서버로 실행하는 방법입니다.

## 요약

| 구성        | 실행 방법 |
|------------|-----------|
| **Backend**  | Docker (API 이미지, 포트 8080) |
| **Frontend** | 로컬 Vite (포트 3000, `/api` → 8080 프록시) |

프론트엔드의 `vite.config.ts`가 이미 `/api` 요청을 `http://localhost:8080`으로 프록시하므로, Backend를 8080으로 띄우면 그대로 연동됩니다.

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

## 2. Backend 실행 (두 가지 중 선택)

### 옵션 A: API만 실행 (DB: H2 인메모리, 설정 없음)

가장 간단한 방법입니다. PostgreSQL 없이 바로 실행할 수 있습니다.

```bash
docker run -p 8080:8080 --name wisemapping-api wisemapping-api
```

- API: http://localhost:8080
- DB: 애플리케이션 기본 설정(HSQL in-memory) 사용

### 옵션 B: API + PostgreSQL (Docker Compose)

PostgreSQL을 사용하려면 이 디렉터리에서 Compose를 실행하세요.

```bash
cd wisemapping-open-source/distribution/api-only-postgresql

# 데이터 디렉터리 생성 (선택, 기본값 ./data)
mkdir -p data

# 환경 변수 설정 후 실행 (Windows PowerShell 예시)
$env:POSTGRES_PASSWORD="password"
$env:WISEMAPPING_DATA_DIR="./data"
docker-compose up -d
```

- API: http://localhost:8080 (기본값, `API_PORT`로 변경 가능)
- PostgreSQL: 포트 5432 (같은 Compose 네트워크 내부에서만 사용)

**기본 로그인 계정** (data-postgresql.sql 기준):
- 테스트: `test@wisemapping.org` / `password`
- 관리자: `admin@wisemapping.org` / `testAdmin123`

---

## 3. Frontend 로컬 실행

**wisemapping-frontend** 쪽에서 개발 서버를 띄웁니다.

```bash
cd wisemapping-frontend

# 루트에서 웹앱 패키지로 이동 후 실행 (Yarn workspace)
cd packages/webapp
yarn start:dev
# 또는
APP_CONFIG_TYPE='file:dev' yarn dev
```

- 프론트: http://localhost:3000
- API 호출: 브라우저는 `http://localhost:3000/api/...` 로 요청하고, Vite가 `http://localhost:8080/api/...` 로 프록시합니다.

---

## 4. 동작 확인

1. Backend가 8080에서 떠 있는지 확인:
   - http://localhost:8080/api/restful/app/config (JSON이 보이면 정상)
2. Frontend: http://localhost:3000 접속 후 로그인/기능 테스트

---

## 환경 변수 (옵션 B 기준)

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `POSTGRES_PASSWORD` | 예 | - | PostgreSQL 비밀번호 |
| `WISEMAPPING_DATA_DIR` | 아니오 | `./data` | PostgreSQL 데이터 저장 경로 |
| `API_PORT` | 아니오 | `8080` | API 노출 포트 |
| `POSTGRES_PORT` | 아니오 | `5432` | PostgreSQL 노출 포트 |

`app.yml`의 DB 비밀번호를 바꿨다면 Compose의 `POSTGRES_PASSWORD`도 같은 값으로 맞추세요.
