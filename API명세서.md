# Shadowforge - API 명세서 (v1.0)

**Base URL:** http://localhost:3000/api (개발 환경)

**인증 방식:** Header에 "Authorization: Bearer <Access_Token>" 추가

---

## 1. Auth (인증)

구글 로그인을 처리하고 서비스 이용을 위한 JWT(Access Token)를 발급합니다.

### 1.1 구글 로그인 및 토큰 발급
프론트엔드에서 구글 로그인 후 받은 accessToken을 서버로 보내 검증하고, 우리 서비스 전용 JWT를 받습니다.

- URL: /auth/google
- Method: POST
- Auth Required: NO
```
[Request Body]
{
  "token": "google_access_token_received_from_frontend"
}

[Response - 201 Created]
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...", 
  "user": {
    "id": "uuid-user-1234",
    "nickname": "ShadowHunter",
    "email": "user@gmail.com"
  }
}
```
---

## 2. User (사용자)

로그인한 사용자의 정보를 관리합니다.

### 2.1 로그인한 유저 정보 조회
- URL: /users/me
- Method: GET
- Auth Required: YES

[Response - 200 OK]
{
  "id": "uuid-user-1234",
  "email": "user@gmail.com",
  "nickname": "ShadowHunter",
  "createdAt": "2026-02-02T10:00:00Z"
}

---

## 3. Game Data (세이브/로드)

플레이어의 진행 상황(HP, 골드, 인벤토리 등)을 저장하고 불러옵니다.
*복잡한 게임 상태는 JSON 형태로 통째로 저장합니다.*

### 3.1 게임 불러오기 (Load)
- URL: /game/save
- Method: GET
- Auth Required: YES

[Response - 200 OK]
(저장된 데이터가 없으면 null 반환)
{
  "slotId": 1,
  "updatedAt": "2026-02-02T12:30:00Z",
  "playerData": {
    "hp": 80,
    "maxHp": 100,
    "gold": 500,
    "currentFloor": 3
  },
  "inventoryData": [
    { "itemId": "potion_hp_s", "count": 3 },
    { "itemId": "sword_iron", "equipped": true }
  ]
}

### 3.2 게임 저장하기 (Save)
- URL: /game/save
- Method: POST
- Auth Required: YES

[Request Body]
{
  "playerData": {
    "hp": 80,
    "maxHp": 100,
    "gold": 500,
    "currentFloor": 3
  },
  "inventoryData": [
    { "itemId": "potion_hp_s", "count": 3 },
    { "itemId": "sword_iron", "equipped": true }
  ]
}

[Response - 200 OK]
{
  "message": "Game saved successfully",
  "savedAt": "2026-02-02T12:35:00Z"
}

---

## 4. Ranking (랭킹)

게임 클리어 기록을 저장하고 순위를 조회합니다.

### 4.1 랭킹 리스트 조회
- URL: /rankings
- Method: GET
- Query Params:
  - limit: (Optional) 가져올 개수 (기본 10)
  - page: (Optional) 페이지 번호 (기본 1)
- Auth Required: NO

[Response - 200 OK]
[
  {
    "rank": 1,
    "nickname": "Faker",
    "score": 9999,
    "clearTime": 1205,
    "playedAt": "2026-01-30T15:00:00Z"
  },
  {
    "rank": 2,
    "nickname": "ShadowHunter",
    "score": 8500,
    "clearTime": 1500,
    "playedAt": "2026-02-02T10:00:00Z"
  }
]

### 4.2 게임 결과(랭킹) 등록
게임 클리어 또는 사망 시 결과를 전송합니다.

- URL: /rankings
- Method: POST
- Auth Required: YES

[Request Body]
{
  "score": 8500,
  "clearTime": 1500, 
  "isClear": true,
  "finalFloor": 10
}

[Response - 201 Created]
{
  "message": "Ranking submitted",
  "myRank": 2
}

---