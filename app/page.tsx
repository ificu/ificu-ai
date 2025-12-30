"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Sparkles,
  LogOut,
  Search,
  Filter,
  ArrowUpDown,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";
import { TodoForm, TodoList } from "@/components/todo";
import type { Todo, TodoInput, TodoPriority, TodoStatus } from "@/types/todo";


/**
 * 메인 페이지 컴포넌트입니다.
 * 할 일 관리의 메인 화면으로, 헤더, 툴바, 할 일 목록 및 폼을 포함합니다.
 */
const HomePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "전체">("전체");
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "전체">(
    "전체"
  );
  const [sortBy, setSortBy] = useState<
    "priority" | "due_date" | "created_date" | "title"
  >("created_date");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * 사용자 인증 상태를 확인하고 할 일 목록을 조회합니다.
   */
  useEffect(() => {
    const checkUserAndFetchTodos = async () => {
      const supabase = createClient();

      // 현재 로그인한 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push("/login");
        return;
      }

      setUser(user);
      await fetchTodos(user.id);
    };

    checkUserAndFetchTodos();
  }, [router]);

  /**
   * Supabase에서 할 일 목록을 조회합니다.
   */
  const fetchTodos = async (userId: string) => {
    setIsLoadingTodos(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .order("created_date", { ascending: false });

      if (error) {
        throw error;
      }

      setTodos(data || []);
    } catch (error) {
      console.error("할 일 조회 실패:", error);
      alert("할 일 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingTodos(false);
    }
  };

  /**
   * 할 일 목록을 필터링하고 정렬합니다.
   */
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];

    // 검색 필터 (제목에서만 검색)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((todo) =>
        todo.title.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (statusFilter !== "전체") {
      const now = new Date();
      filtered = filtered.filter((todo) => {
        if (statusFilter === "완료") {
          return todo.completed;
        }
        if (statusFilter === "진행 중") {
          return (
            !todo.completed &&
            (!todo.due_date || new Date(todo.due_date) >= now)
          );
        }
        if (statusFilter === "지연") {
          return (
            !todo.completed &&
            todo.due_date &&
            new Date(todo.due_date) < now
          );
        }
        return true;
      });
    }

    // 우선순위 필터
    if (priorityFilter !== "전체") {
      filtered = filtered.filter((todo) => todo.priority === priorityFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || "low"];
        const bPriority = priorityOrder[b.priority || "low"];
        return bPriority - aPriority;
      }
      if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === "created_date") {
        return (
          new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
        );
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [todos, searchQuery, statusFilter, priorityFilter, sortBy]);

  /**
   * 할 일 추가/수정을 처리합니다.
   */
  const handleSubmit = async (data: TodoInput) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsFormLoading(true);
    try {
      const supabase = createClient();

      if (editingTodo) {
        // 수정
        const { error } = await supabase
          .from("todos")
          .update({
            title: data.title,
            description: data.description || null,
            due_date: data.due_date || null,
            priority: data.priority || "medium",
            category: data.category || [],
          })
          .eq("id", editingTodo.id)
          .eq("user_id", user.id); // 본인 소유의 할 일만 수정

        if (error) {
          throw error;
        }

        setEditingTodo(null);
      } else {
        // 추가
        const { error } = await supabase.from("todos").insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          due_date: data.due_date || null,
          priority: data.priority || "medium",
          category: data.category || [],
          completed: false,
        });

        if (error) {
          throw error;
        }
      }

      // 목록 갱신
      await fetchTodos(user.id);
    } catch (error) {
      console.error("할 일 저장 실패:", error);
      alert("할 일을 저장하는 중 오류가 발생했습니다.");
    } finally {
      setIsFormLoading(false);
    }
  };

  /**
   * 할 일 완료 상태를 토글합니다.
   */
  const handleToggleComplete = async (id: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const supabase = createClient();
      const todo = todos.find((t) => t.id === id);

      if (!todo) {
        return;
      }

      const { error } = await supabase
        .from("todos")
        .update({ completed: !todo.completed })
        .eq("id", id)
        .eq("user_id", user.id); // 본인 소유의 할 일만 수정

      if (error) {
        throw error;
      }

      // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    } catch (error) {
      console.error("할 일 상태 변경 실패:", error);
      alert("할 일 상태를 변경하는 중 오류가 발생했습니다.");
      // 오류 발생 시 목록 다시 조회
      if (user) {
        await fetchTodos(user.id);
      }
    }
  };

  /**
   * 할 일 수정을 시작합니다.
   */
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
  };

  /**
   * 할 일 수정을 취소합니다.
   */
  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  /**
   * 할 일을 삭제합니다.
   */
  const handleDelete = async (id: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // 본인 소유의 할 일만 삭제

      if (error) {
        throw error;
      }

      // 로컬 상태에서 제거
      setTodos((prev) => prev.filter((todo) => todo.id !== id));

      if (editingTodo?.id === id) {
        setEditingTodo(null);
      }
    } catch (error) {
      console.error("할 일 삭제 실패:", error);
      alert("할 일을 삭제하는 중 오류가 발생했습니다.");
    }
  };

  /**
   * 로그아웃을 처리합니다.
   */
  const handleLogout = async () => {
    if (!confirm("로그아웃하시겠습니까?")) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
      router.push("/login");
      router.refresh(); // 세션 정보 갱신
    } catch (err) {
      // 오류 처리
      const errorMessage =
        err instanceof Error ? err.message : "로그아웃에 실패했습니다.";
      console.error("Logout error:", errorMessage);
      alert(`로그아웃 실패: ${errorMessage}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Toaster position="top-right" richColors />
      {/* 헤더 */}
      <header 
        className="sticky top-0 z-50 w-full border-b shadow-md"
        style={{ 
          backgroundColor: 'oklch(0.35 0.08 250)',
          borderColor: 'oklch(0.35 0.12 250 / 0.5)'
        }}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary-foreground/10">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">AI 할 일 관리</span>
          </Link>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
              <UserIcon className="size-4" />
              <span>{user?.email || "사용자"}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-primary-foreground/20"
            >
              <LogOut className="size-4 mr-2" />
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container flex-1 px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* 좌측: 할 일 폼 */}
          <aside className="w-full lg:w-96 lg:sticky lg:top-20">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {editingTodo ? "할 일 수정" : "새 할 일 추가"}
              </h2>
              <TodoForm
                initialData={editingTodo}
                onSubmit={handleSubmit}
                onCancel={editingTodo ? handleCancelEdit : undefined}
                isLoading={isFormLoading}
              />
            </div>
          </aside>

          {/* 우측: 할 일 목록 및 툴바 */}
          <div className="flex-1 space-y-6">
            {/* 툴바 */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* 검색 */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="제목 또는 설명으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* 필터 및 정렬 */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 상태 필터 */}
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as TodoStatus | "전체")
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <Filter className="size-4 mr-2" />
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="진행 중">진행 중</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                      <SelectItem value="지연">지연</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 우선순위 필터 */}
                  <Select
                    value={priorityFilter}
                    onValueChange={(value) =>
                      setPriorityFilter(value as TodoPriority | "전체")
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="우선순위" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="medium">중간</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 정렬 */}
                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(
                        value as "priority" | "due_date" | "created_date" | "title"
                      )
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <ArrowUpDown className="size-4 mr-2" />
                      <SelectValue placeholder="정렬" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_date">생성일순</SelectItem>
                      <SelectItem value="due_date">마감일순</SelectItem>
                      <SelectItem value="priority">우선순위순</SelectItem>
                      <SelectItem value="title">제목순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 할 일 목록 */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  할 일 목록 ({filteredAndSortedTodos.length})
                </h2>
              </div>
              {isLoadingTodos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      할 일 목록을 불러오는 중입니다...
                    </p>
                  </div>
                </div>
              ) : (
                <TodoList
                  todos={filteredAndSortedTodos}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
