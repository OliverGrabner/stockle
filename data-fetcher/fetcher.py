import os
import json
from datetime import date
import yfinance as yf
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "postgres"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "stockle"),
    "user": os.getenv("DB_USER", "stockle"),
    "password": os.getenv("DB_PASSWORD")
}

# Top 250 US stocks by market cap
TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "LLY", "V",
    "JPM", "UNH", "XOM", "MA", "JNJ", "PG", "COST", "HD", "ABBV", "WMT",
    "NFLX", "BAC", "CRM", "CVX", "MRK", "KO", "AMD", "PEP", "ORCL", "TMO",
    "ADBE", "WFC", "MCD", "CSCO", "ACN", "IBM", "GE", "ABT", "DHR", "CAT",
    "NOW", "DIS", "VZ", "INTC", "INTU", "CMCSA", "TXN", "QCOM", "PFE", "AMGN",
    "PM", "GS", "AMAT", "ISRG", "RTX", "BKNG", "T", "HON", "SPGI", "NEE",
    "LOW", "MS", "BLK", "UNP", "SYK", "AXP", "VRTX", "ELV", "SCHW", "LMT",
    "MDT", "PANW", "DE", "BMY", "GILD", "ADP", "PLD", "LRCX", "CB", "C",
    "MMC", "ADI", "REGN", "KLAC", "MDLZ", "SBUX", "ETN", "FI", "CI", "SO",
    "MO", "SHW", "ZTS", "DUK", "CME", "CL", "ICE", "BSX", "SNPS", "CDNS",
    "EOG", "PGR", "ITW", "NOC", "SLB", "USB", "EQIX", "MU", "WM", "BA",
    "PYPL", "APD", "BDX", "MCO", "AON", "CMG", "TJX", "PNC", "COP", "FDX",
    "TGT", "MMM", "GD", "EMR", "NSC", "APH", "ORLY", "PSX", "HCA", "NXPI",
    "MPC", "TT", "CTAS", "VLO", "ECL", "MSI", "AFL", "NEM", "CARR", "AIG",
    "AJG", "PSA", "PCAR", "KDP", "OXY", "WELL", "GM", "HLT", "AZO", "TFC",
    "SRE", "AEP", "MCHP", "D", "MAR", "MET", "PAYX", "F", "NUE", "CCI",
    "KMB", "SPG", "FTNT", "AMP", "ROST", "O", "PRU", "EXC", "DXCM", "JCI",
    "HES", "ODFL", "GIS", "PCG", "RSG", "BK", "KMI", "IDXX", "ALL", "KR",
    "A", "FAST", "CTVA", "EW", "OTIS", "YUM", "GWW", "LHX", "XEL", "MSCI",
    "DD", "VRSK", "EA", "GEHC", "CMI", "PPG", "EXR", "IQV", "HIG", "CTSH",
    "VICI", "MNST", "ED", "ON", "EIX", "ACGL", "HPQ", "VMC", "ROP", "MLM",
    "CBRE", "DLR", "DOW", "WEC", "STZ", "CPRT", "AWK", "RCL", "ROK", "KEYS",
    "ANSS", "IR", "DHI", "FTV", "LEN", "WAB", "TSCO", "FANG", "AVB", "IRM",
    "EFX", "GLW", "TRGP", "PWR", "CHD", "WTW", "EBAY", "ZBH", "EQR", "HPE",
    "DECK", "MTD", "FITB", "WY", "DOV", "CSGP", "TTWO", "BR", "HAL", "ULTA"
]


def fetch_stock_info(ticker: str) -> dict:
    """Fetch basic stock info (for comparison hints)."""
    stock = yf.Ticker(ticker)
    info = stock.info

    # Get P/E ratio (trailing)
    pe_ratio = info.get("trailingPE") or info.get("forwardPE")
    if pe_ratio:
        pe_ratio = round(pe_ratio, 2)

    # Get dividend yield (as percentage)
    # yfinance returns dividend yield as decimal (e.g., 0.0234 for 2.34%)
    dividend_yield = info.get("dividendYield")
    if dividend_yield:
        dividend_yield = round(dividend_yield * 100, 2)

    return {
        "ticker": ticker,
        "company_name": info.get("longName", info.get("shortName", ticker)),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "market_cap": info.get("marketCap", 0),
        "current_price": round(info.get("currentPrice") or info.get("regularMarketPrice", 0), 2),
        "pe_ratio": pe_ratio,
        "dividend_yield": dividend_yield
    }


def fetch_price_history(ticker: str, period: str = "5y") -> list:
    """Fetch price history for a stock (for the chart)."""
    stock = yf.Ticker(ticker)
    history = stock.history(period=period)

    price_history = []
    for dt, row in history.iterrows():
        price_history.append({
            "date": dt.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"])
        })

    return price_history


def update_stocks_table(conn):
    """Update all 250 stocks with latest data."""
    print("=" * 50)
    print("STEP 1: Updating stocks table with latest data")
    print("=" * 50)

    cursor = conn.cursor()
    total = len(TICKERS)

    for i, ticker in enumerate(TICKERS, 1):
        try:
            print(f"[{i}/{total}] {ticker}...", end=" ")
            data = fetch_stock_info(ticker)

            cursor.execute("""
                INSERT INTO stocks (ticker, company_name, sector, industry, market_cap, current_price, pe_ratio, dividend_yield)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ticker) DO UPDATE SET
                    company_name = EXCLUDED.company_name,
                    sector = EXCLUDED.sector,
                    industry = EXCLUDED.industry,
                    market_cap = EXCLUDED.market_cap,
                    current_price = EXCLUDED.current_price,
                    pe_ratio = EXCLUDED.pe_ratio,
                    dividend_yield = EXCLUDED.dividend_yield
            """, (
                data["ticker"],
                data["company_name"],
                data["sector"],
                data["industry"],
                data["market_cap"],
                data["current_price"],
                data["pe_ratio"],
                data["dividend_yield"]
            ))
            conn.commit()
            print(f"{data['company_name']} - ${data['current_price']}")

        except Exception as e:
            print(f"Error: {e}")
            continue

    cursor.close()
    print(f"\nStocks table updated with {total} stocks.\n")


def set_daily_puzzle(conn):
    """Pick a random stock and set it as today's puzzle with 5yr price history."""
    print("=" * 50)
    print("STEP 2: Setting today's daily puzzle")
    print("=" * 50)

    cursor = conn.cursor()
    today = date.today().isoformat()

    cursor.execute("SELECT ticker FROM daily_puzzles WHERE puzzle_date = %s", (today,))
    existing = cursor.fetchone()
    if existing:
        print(f"Puzzle already set for {today}: {existing[0]}")
        cursor.close()
        return

    cursor.execute("""
        SELECT ticker FROM stocks
        WHERE ticker NOT IN (
            SELECT ticker FROM daily_puzzles
            WHERE puzzle_date > CURRENT_DATE - INTERVAL '30 days'
        )
        ORDER BY market_cap DESC NULLS LAST
        LIMIT 50
    """)
    top_50 = cursor.fetchall()

    if not top_50:
        print("Error: No eligible stocks found!")
        cursor.close()
        return

    import random
    result = random.choice(top_50)

    ticker = result[0]
    print(f"Selected ticker: {ticker}")

    print(f"Fetching 5 years of price history...")
    price_history = fetch_price_history(ticker, "5y")
    print(f"Got {len(price_history)} days of data")

    n = random.randint(15, 25)
    mean = random.uniform(2.8, 5.0)
    dist = [0] * 7
    for _ in range(n):
        v = int(random.gauss(mean, 1.2))
        v = max(0, min(6, v))
        dist[v] += 1

    cursor.execute("""
        INSERT INTO daily_puzzles (puzzle_date, ticker, price_history, distribution, total_plays)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (puzzle_date) DO NOTHING
    """, (today, ticker, json.dumps(price_history), dist, n))

    conn.commit()
    cursor.close()
    print(f"\nDaily puzzle set: {ticker} for {today}\n")


def main():
    if not DB_CONFIG["password"]:
        print("Error: DB_PASSWORD not set.")
        return

    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    print("Connected!\n")

    # Step 1: Update all stocks with latest data
    update_stocks_table(conn)

    # Step 2: Set today's daily puzzle
    set_daily_puzzle(conn)

    conn.close()
    print("=" * 50)
    print("DONE!")
    print("=" * 50)


if __name__ == "__main__":
    main()
