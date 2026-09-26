"""Build static answer metadata from the archived KICE solution PDFs.

Run with the workspace PDF runtime, which includes pdfplumber:
  ~/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
    scripts/build_problem_stats.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "public" / "archive"
OUTPUT = ROOT / "app" / "problem-stats.json"
SESSIONS = ("6모", "9모", "수능")
MODERN_SUBJECTS = ("확통", "미적", "기하")
LEGACY_SUBJECTS = ("가형", "나형")
ANSWER_OVERRIDES = {
    # The archived PDF wraps this final answer into the adjacent solution column.
    "2021|6모|가형": {30: "331"},
    # The shared EBSi solution PDF omits the 미적분 answer page; KICE answer table.
    "2026|6모|미적": {
        23: "①", 24: "②", 25: "④", 26: "②",
        27: "③", 28: "①", 29: "109", 30: "25",
    },
}

PRIVATE_DIGITS = str.maketrans({
    "\ue03d": "0",
    "\ue034": "1",
    "\ue035": "2",
    "\ue036": "3",
    "\ue037": "4",
    "\ue038": "5",
    "\ue039": "6",
    "\ue03a": "7",
    "\ue03b": "8",
    "\ue03c": "9",
})
CHOICES = str.maketrans({
    "⓵": "①", "⓶": "②", "⓷": "③", "⓸": "④", "⓹": "⑤",
    "➀": "①", "➁": "②", "➂": "③", "➃": "④", "➄": "⑤",
})


def clean_token(value: str) -> str:
    return re.sub(r"\s+", "", value.translate(PRIVATE_DIGITS).translate(CHOICES))


def clean_answer(value: str) -> str | None:
    value = clean_token(value)
    choice = re.search(r"[①②③④⑤]", value)
    if choice:
        return choice.group(0)
    number = re.search(r"\d+", value)
    return number.group(0) if number else None


def extract_answer_run(page: pdfplumber.page.Page, first: int, last: int) -> dict[int, str]:
    """Read the compact answer strip at the upper-left of a solution page."""
    all_words = page.extract_words()

    def parse_half(words: list[dict[str, object]]) -> dict[int, str]:
        words.sort(key=lambda word: (round(float(word["top"]) / 2) * 2, float(word["x0"])))
        answers: dict[int, str] = {}
        index = 0
        while index < len(words):
            token = clean_token(str(words[index]["text"]))
            combined = re.fullmatch(r"0?(\d{1,2})\.([①②③④⑤]|\d+)", token)
            if combined:
                number = int(combined.group(1))
                if first <= number <= last and number not in answers:
                    answers[number] = clean_answer(combined.group(2)) or ""
                index += 1
                continue

            number_match = re.fullmatch(r"0?(\d{1,2})\.", token)
            if number_match:
                number = int(number_match.group(1))
                if first <= number <= last and number not in answers:
                    for candidate in words[index + 1:index + 4]:
                        candidate_token = clean_token(str(candidate["text"]))
                        if re.fullmatch(r"0?\d{1,2}\.", candidate_token):
                            break
                        answer = clean_answer(candidate_token)
                        if answer:
                            answers[number] = answer
                            break
            index += 1
        return answers

    halves = (
        [word for word in all_words if word["x0"] < page.width * 0.51 and 90 < word["top"] < 310],
        [word for word in all_words if word["x0"] >= page.width * 0.49 and 90 < word["top"] < 310],
    )
    return max((parse_half(words) for words in halves), key=len)


def extract_table_answers(page: pdfplumber.page.Page) -> dict[str, dict[int, str]]:
    """Handle the one-page 2027 September answer table."""
    tables = page.extract_tables()
    if not tables:
        return {}
    result = {"공통": {}, "확통": {}, "미적": {}, "기하": {}}
    columns = (("공통", 0, 1), ("공통", 3, 4), ("확통", 6, 7), ("미적", 9, 10), ("기하", 12, 13))
    for row in tables[0][3:]:
        for section, number_column, answer_column in columns:
            if len(row) <= answer_column:
                continue
            number_text = clean_token(row[number_column] or "")
            answer = clean_answer(row[answer_column] or "")
            if number_text.isdigit() and answer:
                result[section][int(number_text)] = answer
    return result


def page_for_section(pdf: pdfplumber.PDF, section: str) -> pdfplumber.page.Page | None:
    if section == "공통":
        return pdf.pages[0]
    full_name = {"확통": "확률과 통계", "미적": "미적분", "기하": "기하"}[section]
    for page in pdf.pages:
        text = page.extract_text() or ""
        if "선택:" in text and full_name in text:
            return page
    candidates = [page for page in pdf.pages if len(extract_answer_run(page, 23, 30)) >= 7]
    subject_index = MODERN_SUBJECTS.index(section)
    if subject_index < len(candidates):
        return candidates[subject_index]
    return None


def solution_path(year: int, session: str, subject: str) -> Path:
    directory = ARCHIVE / f"{year} {session}"
    subject_path = directory / f"{year} {session} {subject} 해설.pdf"
    shared_path = directory / f"{year} {session} 해설.pdf"
    return subject_path if subject_path.exists() else shared_path


def add_records(records: dict[str, dict[str, object]], year: int, session: str, section: str, answers: dict[int, str]) -> None:
    for number, answer in answers.items():
        records[f"{year}|{session}|{section}|{number}"] = {
            "answer": answer,
            "wrongRate": None,
        }


def build() -> dict[str, object]:
    records: dict[str, dict[str, object]] = {}
    failures: list[str] = []

    for year in range(2017, 2028):
        for session in SESSIONS:
            directory = ARCHIVE / f"{year} {session}"
            if not directory.exists():
                continue

            if year < 2022:
                for subject in LEGACY_SUBJECTS:
                    path = solution_path(year, session, subject)
                    if not path.exists():
                        failures.append(f"missing PDF: {year} {session} {subject}")
                        continue
                    with pdfplumber.open(path) as pdf:
                        answers = extract_answer_run(pdf.pages[0], 1, 30)
                    answers.update(ANSWER_OVERRIDES.get(f"{year}|{session}|{subject}", {}))
                    add_records(records, year, session, subject, answers)
                    if len(answers) != 30:
                        failures.append(f"{year} {session} {subject}: {len(answers)}/30")
                continue

            common_done = False
            for subject in MODERN_SUBJECTS:
                path = solution_path(year, session, subject)
                if not path.exists():
                    failures.append(f"missing PDF: {year} {session} {subject}")
                    continue
                with pdfplumber.open(path) as pdf:
                    if year == 2027 and session == "9모":
                        table = extract_table_answers(pdf.pages[0])
                        if not common_done:
                            add_records(records, year, session, "공통", table.get("공통", {}))
                            common_done = True
                        selection = table.get(subject, {})
                    else:
                        if not common_done:
                            common_page = page_for_section(pdf, "공통")
                            common = extract_answer_run(common_page, 1, 22) if common_page else {}
                            add_records(records, year, session, "공통", common)
                            common_done = True
                            if len(common) != 22:
                                failures.append(f"{year} {session} 공통: {len(common)}/22")
                        selection_page = page_for_section(pdf, subject)
                        selection = extract_answer_run(selection_page, 23, 30) if selection_page else {}
                selection.update(ANSWER_OVERRIDES.get(f"{year}|{session}|{subject}", {}))
                add_records(records, year, session, subject, selection)
                if len(selection) != 8:
                    failures.append(f"{year} {session} {subject}: {len(selection)}/8")

    if failures:
        raise RuntimeError("Answer extraction incomplete:\n- " + "\n- ".join(failures))

    return {
        "source": "평가원 정답 및 풀이 PDF",
        "wrongRateSource": "EBSi 채점 참여자 분석 TOP15",
        "problems": dict(sorted(records.items())),
    }


if __name__ == "__main__":
    data = build()
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(data['problems'])} records to {OUTPUT.relative_to(ROOT)}")
