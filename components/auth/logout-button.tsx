"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

/**
 * 로그아웃 버튼 컴포넌트
 * Supabase Auth를 사용하여 사용자를 로그아웃시킵니다.
 */
export const LogoutButton = ({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
  children,
}: LogoutButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

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
      const errorMessage = err instanceof Error ? err.message : "로그아웃에 실패했습니다.";
      setError(errorMessage);
      console.error("Logout error:", errorMessage);

      // 오류 메시지를 사용자에게 표시 (예: toast 알림)
      alert(`로그아웃 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || (isLoading ? "로그아웃 중..." : "로그아웃")}
    </Button>
  );
};
