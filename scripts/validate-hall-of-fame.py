import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

path = Path("hall-of-fame.json")

if not path.exists():
    print("ERROR: hall-of-fame.json does not exist")
    sys.exit(1)

try:
    entries = json.loads(path.read_text(encoding="utf-8"))
except json.JSONDecodeError as error:
    print(f"ERROR: invalid JSON: {error}")
    sys.exit(1)

if not isinstance(entries, list):
    print("ERROR: hall-of-fame.json must contain an array")
    sys.exit(1)

required = {"id", "name", "github", "tier"}
allowed_tiers = {"Contributor", "Bronze", "Silver", "Gold"}
seen_ids = set()

for index, entry in enumerate(entries, start=1):
    if not isinstance(entry, dict):
        print(f"ERROR: entry {index} must be an object")
        sys.exit(1)

    missing = required - entry.keys()
    if missing:
        print(f"ERROR: entry {index} missing fields: {sorted(missing)}")
        sys.exit(1)

    entry_id = str(entry["id"]).strip()
    if not entry_id or entry_id in seen_ids:
        print(f"ERROR: duplicate or empty id at entry {index}")
        sys.exit(1)
    seen_ids.add(entry_id)

    if not str(entry["name"]).strip():
        print(f"ERROR: empty name at entry {index}")
        sys.exit(1)

    parsed = urlparse(str(entry["github"]))
    if parsed.scheme != "https" or parsed.netloc != "github.com":
        print(f"ERROR: invalid GitHub URL at entry {index}")
        sys.exit(1)

    if not re.fullmatch(r"[A-Za-z0-9-]+", entry_id):
        print(f"ERROR: invalid id format at entry {index}")
        sys.exit(1)

    if entry["tier"] not in allowed_tiers:
        print(f"ERROR: invalid tier at entry {index}")
        sys.exit(1)

print(f"valid: {path} ({len(entries)} entries)")
