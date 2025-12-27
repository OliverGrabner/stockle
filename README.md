# Stockle

A stock guessing game inspired by Wordle. Guess the mystery stock based on price chart patterns and comparison hints.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│    Supabase     │
│   (Next.js)     │     │  (Spring Boot)  │     │  (PostgreSQL)   │
│   Port 3000     │     │    Port 8080    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        ▲
                                                        │
                                               ┌────────┴────────┐
                                               │  Data Fetcher   │
                                               │    (Python)     │
                                               └─────────────────┘
```

### Components

| Component | Tech Stack | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 16, React 19, Tailwind, shadcn/ui | Game UI with chart, search, hints |
| **Backend** | Spring Boot 3.2, Java 17 | REST API for game logic |
| **Database** | Supabase (PostgreSQL) | Stocks data + daily puzzles |
| **Data Fetcher** | Python, yfinance | Fetches stock data from Yahoo Finance |

---

## Database Schema

### `stocks` table
Stores info for 250 top US stocks (used for comparison hints):
```sql
CREATE TABLE stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    current_price DECIMAL(10,2),
    pe_ratio DECIMAL(10,2),
    dividend_yield DECIMAL(5,2)
);
```

### `daily_puzzles` table
One row per day with the mystery stock and its price history:
```sql
CREATE TABLE daily_puzzles (
    puzzle_date DATE PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES stocks(ticker),
    price_history JSONB  -- 5 years of OHLCV data
);
```

---

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Python 3.9+
- Supabase account (or local PostgreSQL)

### 1. Database Setup

Create tables in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    current_price DECIMAL(10,2),
    pe_ratio DECIMAL(10,2),
    dividend_yield DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS daily_puzzles (
    puzzle_date DATE PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES stocks(ticker),
    price_history JSONB
);
```

### 2. Data Fetcher Setup

```bash
cd data-fetcher

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install yfinance psycopg2-binary python-dotenv

# Create .env file
echo "SUPABASE_DB_PASSWORD=your_password_here" > .env
```

### 3. Run Data Fetcher (Populate + Set Daily Puzzle)

```bash
cd data-fetcher
python fetcher.py
```

This does two things:
1. **Updates stocks table** - Fetches latest data for 250 stocks from Yahoo Finance
2. **Sets daily puzzle** - Picks a random top-50 stock and stores 5 years of price history

### 4. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Reset / Refresh Database

### Full Reset (clear all data)
```sql
-- Run in Supabase SQL Editor
TRUNCATE daily_puzzles;
TRUNCATE stocks CASCADE;
```

Then re-run the data fetcher:
```bash
cd data-fetcher
python fetcher.py
```

### Set New Daily Puzzle Only
Delete today's puzzle and re-run fetcher:
```sql
DELETE FROM daily_puzzles WHERE puzzle_date = CURRENT_DATE;
```
```bash
python fetcher.py
```

### Update Stock Data Only
The fetcher uses `ON CONFLICT DO UPDATE`, so just run it again:
```bash
python fetcher.py
```

---

## API Reference

### `GET /api/puzzle/today/chart?range={1W,1M,1Y,5Y}`
Returns aggregated price data for the chart.

| Range | Data Points | Aggregation |
|-------|-------------|-------------|
| 1W | ~5 | Daily |
| 1M | ~22 | Daily |
| 1Y | ~52 | Weekly |
| 5Y | ~60 | Monthly |

**Response:**
```json
{
  "range": "1M",
  "data": [
    { "time": "2024-11-26", "value": 153.45 },
    { "time": "2024-11-27", "value": 155.20 }
  ]
}
```

### `GET /api/puzzle/today/hint?level={1,2,3}`
Progressive hint reveal.

| Level | Reveals |
|-------|---------|
| 1 | Sector |
| 2 | Sector + Industry |
| 3 | Sector + Industry + Ticker (with logo) |

### `POST /api/guess`
Submit a guess and get comparison feedback.

**Request:**
```json
{ "ticker": "MSFT" }
```

**Response:**
```json
{
  "ticker": "MSFT",
  "correct": false,
  "comparisons": {
    "sector": { "value": "Technology", "status": "correct" },
    "industry": { "value": "Software", "status": "wrong" },
    "marketCap": { "value": "2.80T", "status": "higher" },
    "price": { "value": "$375.50", "status": "lower" },
    "peRatio": { "value": "35.20", "status": "higher" },
    "dividendYield": { "value": "0.75%", "status": "wrong" }
  }
}
```

Status values: `correct`, `wrong`, `higher`, `lower`

### `GET /api/puzzle/today`
Get puzzle metadata (mostly used internally).

---

## How It Works

1. **Daily Puzzle Selection**: The data fetcher picks a random stock from the top 50 by market cap (not used in last 30 days) and stores 5 years of price history.

2. **Anonymous Chart**: The frontend shows price history without revealing the stock. Users can switch between 1W/1M/1Y/5Y views.

3. **Guessing**: Users search for stocks and submit guesses. The backend compares against the target stock and returns color-coded feedback:
   - Green = correct match
   - Red with arrow = numeric value is higher/lower
   - Red = wrong value

4. **Hints**: After wrong guesses, users can reveal hints progressively (sector → industry → logo).

5. **Win**: When the correct stock is guessed, confetti celebrates the victory.

---

## Development

### Frontend Proxy
The frontend proxies `/api/*` requests to `localhost:8080` via Next.js rewrites (see `next.config.ts`).

### Stock Logos
Logos are fetched from `logo.clearbit.com` using the stock ticker.

### Chart Library
Uses [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) for the price chart.
