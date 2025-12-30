import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const TodoSchema = z.object({
  title: z.string().describe("할 일의 제목 (간결하고 명확하게)"),
  due_date: z.string().optional().describe("마감일 (YYYY-MM-DD 형식)"),
  due_time: z.string().optional().describe("마감 시간 (HH:MM 형식, 24시간제)"),
  priority: z
    .enum(["high", "medium", "low"])
    .describe("우선순위 (high: 긴급/중요, medium: 보통, low: 낮음)"),
  category: z
    .array(z.enum(["업무", "개인", "학습"]))
    .describe("카테고리 (해당되는 모든 카테고리 선택)"),
  description: z.string().optional().describe("할 일의 상세 설명"),
});

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "입력된 텍스트가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (input.trim().length === 0) {
      return NextResponse.json(
        { error: "할 일 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI 서비스가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentTime = today.toTimeString().slice(0, 5);

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: TodoSchema,
      prompt: `당신은 자연어로 입력된 할 일을 구조화된 데이터로 변환하는 AI 어시스턴트입니다.

오늘 날짜: ${todayStr}
현재 시각: ${currentTime}

사용자 입력: "${input}"

다음 규칙에 따라 할 일을 분석해주세요:

1. 제목(title): 핵심 내용만 간결하게 추출
2. 마감일(due_date):
   - "내일", "다음주", "3일 후" 같은 상대적 표현을 구체적인 날짜(YYYY-MM-DD)로 변환
   - 날짜가 명시되지 않으면 생략
3. 마감 시간(due_time):
   - "오후 3시", "15시", "저녁 7시" 같은 표현을 24시간 형식(HH:MM)으로 변환
   - 시간이 명시되지 않고 날짜만 있으면 "09:00"으로 설정
   - 날짜도 시간도 없으면 생략
4. 우선순위(priority):
   - high: "긴급", "중요", "urgent", "asap", "빨리", "급한" 포함 시
   - low: "나중에", "여유있게", "천천히" 포함 시
   - medium: 그 외 모든 경우
5. 카테고리(category):
   - 업무: "회의", "팀", "프로젝트", "업무", "발표", "보고서" 등
   - 개인: "집", "가족", "친구", "쇼핑", "운동", "건강" 등
   - 학습: "공부", "강의", "독서", "코딩", "학습", "강좌" 등
   - 여러 카테고리가 해당되면 모두 포함
6. 설명(description): 제목에 포함되지 않은 추가 정보나 맥락

주의사항:
- 날짜 계산 시 오늘(${todayStr})을 기준으로 정확하게 계산
- "내일"은 오늘 +1일, "다음주 월요일"은 다음 주의 월요일 날짜
- 한국어 시간 표현(오전/오후)을 24시간 형식으로 정확히 변환
- 우선순위는 문맥과 키워드를 종합적으로 고려`,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error("Parse todo error:", error);

    // 404 에러 (모델을 찾을 수 없음)인 경우 사용 가능한 모델 목록 조회
    if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 404) {
      console.log("🔍 Model not found. Fetching available models...");
      try {
        const listModelsResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`
        );

        if (listModelsResponse.ok) {
          const modelsData = await listModelsResponse.json();
          console.log("📋 Available models:");

          if (modelsData.models && Array.isArray(modelsData.models)) {
            modelsData.models.forEach((model: any) => {
              const supportedMethods = model.supportedGenerationMethods || [];
              const supportsGenerateContent = supportedMethods.includes("generateContent");
              console.log(
                `  ${supportsGenerateContent ? "✅" : "❌"} ${model.name} - ${model.displayName || "N/A"}`
              );
              if (supportsGenerateContent) {
                console.log(`     Methods: ${supportedMethods.join(", ")}`);
              }
            });

            // generateContent를 지원하는 모델만 필터링
            const compatibleModels = modelsData.models
              .filter((model: any) =>
                model.supportedGenerationMethods?.includes("generateContent")
              )
              .map((model: any) => model.name.replace("models/", ""));

            console.log("\n💡 Compatible models for generateContent:");
            console.log(compatibleModels.join("\n"));
          }
        } else {
          console.error("Failed to fetch models list:", listModelsResponse.status);
        }
      } catch (listError) {
        console.error("Error fetching models list:", listError);
      }
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `할 일 파싱 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "할 일 파싱 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
