import logging
import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# Configura il logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"
EXPECTED_AUDIENCE = "authenticated"

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    logging.debug(f"🔹 Token ricevuto: {token}")

    try:
        # Verifica il token con l'audience corretta
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience=EXPECTED_AUDIENCE)
        logging.debug(f"✅ Payload decodificato: {payload}")

        user_id = payload.get("sub")
        if user_id is None:
            logging.warning("⚠️ Token valido ma manca 'sub'.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido: user_id mancante",
            )

        logging.info(f"✅ Utente autenticato: {user_id}")
        return user_id

    except JWTError as e:
        logging.error(f"❌ Errore JWT: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto",
        )