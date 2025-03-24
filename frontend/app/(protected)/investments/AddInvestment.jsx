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

// Environment variable for the backend URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function AddInvestment({
  open,
  onOpenChange,
  existingInvestment,
  onInvestmentSaved,
}) {
  const router = useRouter();

  // States for the investment fields:
  const [typeOfOperation, setTypeOfOperation] = useState("buy");
  const [assetType, setAssetType] = useState("stock");
  const [ticker, setTicker] = useState("");
  const [fullName, setFullName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalValue, setTotalValue] = useState("");
  // We'll store the JS Date in state, and format it on submit:
  const [dateOfOperation, setDateOfOperation] = useState(new Date());
  const [exchange, setExchange] = useState("");

  const [error, setError] = useState(null);

  useEffect(() => {
    // If we have an existing investment, populate the fields:
    if (existingInvestment) {
      setTypeOfOperation(existingInvestment.type_of_operation || "buy");
      setAssetType(existingInvestment.asset_type || "stock");
      setTicker(existingInvestment.ticker || "");
      setFullName(existingInvestment.full_name || "");
      setQuantity(String(existingInvestment.quantity || ""));
      setTotalValue(String(existingInvestment.total_value || ""));
      setExchange(existingInvestment.exchange || "");
      try {
        setDateOfOperation(
          existingInvestment.date_of_operation
            ? new Date(existingInvestment.date_of_operation)
            : new Date()
        );
      } catch {
        setDateOfOperation(new Date());
      }
    } else {
      // Reset for a new investment
      setTypeOfOperation("buy");
      setAssetType("stock");
      setTicker("");
      setFullName("");
      setQuantity("");
      setTotalValue("");
      setDateOfOperation(new Date());
      setExchange("");
    }
  }, [existingInvestment]);

  useEffect(() => {
    // Ensure user is logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return router.push("/login");
    }

    // Build the payload
    const payload = {
      type_of_operation: typeOfOperation,
      asset_type: assetType,
      ticker,
      full_name: fullName,
      quantity: parseFloat(quantity),
      total_value: parseFloat(totalValue),
      date_of_operation: format(dateOfOperation, "yyyy-MM-dd"),
      exchange,
    };

    try {
      let url = `${BACKEND_URL}/investments`;
      let method = "POST";

      // If updating an existing investment:
      if (existingInvestment && existingInvestment.id) {
        url = `${BACKEND_URL}/investments/${existingInvestment.id}`;
        method = "PUT";
      }

      const token = session.access_token;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error saving investment");
      }

      if (existingInvestment && existingInvestment.id) {
        alert("✅ Investment updated successfully!");
      } else {
        alert("✅ Investment added successfully!");
      }

      // Close the dialog
      if (onOpenChange) {
        onOpenChange(false);
      }

      // If parent wants to do something after saving:
      if (onInvestmentSaved) {
        onInvestmentSaved();
      }

      // Navigate to /investments (or wherever you prefer)
      router.push("/investments");
    } catch (err) {
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            {existingInvestment ? "Edit Investment" : "Add Investment"}
          </DialogTitle>
          <DialogDescription className="mt-4 text-neutral-300">
            {existingInvestment
              ? "Update the investment details below"
              : "Fill in the form below to add a new investment"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="typeOfOperation" className="text-right">
              Operation
            </Label>
            <Select value={typeOfOperation} onValueChange={setTypeOfOperation}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950">
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Asset Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assetType" className="text-right">
              Asset Type
            </Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950">
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticker */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ticker" className="text-right">
              Ticker
            </Label>
            <Input
              id="ticker"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="col-span-3"
              placeholder="e.g. AAPL, BTC, VUSA.L"
            />
          </div>

          {/* Full Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Apple, Bitcoin"
            />
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="e.g. 10"
            />
          </div>

          {/* Total Value */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalValue" className="text-right">
              Total Value
            </Label>
            <Input
              id="totalValue"
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              className="col-span-3"
              placeholder="e.g. 1500"
            />
          </div>

          {/* Date of Operation */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateOfOperation" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <DropdownMenu className="w-full">
                <DropdownMenuTrigger className="w-full" asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfOperation && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfOperation
                      ? format(dateOfOperation, "PPP")
                      : "Pick a date"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-auto p-0 bg-neutral-950"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dateOfOperation}
                    onSelect={setDateOfOperation}
                    initialFocus
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Exchange */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exchange" className="text-right">
              Exchange
            </Label>
            <Input
              id="exchange"
              type="text"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="col-span-3"
              placeholder="e.g. NYSE, NASDAQ"
            />
          </div>

          <DialogFooter className="mt-8">
            <Button
              type="submit"
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white"
            >
              {existingInvestment ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
