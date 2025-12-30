"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Todo, TodoInput, TodoPriority, TodoCategory } from "@/types/todo";

/**
 * 할 일 폼 컴포넌트의 Props 타입
 */
interface TodoFormProps {
  /** 초기 할 일 데이터 (수정 모드) */
  initialData?: Todo | null;
  /** 폼 제출 핸들러 */
  onSubmit: (data: TodoInput) => void | Promise<void>;
  /** 취소 핸들러 */
  onCancel?: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 할 일 추가/편집 폼 컴포넌트입니다.
 * 제목, 설명, 마감일, 우선순위, 카테고리 정보를 입력받습니다.
 */
const TodoForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TodoFormProps) => {
  const [formData, setFormData] = useState<TodoInput>({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    category: [],
  });

  const [selectedCategories, setSelectedCategories] = useState<
    TodoCategory[]
  >([]);

  const [aiInput, setAiInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  /**
   * 초기 데이터가 변경되면 폼 데이터를 업데이트합니다.
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        due_date: initialData.due_date
          ? new Date(initialData.due_date).toISOString().slice(0, 16)
          : "",
        priority: initialData.priority || "medium",
        category: initialData.category || [],
      });
      setSelectedCategories(initialData.category || []);
    }
  }, [initialData]);

  /**
   * 폼 필드 값을 업데이트합니다.
   */
  const handleChange = (
    field: keyof TodoInput,
    value: string | TodoPriority | TodoCategory[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 카테고리 선택을 토글합니다.
   */
  const toggleCategory = (category: TodoCategory) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      handleChange("category", newCategories);
      return newCategories;
    });
  };

  /**
   * 폼 제출을 처리합니다.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    const submitData: TodoInput = {
      ...formData,
      category: selectedCategories,
    };

    await onSubmit(submitData);
  };

  /**
   * 폼을 초기화합니다.
   */
  const handleReset = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      priority: "medium",
      category: [],
    });
    setSelectedCategories([]);
  };

  /**
   * AI를 사용하여 자연어 입력을 구조화된 할 일로 변환합니다.
   */
  const handleAiGenerate = async (autoSubmit: boolean = false) => {
    if (!aiInput.trim()) {
      toast.error("할 일 내용을 입력해주세요.");
      return;
    }

    setIsAiGenerating(true);

    try {
      const response = await fetch("/api/parse-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: aiInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "할 일 생성에 실패했습니다.");
      }

      const result = await response.json();

      // due_date와 due_time을 결합하여 datetime-local 형식으로 변환
      let dueDateValue = "";
      if (result.due_date) {
        dueDateValue = result.due_date;
        if (result.due_time) {
          dueDateValue += `T${result.due_time}`;
        } else {
          dueDateValue += "T09:00";
        }
      }

      const generatedData: TodoInput = {
        title: result.title || "",
        description: result.description || "",
        due_date: dueDateValue,
        priority: result.priority || "medium",
        category: result.category || [],
      };

      // 폼 데이터 업데이트
      setFormData(generatedData);
      setSelectedCategories(result.category || []);

      if (autoSubmit) {
        // 자동으로 DB에 저장
        toast.success("AI가 할 일을 생성했습니다!");
        setAiInput(""); // 입력 필드 초기화

        // 폼 제출 (DB 저장)
        await onSubmit(generatedData);

        // 저장 후 폼 초기화
        handleReset();
        toast.success("할 일이 추가되었습니다!");
      } else {
        // 폼에만 채우기
        toast.success("AI가 할 일을 생성했습니다! 확인 후 추가 버튼을 눌러주세요.");
        setAiInput(""); // 입력 필드 초기화
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "할 일 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI 입력 섹션 */}
      <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
          <Label htmlFor="ai-input" className="text-base font-semibold">
            AI로 할 일 생성
          </Label>
        </div>
        <Textarea
          id="ai-input"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
          rows={2}
          disabled={isLoading || isAiGenerating}
          className="resize-none bg-white dark:bg-gray-950"
        />
        <p className="text-xs text-muted-foreground">
          💡 <strong>생성</strong>: 폼에 채우기 | <strong>바로 추가</strong>: 자동으로 저장
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={() => handleAiGenerate(false)}
            disabled={isLoading || isAiGenerating || !aiInput.trim()}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/20"
          >
            <Sparkles className="size-4 mr-2" />
            {isAiGenerating ? "생성 중..." : "생성"}
          </Button>
          <Button
            type="button"
            onClick={() => handleAiGenerate(true)}
            disabled={isLoading || isAiGenerating || !aiInput.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="size-4 mr-2" />
            {isAiGenerating ? "추가 중..." : "바로 추가"}
          </Button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">또는 직접 입력</span>
        </div>
      </div>

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="할 일 제목을 입력하세요"
          required
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="할 일에 대한 상세 설명을 입력하세요"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* 마감일 */}
      <div className="space-y-2">
        <Label htmlFor="due_date">마감일</Label>
        <div className="relative">
          <Input
            id="due_date"
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => handleChange("due_date", e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* 우선순위 */}
      <div className="space-y-2">
        <Label htmlFor="priority">우선순위</Label>
        <Select
          value={formData.priority || "medium"}
          onValueChange={(value) => handleChange("priority", value as TodoPriority)}
          disabled={isLoading}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="우선순위를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">중간</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 카테고리 */}
      <div className="space-y-2">
        <Label>카테고리</Label>
        <div className="flex flex-wrap gap-3">
          {(["업무", "개인", "학습"] as TodoCategory[]).map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
                disabled={isLoading}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          초기화
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title.trim()}>
          {isLoading ? "저장 중..." : initialData ? "수정" : "추가"}
        </Button>
      </div>
    </form>
  );
};

export default TodoForm;

