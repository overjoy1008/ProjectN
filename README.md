# ProjectN - 평가원 수학 문항 유사도 추천 시스템

ProjectN은 평가원 수학 문항을 단순한 단원명이나 정답이 아니라, **출제 의도와 풀이 과정의 구조**로 분석하여 유사 문항을 추천하는 시스템을 목표로 한다.

## 웹 아카이브

저장소 루트가 웹 애플리케이션의 실행 위치다. 연도 → 시행 시기 → 선택과목 → 문항 번호 순으로 시험지를 탐색할 수 있으며, 전체 시험지에서는 PDF를, 개별 문항에서는 해당 PNG 이미지를 내려받을 수 있다.

```bash
pnpm install
pnpm dev
```

시험지와 문항 이미지는 모두 `public/archive/`에 저장한다. 웹에서 사용하는 `/archive/...` 주소는 이 폴더와 직접 연결되므로 별도의 심볼릭 링크가 필요하지 않다.

각 문항에서 다음 정보를 구조화한다.

- 대단원 → 중단원 → 소단원 분류
- 출제된 조건과 최종적으로 구하는 값
- 조건을 배치한 평가원의 출제 의도
- 풀이에 필요한 개념과 핵심 발상
- 공식의 종류와 풀이 안에서의 용도
- 계산, 식 변형, 경우 분류, 개념 조합 등의 해결 과정

이 특징들을 이용해 문항 간 유사도를 측정하고, 학습 목적에 맞는 문항을 추천한 뒤 웹 서비스로 제공하는 것이 최종 목표다.

## 전체 파이프라인

```text
평가원 PDF 수집 및 파일명 정규화
  → PDF 페이지 분할
  → 문항 번호 좌표를 anchor로 검출
  → 같은 열의 다음 anchor 직전까지 1차 crop
  → 머리말·꼬리말 및 흰 여백 제거
  → 문항 번호 누락·중복·이미지 경계 자동 검사
  → 이상 후보를 멀티모달로 육안 검사
  → 경계 규칙 수정 후 전체 또는 후보 재-crop
  → 단원·조건·질문·출제 의도·풀이 과정 구조화
  → 구조화 특징과 의미 임베딩을 결합한 유사도 계산
  → 목적별 유사 문항 추천
  → 검색·비교·추천 웹 서비스 제공
```

### 문항 이미지 분할 의사 코드

```pseudo
for page in pdf:
    words = extract_text_with_coordinates(page)
    anchors = words matching "1." ... "30."
    columns = group anchors by left/right position

    for column in columns:
        sort anchors from top to bottom

        for current, next in anchors:
            x_range = bounds of current column
            y_start = current.top - margin
            y_end = next.top - margin or safe_page_bottom

            image = render_page(page, 220dpi)
            crop = image.crop(x_range, y_start, y_end)
            crop = remove_header_rule_and_footer(crop)
            crop = trim_white_space(crop, padding=24px)
            save(crop, section, question_number)

assert detected_questions == expected_questions
validate_image_files()
review_flagged_crops_with_multimodal_model()
update_boundary_rules_and_recrop_if_needed()
```

## 수집된 평가원 수학 기출

수집일: 2026-09-09

- 범위: 대학수학능력시험, 9월 모의평가, 6월 모의평가
- 포함 자료: 수학 문제지 및 정답·해설지
- 총 32회차, 원본 PDF 130개 (문제지 65개, 정답·해설지 65개)
- 폴더명: `2026 수능`, `2026 9모`, `2026 6모` 형식
- 문제지명: `2026 수능 확통.pdf` 형식
- 해설지명: `2026 수능 확통 해설.pdf` 형식
- 선택과목이 하나의 PDF로 합쳐진 자료는 과목명 없이 `2026 6모.pdf`처럼 표기
- 주요 출처: 레전드스터디, 호랭이닷컴

## 학년도별 현황

| 학년도 | 수능 | 9월 | 6월 | PDF 수 |
|---|---:|---:|---:|---:|
| 2027 | 미시행 | 완료 | 완료 | 8 |
| 2026 | 완료 | 완료 | 완료 | 14 |
| 2025 | 완료 | 완료 | 완료 | 12 |
| 2024 | 완료 | 완료 | 완료 | 12 |
| 2023 | 완료 | 완료 | 완료 | 14 |
| 2022 | 완료 | 완료 | 완료 | 10 |
| 2021 | 완료 | 완료 | 완료 | 12 |
| 2020 | 완료 | 완료 | 완료 | 12 |
| 2019 | 완료 | 완료 | 완료 | 12 |
| 2018 | 완료 | 완료 | 완료 | 12 |
| 2017 | 완료 | 완료 | 완료 | 12 |

2027학년도 수능은 수집일 현재 아직 시행되지 않아 파일이 없습니다.
모든 PDF는 다운로드 후 PDF 구조를 열어보는 방식으로 검증했습니다.

## 문항 이미지 현황

모든 문제지를 문항 단위 PNG로 분리했으며, 각 회차 폴더의 `Questions/`에 저장한다.

- 2022학년도~현재: `공통/` 1~22번을 한 벌만 저장하고, `확통/`, `미적/`, `기하/`에는 각각 23~30번을 저장한다. 회차당 46개다.
- 2017~2021학년도: 가형과 나형의 문제가 서로 다르므로 `가형/`, `나형/`에 각각 1~30번을 따로 저장한다. 회차당 60개다.
- 전체: 32회차, 1,682개 문항 이미지
- 파일명 예시: `2026 수능 공통 01번.png`, `2019 수능 가형 30번.png`

```text
2026 수능/
  2026 수능.pdf
  Questions/
    공통/  # 01~22
    확통/  # 23~30
    미적/  # 23~30
    기하/  # 23~30

2021 수능/
  2021 수능 가형.pdf
  2021 수능 나형.pdf
  Questions/
    가형/  # 01~30
    나형/  # 01~30
```

재생성 스크립트는 프로젝트 루트의 `scripts/crop_questions.py`다. 텍스트 좌표가 없는 스캔형 PDF는 같은 체제 시험의 페이지별 번호 배치를 초기값으로 사용한 뒤, 문항 번호가 놓이는 좁은 세로 영역의 실제 잉크 행에 anchor를 맞춘다. 출력은 임시 폴더에서 문항 수 검증을 통과한 뒤 `Questions/`로 교체된다.

```bash
python3 scripts/crop_questions.py "public/archive"
```

전수 처리 결과는 `.crop-reports/questions.tsv`, 자동 검수 후보는 `.crop-reports/flags.tsv`에 기록한다. 짧은 한 줄 문항은 높이 기준상 후보로 남을 수 있으므로 이미지 자체를 함께 확인한다.

## 출처 페이지

- 레전드스터디: <https://legendstudy.com/>
- 2027학년도 9월 모의평가(호랭이닷컴): <https://horaeng.com/467>
