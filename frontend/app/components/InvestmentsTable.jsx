"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

export default function InvestmentsTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  // Filter by asset type ("stock", "ETF", "crypto")
  const [assetTypeFilter, setAssetTypeFilter] = useState("");

  // Filter data by asset type if one is selected
  const filteredData = useMemo(() => {
    return assetTypeFilter
      ? data.filter((inv) => inv.asset_type === assetTypeFilter)
      : data;
  }, [data, assetTypeFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "date_of_operation",
        header: "Date",
        cell: (info) => {
          const rawValue = info.getValue();
          if (!rawValue) return "—";
          return new Date(rawValue).toLocaleDateString();
        },
      },
      {
        accessorKey: "type_of_operation",
        header: "Operation",
        cell: (info) => {
          const val = info.getValue() || "";
          // Just in case you want to show them in uppercase or something
          return val;
        },
      },
      {
        accessorKey: "asset_type",
        header: "Asset Type",
      },
      {
        accessorKey: "ticker",
        header: "Ticker",
      },
      {
        accessorKey: "full_name",
        header: "Full Name",
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
      },
      {
        accessorKey: "total_value",
        header: "Total Value",
      },
      {
        accessorKey: "exchange",
        header: "Exchange",
        cell: (info) => info.getValue() || "—",
      },
    ],
    []
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
        {/* Global search filter */}
        <input
          type="text"
          placeholder="Search investments..."
          className="px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none w-full"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        {/* Filter by asset type */}
        <select
          value={assetTypeFilter}
          onChange={(e) => setAssetTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-md bg-gray-700 text-white"
        >
          <option value="">All Asset Types</option>
          <option value="stock">stock</option>
          <option value="ETF">ETF</option>
          <option value="crypto">crypto</option>
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
