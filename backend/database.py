import os

import asyncpg
from dotenv import load_dotenv

# Carica le variabili dal file .env
load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")
if not DATABASE_URL:
    raise ValueError("❌ SUPABASE_DB_URL non trovata. Verifica il file .env!")

async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()