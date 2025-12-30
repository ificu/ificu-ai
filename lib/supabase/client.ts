import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트를 생성합니다.
 * Next.js App Router의 클라이언트 컴포넌트에서 사용합니다.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
};

