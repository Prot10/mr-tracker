"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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

import {
  Activity,
  Airplay,
  Anchor,
  Aperture,
  Book,
  Briefcase,
  Camera,
  Car,
  ChefHat,
  Coffee,
  Euro,
  Film,
  Heart,
  Home,
  Music,
  Plane,
  ShoppingCart,
  Wrench,
} from "lucide-react";

const availableIcons = [
  "IconRestaurant",
  "IconCar",
  "IconShoppingCart",
  "IconHome",
  "IconHealth",
  "IconCoffee",
  "IconBriefcase",
  "IconDollarSign",
  "IconActivity",
  "IconAirplay",
  "IconAnchor",
  "IconAperture",
  "IconBook",
  "IconCamera",
  "IconMusic",
  "IconFilm",
  "IconWrench",
  "IconPlane",
];

const iconMapping = {
  IconRestaurant: ChefHat,
  IconCar: Car,
  IconShoppingCart: ShoppingCart,
  IconHome: Home,
  IconHealth: Heart,
  IconCoffee: Coffee,
  IconBriefcase: Briefcase,
  IconDollarSign: Euro,
  IconActivity: Activity,
  IconAirplay: Airplay,
  IconAnchor: Anchor,
  IconAperture: Aperture,
  IconBook: Book,
  IconCamera: Camera,
  IconMusic: Music,
  IconFilm: Film,
  IconWrench: Wrench,
  IconPlane: Plane,
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function AddTransaction({
  open,
  onOpenChange,
  existingTransaction,
  onTransactionSaved,
}) {
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

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(String(existingTransaction.amount));
      setDescription(existingTransaction.description || "");
      setDate(new Date(existingTransaction.transaction_date));
      setSelectedCategoryId(
        existingTransaction.category_id
          ? String(existingTransaction.category_id)
          : ""
      );
      // Clear any custom category fields
      setCustomCategoryName("");
      setCustomCategoryIcon("");
    } else {
      // Reset everything for a new transaction
      setType("income");
      setAmount("");
      setDescription("");
      setDate(new Date());
      setSelectedCategoryId("");
      setCustomCategoryName("");
      setCustomCategoryIcon("");
    }
  }, [existingTransaction]);

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

    if (!data?.session) {
      router.push("/login");
      return;
    }

    // Client-side validation
    if (!amount || isNaN(amount)) {
      toast.error("Missing Amount", {
        description: "Please enter a valid transaction amount",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Invalid Amount", {
        description: "Amount must be greater than 0",
      });
      return;
    }

    if (!date) {
      toast.error("Missing Date", {
        description: "Please select a transaction date",
      });
      return;
    }

    // Category validation
    if (!selectedCategoryId) {
      if (!customCategoryName || !customCategoryIcon) {
        toast.error("Category Required", {
          description: "Please select an existing category or create a new one",
        });
        return;
      }

      if (!customCategoryName) {
        toast.error("New Category Name Required", {
          description: "Please enter a name for your new category",
        });
        return;
      }

      if (!customCategoryIcon) {
        toast.error("Category Icon Required", {
          description: "Please select an icon for your new category",
        });
        return;
      }
    }

    const token = data.session.access_token;
    let categoryIdToUse = selectedCategoryId;

    try {
      // Create new category if needed
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

        if (!categoryResponse.ok) {
          throw new Error("Failed to create new category. Please try again.");
        }

        const newCategory = await categoryResponse.json();
        categoryIdToUse = newCategory.id;
        toast("New Category Created", {
          description: `${customCategoryName} with ${customCategoryIcon} icon`,
        });
      }

      // Validate final category selection
      if (!categoryIdToUse) {
        throw new Error("Category selection validation failed");
      }

      const transactionData = {
        type,
        amount: parseFloat(amount),
        description,
        category_id: categoryIdToUse,
        transaction_date: format(date, "yyyy-MM-dd"),
      };

      // Update or Create transaction
      if (existingTransaction?.id) {
        const updateResponse = await fetch(
          `${BACKEND_URL}/transactions/${existingTransaction.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(transactionData),
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            "We couldn't update the transaction. Please check the details."
          );
        }

        toast.success("Transaction Updated", {
          description: `Updated ${type} of €${amount} for ${description}`,
        });
      } else {
        const transactionResponse = await fetch(`${BACKEND_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionData),
        });

        if (!transactionResponse.ok) {
          throw new Error("Failed to create transaction. Please try again.");
        }

        toast.success("Transaction Created", {
          description: `New ${type} of €${amount} added on ${format(
            date,
            "MMM dd, yyyy"
          )}`,
        });
      }

      // Close dialog and refresh
      onOpenChange(false);
      onTransactionSaved?.();
      router.push("/wallet");
    } catch (err) {
      toast.error("Transaction Failed", {
        description:
          err.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Add Transaction
          </DialogTitle>
          <DialogDescription className="mt-4 text-neutral-300">
            Fill in the form below to add a new transaction
          </DialogDescription>
        </DialogHeader>
        {/* {error && <p className="text-red-500 mb-4 text-center">{error}</p>} */}
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
                {[
                  ...new Map(
                    categories
                      .filter(
                        (cat) =>
                          cat.type === type &&
                          cat.name.toLowerCase() !== "investments"
                      )
                      .map((cat) => [cat.name.toLowerCase(), cat])
                  ).values(),
                ].map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <div className="flex items-center space-x-2">
                      {React.createElement(
                        iconMapping[cat.icon] || (() => null),
                        { className: "w-4 h-4" }
                      )}
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
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

          {/* Nuova Categoria */}
          <div className="mt-8 grid grid-cols-1 items-center gap-4">
            <p className="text-neutral-300 mb-2 text-sm">
              Or create a new category (optional)
            </p>
            <div className="flex space-x-4">
              <Input
                id="customCategoryName"
                type="text"
                value={customCategoryName}
                onChange={(e) =>
                  setCustomCategoryName(
                    e.target.value
                      ? e.target.value.charAt(0).toUpperCase() +
                          e.target.value.slice(1).toLowerCase()
                      : ""
                  )
                }
                placeholder="Category name"
                className="w-full px-4 h-10 rounded-md bg-neutral-950 text-white"
              />
              <Select
                value={customCategoryIcon}
                onValueChange={setCustomCategoryIcon}
                defaultValue=""
                className="w-full"
              >
                <SelectTrigger className="w-20 h-10">
                  <SelectValue placeholder="Icon" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950 w-48 p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {availableIcons.map((iconKey) => (
                      <SelectItem
                        key={iconKey}
                        value={iconKey}
                        className="flex items-center justify-center"
                      >
                        {React.createElement(
                          iconMapping[iconKey] || (() => null),
                          { className: "w-4 h-4" }
                        )}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button
              type="submit"
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white"
            >
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
