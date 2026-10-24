/**
 * REAL PORTFOLIO DATA: Racing Game Production, AI Agent Pipeline & 3D Fleet
 * Extracted from workspace artworks and Unity 'Race_Drag_End_001' production
 */

const PORTFOLIO_DATA = {
  creator: {
    name: "박경민 (PARK GYEONG MIN)",
    email: "parkkm1110@gmail.com",
    github: "https://github.com/parkkm1110-creator",
    artstation: "https://krissv9mm1.artstation.com",
    title: "3D Technical Artist & Game Developer",
    philosophy: "레이싱 게임 장르에 대한 높은 도메인 이해도와 생성형 AI 에이전트를 결합하여, C# 게임 로직·Game-Ready 로우폴 모델링·2K PBR 텍스처링 전 과정을 단일 크리에이터가 압도적인 속도로 완주하는 차세대 제작 프로세스.",
    stats: {
      vehicles: "10 Production Cars",
      unityEngine: "Unity 6 URP",
      textureRes: "2K PBR Workflow",
      aiSpeedup: "5~10x Dev Speed"
    }
  },

  projects: [
    {
      id: "race-drag-unity",
      featured: true,
      title: "NIGHTRO : Drag Racing — 실제 플레이 가능한 1:1 하이엔드 드래그 레이싱",
      logo: "assets/icons/nightro_logo.png",
      badge: "FULLY PLAYABLE GAME",
      category: "racing-game",
      categoryName: "상용급 레이싱 게임 개발",
      thumbnail: "assets/icons/nightro_logo.png",
      thumbnailFit: "contain",
      gallery: [
        "assets/icons/nightro_logo.png",
        "assets/screenshots/ingame_tutorial_xr500.jpg",
        "assets/screenshots/ingame_paintkit_lab.jpg",
        "assets/screenshots/RenderShot_20261019_023950_2x.png",
        "assets/screenshots/RenderShot_20261008_030157_2x.png"
      ],
      description: "단순한 3D 뷰어나 기술 데모를 넘어, 엔진 시동부터 타이어 번아웃 예열, 신호등 발진 리액션, 패들 시프트 변속, NOS 분사 및 14명 AI 드라이버 캠페인까지 모든 상용 메커니즘이 100% 동작하는 실제 작동 완성형 1:1 드래그 레이싱 게임 'NIGHTRO'. CSR Racing 시리즈의 럭셔리한 비주얼 감성과 물리 엔진을 벤치마킹하여, 종방향 차량 동역학, 타이어 마찰/온도 시뮬레이션, 반응형 웹뷰 레이스 HUD를 1인 풀사이클로 구현하고 PC Standalone 및 WebGL 브라우저 즉시 플레이 환경으로 완주한 플래그십 상용급 타이틀입니다.",
      highlights: [
        "실제 브라우저(WebGL) 및 PC에서 즉시 플레이 가능한 100% 작동 완성형 게임",
        "상용급 레이싱 메커니즘: 타이어 번아웃 예열 → 신호등 발진 → 7단 패들 시프트 → NOS 부스터 분사",
        "C# 기반 정밀 종방향 차량 동역학: 실제 엔진 토크 곡선, 기어비, 타이어 슬립율 & 접지력 온도 계산",
        "10종 순정 차량 라이브러리 및 14단계 AI 드라이버 캠페인 & 공식 타임슬립(Time Slip) 기록 시스템",
        "Unity 6 URP 17.3 + GREE WebView 하이브리드 아키텍처: 고해상도 벡터 HUD 및 무설치 WebGL 완벽 구동",
        "1인 크리에이터로서 기획, 3D 모델링, 2K PBR 텍스처링, 물리 프로그래밍, UI 전 과정 단독 완주"
      ],
      tools: ["Unity 6", "C# Dynamics", "URP 17.3", "Shader Graph", "HTML5 GREE UI", "Maya"],
      specs: {
        "Official Title": "NIGHTRO : Drag Racing (나이트로)",
        "Build Status": "실제 작동 완성작 (PC Standalone & WebGL 브라우저 즉시 플레이)",
        "Engine & Render": "Unity 6 (6000.3) + URP 17.3 (PC / WebGL 크로스 플랫폼)",
        "Physics Simulation": "Torque Curve, Gear Ratio, Slip Ratio & Tire Burnout Temp",
        "Game Modes": "14-Stage Story Campaign, Driving School Tutorial, Head-to-Head Drag",
        "Development Scope": "1인 풀사이클 기획 · 3D 아트 · C# 물리 · 하이브리드 UI 완주"
      }
    },
    {
      id: "ai-generative-pipeline",
      title: "생성형 AI 에이전트(Antigravity + Codex + Gemini) 파이프라인",
      category: "ai-tech",
      categoryName: "AI 에이전트 R&D",
      thumbnail: "assets/screenshots/antigravity_agent_session.png",
      gallery: [
        "assets/screenshots/antigravity_agent_session.png",
        "assets/screenshots/RenderShot_20261019_024526_2x.png",
        "assets/screenshots/RenderShot_20261019_024118_2x.png"
      ],
      description: "1인 개발의 생산성 한계를 돌파하기 위해 Antigravity 에이전트 환경에서 Codex 6.1 Sol(정밀 물리 연산·아키텍처 설계)과 Gemini 3.8 Flash(대량 구현·실시간 진단 디버깅)를 결합한 하이브리드 AI 파이프라인. 실제 빌드 런타임 진단(포트 충돌 해결, PID 추적, C# 로직 분석)부터 Meshy AI 기반 3D 볼륨 추출, 프롬프트 엔지니어링을 통한 브레이크 캘리퍼 알파 텍스처 30여 종 자동화까지, 전 개발 사이클에 AI 에이전트를 페어 프로그래밍 파트너로 통합하여 1인 제작 처리량을 5~10배 가속했습니다.",
      highlights: [
        "Google Antigravity + Gemini 3.8 Flash 기반 실시간 빌드 런타임 분석 & 백그라운드 디버깅",
        "Codex 6.1 Sol과의 협업으로 고난도 차량 종방향 물리 수식 및 커스텀 셰이더 명세 수립",
        "Meshy AI 기반 3D 베이스 볼륨 추출 후 Maya SubD 리토폴로지로 형태 정밀화",
        "AI 프롬프트 엔지니어링으로 1P~6P 브레이크 캘리퍼 알파 텍스처 30여 종 고속 생성",
        "단일 크리에이터 환경에서 10종 차량 에셋 및 WebGL 배포 파이프라인을 압도적 속도로 완주"
      ],
      tools: ["Google Antigravity", "Codex 6.1 Sol", "Gemini 3.8 Flash", "Meshy AI", "Maya", "Substance Painter"],
      specs: {
        "AI Agent IDE": "Google Antigravity (Multi-project Agent Workflow)",
        "Dual-AI Engine": "Codex 6.1 Sol (Compute) + Gemini 3.8 Flash (Execution)",
        "Asset Generation": "Meshy AI 3D Volume + 30+ High-res Textures",
        "Production Throughput": "1인 10종 차량 & 드래그 게임 풀사이클 단기 완주"
      }
    },
    {
      id: "unity-flop-paint-lab",
      title: "Unity Flop Paint Lab & 실시간 2-Tone 커스텀 셰이더 R&D",
      category: "ai-tech",
      categoryName: "실시간 셰이더 R&D",
      thumbnail: "assets/screenshots/ingame_paintkit_lab.jpg",
      gallery: [
        "assets/screenshots/ingame_paintkit_lab.jpg",
        "assets/screenshots/RenderShot_20261019_024031_2x.png",
        "assets/screenshots/RenderShot_20261019_023910_2x.png"
      ],
      description: "레이싱 게임의 핵심 인터랙션인 실시간 차량 커스텀 도색을 위한 셰이더 R&D 랩스(Labs) 프로토타입. 인게임 Paint Kit 런타임 인스펙터 UI를 통해 2-Tone 모드, 팩토리 프리셋(French Blue, Italian Red, Chrome Gold 등), 플레이크(Flake) 메탈릭 강도 조절, 모션 반사 프로브를 실시간 제어할 수 있도록 구축했습니다. 3-Channel Packed 2K Region Mask(R:외판, G:데칼, B:엠블럼)와 관측 각도 의존형 프레넬 Flop Tint(퍼플↔사이언 카멜레온 펄 변색) 및 Substance Painter 디테일 보존 곱연산을 결합하여 슈퍼카 도색의 깊이감을 실시간 렌더링합니다.",
      highlights: [
        "인게임 도색 R&D 랩스 프로토타입(Paint Kit) 런타임 디버그 인스펙터 연동",
        "2-Tone 팩토리 프리셋 로드 & 실시간 플레이크(Flake) 메탈릭 강도 슬라이더 제어",
        "관측 각도 의존형 프레넬 Flop 메탈릭 펄(퍼플↔사이언 카멜레온) 실시간 셰이더 연산",
        "3-Channel Packed 2K Region Mask (R:외판, G:데칼, B:엠블럼) 메모리 최적화",
        "Substance Painter 오리지널 AO/패널 갭 보존을 위한 휘도(Luminance) 곱연산 수식"
      ],
      tools: ["Unity URP", "Three.js WebGL", "GLSL / HLSL", "Substance Painter"],
      specs: {
        "R&D Prototype": "In-Engine Paint Kit [Cavaro_Flash] Lab Prototype",
        "Paint Modes": "2-Tone Factory Presets, Flop Tint, Flake Intensity Slider",
        "Mask Architecture": "2048x2048 3-Channel Packed UV Mask",
        "Shader Engine": "Unity URP 17.3 Custom Shaders & Three.js WebGL Port"
      }
    },
    {
      id: "stitch-gree-webview-ui",
      title: "GREE WebView 기반 인게임 레이스 HUD & 인터랙티브 튜토리얼 UI",
      category: "ai-tech",
      categoryName: "인게임 UI / UX 시스템",
      thumbnail: "assets/screenshots/ingame_tutorial_xr500.jpg",
      gallery: [
        "assets/screenshots/ingame_tutorial_xr500.jpg",
        "assets/screenshots/RenderShot_20261019_024118_2x.png",
        "assets/screenshots/RenderShot_20261019_021011_2x.png"
      ],
      description: "Unity 6 uGUI의 드로우콜과 렌더 부하를 줄이고 벡터 기반의 선명도를 확보하기 위해, GREE WebView와 HTML5/CSS/SVG를 연동한 하이브리드 인게임 레이스 인터페이스 시스템. 사막 트랙 인게임 3D 뷰포트 위에 실시간 아날로그 타코미터(RPM/속도/기어 단수), 타이어 번아웃 예열 페달 메커니즘, 1/4 마일 레이스 대진 스트립, 그리고 초보자를 위한 단계별 드라이빙 스쿨(Driving School) 튜토리얼 모달을 반응형 웹 기술로 오버레이하고, Unity C# 물리 엔진과 초당 60회 양방향 RPC로 실시간 동기화했습니다.",
      highlights: [
        "16:9 반응형 인게임 레이스 HUD 오버레이: 1/4 마일 트랙 진행도, 스톱워치 타임, 라이벌 스펙 카드",
        "CSR 스타일 SVG 아날로그 타코미터 클러스터 & 인터랙티브 가속 페달 메커니즘",
        "단계별 인터랙티브 드라이빙 스쿨 튜토리얼 시스템 (타이어 예열 → 녹색등 발진 → 변속 → NOS)",
        "JavaScript ↔ Unity C# 초고속 양방향 RPC 브리지 (초당 60회 물리 스냅샷 및 조작 동기화)",
        "Stitch 및 생성형 AI 에이전트를 결합하여 고해상도 벡터 HUD 레이아웃 및 인터랙션 1인 초고속 완주"
      ],
      tools: ["GREE WebView", "HTML5 / SVG", "CSS3 / Tailwind", "Unity 6 C#", "Stitch", "AI Agent"],
      specs: {
        "UI Architecture": "Unity 3D Viewport + GREE WebView Web Overlay",
        "In-Game HUD": "Analog Tachometer, Burnout Temp Meter, Throttle Pedal",
        "Tutorial System": "4-Stage Driving School Interactive Guidance",
        "Bridge Sync": "60Hz Bidirectional RPC & State Snapshot Sync"
      }
    },
    {
      id: "racing-fleet-master",
      title: "10-Vehicle Master Fleet — Game-Ready 로우폴 & 2K PBR",
      category: "racing-fleet",
      categoryName: "3D 레이싱 비클 마스터",
      thumbnail: "assets/screenshots/RenderShot_20261019_021048_2x.png",
      gallery: [
        "assets/screenshots/RenderShot_20261019_021048_2x.png",
        "assets/screenshots/RenderShot_20261019_022342_2x.png",
        "assets/screenshots/RenderShot_20261008_025758_2x.png",
        "assets/screenshots/RenderShot_20261008_030241_2x.png",
        "assets/screenshots/RenderShot_20261019_022400_2x.png",
        "assets/screenshots/RenderShot_20261019_010937_2x.png"
      ],
      description: "Bentley Turbo R, Lambo LP700-4, Bugatti Veyron, Shelby GT500 Police, Kia Stinger GT, Golf GTi, GTA Spano, Chevy Cobalt SS, Spark M300, Range Rover SVR 등 10종 완성 차량 마스터 라인업. Maya 정밀 하드서페이스 서브디비전 모델링 기반으로 실시간 게임 엔진 구동을 위한 로우폴리곤(Low-Poly) 리토폴로지를 수행하고, Substance Painter에서 2K PBR 텍스처 팩(BaseColor, Normal, Metallic, Roughness)을 일관되게 패킹하여 실시간 60fps 레이싱에 완벽 대응하도록 구축했습니다.",
      highlights: [
        "10개 전 차종 인게임 60fps 실시간 구동을 위한 Game-Ready 로우폴리곤 리토폴로지",
        "Substance Painter 2K PBR 텍스처 팩(BaseColor, Normal, Metallic, Roughness) 일관성 패킹",
        "머스탱 일반/경찰차(Interceptor) 모듈러 파츠 분리, V12 엔진룸, 부가티 말굽 그릴 알파 구현",
        "벤틀리 2.4GB 원본 섭페 프로젝트 패킹 및 실차 하부 섀시 노멀 맵(OpenGL) 자체 베이킹",
        "생성형 AI 에이전트와 결합하여 1인 크리에이터로서 10개 완성 차종을 단기간에 고속 완주"
      ],
      tools: ["Maya", "Substance Painter", "Unity URP", "AI Agent", "Photoshop", "ZBrush (Aux)"],
      specs: {
        "Fleet Lineup": "10 Production Vehicles (Supercar, Muscle, Luxury, Sedan, SUV)",
        "Geometry": "Game-Ready Low-Poly Mesh",
        "Textures": "2K URP PBR (Albedo, Normal, Metallic, Roughness)",
        "Target FPS": "Real-time 60fps on Mobile & PC"
      }
    }
  ]
};
