import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
CATEGORY_FILE = ROOT / "app" / "question-categories.ts"

EXAM_ORDER = [f"{year}|{session}" for year in range(2022, 2028) for session in ("6모", "9모", "수능") if not (year == 2027 and session == "수능")]
LEGACY_EXAM_ORDER = [f"{year}|{session}" for year in range(2017, 2022) for session in ("6모", "9모", "수능")]


def find_exam_file(exam_key, kind, subject="확통"):
    year, session = exam_key.split("|")
    directory = ROOT / f"public/archive/{year} {session}"
    if kind == "paper":
        return directory / f"{year} {session} {subject}.pdf"
    subject_solution = directory / f"{year} {session} {subject} 해설.pdf"
    shared_solution = directory / f"{year} {session} 해설.pdf"
    return subject_solution if subject_solution.exists() else shared_solution


PAPER_FILES = {exam_key: find_exam_file(exam_key, "paper") for exam_key in EXAM_ORDER}
SOLUTION_FILES = {exam_key: find_exam_file(exam_key, "solution") for exam_key in EXAM_ORDER}
CALCULUS_PAPER_FILES = {exam_key: find_exam_file(exam_key, "paper", "미적") for exam_key in EXAM_ORDER}
CALCULUS_SOLUTION_FILES = {exam_key: find_exam_file(exam_key, "solution", "미적") for exam_key in EXAM_ORDER}
LEGACY_PAPER_FILES = {
    subject: {exam_key: find_exam_file(exam_key, "paper", subject) for exam_key in LEGACY_EXAM_ORDER}
    for subject in ("가형", "나형")
}
LEGACY_SOLUTION_FILES = {
    subject: {exam_key: find_exam_file(exam_key, "solution", subject) for exam_key in LEGACY_EXAM_ORDER}
    for subject in ("가형", "나형")
}

CATEGORY_ACTIONS = {
    "거듭제곱근": "거듭제곱근의 정의와 실수 조건을 적용한다.",
    "지수·로그 계산": "밑을 통일하고 지수법칙 또는 로그의 성질로 식을 단순화한다.",
    "지수·로그 방정식·부등식": "진수·밑 조건을 확인한 뒤 같은 밑으로 바꾸어 해의 범위를 좁힌다.",
    "지수·로그함수 그래프": "증감, 점근선, 교점과 이동 관계를 그래프에 표시한다.",
    "삼각함수 계산": "삼각함수 사이의 관계와 부호 조건으로 필요한 값을 정한다.",
    "삼각 방정식·부등식": "주기와 정의역을 반영해 방정식 또는 부등식의 해를 선별한다.",
    "삼각함수 그래프": "진폭·주기·위상과 교점을 읽어 조건을 식으로 옮긴다.",
    "사인·코사인 법칙": "주어진 변과 각을 사인법칙 또는 코사인법칙으로 연결한다.",
    "등차·등비수열": "일반항을 세우고 주어진 항 조건으로 첫째항과 공차·공비를 정한다.",
    "등차·등비수열의 합": "합 공식을 적용해 항 조건과 합 조건을 하나의 식으로 연결한다.",
    "수열의 합 Σ": "시그마의 선형성과 기본 합 공식을 이용해 항별로 계산한다.",
    "수열의 합 k": "자연수 거듭제곱의 합 공식을 적용해 합을 계산한다.",
    "수열의 합과 일반항": "부분합과 일반항의 관계를 이용해 필요한 항 또는 합을 복원한다.",
    "수학적 귀납법": "초기항에서 가능한 분기를 만들고 점화 조건을 반복 적용한다.",
    "극한값": "좌극한·우극한 또는 극한의 성질을 적용해 미정 조건을 결정한다.",
    "∞/∞ 꼴": "최고차항 또는 지배항으로 나누어 무한대에서의 비를 정리한다.",
    "0/0 꼴": "인수분해나 약분으로 영이 되는 공통 요인을 제거한 뒤 극한을 계산한다.",
    "함수의 연속 조건": "좌극한·우극한·함숫값이 같다는 조건을 방정식으로 만든다.",
    "미분계수": "차분몫을 도함수 값으로 바꾸거나 직접 미분한 뒤 해당 점을 대입한다.",
    "곱의 미분": "곱의 미분법으로 도함수를 전개하고 주어진 함수값·미분계수를 대입한다.",
    "도함수와 함수의 개형": "도함수의 영점과 부호를 조사해 증가·감소와 극값을 확정한다.",
    "접선의 방정식": "접점의 좌표와 미분계수로 접선의 기울기와 방정식을 세운다.",
    "함수의 교점과 방정식의 실근": "두 함숫값을 같게 두고 교점의 개수와 실근 조건을 대응시킨다.",
    "인수 정리와 함수 추론": "주어진 근을 인수로 바꾸고 계수·함숫값 조건으로 나머지 인수를 정한다.",
    "속도와 가속도": "위치를 미분해 속도와 가속도를 구하고 부호 변화를 확인한다.",
    "부정적분": "도함수를 적분하고 주어진 함숫값으로 적분상수를 결정한다.",
    "정적분": "원시함수를 구해 적분구간의 양 끝값을 대입한다.",
    "정적분과 넓이": "교점을 경계로 위아래 함수를 구분하고 차를 정적분한다.",
    "정적분으로 정의된 함수": "적분구간의 끝점을 미분해 도함수로 바꾸고 함수 조건을 해석한다.",
    "위치와 거리": "위치 또는 속도식을 세우고 방향이 바뀌는 시점을 나누어 계산한다.",
    "원순열": "회전으로 같은 배열을 하나로 보고 기준 대상을 고정해 배열한다.",
    "중복순열": "각 자리에 가능한 선택 수를 곱해 함수 또는 배열의 수를 센다.",
    "같있순": "같은 대상의 중복 개수만큼 팩토리얼로 나누어 배열 수를 계산한다.",
    "중복조합": "대상별 선택 개수를 음이 아닌 정수해로 바꾸어 중복조합으로 센다.",
    "이항정리": "일반항에서 필요한 차수의 지수를 맞추고 해당 계수를 계산한다.",
    "확률의 덧셈정리": "사건을 합집합과 교집합으로 나누고 중복되는 경우를 조정한다.",
    "여사건의 확률": "직접 세기 어려운 사건의 여사건을 센 뒤 전체 확률에서 뺀다.",
    "조건부확률": "조건 사건으로 표본공간을 제한하고 교집합 확률과의 비를 계산한다.",
    "독립과 종속": "각 시행 또는 사건의 의존 관계를 확인하고 필요한 확률을 곱한다.",
    "이산확률변수": "가능한 값과 확률을 표로 정리한 뒤 기댓값·분산 공식을 적용한다.",
    "Y = aX+b 변환": "일차변환에 따른 기댓값과 분산의 변화를 적용한다.",
    "이항분포": "시행 횟수와 성공확률을 정해 이항확률 또는 평균·분산을 계산한다.",
    "연속확률변수": "확률밀도함수의 전체 넓이와 구간 넓이 조건을 이용한다.",
    "정규분포": "표준화한 뒤 대칭성과 표준정규분포 확률을 이용한다.",
    "표본평균": "표본평균의 평균과 표준편차로 분포를 정리한다.",
    "모평균의 추정": "신뢰수준의 임계값과 표준오차로 신뢰구간을 만든다.",
    "피타고라스": "직각삼각형의 변 길이를 피타고라스 정리로 연결한다.",
    "삼각형 각의 합": "삼각형의 내각 합을 이용해 필요한 각을 정한다.",
    "삼각형 넓이": "밑변·높이 또는 두 변과 끼인각으로 넓이를 표현한다.",
    "삼각형의 닮음": "대응각과 변의 비를 찾아 닮음비를 길이 관계로 옮긴다.",
    "이등변 삼각형": "같은 두 변과 밑각의 성질을 이용해 길이·각 조건을 줄인다.",
    "삼각형의 이등분선": "각의 이등분선 정리로 맞은편 변의 분할비를 구한다.",
    "원의 반지름": "중심에서 원 위의 점까지 같은 거리라는 조건을 사용한다.",
    "원주각과 중심각": "같은 호에 대한 중심각과 원주각의 관계를 적용한다.",
    "원과 접선": "접점에서 반지름과 접선이 수직임을 이용한다.",
    "곱셈공식과 변형": "곱셈공식으로 식을 전개하거나 필요한 대칭식으로 변형한다.",
    "인수분해": "다항식을 인수분해해 근과 부호 또는 교점 조건을 드러낸다.",
    "완전제곱식": "식을 완전제곱 형태로 바꾸어 최댓값·최솟값 또는 계수 조건을 읽는다.",
    "근의공식": "이차방정식의 계수를 근의 공식에 대입해 해를 구한다.",
    "판별식": "실근의 개수나 중근 조건을 판별식의 부호로 바꾼다.",
    "근과 계수의 관계": "두 근의 합과 곱을 계수와 연결한다.",
    "이차부등식": "이차식의 근과 그래프 방향으로 부호 구간을 정한다.",
    "조립제법": "알려진 근으로 다항식을 나누어 남은 인수와 계수를 구한다.",
    "절댓값 함수": "절댓값 안의 식의 부호가 바뀌는 지점에서 구간을 나눈다.",
    "평행이동과 대칭이동": "기준 그래프에서 좌표 이동과 대칭 관계를 추적한다.",
    "집합과 명제": "사건 조건을 집합의 포함·교집합·여집합 관계로 바꾼다.",
    "절대부등식": "항상 성립하는 부등식의 등호 조건을 확인한다.",
    "산술·기하 평균": "양수 조건을 확인하고 산술·기하평균 부등식의 등호 조건을 적용한다.",
    "함수의 종류": "대응 관계가 함수가 되는 조건과 일대일·전사 여부를 확인한다.",
    "유리함수": "점근선과 정의역을 확인하고 분수식을 표준형으로 정리한다.",
    "부분분수": "유리식을 부분분수로 분해해 계산 가능한 합으로 바꾼다.",
    "무리함수": "근호 안의 범위와 그래프의 시작점을 확인한다.",
    "유리화": "분모·분자의 켤레식을 곱해 근호가 있는 분모를 정리한다.",
    "합성함수와 역함수": "함숫값의 대응을 역으로 추적하고 합성 관계를 식으로 정리한다.",
    "경우의 수": "겹치지 않게 경우를 나누고 합의 법칙과 곱의 법칙으로 센다.",
    "수열의 극한": "수열의 수렴 조건과 극한의 성질을 적용해 미지수 또는 극한값을 정한다.",
    "여러 가지 함수의 극한": "지수·로그·삼각함수의 극한 성질을 이용해 극한값을 계산한다.",
    "지수·로그함수의 극한": "지수함수 또는 로그함수의 기본 극한을 표준형으로 바꾸어 계산한다.",
    "삼각함수의 극한": "삼각함수의 기본 극한과 도형·부등식 조건을 연결한다.",
    "급수": "부분합의 극한으로 급수의 수렴 여부와 합을 구한다.",
    "등비급수": "첫째항과 공비를 찾고 수렴 조건을 확인한 뒤 등비급수의 합을 계산한다.",
    "지수·로그함수의 미분": "지수함수와 로그함수의 도함수 공식을 적용한다.",
    "삼각함수의 미분": "삼각함수의 도함수와 주기·부호 관계를 함께 적용한다.",
    "삼각함수의 덧셈정리": "덧셈정리로 여러 각의 삼각함수 값을 하나의 관계식으로 정리한다.",
    "여러 가지 함수의 미분": "지수·로그·삼각함수와 합성된 식을 알맞은 미분법으로 미분한다.",
    "몫의 미분": "분자와 분모를 구분해 몫의 미분법으로 도함수를 계산한다.",
    "합성함수의 미분": "바깥함수와 안쪽함수를 구분해 연쇄법칙을 적용한다.",
    "매개변수 미분": "매개변수에 대한 두 미분값의 비로 필요한 변화율을 구한다.",
    "음함수와 역함수의 미분": "음함수 또는 역함수 관계를 미분해 필요한 미분계수를 구한다.",
    "이계도함수": "도함수를 한 번 더 미분해 이계도함수와 오목·볼록 조건을 확인한다.",
    "미분법과 함수의 개형": "도함수의 부호와 극값을 조사해 함수의 개형과 조건을 확정한다.",
    "미분법과 방정식·부등식": "함수의 개형을 이용해 방정식의 실근 수나 부등식의 해를 판정한다.",
    "치환적분": "적분식의 안쪽 표현을 새 변수로 치환하고 구간 또는 미분요소를 함께 바꾼다.",
    "부분적분": "곱으로 된 적분을 미분하기 쉬운 항과 적분하기 쉬운 항으로 나누어 부분적분한다.",
    "여러 가지 함수의 부정적분": "지수·로그·삼각함수의 적분 공식을 이용해 원시함수를 구한다.",
    "미적분의 정적분": "여러 가지 함수의 원시함수를 구해 적분구간의 양 끝값을 대입한다.",
    "미적분의 넓이": "교점과 부호가 바뀌는 지점을 기준으로 구간을 나누어 넓이를 적분한다.",
    "입체도형의 부피": "단면의 넓이를 높이 방향으로 적분해 입체의 부피를 구한다.",
    "곡선의 길이": "곡선을 나타내는 함수와 구간을 확인해 길이 공식을 정적분한다.",
    "미적분의 속도·거리": "속도의 부호가 바뀌는 시점을 나누어 이동거리나 위치 변화를 적분한다.",
    "이차곡선": "포물선·타원·쌍곡선의 정의와 초점·준선 관계를 식으로 옮긴다.",
    "평면벡터": "벡터의 성분과 내적을 이용해 길이·각·위치 관계를 계산한다.",
    "공간도형과 공간좌표": "공간좌표와 정사영·구의 관계를 이용해 길이와 위치를 구한다.",
}


def parse_categories():
    text = CATEGORY_FILE.read_text(encoding="utf-8")
    exams = {}
    for exam_match in re.finditer(r"'(202[67]\|(?:6모|9모|수능))':\s*\{(.*?)\n\s*\},", text, re.S):
        exam_key, body = exam_match.groups()
        entries = {}
        for item in re.finditer(r"^\s*(\d+):\s*\[(.*?)\],?$", body, re.M):
            entries[int(item.group(1))] = re.findall(r"'([^']+)'", item.group(2))
        exams[exam_key] = entries
    return exams


def clean_intent(text):
    text = re.sub(r"[\ue000-\uf8ff]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+\d+$", "", text)
    text = text.replace("", "Σ")
    return text


def clean_problem_text(text):
    translation = {ord(char): value for char, value in zip("", "0123456789")}
    translation.update({
        ord(chr(0xE0E5 + index)): chr(ord("a") + index)
        for index in range(26)
    })
    translation.update({
        ord(chr(0xE000 + index)): chr(ord("A") + index)
        for index in range(26)
    })
    text = text.translate(translation)
    replacements = {
        "": "√", "": "√", "": "Σ", "": "π", "": "-", "": "+", "": "=",
        "": "(", "": ")", "": "<", "": ">", "": "/", "′": "′",
        "": "[", "": "]", "": "{", "": "}", "": "|", "": ":",
        "": ",", "": ".", "": "∫", "": "", "": "", "": "", "": "",
        "": "α", "": "β", "": "θ", "": "σ", "": "|",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = re.sub(r"[\ue000-\uf8ff]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def math_to_latex(text):
    text = clean_problem_text(text)
    text = re.sub(r"√\s*([A-Za-z0-9]+)", r"\\sqrt{\1}", text)
    text = re.sub(r"Σ\s*([a-z])\s*=\s*(-?\d+)\s+(\d+)", r"\\sum_{\1=\2}^{\3}", text)
    text = re.sub(r"∫\s*(-?\d+)\s+(\d+)", r"\\int_{\1}^{\2}", text)
    text = re.sub(r"/(\d+)\s+(-?\d+)", r"\\frac{\2}{\1}", text)
    text = re.sub(r"/([A-Z])", r"\\overline{\1}", text)
    text = re.sub(r"([xt])([2-9])\b", r"\1^{\2}", text)
    text = re.sub(r"\b(a|b|c|d|p|q|r|n|k)(\d+)\b", r"\1_{\2}", text)
    text = re.sub(r"\blim\b", r"\\lim", text)
    text = re.sub(r"\b(log|sin|cos|tan)\b", r"\\\1", text)
    symbol_replacements = {
        "≥": r"\ge ", "≤": r"\le ", "×": r"\times ", "∞": r"\infty ",
        "→": r"\to ", "∪": r"\cup ", "∩": r"\cap ", "∈": r"\in ",
        "≠": r"\ne ", "π": r"\pi ", "θ": r"\theta ", "α": r"\alpha ",
        "β": r"\beta ", "σ": r"\sigma ",
    }
    for source, target in symbol_replacements.items():
        text = text.replace(source, target)
    parts = []
    for part in re.split(r"([가-힣]+)", text):
        if not part:
            continue
        if re.fullmatch(r"[가-힣]+", part):
            parts.append(r"\text{" + part + "}")
        else:
            parts.append(part.replace("%", r"\%"))
    return r"\(\displaystyle " + "".join(parts).strip() + r"\)"


def parse_questions(files):
    result = {}
    for exam_key, path in files.items():
        text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
        starts = []
        expected = 1
        for match in re.finditer(r"(?<!\d)([1-9]|[12]\d|30)\.\s*", text):
            if int(match.group(1)) == expected:
                starts.append(match)
                expected += 1
                if expected == 31:
                    break
        questions = {}
        for index, match in enumerate(starts):
            end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
            body = text[match.end():end]
            score_end = re.search(r"\[[234]점\]", body)
            if score_end:
                body = body[:score_end.end()]
                questions[index + 1] = math_to_latex(body)
        result[exam_key] = questions
    return result


def parse_intents(files, selection_subject):
    result = {}
    for exam_key, path in files.items():
        text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
        text = text.translate(str.maketrans("０１２３４５６７８９", "0123456789"))
        intents = {}
        marker = re.search(rf"(?:■\s*)?\[선택:\s*{re.escape(selection_subject)}\]", text)
        if marker:
            common_text = text[:marker.start()]
            selection_text = text[marker.end():]
            selection_text = re.split(r"■\s*\[선택:", selection_text, maxsplit=1)[0]
            sections = ((common_text, 1, 22), (selection_text, 23, 30))
        else:
            sections = ((text, 1, 30),)
        for section_text, first, last in sections:
            patterns = (
                r"(\d{1,2})\.\s*출제\s*의도\s*:\s*(.*?)(?=(?:정답\s*)?풀이\s*:)",
                r"출제\s*의도\s*\.?\s*(\d{1,2})\s*\.\s*(.*?)(?=정답\s*풀이\s*:)",
            )
            for pattern in patterns:
                for match in re.finditer(pattern, section_text, re.S):
                    number = int(match.group(1))
                    if first <= number <= last and number not in intents:
                        intents[number] = clean_intent(re.sub(r"\s*:\s*$", "", match.group(2)))
        result[exam_key] = intents
    return result


def score_for(number):
    if number in (1, 2, 23):
        return 2
    if 3 <= number <= 8 or 16 <= number <= 19 or 24 <= number <= 27:
        return 3
    return 4


def legacy_score_for(number):
    if 1 <= number <= 3:
        return 2
    if 4 <= number <= 13 or 22 <= number <= 25:
        return 3
    return 4


def difficulty_for(number, score):
    if score == 2:
        return {"level": "하", "rank": 1}
    if score == 3:
        return {"level": "중", "rank": 2}
    if number in (21, 22, 29, 30):
        return {"level": "상", "rank": 4}
    return {"level": "중상", "rank": 3}


def fallback_intent(categories):
    joined = "·".join(categories)
    return f"{joined}의 관계를 이용하여 문제에서 요구한 값을 구할 수 있는가?"


def add_category(result, category):
    if category not in result:
        result.append(category)


def infer_categories(intent, problem_text, number):
    # 해설의 출제 의도가 있으면 문제 본문의 우연한 단어보다 우선한다.
    source = intent if intent else problem_text
    categories = []
    if number <= 22:
        trig_source = any(word in source for word in ("삼각함수", "사인함수", "코사인함수", "탄젠트함수"))
        if "거듭제곱근" in source or "제곱근의 의미" in source or "제곱근의 뜻" in source:
            add_category(categories, "거듭제곱근")
        if "지수법칙" in source or ("로그" in source and "성질" in source and "그래프" not in source and "방정식" not in source and "부등식" not in source):
            add_category(categories, "지수·로그 계산")
        if "지수방정식" in source or "로그방정식" in source or "지수부등식" in source or "로그부등식" in source or ("로그" in source and ("미지수" in source or "방정식" in source)) or ("지수" in source and "미지수" in source):
            add_category(categories, "지수·로그 방정식·부등식")
        if ("지수함수" in source or "로그함수" in source) and ("그래프" in source or "점근선" in source or "위치 관계" in source):
            add_category(categories, "지수·로그함수 그래프")
        if trig_source and ("값" in source or "정의" in source or "관계" in source):
            add_category(categories, "삼각함수 계산")
        if trig_source and ("방정식" in source or "부등식" in source):
            add_category(categories, "삼각 방정식·부등식")
        if trig_source and ("그래프" in source or "주기" in source or "최댓값" in source or "최솟값" in source):
            add_category(categories, "삼각함수 그래프")
        if "사인법칙" in source or "코사인법칙" in source:
            add_category(categories, "사인·코사인 법칙")
        if "등차수열" in source or "등비수열" in source:
            add_category(categories, "등차·등비수열")
            if "수열의 합" in source or "등차수열의 합" in source or "등비수열의 합" in source:
                add_category(categories, "등차·등비수열의 합")
        if "합의 기호" in source or "시그마" in source or "여러 가지 수열의 합" in source:
            add_category(categories, "수열의 합 Σ")
        if "합과 일반항" in source:
            add_category(categories, "수열의 합과 일반항")
        if "귀납적" in source or "귀납적으로" in source:
            add_category(categories, "수학적 귀납법")
        if "좌극한" in source or "우극한" in source or "함수의 극한" in source:
            add_category(categories, "극한값")
        if "연속" in source:
            add_category(categories, "함수의 연속 조건")
        if "미분계수" in source or "평균변화율" in source:
            add_category(categories, "미분계수")
        if "곱의 미분" in source:
            add_category(categories, "곱의 미분")
        if "극대" in source or "극소" in source or "극댓값" in source or "극솟값" in source or "증가" in source or "감소" in source or "그래프의 개형" in source or (("최댓값" in source or "최솟값" in source) and ("도함수" in source or "미분" in source or "다항함수" in source)):
            add_category(categories, "도함수와 함수의 개형")
        if "접선" in source:
            add_category(categories, "접선의 방정식")
        if "실근" in source or "두 곡선이" in source and "만나" in source:
            add_category(categories, "함수의 교점과 방정식의 실근")
        if "속도" in source or "가속도" in source:
            if "가속도" in source:
                add_category(categories, "속도와 가속도")
            add_category(categories, "위치와 거리")
        if "부정적분" in source:
            add_category(categories, "부정적분")
        if "정적분으로" in source or "정적분으로 나타" in source or "정적분으로 정의" in source:
            add_category(categories, "정적분으로 정의된 함수")
        if "넓이" in source and ("정적분" in source or "곡선" in source):
            add_category(categories, "정적분과 넓이")
        elif "정적분" in source and "부정적분" not in source:
            add_category(categories, "정적분")
        if "삼각형의 넓이" in source or "삼각형의 넓" in source:
            add_category(categories, "삼각형 넓이")
        if "외접원" in source or "원의 반지름" in source:
            add_category(categories, "원의 반지름")
        if "절댓값" in source:
            add_category(categories, "절댓값 함수")
        if "명제의 참" in source or "명제의 참, 거짓" in source:
            add_category(categories, "집합과 명제")
        if "판별식" in source:
            add_category(categories, "판별식")
    else:
        if "원순열" in source:
            add_category(categories, "원순열")
        if "중복순열" in source:
            add_category(categories, "중복순열")
        if "같은 것이" in source or "같은 것이 포함" in source:
            add_category(categories, "같있순")
        if "중복조합" in source:
            add_category(categories, "중복조합")
        if "이항정리" in source:
            add_category(categories, "이항정리")
        if "확률의 덧셈정리" in source or "합의 법칙" in source:
            add_category(categories, "확률의 덧셈정리")
        if "여사건" in source:
            add_category(categories, "여사건의 확률")
        if "조건부확률" in source or "조건부 확률" in source:
            add_category(categories, "조건부확률")
        if "독립시행" in source or "서로 독립" in source:
            add_category(categories, "독립과 종속")
        if "이산확률변수" in source or "확률분포가 표" in source or "확률변수의 평균" in source or "확률변수의 분산" in source:
            add_category(categories, "이산확률변수")
        if "이항분포" in source:
            add_category(categories, "이항분포")
        if "연속확률변수" in source or "확률밀도함수" in source:
            add_category(categories, "연속확률변수")
        if "정규분포" in source or "표준정규분포" in source:
            add_category(categories, "정규분포")
        if "표본평균" in source:
            add_category(categories, "표본평균")
        if "모평균" in source or "신뢰구간" in source:
            add_category(categories, "모평균의 추정")
        if not categories and "함수" in source and "개수" in source:
            add_category(categories, "중복순열")
        if not categories and "경우의 수" in source:
            add_category(categories, "경우의 수")
        if not categories and "확률" in source:
            add_category(categories, "확률의 덧셈정리")
    return categories or (["극한값"] if number <= 22 else ["경우의 수"])


def infer_calculus_categories(intent, problem_text):
    source = intent if intent else problem_text
    categories = []
    if "지수함수" in source and "극한" in source or "로그함수" in source and "극한" in source:
        add_category(categories, "지수·로그함수의 극한")
    if "삼각함수" in source and "극한" in source:
        add_category(categories, "삼각함수의 극한")
    if "함수의 극한" in source and not any(category in categories for category in ("지수·로그함수의 극한", "삼각함수의 극한")):
        add_category(categories, "여러 가지 함수의 극한")
    if "등비급수" in source:
        add_category(categories, "등비급수")
    if "급수" in source and "등비급수" not in source:
        add_category(categories, "급수")
    if "수열의 극한" in source or "수열이 수렴" in source or "수열이 발산" in source:
        add_category(categories, "수열의 극한")
    if ("지수함수" in source or "로그함수" in source or "자연로그" in source) and ("미분" in source or "도함수" in source or "접선" in source):
        add_category(categories, "지수·로그함수의 미분")
    if "삼각함수" in source and ("미분" in source or "도함수" in source or "접선" in source):
        add_category(categories, "삼각함수의 미분")
    if "삼각함수의 덧셈정리" in source:
        add_category(categories, "삼각함수의 덧셈정리")
    if "여러 가지 함수의 미분" in source or "여러 가지 미분법" in source:
        add_category(categories, "여러 가지 함수의 미분")
    if "몫의 미분" in source:
        add_category(categories, "몫의 미분")
    if "합성함수" in source and ("미분" in source or "도함수" in source):
        add_category(categories, "합성함수의 미분")
    if "매개변수" in source:
        add_category(categories, "매개변수 미분")
    if "음함수" in source or "역함수" in source:
        add_category(categories, "음함수와 역함수의 미분")
    if "이계도함수" in source or "이차도함수" in source:
        add_category(categories, "이계도함수")
    if "접선" in source:
        add_category(categories, "접선의 방정식")
    if any(word in source for word in ("극대", "극소", "극댓값", "극솟값", "증가", "감소", "그래프의 개형", "최댓값", "최솟값")) and any(word in source for word in ("미분", "도함수", "함수")):
        add_category(categories, "미분법과 함수의 개형")
    if "실근" in source or (("방정식" in source or "부등식" in source) and any(word in source for word in ("미분", "도함수", "그래프"))):
        add_category(categories, "미분법과 방정식·부등식")
    if "치환적분" in source:
        add_category(categories, "치환적분")
    if "부분적분" in source:
        add_category(categories, "부분적분")
    if "부정적분" in source:
        add_category(categories, "여러 가지 함수의 부정적분")
    if "부피" in source:
        add_category(categories, "입체도형의 부피")
    if "속도" in source or "속력" in source or "움직인 거리" in source or "이동 거리" in source:
        add_category(categories, "미적분의 속도·거리")
    if "곡선의 길이" in source:
        add_category(categories, "곡선의 길이")
    if "넓이" in source and ("적분" in source or "곡선" in source):
        add_category(categories, "미적분의 넓이")
    elif "정적분" in source or "적분값" in source:
        add_category(categories, "미적분의 정적분")
    if not categories and any(word in source for word in ("미분", "도함수", "접선")):
        add_category(categories, "미분법과 함수의 개형")
    if not categories and "적분" in source:
        add_category(categories, "미적분의 정적분")
    return categories or ["수열의 극한"]


def infer_legacy_categories(intent, problem_text):
    """Map 2009/2015-curriculum wording onto the existing 2022~2027 taxonomy."""
    source = f"{intent} {clean_problem_text(problem_text)}"
    compact = re.sub(r"\s+", "", source)
    intent_compact = re.sub(r"\s+", "", intent)
    categories = []

    # 2015 개정 공통·수학 I·수학 II 분류
    if "거듭제곱근" in source or "제곱근" in intent:
        add_category(categories, "거듭제곱근")
    if "로그" in source or "지수" in source:
        if any(word in compact for word in ("방정식", "부등식", "해의개수")):
            add_category(categories, "지수·로그 방정식·부등식")
        if any(word in compact for word in ("그래프", "점근선", "교점", "위치관계")):
            add_category(categories, "지수·로그함수 그래프")
        if any(word in intent_compact for word in ("지수법칙", "지수의성질", "로그의값", "로그값", "로그를계산", "로그계산", "로그의성질", "지수가유리수")):
            add_category(categories, "지수·로그 계산")
    if "삼각함수" in source or any(word in source for word in ("사인함수", "코사인함수", "탄젠트함수")):
        if "덧셈정리" in source:
            add_category(categories, "삼각함수의 덧셈정리")
        if any(word in compact for word in ("방정식", "부등식")):
            add_category(categories, "삼각 방정식·부등식")
        if any(word in source for word in ("그래프", "주기", "최댓값", "최솟값")):
            add_category(categories, "삼각함수 그래프")
        if any(word in intent_compact for word in ("삼각함수의값", "삼각함수의함숫값", "삼각함수를이용", "삼각함수사이")):
            add_category(categories, "삼각함수 계산")
    if "삼각방정식" in compact or "삼각부등식" in compact:
        add_category(categories, "삼각 방정식·부등식")
    if "사인법칙" in source or "코사인법칙" in source:
        add_category(categories, "사인·코사인 법칙")
    if "등차수열" in source or "등비수열" in source:
        add_category(categories, "등차·등비수열")
        if "합" in intent:
            add_category(categories, "등차·등비수열의 합")
    if any(word in intent_compact for word in ("수열의합", "여러가지수열", "합의기호", "시그마")):
        add_category(categories, "수열의 합 Σ")
    if "합과 일반항" in source or "부분합" in source and "일반항" in source:
        add_category(categories, "수열의 합과 일반항")
    if any(word in intent_compact for word in ("귀납적으로", "귀납적정의", "수학적귀납법", "점화식", "점화관계")):
        add_category(categories, "수학적 귀납법")

    if "극한" in intent_compact and "수열" not in intent_compact and "급수" not in intent_compact or "좌극한" in compact or "우극한" in compact:
        if any(word in source for word in ("지수함수", "로그함수", "ln", "log", "e")):
            add_category(categories, "지수·로그함수의 극한")
        elif "삼각함수" in source or any(word in source for word in ("sin", "cos", "tan")):
            add_category(categories, "삼각함수의 극한")
        elif "여러가지함수" in intent_compact:
            add_category(categories, "여러 가지 함수의 극한")
        else:
            add_category(categories, "극한값")
    if "수열" in intent_compact and any(word in intent_compact for word in ("극한", "수렴", "발산")):
        add_category(categories, "수열의 극한")
    if "급수" in source:
        add_category(categories, "등비급수" if "등비급수" in source else "급수")
    if "연속" in intent_compact or "미분가능" in intent_compact:
        add_category(categories, "함수의 연속 조건")

    transcendental = any(word in source for word in ("지수함수", "로그함수", "삼각함수", "ln", "log", "sin", "cos", "tan", "e^"))
    if "미분계수" in intent_compact or "도함수" in intent_compact or "미분가능" in intent_compact:
        if any(word in source for word in ("지수함수", "로그함수", "ln", "log", "e^")):
            add_category(categories, "지수·로그함수의 미분")
        elif "삼각함수" in source or any(word in source for word in ("sin", "cos", "tan")):
            add_category(categories, "삼각함수의 미분")
        elif "여러 가지 함수" in intent:
            add_category(categories, "여러 가지 함수의 미분")
        else:
            add_category(categories, "미분계수")
    if "곱의 미분" in source:
        add_category(categories, "곱의 미분")
    if "몫의 미분" in source:
        add_category(categories, "몫의 미분")
    if "합성함수의 미분" in source:
        add_category(categories, "합성함수의 미분")
    if "매개변수" in intent:
        add_category(categories, "매개변수 미분")
    if "음함수" in intent or "역함수의 미분" in intent:
        add_category(categories, "음함수와 역함수의 미분")
    if "이계도함수" in compact or "이차도함수" in compact or "변곡점" in intent_compact:
        add_category(categories, "이계도함수")
    if "접선" in intent:
        add_category(categories, "접선의 방정식")
    if any(word in intent_compact for word in ("극값", "극대", "극소", "극댓값", "극솟값", "증가", "감소", "그래프의개형", "최댓값", "최솟값", "변곡점")):
        add_category(categories, "미분법과 함수의 개형" if transcendental else "도함수와 함수의 개형")
    if "실근" in intent_compact or "방정식의근의개수" in intent_compact:
        add_category(categories, "미분법과 방정식·부등식" if transcendental else "함수의 교점과 방정식의 실근")
    if "속도" in intent_compact or "속력" in intent_compact or "가속도" in intent_compact or ("수직선" in intent_compact and "거리" in intent_compact):
        if transcendental:
            add_category(categories, "미적분의 속도·거리")
        else:
            if "가속도" in intent:
                add_category(categories, "속도와 가속도")
            add_category(categories, "위치와 거리")

    if "부정적분" in intent_compact:
        add_category(categories, "여러 가지 함수의 부정적분" if transcendental else "부정적분")
    if "치환적분" in source:
        add_category(categories, "치환적분")
    if "부분적분" in source:
        add_category(categories, "부분적분")
    if "정적분" in intent_compact or "적분값" in intent_compact:
        if "넓이" in intent_compact:
            add_category(categories, "미적분의 넓이" if transcendental else "정적분과 넓이")
        elif "정의된함수" in intent_compact or "적분으로정의" in intent_compact:
            add_category(categories, "정적분으로 정의된 함수")
        else:
            add_category(categories, "미적분의 정적분" if transcendental else "정적분")
    elif "넓이" in intent_compact and any(word in compact for word in ("곡선", "함수", "적분", "무한히반복")):
        add_category(categories, "미적분의 넓이" if transcendental else "정적분과 넓이")
    if "부피" in intent_compact:
        add_category(categories, "입체도형의 부피")
    if "곡선의길이" in intent_compact:
        add_category(categories, "곡선의 길이")

    # 2015 개정 확률과 통계 분류
    if "원순열" in source:
        add_category(categories, "원순열")
    if "중복순열" in source or "함수의 개수" in intent:
        add_category(categories, "중복순열")
    if "같은 것이 포함" in source:
        add_category(categories, "같있순")
    if "중복조합" in source or "분할" in intent:
        add_category(categories, "중복조합")
    if "이항정리" in source or "이항계수" in source:
        add_category(categories, "이항정리")
    if any(word in intent_compact for word in ("순열의수", "조합의수", "경우의수")) and not any(category in categories for category in ("원순열", "중복순열", "같있순", "중복조합")):
        add_category(categories, "경우의 수")
    if "조건부확률" in source or "조건부 확률" in source:
        add_category(categories, "조건부확률")
    if "여사건" in source:
        add_category(categories, "여사건의 확률")
    if "독립시행" in source or "독립 시행" in source or "서로 독립" in source:
        add_category(categories, "독립과 종속")
    if "확률의 곱셈정리" in source:
        add_category(categories, "조건부확률")
    if "확률" in intent_compact and not any(category in categories for category in ("조건부확률", "여사건의 확률", "독립과 종속")):
        add_category(categories, "확률의 덧셈정리")
    if "독립" in intent_compact:
        add_category(categories, "독립과 종속")
    if any(word in source for word in ("이산확률변수", "확률변수의 평균", "확률변수의 분산", "확률분포")):
        add_category(categories, "이산확률변수")
    if "이항분포" in source:
        add_category(categories, "이항분포")
    if "연속확률변수" in source or "확률밀도함수" in source:
        add_category(categories, "연속확률변수")
    if "정규분포" in source or "표준정규분포" in source:
        add_category(categories, "정규분포")
    if "표본평균" in source:
        add_category(categories, "표본평균")
    if "모평균" in source or "신뢰구간" in source:
        add_category(categories, "모평균의 추정")

    # 당시 기하와 벡터 문항도 현재(2015 개정) 기하의 기존 대단원에 대응한다.
    if any(word in compact for word in ("포물선", "타원", "쌍곡선", "평면곡선", "이차곡선")):
        add_category(categories, "이차곡선")
    if "벡터" in source and not any(word in source for word in ("공간벡터", "공간 벡터")):
        add_category(categories, "평면벡터")
    if any(word in compact for word in ("공간도형", "좌표공간", "공간좌표", "공간벡터", "정사영", "구의방정식", "두평면")):
        add_category(categories, "공간도형과 공간좌표")
    if "삼수선" in compact:
        add_category(categories, "공간도형과 공간좌표")

    # 현재 분류의 간접 출제 항목
    indirect_rules = (
        ("판별식", "판별식"), ("근과 계수", "근과 계수의 관계"),
        ("인수분해", "인수분해"), ("완전제곱", "완전제곱식"),
        ("절댓값", "절댓값 함수"), ("명제", "집합과 명제"),
        ("필요조건", "집합과 명제"), ("충분조건", "집합과 명제"),
        ("대우", "집합과 명제"), ("진리집합", "집합과 명제"),
        ("유리함수", "유리함수"), ("분수함수", "유리함수"),
        ("무리함수", "무리함수"), ("역함수", "합성함수와 역함수"),
        ("합성함수", "합성함수와 역함수"),
        ("평행이동", "평행이동과 대칭이동"), ("대칭이동", "평행이동과 대칭이동"),
    )
    for keyword, category in indirect_rules:
        if keyword in intent_compact:
            add_category(categories, category)

    if any(word in intent_compact for word in ("집합의원소", "집합의연산", "합집합", "교집합", "부분집합", "집합이서로")):
        add_category(categories, "집합과 명제")

    if "함수의대응관계" in intent_compact:
        add_category(categories, "함수의 종류")
    if "점근선" in intent_compact and "로그" not in compact:
        add_category(categories, "유리함수")
    if "미분" in intent_compact and not any("미분" in category or category in ("미분계수", "도함수와 함수의 개형", "접선의 방정식", "함수의 연속 조건") for category in categories):
        add_category(categories, "도함수와 함수의 개형")
    if "무한히반복" in compact and "넓이" in compact:
        add_category(categories, "등비급수")

    return categories or ["경우의 수"]


CALCULUS_OVERRIDES = {
    "2022|6모": {
        27: ["미분법과 방정식·부등식"],
        28: ["삼각함수의 극한"],
        29: ["여러 가지 함수의 미분"],
        30: ["여러 가지 함수의 미분"],
    },
    "2022|9모": {
        24: ["삼각함수의 덧셈정리"],
        30: ["삼각함수의 극한", "미분법과 함수의 개형", "치환적분", "미적분의 정적분"],
    },
    "2022|수능": {
        23: ["수열의 극한"],
        24: ["합성함수의 미분", "지수·로그함수의 미분"],
        25: ["등비급수"],
        26: ["미적분의 정적분"],
        27: ["미적분의 속도·거리"],
        28: ["합성함수의 미분", "삼각함수의 미분", "미분법과 함수의 개형"],
        29: ["삼각함수의 극한"],
        30: ["음함수와 역함수의 미분", "부분적분", "미적분의 정적분"],
    },
    "2023|6모": {29: ["삼각함수의 극한"]},
    "2023|9모": {
        23: ["지수·로그함수의 극한"],
        28: ["삼각함수의 극한"],
    },
    "2023|수능": {
        27: ["등비급수"],
        28: ["삼각함수의 극한"],
        30: ["미분법과 함수의 개형"],
    },
    "2024|6모": {
        25: ["지수·로그함수의 극한"],
        27: ["삼각함수의 극한"],
        30: ["미분법과 함수의 개형"],
    },
    "2024|9모": {
        23: ["지수·로그함수의 극한"],
        27: ["곡선의 길이", "미적분의 정적분"],
    },
    "2024|수능": {
        23: ["지수·로그함수의 극한"],
        30: ["미분법과 함수의 개형"],
    },
    "2025|6모": {
        26: ["지수·로그함수의 극한"],
        30: ["삼각함수의 덧셈정리", "수열의 극한"],
    },
    "2025|9모": {
        23: ["삼각함수의 극한"],
        24: ["여러 가지 함수의 부정적분"],
        30: ["여러 가지 함수의 부정적분", "미분법과 함수의 개형"],
    },
    "2025|수능": {
        23: ["삼각함수의 극한"],
        24: ["여러 가지 함수의 부정적분", "미적분의 정적분"],
    },
    "2027|6모": {
        26: ["삼각함수의 미분", "삼각함수의 덧셈정리"],
        27: ["미적분의 속도·거리"],
    },
    "2027|9모": {
        23: ["지수·로그함수의 극한"],
        24: ["부분적분", "미적분의 정적분"],
        25: ["수열의 극한"],
        26: ["접선의 방정식", "미적분의 넓이"],
        27: ["합성함수의 미분", "음함수와 역함수의 미분"],
        28: ["매개변수 미분", "음함수와 역함수의 미분"],
        29: ["등비급수"],
        30: ["음함수와 역함수의 미분", "치환적분", "미적분의 정적분"],
    },
}


# 2018학년도 수능 해설 PDF는 한글 ToUnicode 표가 깨져 텍스트 추출이 불가능하다.
# 렌더링된 문제·해설 전 페이지를 확인해 현재 분류 체계로 직접 대응했다.
LEGACY_CATEGORY_OVERRIDES = {
    ("2019|6모", "가형"): {1: ["경우의 수"]},
    ("2019|수능", "가형"): {
        30: ["합성함수의 미분", "삼각함수의 미분", "미분법과 함수의 개형"],
    },
    ("2017|9모", "나형"): {9: ["수열의 합 Σ"]},
    ("2017|수능", "나형"): {
        21: ["함수의 종류", "경우의 수", "원의 반지름", "수열의 합 Σ"],
    },
    ("2018|6모", "나형"): {
        21: ["유리함수", "절댓값 함수", "경우의 수"],
        24: ["집합과 명제", "경우의 수"],
    },
    ("2019|6모", "나형"): {
        17: ["곱의 미분", "인수 정리와 함수 추론"],
        21: ["이차부등식", "도함수와 함수의 개형"],
        28: ["함수의 연속 조건", "0/0 꼴", "인수 정리와 함수 추론"],
        30: ["수열의 합 Σ", "인수 정리와 함수 추론", "도함수와 함수의 개형"],
    },
    ("2019|9모", "나형"): {
        30: ["합성함수와 역함수", "함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
    },
    ("2019|수능", "나형"): {
        16: ["등비급수", "삼각형 넓이", "원의 반지름"],
        19: ["중복순열", "함수의 종류", "합성함수와 역함수"],
        15: ["지수·로그 방정식·부등식"],
    },
    ("2020|6모", "가형"): {
        9: ["미분계수", "합성함수의 미분", "지수·로그함수의 미분"],
    },
    ("2020|6모", "나형"): {
        4: ["합성함수와 역함수"],
        21: ["합성함수와 역함수", "절댓값 함수", "함수의 종류"],
    },
    ("2020|수능", "나형"): {
        30: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
    },
    ("2020|9모", "나형"): {28: ["지수·로그 계산"]},
    ("2021|6모", "가형"): {
        5: ["급수", "수열의 극한"],
        21: ["수열의 합 Σ", "지수·로그 계산"],
        27: ["조건부확률", "경우의 수"],
    },
    ("2021|9모", "가형"): {4: ["급수", "부분분수"]},
    ("2021|수능", "나형"): {1: ["지수·로그 계산"]},
    ("2018|수능", "가형"): {
        1: ["평면벡터"],
        2: ["지수·로그함수의 극한"],
        3: ["공간도형과 공간좌표"],
        4: ["확률의 덧셈정리", "독립과 종속"],
        5: ["지수·로그함수 그래프", "평행이동과 대칭이동"],
        6: ["이항정리"],
        7: ["삼각 방정식·부등식"],
        8: ["이차곡선"],
        9: ["미분계수", "몫의 미분"],
        10: ["표본평균", "정규분포"],
        11: ["음함수와 역함수의 미분"],
        12: ["미적분의 넓이", "미적분의 정적분"],
        13: ["조건부확률"],
        14: ["삼각함수의 덧셈정리"],
        15: ["치환적분", "합성함수와 역함수"],
        16: ["매개변수 미분", "미적분의 속도·거리"],
        17: ["삼각함수의 극한", "삼각형 넓이"],
        18: ["같있순"],
        19: ["이산확률변수", "독립과 종속"],
        20: ["공간도형과 공간좌표"],
        21: ["합성함수의 미분", "미분법과 함수의 개형", "접선의 방정식"],
        22: ["경우의 수"],
        23: ["합성함수의 미분", "지수·로그함수의 미분"],
        24: ["음함수와 역함수의 미분"],
        25: ["평면벡터"],
        26: ["정규분포"],
        27: ["이차곡선"],
        28: ["중복조합", "확률의 덧셈정리"],
        29: ["공간도형과 공간좌표"],
        30: ["정적분으로 정의된 함수", "삼각함수 그래프", "부분적분", "미적분의 정적분"],
    },
    ("2018|수능", "나형"): {
        1: ["지수·로그 계산"],
        2: ["집합과 명제"],
        3: ["수열의 극한"],
        4: ["합성함수와 역함수"],
        5: ["극한값"],
        6: ["집합과 명제"],
        7: ["조건부확률"],
        8: ["중복조합"],
        9: ["정적분"],
        10: ["독립과 종속", "확률의 덧셈정리"],
        11: ["유리함수", "평행이동과 대칭이동", "경우의 수"],
        12: ["이항정리"],
        13: ["수학적 귀납법"],
        14: ["등차·등비수열", "수열의 합 Σ"],
        15: ["표본평균", "정규분포"],
        16: ["지수·로그 계산"],
        17: ["이산확률변수", "Y = aX+b 변환"],
        18: ["0/0 꼴", "인수 정리와 함수 추론"],
        19: ["등비급수", "삼각형 넓이"],
        20: ["도함수와 함수의 개형"],
        21: ["합성함수와 역함수", "함수의 교점과 방정식의 실근"],
        22: ["경우의 수"],
        23: ["미분계수"],
        24: ["집합과 명제"],
        25: ["0/0 꼴"],
        26: ["정적분과 넓이"],
        27: ["수열의 합 Σ"],
        28: ["독립과 종속"],
        29: ["미분계수", "접선의 방정식", "도함수와 함수의 개형"],
        30: ["정적분", "등비급수", "함수의 교점과 방정식의 실근"],
    },
}


# 해설 문구만으로는 세부 풀이 유형이 드러나지 않거나, PDF 문자가 깨진 문항을
# 문제와 해설을 함께 확인해 보정한다.
CATEGORY_OVERRIDES = {
    "2022|6모": {
        13: ["삼각함수 그래프", "수열의 합 Σ"],
        17: ["도함수와 함수의 개형"],
        20: ["정적분으로 정의된 함수", "도함수와 함수의 개형"],
        22: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
    },
    "2022|9모": {
        5: ["도함수와 함수의 개형"], 9: ["위치와 거리"],
        10: ["삼각함수 그래프"],
        14: ["정적분", "집합과 명제"],
        17: ["부정적분"],
        20: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
        21: ["지수·로그함수 그래프", "삼각형 넓이"],
        22: ["함수의 연속 조건", "도함수와 함수의 개형"],
        23: ["이항분포"],
        27: ["표본평균"],
    },
    "2022|수능": {
        1: ["지수·로그 계산"], 2: ["미분계수"], 3: ["등차·등비수열"],
        4: ["극한값"], 5: ["수학적 귀납법", "수열의 합 Σ"],
        6: ["도함수와 함수의 개형", "함수의 교점과 방정식의 실근"],
        7: ["삼각함수 계산"], 8: ["정적분과 넓이"],
        9: ["지수·로그함수 그래프"], 10: ["곱의 미분", "접선의 방정식"],
        11: ["삼각함수 그래프", "삼각 방정식·부등식", "삼각형 넓이"],
        12: ["함수의 연속 조건", "도함수와 함수의 개형"],
        13: ["지수·로그 계산"], 14: ["위치와 거리", "정적분"],
        15: ["사인·코사인 법칙", "원의 반지름", "원주각과 중심각"],
        16: ["지수·로그 계산"], 17: ["부정적분"], 18: ["수열의 합 Σ"],
        19: ["도함수와 함수의 개형"], 20: ["정적분"],
        21: ["수학적 귀납법", "절댓값 함수", "수열의 합 Σ"],
        22: ["도함수와 함수의 개형", "함수의 교점과 방정식의 실근"],
        23: ["이항정리"], 24: ["이항분포", "Y = aX+b 변환"],
        25: ["중복조합"], 26: ["확률의 덧셈정리"],
        27: ["모평균의 추정", "표본평균", "정규분포"],
        28: ["중복순열"], 29: ["연속확률변수"],
        30: ["독립과 종속", "이항분포"],
    },
    "2023|6모": {
        8: ["도함수와 함수의 개형"], 9: ["도함수와 함수의 개형"],
        11: ["위치와 거리"],
        13: ["등차·등비수열", "지수·로그 방정식·부등식"],
        17: ["부정적분"],
        20: ["정적분으로 정의된 함수", "도함수와 함수의 개형"],
        21: ["지수·로그 계산"], 22: ["함수의 연속 조건", "극한값"],
    },
    "2023|9모": {
        6: ["도함수와 함수의 개형"], 9: ["삼각함수 그래프"],
        10: ["정적분", "위치와 거리"], 17: ["부정적분"],
        19: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
        20: ["정적분과 넓이"],
        22: ["함수의 연속 조건", "도함수와 함수의 개형"],
        24: ["조건부확률", "확률의 덧셈정리"], 30: ["중복순열"],
    },
    "2023|수능": {
        1: ["지수·로그 계산"], 6: ["도함수와 함수의 개형"],
        9: ["삼각함수 그래프"], 10: ["정적분과 넓이"],
        12: ["정적분과 넓이"],
        19: ["도함수와 함수의 개형", "함수의 교점과 방정식의 실근"],
        20: ["속도와 가속도", "위치와 거리"],
        22: ["접선의 방정식", "도함수와 함수의 개형"],
        24: ["중복순열", "경우의 수"], 30: ["중복순열"],
    },
    "2024|6모": {
        8: ["도함수와 함수의 개형", "함수의 교점과 방정식의 실근"],
        11: ["도함수와 함수의 개형"], 14: ["정적분", "위치와 거리"],
        18: ["도함수와 함수의 개형"], 19: ["삼각함수 그래프"],
        30: ["경우의 수", "확률의 덧셈정리"],
    },
    "2024|9모": {
        6: ["도함수와 함수의 개형"], 8: ["부정적분"],
        11: ["위치와 거리"], 22: ["곱의 미분", "부정적분", "정적분"],
        25: ["독립과 종속"],
    },
    "2024|수능": {
        7: ["도함수와 함수의 개형"], 10: ["위치와 거리"],
        14: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형", "극한값"],
        16: ["지수·로그 방정식·부등식"], 22: ["도함수와 함수의 개형"],
        24: ["독립과 종속"], 27: ["모평균의 추정", "표본평균"],
    },
    "2025|6모": {
        7: ["함수의 교점과 방정식의 실근", "도함수와 함수의 개형"],
        10: ["사인·코사인 법칙", "삼각형 넓이"],
        11: ["미분계수", "접선의 방정식"], 12: ["지수·로그함수 그래프"],
        15: ["정적분", "도함수와 함수의 개형"],
        16: ["지수·로그 방정식·부등식"], 17: ["부정적분"],
        19: ["위치와 거리"], 20: ["삼각함수 그래프"],
        21: ["도함수와 함수의 개형"],
    },
    "2025|9모": {
        10: ["사인·코사인 법칙"],
        12: ["등차·등비수열", "등차·등비수열의 합"],
        14: ["도함수와 함수의 개형"],
        16: ["지수·로그 방정식·부등식"], 17: ["부정적분"],
        18: ["수열의 합 Σ"],
        20: ["삼각함수 그래프", "삼각 방정식·부등식"],
        21: ["도함수와 함수의 개형"], 24: ["독립과 종속"],
        26: ["표본평균"], 29: ["이항분포", "정규분포"],
    },
    "2025|수능": {
        7: ["정적분으로 정의된 함수"], 10: ["삼각함수 그래프"],
        12: ["수열의 합 Σ"],
        14: ["사인·코사인 법칙", "삼각형 넓이"],
        15: ["도함수와 함수의 개형"], 17: ["부정적분"],
        18: ["수학적 귀납법", "수열의 합 Σ"],
        19: ["도함수와 함수의 개형"], 20: ["삼각함수 그래프"],
        21: ["0/0 꼴", "인수 정리와 함수 추론"],
        22: ["수학적 귀납법", "절댓값 함수"],
        25: ["모평균의 추정"], 27: ["표본평균"],
        30: ["독립과 종속"],
    },
}


def make_goal(intent):
    goal = intent.rstrip("?")
    goal = goal.replace("구할 수 있는가", "구한다")
    goal = goal.replace("해결할 수 있는가", "해결한다")
    return goal


def make_record(exam_key, number, categories, intents, questions, selection="확통", legacy=False):
    year_text, session = exam_key.split("|")
    year = int(year_text)
    section = selection if legacy else ("공통" if number <= 22 else selection)
    score = legacy_score_for(number) if legacy else score_for(number)
    intent = intents.get(exam_key, {}).get(number) or fallback_intent(categories)
    primary = categories[0]
    problem_text = questions.get(exam_key, {}).get(number, "")
    conditions = [problem_text] if problem_text else [f"문제에 제시된 {category} 관련 식·그래프·사건 조건" for category in categories]
    steps = [f"주어진 조건에서 {primary}에 해당하는 핵심 관계를 먼저 찾는다."]
    for category in categories:
        action = CATEGORY_ACTIONS.get(category)
        if action and action not in steps:
            steps.append(action)
    steps.append("계산 결과와 범위·부호·경우의 수 조건을 원문에 다시 대입해 요구값을 확정한다.")
    return {
        "id": f"{year}-{session}-{section}-{number:02d}",
        "year": year,
        "session": session,
        "section": section,
        "number": number,
        "score": score,
        "difficulty": difficulty_for(number, score),
        "categories": categories,
        "officialIntent": intent,
        "problemText": problem_text,
        "conditions": conditions,
        "goal": make_goal(intent),
        "journey": steps,
        "sourceBasis": "평가원 해설의 출제의도·풀이" if legacy or exam_key in SOLUTION_FILES else "문제지·평가원 정답표·문항 분류",
    }


mode = sys.argv[1] if len(sys.argv) > 1 else "base"
output_records = []
if mode == "legacy":
    for subject in ("가형", "나형"):
        legacy_intents = parse_intents(LEGACY_SOLUTION_FILES[subject], subject)
        legacy_questions = parse_questions(LEGACY_PAPER_FILES[subject])
        for exam_key in LEGACY_EXAM_ORDER:
            for number in range(1, 31):
                intent = legacy_intents.get(exam_key, {}).get(number, "")
                problem_text = legacy_questions.get(exam_key, {}).get(number, "")
                categories = (LEGACY_CATEGORY_OVERRIDES.get((exam_key, subject), {}).get(number)
                    or infer_legacy_categories(intent, problem_text))
                output_records.append(make_record(
                    exam_key, number, categories, legacy_intents, legacy_questions, subject, legacy=True
                ))
elif mode == "calculus":
    calculus_intents = parse_intents(CALCULUS_SOLUTION_FILES, "미적분")
    calculus_questions = parse_questions(CALCULUS_PAPER_FILES)
    for exam_key in EXAM_ORDER:
        for number in range(23, 31):
            intent = calculus_intents.get(exam_key, {}).get(number, "")
            problem_text = calculus_questions.get(exam_key, {}).get(number, "")
            categories = CALCULUS_OVERRIDES.get(exam_key, {}).get(number) or infer_calculus_categories(intent, problem_text)
            output_records.append(make_record(exam_key, number, categories, calculus_intents, calculus_questions, "미적"))
else:
    seed_categories = parse_categories()
    intents = parse_intents(SOLUTION_FILES, "확률과 통계")
    questions = parse_questions(PAPER_FILES)
    for exam_key in EXAM_ORDER:
        for number in range(1, 31):
            intent = intents.get(exam_key, {}).get(number, "")
            problem_text = questions.get(exam_key, {}).get(number, "")
            categories = (seed_categories.get(exam_key, {}).get(number)
                or CATEGORY_OVERRIDES.get(exam_key, {}).get(number)
                or infer_categories(intent, problem_text, number))
            output_records.append(make_record(exam_key, number, categories, intents, questions))

if mode == "legacy":
    generated_from = "2017~2021 평가원·수능 가형·나형 문제지 및 해설 (2022~2027 분류 체계로 대응)"
elif mode == "calculus":
    generated_from = "2022~2027 평가원·수능 미적분 문제지 및 해설"
else:
    generated_from = "2022~2027 평가원·수능 공통·확률과 통계 문제지 및 해설"
print(json.dumps({"schemaVersion": 3, "problemTextFormat": "LaTeX", "generatedFrom": generated_from}, ensure_ascii=False, separators=(",", ":"))[:-1] + ',"problems":[')
for index, record in enumerate(output_records):
    suffix = "," if index < len(output_records) - 1 else ""
    print(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + suffix)
print("]}")
