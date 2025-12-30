-- =============================================
-- AI 할 일 관리 서비스 데이터베이스 스키마
-- Supabase 용 SQL 스크립트
-- =============================================

-- 1. 사용자 프로필 테이블 생성
-- auth.users 테이블과 1:1 연결되는 확장 프로필 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. 할 일 테이블 생성
-- PRD 문서의 요구사항을 기반으로 한 todos 테이블
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- 인덱스 생성 (성능 최적화)
-- =============================================

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- todos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_date ON public.todos(created_date);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_category ON public.todos USING GIN(category);

-- 복합 인덱스 (자주 사용되는 필터 조합)
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON public.todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON public.todos(user_id, priority);

-- =============================================
-- RLS (Row Level Security) 활성화
-- =============================================

-- users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- todos 테이블 RLS 활성화
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책 (보안 규칙) 생성
-- =============================================

-- users 테이블 정책
-- 사용자는 자신의 프로필만 조회 가능
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- 새 사용자 프로필 생성 허용
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- todos 테이블 정책
-- 사용자는 자신의 할 일만 조회 가능
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
CREATE POLICY "Users can view own todos" 
  ON public.todos FOR SELECT 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 생성 가능
DROP POLICY IF EXISTS "Users can create own todos" ON public.todos;
CREATE POLICY "Users can create own todos" 
  ON public.todos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 수정 가능
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users can update own todos" 
  ON public.todos FOR UPDATE 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users can delete own todos" 
  ON public.todos FOR DELETE 
  USING (auth.uid() = user_id);

-- =============================================
-- 트리거 함수 생성 (자동 updated_at 업데이트)
-- =============================================

-- updated_at 필드 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- todos 테이블 트리거
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 사용자 프로필 자동 생성 함수
-- =============================================

-- 새 사용자 가입 시 자동으로 프로필 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 새 사용자 생성 시 자동으로 프로필 생성하는 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 초기 데이터 (선택사항)
-- =============================================

-- 카테고리 enum 값들을 위한 체크 제약조건
-- (이미 category는 TEXT[] 타입으로 정의되어 있어 유연하게 사용 가능)

-- =============================================
-- 권한 설정
-- =============================================

-- 인증된 사용자가 테이블에 접근할 수 있도록 권한 부여
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.todos TO authenticated;

-- 공개 접근이 필요한 경우 (예: 회원가입 시)
GRANT INSERT ON public.users TO anon;

-- =============================================
-- 스키마 완료
-- =============================================

-- 이 스키마를 Supabase SQL 에디터에서 실행하면
-- 1. 사용자 프로필 테이블 (public.users)
-- 2. 할 일 테이블 (public.todos)
-- 3. 적절한 RLS 정책
-- 4. 자동화된 트리거들
-- 이 모두 설정됩니다.

-- 참고: auth.users는 Supabase에서 자동으로 관리되므로 별도 생성 불필요