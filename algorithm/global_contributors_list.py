import json
import os
import time
import requests
from dotenv import load_dotenv


load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN:
    raise ValueError(
        "GitHub token not found. Please create a .env file and set GITHUB_TOKEN."
    )


HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}


OWASP_REPOS_FILE = "owasp_repos.json"
OUTPUT_FILE = "owasp_global_stats.json"
PROCESSED_FILE = "processed_repos.txt"


# Load previously processed repositories to allow resuming
def get_processed_repos():
    if os.path.exists(PROCESSED_FILE):
        with open(PROCESSED_FILE, "r") as f:
            return set(f.read().splitlines())
    return set()


# Save the processed repository to cache
def mark_repo_processed(repo_name):
    with open(PROCESSED_FILE, "a") as f:
        f.write(repo_name + "\n")


def save_database(database, output_file):
    """
    Persist the current contributor database to disk.
    """

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(database, file, indent=4)


def fetch_owasp_repositories(output_file=OWASP_REPOS_FILE):
    """
    Retrieve all OWASP repositories using GitHub pagination
    and cache the result locally.
    """

    repositories = []
    page = 1

    print("Discovering OWASP repositories...")

    while True:
        endpoint = (
            f"https://api.github.com/orgs/OWASP/repos"
            f"?per_page=100&page={page}"
        )

        response = requests.get(endpoint, headers=HEADERS)

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to retrieve repository inventory "
                f"(HTTP {response.status_code})"
            )

        batch = response.json()

        if not batch:
            break

        for repo in batch:
            repositories.append({
                "name": repo["name"]
            })

        print(
            f"Repository page {page} processed "
            f"({len(repositories)} repositories discovered)"
        )

        page += 1
        time.sleep(0.2)

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(repositories, file, indent=4)

    print(
        f"Repository inventory saved to '{output_file}' "
        f"({len(repositories)} repositories)"
    )

    return repositories


def load_or_create_repository_inventory():
    """
    Load repository inventory if it exists,
    otherwise build it automatically.
    """

    if not os.path.exists(OWASP_REPOS_FILE):

        print(
            f"'{OWASP_REPOS_FILE}' not found. "
            f"Generating repository inventory..."
        )

        return fetch_owasp_repositories()

    with open(OWASP_REPOS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def load_existing_database():
    """
    Resume from an existing contributor database if available.
    """

    if not os.path.exists(OUTPUT_FILE):
        return {}

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

            if isinstance(data, dict):
                print(
                    f"Existing database detected "
                    f"({len(data)} contributors loaded)."
                )
                return data

    except Exception:
        pass

    return {}


def build_global_contributors_db():
    """
    Build a contributor database across all OWASP repositories.

    The database is written incrementally every 10 newly
    discovered contributors to minimize data loss in case
    of interruptions.
    """

    repositories = load_or_create_repository_inventory()

    contributors_db = load_existing_database()

    discovered_contributors = len(contributors_db)

    total_repositories = len(repositories)

    print(
        f"\nStarting contributor aggregation across "
        f"{total_repositories} repositories..."
    )

    print("-" * 90)

    processed_repos = get_processed_repos()

    session = requests.Session()

    for repo_index, repo in enumerate(repositories, start=1):

        repo_name = repo["name"]

        if repo_name in processed_repos:
            print(f"Skipping {repo_name} (Already processed)")
            continue

        endpoint = (
            f"https://api.github.com/repos/"
            f"OWASP/{repo_name}/stats/contributors"
        )

        retries_remaining = 5
        response_data = None
        remaining_requests = "Unknown"

        while retries_remaining > 0:

            response = session.get(
                endpoint,
                headers=HEADERS
            )

            remaining_requests = int(
                response.headers.get(
                    "X-RateLimit-Remaining",
                    0
                )
            )

            if remaining_requests < 20:

                print(
                    f"\nRate limit is low "
                    f"({remaining_requests} remaining). "
                    f"Sleeping for 60 seconds..."
                )

                time.sleep(60)
                continue

            if response.status_code == 202:

                retries_remaining -= 1

                time.sleep(3)

                continue

            if response.status_code == 200:

                response_data = response.json()

                break

            if response.status_code == 204:
                break

            print(
                f"Skipping {repo_name} "
                f"(HTTP {response.status_code})"
            )

            break

        if isinstance(response_data, list):

            for contributor in response_data:

                author = contributor.get("author")

                if not author:
                    continue

                username = author.get("login")

                if not username:
                    continue

                if username.endswith("[bot]"):
                    continue

                is_new_contributor = (
                    username not in contributors_db
                )

                if is_new_contributor:

                    contributors_db[username] = {
                        "repositories_count": 0,
                        "total_commits": 0,
                        "total_additions": 0,
                        "total_deletions": 0,
                        "contributed_repos": []
                    }

                    discovered_contributors += 1


                record = contributors_db[username]

                record["repositories_count"] += 1

                record["total_commits"] += (
                    contributor.get("total", 0)
                )

                if repo_name not in record["contributed_repos"]:

                    record["contributed_repos"].append(
                        repo_name
                    )

                for week in contributor.get("weeks", []):

                    record["total_additions"] += (
                        week.get("a", 0)
                    )

                    record["total_deletions"] += (
                        week.get("d", 0)
                    )

        repositories_left = (
            total_repositories - repo_index
        )

        print(
            f"[{repo_index}/{total_repositories}] "
            f"{repo_name:<35} | "
            f"API Remaining: {remaining_requests:<5} | "
            f"Repos Left: {repositories_left:<5} | "
            f"Contributors: {len(contributors_db)}"
        )

        mark_repo_processed(repo_name)

        time.sleep(0.2)

        save_database(
            contributors_db,
            OUTPUT_FILE
        )

    print("-" * 90)

    print(
        f"Completed successfully.\n"
        f"Total contributors indexed : "
        f"{len(contributors_db)}\n"
        f"Database file              : "
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    build_global_contributors_db()
