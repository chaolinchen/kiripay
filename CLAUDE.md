# MigrantPay_App — 移工跨境匯款 App

## 專案目標
針對在台灣的外籍移工（印尼、菲律賓、越南、泰國）設計的 MVP 支付應用，提供多語系匯款試算、薪資記錄查詢。

## 技術棧
- React 18 + TypeScript + Tailwind CSS + Vite
- 多語系：6 種語言 JSON 檔案（public/locales/）
- 無後端，全 mock 資料

## 常用指令
```bash
npm run dev      # 開發伺服器
npm run build    # 生產建置
npm run preview  # 預覽 build
```

## 目前狀態（2026-03-30）
- 6 語系切換完整（印尼/菲律賓/越南/泰語/繁中/英）
- Dashboard、匯款流程、交易記錄頁面完整
- 響應式設計（mobile-first，375px）
- 已有 PRD 文件：PRD_MigrantFriendlyPay.md
- 已有 production build

## 已知問題 / 待完成
- 全為 mock 資料，無後端 API
- 無用戶認證系統
- 無真實金流串接（LINE Pay、匯款 API）
- 無推播通知
- 無匯率走勢圖
- 所有邏輯集中在 `MigrantPayApp.tsx`（570行），尚未組件化

## 匯款費率邏輯
- < 5,000 TWD：1.2%，最低 50 TWD
- 5,000–20,000 TWD：0.8%
- > 20,000 TWD：0.5%
