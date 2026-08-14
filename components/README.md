# components 폴더 — 화면에 보이는 조각들

## ✅ 코덱스(디자인 담당 AI)는 이 폴더를 통째로 갈아엎어도 됩니다

여기는 **보이는 것**만 담당합니다.
정답이나 기준값은 여기 있으면 안 됩니다. 전부 `data/` 와 `lib/` 에서 가져다 씁니다.

---

## 아직 비어 있습니다

1단계에서는 데이터(`data/`)와 계산(`lib/`)만 만들었습니다.
화면 조각은 2단계부터 여기 들어옵니다.

만들 예정인 것:

| 파일 | 무엇을 보여주나 |
|---|---|
| `SessionProvider.tsx` | 학생의 진행 상황을 화면들 사이에서 공유 (브라우저 메모리에만) |
| `StartScreen.tsx` | 이름 입력 + 난이도 선택 + 면책 문구 |
| `LobbyScreen.tsx` | 3D 병원 지도와 부서 6곳, 배지 점등 |
| `UnlockCodeScreen.tsx` | 통과 코드 네 자리 입력 |
| `TriagePatientCard.tsx` | 미션 1 — 끌어다 놓는 환자 카드 |
| `TriageZoneDropArea.tsx` | 미션 1 — 색깔 구역(놓는 자리) |
| `ExplanationCard.tsx` | 오답일 때 뜨는 해설 카드 |
| `DispatchStepList.tsx` | 미션 2 — 순서 맞추기 |
| `CompressionPad.tsx` | 미션 2 — 가슴압박 탭 영역 |
| `BpmMeter.tsx` | 미션 2 — 실시간 BPM 표시 |
| `AedBodyDiagram.tsx` | 미션 2 — 패드 붙일 몸 그림 |
| `HealthRoomCaseCard.tsx` | 미션 3 — 상황과 선택지 |
| `HealthLogBuilder.tsx` | 미션 3 — 보건일지 문장 조립 (중등 전용) |
| `SurgeryMissionScreen.tsx` | 미션 4 — 수술 기구 멸균 분류 |
| `IcuMissionScreen.tsx` | 미션 5 — 중환자 모니터 우선순위 판단 |
| `MedicationMissionScreen.tsx` | 미션 6 — 환자 팔찌와 약품 대조 |
| `FinalReport.tsx` | 배지, 점수, 간호 유형, 진로 정보 |
| `Certificate.tsx` | 이름·날짜가 들어간 수료증 |

---

## 이름 짓는 규칙

이름만 보고 "여기가 뭐 하는 곳인지" 알 수 있게 지어주세요.

```
❌ 나쁜 예   RedBox, Area1, handleClick2
✅ 좋은 예   ImmediateCareZone, TriagePatientCard, handlePatientDrop
```

## 파일 맨 위 주석

각 파일 맨 위에 **한국어 주석**으로 이렇게 적어주세요.

- 이 화면(조각)이 무엇을 하는지
- 어떤 데이터를 받는지
- 어떤 분위기여야 하는지 (예: 응급실은 긴박하게)
