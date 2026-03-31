import { useCallback, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Lang = "id" | "fil" | "vi" | "th" | "zh" | "en";
type Page = "home" | "remittance" | "p2p" | "history";

interface SalaryRecord {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
}

interface RemittanceRecord {
  id: string;
  type: "remittance";
  date: string;
  sentTWD: number;
  received: number;
  currency: string;
  flag: string;
  countryName: string;
  status: "completed" | "processing" | "failed";
}

interface P2PRecord {
  id: string;
  type: "p2p";
  date: string;
  sentTWD: number;
  recipientName: string;
  recipientFlag: string;
  note?: string;
  status: "completed";
}

type TransactionRecord = RemittanceRecord | P2PRecord;

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "id",  label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "fil", label: "Filipino",          flag: "🇵🇭" },
  { code: "vi",  label: "Tiếng Việt",        flag: "🇻🇳" },
  { code: "th",  label: "ภาษาไทย",           flag: "🇹🇭" },
  { code: "zh",  label: "繁體中文",           flag: "🇹🇼" },
  { code: "en",  label: "English",           flag: "🌐" },
];

const COUNTRIES = [
  { code: "id",  name: "Indonesia",   flag: "🇮🇩", currency: "IDR", rate: 487.5 },
  { code: "fil", name: "Philippines", flag: "🇵🇭", currency: "PHP", rate: 1.82  },
  { code: "vi",  name: "Vietnam",     flag: "🇻🇳", currency: "VND", rate: 797.0 },
  { code: "th",  name: "Thailand",    flag: "🇹🇭", currency: "THB", rate: 1.12  },
];

const MOCK_CONTACTS = [
  { id: "c1", name: "Siti",    flag: "🇮🇩", last4: "8821" },
  { id: "c2", name: "Maria",   flag: "🇵🇭", last4: "4502" },
  { id: "c3", name: "Nguyen",  flag: "🇻🇳", last4: "3317" },
  { id: "c4", name: "Somchai", flag: "🇹🇭", last4: "9963" },
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  { id: "t1", type: "remittance", date: "2026-03-10", sentTWD: 15000, received: 7312500, currency: "IDR", flag: "🇮🇩", countryName: "Indonesia",   status: "completed"  },
  { id: "t2", type: "p2p",        date: "2026-03-08", sentTWD: 2000,  recipientName: "Siti",    recipientFlag: "🇮🇩", note: "水電費", status: "completed" },
  { id: "t3", type: "remittance", date: "2026-02-12", sentTWD: 12000, received: 21840,    currency: "PHP", flag: "🇵🇭", countryName: "Philippines", status: "completed"  },
  { id: "t4", type: "p2p",        date: "2026-02-05", sentTWD: 500,   recipientName: "Maria",   recipientFlag: "🇵🇭", note: "代購",   status: "completed" },
  { id: "t5", type: "remittance", date: "2026-01-08", sentTWD: 10000, received: 7970000,  currency: "VND", flag: "🇻🇳", countryName: "Vietnam",     status: "completed"  },
  { id: "t6", type: "remittance", date: "2025-12-15", sentTWD: 8000,  received: 8960,     currency: "THB", flag: "🇹🇭", countryName: "Thailand",    status: "processing" },
];

const MOCK_SALARIES: SalaryRecord[] = [
  { id: "s1", date: "2026-03-05", amount: 27470, status: "paid" },
  { id: "s2", date: "2026-02-05", amount: 27470, status: "paid" },
  { id: "s3", date: "2026-01-05", amount: 27470, status: "paid" },
  { id: "s4", date: "2025-12-05", amount: 26400, status: "paid" },
  { id: "s5", date: "2025-11-05", amount: 26400, status: "paid" },
  { id: "s6", date: "2025-10-05", amount: 26400, status: "paid" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loadLocale(lang: Lang): Promise<Record<string, string>> {
  const res = await fetch(`/locales/${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load locale: ${lang}`);
  return res.json() as Promise<Record<string, string>>;
}

function guessBrowserLang(): Lang {
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("id")) return "id";
  if (nav.startsWith("fil") || nav.startsWith("tl")) return "fil";
  if (nav.startsWith("vi")) return "vi";
  if (nav.startsWith("th")) return "th";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

function tr(t: Record<string, string> | null, key: string): string {
  if (!t) return "";
  return t[key] ?? key;
}

function calcFee(amount: number): number {
  if (amount <= 0) return 0;
  const rate = amount < 5000 ? 0.012 : amount < 20000 ? 0.008 : 0.005;
  return Math.max(50, Math.round(amount * rate));
}

function calcBalance(transactions: TransactionRecord[]): number {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const latestSalary = MOCK_SALARIES[0]?.amount ?? 0;
  const monthSent = transactions
    .filter((r) => r.status === "completed" && r.date.startsWith(thisMonth))
    .reduce((sum, r) => sum + r.sentTWD, 0);
  return latestSalary - monthSent;
}

// ─── LanguageSelector ─────────────────────────────────────────────────────────

function LanguageSelector({
  onSelect,
  previewT,
}: {
  onSelect: (l: Lang) => void;
  previewT: Record<string, string> | null;
}) {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-safe-top pb-6"
      style={{ background: "linear-gradient(160deg, #0F2952 0%, #1A3A6B 50%, #0D5C4A 100%)" }}
    >
      <div className="text-center mb-8 max-w-xs">
        <div className="text-5xl mb-3">🌏</div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          {tr(previewT, "appName") || "KiriPay"}
        </h1>
        <p className="text-blue-200 mt-2 text-sm font-medium">
          {tr(previewT, "languageChooserHint") || "Select your language"}
        </p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => onSelect(l.code)}
            className="w-full flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 text-white hover:bg-white/20 active:scale-[0.98] transition-all duration-150"
          >
            <span className="text-2xl shrink-0">{l.flag}</span>
            <span className="font-semibold text-base flex-1 text-left">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar({ t, page, setPage }: { t: Record<string, string>; page: Page; setPage: (p: Page) => void }) {
  const tabs: { id: Page; icon: string; label: string }[] = [
    { id: "home",    icon: "🏠", label: tr(t, "home") },
    { id: "history", icon: "📋", label: tr(t, "history") },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl pb-safe-bottom">
      <div className="max-w-sm mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPage(tab.id)}
            className={`flex flex-col items-center py-3 flex-1 transition-all duration-200 ${
              page === tab.id ? "text-blue-700" : "text-gray-400"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-semibold mt-0.5">{tab.label}</span>
            {page === tab.id && <div className="w-1 h-1 rounded-full bg-blue-700 mt-1" />}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

function HomePage({
  t,
  transactions,
  onGoRemittance,
  onGoP2P,
}: {
  t: Record<string, string>;
  transactions: TransactionRecord[];
  onGoRemittance: () => void;
  onGoP2P: () => void;
}) {
  const balance = calcBalance(transactions);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthSent = transactions
    .filter((r) => r.status === "completed" && r.date.startsWith(thisMonth))
    .reduce((sum, r) => sum + r.sentTWD, 0);
  const recent = transactions.slice(0, 3);

  return (
    <div className="pb-24 px-4 pt-5 max-w-sm mx-auto w-full">
      {/* Balance Card */}
      <div
        className="rounded-3xl p-5 mb-4 shadow-xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A3A6B 0%, #2563EB 60%, #10B981 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white -mr-10 -mt-10" />
        <p className="text-blue-200 text-xs font-medium mb-1">{tr(t, "balance")}</p>
        <p className="text-white text-4xl font-black tracking-tight">NT${balance.toLocaleString()}</p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-blue-300 text-xs">{tr(t, "salary")}</p>
            <p className="text-white font-bold text-lg">NT${(MOCK_SALARIES[0]?.amount ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-300 text-xs">{tr(t, "totalSent")}</p>
            <p className="text-white font-bold text-lg">NT${monthSent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Exchange Rate Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {COUNTRIES.map((c) => (
          <div key={c.code} className="flex-shrink-0 bg-white rounded-2xl px-3 py-2 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px]">{c.flag} {c.currency}</p>
            <p className="text-gray-800 text-xs font-bold">{c.rate}</p>
          </div>
        ))}
        <div className="flex-shrink-0 flex items-center px-2">
          <span className="text-emerald-500 text-[10px] font-semibold">{tr(t, "live")} ●</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={onGoRemittance}
          className="flex flex-col items-start p-4 bg-blue-700 rounded-2xl shadow-lg active:scale-[0.98] transition-all"
        >
          <span className="text-2xl mb-2">🏠</span>
          <p className="text-white font-black text-sm leading-tight">{tr(t, "remitHome")}</p>
          <p className="text-blue-200 text-[10px] mt-1 leading-tight">{tr(t, "remitHomeDesc")}</p>
        </button>
        <button
          type="button"
          onClick={onGoP2P}
          className="flex flex-col items-start p-4 bg-orange-500 rounded-2xl shadow-lg active:scale-[0.98] transition-all"
        >
          <span className="text-2xl mb-2">🤝</span>
          <p className="text-white font-black text-sm leading-tight">{tr(t, "transferFriend")}</p>
          <p className="text-orange-100 text-[10px] mt-1 leading-tight">{tr(t, "transferFriendDesc")}</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <h3 className="text-gray-800 font-bold text-sm mb-3">{tr(t, "recentTransactions")}</h3>
      <div className="space-y-2">
        {recent.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">{tr(t, "noTransactions")}</p>
        )}
        {recent.map((r) => (
          <TransactionRow key={r.id} tx={r} t={t} />
        ))}
      </div>
    </div>
  );
}

// ─── TransactionRow (shared) ──────────────────────────────────────────────────

function TransactionRow({ tx, t }: { tx: TransactionRecord; t: Record<string, string> }) {
  if (tx.type === "remittance") {
    return (
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-base shrink-0">
              🏠
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm">{tx.flag} {tx.countryName}</p>
              <p className="text-gray-400 text-xs">NT${tx.sentTWD.toLocaleString()} · {tx.date}</p>
            </div>
          </div>
          <StatusBadge status={tx.status} t={t} />
        </div>
        <div className="mt-2 bg-gray-50 rounded-xl px-3 py-1.5 flex justify-between">
          <span className="text-gray-400 text-xs">{tr(t, "youReceive")}</span>
          <span className="font-bold text-gray-700 text-xs">{tx.received.toLocaleString()} {tx.currency}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-base shrink-0">
            🤝
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm">{tx.recipientFlag} {tx.recipientName}</p>
            <p className="text-gray-400 text-xs">
              NT${tx.sentTWD.toLocaleString()} · {tx.date}
              {tx.note ? ` · ${tx.note}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={tx.status} t={t} />
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: Record<string, string> }) {
  const map: Record<string, string> = {
    completed:  "bg-emerald-100 text-emerald-700",
    processing: "bg-amber-100 text-amber-700",
    failed:     "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    completed:  tr(t, "status_completed"),
    processing: tr(t, "status_processing"),
    failed:     tr(t, "status_failed"),
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── RemittancePage (Flow A) ──────────────────────────────────────────────────

function RemittancePage({
  t,
  onBack,
  onDone,
}: {
  t: Record<string, string>;
  onBack: () => void;
  onDone: (record: RemittanceRecord) => void;
}) {
  const [step, setStep] = useState<"country" | "amount" | "confirm" | "success">("country");
  const [country, setCountry] = useState<(typeof COUNTRIES)[0] | null>(null);
  const [amount, setAmount] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const fee = calcFee(numAmount);
  const received = country ? Math.round((numAmount - fee) * country.rate) : 0;

  if (step === "success" && country) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-7xl mb-6 animate-bounce">✅</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{tr(t, "success")}</h2>
        <p className="text-gray-500 mb-1">NT${numAmount.toLocaleString()} → {received.toLocaleString()} {country.currency}</p>
        <p className="text-emerald-600 font-semibold text-sm mb-8">{tr(t, "estimatedArrival")}: {tr(t, "days")}</p>
        <button type="button" onClick={onDone.bind(null, {
          id: `t-${Date.now()}`, type: "remittance",
          date: new Date().toISOString().slice(0, 10),
          sentTWD: numAmount, received, currency: country.currency,
          flag: country.flag, countryName: country.name, status: "completed",
        })} className="bg-blue-700 text-white font-bold rounded-2xl px-10 py-4 shadow-lg">
          {tr(t, "home")} ←
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 max-w-sm mx-auto">
        <button type="button" onClick={onBack} className="text-gray-500 text-xl">←</button>
        <h2 className="font-black text-gray-900 text-lg">{tr(t, "remitHome")}</h2>
      </div>

      <div className="px-4 pt-5 pb-32 max-w-sm mx-auto space-y-4">
        {/* Step 1: Country */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold mb-3">{tr(t, "selectCountry")}</p>
          <div className="grid grid-cols-2 gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCountry(c); setStep("amount"); }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  country?.code === c.code
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-100 hover:border-blue-200"
                }`}
              >
                <span className="text-xl">{c.flag}</span>
                <div className="text-left min-w-0">
                  <p className="font-bold text-gray-800 text-xs truncate">{c.name}</p>
                  <p className="text-gray-400 text-[10px]">{c.currency}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Amount (shown after country selected) */}
        {country && (
          <>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-semibold mb-3">{tr(t, "amount")}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-xl">NT$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-3xl font-black text-blue-800 w-full outline-none placeholder-gray-200 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[5000, 10000, 15000, 20000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))}
                    className="text-xs font-semibold bg-blue-50 text-blue-700 rounded-xl py-2 hover:bg-blue-100 active:scale-[0.98] transition-all">
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {numAmount > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{tr(t, "fee")}</span>
                  <span className="font-semibold text-gray-700">NT${fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{tr(t, "exchangeRate")}</span>
                  <span className="font-semibold text-gray-700">1 TWD = {country.rate} {country.currency}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-gray-800 text-sm">{tr(t, "youReceive")}</span>
                  <span className="font-black text-emerald-600 text-lg">{received.toLocaleString()} {country.currency}</span>
                </div>
                <div className="bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-blue-500">🕐</span>
                  <span className="text-blue-700 text-xs font-semibold">{tr(t, "estimatedArrival")}: {tr(t, "days")}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky CTA */}
      {country && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => numAmount > 0 && setStep("confirm")}
            disabled={numAmount <= 0}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
              numAmount > 0 ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {tr(t, "confirmSend")} →
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {step === "confirm" && country && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-black text-gray-900 mb-4 text-center">{tr(t, "confirmSend")}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{tr(t, "confirmModalSentLabel")}</span>
                <span className="font-bold">NT${numAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{tr(t, "fee")}</span>
                <span className="font-bold">NT${fee.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-800 text-sm">{country.flag} {tr(t, "youReceive")}</span>
                <span className="font-black text-emerald-600">{received.toLocaleString()} {country.currency}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("amount")}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm">
                {tr(t, "back")}
              </button>
              <button type="button" onClick={() => setStep("success")}
                className="flex-1 py-3 rounded-2xl bg-blue-700 text-white font-bold shadow-lg text-sm">
                ✓ {tr(t, "confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── P2PPage (Flow B) ─────────────────────────────────────────────────────────

function P2PPage({
  t,
  onBack,
  onDone,
}: {
  t: Record<string, string>;
  onBack: () => void;
  onDone: (record: P2PRecord) => void;
}) {
  const [contact, setContact] = useState<(typeof MOCK_CONTACTS)[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"contact" | "amount" | "confirm" | "success">("contact");

  const numAmount = parseFloat(amount) || 0;

  if (step === "success" && contact) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-7xl mb-6 animate-bounce">🤝</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{tr(t, "successP2P")}</h2>
        <p className="text-gray-500 mb-1">{contact.flag} {contact.name} · NT${numAmount.toLocaleString()}</p>
        <p className="text-orange-500 font-semibold text-sm mb-8">{tr(t, "instantArrival")} · {tr(t, "free")}</p>
        <button type="button" onClick={onDone.bind(null, {
          id: `t-${Date.now()}`, type: "p2p",
          date: new Date().toISOString().slice(0, 10),
          sentTWD: numAmount, recipientName: contact.name,
          recipientFlag: contact.flag, note: note || undefined, status: "completed",
        })} className="bg-orange-500 text-white font-bold rounded-2xl px-10 py-4 shadow-lg">
          {tr(t, "home")} ←
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 max-w-sm mx-auto">
        <button type="button" onClick={onBack} className="text-gray-500 text-xl">←</button>
        <h2 className="font-black text-gray-900 text-lg">{tr(t, "transferFriend")}</h2>
      </div>

      <div className="px-4 pt-5 pb-32 max-w-sm mx-auto space-y-4">
        {/* Step 1: Contact */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold mb-3">{tr(t, "selectContact")}</p>
          <div className="space-y-2">
            {MOCK_CONTACTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setContact(c); setStep("amount"); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  contact?.id === c.id ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-orange-200"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {c.flag}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                  <p className="text-gray-400 text-xs">····{c.last4}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Amount + Note */}
        {contact && (
          <>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-semibold mb-3">{tr(t, "amount")}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-xl">NT$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-3xl font-black text-orange-600 w-full outline-none placeholder-gray-200 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 2000, 5000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))}
                    className="text-xs font-semibold bg-orange-50 text-orange-600 rounded-xl py-2 hover:bg-orange-100 active:scale-[0.98] transition-all">
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-semibold mb-2">{tr(t, "note")}</p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={tr(t, "notePlaceholder")}
                className="w-full text-sm text-gray-800 outline-none placeholder-gray-300 bg-transparent"
              />
            </div>

            {numAmount > 0 && (
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex justify-between items-center">
                <div>
                  <p className="text-orange-600 font-semibold text-sm">{tr(t, "free")}</p>
                  <p className="text-orange-400 text-xs">{tr(t, "instantArrival")}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-orange-600 text-xl">NT${numAmount.toLocaleString()}</p>
                  <p className="text-orange-400 text-xs">TWD → TWD</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky CTA */}
      {contact && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => numAmount > 0 && setStep("confirm")}
            disabled={numAmount <= 0}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
              numAmount > 0 ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {tr(t, "confirmSend")} →
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {step === "confirm" && contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-black text-gray-900 mb-4 text-center">{tr(t, "confirmSend")}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{tr(t, "selectContact")}</span>
                <span className="font-bold">{contact.flag} {contact.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{tr(t, "confirmModalSentLabel")}</span>
                <span className="font-bold">NT${numAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{tr(t, "fee")}</span>
                <span className="font-bold text-emerald-600">{tr(t, "free")}</span>
              </div>
              {note && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{tr(t, "note")}</span>
                  <span className="font-bold">{note}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("amount")}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm">
                {tr(t, "back")}
              </button>
              <button type="button" onClick={() => setStep("success")}
                className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-bold shadow-lg text-sm">
                ✓ {tr(t, "confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HistoryPage ──────────────────────────────────────────────────────────────

type HistoryTab = "all" | "remittance" | "p2p" | "salary";

function HistoryPage({ t, transactions }: { t: Record<string, string>; transactions: TransactionRecord[] }) {
  const [tab, setTab] = useState<HistoryTab>("all");

  const tabs: { id: HistoryTab; label: string }[] = [
    { id: "all",        label: tr(t, "tabAll") },
    { id: "remittance", label: tr(t, "tabRemittance") },
    { id: "p2p",        label: tr(t, "tabTransfer") },
    { id: "salary",     label: tr(t, "tabSalary") },
  ];

  const filtered =
    tab === "all"        ? transactions :
    tab === "remittance" ? transactions.filter((r) => r.type === "remittance") :
    tab === "p2p"        ? transactions.filter((r) => r.type === "p2p") :
    [];

  return (
    <div className="pb-24 px-4 pt-5 max-w-sm mx-auto w-full">
      <h2 className="text-2xl font-black text-gray-900 mb-4">{tr(t, "history")}</h2>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === tb.id ? "bg-blue-700 text-white shadow" : "bg-gray-100 text-gray-500"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {tab !== "salary" && (
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">{tr(t, "noTransactions")}</p>
          )}
          {filtered.map((r) => (
            <TransactionRow key={r.id} tx={r} t={t} />
          ))}
        </div>
      )}

      {/* Salary Tab */}
      {tab === "salary" && (
        <div className="space-y-2.5">
          {MOCK_SALARIES.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-base shrink-0">💼</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">NT${s.amount.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">{s.date}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {s.status === "paid" ? tr(t, "status_paid") : tr(t, "status_pending")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Screen Loader ────────────────────────────────────────────────────────────

function ScreenLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
      …
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MigrantPayApp() {
  const [lang, setLang] = useState<Lang | null>(() => {
    const saved = localStorage.getItem("kiripay_lang") as Lang | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    return null;
  });
  const [page, setPage] = useState<Page>("home");
  const [t, setT] = useState<Record<string, string> | null>(null);
  const [previewT, setPreviewT] = useState<Record<string, string> | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);

  const loadForLang = useCallback(async (l: Lang) => {
    setT(null);
    const data = await loadLocale(l);
    setT(data);
  }, []);

  useEffect(() => {
    if (!lang) {
      loadLocale(guessBrowserLang()).then(setPreviewT).catch(() => setPreviewT(null));
      return;
    }
    loadForLang(lang).catch(() => setT({}));
  }, [lang, loadForLang]);

  const handleLangSelect = (l: Lang) => {
    setLang(l);
    localStorage.setItem("kiripay_lang", l);
  };

  const addTransaction = (record: TransactionRecord) => {
    setTransactions((prev) => [record, ...prev]);
    setPage("history");
  };

  if (!lang) return <LanguageSelector onSelect={handleLangSelect} previewT={previewT} />;
  if (!t) return <ScreenLoader />;

  // Full-screen send flows (no nav bar)
  if (page === "remittance") {
    return (
      <RemittancePage
        t={t}
        onBack={() => setPage("home")}
        onDone={(record) => addTransaction(record)}
      />
    );
  }
  if (page === "p2p") {
    return (
      <P2PPage
        t={t}
        onBack={() => setPage("home")}
        onDone={(record) => addTransaction(record)}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 font-sans text-gray-900">
      <div className="max-w-sm mx-auto relative w-full min-w-0 min-h-[100dvh]">
        <div className="h-[env(safe-area-inset-top,0px)] bg-white" />
        {page === "home" && (
          <HomePage
            t={t}
            transactions={transactions}
            onGoRemittance={() => setPage("remittance")}
            onGoP2P={() => setPage("p2p")}
          />
        )}
        {page === "history" && <HistoryPage t={t} transactions={transactions} />}
        <NavBar t={t} page={page} setPage={setPage} />
      </div>
    </div>
  );
}
