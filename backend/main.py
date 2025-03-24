import logging
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

# Enable CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mr-tracker.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is up!"}


# Models to validate incoming data

class Transaction(BaseModel):
    type: str  # "income" or "expense"
    amount: float
    description: Optional[str] = None
    category_id: Optional[int] = None
    transaction_date: Optional[str] = None

class Investment(BaseModel):
    type_of_operation: str         # "buy" o "sell"
    asset_type: str                # "stock", "ETF" o "crypto"
    ticker: str                    # es. "AAPL", "BTC", "VUSA.L"
    full_name: str                 # es. "Apple", "Bitcoin"
    quantity: float
    total_value: float
    date_of_operation: str         # formato "YYYY-MM-DD"
    exchange: Optional[str] = None

# New model for user registration
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    
class CategoryData(BaseModel):
    name: str
    icon: str

class OnboardingData(BaseModel):
    initial_balance: float
    expense_categories: List[CategoryData]
    income_categories: List[CategoryData]
    

class CategoryCreate(BaseModel):
    type: str  # "income" or "expense"
    name: str
    icon: str


# Funzioni di validazione del ticker
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


# GET endpoints

@app.get("/transactions")
async def get_transactions(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = "SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC"
    transactions = await db.fetch(query, user_id)
    return {"transactions": [dict(t) for t in transactions]}

@app.get("/investments")
async def get_investments(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = "SELECT * FROM investments WHERE user_id = $1 ORDER BY date_of_operation DESC"
    investments = await db.fetch(query, user_id)
    return {"investments": [dict(t) for t in investments]}

@app.get("/networth")
async def get_networth(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
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
            # Check if type_of_operation is None
            operation = inv["type_of_operation"]
            if operation is None:
                # Optionally log a warning here if needed
                continue  # Skip records without a valid operation type
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
        for ticker, data in positions.items():
            quantity = data["net_quantity"]
            asset_type = data["asset_type"]
            if quantity <= 0:
                continue
            try:
                if asset_type.lower() in ["stock", "etf"]:
                    price = yf.Ticker(ticker).history(period="1d")["Close"][-1]
                elif asset_type.lower() == "crypto":
                    cg = CoinGeckoAPI()
                    result = cg.search(query=ticker)
                    coins = result.get("coins", [])
                    if not coins:
                        continue
                    coin_id = coins[0]["id"]
                    market_data = cg.get_price(ids=coin_id, vs_currencies="usd")
                    price = market_data[coin_id]["usd"]
                else:
                    continue
                total_value += price * quantity
            except Exception as e:
                logger.warning(f"⚠️ Errore prezzo {ticker}: {e}")
                continue
        return total_value

    pos_now = compute_positions(today + timedelta(days=1))
    pos_30 = compute_positions(start_30)
    inv_value_now = await get_investment_value(pos_now)
    inv_value_30 = await get_investment_value(pos_30)

    initial_balance = await db.fetchval(
        "SELECT COALESCE(initial_balance, 0) FROM accounts WHERE user_id = $1", user_id
    )

    networth_now = float(initial_balance) + float(income_30) - float(expense_30) + inv_value_now 
    networth_prev = float(initial_balance) + float(income_60) - float(expense_60) + inv_value_30
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
    
    # 3. Calcolo del prezzo per unità (price_per_unit)
    if investment.quantity <= 0:
        raise HTTPException(status_code=400, detail="La quantità deve essere maggiore di 0")
    price_per_unit = investment.total_value / investment.quantity

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
            price_per_unit,
            total_value,
            date_of_operation,
            exchange
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            price_per_unit,
            investment.total_value,
            op_date,
            investment.exchange,
        )
        if not new_id:
            raise HTTPException(status_code=400, detail="Impossibile aggiungere l'investimento")
        
        # 5. Se si tratta di un "buy", crea la transazione corrispondente
        if investment.type_of_operation.lower() == "buy":
            # a) Controlla se esiste la categoria "investimenti" per l'utente
            cat_query = "SELECT id FROM categories WHERE user_id = $1 AND name = 'investimenti' LIMIT 1"
            cat_id = await db.fetchval(cat_query, user_id)
            if not cat_id:
                # Se non esiste, la crea
                cat_insert = """
                INSERT INTO categories (user_id, type, name, icon)
                VALUES ($1, 'expense', 'investimenti', 'IconChart')
                RETURNING id;
                """
                cat_id = await db.fetchval(cat_insert, user_id)
            # b) Crea la transazione
            trx_query = """
            INSERT INTO transactions 
                (user_id, type, amount, description, category_id, transaction_date)
            VALUES ($1, 'expense', $2, $3, $4, $5);
            """
            description = f"buy {investment.full_name}"
            await db.execute(trx_query, user_id, investment.total_value, description, cat_id, op_date)
    
    return {"message": "Investment added successfully", "id": new_id}

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

# New POST endpoint for user registration
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
