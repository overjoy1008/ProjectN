"""Merge EBSi's published wrong-answer TOP15 into problem-stats.json.

EBSi publishes only the TOP15 for each subject group, not rates for every item.
This script therefore leaves all non-published items absent instead of estimating them.
"""

from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "app" / "problem-stats.json"
BASE = "https://www.ebsi.co.kr/ebs/xip/xipa"
TARGET = "D300"


def post(endpoint: str, data: dict[str, str]) -> str:
    request = urllib.request.Request(
        f"{BASE}/{endpoint}",
        data=urllib.parse.urlencode(data).encode(),
        headers={"User-Agent": "ProjectN metadata builder"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def post_json(endpoint: str, data: dict[str, str]) -> list[dict[str, str]]:
    return json.loads(post(endpoint, data)).get("result", [])


def subject_code(label: str, modern: bool) -> str | None:
    if modern:
        for needle, code in (("확률과 통계", "확통"), ("미적분", "미적"), ("기하", "기하")):
            if needle in label:
                return code
        return None
    if "가형" in label:
        return "가형"
    if "나형" in label:
        return "나형"
    return None


def parse_rates(markup: str) -> dict[int, float]:
    rates: dict[int, float] = {}
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", markup, re.S | re.I):
        cells = []
        for cell in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S | re.I):
            text = re.sub(r"<[^>]+>", "", cell)
            cells.append(re.sub(r"\s+", " ", html.unescape(text)).strip())
        if len(cells) < 3 or not cells[1].isdigit():
            continue
        try:
            rates[int(cells[1])] = float(cells[2])
        except ValueError:
            continue
    return rates


def main() -> None:
    data = json.loads(OUTPUT.read_text(encoding="utf-8"))
    wrong_rates: dict[str, float] = {}

    for calendar_year in range(2016, 2027):
        archive_year = calendar_year + 1
        months = post_json(
            "retrieveWrongAnswerRateMonthList.ajax",
            {"year": str(calendar_year), "targetCd": TARGET},
        )
        for month in months:
            irecord = str(month["code"])
            actual_month = irecord[4:6]
            # The 2021 CSAT was postponed to December. EBSi also labels the
            # 2023 September assessment as August, while its record date is Sep 1.
            session = {"06": "6모", "09": "9모", "11": "수능", "12": "수능"}.get(actual_month)
            if not session:
                continue
            subjects = post_json(
                "retrieveWrongAnswerRateSubjList.ajax",
                {"year": str(calendar_year), "targetCd": TARGET, "irecord": irecord, "arOrd": "2"},
            )
            for subject in subjects:
                code = subject_code(str(subject.get("value", "")), archive_year >= 2022)
                if not code:
                    continue
                rates = parse_rates(post("retrieveWrongAnswerRateList.ajax", {"paperId": str(subject["code"])}))
                for number, rate in rates.items():
                    wrong_rates[f"{archive_year}|{session}|{code}|{number}"] = rate
                print(f"{archive_year} {session} {code}: {len(rates)}")

    data["wrongRates"] = dict(sorted(wrong_rates.items()))
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Merged {len(wrong_rates)} EBSi TOP15 rates")


if __name__ == "__main__":
    main()
