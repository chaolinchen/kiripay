import { useCallback, useEffect, useState } from "react";

type Lang = "id" | "fil" | "vi" | "th" | "zh" | "en";

interface SalaryRecord {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
}

interface RemittanceRecord {
  id: string;
  date: string;
  sentTWD: number;
  received: number;
  currency: string;
  flag: string;
  status: "completed" | "processing" | "failed";
}

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

const LANGUAGES: { code: Lang; label: string; flag: string; currency: string; rate: number }[] = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", currency: "IDR", rate: 487.5 },
  { code: "fil", label: "Filipino", flag: "🇵🇭", currency: "PHP", rate: 1.82 },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", currency: "VND", rate: 797.0 },
  { code: "th", label: "ภาษาไทย", flag: "🇹🇭", currency: "THB", rate: 1.12 },
  { code: "zh", label: "繁體中文", flag: "🇹🇼", currency: "TWD", rate: 1 },
  { code: "en", label: "English", flag: "🌐", currency: "USD", rate: 0.031 },
];

const mockSalaries: SalaryRecord[] = [
  { id: "s1", date: "2026-03-05", amount: 27470, status: "paid" },
  { id: "s2", date: "2026-02-05", amount: 27470, status: "paid" },
  { id: "s3", date: "2026-01-05", amount: 27470, status: "paid" },
  { id: "s4", date: "2025-12-05", amount: 26400, status: "paid" },
  { id: "s5", date: "2025-11-05", amount: 26400, status: "paid" },
  { id: "s6", date: "2025-10-05", amount: 26400, status: "paid" },
];

const MOCK_REMITTANCES_BY_LANG: Record<Lang, RemittanceRecord[]> = {
  id:  [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 7312500, currency: "IDR", flag: "🇮🇩", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 5850000, currency: "IDR", flag: "🇮🇩", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 4875000, currency: "IDR", flag: "🇮🇩", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 3900000, currency: "IDR", flag: "🇮🇩", status: "processing" },
  ],
  fil: [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 27300, currency: "PHP", flag: "🇵🇭", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 21840, currency: "PHP", flag: "🇵🇭", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 18200, currency: "PHP", flag: "🇵🇭", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 14560, currency: "PHP", flag: "🇵🇭", status: "processing" },
  ],
  vi:  [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 11955000, currency: "VND", flag: "🇻🇳", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 9564000, currency: "VND", flag: "🇻🇳", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 7970000, currency: "VND", flag: "🇻🇳", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 6376000, currency: "VND", flag: "🇻🇳", status: "processing" },
  ],
  th:  [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 16800, currency: "THB", flag: "🇹🇭", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 13440, currency: "THB", flag: "🇹🇭", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 11200, currency: "THB", flag: "🇹🇭", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 8960, currency: "THB", flag: "🇹🇭", status: "processing" },
  ],
  zh:  [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 15000, currency: "TWD", flag: "🇹🇼", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 12000, currency: "TWD", flag: "🇹🇼", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 10000, currency: "TWD", flag: "🇹🇼", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 8000, currency: "TWD", flag: "🇹🇼", status: "processing" },
  ],
  en:  [
    { id: "r1", date: "2026-03-10", sentTWD: 15000, received: 465, currency: "USD", flag: "🌐", status: "completed" },
    { id: "r2", date: "2026-02-12", sentTWD: 12000, received: 372, currency: "USD", flag: "🌐", status: "completed" },
    { id: "r3", date: "2026-01-08", sentTWD: 10000, received: 310, currency: "USD", flag: "🌐", status: "completed" },
    { id: "r4", date: "2025-12-15", sentTWD: 8000, received: 248, currency: "USD", flag: "🌐", status: "processing" },
  ],
};

function calcFee(amount: number): number {
  if (amount <= 0) return 0;
  const rate = amount < 5000 ? 0.012 : amount < 20000 ? 0.008 : 0.005;
  return Math.max(50, Math.round(amount * rate));
}

function tr(t: Record<string, string> | null, key: string): string {
  if (!t) return "";
  return t[key] ?? key;
}

function LanguageSelector({
  onSelect,
  previewT,
}: {
  onSelect: (l: Lang) => void;
  previewT: Record<string, string> | null;
}) {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-safe-top pb-6 sm:px-6"
      style={{
        background: "linear-gradient(160deg, #0F2952 0%, #1A3A6B 50%, #0D5C4A 100%)",
      }}
    >
      <div className="text-center mb-6 xs:mb-10 max-w-[min(100%,24rem)]">
        <div className="text-4xl xs:text-5xl mb-2 xs:mb-3">🌏</div>
        <h1 className="text-3xl xs:text-4xl font-black text-white tracking-tight">
          {tr(previewT, "appName") || "KiriPay"}
        </h1>
        <p className="text-blue-200 mt-2 text-xs xs:text-sm font-medium leading-snug px-1 break-words">
          {tr(previewT, "languageChooserHint") || "Select your language"}
        </p>
      </div>
      <div className="w-full max-w-sm space-y-2.5 xs:space-y-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => onSelect(l.code)}
            className="w-full flex items-center gap-3 xs:gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3.5 xs:px-5 xs:py-4 text-white hover:bg-white/20 active:scale-[0.98] transition-all duration-150 min-h-[3.25rem]"
          >
            <span className="text-xl xs:text-2xl shrink-0">{l.flag}</span>
            <span className="font-semibold text-sm xs:text-base flex-1 text-left leading-tight">{l.label}</span>
            <span className="text-blue-200 text-xs font-mono shrink-0">{l.currency}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NavBar({
  t,
  page,
  setPage,
}: {
  t: Record<string, string>;
  page: string;
  setPage: (p: string) => void;
}) {
  const tabs = [
    { id: "home", icon: "🏠", label: tr(t, "home") },
    { id: "send", icon: "💸", label: tr(t, "send") },
    { id: "history", icon: "📋", label: tr(t, "history") },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl px-1 xs:px-4 pb-nav-safe">
      <div className="max-w-sm mx-auto flex justify-between xs:justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPage(tab.id)}
            className={`flex flex-col items-center py-2.5 xs:py-3 px-2 xs:px-5 transition-all duration-200 min-w-0 flex-1 xs:flex-none ${
              page === tab.id ? "text-blue-700" : "text-gray-400"
            }`}
          >
            <span className="text-lg xs:text-xl">{tab.icon}</span>
            <span className="text-[10px] xs:text-xs font-semibold mt-0.5 text-center leading-tight max-w-[5.5rem] xs:max-w-none truncate xs:whitespace-normal">
              {tab.label}
            </span>
            {page === tab.id && <div className="w-1 h-1 rounded-full bg-blue-700 mt-1" />}
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomePage({
  t,
  langInfo,
  remittances,
}: {
  t: Record<string, string>;
  langInfo: (typeof LANGUAGES)[0];
  remittances: RemittanceRecord[];
}) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const latestSalary = mockSalaries[0]?.amount ?? 0;
  const monthSent = remittances
    .filter((r) => r.status === "completed" && r.date.startsWith(thisMonth))
    .reduce((sum, r) => sum + r.sentTWD, 0);
  const balance = latestSalary - monthSent;

  return (
    <div className="pb-24 px-3 xs:px-4 pt-4 xs:pt-6 max-w-sm mx-auto w-full min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5 xs:mb-6">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs xs:text-sm truncate">{tr(t, "tagline")}</p>
          <h2 className="text-xl xs:text-2xl font-black text-gray-900 break-words">
            {tr(t, "appName")} {langInfo.flag}
          </h2>
        </div>
        <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-base xs:text-lg shadow-lg shrink-0">
          A
        </div>
      </div>

      <div
        className="rounded-3xl p-4 xs:p-6 mb-4 shadow-xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1A3A6B 0%, #2563EB 60%, #10B981 100%)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 xs:w-40 xs:h-40 rounded-full opacity-10 bg-white -mr-8 -mt-8 xs:-mr-10 xs:-mt-10" />
        <p className="text-blue-200 text-xs xs:text-sm font-medium mb-1">{tr(t, "balance")}</p>
        <p className="text-white text-3xl xs:text-4xl font-black tracking-tight break-all">
          NT${balance.toLocaleString()}
        </p>
        <div className="flex flex-wrap gap-4 xs:gap-6 mt-4 xs:mt-5">
          <div className="min-w-0">
            <p className="text-blue-300 text-[10px] xs:text-xs">{tr(t, "salary")}</p>
            <p className="text-white font-bold text-base xs:text-lg break-all">NT${latestSalary.toLocaleString()}</p>
          </div>
          <div className="min-w-0">
            <p className="text-blue-300 text-[10px] xs:text-xs">{tr(t, "totalSent")}</p>
            <p className="text-white font-bold text-base xs:text-lg break-all">
              NT${monthSent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-2 mb-5 xs:mb-6 max-w-full">
        <span className="text-emerald-600 text-[10px] xs:text-xs font-semibold leading-snug break-words">
          {tr(t, "exchangeRate")}: 1 TWD = {langInfo.rate} {langInfo.currency}
        </span>
        <span className="text-emerald-500 text-xs shrink-0">●</span>
        <span className="text-emerald-600 text-[10px] xs:text-xs shrink-0">{tr(t, "live")}</span>
      </div>

      <h3 className="text-gray-800 font-bold text-sm xs:text-base mb-3">{tr(t, "salaryHistory")}</h3>
      <div className="space-y-2 mb-6">
        {mockSalaries.slice(0, 4).map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 bg-white rounded-2xl px-3 py-2.5 xs:px-4 xs:py-3 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm xs:text-base shrink-0">
                💰
              </div>
              <div className="min-w-0">
                <p className="text-gray-800 font-semibold text-xs xs:text-sm">
                  NT${s.amount.toLocaleString()}
                </p>
                <p className="text-gray-400 text-[10px] xs:text-xs">{s.date}</p>
              </div>
            </div>
            <span
              className={`text-[10px] xs:text-xs font-bold px-2 py-1 xs:px-3 xs:py-1 rounded-full shrink-0 whitespace-nowrap ${
                s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {s.status === "paid" ? tr(t, "status_paid") : tr(t, "status_pending")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SendPage({
  t,
  langInfo,
  onSuccess,
  onAddRemittance,
}: {
  t: Record<string, string>;
  langInfo: (typeof LANGUAGES)[0];
  onSuccess: () => void;
  onAddRemittance: (r: RemittanceRecord) => void;
}) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");

  const numAmount = parseFloat(amount) || 0;
  const fee = calcFee(numAmount);
  const netAmount = numAmount - fee;
  const received = Math.round(netAmount * langInfo.rate);

  if (step === "success") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-safe-top pb-8 text-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-5xl xs:text-7xl mb-4 xs:mb-6 animate-bounce">✅</div>
        <h2 className="text-2xl xs:text-3xl font-black text-gray-900 mb-2 px-1">{tr(t, "success")}</h2>
        <p className="text-gray-500 mb-2 text-sm xs:text-base break-words px-2">
          NT${numAmount.toLocaleString()} → {received.toLocaleString()} {langInfo.currency}
        </p>
        <p className="text-emerald-600 font-semibold text-xs xs:text-sm mb-6 xs:mb-8 px-2">
          {tr(t, "estimatedArrival")}: {tr(t, "days")}
        </p>
        <button
          type="button"
          onClick={onSuccess}
          className="bg-blue-700 text-white font-bold text-sm xs:text-base rounded-2xl px-8 py-3.5 xs:px-10 xs:py-4 shadow-lg active:scale-[0.98] transition-all"
        >
          {tr(t, "home")} ←
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 px-3 xs:px-4 pt-4 xs:pt-6 max-w-sm mx-auto w-full min-w-0">
      <h2 className="text-xl xs:text-2xl font-black text-gray-900 mb-5 xs:mb-6 break-words">
        {tr(t, "send")} {langInfo.flag}
      </h2>

      <div className="bg-white rounded-2xl p-3.5 xs:p-4 mb-3.5 xs:mb-4 border border-gray-100 shadow-sm">
        <p className="text-gray-500 text-[10px] xs:text-xs font-semibold mb-2">{tr(t, "chooseRecipient")}</p>
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {langInfo.flag}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-xs xs:text-sm break-words">
              {tr(t, "recipientFamily")} · {langInfo.currency}
            </p>
            <p className="text-gray-400 text-[10px] xs:text-xs truncate">{langInfo.label}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 xs:p-5 mb-3.5 xs:mb-4 border border-gray-100 shadow-sm">
        <p className="text-gray-500 text-[10px] xs:text-xs font-semibold mb-3">{tr(t, "amount")}</p>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 font-bold text-lg xs:text-xl shrink-0">NT$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="text-2xl xs:text-3xl font-black text-blue-800 w-full min-w-0 outline-none placeholder-gray-200 bg-transparent"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 xs:flex gap-2">
          {[5000, 10000, 15000, 20000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="flex-1 text-[10px] xs:text-xs font-semibold bg-blue-50 text-blue-700 rounded-xl py-2 hover:bg-blue-100 active:scale-[0.98] transition-all"
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {numAmount > 0 && (
        <div className="bg-white rounded-2xl p-4 xs:p-5 mb-5 xs:mb-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between gap-2 text-xs xs:text-sm">
            <span className="text-gray-500 shrink-0">{tr(t, "fee")}</span>
            <span className="font-semibold text-gray-700 text-right break-all">NT${fee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-2 text-xs xs:text-sm">
            <span className="text-gray-500 shrink-0">{tr(t, "exchangeRate")}</span>
            <span className="font-semibold text-gray-700 text-right break-all">
              1 TWD = {langInfo.rate} {langInfo.currency}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between gap-2">
            <span className="font-bold text-gray-800 text-xs xs:text-sm shrink-0">{tr(t, "youReceive")}</span>
            <span className="font-black text-emerald-600 text-base xs:text-lg text-right break-all">
              {received.toLocaleString()} {langInfo.currency}
            </span>
          </div>
          <div className="bg-blue-50 rounded-xl px-3 py-2 flex items-start gap-2">
            <span className="text-blue-500 shrink-0">🕐</span>
            <span className="text-blue-700 text-[10px] xs:text-xs font-semibold leading-snug">
              {tr(t, "estimatedArrival")}: {tr(t, "days")}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => numAmount > 0 && setStep("confirm")}
        disabled={numAmount <= 0}
        className={`w-full py-3.5 xs:py-4 rounded-2xl font-black text-base xs:text-lg shadow-lg transition-all active:scale-[0.98] ${
          numAmount > 0 ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        {tr(t, "confirmSend")} →
      </button>

      {step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 xs:p-0">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-t-3xl p-4 xs:p-6 max-h-[85dvh] overflow-y-auto overscroll-contain mx-auto pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 xs:mb-6" />
            <h3 className="text-lg xs:text-xl font-black text-gray-900 mb-4 text-center px-1">
              {tr(t, "confirmSend")}
            </h3>
            <div className="space-y-3 mb-5 xs:mb-6">
              <div className="flex justify-between gap-2 text-xs xs:text-sm">
                <span className="text-gray-500">{tr(t, "confirmModalSentLabel")}</span>
                <span className="font-bold text-right break-all">NT${numAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs xs:text-sm">
                <span className="text-gray-500">{tr(t, "fee")}</span>
                <span className="font-bold text-right break-all">NT${fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 gap-2">
                <span className="font-bold text-gray-800 text-xs xs:text-sm">{tr(t, "youReceive")}</span>
                <span className="font-black text-emerald-600 text-right break-all">
                  {received.toLocaleString()} {langInfo.currency}
                </span>
              </div>
            </div>
            <div className="flex gap-2 xs:gap-3 pb-1">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="flex-1 py-2.5 xs:py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm"
              >
                {tr(t, "back")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  onAddRemittance({
                    id: `r-${Date.now()}`,
                    date: today,
                    sentTWD: numAmount,
                    received,
                    currency: langInfo.currency,
                    flag: langInfo.flag,
                    status: "completed",
                  });
                  setStep("success");
                }}
                className="flex-1 py-2.5 xs:py-3 rounded-2xl bg-blue-700 text-white font-bold shadow-lg text-sm"
              >
                ✓ {tr(t, "confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPage({ t, remittances }: { t: Record<string, string>; remittances: RemittanceRecord[] }) {
  const [tab, setTab] = useState<"remittance" | "salary">("remittance");

  return (
    <div className="pb-24 px-3 xs:px-4 pt-4 xs:pt-6 max-w-sm mx-auto w-full min-w-0">
      <h2 className="text-xl xs:text-2xl font-black text-gray-900 mb-3 xs:mb-4">{tr(t, "history")}</h2>
      <div className="flex gap-2 mb-4 xs:mb-5">
        {(["remittance", "salary"] as const).map((t2) => (
          <button
            key={t2}
            type="button"
            onClick={() => setTab(t2)}
            className={`flex-1 py-2 xs:py-2.5 rounded-xl text-[11px] xs:text-sm font-bold transition-all leading-tight ${
              tab === t2 ? "bg-blue-700 text-white shadow" : "bg-gray-100 text-gray-500"
            }`}
          >
            {t2 === "remittance" ? tr(t, "remittanceHistory") : tr(t, "salaryHistory")}
          </button>
        ))}
      </div>

      {tab === "remittance" && (
        <div className="space-y-2.5 xs:space-y-3">
          {remittances.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl px-3 py-3 xs:px-4 xs:py-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg xs:text-xl shrink-0">{r.flag}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-xs xs:text-sm">
                      NT${r.sentTWD.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-[10px] xs:text-xs">{r.date}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] xs:text-xs font-bold px-2 py-1 xs:px-3 rounded-full shrink-0 whitespace-nowrap ${
                    r.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : r.status === "processing"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status === "completed"
                    ? tr(t, "status_completed")
                    : r.status === "processing"
                      ? tr(t, "status_processing")
                      : tr(t, "status_failed")}
                </span>
              </div>
              <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2 flex justify-between gap-2">
                <span className="text-gray-500 text-[10px] xs:text-xs shrink-0">{tr(t, "youReceive")}</span>
                <span className="font-bold text-gray-700 text-[10px] xs:text-xs text-right break-all">
                  {r.received.toLocaleString()} {r.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "salary" && (
        <div className="space-y-2.5 xs:space-y-3">
          {mockSalaries.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl px-3 py-3 xs:px-4 xs:py-4 border border-gray-100 shadow-sm flex justify-between items-center gap-2"
            >
              <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-blue-100 flex items-center justify-center text-base shrink-0">
                  💼
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-xs xs:text-sm">NT${s.amount.toLocaleString()}</p>
                  <p className="text-gray-400 text-[10px] xs:text-xs">{s.date}</p>
                </div>
              </div>
              <span
                className={`text-[10px] xs:text-xs font-bold px-2 py-1 xs:px-3 rounded-full shrink-0 whitespace-nowrap ${
                  s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {s.status === "paid" ? tr(t, "status_paid") : tr(t, "status_pending")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
      …
    </div>
  );
}

export default function MigrantPayApp() {
  const [lang, setLang] = useState<Lang | null>(() => {
    const saved = localStorage.getItem("kiripay_lang") as Lang | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    return null;
  });
  const [page, setPage] = useState("home");
  const [t, setT] = useState<Record<string, string> | null>(null);
  const [previewT, setPreviewT] = useState<Record<string, string> | null>(null);
  const [remittances, setRemittances] = useState<RemittanceRecord[]>([]);

  const loadForLang = useCallback(async (l: Lang) => {
    setT(null);
    const data = await loadLocale(l);
    setT(data);
  }, []);

  useEffect(() => {
    if (!lang) {
      const previewLang = guessBrowserLang();
      loadLocale(previewLang).then(setPreviewT).catch(() => setPreviewT(null));
      return;
    }
    loadForLang(lang).catch(() => {
      setT({});
    });
    setRemittances(MOCK_REMITTANCES_BY_LANG[lang]);
  }, [lang, loadForLang]);

  const handleLangSelect = (l: Lang) => {
    setLang(l);
    setRemittances(MOCK_REMITTANCES_BY_LANG[l]);
    localStorage.setItem("kiripay_lang", l);
  };

  const handleAddRemittance = (r: RemittanceRecord) => {
    setRemittances((prev) => [r, ...prev]);
  };

  const langInfo = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  if (!lang) {
    return <LanguageSelector onSelect={handleLangSelect} previewT={previewT} />;
  }

  if (!t) {
    return <ScreenLoader />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 font-sans text-gray-900">
      <div className="max-w-sm mx-auto relative w-full min-w-0 min-h-[100dvh]">
        <div className="h-2 bg-white shrink-0 min-h-[env(safe-area-inset-top,0px)]" />

        {page === "home" && <HomePage t={t} langInfo={langInfo} remittances={remittances} />}
        {page === "send" && (
          <SendPage
            t={t}
            langInfo={langInfo}
            onSuccess={() => setPage("history")}
            onAddRemittance={handleAddRemittance}
          />
        )}
        {page === "history" && <HistoryPage t={t} remittances={remittances} />}

        <NavBar t={t} page={page} setPage={setPage} />
      </div>
    </div>
  );
}
