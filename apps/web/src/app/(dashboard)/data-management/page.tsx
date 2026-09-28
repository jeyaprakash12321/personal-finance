"use client";


import { useState, useEffect } from "react";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface Account {
  id: string;
  name: string;
}

interface CsvRow {
  [key: string]: string;
}

interface PreviewRow {
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  isDuplicate?: boolean;
}

interface PortfolioImportRow {
  symbol: string;
  name: string;
  assetType: "stock" | "etf" | "mutual_fund" | "bond";
  quantity: number;
  averageCost: number;
  currentPrice: number;
}

export default function DataManagementPage() {
  const { notify } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [importEntity, setImportEntity] = useState<"transactions" | "portfolio">("transactions");

  // Export State
  const [exportEntity, setExportEntity] = useState("transactions");
  const [exportRange, setExportRange] = useState("all_time");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Import Wizard State
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [targetAccountId, setTargetAccountId] = useState("");
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({
    amount: "",
    type: "",
    category: "",
    description: "",
    date: "",
  });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [previewResult, setPreviewResult] = useState<{ totalRows: number; duplicateCount: number; previewRows: PreviewRow[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; insertedCount: number; skippedCount: number } | null>(null);
  const [portfolioRows, setPortfolioRows] = useState<PortfolioImportRow[]>([]);
  const [portfolioDuplicates, setPortfolioDuplicates] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccounts(data);
          if (data.length > 0) setTargetAccountId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Export Handler
  const handleExport = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({
        entity: exportEntity,
        range: exportRange,
        ...(exportRange === "custom" && startDate ? { startDate } : {}),
        ...(exportRange === "custom" && endDate ? { endDate } : {}),
      });

      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthly-${exportEntity}-${exportRange}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to export data"), "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target?.result, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<CsvRow>(sheet, { defval: "" });
        const head = rows.length > 0 ? Object.keys(rows[0]) : [];
        setHeaders(head);
        setParsedRows(rows);

        if (importEntity === "portfolio") {
          const autoMap = {
            symbol: head.find((h) => /symbol|ticker|isin|code/i.test(h)) || head[0] || "",
            name: head.find((h) => /name|company|security|description/i.test(h)) || head[1] || "",
            assetType: head.find((h) => /asset|type|instrument/i.test(h)) || "",
            quantity: head.find((h) => /quantity|qty|units|shares/i.test(h)) || head[2] || "",
            averageCost: head.find((h) => /average|avg|cost|buy/i.test(h)) || head[3] || "",
            currentPrice: head.find((h) => /current|market|price|ltp|value/i.test(h)) || head[4] || "",
          };
          setMappings(autoMap);
        } else {
          const autoMap = {
            amount: head.find((h) => /amount|sum|price|val|debit|credit/i.test(h)) || head[0] || "",
            type: head.find((h) => /type|kind|direction|debit|credit/i.test(h)) || "",
            category: head.find((h) => /category|cat|tag/i.test(h)) || "",
            description: head.find((h) => /description|desc|payee|title|note|merchant/i.test(h)) || "",
            date: head.find((h) => /date|time|timestamp/i.test(h)) || head[1] || "",
          };
          setMappings(autoMap);
        }
        setImportStep(2);
      } catch {
        notify("This file could not be read. Please choose a CSV or XLSX file.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProceedToPreview = async () => {
    if (importEntity === "portfolio") {
      const rows = parsedRows.map((row) => ({
        symbol: String(row[mappings.symbol] || "").trim().toUpperCase(),
        name: String(row[mappings.name] || row[mappings.symbol] || "Imported holding").trim(),
        assetType: (() => {
          const value = String(row[mappings.assetType] || "stock").toLowerCase().replace(/[ -]/g, "_");
          return (["stock", "etf", "mutual_fund", "bond"] as const).includes(value as PortfolioImportRow["assetType"])
            ? value as PortfolioImportRow["assetType"]
            : "stock";
        })(),
        quantity: Number(row[mappings.quantity] || 0),
        averageCost: Number(row[mappings.averageCost] || 0),
        currentPrice: Number(row[mappings.currentPrice] || 0),
      })).filter((row) => row.symbol && row.quantity > 0 && row.averageCost > 0 && row.currentPrice > 0);
      const existing = await fetch("/api/portfolio").then((res) => res.ok ? res.json() : { holdings: [] }).catch(() => ({ holdings: [] }));
      const existingSymbols = new Set((existing.holdings || []).map((holding: { symbol: string }) => holding.symbol.toUpperCase()));
      setPortfolioRows(rows);
      setPortfolioDuplicates(rows.filter((row) => existingSymbols.has(row.symbol)).map((row) => row.symbol));
      setPreviewResult({ totalRows: rows.length, duplicateCount: rows.filter((row) => existingSymbols.has(row.symbol)).length, previewRows: [] });
      setImportStep(3);
      return;
    }
    // Map raw rows into normalized transaction objects
    const mappedRows = parsedRows.map((r) => {
      const rawAmt = parseFloat(r[mappings.amount] || "0");
      let type: "income" | "expense" = rawAmt >= 0 ? "income" : "expense";

      if (mappings.type && r[mappings.type]) {
        const typeStr = String(r[mappings.type]).toLowerCase();
        if (typeStr.includes("inc") || typeStr.includes("credit")) type = "income";
        if (typeStr.includes("exp") || typeStr.includes("debit")) type = "expense";
      }

      return {
        amount: Math.abs(rawAmt),
        type,
        category: r[mappings.category] || "Uncategorized",
        description: r[mappings.description] || "Imported transaction",
        date: r[mappings.date] ? new Date(r[mappings.date]).toISOString() : new Date().toISOString(),
      };
    });

    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: targetAccountId, rows: mappedRows }),
      });
      if (!res.ok) throw new Error("Failed to generate import preview");
      const data = await res.json();
      setPreviewResult(data);
      setImportStep(3);
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Preview failed"), "error");
    }
  };

  const handleExecuteImport = async () => {
    if (!previewResult) return;
    setImporting(true);

    try {
      if (importEntity === "portfolio") {
        let insertedCount = 0;
        let skippedCount = 0;
        for (const row of portfolioRows) {
          if (skipDuplicates && portfolioDuplicates.includes(row.symbol)) {
            skippedCount++;
            continue;
          }
          const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
          if (!res.ok) throw new Error(`Could not import ${row.symbol}`);
          insertedCount++;
        }
        setImportResult({ message: `Import complete. ${insertedCount} holdings imported, ${skippedCount} duplicates skipped.`, insertedCount, skippedCount });
        setImportStep(4);
        return;
      }
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: targetAccountId,
          rows: previewResult.previewRows,
          skipDuplicates,
        }),
      });

      if (!res.ok) throw new Error("Import execution failed");
      const data = await res.json();
      setImportResult(data);
      setImportStep(4);
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Import failed"), "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-[var(--accent)]" />
          Data Management
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Export your financial data or import historical transactions with automated duplicate detection
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "export"
              ? "bg-[var(--accent-soft)]/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "import"
              ? "bg-[var(--accent-soft)]/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Upload className="w-4 h-4" /> Import Data
        </button>
      </div>

      {/* EXPORT SECTION */}
      {activeTab === "export" && (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Export Financial Records</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Select the module and date range to download complete user-scoped CSV files.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Module
              </label>
              <select
                value={exportEntity}
                onChange={(e) => setExportEntity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white capitalize"
              >
                <option value="transactions">Transactions</option>
                <option value="accounts">Accounts</option>
                <option value="categories">Categories</option>
                <option value="goals">Goals</option>
                <option value="budgets">Budgets</option>
                <option value="credit_cards">Credit Cards</option>
                <option value="loans">Loans</option>
                <option value="insurance">Insurance Policies</option>
                <option value="portfolio">Portfolio Holdings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Period
              </label>
              <select
                value={exportRange}
                onChange={(e) => setExportRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                <option value="all_time">All Time</option>
                <option value="current_month">Current Month</option>
                <option value="current_year">Current Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {exportRange === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-3 rounded-xl transition shadow-sm disabled:opacity-50 mt-4"
            >
              <Download className="w-4 h-4" /> {downloading ? "Generating CSV..." : "Download Export CSV"}
            </button>
          </div>
        </div>
      )}

      {/* IMPORT SECTION */}
      {activeTab === "import" && (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-6 shadow-sm max-w-3xl space-y-6">
          {/* Steps Indicator */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[var(--border)] pb-4 text-xs font-semibold">
                  <span className={importStep === 1 ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>1. Upload File</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={importStep === 2 ? "text-[var(--accent)]" : "text-slate-400"}>2. Map Fields</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={importStep === 3 ? "text-[var(--accent)]" : "text-slate-400"}>3. Duplicate Check</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={importStep === 4 ? "text-[var(--accent)]" : "text-slate-400"}>4. Finish</span>
          </div>

          {/* STEP 1: Upload File */}
          {importStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">What are you importing?</label>
                <select value={importEntity} onChange={(e) => { setImportEntity(e.target.value as typeof importEntity); setImportStep(1); }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
                  <option value="transactions">Transactions / bank statements</option>
                  <option value="portfolio">Portfolio holdings / broker statements</option>
                </select>
              </div>
              {importEntity === "transactions" && <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Target Account *
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>}

              <div className="border-2 border-dashed border-slate-300 dark:border-[var(--border)] rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-[var(--surface-muted)]/30">
                <Upload className="w-10 h-10 text-[var(--accent)] mx-auto mb-3" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Upload Bank Statement / CSV</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                  {importEntity === "portfolio" ? "Select a CSV or XLSX broker statement with symbol, quantity, cost, and price columns." : "Select a CSV or XLSX bank statement with date, amount, and description columns."}
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition shadow-sm"
                >
                  Choose CSV / XLSX
                </label>
                {fileName && <p className="mt-3 text-xs text-[var(--text-muted)]">{fileName}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Map Fields */}
          {importStep === 2 && (
            <div className="space-y-5">
              <h3 className="font-bold text-[var(--text-primary)] text-base">Map {importEntity === "portfolio" ? "broker" : "statement"} columns to Wealthly fields</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                We auto-detected header columns from your file. Verify or adjust the mappings below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {importEntity === "portfolio" ? <>
                {["symbol", "name", "assetType", "quantity", "averageCost", "currentPrice"].map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">{field === "assetType" ? "Asset type" : field === "averageCost" ? "Average cost" : field === "currentPrice" ? "Current price" : field[0].toUpperCase() + field.slice(1)} *</label>
                    <select value={(mappings as Record<string, string>)[field] || ""} onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]">
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
                </> : <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Column *</label>
                  <select
                    value={mappings.amount}
                    onChange={(e) => setMappings({ ...mappings, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Column *</label>
                  <select
                    value={mappings.date}
                    onChange={(e) => setMappings({ ...mappings, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description Column</label>
                  <select
                    value={mappings.description}
                    onChange={(e) => setMappings({ ...mappings, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Column</label>
                  <select
                    value={mappings.category}
                    onChange={(e) => setMappings({ ...mappings, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  >
                    <option value="">-- None (Default: Uncategorized) --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </>}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  onClick={() => setImportStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToPreview}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  Proceed to Duplicate Check & Preview
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Duplicate Check */}
          {importStep === 3 && previewResult && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-[var(--surface-muted)]/50 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-[var(--border)]">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)] text-sm">File Analysis Complete</h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Found {previewResult.totalRows} rows. {previewResult.duplicateCount} duplicate {importEntity === "portfolio" ? "holding(s)" : "transaction(s)"} detected.
                  </p>
                </div>
                {previewResult.duplicateCount > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> {previewResult.duplicateCount} Duplicates
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skip-dup-check"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="skip-dup-check" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Automatically skip detected duplicates during import
                </label>
              </div>

              {importEntity === "portfolio" ? (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--border)]">
                  <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[var(--surface-muted)] text-[var(--text-secondary)]"><tr><th className="p-2.5">Symbol</th><th className="p-2.5">Name</th><th className="p-2.5">Qty</th><th className="p-2.5">Current price</th></tr></thead><tbody className="divide-y divide-[var(--border-subtle)]">{portfolioRows.slice(0, 15).map((row) => <tr key={row.symbol}><td className="p-2.5 font-semibold text-[var(--text-primary)]">{row.symbol}</td><td className="p-2.5 text-[var(--text-secondary)]">{row.name}</td><td className="p-2.5 text-[var(--text-secondary)]">{row.quantity}</td><td className="p-2.5 text-[var(--text-secondary)]">₹{row.currentPrice}</td></tr>)}</tbody></table>
                </div>
              ) : (
              /* Preview Table */
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-[var(--border)] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-[var(--surface-muted)] text-slate-700 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewResult.previewRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className={row.isDuplicate ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                        <td className="p-2.5 font-mono">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="p-2.5">{row.description}</td>
                        <td className="p-2.5">{row.category}</td>
                        <td className={`p-2.5 font-bold ${row.type === "income" ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                          ₹{row.amount}
                        </td>
                        <td className="p-2.5 text-right">
                          {row.isDuplicate ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                              Duplicate
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  onClick={() => setImportStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {importing ? "Importing..." : `Confirm & Import ${importEntity === "portfolio" ? "Holdings" : "Transactions"}`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Finish */}
          {importStep === 4 && importResult && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[var(--accent)] mx-auto" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Import Successfully Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{importResult.message}</p>
              <button
                onClick={() => {
                  setImportStep(1);
                  setParsedRows([]);
                }}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
              >
                <RefreshCw className="w-4 h-4" /> Import Another File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
