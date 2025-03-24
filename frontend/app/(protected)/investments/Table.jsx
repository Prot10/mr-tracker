"use client";

import { format } from "date-fns";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useIsMobile } from "../../hooks/use-mobile";
import { supabase } from "../../lib/supabaseClient";
import { AddInvestment } from "./AddInvestment";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function InvestmentsTable({ data }) {
  const [investments, setInvestments] = useState(data || []);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [operationFilter, setOperationFilter] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("");
  // New filter states:
  const [tickerFilterMulti, setTickerFilterMulti] = useState([]);
  const [totalValueFilter, setTotalValueFilter] = useState({
    min: "",
    max: "",
  });
  const [quantityFilter, setQuantityFilter] = useState({ min: "", max: "" });
  const [fullNameFilter, setFullNameFilter] = useState("");
  const [exchangeFilterMulti, setExchangeFilterMulti] = useState([]);

  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({
    from: dateFilter.start ? new Date(dateFilter.start) : undefined,
    to: dateFilter.end ? new Date(dateFilter.end) : undefined,
  });
  const [activeField, setActiveField] = useState(null);
  const isMobile = useIsMobile();

  // Compute unique tickers and exchanges for dropdown filters
  const uniqueTickers = useMemo(() => {
    const tickers = investments.map((item) => item.ticker).filter(Boolean);
    return Array.from(new Set(tickers));
  }, [investments]);

  const uniqueExchanges = useMemo(() => {
    const exchanges = investments.map((item) => item.exchange).filter(Boolean);
    return Array.from(new Set(exchanges));
  }, [investments]);

  const refreshData = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return;
    const token = sessionData.session.access_token;
    try {
      const response = await fetch(`${BACKEND_URL}/investments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("Failed to fetch investments");
        return;
      }
      const json = await response.json();
      if (json.investments) {
        setInvestments(json.investments);
      }
    } catch (error) {
      console.error("Error fetching investments", error);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = investments;
    if (globalFilter) {
      filtered = filtered.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(globalFilter.toLowerCase())
      );
    }
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date_of_operation);
        let valid = true;
        if (dateFilter.start) {
          valid = valid && itemDate >= new Date(dateFilter.start);
        }
        if (dateFilter.end) {
          valid = valid && itemDate <= new Date(dateFilter.end);
        }
        return valid;
      });
    }
    if (operationFilter) {
      filtered = filtered.filter(
        (item) => item.type_of_operation === operationFilter
      );
    }
    if (assetTypeFilter) {
      filtered = filtered.filter((item) => item.asset_type === assetTypeFilter);
    }
    // Apply new filters:
    if (tickerFilterMulti.length > 0) {
      filtered = filtered.filter((item) =>
        tickerFilterMulti.includes(item.ticker)
      );
    }
    if (totalValueFilter.min || totalValueFilter.max) {
      filtered = filtered.filter((item) => {
        let valid = true;
        if (totalValueFilter.min) {
          valid =
            valid && Number(item.total_value) >= Number(totalValueFilter.min);
        }
        if (totalValueFilter.max) {
          valid =
            valid && Number(item.total_value) <= Number(totalValueFilter.max);
        }
        return valid;
      });
    }
    if (quantityFilter.min || quantityFilter.max) {
      filtered = filtered.filter((item) => {
        let valid = true;
        if (quantityFilter.min) {
          valid = valid && Number(item.quantity) >= Number(quantityFilter.min);
        }
        if (quantityFilter.max) {
          valid = valid && Number(item.quantity) <= Number(quantityFilter.max);
        }
        return valid;
      });
    }
    if (fullNameFilter) {
      filtered = filtered.filter((item) =>
        item.full_name.toLowerCase().includes(fullNameFilter.toLowerCase())
      );
    }
    if (exchangeFilterMulti.length > 0) {
      filtered = filtered.filter((item) =>
        exchangeFilterMulti.includes(item.exchange)
      );
    }
    return filtered;
  }, [
    investments,
    globalFilter,
    dateFilter,
    operationFilter,
    assetTypeFilter,
    tickerFilterMulti,
    totalValueFilter,
    quantityFilter,
    fullNameFilter,
    exchangeFilterMulti,
  ]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== "") {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "date_of_operation") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: columnKey, direction });
  };

  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async (id) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return;
    const token = sessionData.session.access_token;
    try {
      const response = await fetch(`${BACKEND_URL}/investments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("Failed to delete investment");
        return;
      }
      console.log("Investment deleted successfully");
      refreshData();
    } catch (error) {
      console.error("Error deleting investment", error);
    }
  };

  const handleUpdate = (row) => {
    setSelectedInvestment(row);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 mx-8">
      <div className="flex gap-8 justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedInvestment(null);
            setDialogOpen(true);
          }}
          className="bg-indigo-700 hover:bg-indigo-600"
        >
          Add Investment
        </Button>
        <AddInvestment
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existingInvestment={selectedInvestment}
          onInvestmentSaved={async () => {
            await refreshData();
            console.log("Investment updated or added.");
          }}
        />
      </div>

      <div className="rounded-md border border-neutral-400 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-800">
            <TableRow>
              {/* Operation */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("type_of_operation")}
                  >
                    Operation
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <Select
                          value={operationFilter}
                          onValueChange={setOperationFilter}
                        >
                          <SelectTrigger className="px-2 py-1 rounded-md bg-neutral-800 text-white">
                            <SelectValue placeholder="Select operation" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-950">
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setOperationFilter("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Asset Type */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("asset_type")}
                  >
                    Asset Type
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <Select
                          value={assetTypeFilter}
                          onValueChange={setAssetTypeFilter}
                        >
                          <SelectTrigger className="px-2 py-1 rounded-md bg-neutral-800 text-white">
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-950">
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="ETF">ETF</SelectItem>
                            <SelectItem value="crypto">Crypto</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setAssetTypeFilter("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Ticker */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("ticker")}
                  >
                    Ticker
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        {uniqueTickers.map((ticker) => (
                          <div key={ticker} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={tickerFilterMulti.includes(ticker)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTickerFilterMulti((prev) => [
                                    ...prev,
                                    ticker,
                                  ]);
                                } else {
                                  setTickerFilterMulti((prev) =>
                                    prev.filter((x) => x !== ticker)
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-white">{ticker}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setTickerFilterMulti([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Total Value */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("total_value")}
                  >
                    Total Value (€)
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={totalValueFilter.min}
                          onChange={(e) =>
                            setTotalValueFilter({
                              ...totalValueFilter,
                              min: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={totalValueFilter.max}
                          onChange={(e) =>
                            setTotalValueFilter({
                              ...totalValueFilter,
                              max: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setTotalValueFilter({ min: "", max: "" })
                          }
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Date */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("date_of_operation")}
                  >
                    Date
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveField("from")}
                          >
                            {dateRange.from
                              ? format(dateRange.from, "LLL dd, y")
                              : "From"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveField("to")}
                          >
                            {dateRange.to
                              ? format(dateRange.to, "LLL dd, y")
                              : "To"}
                          </Button>
                        </div>
                        {activeField && (
                          <div className="mt-2">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={
                                dateRange[activeField] || new Date()
                              }
                              selected={dateRange}
                              onSelect={(range) => {
                                if (range) {
                                  if (range.from && range.to) {
                                    setDateRange(range);
                                    setDateFilter({
                                      start: format(range.from, "yyyy-MM-dd"),
                                      end: format(range.to, "yyyy-MM-dd"),
                                    });
                                  } else if (range.from && !range.to) {
                                    const newRange = {
                                      ...dateRange,
                                      [activeField]: range.from,
                                    };
                                    setDateRange(newRange);
                                    setDateFilter({
                                      start:
                                        activeField === "from"
                                          ? format(range.from, "yyyy-MM-dd")
                                          : dateFilter.start,
                                      end:
                                        activeField === "to"
                                          ? format(range.from, "yyyy-MM-dd")
                                          : dateFilter.end,
                                    });
                                  }
                                }
                              }}
                              numberOfMonths={2}
                            />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setDateRange({ from: undefined, to: undefined });
                            setDateFilter({ start: "", end: "" });
                            setActiveField(null);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Quantity */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("quantity")}
                  >
                    Quantity
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={quantityFilter.min}
                          onChange={(e) =>
                            setQuantityFilter({
                              ...quantityFilter,
                              min: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={quantityFilter.max}
                          onChange={(e) =>
                            setQuantityFilter({
                              ...quantityFilter,
                              max: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setQuantityFilter({ min: "", max: "" })
                          }
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Full Name */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("full_name")}
                  >
                    Full Name
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Search full name"
                          value={fullNameFilter}
                          onChange={(e) => setFullNameFilter(e.target.value)}
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setFullNameFilter("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Exchange */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("exchange")}
                  >
                    Exchange
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        {uniqueExchanges.map((exch) => (
                          <div key={exch} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={exchangeFilterMulti.includes(exch)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExchangeFilterMulti((prev) => [
                                    ...prev,
                                    exch,
                                  ]);
                                } else {
                                  setExchangeFilterMulti((prev) =>
                                    prev.filter((x) => x !== exch)
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-white">{exch}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setExchangeFilterMulti([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              <TableHead className="py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-700">
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.type_of_operation
                    ? row.type_of_operation.charAt(0).toUpperCase() +
                      row.type_of_operation.slice(1)
                    : "N/A"}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.asset_type
                    ? row.asset_type.charAt(0).toUpperCase() +
                      row.asset_type.slice(1)
                    : "N/A"}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.ticker}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.total_value}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {new Date(row.date_of_operation).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.quantity}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.full_name}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  {row.exchange ? row.exchange : "—"}
                </TableCell>
                <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950">
                      <DropdownMenuItem
                        className="text-blue-500"
                        onClick={() => handleUpdate(row)}
                      >
                        Update
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between py-2">
        <div className="w-20">
          <Select
            className="bg-neutral-950"
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              id="rowsPerPage"
              className="px-4 py-2 h-8 rounded-md text-white hover:bg-neutral-800 border-neutral-400"
            >
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-950">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 mr-4">
            {currentPage} / {totalPages}
          </span>
          <Button
            className="border-neutral-400 md:min-w-24 hover:bg-neutral-800 h-8"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {isMobile ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
              </>
            )}
          </Button>
          <Button
            className="border-neutral-400 md:min-w-24 hover:bg-neutral-800 h-8"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            {isMobile ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
