"use client";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";
import TodoCard from "./TodoCard";

/**
 * 할 일 목록 컴포넌트의 Props 타입
 */
interface TodoListProps {
  /** 표시할 할 일 목록 */
  todos: Todo[];
  /** 완료 상태 토글 핸들러 */
  onToggleComplete?: (id: string) => void;
  /** 할 일 수정 핸들러 */
  onEdit?: (todo: Todo) => void;
  /** 할 일 삭제 핸들러 */
  onDelete?: (id: string) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 할 일 목록을 표시하는 컴포넌트입니다.
 * 할 일 목록이 비어있을 경우 빈 상태 UI를 표시합니다.
 */
const TodoList = ({
  todos,
  onToggleComplete,
  onEdit,
  onDelete,
  className,
}: TodoListProps) => {
  /**
   * 할 일 목록이 비어있는지 확인합니다.
   */
  if (todos.length === 0) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>할 일이 없습니다</EmptyTitle>
          <EmptyDescription>새로운 할 일을 추가해보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TodoList;

