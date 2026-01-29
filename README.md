# SPARK - Solar Planning And ROI Kit

> **Note:** This project was created almost entirely using Large Language Models (LLMs), specifically Claude Code. The design, implementation, and documentation were generated through AI assistance.

A beautiful, interactive web application for visualizing and analyzing energy consumption data from CSV files. Calculate potential savings from solar panels, battery storage, or combined systems based on your actual usage patterns.

## Features

### 📊 **Consumption Visualization**
- Interactive charts with zoom and pan capabilities
- Multiple time frame views (Raw Data, Daily, Weekly, Monthly)
- Toggle between kWh and Cost (£) views
- Detailed statistics and peak consumption analysis
- Aggregated data tables with breakdown by period

### 💰 **Cost Analysis**
- Configure custom rate periods (e.g., cheap overnight rates)
- Calculate total and estimated annual costs
- Cost breakdown by rate period
- Average effective rate calculation
- Handles cross-midnight periods (23:30-05:30)
- Add, edit, and delete custom rate periods

### 🔋 **Battery Calculator**
- Simulate battery performance and savings
- Common battery size presets with realistic costs:
  - Small (5 kWh) - £3,500
  - Medium (10 kWh) - £6,000
  - Large (13.5 kWh - Powerwall 2) - £8,000
  - Extra Large (20 kWh) - £12,000
- Smart battery size recommendations based on your consumption
- Detailed savings analysis:
  - Annual savings estimate
  - Accurate payback period based on actual costs
  - Self-sufficiency rate
  - Peak shaving benefits
  - ROI comparison
- Winter coverage analysis
- Savings breakdown by rate period
- Custom battery configurations
- Side-by-side battery comparison

### ☀️ **Solar Calculator**
- Simulate solar panel performance and savings
- Multiple system size presets (2kW - 8kW)
- Detailed generation and financial analysis
- Export earnings calculations
- Self-consumption metrics
- Custom solar configurations

### 🌟 **Combined Analysis**
- Comprehensive analysis of solar + battery systems
- Compare different system configurations
- Grid-only vs. system cost comparisons
- Energy flow visualization
- Share configurations via URL
- Manual annual usage entry for quick estimates

### 🎨 **Beautiful UI**
- Modern, clean design with Tailwind CSS
- Dark mode by default (with light mode toggle)
- Fully responsive (mobile/tablet/desktop)
- Smooth animations and transitions
- Accessible components

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management with localStorage persistence
- **date-fns** - Date handling
- **PapaParse** - CSV parsing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/neoKushan/SPARK.git
cd SPARK

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions. Simply push to the `main` branch and the workflow will build and deploy the site.

The live site is available at: https://spark.stevedonaghy.com

## Usage

1. **Upload Data**
   - Click or drag-and-drop your CSV file
   - CSV format: `Consumption (kwh), Start, End`
   - Or enter your annual kWh usage for quick estimates
   - Example CSV:
     ```csv
     Consumption (kwh), Start, End
     0.579000, 2025-10-09T12:00:00+01:00, 2025-10-09T12:30:00+01:00
     ```

2. **View Consumption**
   - Switch between Raw Data, Daily, Weekly, Monthly views
   - Toggle between kWh and Cost views
   - Use the brush component to zoom into specific time periods
   - Review aggregated statistics

3. **Configure Pricing**
   - Navigate to the "Pricing" tab
   - Edit existing rate periods or add new ones
   - View cost breakdowns and annual estimates
   - Rates are automatically saved to browser storage

4. **Calculate Battery Savings**
   - Go to the "Battery" tab
   - See recommended battery size based on your consumption
   - Select from preset battery configurations or create custom ones
   - Review detailed savings analysis and payback periods
   - Compare all battery options side-by-side

5. **Calculate Solar Savings**
   - Go to the "Solar" tab
   - See recommended solar system size
   - Select from preset configurations or create custom ones
   - View generation estimates and financial analysis

6. **View Combined Summary**
   - Navigate to the "Summary" tab
   - See comprehensive analysis of your selected systems
   - Compare with grid-only costs
   - Share your configuration via URL

## CSV Data Format

The application expects CSV files with the following structure:

- **Consumption (kwh)**: Energy consumed in kilowatt-hours
- **Start**: ISO 8601 timestamp with timezone (e.g., `2025-10-09T12:00:00+01:00`)
- **End**: ISO 8601 timestamp with timezone (e.g., `2025-10-09T12:30:00+01:00`)

Compatible with Octopus Energy and other smart meter exports in 30-minute intervals.

## Features in Detail

### Rate Configuration

Default configuration includes (Intelligent Octopus Go):
- **Cheap Rate**: 23:30 - 05:30 @ £0.07/kWh (7.00p/kWh)
- **Standard Rate**: 05:30 - 23:30 @ £0.3051/kWh (30.51p/kWh)

Rate periods are fully customizable and stored in browser localStorage.

### Battery Simulation

The battery simulator:
- Charges during cheap rate periods
- Discharges during expensive rate periods
- Applies roundtrip efficiency losses (default 90%)
- Respects charge/discharge rate limits
- Maintains configurable minimum state of charge (default 10%)
- Uses actual battery costs for accurate payback calculations

### Solar Simulation

The solar simulator:
- Uses UK average irradiance patterns
- Accounts for panel orientation and tilt
- Calculates self-consumption and export
- Applies system efficiency losses
- Estimates annual generation
- Calculates export earnings (Smart Export Guarantee)

### Custom Configurations

Add your own battery or solar options with:
- Custom name
- Capacity/size specifications
- Performance parameters
- Upfront cost for accurate ROI calculations

### Data Storage

- CSV data is kept in memory (not persisted)
- Rate configurations persist in localStorage
- Battery configurations persist in localStorage
- Solar configurations persist in localStorage
- Custom configurations persist in localStorage
- Dark mode preference persists

## Development

### Project Structure

```
SPARK/
├── src/
│   ├── components/          # React components
│   │   ├── battery/        # Battery calculator components
│   │   ├── solar/          # Solar calculator components
│   │   ├── combined/       # Combined analysis
│   │   ├── layout/         # Layout components (Header, etc.)
│   │   ├── pricing/        # Pricing components
│   │   ├── ui/             # Reusable UI primitives (shadcn/ui)
│   │   ├── upload/         # CSV upload component
│   │   └── visualization/  # Chart and dashboard components
│   ├── context/            # State management (Zustand)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── csvParser.ts           # CSV parsing logic
│   │   ├── aggregationUtils.ts    # Data aggregation
│   │   ├── pricingCalculator.ts   # Cost calculations
│   │   ├── batterySimulator.ts    # Battery simulation
│   │   ├── solarSimulator.ts      # Solar simulation
│   │   └── urlState.ts            # URL sharing logic
│   └── App.tsx             # Main app component
├── public/                 # Static assets
└── index.html             # HTML entry point
```

### Key Algorithms

#### Time Aggregation
Groups 30-minute intervals into larger periods (day, week, month) with statistics including totals, averages, and peak values.

#### Rate Matching
Matches timestamps to rate periods, correctly handling cross-midnight periods (e.g., 23:30-05:30).

#### Battery Simulation
```
For each 30-minute interval:
  - During cheap rate: charge battery (if space available)
  - During expensive rate: discharge battery (if charge available)
  - Apply roundtrip efficiency losses
  - Calculate savings: (expensive rate - cheap rate) × energy from battery
  - Track state of charge and battery action
```

#### Solar Simulation
```
For each 30-minute interval:
  - Calculate solar generation based on time of day and season
  - Apply panel orientation and tilt factors
  - Calculate self-consumed vs. exported energy
  - Apply system efficiency losses
  - Calculate savings and export earnings
```

#### ROI Calculation
```
ROI % = (Annual Savings / Upfront Cost) × 100
Payback Period = Upfront Cost / Annual Savings
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with React and modern web technologies
- Designed for UK energy market (works with any time-of-use tariff)
- Inspired by the need for better renewable energy planning tools
- UI components from shadcn/ui
- Created with assistance from Claude Code (Anthropic)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
