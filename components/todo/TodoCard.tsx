"use client";

import { Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo, TodoPriority, TodoCategory } from "@/types/todo";

/**
 * 할 일 카드 컴포넌트의 Props 타입
 */
interface TodoCardProps {
  /** 표시할 할 일 데이터 */
  todo: Todo;
  /** 완료 상태 토글 핸들러 */
  onToggleComplete?: (id: string) => void;
  /** 할 일 수정 핸들러 */
  onEdit?: (todo: Todo) => void;
  /** 할 일 삭제 핸들러 */
  onDelete?: (id: string) => void;
}

/**
 * 개별 할 일을 표시하는 카드 컴포넌트입니다.
 * 할 일의 제목, 설명, 마감일, 우선순위, 카테고리 정보를 표시하고,
 * 완료 토글, 수정, 삭제 기능을 제공합니다.
 */
const TodoCard = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
}: TodoCardProps) => {
  /**
   * 우선순위에 따른 배지 스타일을 반환합니다.
   */
  const getPriorityVariant = (priority?: TodoPriority | null): "default" | "secondary" | "outline" => {
    switch (priority) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  /**
   * 우선순위 한글 표시명을 반환합니다.
   */
  const getPriorityLabel = (priority?: TodoPriority | null): string => {
    switch (priority) {
      case "high":
        return "높음";
      case "medium":
        return "중간";
      case "low":
        return "낮음";
      default:
        return "미설정";
    }
  };

  /**
   * 할 일이 지연되었는지 확인합니다.
   */
  const isOverdue = (): boolean => {
    if (!todo.due_date || todo.completed) return false;
    return new Date(todo.due_date) < new Date();
  };

  /**
   * 마감일을 포맷팅합니다.
   */
  const formatDueDate = (): string | null => {
    if (!todo.due_date) return null;
    try {
      return format(new Date(todo.due_date), "yyyy년 MM월 dd일 HH:mm", {
        locale: ko,
      });
    } catch {
      return null;
    }
  };

  const overdue = isOverdue();
  const dueDateFormatted = formatDueDate();

  /**
   * 우선순위에 따른 좌측 보더 색상을 반환합니다.
   */
  const getPriorityBorderColor = (priority?: TodoPriority | null): string => {
    if (todo.completed) return "border-l-gray-300";
    if (overdue) return "border-l-destructive";
    switch (priority) {
      case "high":
        return "border-l-primary border-l-4";
      case "medium":
        return "border-l-primary/60 border-l-4";
      case "low":
        return "border-l-primary/30 border-l-4";
      default:
        return "border-l-muted border-l-4";
    }
  };

  /**
   * 우선순위에 따른 배경색을 반환합니다.
   */
  const getPriorityBgColor = (priority?: TodoPriority | null): string => {
    if (todo.completed) return "bg-muted/30";
    if (overdue) return "bg-destructive/5";
    switch (priority) {
      case "high":
        return "bg-primary/5";
      case "medium":
        return "bg-primary/3";
      case "low":
        return "bg-primary/2";
      default:
        return "bg-card";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg border-l-4",
        getPriorityBorderColor(todo.priority),
        getPriorityBgColor(todo.priority),
        todo.completed && "opacity-70",
        overdue && !todo.completed && "border-l-destructive"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => onToggleComplete?.(todo.id)}
              className="mt-1"
              aria-label={todo.completed ? "완료 취소" : "완료 처리"}
            />
            <div className="flex-1 min-w-0">
              <CardTitle
                className={cn(
                  "text-lg",
                  todo.completed && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </CardTitle>
              {todo.description && (
                <CardDescription className="mt-2 line-clamp-2">
                  {todo.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 우선순위 및 카테고리 */}
        <div className="flex flex-wrap items-center gap-2">
          {todo.priority && (
            <Badge variant={getPriorityVariant(todo.priority)}>
              {getPriorityLabel(todo.priority)}
            </Badge>
          )}
          {todo.category && todo.category.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="size-3.5 text-muted-foreground" />
              {todo.category.map((cat, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
          {overdue && !todo.completed && (
            <Badge variant="destructive">지연</Badge>
          )}
        </div>

        {/* 마감일 */}
        {dueDateFormatted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span className={cn(overdue && !todo.completed && "text-destructive font-medium")}>
              {dueDateFormatted}
            </span>
          </div>
        )}

        {/* 생성일 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>
            생성: {format(new Date(todo.created_date), "yyyy-MM-dd HH:mm", { locale: ko })}
          </span>
        </div>
      </CardContent>

      {/* 액션 버튼 */}
      {(onEdit || onDelete) && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(todo)}
              disabled={todo.completed}
            >
              수정
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(todo.id)}
            >
              삭제
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TodoCard;

