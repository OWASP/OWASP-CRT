# Contribution Analytics & Algorithm Engine

This directory contains the core data pipeline and calculation models for the OWASP Community Recognition Tool. 

While the root project overview focuses on the community aspects, this module is strictly responsible for data extraction and statistical analysis. It provides a set of Python scripts to programmatically aggregate GitHub metrics, filter outliers, and apply weighted scoring to ensure a transparent and reproducible tier assignment process.

---

## Overview

The tool produces three outputs:

- A unified contributor dataset spanning the OWASP GitHub organization.

- Activity distribution visualizations for community analysis.

- A tier-based contributor recognition model.

Together, these outputs provide a broader view of contributor engagement across the OWASP ecosystem.

---

## Methodology

Contributor rankings are calculated using three activity indicators:

| Metric        | Weight |
| ------------- | ------ |
| Lines Added   | 50%    |
| Lines Deleted | 40%    |
| Commits       | 10%    |

To improve fairness and reduce the influence of extreme values, the algorithm:

- Excludes inactive contributors from ranking calculations.

- Detects exceptional contributors using a logarithmic IQR-based outlier model.

- Normalizes contribution metrics using percentile-based scaling.

- Calculates a weighted contribution score.

- Derives tier thresholds dynamically from the contribution distribution.

Recognition tiers:

- Gold

- Silver

- Bronze

- No Certificate

---

## Pipeline

### Stage 1 — Build the Contributor Dataset

```bash
python global_contributors_list.py
```

Discovers repositories within the OWASP GitHub organization, retrieves contributor statistics through the GitHub REST API, and aggregates contribution data into a unified dataset.

Outputs:

```text
owasp_repos.json
owasp_global_stats.json
```

---

### Stage 2 — Analyze Activity Distribution

```bash
python activity_histogram.py
```

Generates a logarithmic distribution histogram of contributor activity and calculates summary statistics and contribution percentiles.

Output:

```text
owasp_distribution.png
```

---

### Stage 3 — Generate Contributor Rankings

```bash
python contributors_ranking.py
```

Calculates contribution scores, assigns recognition tiers, and provides an interactive contributor lookup interface.

This stage measures observable contribution activity derived from GitHub statistics and does not evaluate code quality or project impact.

---

## Installation & Usage

Clone the repository:

```bash
git clone https://github.com/OWASP/OWASP-Community-Recognition-Tool
cd OWASP-Community-Recognition-Tool/algorithm/
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

Or copy the example file:

```bash
cp .env.example .env
```

Run the complete workflow:

```bash
# Step 1
python global_contributors_list.py

# Step 2
python activity_histogram.py

# Step 3
python contributors_ranking.py
```
