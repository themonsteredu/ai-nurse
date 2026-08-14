/**
 * 앱의 첫 주소 ( / ) — 시작 화면이 열리는 자리.
 *
 * 첫 화면부터 병원 미션 지도를 보여줍니다.
 * 학생 정보와 난이도는 첫 미션을 선택한 뒤 체크인 창에서 받습니다.
 */

import { LobbyScreen } from "@/components/LobbyScreen";

export default function StartPage() {
  return <LobbyScreen />;
}
