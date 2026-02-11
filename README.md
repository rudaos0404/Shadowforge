# Shadowforge - 개발 환경 구축 가이드

본 가이드는 프로젝트를 로컬에서 실행하기 위한 필수 설정 단계를 설명합니다.

## 1. 필수 요구 사양
- **Node.js**: v18 이상 권장
- **Database**: MariaDB 또는 MySQL (포트: 3306)

## 2. 데이터베이스 설정 (중요)
서버 실행 전, 다음 데이터베이스가 생성되어 있어야 하며 접근 권한이 필요합니다.

- **DB Name**: `game_db`
- **Username**: `root`
- **Password**: `root` (없을 경우 `server/src/modules/app.module.ts` 수정 필요)

### SQL 초기화 (권장)
```sql
CREATE DATABASE IF NOT EXISTS game_db;
```
*엔티티 테이블은 서버 실행 시 `synchronize: true` 설정에 의해 자동으로 생성됩니다.*

## 3. 서버 (Server) 실행
```bash
cd server
npm install
npm run start:dev
```
- 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.
- API 엔드포인트는 `http://localhost:3000/api` 입니다.

## 4. 클라이언트 (Client) 실행
```bash
cd client
npm install
npm run dev
```
- 클라이언트는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 5. 트러블슈팅
- **EADDRINUSE (포트 충돌)**: 이미 3000번이나 5173번 포트가 사용 중인 경우 프로세스를 종료하고 다시 실행하세요.
- **DB Connection Error**: DB 서비스가 구동 중인지, `game_db`가 생성되어 있는지 확인하세요.
- **Build Error**: `server` 디렉토리에서 불필요한 테스트 파일(`*.spec.ts`)이 빌드를 방해할 경우 삭제 후 시도하세요. (최신 main 브랜치에서 해결됨)
