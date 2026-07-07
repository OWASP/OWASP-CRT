import json
import numpy as np

#  Load dataset 
with open("owasp_global_stats.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

#  Step 1: Remove main organization account
raw_data = {u: v for u, v in raw_data.items() if u != "OWASPFoundation"}

#  Step 2: Zero-line users → No Certificate 
zero_line_users = {
    u for u, v in raw_data.items()
    if v.get("total_additions", 0) == 0 and v.get("total_deletions", 0) == 0
}

#  Step 3: Working set 
data      = {u: v for u, v in raw_data.items() if u not in zero_line_users}
users     = list(data.keys())
additions = np.array([data[u].get("total_additions", 0) for u in users], dtype=float)
deletions = np.array([data[u].get("total_deletions", 0) for u in users], dtype=float)
commits   = np.array([data[u].get("total_commits",   0) for u in users], dtype=float)

#  Step 4: Remove outliers (3×IQR on log scale) 
raw_total     = additions + deletions
log_raw       = np.log1p(raw_total)
Q1, Q3        = np.percentile(log_raw, 25), np.percentile(log_raw, 75)
upper         = Q3 + 3 * (Q3 - Q1)
non_outlier   = log_raw <= upper
outlier_users = set(np.array(users)[~non_outlier])

clean_users     = [u for u, m in zip(users, non_outlier) if m]
clean_additions = additions[non_outlier]
clean_deletions = deletions[non_outlier]
clean_commits   = commits[non_outlier]

#  Step 5: Normalize P99 — guarded against division by zero 
p99_add = max(float(np.percentile(clean_additions, 99)), 1e-10)
p99_del = max(float(np.percentile(clean_deletions, 99)), 1e-10)
p99_cmt = max(float(np.percentile(clean_commits,   99)), 1e-10)

add_norm = np.clip(clean_additions / p99_add, 0, 1)
del_norm = np.clip(clean_deletions / p99_del, 0, 1)
cmt_norm = np.clip(clean_commits   / p99_cmt, 0, 1)

#  Step 6: Weighted contribution score 
scores = add_norm * 0.50 + del_norm * 0.40 + cmt_norm * 0.10

#  Step 7: Thresholds 

silver_threshold = float(np.percentile(scores, 40))
gold_threshold   = float(np.percentile(scores, 75))

score_map = dict(zip(clean_users, scores))

#  Distribution 
total    = len(raw_data)
n_zero   = len(zero_line_users)
n_bronze = sum(1 for s in scores if s < silver_threshold)
n_silver = sum(1 for s in scores if silver_threshold <= s < gold_threshold)
n_gold   = sum(1 for s in scores if s >= gold_threshold) + len(outlier_users)

print(f"\nSilver threshold (P40) : {silver_threshold:.6f}")
print(f"Gold   threshold (P75) : {gold_threshold:.6f}")
print(f"\n{'─'*45}")
print(f"Total users      : {total}")
print(f"  No Certificate : {n_zero:4d}  ({n_zero/total*100:.1f}%)")
print(f"   Bronze      : {n_bronze:4d}  ({n_bronze/total*100:.1f}%)")
print(f"   Silver      : {n_silver:4d}  ({n_silver/total*100:.1f}%)")
print(f"   Gold        : {n_gold:4d}  ({n_gold/total*100:.1f}%)")
print(f"{'─'*45}\n")

#  Interactive lookup 
while True:
    username = input("Enter a GitHub username (or 'exit'): ").strip()
    if username.lower() == "exit":
        break

    if username not in raw_data:
        print(f"    User '{username}' was not found in the dataset.\n")
        continue

    info = raw_data[username]
    print(f"\n    {username}")
    print("  ─────────────────────────────────────")
    print(f"     Lines Added    : {info.get('total_additions', 0):>10,}")
    print(f"     Lines Removed  : {info.get('total_deletions', 0):>10,}")
    print(f"     Commits        : {info.get('total_commits',   0):>10,}")
    print("  ─────────────────────────────────────")

    if username in zero_line_users:
        print("   Tier : No Certificate")
        print("   No recorded line contributions\n")

    elif username in outlier_users:
        print("   Contribution Score : exceptional")
        print("   Tier               :  Gold")
        print("   Exceptional contributor\n")

    else:
        score = score_map[username]
        print(f"   Contribution Score : {score:.6f}")

        if score >= gold_threshold:
            print("   Tier               :  Gold")
            print("   Highest contributor tier achieved\n")

        elif score >= silver_threshold:
            progress = (score - silver_threshold) / (gold_threshold - silver_threshold) * 100
            print("   Tier               :  Silver")
            print(f"   Progress to Gold   : {progress:.1f}% completed, {100-progress:.1f}% remaining\n")

        else:
            progress = score / silver_threshold * 100
            print("   Tier               :  Bronze")
            print(f"   Progress to Silver : {progress:.1f}% completed, {100-progress:.1f}% remaining\n")
