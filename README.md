# OctoView - Energy Consumption Visualizer

A beautiful, interactive web application for visualizing and analyzing energy consumption data from CSV files. Built specifically for Octopus Energy users but compatible with any similar 30-minute interval energy data.

## Features

### 📊 **Consumption Visualization**
- Interactive charts with Recharts
- Multiple time frame views (Daily, Weekly, Monthly, All Data)
- Detailed statistics and peak consumption analysis
- Aggregated data tables with breakdown by period

### 💰 **Cost Analysis**
- Configure custom rate periods (e.g., cheap overnight rates)
- Calculate total and estimated annual costs
- Cost breakdown by rate period
- Average effective rate calculation
- Handles cross-midnight periods (23:30-05:00)

### 🔋 **Battery Calculator**
- Simulate battery performance and savings
- Common battery size presets (5kWh, 10kWh, 13.5kWh, 20kWh)
- Smart battery size recommendations based on your consumption
- Detailed savings analysis:
  - Annual savings estimate
  - Payback period
  - Self-sufficiency rate
  - Peak shaving benefits
- Winter coverage analysis
- Savings breakdown by rate period

### 🎨 **Beautiful UI**
- Modern, clean design with Tailwind CSS
- Dark mode support
- Fully responsive (mobile/tablet/desktop)
- Smooth animations and transitions
- Accessible components

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **date-fns** - Date handling
- **PapaParse** - CSV parsing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/OctoView.git
cd OctoView

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment to GitHub Pages

```bash
# Build and deploy
npm run deploy
```

The site will be deployed to `https://yourusername.github.io/OctoView/`

## Usage

1. **Upload Data**
   - Click or drag-and-drop your CSV file
   - CSV format: `Consumption (kwh), Start, End`
   - Example:
     ```csv
     Consumption (kwh), Start, End
     0.579000, 2025-10-09T12:00:00+01:00, 2025-10-09T12:30:00+01:00
     ```

2. **View Consumption**
   - Switch between Daily, Weekly, Monthly views
   - Explore interactive charts
   - Review aggregated statistics

3. **Configure Pricing**
   - Navigate to the "Pricing" tab
   - Default rates are pre-configured
   - View cost breakdowns and annual estimates

4. **Calculate Battery Savings**
   - Go to the "Battery" tab
   - See recommended battery size
   - Select from common battery configurations
   - Review detailed savings analysis

## CSV Data Format

The application expects CSV files with the following structure:

- **Consumption (kwh)**: Energy consumed in kilowatt-hours
- **Start**: ISO 8601 timestamp with timezone (e.g., `2025-10-09T12:00:00+01:00`)
- **End**: ISO 8601 timestamp with timezone (e.g., `2025-10-09T12:30:00+01:00`)

Compatible with Octopus Energy export format.

## Features in Detail

### Rate Configuration

Default configuration includes:
- **Cheap Rate**: 23:30 - 05:00 @ £0.075/kWh
- **Standard Rate**: 05:00 - 23:30 @ £0.245/kWh

Rate periods are stored in browser localStorage.

### Battery Simulation

The battery simulator:
- Charges during cheap rate periods
- Discharges during expensive rate periods
- Applies roundtrip efficiency losses (default 90%)
- Respects charge/discharge rate limits
- Maintains minimum state of charge

### Data Storage

- CSV data is kept in memory (not persisted)
- Rate configurations persist in localStorage
- Battery configurations persist in localStorage
- Dark mode preference persists

## Development

### Project Structure

```
OctoView/
├── src/
│   ├── components/          # React components
│   │   ├── battery/        # Battery calculator components
│   │   ├── layout/         # Layout components (Header, etc.)
│   │   ├── pricing/        # Pricing components
│   │   ├── ui/             # Reusable UI primitives
│   │   ├── upload/         # CSV upload component
│   │   └── visualization/  # Chart and dashboard components
│   ├── context/            # State management (Zustand)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── csvParser.ts           # CSV parsing logic
│   │   ├── aggregationUtils.ts    # Data aggregation
│   │   ├── pricingCalculator.ts   # Cost calculations
│   │   └── batterySimulator.ts    # Battery simulation
│   └── App.tsx             # Main app component
├── public/                 # Static assets
└── index.html             # HTML entry point
```

### Key Algorithms

#### Time Aggregation
Groups 30-minute intervals into larger periods (day, week, month) with statistics.

#### Rate Matching
Matches timestamps to rate periods, handling cross-midnight periods correctly.

#### Battery Simulation
```
For each 30-minute interval:
  - During cheap rate: charge battery (if space available)
  - During expensive rate: discharge battery (if charge available)
  - Apply efficiency losses
  - Calculate savings
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with React and modern web technologies
- Designed for Octopus Energy users
- Inspired by the need for better energy consumption insights

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ⚡ by Claude Code**
