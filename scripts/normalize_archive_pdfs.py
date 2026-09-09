from __future__ import annotations

import os
import tempfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter


ARCHIVE_ROOT = Path("public/archive")
KICE_COVER_PDFS = {
    Path("2019 9모/2019 9모 가형.pdf"),
    Path("2019 9모/2019 9모 나형.pdf"),
    Path("2019 수능/2019 수능 가형.pdf"),
    Path("2019 수능/2019 수능 나형.pdf"),
}


def needs_title_repair(path: Path, reader: PdfReader) -> bool:
    if "Pages" in path.parts:
        return False
    title = (reader.metadata or {}).get("/Title")
    return bool(title and str(title).strip() != path.stem)


def normalized_metadata(reader: PdfReader, title: str) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for key, value in (reader.metadata or {}).items():
        if isinstance(key, str) and key.startswith("/") and value is not None:
            metadata[key] = str(value)
    metadata["/Title"] = title
    return metadata


def main() -> None:
    changed: list[Path] = []

    for path in sorted(ARCHIVE_ROOT.rglob("*.pdf")):
        relative = path.relative_to(ARCHIVE_ROOT)
        reader = PdfReader(str(path), strict=False)
        remove_cover = relative in KICE_COVER_PDFS
        repair_title = needs_title_repair(path, reader)
        if not remove_cover and not repair_title:
            continue
        if remove_cover and len(reader.pages) < 2:
            raise RuntimeError(f"표지를 제거할 수 없는 PDF입니다: {path}")

        original_mode = path.stat().st_mode
        expected_pages = len(reader.pages) - int(remove_cover)
        writer = PdfWriter()
        for page in reader.pages[1 if remove_cover else 0 :]:
            writer.add_page(page)
        writer.add_metadata(normalized_metadata(reader, path.stem))

        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".pdf", delete=False) as stream:
            temporary_path = Path(stream.name)
            writer.write(stream)

        os.chmod(temporary_path, original_mode)
        os.replace(temporary_path, path)

        verified = PdfReader(str(path), strict=False)
        if len(verified.pages) != expected_pages:
            raise RuntimeError(f"페이지 수 검증 실패: {path}")
        if (verified.metadata or {}).get("/Title") != path.stem:
            raise RuntimeError(f"PDF 제목 검증 실패: {path}")
        changed.append(path)

    if len(changed) != 50:
        raise RuntimeError(f"예상한 50개가 아닌 {len(changed)}개 PDF를 수정했습니다.")

    for path in changed:
        print(path)


if __name__ == "__main__":
    main()
