/**
 * 앱 전체를 감싸는 껍데기 파일.
 *
 * 모든 화면이 이 안에서 열립니다.
 * 학생의 진행 상황(SessionProvider)도 여기서 감싸주기 때문에,
 * 화면을 옮겨 다녀도 이름과 점수가 유지됩니다.
 * (단, 새로고침하면 사라집니다 — 의도된 동작입니다)
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 바꿔도 됩니다.
 *    다만 viewport 설정과 SessionProvider 는 그대로 두세요.
 */

import type { Metadata, Viewport } from "next";

import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "골든타임 — 간호사 진로체험",
  description:
    "초등 3학년~중학생을 위한 간호사 진로체험 웹앱. 응급실, 119 구급차, 보건실 세 곳을 체험합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 수업 중 실수로 화면이 확대되지 않도록 막아둡니다.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
