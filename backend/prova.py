import os

import psycopg2
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env
load_dotenv()

# Ottieni i valori dal file .env
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

try:
    # Connessione con psycopg2 (sincrono)
    connection = psycopg2.connect(DATABASE_URL)
    print("✅ Connessione a Supabase riuscita!")

    # Esegui una query di test
    cursor = connection.cursor()
    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print("🕒 Ora attuale:", result)

    # Chiudi connessione
    cursor.close()
    connection.close()
    print("🔌 Connessione chiusa.")

except Exception as e:
    print(f"❌ Errore di connessione: {e}")