# Smart Vacation Planner

Maximize your time off by finding the best vacation windows around public holidays and weekends. The app automatically detects your country, fetches public holidays, and calculates optimal PTO usage — so you get the longest breaks with the fewest days off.

**Live:** [extendholidays.com](https://extendholidays.com)

## Features

- Auto-detects country and public holidays via IP geolocation
- Finds optimal vacation windows by bridging holidays and weekends
- Auto-optimize: picks the best non-overlapping combination within your PTO budget
- Interactive calendar overview with PTO, holidays, and weekends highlighted
- Export selected vacations as `.ics` file (Google Calendar, Outlook, Apple Calendar)
- Dark / light mode
- Fully client-side — no backend required

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
        core/          # Services, utilities (vacation optimizer, ICS export)
        pages/         # Components (configuration, calendar, results)
      styles.scss      # Global styles & theme variables
    public/
      i18n/            # Translations
```

## How It Works

1. Your country is auto-detected and public holidays are fetched
2. The optimizer scans the year for gaps between holidays/weekends that can be bridged with PTO
3. Results are ranked by total rest days and efficiency (rest days per PTO day)
4. Select multiple vacations — overlapping or over-budget options are automatically disabled
5. Auto-optimize runs a knapsack algorithm to find the best combination within your budget
6. Export your plan as an `.ics` calendar file