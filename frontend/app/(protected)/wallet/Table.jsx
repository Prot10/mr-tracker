"use client";

import { ArrowUpDown, Filter, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
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
import { supabase } from "../../lib/supabaseClient";
import { AddTransaction } from "./AddTransaction";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function TransactionsTable({ data }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [typeFilter, setTypeFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState({ min: "", max: "" });
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [categoryFilterMulti, setCategoryFilterMulti] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const token = sessionData.session.access_token;
      const response = await fetch(`${BACKEND_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const cats = await response.json();
        setCategories(cats);
      }
    };
    fetchCategories();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data;
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
        const itemDate = new Date(item.transaction_date);
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
    if (typeFilter) {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }
    if (amountFilter.min || amountFilter.max) {
      filtered = filtered.filter((item) => {
        let valid = true;
        if (amountFilter.min) {
          valid = valid && Number(item.amount) >= Number(amountFilter.min);
        }
        if (amountFilter.max) {
          valid = valid && Number(item.amount) <= Number(amountFilter.max);
        }
        return valid;
      });
    }
    if (descriptionFilter) {
      filtered = filtered.filter((item) =>
        item.description.toLowerCase().includes(descriptionFilter.toLowerCase())
      );
    }
    if (categoryFilterMulti.length > 0) {
      filtered = filtered.filter((item) => {
        const cat = categories.find((c) => c.id === item.category_id);
        return cat && categoryFilterMulti.includes(cat.name);
      });
    }
    return filtered;
  }, [
    data,
    globalFilter,
    dateFilter,
    typeFilter,
    amountFilter,
    descriptionFilter,
    categoryFilterMulti,
    categories,
  ]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== "") {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "transaction_date") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === "category") {
          aValue = categories.find((c) => c.id === a.category_id)?.name || "";
          bValue = categories.find((c) => c.id === b.category_id)?.name || "";
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
  }, [filteredData, sortConfig, categories]);

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

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "asc" ? " 🔼" : " 🔽";
    }
    return null;
  };

  const handleDelete = (id) => {
    console.log("Delete transaction with id", id);
  };

  const handleUpdate = (id) => {
    console.log("Update transaction with id", id);
  };

  return (
    <div className="space-y-4 mx-8">
      <div className="flex gap-8 justify-between">
        <AddTransaction />
      </div>

      <div className="rounded-md border border-neutral-400 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-800">
            <TableRow>
              {/* Date Column */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("transaction_date")}
                  >
                    Date
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 -ml-4">
                        <Filter className="h-3 w-3 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 p-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="date"
                          value={dateFilter.start}
                          onChange={(e) =>
                            setDateFilter({
                              ...dateFilter,
                              start: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <input
                          type="date"
                          value={dateFilter.end}
                          onChange={(e) =>
                            setDateFilter({
                              ...dateFilter,
                              end: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDateFilter({ start: "", end: "" })}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Type Column */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("type")}
                  >
                    Type
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
                          value={typeFilter}
                          onValueChange={setTypeFilter}
                        >
                          <SelectTrigger className="px-2 py-1 rounded-md bg-neutral-800 text-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-950">
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setTypeFilter("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Amount Column */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("amount")}
                  >
                    Amount (€)
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
                          value={amountFilter.min}
                          onChange={(e) =>
                            setAmountFilter({
                              ...amountFilter,
                              min: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={amountFilter.max}
                          onChange={(e) =>
                            setAmountFilter({
                              ...amountFilter,
                              max: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setAmountFilter({ min: "", max: "" })}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Description Column */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("description")}
                  >
                    Description
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
                          placeholder="Search description"
                          value={descriptionFilter}
                          onChange={(e) => setDescriptionFilter(e.target.value)}
                          className="px-2 py-1 rounded-md bg-neutral-800 text-white"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDescriptionFilter("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Category Column */}
              <TableHead className="py-2 text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    onClick={() => handleSort("category")}
                  >
                    Category
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
                        {categories.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={categoryFilterMulti.includes(cat.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCategoryFilterMulti((prev) => [
                                    ...prev,
                                    cat.name,
                                  ]);
                                } else {
                                  setCategoryFilterMulti((prev) =>
                                    prev.filter((x) => x !== cat.name)
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-white">{cat.name}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setCategoryFilterMulti([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Actions Column (remains unchanged) */}
              <TableHead className="py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-700">
            {paginatedData.map((row) => {
              const category = categories.find((c) => c.id === row.category_id);
              return (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                    {new Date(row.transaction_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                    {row.type}
                  </TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                    {row.amount}
                  </TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                    {row.description}
                  </TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                    {category ? category.name : "—"}
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
                          onClick={() => handleUpdate(row.id)}
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
              );
            })}
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
              className="px-4 py-2 rounded-md text-white border-neutral-400"
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
            className="border-neutral-400 min-w-24"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            className="border-neutral-400 min-w-24"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
