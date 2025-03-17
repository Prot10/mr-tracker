# Mr Tracker - Gestionale Finanziario

## 📌 Panoramica

**Mr Tracker** è un'applicazione full-stack per la gestione finanziaria, progettata per monitorare entrate, spese e investimenti con automazioni avanzate, gestione intelligente delle categorie, prezzi aggiornati in tempo reale e una dashboard interattiva.

## 🚀 Tecnologie Utilizzate

- **Frontend:** Next.js (React) - Deploy su Vercel
- **Backend:** FastAPI (Python) - Deploy su Render/Railway
- **Database:** PostgreSQL su Supabase

## 🏗 Struttura del Progetto

```
financial-app/
│── backend/  # FastAPI Backend
│── frontend/ # Next.js Frontend
│── README.md
```

## 🔥 Funzionalità Principali

### 🔹 **Autenticazione e Onboarding**

- Login e Registrazione con Supabase Auth
- Setup iniziale per selezione delle categorie e saldo iniziale

### 🔹 **Dashboard Interattiva**

- Net Worth aggiornato (saldo disponibile + investimenti)
- Grafici interattivi per la distribuzione del patrimonio
- Statistiche dettagliate sulle entrate e spese

### 🔹 **Gestione Entrate e Spese**

- Tabella interattiva con filtri e sorting
- Aggiunta di transazioni (singole o ricorrenti)
- Gestione avanzata delle categorie di spesa

### 🔹 **Gestione Investimenti**

- Tabella investimenti con storico e prezzi in tempo reale
- Supporto per investimenti singoli e programmati (DCA, PAC)
- Integrazione con API per l’aggiornamento dei prezzi

### 🔹 **Insights e Analisi Finanziaria**

- Grafici dettagliati su spese, entrate e investimenti
- Nuove metriche per analisi del cashflow
- Simulazione di scenari futuri con proiezioni finanziarie

## 📥 Installazione

### **1️⃣ Clona il Repository**

```bash
git clone https://github.com/TUO-USERNAME/NOME-REPO.git
cd financial-app
```

### **2️⃣ Configura il Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Su Windows usa 'venv\\Scripts\\activate'
pip install -r requirements.txt
uvicorn main:app --reload
```

### **3️⃣ Configura il Frontend**

```bash
cd frontend
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

## 🔄 Roadmap

📌 **Fase 1:** Setup e autenticazione
📌 **Fase 2:** Dashboard e gestione portafoglio
📌 **Fase 3:** Implementazione investimenti
📌 **Fase 4:** Automazione operazioni finanziarie
📌 **Fase 5:** Insights e proiezioni avanzate
📌 **Fase 6:** Ottimizzazione Backend con caching e WebSockets
📌 **Fase 7:** Testing e ottimizzazione UX/UI
📌 **Fase 8:** Deploy finale su Vercel e Render

## 👨‍💻 Contribuire

1. **Forka il repository**
2. **Crea un nuovo branch**

```bash
git checkout -b feature-nuova-funzionalita
```

3. **Commita le modifiche**

```bash
git commit -m "Aggiunta nuova funzionalità"
```

4. **Push del branch**

```bash
git push origin feature-nuova-funzionalita
```

5. **Apri una Pull Request**

## 📜 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori dettagli.

---

**🚀 Mr Tracker - Il tuo compagno per la gestione finanziaria!**
