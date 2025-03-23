"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar } from "../../components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { supabase } from "../../lib/supabaseClient";
import { cn } from "../../lib/utils";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function AddTransaction() {
  const router = useRouter();
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryIcon, setCustomCategoryIcon] = useState("");
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

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
      // 1️⃣ If creating a new category, add it first
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
          throw new Error("Error creating the category.");
        }
      }

      // 2️⃣ Ensure a category is selected
      if (!categoryIdToUse) {
        throw new Error("Select an existing category or create a new one.");
      }

      // 3️⃣ Post the transaction
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
          transaction_date: format(date, "yyyy-MM-dd"),
        }),
      });

      if (!transactionResponse.ok) {
        throw new Error("Error adding the transaction.");
      }

      alert("✅ Transaction added successfully!");
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription className="mt-4">
            Fill in the form below to add a new transaction
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Importo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="Enter the amount"
            />
          </div>
          {/* Descrizione */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Enter a description"
            />
          </div>
          {/* Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>

            <div className="col-span-3">
              <DropdownMenu className="w-full">
                <DropdownMenuTrigger className="w-full" asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal ",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-auto p-0 bg-neutral-950"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Categoria */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Nuova Categoria */}
          <div className="mt-8">
            <p className="text-gray-300 mb-4 text-sm">
              Or create a new category (optional)
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customCategoryName" className="text-right">
                Name
              </Label>
              <Input
                id="customCategoryName"
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="Category name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label htmlFor="customCategoryIcon" className="text-right">
                Icon
              </Label>
              <Input
                id="customCategoryIcon"
                type="text"
                value={customCategoryIcon}
                onChange={(e) => setCustomCategoryIcon(e.target.value)}
                className="col-span-3"
                placeholder="Select an icon"
              />
            </div>
          </div>
          <DialogFooter className="mt-8">
            <div className="flex justify-center w-full">
              <Button type="submit" className="w-2/5 bg-white text-black">
                Add
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
