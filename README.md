# Mr Tracker - Financial Management App

## 📌 Overview

**Mr Tracker** is a full-stack financial management application designed to track income, expenses, and investments with advanced automation, intelligent category management, real-time price updates, and an interactive dashboard.

## 🚀 Technologies Used

- **Frontend:** Next.js (React) - Deployed on Vercel
- **Backend:** FastAPI (Python) - Deployed on Render/Railway
- **Database:** PostgreSQL on Supabase

## 🏗 Project Structure

```
mr-tracker/
│── backend/            # FastAPI backend
│   │── app/
│   │   │── main.py     # FastAPI application entry point
│   │   │── auth.py     # Authentication logic with Supabase Auth
│   │   │── database.py # Database connection to Supabase
│   │   │── models.py   # Pydantic models
│   │   │── routes/     # API endpoints
│   │── requirements.txt # Python dependencies
│── frontend/           # Next.js frontend
│   │── app/
│   │   │── components/ # Reusable UI components
│   │   │── pages/
│   │   │   │── login.js    # Login page
│   │   │   │── signup.js   # Signup page
│   │   │   │── dashboard.js # User dashboard
│   │── public/        # Static assets
│   │── package.json   # Frontend dependencies
│── README.md          # Project documentation
│── LICENSE            # Project license
```

## 🔥 Key Features

### 🔹 **Authentication & Onboarding**

- Login and registration with Supabase Auth
- Initial setup for selecting spending categories and initial balance

### 🔹 **Interactive Dashboard**

- Real-time Net Worth (available balance + investments)
- Interactive charts displaying financial distribution
- Detailed statistics on income and expenses

### 🔹 **Income & Expense Management**

- Interactive table with filters and sorting
- Adding transactions (single or recurring)
- Advanced category management

### 🔹 **Investment Management**

- Investment tracking with historical and real-time prices
- Support for single and recurring investments (DCA, PAC)
- API integration for price updates

### 🔹 **Financial Insights & Projections**

- Detailed financial analytics charts
- Key metrics for cashflow analysis
- Future scenario simulation with financial projections

## 📥 Installation

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/Prot10/mr-tracker.git
cd mr-tracker
```

### **2️⃣ Set Up the Backend**

```bash
cd backend
conda create --name mr-tracker python=3.12 -y
conda activate mr-tracker
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### **3️⃣ Set Up the Frontend**

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔄 Updated Roadmap

📌 **Phase 1:** Initial setup & authentication

- Implement Supabase Auth for user management
- Create a minimal homepage with login & signup

📌 **Phase 2:** Dashboard & Financial Overview

- Develop the main dashboard UI with real-time net worth calculation
- Implement interactive charts displaying user finances

📌 **Phase 3:** Income & Expense Tracking

- Add CRUD operations for transactions
- Implement filtering, sorting, and categorization

📌 **Phase 4:** Investment Tracking & Management

- Implement an investment tracker with historical data
- Automate investment portfolio updates using external APIs

📌 **Phase 5:** Automation & Recurring Transactions

- Add recurring transactions execution via CRON jobs
- Optimize database queries for performance improvements

📌 **Phase 6:** Advanced Insights & Financial Projections

- Develop dynamic financial projections and scenario simulations
- Provide detailed insights with AI-driven suggestions

📌 **Phase 7:** Backend Optimization & Scalability

- Implement WebSockets for real-time data updates
- Optimize caching to reduce API request load

📌 **Phase 8:** Final Testing & Deployment

- Conduct extensive testing for security and performance
- Deploy the full-stack application on Vercel & Render

## 👨‍💻 Contributing

1. **Fork the repository**
2. **Create a new branch**

```bash
git checkout -b feature-new-feature
```

3. **Commit your changes**

```bash
git commit -m "Added new feature"
```

4. **Push the branch**

```bash
git push origin feature-new-feature
```

5. **Open a Pull Request**

## 📜 License

This project is licensed under the MIT License. See `LICENSE` for more details.

---

**🚀 Mr Tracker - Your Personal Finance Companion!**
