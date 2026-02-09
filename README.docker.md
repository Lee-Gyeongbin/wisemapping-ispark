# WiseMapping Docker 설정 가이드

이 가이드는 프론트엔드와 백엔드를 Docker로 실행하는 방법을 설명합니다.

## 사전 요구사항

- Docker 및 Docker Compose 설치
- 최소 4GB RAM 권장

## 빠른 시작

### 1. 환경 변수 설정 (선택사항)

`.env` 파일을 생성하여 환경 변수를 설정할 수 있습니다:

```bash
# Database
POSTGRES_DB=wisemapping
POSTGRES_USER=wisemapping
POSTGRES_PASSWORD=wisemapping123
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=8081
JAVA_OPTS=-Xmx2048m -Xms1024m

# Frontend
FRONTEND_PORT=80
UI_BASE_URL=http://localhost

# CORS
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://localhost:3000
```

### 2. 애플리케이션 설정

`app.yml` 파일을 확인하고 필요에 따라 수정하세요. 이 파일은 백엔드 설정을 포함합니다.

### 3. Docker 이미지 빌드 및 실행

```bash
# 모든 서비스 빌드 및 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgresql
```

### 4. 애플리케이션 접근

- **프론트엔드**: http://localhost (또는 설정한 FRONTEND_PORT)
- **백엔드 API**: http://localhost:8081/api (또는 설정한 BACKEND_PORT)
- **데이터베이스**: localhost:5432 (또는 설정한 POSTGRES_PORT)

## 서비스 구성

### PostgreSQL
- 데이터베이스 서버
- 포트: 5432 (기본값)
- 데이터는 `postgres_data` 볼륨에 저장됩니다

### Backend (Spring Boot)
- Java Spring Boot API 서버
- 포트: 8081 (기본값)
- 로그는 `backend_logs` 볼륨에 저장됩니다
- PostgreSQL에 의존합니다

### Frontend (Nginx)
- React 프론트엔드 빌드 파일을 Nginx로 서빙
- 포트: 80 (기본값)
- 백엔드 API로 프록시합니다
- Backend에 의존합니다

## 유용한 명령어

```bash
# 서비스 중지
docker-compose down

# 서비스 중지 및 볼륨 삭제 (데이터 삭제)
docker-compose down -v

# 특정 서비스만 재시작
docker-compose restart backend

# 서비스 재빌드
docker-compose build

# 강제 재빌드 (캐시 없이)
docker-compose build --no-cache

# 서비스 상태 확인
docker-compose ps

# 컨테이너 내부 접속
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgresql psql -U wisemapping -d wisemapping
```

## 문제 해결

### 포트 충돌
포트가 이미 사용 중인 경우 `.env` 파일에서 포트를 변경하세요.

### 빌드 실패
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 특정 서비스만 재빌드
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

### 데이터베이스 연결 오류
- PostgreSQL이 완전히 시작될 때까지 기다려야 합니다 (healthcheck 확인)
- `app.yml`의 데이터베이스 연결 정보를 확인하세요

### 로그 확인
```bash
# 모든 로그
docker-compose logs

# 최근 100줄
docker-compose logs --tail=100

# 실시간 로그
docker-compose logs -f
```

## 개발 모드

개발 중에는 소스 코드 변경 시 재빌드가 필요합니다:

```bash
# 변경사항 반영을 위한 재빌드
docker-compose build
docker-compose up -d
```

또는 볼륨 마운트를 사용하여 개발 모드를 구성할 수 있습니다 (추가 설정 필요).

## 프로덕션 배포

프로덕션 환경에서는:
1. `.env` 파일에 강력한 비밀번호 설정
2. `app.yml`에서 보안 설정 확인
3. HTTPS 설정 (리버스 프록시 사용 권장)
4. 로그 관리 설정
5. 백업 전략 수립

