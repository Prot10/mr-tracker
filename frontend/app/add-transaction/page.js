"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AddTransaction() {
  const router = useRouter();
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryIcon, setCustomCategoryIcon] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      const token = data.session.access_token;
      const response = await fetch(`${BACKEND_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setCategories(result);
      }
    };
    fetchCategories();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/login");
      return;
    }
    const token = data.session.access_token;
    let categoryIdToUse = selectedCategoryId;

    try {
      // 1️⃣ **If user is creating a new category, add it first**
      if (customCategoryName && customCategoryIcon) {
        const categoryResponse = await fetch(`${BACKEND_URL}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: type === "income" ? "income" : "expense",
            name: customCategoryName,
            icon: customCategoryIcon,
          }),
        });

        if (categoryResponse.ok) {
          const newCategory = await categoryResponse.json();
          categoryIdToUse = newCategory.id;
        } else {
          throw new Error("Errore nella creazione della categoria.");
        }
      }

      // 2️⃣ **Ensure a category is selected**
      if (!categoryIdToUse) {
        throw new Error(
          "Seleziona una categoria esistente o crea una nuova categoria."
        );
      }

      // 3️⃣ **Post the transaction**
      const transactionResponse = await fetch(`${BACKEND_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          description,
          category_id: categoryIdToUse,
          transaction_date: date,
        }),
      });

      if (!transactionResponse.ok) {
        throw new Error("Errore durante l'aggiunta della transazione.");
      }

      alert("✅ Transazione aggiunta con successo!");
      router.push("/wallet"); // ✅ Redirect to wallet after success
    } catch (err) {
      alert(`❌ Errore: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Aggiungi Transazione
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Tipo:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
            >
              <option value="income">Entrata</option>
              <option value="expense">Spesa</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Importo:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
              placeholder="Inserisci l'importo"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Descrizione:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
              placeholder="Inserisci una descrizione"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Data:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Categoria:</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
            >
              <option value="">Seleziona una categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-gray-300 mb-1">
              Oppure crea una nuova categoria:
            </p>
            <input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Nome categoria"
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white mb-2"
            />
            <input
              type="text"
              value={customCategoryIcon}
              onChange={(e) => setCustomCategoryIcon(e.target.value)}
              placeholder="Icona (es. IconShoppingCart)"
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md"
          >
            Aggiungi
          </button>
        </form>
      </div>
    </div>
  );
}
