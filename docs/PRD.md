# PRD (Product Requirements Document)

## 1. 제품 개요

### 1.1 제품명

AI 기반 할 일 관리 서비스 (가칭)

### 1.2 목적

본 제품은 개인 및 업무 사용자를 대상으로 **할 일(To-do) 관리**를 효율적으로 수행할 수 있도록 지원하는 웹 애플리케이션이다. 기본적인 CRUD 기반 할 일 관리 기능에 더해, **AI를 활용한 할 일 자동 생성 및 요약/분석 기능**을 제공하여 사용자의 생산성을 극대화하는 것을 목표로 한다.

### 1.3 타겟 사용자

* 업무 일정과 개인 일정을 함께 관리하는 직장인
* 학습 계획과 과제를 체계적으로 관리하려는 학생
* 간단하지만 지능적인 할 일 관리 도구를 원하는 일반 사용자

---

## 2. 주요 기능 요구사항

### 2.1 사용자 인증 (Authentication)

#### 기능 설명

* 이메일/비밀번호 기반 로그인 및 회원가입
* Supabase Auth를 활용하여 인증 및 세션 관리

#### 상세 요구사항

* 회원가입 시 이메일 인증(Optional)
* 로그인 상태 유지 (Refresh Token 기반)
* 로그아웃 기능 제공

---

### 2.2 할 일 관리 (To-do CRUD)

#### 기능 설명

사용자는 자신의 할 일을 생성, 조회, 수정, 삭제할 수 있다.

#### 할 일 필드 정의

| 필드명          | 타입        | 설명                    |
| ------------ | --------- | --------------------- |
| id           | UUID      | 할 일 고유 ID             |
| user_id      | UUID      | 사용자 ID (users 테이블 FK) |
| title        | string    | 할 일 제목                |
| description  | text      | 상세 설명                 |
| created_date | timestamp | 생성일                   |
| due_date     | timestamp | 마감일                   |
| priority     | enum      | high / medium / low   |
| category     | string[]  | 업무 / 개인 / 학습 등        |
| completed    | boolean   | 완료 여부                 |

#### 상세 요구사항

* 할 일 생성 시 필수 입력: title
* 완료 여부 토글 기능 제공
* 마감일이 지난 경우 자동으로 `지연` 상태로 분류 (UI 기준)

---

### 2.3 검색, 필터, 정렬 기능

#### 2.3.1 검색

* 제목(title)과 설명(description)을 기준으로 부분 검색

#### 2.3.2 필터링

* 우선순위: 높음 / 중간 / 낮음
* 카테고리: 업무 / 개인 / 학습 (다중 선택 가능)
* 진행 상태:

  * 진행 중 (completed = false && due_date >= now)
  * 완료 (completed = true)
  * 지연 (completed = false && due_date < now)

#### 2.3.3 정렬

* 우선순위순 (high → low)
* 마감일순 (오름차순)
* 생성일순 (내림차순)

---

### 2.4 AI 할 일 생성 기능

#### 기능 설명

사용자가 자연어로 입력한 문장을 AI가 분석하여 구조화된 할 일 데이터로 변환한다.

#### 입력 예시

```
"내일 오전 10시에 팀 회의 준비"
```

#### 출력 예시

```json
{
  "title": "팀 회의 준비",
  "description": "내일 오전 10시에 있을 팀 회의를 위해 자료 작성하기",
  "created_date": "YYYY-MM-DD HH:MM",
  "due_date": "YYYY-MM-DD 10:00",
  "priority": "high",
  "category": ["업무"],
  "completed": false
}
```

#### 상세 요구사항

* Google Gemini API 기반 자연어 처리
* 날짜/시간 표현 자동 파싱
* 결과는 사용자가 저장 전에 수정 가능

---

### 2.5 AI 요약 및 분석 기능

#### 기능 설명

버튼 클릭 한 번으로 AI가 사용자의 전체 할 일을 분석하고 요약 정보를 제공한다.

#### 제공 요약 유형

##### 1) 일일 요약

* 오늘 완료한 할 일 목록
* 오늘 남아 있는 할 일 요약

##### 2) 주간 요약

* 이번 주 전체 할 일 수
* 완료율 (%)
* 우선순위별 분포 요약

#### 상세 요구사항

* AI 분석 결과는 텍스트 형태로 제공
* 요약 기준 날짜는 사용자 로컬 타임존 기준

---

## 3. 화면 구성 (UI/UX)

### 3.1 로그인 / 회원가입 화면

* 이메일 / 비밀번호 입력 폼
* 로그인 / 회원가입 전환
* 인증 에러 메시지 표시

---

### 3.2 할 일 관리 메인 화면

#### 구성 요소

* 상단: 검색 바, 필터, 정렬 옵션
* 중앙: 할 일 목록 (리스트 또는 카드 형태)
* 하단 또는 플로팅 버튼: 할 일 추가
* AI 기능 영역:

  * AI 할 일 생성 입력창
  * AI 요약/분석 버튼

---

### 3.3 통계 및 분석 화면 (확장 기능)

#### 제공 지표

* 주간 활동량 그래프
* 완료율 추이
* 카테고리별 할 일 분포

---

## 4. 기술 스택

### 4.1 Frontend

* Next.js (App Router)
* Tailwind CSS
* shadcn/ui

### 4.2 Backend / BaaS

* Supabase

  * Auth
  * PostgreSQL
  * Row Level Security (RLS)

### 4.3 AI

* Google Gemini API

---

## 5. 데이터 구조 (Supabase)

### 5.1 users

* Supabase Auth 기본 users 테이블 사용

### 5.2 todos

```sql
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_date timestamp with time zone default now(),
  due_date timestamp with time zone,
  priority text check (priority in ('high', 'medium', 'low')),
  category text[],
  completed boolean default false
);
```

#### 보안 정책 (RLS)

* 사용자는 자신의 할 일만 조회/수정/삭제 가능

---

## 6. 비기능 요구사항

* 반응형 UI (Desktop / Tablet / Mobile)
* 초기 페이지 로딩 시간 최소화
* API 호출 실패 시 사용자 친화적 에러 처리

---

## 7. 향후 확장 아이디어

* 알림 기능 (이메일 / 푸시)
* 캘린더 연동 (Google Calendar)
* 팀 단위 할 일 공유 기능
* AI 기반 일정 재조정 제안

---

**본 PRD는 개발자가 즉시 구현에 착수할 수 있도록 작성되었으며, MVP 및 이후 확장 개발의 기준 문서로 활용한다.**
