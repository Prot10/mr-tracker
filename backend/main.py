from typing import List, Optional

import asyncpg
from auth import verify_token
from database import get_db
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Abilitare CORS per permettere richieste dal frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mr-tracker.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend attivo!"}

# Modelli per validare i dati in ingresso

class Transaction(BaseModel):
    type: str  # "income" o "expense"
    amount: float
    description: Optional[str] = None

class Investment(BaseModel):
    asset_name: str
    invested_amount: float

# Nuovo modello per la registrazione degli utenti
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

# Endpoint GET

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
    query = "SELECT * FROM investments WHERE user_id = $1 ORDER BY date_invested DESC"
    investments = await db.fetch(query, user_id)
    return {"investments": [dict(t) for t in investments]}

@app.get("/networth")
async def get_networth(
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    # Calcola il saldo delle transazioni: somma delle entrate - somma delle spese
    income_query = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income'"
    expense_query = "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'expense'"
    investment_query = "SELECT COALESCE(SUM(invested_amount), 0) FROM investments WHERE user_id = $1"

    income = await db.fetchval(income_query, user_id)
    expense = await db.fetchval(expense_query, user_id)
    investment = await db.fetchval(investment_query, user_id)
    net_worth = (income - expense) + investment

    return {"net_worth": net_worth}

# Endpoint POST per creare transazioni
@app.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: Transaction,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = """
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id, transaction_date;
    """
    result = await db.fetchrow(query, user_id, transaction.type, transaction.amount, transaction.description)
    if result:
        return {"id": result["id"], "transaction_date": result["transaction_date"]}
    raise HTTPException(status_code=400, detail="Errore nell'inserimento della transazione")

# Endpoint POST per creare investimenti
@app.post("/investments", status_code=status.HTTP_201_CREATED)
async def create_investment(
    investment: Investment,
    user_id: str = Depends(verify_token),
    db: asyncpg.Connection = Depends(get_db)
):
    query = """
    INSERT INTO investments (user_id, asset_name, invested_amount)
    VALUES ($1, $2, $3)
    RETURNING id, date_invested;
    """
    result = await db.fetchrow(query, user_id, investment.asset_name, investment.invested_amount)
    if result:
        return {"id": result["id"], "date_invested": result["date_invested"]}
    raise HTTPException(status_code=400, detail="Errore nell'inserimento dell'investimento")

# Nuovo endpoint POST per la registrazione degli utenti
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
    raise HTTPException(status_code=400, detail="Errore nella registrazione dell'utente")

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