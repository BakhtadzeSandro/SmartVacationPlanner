# Smart Vacation Planner

Maximize your time off by finding the best vacation windows around public holidays and weekends. The app automatically detects your country, fetches public holidays, and calculates optimal PTO usage — so you get the longest breaks with the fewest days off.

**Live:** [extendholidays.com](https://extendholidays.com)

## How It Works

### The Core Idea

Public holidays and weekends are free days you already have. When a holiday falls on a Thursday, you only need one PTO day (Friday) to get a four-day weekend. This app finds all such opportunities across the entire year and helps you pick the best combination.

### The Algorithm

**Step 1 — Build a free-day map.** The optimizer marks every weekend and public holiday in the selected year as a "free day."

**Step 2 — Find clusters.** It identifies maximal consecutive runs of free days. For example, a Saturday-Sunday-Monday(holiday) block forms one cluster.

**Step 3 — Find gaps.** The weekdays between adjacent clusters are "gaps" — these are the PTO days you'd need to bridge two clusters into one long vacation.

**Step 4 — Sliding window.** Starting from each cluster, the algorithm tries bridging one gap, then two gaps, then three, and so on, accumulating the PTO cost. It stops when the PTO cost exceeds your max PTO per vacation. Each valid bridge becomes a vacation option showing:
- **Total rest days** — the full span from start to end (including weekends, holidays, and PTO days)
- **PTO days used** — only the weekday gap days you need to take off
- **Efficiency** — rest days per PTO day (e.g., 9 days off for 4 PTO = 2.3x efficiency)
- **Holidays included** — which public holidays fall within the window

**Step 5 — Filter.** Results are filtered to only include windows that contain at least one public holiday, and optionally by season. Past dates are excluded. The top 50 results are returned.

### Auto-Optimize (Knapsack)

When you click "Auto-Optimize," the app runs a dynamic programming knapsack algorithm:
- Each vacation option has a "cost" (PTO days) and a "value" (total rest days)
- Non-overlapping constraint: two selected vacations cannot have overlapping dates
- Optional minimum gap: you can require N days between the end of one vacation and the start of the next
- The algorithm finds the combination that maximizes total rest days without exceeding your PTO budget

This is a weighted job scheduling variant solved with DP in O(n * budget) time.

## Configuration Options

| Option | Description |
|--------|-------------|
| **Country** | Determines which public holidays to use. Auto-detected via IP, changeable in the header. |
| **Available PTO Days** | Your total annual PTO budget. Pre-filled with your country's statutory minimum (sourced from Wikipedia). |
| **Year** | Current year or next year. Changing the year reloads holidays. |
| **Min/Max PTO per vacation** | Controls the size range of individual vacation options. Min filters out short trips; Max caps how many PTO days a single vacation can use. |
| **Period Filter** *(Advanced)* | Restrict results to a season: Spring (Mar-May), Summer (Jun-Aug), Fall (Sep-Nov), or Winter (Dec-Feb). |
| **Mid-week starts** *(Advanced)* | By default, vacations must start on a Friday, Saturday, or Sunday (attach to a weekend). Enabling this allows any start day. |
| **Min gap between vacations** *(Advanced)* | Minimum days between the end of one vacation and the start of the next, used during auto-optimization. Useful to avoid back-to-back trips. |

## Features

- Auto-detects country and public holidays via IP geolocation
- Finds optimal vacation windows by bridging holidays and weekends
- Auto-optimize: picks the best non-overlapping combination within your PTO budget
- Interactive calendar overview with PTO, holidays, and weekends highlighted
- Export selected vacations as `.ics` file (Google Calendar, Outlook, Apple Calendar)
- Dark / light mode
- Fully client-side — no backend, no data sent to a server

## Tech Stack

- **Angular 21** with standalone components and signals
- **PrimeNG** for UI components
- **SCSS** with CSS custom properties for theming
- **pnpm** monorepo

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm --filter ui start
```

The app runs at `http://localhost:4200`.

## Build

```bash
pnpm --filter ui build
```

Output is in `apps/ui/dist/ui`.

## Project Structure

```
apps/
  ui/                  # Angular frontend
    src/
      app/
        core/
          services/    # Country state, configuration, theme, translation
          utils/       # Vacation optimizer, ICS export
        pages/
          components/  # Header, configuration sidebar, calendar, results
          main/        # App shell, solo planner layout
      styles.scss      # Global styles & theme variables
    public/
      i18n/            # Translation files (en.json)
```

## Data Sources

| Data | Source | Notes |
|------|--------|-------|
| Country detection | [ipapi.co](https://ipapi.co) | IP geolocation, fallback to manual selection |
| Public holidays | [Nager.Date API](https://date.nager.at) | Available countries + holidays per year |
| Minimum leave days | [Wikipedia](https://en.wikipedia.org/wiki/List_of_minimum_annual_leave_by_country) | Parsed client-side from the HTML table |
| Country flags | [flagcdn.com](https://flagcdn.com) | 24x18 PNG flags by country code |
