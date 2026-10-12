import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

DATA_FILE = Path("hall-of-fame.json")
repository = os.environ["GITHUB_REPOSITORY"]

existing = json.loads(DATA_FILE.read_text())
contributors = {}

for entry in existing:
    if not isinstance(entry, dict):
        continue

    name = str(entry.get("name", "")).strip()
    github = str(entry.get("github", "")).strip()

    if not name or name.lower() == "nobody":
        continue

    parsed = urlparse(github)
    if parsed.scheme != "https" or parsed.netloc != "github.com":
        continue

    contributors[github.lower()] = entry

command = [
    "gh",
    "api",
    "--paginate",
    f"/repos/{repository}/pulls?state=closed&per_page=100",
    "--jq",
    ".[] | select(.merged_at != null and .user != null) | [.user.login, .user.html_url] | @tsv",
]

merged_prs = subprocess.check_output(command, text=True)

for line in merged_prs.splitlines():
    parts = line.split("\t", 1)

    if len(parts) != 2:
        continue

    username, profile_url = parts
    username = username.strip()
    profile_url = profile_url.strip()

    if not username or username.endswith("[bot]"):
        continue

    contributors.setdefault(
        profile_url.lower(),
        {
            "id": username,
            "name": username,
            "github": profile_url,
            "tier": "Contributor",
        },
    )

result = sorted(
    contributors.values(),
    key=lambda item: str(item.get("name", "")).lower(),
)

DATA_FILE.write_text(
    json.dumps(result, indent=2) + "\n"
)
