"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Example placeholders for the ticker validation logic.
// In a real project, you might fetch external APIs (like yfinance or coingecko) here.
async function validateTickerYFinance(ticker) {
  if (!ticker) {
    return false;
  }
  // TODO: Implement real call to Yahoo Finance or similar.
  // Returning true for demonstration.
  return true;
}

async function validateTickerCoinGecko(ticker) {
  if (!ticker) {
    return false;
  }
  // TODO: Implement real call to CoinGecko.
  // Returning true for demonstration.
  return true;
}

export default function AddInvestment() {
  const router = useRouter();

  // States for the investment fields
  const [typeOfOperation, setTypeOfOperation] = useState("acquisto");
  const [assetType, setAssetType] = useState("stock");
  const [ticker, setTicker] = useState("");
  const [fullName, setFullName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [dateOfOperation, setDateOfOperation] = useState("");
  const [exchange, setExchange] = useState("");

  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Verify user session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return router.push("/login");
    }

    // 2. Validate the ticker in the frontend (quick check)
    let isValidTicker = false;
    if (assetType.toLowerCase() === "crypto") {
      isValidTicker = await validateTickerCoinGecko(ticker);
    } else {
      isValidTicker = await validateTickerYFinance(ticker);
    }

    if (!isValidTicker) {
      return setError(
        `${ticker} not supported, check if the name is correct or try again later`
      );
    }

    // 3. Prepare the request payload
    const payload = {
      type_of_operation: typeOfOperation,
      asset_type: assetType,
      ticker,
      full_name: fullName,
      quantity: parseFloat(quantity),
      total_value: parseFloat(totalValue),
      date_of_operation: dateOfOperation,
      exchange,
    };

    // 4. Call the backend endpoint to create the investment
    try {
      const token = session.access_token;
      const response = await fetch(`${BACKEND_URL}/investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error adding investment");
      }

      alert("Investment added successfully!");
      router.push("/homepage");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Add Investment
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* type_of_operation */}
          <div>
            <label className="block text-gray-300 mb-1">
              Type of Operation:
            </label>
            <select
              value={typeOfOperation}
              onChange={(e) => setTypeOfOperation(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="acquisto">acquisto</option>
              <option value="vendita">vendita</option>
            </select>
          </div>

          {/* asset_type */}
          <div>
            <label className="block text-gray-300 mb-1">Asset Type:</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="stock">stock</option>
              <option value="ETF">ETF</option>
              <option value="crypto">crypto</option>
            </select>
          </div>

          {/* ticker */}
          <div>
            <label className="block text-gray-300 mb-1">Ticker:</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. AAPL, BTC, VUSA.L"
            />
          </div>

          {/* full_name */}
          <div>
            <label className="block text-gray-300 mb-1">Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Apple, Bitcoin"
            />
          </div>

          {/* quantity */}
          <div>
            <label className="block text-gray-300 mb-1">Quantity:</label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 10"
            />
          </div>

          {/* total_value */}
          <div>
            <label className="block text-gray-300 mb-1">Total Value:</label>
            <input
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 1500"
            />
          </div>

          {/* date_of_operation */}
          <div>
            <label className="block text-gray-300 mb-1">
              Date of Operation:
            </label>
            <input
              type="date"
              value={dateOfOperation}
              onChange={(e) => setDateOfOperation(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* exchange (optional) */}
          <div>
            <label className="block text-gray-300 mb-1">
              Exchange (optional):
            </label>
            <input
              type="text"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. NYSE, NASDAQ"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md transition"
          >
            Add Investment
          </button>
        </form>
      </div>
    </div>
  );
}
