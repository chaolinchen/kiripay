# PRD：KiriPay（移工普惠金融）
**版本：** v0.2 MVP
**日期：** 2026-03-31
**負責人：** Product Team
**變更摘要：** 統一產品名稱為 KiriPay；修正技術規格反映實際實作；新增 bug 修正項目至 Must Have；更新驗收標準

---

## 變更記錄

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| v0.1 | 2026-03-30 | 初始 PRD |
| v0.2 | 2026-03-31 | 統一品牌名為 KiriPay；技術規格對齊實作；新增 3 個 Must Have 修正項目 |

---

## 1. 產品概述

### 1.1 背景與問題陳述
台灣約有 75 萬名外籍移工（印尼、菲律賓、越南、泰國為主），每月薪資匯款回鄉是剛性需求。現有痛點：
- 傳統銀行匯款手續費高（每筆 300–600 TWD），匯率不透明
- 介面僅有中文或英文，語言障礙造成操作失誤
- 沒有視覺化薪資記錄，難以規劃家鄉生活費

### 1.2 產品目標
打造一個「高信任感、易操作、母語介面」的移工專屬支付 MVP（品牌名：**KiriPay**），讓移工能：
1. 用母語操作全流程
2. 透明試算跨境匯款費用與匯率
3. 視覺化管理薪資發放與家鄉匯出記錄

### 1.3 目標用戶
| 用戶類型 | 描述 |
|---------|------|
| 主要用戶 | 在台移工（印尼、菲律賓、越南、泰國籍） |
| 次要用戶 | 雇主（薪資發放端） |
| 潛在擴展 | 移工家屬（收款端） |

---

## 2. 功能規格

### 2.1 功能優先級（MoSCoW）

| 優先級 | 功能 | 說明 | 狀態 |
|--------|------|------|------|
| Must Have | 多語系切換 | 印尼語、菲律賓語、越南語、泰語、中文、英文 | ✅ 完成 |
| Must Have | 跨境匯款試算器 | 輸入金額 → 顯示費率、到帳金額、預計時間 | ✅ 完成 |
| Must Have | 薪資記錄列表 | 每月薪資發放時間、金額、狀態 | ✅ 完成 |
| Must Have | 匯款紀錄列表 | 歷史匯款記錄、狀態追蹤 | ✅ 完成 |
| Must Have | 匯款送出後更新記錄 | 確認送出後，新記錄即時出現在 History | ✅ 修正 v0.2 |
| Must Have | Mock 資料貨幣一致性 | 歷史記錄貨幣與用戶選擇語言對應 | ✅ 修正 v0.2 |
| Must Have | 餘額動態計算 | 餘額 = 最新薪資 - 本月已匯款總額 | ✅ 修正 v0.2 |
| Should Have | 家鄉生活費規劃 | 設定每月目標匯款金額 | ❌ v2.0 |
| Should Have | 推播通知 | 薪資入帳、匯款到帳提醒 | ❌ v2.0 |
| Could Have | 匯率走勢圖 | 7日/30日匯率趨勢 | ❌ v2.0 |
| Won't Have (v1) | 真實金流串接 | MVP 階段使用 mock data | — |

### 2.2 核心使用流程

```
[首頁] → 選擇語言
    ↓
[薪資總覽] → 顯示本月薪資 / 動態餘額
    ↓
[發起匯款] → 輸入金額 → 試算費用 → 確認 → 送出
    ↓
[匯款記錄] → 即時顯示新記錄 → 查看歷史 → 狀態追蹤
```

### 2.3 多語系規格
```json
{
  "支援語言": ["id", "fil", "vi", "th", "zh", "en"],
  "對應貨幣": {
    "id": "IDR", "fil": "PHP", "vi": "VND",
    "th": "THB", "zh": "TWD", "en": "USD"
  },
  "偵測邏輯": "瀏覽器語言 > 手動選擇 > 預設英文",
  "儲存方式": "localStorage（key: kiripay_lang）"
}
```

### 2.4 匯款試算邏輯（Mock）
```
到帳金額 = 匯入金額 × 匯率 × (1 - 手續費率)
手續費率：
  - < 5,000 TWD：1.2%
  - 5,000–20,000 TWD：0.8%
  - > 20,000 TWD：0.5%
手續費下限：50 TWD
預計到帳時間：1–3 個工作日（mock）
```

### 2.5 餘額計算邏輯
```
當前餘額 = 最新一筆薪資 - 本月已完成匯款總額
（本月 = 當前年月，completed 狀態才計入）
```

---

## 3. UI/UX 規範

### 3.1 設計原則
- **高信任感**：使用深藍色系、圓角卡片、明確的狀態標示
- **易操作性**：大字體（最小 16px）、大按鈕（最小 44px touch target）、步驟清晰
- **親切感**：使用移工熟悉的視覺符號（旗幟、貨幣符號）

### 3.2 色彩規範
```css
--primary: #1A3A6B;       /* 深海藍 - 主色 */
--primary-light: #2563EB; /* 亮藍 - 互動 */
--accent: #10B981;         /* 翠綠 - 成功/收款 */
--warning: #F59E0B;        /* 琥珀 - 待處理 */
--bg: #F0F4FF;             /* 淺藍底 */
--card: #FFFFFF;           /* 白色卡片 */
```

### 3.3 頁面架構
```
App
├── LanguageSelector（首次進入語言選擇）
├── HomePage（薪資總覽 Dashboard）
│   ├── BalanceCard（動態餘額卡片）
│   ├── SalaryHistory（薪資記錄，最新 4 筆）
│   └── 匯率資訊列（即時顯示，mock）
├── SendPage（匯款頁面）
│   ├── RecipientDisplay（收款人，mock 固定為 Family）
│   ├── AmountInput（金額輸入 + 快選按鈕）
│   ├── FeeCalculator（費用試算，即時）
│   ├── ConfirmModal（確認 modal）
│   └── SuccessScreen（成功畫面）
└── HistoryPage（交易記錄）
    ├── FilterTabs（匯款記錄 / 薪資記錄）
    └── TransactionList（動態列表，含新送出記錄）
```

---

## 4. 技術規格

### 4.1 Tech Stack（實際採用）
| 層級 | 技術 | 備註 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | — |
| 樣式 | Tailwind CSS v3 | — |
| 國際化 | 自製 fetch + JSON locale | 原規劃 react-i18next，精簡後移除外部依賴 |
| 狀態管理 | React useState | 原規劃 Context + useReducer，MVP 規模不需要 |
| 路由 | useState state-based routing | 原規劃 React Router v6，MVP 規模不需要 |
| Mock Data | JSON 靜態資料 + 動態 state | — |
| 打包 | Vite | — |

### 4.2 架構說明
MVP 採用單一檔案架構（`MigrantPayApp.tsx`），所有元件定義於同一檔案。
元件化重構列為 v2.0 技術債。

### 4.3 資料結構
```typescript
interface SalaryRecord {
  id: string;
  date: string;        // "YYYY-MM-DD"
  amount: number;      // TWD
  status: 'paid' | 'pending';
}

interface RemittanceRecord {
  id: string;
  date: string;
  sentTWD: number;
  received: number;    // 目標貨幣金額
  currency: string;    // "IDR" | "PHP" | "VND" | "THB" | "USD"
  flag: string;        // emoji
  status: 'completed' | 'processing' | 'failed';
}
```

---

## 5. 驗收標準（Acceptance Criteria）

| 功能 | 驗收條件 | 狀態 |
|------|---------|------|
| 語言切換 | 切換後全頁文字即時更新，含數字格式 | ✅ |
| 匯款試算 | 輸入金額後 < 200ms 顯示費用與到帳金額 | ✅ |
| 薪資記錄 | 正確顯示 6 筆 mock 薪資，含狀態標示 | ✅ |
| 匯款送出 | 點擊確認後顯示成功畫面，History 即時新增一筆記錄 | ✅ v0.2 |
| 貨幣一致性 | History 中顯示的貨幣與用戶選擇語言對應 | ✅ v0.2 |
| 餘額顯示 | 餘額 = 最新薪資 - 本月已匯款，數字正確 | ✅ v0.2 |
| RWD | 在 375px（iPhone SE）正常顯示 | ✅ |

---

## 6. 未來 Roadmap（Post-MVP）

| 版本 | 功能 | 說明 |
|------|------|------|
| v2.0 | 元件化重構 | 拆分 MigrantPayApp.tsx（570行）為獨立元件 |
| v2.0 | 家鄉生活費規劃 | 設定每月目標匯款金額 |
| v2.0 | 匯率走勢圖 | 7日/30日趨勢 |
| v2.1 | 整合 LINE Pay / JKO 支付 | — |
| v3.0 | 串接真實匯款 API | Wise / 中信 Global Remit |
| v3.0 | 推播通知 | 薪資/匯款提醒 |
| v4.0 | 雇主薪資發放端 | B2B 功能 |
| v5.0 | 金管會電子支付機構合規申請 | — |
