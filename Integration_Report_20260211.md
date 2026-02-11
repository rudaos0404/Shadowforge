# Shadowforge Integration & Troubleshooting Report

본 문서는 클라이언트와 서버를 연동하는 과정에서 발생한 기술적 문제들과 그 해결책을 정리한 기록입니다.

## 1. 초기 연동 과정 (Client-Server Handshake)
- **CORS 설정**: NestJS 서버에서 `app.enableCors()`를 추가하여 클라이언트의 요청을 허용함.
- **Global Prefix 부여**: 모든 API 경로 앞에 `/api`를 붙여 경로를 표준화함.
- **자동 사용자 생성**: `startGame` 시 사용자 "Player1"이 DB에 없을 경우 자동으로 생성하는 로직 구현.
- **기본 데이터 싱크**: 클라이언트 진입 시 `GET /api/users/me`를 통해 서버의 게임 데이터를 Zustand Store로 가져오도록 연동.

## 2. 발생한 주요 오류 및 해결 방법

| 구분 | 오류 내용 (Error) | 해결 방법 (Solution) |
| :--- | :--- | :--- |
| **통신** | `POST /api/game/start` 404/500 오류 | `AppModule`에 `Monster` 엔티티 등록 누락 확인 및 수정. |
| **배틀** | 전투 종료 후 BattlePage 유지 현상 | 승리 시 전적 화면(`VictoryOverlay`)을 띄우고 보상 수령 시 `/turn`으로 이동하도록 네비게이션 로직 보강. |
| **네비게이션** | 도망(Escape) 버튼 클릭 시 배틀 루프 | 서버에 `/battle/escape` 엔티티를 추가하여 서버 상태를 `SELECTING`으로 먼저 변경한 후 클라이언트 이동하도록 수정. |
| **프론트엔드** | React Hook Size Mismatch 오류 | `useEffect` 종속성 배열 변경 시 Hot Reload 충돌 발생. 브라우저 새로고침(F5) 안내 및 해결. |
| **서버** | `404 Not Found` (새 기능 적용 안 됨) | 소스 코드 수정 후 빌드를 하지 않아 발생. `npm run build` 후 서버 재시작 안내 및 직접 수행. |
| **서버** | `EADDRINUSE: listen :: 3000` | 이전 서버 프로세스가 종료되지 않아 발생. `netstat`으로 PID 확인 후 `taskkill`로 강제 종료 후 재기동. |
| **빌드** | `AppService` 못 찾는 오류 | 리팩토링 과정에서 삭제한 `AppService`가 `AppModule`에 남아있어 발생. 모듈 파일 정리 후 해결. |

## 3. 기능 개선 및 동기화 최적화

### 휴식(Rest) 매커니즘 수정 (중요)
- **문제**: 휴식 선택 시 회복량이 100으로 설정되어 UI(30)와 달랐고, 선택 시점과 완료 시점에 각각 회복되는 '중복 회복' 발생.
- **해결**: 
    - 서버 회복량을 30 HP로 통일.
    - `confirmRest` 라는 새로운 원자적(Atomic) API를 생성하여 '회복 + 다음 턴 진행'을 한 번에 처리.
    - 클라이언트에서 비동기 작업을 순차적으로 `await` 처리하여 Race Condition 방지.

### 데이터 실시간 동기화
- 전투 결과, 보상 수령, 휴식 등의 작업 후에 서버가 항상 최신 `HP`, `Gold`, `Potions` 정보를 반환하도록 수정.
- 클라이언트 Store의 `selectOption`, `nextTurn` 등에서 이 반환값을 즉시 반영하여 화면 데이트를 일치시킴.

---
*본 문서는 Shadowforge 프로젝트의 안정적인 운영과 유지보수를 위해 작성되었습니다.*
