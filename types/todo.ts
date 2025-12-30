/**
 * 할 일 우선순위 타입
 */
export type TodoPriority = "high" | "medium" | "low";

/**
 * 할 일 카테고리 타입
 */
export type TodoCategory = "업무" | "개인" | "학습";

/**
 * 할 일 데이터 타입
 */
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_date: string;
  due_date?: string | null;
  priority?: TodoPriority | null;
  category?: TodoCategory[] | null;
  completed: boolean;
}

/**
 * 할 일 생성/수정을 위한 입력 데이터 타입
 */
export interface TodoInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TodoPriority;
  category?: TodoCategory[];
}

/**
 * 할 일 상태 타입 (진행 중, 완료, 지연)
 */
export type TodoStatus = "진행 중" | "완료" | "지연";

