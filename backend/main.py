import logging
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional

import asyncpg
import yfinance as yf
from auth import verify_token
from database import get_db
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pycoingecko import CoinGeckoAPI
from pydantic import BaseModel

logger = logging.getLogger(__name__)
app = FastAPI()



#######################################################
### Enable CORS to allow requests from the frontend ###
#######################################################

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mr-tracker.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




#####################
### Data models  ####
#####################

# Transaction model
class Transaction(BaseModel):
    type: str  # "income" or "expense"
    amount: float
    description: Optional[str] = None
    category_id: Optional[int] = None
    transaction_date: Optional[str] = None


# Investment model
class Investment(BaseModel):
    type_of_operation: str         # "buy" o "sell"
    asset_type: str                # "stock", "ETF" o "crypto"
    ticker: str                    # es. "AAPL", "BTC", "VUSA.L"
    full_name: str                 # es. "Apple", "Bitcoin"
    quantity: float
    total_value: float
    date_of_operation: str         # formato "YYYY-MM-DD"
    exchange: Optional[str] = None


# User model
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    
    
# Category model
class CategoryData(BaseModel):
    name: str
    icon: str


# Onboarding data model
class OnboardingData(BaseModel):
    initial_balance: float
    expense_categories: List[CategoryData]
    income_categories: List[CategoryData]
    
    
# Category creation model
class CategoryCreate(BaseModel):
    type: str  # "income" or "expense"
    name: str
    icon: str




########################
### Helper functions ###
########################

# Function to validate a ticker symbol using yfinance
def validate_ticker_yfinance(ticker: str) -> bool:
    try:
        if not ticker:
            return False
        ticker_obj = yf.Ticker(ticker)
        # Attempt to download data to see if the ticker is valid.
        # If the ticker is invalid, yfinance might return empty data.
        hist = ticker_obj.history(period="1d")
        if hist.empty:
            return False
        return True
    except Exception:
        return False


# Function to validate a ticker symbol using CoinGecko
def validate_ticker_coingecko(ticker: str) -> bool:
    try:
        if not ticker:
            return False
        cg = CoinGeckoAPI()
        # Attempt a search on CoinGecko by coin symbol or name.
        # We'll do a simple search. If no match, it's invalid.
        search_result = cg.search(query=ticker)
        # search_result is a dict with keys like 'coins', 'exchanges', etc.
        if not search_result or "coins" not in search_result:
            return False
        # We can consider it valid if at least one coin matches the search.
        return len(search_result["coins"]) > 0
    except Exception:
        return False




###########################
### API Endpoints - GET ###
###########################

# GET endpoint to check if the backend is up
@app.get("/")
def home():
    return {"message": "Backend is up!"}


# GET endpoint to fetch transactions
@app.get("/transactions")
async def get_transactions(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = "SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC"
    transactions = await db.fetch(query, user_id)
    return {"transactions": [dict(t) for t in transactions]}


# GET endpoint to fetch investments
@app.get("/investments")
async def get_investments(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = "SELECT * FROM investments WHERE user_id = $1 ORDER BY date_of_operation DESC"
    investments = await db.fetch(query, user_id)
    return {"investments": [dict(t) for t in investments]}


# GET endpoint to fetch account data and compute net worth
@app.get("/networth")
async def get_networth(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    # Get current USD to EUR exchange rate
    def get_usd_to_eur():
        try:
            eur_usd = yf.Ticker("EURUSD=X").history(period="1d")
            if not eur_usd.empty:
                rate = 1 / eur_usd["Close"].iloc[-1]
                return round(rate, 4)
            return 0.85  # Fallback rate
        except Exception:
            return 0.85

    usd_to_eur = get_usd_to_eur()

    today = date.today() + timedelta(days=1)
    start_30 = today - timedelta(days=30)
    start_60 = today - timedelta(days=60)

    async def get_sum(start_date, end_date, trx_type):
        query = """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE user_id = $1 AND type = $2 AND transaction_date >= $3 AND transaction_date < $4
        """
        return await db.fetchval(query, user_id, trx_type, start_date, end_date)

    income_30 = await get_sum(start_30, today, "income")
    income_60 = await get_sum(start_60, start_30, "income")
    expense_30 = await get_sum(start_30, today, "expense")
    expense_60 = await get_sum(start_60, start_30, "expense")

    def percentage_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100

    income_change = percentage_change(income_30, income_60)
    expense_change = percentage_change(expense_30, expense_60)

    investments_query = """
        SELECT asset_type, ticker, quantity, type_of_operation, date_of_operation
        FROM investments
        WHERE user_id = $1
    """
    raw_investments = await db.fetch(investments_query, user_id)

    from collections import defaultdict
    def compute_positions(as_of_date):
        positions = defaultdict(lambda: {"asset_type": "", "net_quantity": 0.0})
        for inv in raw_investments:
            if inv["date_of_operation"] >= as_of_date:
                continue
            operation = inv["type_of_operation"]
            if operation is None:
                continue
            key = inv["ticker"]
            q = 0.0 if inv["quantity"] is None else float(inv["quantity"])
            if operation.lower() == "buy":
                positions[key]["net_quantity"] += q
            elif operation.lower() == "sell":
                positions[key]["net_quantity"] -= q
            positions[key]["asset_type"] = inv["asset_type"]
        return positions

    async def get_investment_value(positions):
        total_value = 0.0
        cg = CoinGeckoAPI()
        
        for ticker, data in positions.items():
            quantity = data["net_quantity"]
            asset_type = data["asset_type"]
            if quantity <= 0:
                continue
            try:
                if asset_type.lower() in ["stock", "etf"]:
                    # Get USD price and convert to EUR
                    usd_price = yf.Ticker(ticker).history(period="1d")["Close"][-1]
                    eur_price = usd_price * usd_to_eur
                    total_value += eur_price * quantity
                elif asset_type.lower() == "crypto":
                    # Get direct EUR price
                    result = cg.search(query=ticker)
                    coins = result.get("coins", [])
                    if not coins:
                        continue
                    coin_id = coins[0]["id"]
                    market_data = cg.get_price(ids=coin_id, vs_currencies="eur")
                    total_value += market_data[coin_id]["eur"] * quantity
            except Exception as e:
                logger.warning(f"⚠️ Price check failed for {ticker}: {e}")
                continue
        return total_value

    pos_now = compute_positions(today + timedelta(days=1))
    pos_30 = compute_positions(start_30)
    inv_value_now = await get_investment_value(pos_now)
    inv_value_30 = await get_investment_value(pos_30)

    initial_balance = await db.fetchval(
        "SELECT COALESCE((SELECT initial_balance FROM accounts WHERE user_id = $1 LIMIT 1), 0)", user_id
    )

    networth_now = float(initial_balance) + float(income_30) - float(expense_30) + float(inv_value_now) 
    networth_prev = float(initial_balance) + float(income_60) - float(expense_60) + float(inv_value_30)
    networth_change = percentage_change(networth_now, networth_prev)

    return {
        "net_worth": round(networth_now, 2),
        "income_last_30_days": round(income_30, 2),
        "income_change_pct": round(income_change, 2),
        "expense_last_30_days": round(expense_30, 2),
        "expense_change_pct": round(expense_change, 2),
        "net_worth_change_pct": round(networth_change, 2),
        "investment_value_now": round(inv_value_now, 2),
        "investment_value_30_days_ago": round(inv_value_30, 2)
    }

# GET endpoint to fetch categories
@app.get("/categories")
async def get_categories(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = """
    SELECT id, type, name, icon
    FROM categories
    WHERE user_id = $1
    ORDER BY id
    """
    records = await db.fetch(query, user_id)
    return [dict(r) for r in records]




############################
### API Endpoints - POST ###
############################

# POST endpoint to create transactions
@app.post("/transactions")
async def create_transaction(
    transaction: Transaction,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db),
):
    try:
        transaction_date = (
            datetime.strptime(transaction.transaction_date, "%Y-%m-%d").date()
            if transaction.transaction_date else date.today()
        )

        query = """
        INSERT INTO transactions (user_id, type, amount, description, category_id, transaction_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
        """

        result = await db.fetchrow(
            query,
            user_id,
            transaction.type,
            transaction.amount,
            transaction.description,
            transaction.category_id,
            transaction_date,
        )

        if result:
            return {"message": "Transaction added successfully", "id": result["id"]}
        else:
            raise HTTPException(status_code=400, detail="Failed to add transaction")

    except asyncpg.PostgresError as e:
        logger.error(f"❌ Database error during transaction insert: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    
# POST endpoint to create investments
@app.post("/investments", status_code=status.HTTP_201_CREATED)
async def create_investment_new(
    investment: Investment,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db),
):
    # 1. Validazione del ticker in base al tipo di asset
    if investment.asset_type.lower() in ["stock", "etf"]:
        valid = validate_ticker_yfinance(investment.ticker)
    elif investment.asset_type.lower() == "crypto":
        valid = validate_ticker_coingecko(investment.ticker)
    else:
        raise HTTPException(status_code=400, detail=f"Asset type {investment.asset_type} non supportato")
    if not valid:
        raise HTTPException(
            status_code=400,
            detail=f"{investment.ticker} non supportato, controllare se il nome è corretto o riprovare in futuro"
        )
    
    # 2. Parsing della data
    try:
        op_date = datetime.strptime(investment.date_of_operation, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato data non valido")
    
    async with db.transaction():
        # 4. Inserisci l'investimento
        insert_query = """
        INSERT INTO investments (
            user_id,
            type_of_operation,
            asset_type,
            ticker,
            full_name,
            quantity,
            total_value,
            date_of_operation,
            exchange
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
        """
        new_id = await db.fetchval(
            insert_query,
            user_id,
            investment.type_of_operation,
            investment.asset_type,
            investment.ticker,
            investment.full_name,
            investment.quantity,
            investment.total_value,
            op_date,
            investment.exchange,
        )
        if not new_id:
            raise HTTPException(status_code=400, detail="Impossibile aggiungere l'investimento")
        
        # 5. Se si tratta di un \"buy\", crea la transazione corrispondente
        if investment.type_of_operation.lower() == "buy":
            # a) Controlla se esiste la categoria \"investments\" per l'utente
            cat_query = "SELECT id FROM categories WHERE user_id = $1 AND name = 'investments' LIMIT 1"
            cat_id = await db.fetchval(cat_query, user_id)
            if not cat_id:
                # Se non esiste, la crea
                cat_insert = """
                INSERT INTO categories (user_id, type, name, icon)
                VALUES ($1, 'expense', 'investments', 'IconChart')
                RETURNING id;
                """
                cat_id = await db.fetchval(cat_insert, user_id)
            # b) Crea la transazione e ottieni il transaction_id
            trx_query = """
            INSERT INTO transactions 
                (user_id, type, amount, description, category_id, transaction_date)
            VALUES ($1, 'expense', $2, $3, $4, $5)
            RETURNING id;
            """
            description = f"buy {investment.full_name}"
            trx_id = await db.fetchval(trx_query, user_id, investment.total_value, description, cat_id, op_date)
            
            # Aggiorna l'investimento con il transaction_id ottenuto
            update_investment_query = """
            UPDATE investments
            SET transaction_id = $1
            WHERE id = $2;
            """
            await db.execute(update_investment_query, trx_id, new_id)
    
    return {"message": "Investment added successfully", "id": new_id}


# POST endpoint for user registration
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: asyncpg.Connection = Depends(get_db)):
    query = """
    INSERT INTO users (email, password, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name;
    """
    result = await db.fetchrow(query, user.email, user.password, user.name)
    if result:
        return {"id": result["id"], "email": result["email"], "name": result["name"]}
    raise HTTPException(status_code=400, detail="Error registering user")


# POST endpoint to complete onboarding
@app.post("/onboarding")
async def complete_onboarding(
    data: OnboardingData,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    if data.initial_balance < 0:
        raise HTTPException(status_code=400, detail="Initial balance must be positive or 0")
    
    # Insert into accounts table
    await db.execute(
        "INSERT INTO accounts (user_id, initial_balance) VALUES ($1, $2)",
        user_id, data.initial_balance
    )
    
    # Insert expense categories
    for cat in data.expense_categories:
        await db.execute(
            "INSERT INTO categories (user_id, type, name, icon) VALUES ($1, 'expense', $2, $3)",
            user_id, cat.name, cat.icon
        )
    
    # Insert income categories
    for cat in data.income_categories:
        await db.execute(
            "INSERT INTO categories (user_id, type, name, icon) VALUES ($1, 'income', $2, $3)",
            user_id, cat.name, cat.icon
        )
    
    return {"message": "Onboarding completed successfully"}


# POST endpoint to create categories
@app.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = """
    INSERT INTO categories (user_id, type, name, icon)
    VALUES ($1, $2, $3, $4)
    RETURNING id, type, name, icon
    """
    result = await db.fetchrow(
        query,
        user_id,
        category.type,
        category.name,
        category.icon
    )
    if result:
        return {
            "id": result["id"],
            "type": result["type"],
            "name": result["name"],
            "icon": result["icon"]
        }
    raise HTTPException(
        status_code=400,
        detail="Error creating category"
    )




###########################
### API Endpoints - PUT ###
###########################

# PUT endpoint to update transactions
@app.put("/transactions/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    updated_transaction: Transaction,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    try:
        transaction_date = (
            datetime.strptime(updated_transaction.transaction_date, "%Y-%m-%d").date()
            if updated_transaction.transaction_date else date.today()
        )
        update_query = """
        UPDATE transactions
        SET type = $1,
            amount = $2,
            description = $3,
            category_id = $4,
            transaction_date = $5
        WHERE id = $6 AND user_id = $7
        RETURNING id;
        """
        result = await db.fetchval(
            update_query,
            updated_transaction.type,
            updated_transaction.amount,
            updated_transaction.description,
            updated_transaction.category_id,
            transaction_date,
            transaction_id,
            user_id
        )
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found or not authorized")
        return {"message": "Transaction updated successfully", "id": result}
    except asyncpg.PostgresError as e:
        logger.error(f"❌ Database error during transaction update: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

# PUT endpoint to update investments
@app.put("/investments/{investment_id}")
async def update_investment(
    investment_id: int,
    updated_investment: Investment,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    try:
        op_date = datetime.strptime(updated_investment.date_of_operation, "%Y-%m-%d").date()
        update_query = """
        UPDATE investments
        SET type_of_operation = $1,
            asset_type = $2,
            ticker = $3,
            full_name = $4,
            quantity = $5,
            total_value = $6,
            date_of_operation = $7,
            exchange = $8
        WHERE id = $9 AND user_id = $10
        RETURNING id;
        """ 
        # Esegui l'aggiornamento dell'investimento
        result = await db.fetchval(
            update_query,
            updated_investment.type_of_operation,
            updated_investment.asset_type,
            updated_investment.ticker,
            updated_investment.full_name,
            updated_investment.quantity,
            updated_investment.total_value,
            op_date,
            updated_investment.exchange,
            investment_id,
            user_id
        )
        if not result:
            raise HTTPException(status_code=404, detail="Investment not found or not authorized")
        
        # Se l'operazione è "buy", aggiorna la transazione corrispondente
        if updated_investment.type_of_operation.lower() == "buy":
            trx_update_query = """
            UPDATE transactions
            SET amount = $1,
                description = $2,
                transaction_date = $3
            WHERE id = $4 AND user_id = $5;
            """
            description = f"buy {updated_investment.full_name}"
            # Recupera il transaction_id associato all'investimento
            trx_id = await db.fetchval("SELECT transaction_id FROM investments WHERE id = $1", investment_id)
            if trx_id:
                await db.execute(trx_update_query, updated_investment.total_value, description, op_date, trx_id, user_id)
            
            return {"message": "Investment updated successfully", "id": result}
        
    except asyncpg.PostgresError as e:
        logger.error(f"❌ Database error during investment update: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    
    
    
##############################
### API Endpoints - DELETE ###
##############################

# DELETE endpoint to delete a transaction
@app.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    try:
        # Make sure transaction belongs to this user
        delete_query = """
        DELETE FROM transactions
        WHERE id = $1 AND user_id = $2
        RETURNING id;
        """
        deleted_id = await db.fetchval(delete_query, transaction_id, user_id)
        if not deleted_id:
            raise HTTPException(status_code=404, detail="Transaction not found or not authorized")
        return {"message": "Transaction deleted successfully"}
    except asyncpg.PostgresError as e:
        logger.error(f"❌ Database error during transaction delete: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# DELETE endpoint to delete an investment
@app.delete("/investments/{investment_id}")
async def delete_investment(
    investment_id: int,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    try:
        # Prima elimina la transazione corrispondente
        trx_id = await db.fetchval("SELECT transaction_id FROM investments WHERE id = $1", investment_id)
        if trx_id:
            await db.execute("DELETE FROM transactions WHERE id = $1 AND user_id = $2", trx_id, user_id)
        
        # Poi elimina l'investimento
        delete_query = """
        DELETE FROM investments
        WHERE id = $1 AND user_id = $2
        RETURNING id;
        """
        deleted_id = await db.fetchval(delete_query, investment_id, user_id)
        if not deleted_id:
            raise HTTPException(status_code=404, detail="Investment not found or not authorized")
        return {"message": "Investment deleted successfully"}
    except asyncpg.PostgresError as e:
        logger.error(f"❌ Database error during investment delete: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

# DELETE endpoint to delete all transactions
@app.delete("/all-transactions")
async def delete_all_transactions(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    await db.execute("DELETE FROM transactions WHERE user_id = $1", user_id)
    return {"message": "All transactions deleted successfully"}


# DELETE endpoint to delete all investments
@app.delete("/all-investments")
async def delete_all_investments(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    await db.execute("DELETE FROM investments WHERE user_id = $1", user_id)
    return {"message": "All investments deleted successfully"}


# DELETE endpoint to delete all account data
@app.delete("/account-data")
async def delete_account_data(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    await db.execute("DELETE FROM transactions WHERE user_id = $1", user_id)
    await db.execute("DELETE FROM investments WHERE user_id = $1", user_id)
    return {"message": "Account data deleted successfully"}


# DELETE endpoint to delete an account
@app.delete("/account")
async def delete_account(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    await db.execute("DELETE FROM transactions WHERE user_id = $1", user_id)
    await db.execute("DELETE FROM investments WHERE user_id = $1", user_id)
    deleted_id = await db.fetchval("DELETE FROM users WHERE id = $1 RETURNING id", user_id)
    if not deleted_id:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account deleted successfully"}




#############################
### API Endpoints - PLOTS ###
#############################

# Endpoint to get net worth history
@app.get("/networth-history")
async def get_networth_history(
    range_days: int = 90,
    user_id: str = Depends(verify_token),
    db = Depends(get_db)
):
    today = date.today()

    # Get historical EUR/USD exchange rates
    def get_eur_rates(start_date, end_date):
        try:
            eurusd = yf.Ticker("EURUSD=X").history(
                start=start_date.strftime("%Y-%m-%d"),
                end=end_date.strftime("%Y-%m-%d")
            )
            return {idx.date(): 1 / row["Close"] for idx, row in eurusd.iterrows()}
        except Exception as e:
            logger.error(f"Error fetching EUR rates: {e}")
            return {}

    # Original date calculation remains unchanged
    earliest_date_query = """
        SELECT MIN(t1) AS earliest
        FROM (
            SELECT MIN(transaction_date) AS t1 FROM transactions WHERE user_id = $1
            UNION
            SELECT MIN(date_of_operation) AS t1 FROM investments WHERE user_id = $1
        ) as sub
    """
    earliest_date = await db.fetchval(earliest_date_query, user_id)
    if earliest_date is None:
        return []

    calc_start = today - timedelta(days=range_days)
    start_date = min(earliest_date, calc_start)

    # Get EUR conversion rates for the entire period
    eur_rates = get_eur_rates(start_date, today)

    # Original transaction loading remains unchanged
    query_init_balance = """SELECT COALESCE((SELECT initial_balance FROM accounts WHERE user_id = $1 LIMIT 1), 0)"""
    initial_balance = float(await db.fetchval(query_init_balance, user_id) or 0)

    query_transactions = """
        SELECT transaction_date, type, amount
        FROM transactions
        WHERE user_id = $1
          AND transaction_date <= $2
        ORDER BY transaction_date
    """
    rows_trx = await db.fetch(query_transactions, user_id, today)
    
    daily_income = defaultdict(float)
    daily_expense = defaultdict(float)
    for r in rows_trx:
        d = r["transaction_date"]
        amt = float(r["amount"])
        if r["type"] == "income":
            daily_income[d] += amt
        elif r["type"] == "expense":
            daily_expense[d] += amt

    # Original investment loading remains unchanged
    query_invest = """
        SELECT date_of_operation, type_of_operation, asset_type, ticker, quantity
        FROM investments
        WHERE user_id = $1
          AND date_of_operation <= $2
        ORDER BY date_of_operation
    """
    rows_inv = await db.fetch(query_invest, user_id, today)

    tickers_stock_etf = set()
    tickers_crypto = set()
    daily_invest_ops = defaultdict(list)

    for r in rows_inv:
        d = r["date_of_operation"]
        asset_type = r["asset_type"].lower()
        tck = r["ticker"]
        op_type = r["type_of_operation"].lower()
        qty = float(r["quantity"] or 0)

        daily_invest_ops[d].append({
            "asset_type": asset_type,
            "ticker": tck,
            "op_type": op_type,
            "qty": qty
        })

        if asset_type in ["stock", "etf"]:
            tickers_stock_etf.add(tck)
        elif asset_type == "crypto":
            tickers_crypto.add(tck)

    # Modified price fetching section
    prices_yf = {}
    if tickers_stock_etf:
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
        
        for tck in tickers_stock_etf:
            df = yf.Ticker(tck).history(start=start_str, end=end_str)
            daily_dict = {}
            for idx, row in df.iterrows():
                day_only = idx.date()
                usd_price = float(row["Close"])
                
                # Find appropriate EUR rate
                eur_rate = 0.85  # Fallback rate
                for i in range(7):  # Check up to 7 days back
                    check_date = day_only - timedelta(days=i)
                    if check_date in eur_rates:
                        eur_rate = eur_rates[check_date]
                        break
                
                daily_dict[day_only] = usd_price * eur_rate
            prices_yf[tck] = daily_dict

    # Modified crypto price fetching (direct EUR)
    cg = CoinGeckoAPI()
    prices_cg = {}
    for tck in tickers_crypto:
        search = cg.search(query=tck)
        if not search.get("coins"):
            continue
        coin_id = search["coins"][0]["id"]
        
        start_ts = int(start_date.strftime("%s"))
        end_ts = int((today + timedelta(days=1)).strftime("%s"))
        
        market_data = cg.get_coin_market_chart_range(
            id=coin_id,
            vs_currency="eur",
            from_timestamp=start_ts,
            to_timestamp=end_ts
        )
        
        daily_dict = {}
        for ts_price in market_data.get("prices", []):
            ts = ts_price[0] / 1000.0
            p = float(ts_price[1])
            dt = date.fromtimestamp(ts)
            daily_dict[dt] = p
        prices_cg[tck] = daily_dict

    # Original calculation logic remains unchanged
    current_balance = 0.0
    positions = defaultdict(float)
    results = []
    day_iter = start_date

    while day_iter <= today:
        if day_iter < earliest_date:
            networth = 0.0
            invests_val = 0.0
        else:
            if day_iter == earliest_date:
                current_balance += float(initial_balance)

            inc = daily_income.get(day_iter, 0.0)
            exp = daily_expense.get(day_iter, 0.0)
            current_balance += inc
            current_balance -= exp

            if day_iter in daily_invest_ops:
                for op in daily_invest_ops[day_iter]:
                    tck = op["ticker"]
                    qty = op["qty"]
                    if op["op_type"] == "buy":
                        positions[tck] += qty
                    elif op["op_type"] == "sell":
                        positions[tck] -= qty
                        if positions[tck] < 0:
                            positions[tck] = 0

            invests_val = 0.0
            for tck, qty in positions.items():
                if qty <= 0:
                    continue
                price = 0.0
                if tck in tickers_stock_etf:
                    dtemp = day_iter
                    for _ in range(7):
                        if dtemp in prices_yf.get(tck, {}):
                            price = prices_yf[tck][dtemp]
                            break
                        dtemp = dtemp - timedelta(days=1)
                elif tck in tickers_crypto:
                    dtemp = day_iter
                    for _ in range(7):
                        if dtemp in prices_cg.get(tck, {}):
                            price = prices_cg[tck][dtemp]
                            break
                        dtemp = dtemp - timedelta(days=1)
                invests_val += qty * price

            networth = current_balance + invests_val

        results.append({
            "date": day_iter.isoformat(),
            "networth": round(networth, 2),
            "investments": round(invests_val, 2),
        })
        day_iter += timedelta(days=1)

    return results


@app.get("/finance-composition")
async def finance_composition(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Returns portfolio composition in Euros
    """
    # Get current USD to EUR exchange rate
    def get_usd_to_eur():
        try:
            eur_usd = yf.Ticker("EURUSD=X").history(period="1d")
            if not eur_usd.empty:
                rate = 1 / eur_usd["Close"].iloc[-1]
                return round(rate, 4)
            return 0.85  # Fallback rate
        except Exception:
            return 0.85

    usd_to_eur = get_usd_to_eur()

    # 1. Get initial balance (assuming stored in EUR)
    initial_balance = float(await db.fetchval(
        "SELECT COALESCE((SELECT initial_balance FROM accounts WHERE user_id = $1 LIMIT 1), 0)",
        user_id
    ))

    # 2. Calculate available money (EUR)
    total_income = float(await db.fetchval(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income'",
        user_id
    ))
    
    total_expenses = float(await db.fetchval(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'expense'",
        user_id
    ))
    
    available_money = initial_balance + total_income - total_expenses

    # 3. Get investments and calculate positions
    investments = await db.fetch(
        """SELECT asset_type, ticker, type_of_operation, quantity 
           FROM investments WHERE user_id = $1""",
        user_id
    )

    positions = defaultdict(float)
    for r in investments:
        asset_type = r["asset_type"].lower()
        ticker = r["ticker"].upper()
        op_type = r["type_of_operation"].lower()
        qty = float(r["quantity"])
        
        key = (asset_type, ticker)
        positions[key] += qty if op_type == "buy" else -qty

    # Cleanup positions
    positions = {k: v for k, v in positions.items() if v > 0}

    # 4. Calculate real-time values in EUR
    stocks_total = 0.0
    etf_total = 0.0
    crypto_total = 0.0
    cg = CoinGeckoAPI()

    # Process Stocks/ETFs (USD to EUR conversion)
    for (asset_type, ticker), qty in positions.items():
        if asset_type in ["stock", "etf"]:
            try:
                ticker_obj = yf.Ticker(ticker)
                hist = ticker_obj.history(period="1d")
                if not hist.empty:
                    price_usd = hist["Close"].iloc[-1]
                    price_eur = price_usd * usd_to_eur
                    value = qty * price_eur
                    
                    if asset_type == "stock":
                        stocks_total += value
                    else:
                        etf_total += value
            except Exception:
                pass

    # Process Crypto (direct EUR prices)
    crypto_assets = {ticker: qty for (asset_type, ticker), qty in positions.items() 
                    if asset_type == "crypto"}
    
    if crypto_assets:
        crypto_ids = {}
        for ticker in crypto_assets:
            try:
                coin_list = cg.get_coins_list()
                coin = next((c for c in coin_list if c["symbol"].upper() == ticker), None)
                if coin:
                    crypto_ids[ticker] = coin["id"]
            except:
                continue

        if crypto_ids:
            try:
                prices = cg.get_price(
                    ids=list(crypto_ids.values()),
                    vs_currencies="eur"
                )
                for ticker, coin_id in crypto_ids.items():
                    if coin_id in prices and "eur" in prices[coin_id]:
                        crypto_total += crypto_assets[ticker] * prices[coin_id]["eur"]
            except:
                pass

    # 5. Calculate totals
    total_net_worth = available_money + stocks_total + etf_total + crypto_total
    
    composition = [
        {"category": "Available Money", "value": round(available_money, 2)},
        {"category": "Stocks", "value": round(stocks_total, 2)},
        {"category": "ETF", "value": round(etf_total, 2)},
        {"category": "Crypto", "value": round(crypto_total, 2)},
    ]

    return {
        "total_net_worth": round(total_net_worth, 2),
        "composition": composition
    }
    

# Endpoint to get expenses by category
@app.get("/expenses-by-category")
async def get_expenses_by_category(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Returns expenses grouped by category for the last 30 days
    Response format: [{ category: string, amount: float }, ...]
    """
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    query = """
        SELECT c.name as category, SUM(t.amount) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND t.transaction_date BETWEEN $2 AND $3
        GROUP BY c.name
        ORDER BY total DESC
    """

    try:
        results = await db.fetch(query, user_id, start_date, end_date)
        return [{"category": r["category"], "amount": float(r["total"])} for r in results]
    
    except asyncpg.PostgresError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving expenses")