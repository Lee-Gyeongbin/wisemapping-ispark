# 로컬 프론트엔드 사용 가이드

이 가이드는 로컬에서 수정한 프론트엔드를 Docker 이미지에 포함시키는 방법을 설명합니다.

## 사전 준비

### 1. 디렉토리 구조 설정

프론트엔드 저장소를 현재 저장소와 같은 레벨에 클론합니다:

```
parent-dir/
  ├── wisemapping-open-source/  (현재 저장소)
  └── wisemapping-frontend/     (프론트엔드 저장소)
```

### 2. 프론트엔드 저장소 클론

```bash
cd ..
git clone https://github.com/wisemapping/wisemapping-frontend.git
cd wisemapping-open-source
```

### 3. 환경 변수 설정

```bash
export WISEMAPPING_DATA_DIR=/path/to/your/data
export POSTGRES_PASSWORD=your-secure-password
```

## 사용 방법

### 1. 프론트엔드 수정

프론트엔드 저장소에서 원하는 수정을 진행합니다:

```bash
cd ../wisemapping-frontend
# 여기서 로그인 페이지 등 원하는 파일 수정
```

### 2. Docker 이미지 빌드

로컬 프론트엔드를 포함한 이미지를 빌드합니다:

```bash
cd distribution/app-postgresql
docker-compose -f docker-compose.local.yml build
```

### 3. 컨테이너 실행

```bash
docker-compose -f docker-compose.local.yml up -d
```

### 4. 접속 확인

브라우저에서 `http://localhost` 또는 `http://localhost:${WISEMAPPING_PORT}`로 접속하여 수정된 프론트엔드를 확인합니다.

## 프론트엔드 경로 커스터마이징

프론트엔드가 다른 경로에 있다면, `docker-compose.local.yml`의 `FRONTEND_PATH` 인자를 수정하세요:

```yaml
build:
  args:
    FRONTEND_PATH: ../custom-frontend-path  # 상대 경로로 지정
```

또는 빌드 시 직접 지정:

```bash
docker-compose -f docker-compose.local.yml build \
  --build-arg FRONTEND_PATH=../custom-frontend-path
```

## 주의사항

1. **빌드 컨텍스트**: `docker-compose.local.yml`의 `context: ../../`는 상위 디렉토리를 빌드 컨텍스트로 사용합니다. 이는 프론트엔드 디렉토리에 접근하기 위함입니다.

2. **프론트엔드 빌드**: 프론트엔드는 Docker 빌드 과정에서 자동으로 빌드됩니다. 로컬에서 미리 빌드할 필요는 없습니다.

3. **캐시**: 프론트엔드를 수정한 후에는 `--no-cache` 옵션을 사용하여 완전히 새로 빌드할 수 있습니다:

```bash
docker-compose -f docker-compose.local.yml build --no-cache
```

## 문제 해결

### 프론트엔드를 찾을 수 없음

- `FRONTEND_PATH`가 올바른지 확인하세요
- 빌드 컨텍스트(상위 디렉토리)에서 프론트엔드 디렉토리가 보이는지 확인하세요

### 빌드 실패

- 프론트엔드 디렉토리에 `packages/webapp` 경로가 있는지 확인하세요
- 프론트엔드의 `package.json`과 `yarn.lock` 파일이 있는지 확인하세요

