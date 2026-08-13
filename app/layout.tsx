/**
 * 앱 전체를 감싸는 껍데기 파일.
 *
 * 모든 화면이 이 안에서 열립니다.
 * 태블릿 화면 설정(확대 금지 등)이 여기 들어 있습니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 바꿔도 됩니다.
 *    다만 viewport 설정은 태블릿 수업에 필요하니 그대로 두세요.
 */

import type { Metadata, Viewport } from "next";
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
      <body>{children}</body>
    </html>
  );
}
