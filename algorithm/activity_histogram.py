import json
import numpy as np
import matplotlib.pyplot as plt

#  Load dataset 
with open("owasp_global_stats.json", "r", encoding="utf-8") as f:
    data = json.load(f)

#  Compute total line changes per user (additions + deletions) 
values = []
for username, info in data.items():
    total = info.get("total_additions", 0) + info.get("total_deletions", 0)
    values.append(total)

values = np.array(values)

mn = values.min()
mx = values.max()
avg = values.mean()

#  Plot histogram (log scale bins for skewed distribution) 
fig, ax = plt.subplots(figsize=(14, 6))

bins = np.logspace(np.log10(max(mn, 1)), np.log10(mx), 60)
ax.hist(values, bins=bins, color="#2563eb", edgecolor="white", linewidth=0.4)

#  Statistical reference lines 
for val, label, color in [
    (np.percentile(values, 25), "P25", "gold"),
    (np.median(values), "Median", "red"),
    (np.percentile(values, 75), "P75", "purple"),
    (np.percentile(values, 90), "P90", "orange"),
    (np.percentile(values, 99), "P99", "gray"),
]:
    ax.axvline(val, color=color, linestyle="--", linewidth=1.5)
    ax.text(
        val * 1.05,
        ax.get_ylim()[1] * 0.95,
        f"{label}\n{val:,.0f}",
        fontsize=8,
        color=color,
        va="top",
    )

#  Summary statistics box 
stats_text = (
    f"Min  : {mn:,}\n"
    f"Max  : {mx:,}\n"
    f"Avg  : {avg:,.0f}"
)

ax.text(
    0.98,
    0.97,
    stats_text,
    transform=ax.transAxes,
    fontsize=10,
    verticalalignment="top",
    horizontalalignment="right",
    bbox=dict(
        boxstyle="round,pad=0.5",
        facecolor="white",
        edgecolor="#2563eb",
        alpha=0.9,
    ),
    family="monospace",
)

#  Labels and styling 
ax.set_xscale("log")
ax.set_xlabel("Total lines changed (additions + deletions)", fontsize=11)
ax.set_ylabel("Number of users", fontsize=11)
ax.set_title(
    "Distribution of OWASP User Activity",
    fontsize=13,
)

ax.grid(axis="y", linestyle=":", alpha=0.4)
ax.grid(axis="x", linestyle=":", alpha=0.2)

plt.tight_layout()
plt.savefig("owasp_distribution.png", dpi=150)
plt.show()

print(f"Min: {mn:,}  |  Max: {mx:,}  |  Avg: {avg:,.0f}")
print("Chart saved as: owasp_distribution.png")