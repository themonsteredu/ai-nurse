import type { NextConfig } from "next";

/**
 * 골든타임 앱 설정.
 *
 * 이 앱은 서버에 학생 정보를 하나도 보내지 않습니다.
 * 모든 진행 상황은 브라우저 메모리에만 있고, 새로고침하면 사라집니다.
 * (학교 반입 시 개인정보 승인 절차를 피하기 위한 의도적인 설계입니다.)
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
