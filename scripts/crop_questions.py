#!/usr/bin/env python3
"""Crop every KICE math exam PDF into one PNG per question."""

from __future__ import annotations

from collections import defaultdict
from itertools import combinations
from pathlib import Path
import re
import shutil
import sys
import unicodedata

import numpy as np
import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageOps


ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "평가원 수학")
DPI = 220
SCALE = DPI / 72
INK_THRESHOLD = 245
QUESTION_RE = re.compile(r"(?:[1-9]|[12][0-9]|30)\.")
EXAM_RE = re.compile(r"(\d{4}) (6모|9모|수능)")
MODERN_SECTIONS = ("공통", "확통", "미적", "기하")
OLD_FORMS = ("가형", "나형")


def nfc(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def trim_white(image: Image.Image, padding: int = 24) -> Image.Image:
    gray = ImageOps.grayscale(image)
    mask = gray.point(lambda value: 255 if value < INK_THRESHOLD else 0)
    bbox = mask.getbbox()
    if not bbox:
        return image
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def remove_page_header_rule(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    candidates = []
    for y in range(min(90, image.height)):
        row = gray.crop((0, y, image.width, y + 1))
        dark_pixels = int((np.asarray(row) < 130).sum())
        if dark_pixels > image.width * 0.65:
            candidates.append(y)
    if candidates:
        return image.crop((0, max(candidates) + 12, image.width, image.height))
    return image


def remove_isolated_edge_artifacts(image: Image.Image) -> Image.Image:
    """Discard a tiny remnant of the preceding/following question at an edge."""
    gray = ImageOps.grayscale(image)
    row_ink = (np.asarray(gray) < INK_THRESHOLD).sum(axis=1).tolist()
    active = [index for index, count in enumerate(row_ink) if count]
    if not active:
        return image
    total_ink = sum(row_ink)
    start, end = 0, image.height
    changed = False

    gaps = []
    prior = active[0]
    for current in active[1:]:
        if current - prior >= 20:
            gaps.append((prior + 1, current))
        prior = current

    if gaps:
        first_gap = gaps[0]
        leading_ink = sum(row_ink[active[0]:first_gap[0]])
        leading_height = first_gap[0] - active[0]
        if (active[0] < 8 and leading_height < 90
                and (leading_height <= 30 or leading_ink < total_ink * 0.05)):
            start = (first_gap[0] + first_gap[1]) // 2
            changed = True
        last_gap = gaps[-1]
        trailing_ink = sum(row_ink[last_gap[1]:active[-1] + 1])
        trailing_height = active[-1] + 1 - last_gap[1]
        if ((image.height - active[-1] <= 8 or trailing_height <= 6)
                and trailing_height < 90 and trailing_ink < total_ink * 0.10):
            end = (last_gap[0] + last_gap[1]) // 2
            changed = True
    if not changed:
        return image
    return image.crop((0, start, image.width, end))


def remove_section_header(image: Image.Image) -> Image.Image:
    """Remove the boxed elective title above question 23 while retaining tall formulas."""
    gray = ImageOps.grayscale(image)
    row_ink = (np.asarray(gray) < INK_THRESHOLD).sum(axis=1)
    active = np.flatnonzero(row_ink)
    for prior, current in zip(active, active[1:]):
        if current - prior >= 45 and prior < image.height * 0.45:
            return image.crop((0, (int(prior) + int(current)) // 2, image.width, image.height))
    return image


def text_anchors(page: pdfplumber.page.Page) -> tuple[list[dict], list[dict]]:
    words = page.extract_words(x_tolerance=1, y_tolerance=2)
    anchors = [word for word in words if QUESTION_RE.fullmatch(word["text"])]
    return anchors, words


def load_fallback_templates() -> dict[str, list[tuple[float, float, int]]]:
    templates: dict[str, list[tuple[float, float, int]]] = {}
    for form in OLD_FORMS:
        source = ROOT / "2021 9모" / f"2021 9모 {form}.pdf"
        pages = []
        with pdfplumber.open(source) as pdf:
            for page in pdf.pages:
                anchors, _ = text_anchors(page)
                pages.append([
                    (word["x0"] / page.width, word["top"] / page.height, int(word["text"][:-1]))
                    for word in anchors
                ])
        templates[form] = pages
    return templates


def fallback_anchors(page, page_index: int, form: str, templates) -> list[dict]:
    return [
        {"x0": x_ratio * page.width, "top": y_ratio * page.height, "text": f"{number}."}
        for x_ratio, y_ratio, number in templates[form][page_index]
    ]


def refine_scanned_anchors(image: Image.Image, page, anchors: list[dict]) -> list[dict]:
    """Snap template anchors to the actual number rows in a scanned exam page."""
    gray = ImageOps.grayscale(image)
    refined = []
    for column, (left_ratio, right_ratio) in {
        "left": (0.101, 0.121),
        "right": (0.515, 0.535),
    }.items():
        expected = sorted(
            [anchor for anchor in anchors if (anchor["x0"] < page.width / 2) == (column == "left")],
            key=lambda anchor: anchor["top"],
        )
        if not expected:
            continue

        x0 = round(image.width * left_ratio)
        x1 = round(image.width * right_ratio)
        y_start, y_end = round(image.height * 0.12), round(image.height * 0.81)
        counts = (np.asarray(gray)[y_start:y_end, x0:x1] < 150).sum(axis=1)
        dark_rows = []
        for y, count in enumerate(counts, start=y_start):
            if count >= 2:
                dark_rows.append((y, int(count)))

        runs = []
        for item in dark_rows:
            if not runs or item[0] > runs[-1][-1][0] + 2:
                runs.append([])
            runs[-1].append(item)
        candidates = []
        for run in runs:
            height_pt = (run[-1][0] - run[0][0] + 1) / SCALE
            if 3 <= height_pt <= 16 and max(count for _, count in run) >= 8:
                candidates.append(run[0][0] / image.height * page.height)

        if len(candidates) < len(expected):
            raise RuntimeError(f"Not enough scanned anchors on page {page.page_number}, {column}")
        choice = min(
            combinations(candidates, len(expected)),
            key=lambda values: sum(abs(value - anchor["top"]) for value, anchor in zip(values, expected)),
        )
        for anchor, actual_top in zip(expected, choice):
            refined.append({**anchor, "top": actual_top})
    return refined


def unified_section(page_number: int) -> str:
    if 1 <= page_number <= 8:
        return "공통"
    if 9 <= page_number <= 12:
        return "확통"
    if 13 <= page_number <= 16:
        return "미적"
    if 17 <= page_number <= 20:
        return "기하"
    raise ValueError(f"Unexpected unified-PDF page: {page_number}")


def source_plan(exam_dir: Path, year: int, exam_name: str):
    sources = sorted(
        path for path in exam_dir.glob("*.pdf")
        if "해설" not in nfc(path.name)
    )
    if year <= 2021:
        plan = []
        for form in OLD_FORMS:
            source = next(path for path in sources if form in nfc(path.name))
            plan.append((source, form, set(range(1, 31)), "old"))
        return plan

    unified = [path for path in sources if not any(option in nfc(path.name) for option in ("확통", "미적", "기하"))]
    if unified:
        return [(unified[0], None, set(range(1, 31)), "unified")]

    by_option = {
        option: next(path for path in sources if option in nfc(path.name))
        for option in ("확통", "미적", "기하")
    }
    plan = [(by_option["확통"], "공통", set(range(1, 23)), "modern")]
    plan.extend((source, option, set(range(23, 31)), "modern") for option, source in by_option.items())
    return plan


def crop_source(source: Path, output: Path, exam_name: str, fixed_section: str | None,
                allowed: set[int], mode: str, fallback_templates, records: list, flags: list):
    form = fixed_section if mode == "old" else None
    rendered_pdf = pdfium.PdfDocument(source)
    with pdfplumber.open(source) as text_pdf:
        use_fallback = sum(len(text_anchors(page)[0]) for page in text_pdf.pages) == 0
        for page_index, text_page in enumerate(text_pdf.pages):
            page_number = page_index + 1
            anchors, words = text_anchors(text_page)
            if use_fallback:
                anchors = fallback_anchors(text_page, page_index, form, fallback_templates)
                words = []
            selected = [word for word in anchors if int(word["text"][:-1]) in allowed]
            if not selected:
                continue

            rendered = rendered_pdf[page_index].render(scale=SCALE).to_pil().convert("RGB")
            if use_fallback:
                anchors = refine_scanned_anchors(rendered, text_page, anchors)
                selected = [word for word in anchors if int(word["text"][:-1]) in allowed]
            for column in ("left", "right"):
                if column == "left":
                    column_anchors = [word for word in selected if word["x0"] < text_page.width / 2]
                    x0_pt, x1_pt = text_page.width * 0.076, text_page.width / 2 - text_page.width * 0.006
                else:
                    column_anchors = [word for word in selected if word["x0"] >= text_page.width / 2]
                    x0_pt, x1_pt = text_page.width / 2 + text_page.width * 0.006, text_page.width * 0.924

                footer_tops = [
                    word["top"] for word in words
                    if word["x0"] >= text_page.width / 2
                    and word["top"] > text_page.height * 0.75
                    and word["text"] == "확인"
                ]
                if column == "right" and footer_tops:
                    column_bottom = min(top - 10 for top in footer_tops)
                elif column == "right" and use_fallback:
                    column_bottom = text_page.height * 0.84
                else:
                    column_bottom = text_page.height * 0.907

                column_anchors.sort(key=lambda word: word["top"])
                for index, anchor in enumerate(column_anchors):
                    number = int(anchor["text"][:-1])
                    if mode == "unified":
                        section = unified_section(page_number)
                    else:
                        section = fixed_section

                    needs_tall_formula_headroom = number == 23 and mode in {"modern", "unified"}
                    y0_pt = max(0, anchor["top"] - (50 if needs_tall_formula_headroom else 18))
                    if index + 1 < len(column_anchors):
                        y1_pt = column_anchors[index + 1]["top"] - 10
                    else:
                        y1_pt = min(text_page.height, column_bottom)

                    box = (
                        round(x0_pt * SCALE), round(y0_pt * SCALE),
                        round(x1_pt * SCALE), round(y1_pt * SCALE),
                    )
                    raw_crop = remove_page_header_rule(rendered.crop(box))
                    if needs_tall_formula_headroom:
                        raw_crop = remove_section_header(raw_crop)
                    cropped = trim_white(remove_isolated_edge_artifacts(raw_crop))
                    section_dir = output / section
                    section_dir.mkdir(parents=True, exist_ok=True)
                    destination = section_dir / f"{exam_name} {section} {number:02d}번.png"
                    cropped.save(destination, "PNG", compress_level=6)

                    gray = ImageOps.grayscale(cropped)
                    content = gray.point(lambda value: 255 if value < INK_THRESHOLD else 0).getbbox()
                    if content:
                        margins = (content[0], content[1], cropped.width - content[2], cropped.height - content[3])
                        if min(margins) < 8:
                            flags.append((exam_name, section, number, "edge", margins, destination))
                    if cropped.width < 400 or cropped.height < 100:
                        flags.append((exam_name, section, number, "small", cropped.size, destination))
                    records.append((exam_name, section, number, page_number, source, destination, cropped.size))


def expected_for(year: int):
    if year <= 2021:
        return {form: set(range(1, 31)) for form in OLD_FORMS}
    return {
        "공통": set(range(1, 23)),
        "확통": set(range(23, 31)),
        "미적": set(range(23, 31)),
        "기하": set(range(23, 31)),
    }


def main():
    fallback_templates = load_fallback_templates()
    all_records = []
    all_flags = []
    exam_dirs = []
    for path in ROOT.iterdir():
        if not path.is_dir():
            continue
        match = EXAM_RE.fullmatch(nfc(path.name))
        if match:
            exam_dirs.append((int(match.group(1)), match.group(2), path))
    exam_dirs.sort(reverse=True)

    for year, event, exam_dir in exam_dirs:
        exam_name = f"{year} {event}"
        building = exam_dir / "Questions.__building__"
        if building.exists():
            shutil.rmtree(building)
        records = []
        flags = []
        for source, section, allowed, mode in source_plan(exam_dir, year, exam_name):
            crop_source(source, building, exam_name, section, allowed, mode, fallback_templates, records, flags)

        actual = defaultdict(set)
        for _, section, number, *_ in records:
            actual[section].add(number)
        expected = expected_for(year)
        if dict(actual) != expected:
            raise RuntimeError(f"{exam_name}: coverage mismatch: {dict(actual)} != {expected}")
        if len(records) != sum(len(numbers) for numbers in expected.values()):
            raise RuntimeError(f"{exam_name}: duplicate output records")

        final = exam_dir / "Questions"
        if final.exists():
            shutil.rmtree(final)
        building.rename(final)
        all_records.extend(
            (*record[:-2], final / record[-2].relative_to(building), record[-1])
            for record in records
        )
        all_flags.extend(
            (*flag[:-1], final / flag[-1].relative_to(building))
            for flag in flags
        )
        print(f"{exam_name}: {len(records)} images, {len(flags)} flags", flush=True)

    report_dir = ROOT / ".crop-reports"
    report_dir.mkdir(exist_ok=True)
    with (report_dir / "questions.tsv").open("w") as stream:
        stream.write("exam\tsection\tquestion\tpage\tsource\timage\twidth\theight\n")
        for exam, section, number, page, source, image, size in all_records:
            stream.write(f"{exam}\t{section}\t{number}\t{page}\t{source}\t{image}\t{size[0]}\t{size[1]}\n")
    with (report_dir / "flags.tsv").open("w") as stream:
        stream.write("exam\tsection\tquestion\treason\tdetail\timage\n")
        for exam, section, number, reason, detail, image in all_flags:
            stream.write(f"{exam}\t{section}\t{number}\t{reason}\t{detail}\t{image}\n")
    print(f"TOTAL: {len(all_records)} images, {len(all_flags)} flags")


if __name__ == "__main__":
    main()
