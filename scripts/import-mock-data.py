"""Convert Amanda's mock data spreadsheet into the prototype's data file.

Reads:  mock_inbox_data_v3.numbers  (sheets "Emails" and "Thread")
Writes: src/data/mockEmails.js

Needs the numbers-parser Python package (pip install numbers-parser).
Run from the project folder:  python scripts/import-mock-data.py
"""

import json
import re
import sys
from pathlib import Path

from numbers_parser import Document

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "mock_inbox_data_v3.numbers"
OUTPUT = ROOT / "src" / "data" / "mockEmails.js"


def rows_as_dicts(table):
    rows = list(table.rows(values_only=True))
    header = [str(h).strip() for h in rows[0]]
    for row in rows[1:]:
        if all(v is None or str(v).strip() == "" for v in row):
            continue  # skip blank rows
        yield dict(zip(header, row))


def text(value):
    return "" if value is None else str(value).strip()


def whole_number(value):
    return int(float(value))


def time_24h(value):
    # Numbers may hand back "16:30" or a time object; keep "HH:MM".
    value = text(value)
    match = re.match(r"^(\d{1,2}):(\d{2})", value)
    if not match:
        sys.exit(f"Can't read time: {value!r}")
    return f"{int(match[1]):02d}:{match[2]}"


def bucket_id(location):
    # "Today list" means unsorted. "Priority bucket" means the bucket with id "priority".
    if location == "Today list":
        return None
    if location.endswith(" bucket"):
        return location[: -len(" bucket")].strip().lower().replace(" ", "-")
    sys.exit(f"Unknown Location: {location!r}")


def main():
    doc = Document(str(SOURCE))
    sheets = {sheet.name: sheet.tables[0] for sheet in doc.sheets}

    messages_by_email = {}
    for row in rows_as_dicts(sheets["Thread"]):
        messages_by_email.setdefault(text(row["Email ID"]), []).append({
            "order": whole_number(row["Message #"]),
            "from": text(row["From"]),
            "dayOffset": whole_number(row["Day Offset (0=today)"]),
            "time": time_24h(row["Time"]),
            "body": text(row["Body"]),
        })

    emails = []
    for row in rows_as_dicts(sheets["Emails"]):
        email_id = text(row["Email ID"])
        attachments = text(row["Attachments"])
        email = {
            "id": email_id,
            "sender": text(row["Sender"]),
            "senderEmail": text(row["Sender Email"]),
            "subject": text(row["Subject"]),
            "category": text(row["Category"]),
            "dayOffset": whole_number(row["Day Offset (0=today)"]),
            "time": time_24h(row["Time"]),
            "bucketId": bucket_id(text(row["Location"])),
            "unread": text(row["Unread"]).lower() == "yes",
            "attachments": [attachments] if attachments else [],
            "preview": text(row["Body Preview"]),
            "body": text(row["Full Body"]),
        }
        messages = sorted(messages_by_email.pop(email_id, []), key=lambda m: m["order"])
        if messages:
            for m in messages:
                del m["order"]
            email["messages"] = messages
            # The sheet's Full Body points to the Thread sheet; use the newest message instead.
            email["body"] = messages[-1]["body"]
        emails.append(email)

    if messages_by_email:
        sys.exit(f"Thread rows with no matching email: {sorted(messages_by_email)}")

    OUTPUT.write_text(
        "// Generated from mock_inbox_data_v3.numbers by scripts/import-mock-data.py.\n"
        "// Don't edit by hand: change the spreadsheet and re-run the import.\n"
        "// dayOffset: 0 = today, -1 = yesterday. time is 24-hour, in the viewer's time zone.\n\n"
        f"export const mockEmails = {json.dumps(emails, indent=2, ensure_ascii=False)}\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(emails)} emails to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
