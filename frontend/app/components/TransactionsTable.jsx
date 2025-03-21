"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function TransactionsTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  // Fetch categories from the backend
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
    return categoryFilter
      ? data.filter((t) => {
          const cat = categories.find((c) => c.id === t.category_id);
          return cat && cat.name === categoryFilter;
        })
      : data;
  }, [data, categoryFilter, categories]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "transaction_date",
        header: "Date",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "amount",
        header: "Amount",
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        accessorKey: "category_id",
        header: "Category",
        cell: (info) => {
          const catId = info.getValue();
          const category = categories.find((c) => c.id === catId);
          if (!category) return "—";
          return `${category.name}`;
        },
      },
    ],
    [categories]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
          className="px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none w-full"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-md bg-gray-700 text-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-semibold text-white"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          onClick: header.column.getToggleSortingHandler(),
                          className: "cursor-pointer select-none",
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-700">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-200"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
