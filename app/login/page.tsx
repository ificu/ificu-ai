"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 로그인 페이지 컴포넌트입니다.
 * 이메일/비밀번호 기반 로그인 폼을 제공하고, 회원가입 페이지로 이동할 수 있는 링크를 포함합니다.
 */
const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 로그인 폼 제출을 처리합니다.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // 로그인 성공
      if (data.session) {
        router.push('/');
        router.refresh(); // 세션 정보 갱신
      }
    } catch (err) {
      // 사용자 친화적인 오류 메시지 처리
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes("invalid login credentials") ||
            errorMessage.includes("invalid credentials") ||
            errorMessage.includes("email not confirmed")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (errorMessage.includes("email not confirmed")) {
          setError("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
        } else if (errorMessage.includes("too many requests")) {
          setError("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 및 서비스 소개 */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
            <Sparkles className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AI 할 일 관리</h1>
            <p className="text-muted-foreground">
              AI를 활용한 스마트한 할 일 관리로 생산성을 극대화하세요
            </p>
          </div>
        </div>

        {/* 로그인 폼 */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호를 입력하여 로그인하세요
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* 오류 메시지 */}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-required="true"
                />
              </div>
            </CardContent>

            {/* 액션 버튼 */}
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              {/* 회원가입 링크 */}
              <div className="text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-primary hover:underline"
                >
                  회원가입
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* 추가 정보 */}
        <p className="text-center text-xs text-muted-foreground">
          로그인하시면 할 일 관리 및 AI 기능을 사용하실 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

