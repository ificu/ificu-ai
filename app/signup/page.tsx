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
 * 회원가입 페이지 컴포넌트입니다.
 * 이메일/비밀번호 기반 회원가입 폼을 제공하고, 로그인 페이지로 이동할 수 있는 링크를 포함합니다.
 */
const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * 비밀번호와 비밀번호 확인이 일치하는지 검증합니다.
   */
  const validatePasswords = (): boolean => {
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    return true;
  };

  /**
   * 회원가입 폼 제출을 처리합니다.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 비밀번호 검증
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // 회원가입 성공
      if (data.user) {
        // 이메일 확인이 필요한 경우
        if (data.user.identities && data.user.identities.length === 0) {
          setError("이미 가입된 이메일 주소입니다.");
          return;
        }

        // 이메일 확인 필요 여부 확인
        if (data.user.confirmation_sent_at || !data.session) {
          setSuccessMessage(
            "회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요."
          );
          // 3초 후 로그인 페이지로 리다이렉트
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          // 이메일 확인이 필요없는 경우 (설정에 따라) 바로 메인 페이지로
          setSuccessMessage("회원가입이 완료되었습니다!");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      }
    } catch (err) {
      // 사용자 친화적인 오류 메시지 처리
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes("user already registered")) {
          setError("이미 가입된 이메일 주소입니다.");
        } else if (errorMessage.includes("invalid email")) {
          setError("유효하지 않은 이메일 주소입니다.");
        } else if (errorMessage.includes("password")) {
          setError("비밀번호가 요구사항을 충족하지 않습니다.");
        } else {
          setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
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

        {/* 회원가입 폼 */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              이메일과 비밀번호를 입력하여 계정을 만드세요
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

              {/* 성공 메시지 */}
              {successMessage && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
                  {successMessage}
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
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-required="true"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  비밀번호는 최소 6자 이상이어야 합니다.
                </p>
              </div>

              {/* 비밀번호 확인 입력 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-required="true"
                />
              </div>
            </CardContent>

            {/* 액션 버튼 */}
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !email ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
              >
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>

              {/* 로그인 링크 */}
              <div className="text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  로그인
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* 추가 정보 */}
        <p className="text-center text-xs text-muted-foreground">
          회원가입 시 이메일 인증이 필요할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

