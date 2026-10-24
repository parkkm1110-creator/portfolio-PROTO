# 📸 포트폴리오 프로젝트 이미지 교체 가이드

이 폴더는 각 프로젝트의 **4개 핵심 뷰포트 이미지**를 보관하는 표준 디렉토리입니다.  
원하는 이미지를 아래 파일명과 규격으로 저장해 두시면 웹사이트에 **별도 코드 수정 없이 1초 만에 자동 반영**됩니다!

---

## 📁 프로젝트별 폴더 및 권장 이미지 규격

권장 해상도: **1920 x 1080 (16:9 비율) PNG 또는 JPG**

```text
assets/projects/
├── bentley-turbo-r/
│   ├── hero.png          # ① 최종 스튜디오 Iray / Maya 뷰포트 렌더샷
│   ├── wireframe.png     # ② Maya SubD 토폴로지 & 와이어프레임 뷰
│   ├── texture.png       # ③ Substance Painter 4K PBR 채널 분해도 (Albedo/Normal/Roughness/Metal)
│   └── detail.png        # ④ 크롬 라디에이터 그릴 & 엠블럼 클로즈업
│
├── mustang-shelby-police/
│   ├── hero.png          # ① 머스탱 GT500 / 경찰차 최종 렌더샷
│   ├── wireframe.png     # ② 차체 에지 루프 및 후드 스쿱 와이어프레임
│   ├── texture.png       # ③ 텍스처 맵 & UDIM 언래핑 분해도
│   └── detail.png        # ④ 전면 러닝 포니 엠블럼 & 경광등 디테일
│
├── lambo-lp700/
│   ├── hero.png          # ① 아벤타도르 쐐기형 실루엣 렌더샷
│   ├── wireframe.png     # ② 스텔스 에지 토폴로지
│   ├── texture.png       # ③ V12 엔진룸 & 카본 파이버 텍스처
│   └── detail.png        # ④ 6P 브레이크 캘리퍼 & 카본 세라믹 디스크
│
├── bugatti-veyron/
│   ├── hero.png          # ① 부가티 베이론 투톤 렌더샷
│   ├── wireframe.png     # ② 하이폴리 곡면 와이어프레임
│   ├── texture.png       # ③ 말굽형 그릴 & 헤드라이트 렌더 텍스처
│   └── detail.png        # ④ 가스캡 & 액티브 리어 윙 기구부
│
├── race-drag-unity/
│   ├── hero.png          # ① 드래그 레이싱 메인 컷씬 / 인게임 주행 뷰
│   ├── wireframe.png     # ② 레이스 트랙 & 차량 콜라이더 씬 뷰
│   ├── texture.png       # ③ 차고(Garage) 도색 랩 및 UI 스크린
│   └── detail.png        # ④ 번아웃 타이어 연기 & NOS 분사 이펙트
│
├── ai-generative-pipeline/
│   ├── hero.png          # ① AI 파이프라인 전체 개요도
│   ├── wireframe.png     # ② Meshy AI 베이스 메시 vs Maya 리토폴로지 비교
│   ├── texture.png       # ③ AI 생성 알파/노멀 맵 30종 그리드
│   └── detail.png        # ④ 캘리퍼/그릴 메시 텍스처 클로즈업
│
├── kia-stinger-gt/
│   ├── hero.png          # ① 기아 스팅어 GT / 골프 GTi 렌더샷
│   ├── wireframe.png     # ② Ver.1 ~ Ver.6 LOD 폴리곤 최적화 단계 비교
│   ├── texture.png       # ③ PBR 머티리얼 구성
│   └── detail.png        # ④ 타이거 노즈 그릴 & 19인치 투톤 휠 림
│
└── gta-spano-supercar/
    ├── hero.png          # ① GTA Spano / 레인지로버 SVR 렌더샷
    ├── wireframe.png     # ② 하드서페이스 서페이스 토폴로지
    ├── texture.png       # ③ 4K Veloce Spada 엔진 텍스처/노멀
    └── detail.png        # ④ 커스텀 브레이크 로고 & 서스펜션 클로즈업
```

---

## 💡 팁
- 4장의 이미지가 아직 다 준비되지 않았더라도, 웹사이트에서는 기본 프로젝트 썸네일로 자동 폴백(Fallback)되어 깨짐 없이 아름답게 유지됩니다.
- 한 장씩 준비되는 대로 위 경로에 파일 이름만 맞춰서 넣어주시면 됩니다.
