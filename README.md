# 場地預約系統

這是一個使用 React 和 Node.js 打造的現代化場地預約系統。

## 系統架構

*   **前端**: React + Vite
*   **後端**: Node.js + Express
*   **資料庫**: PostgreSQL
*   **部署平台**: 全部署於 Railway (Monorepo)

## 功能特色

*   📅 **直觀的預約介面**：在同一個畫面上進行預約與查看現有行程。
*   🗓️ **多日預約**：一次操作即可預約多個不連續的日期。
*   🔍 **時間表篩選**：依場地或日期快速篩選查詢預約。
*   🔒 **時間衝突檢測**：後端自動檢查並防止重複預約。
*   📱 **響應式設計**：完美適配桌面和移動設備。

## Railway 部署 (Monorepo)

本專案被設定為一個 Monorepo，前端、後端和資料庫都部署在同一個 Railway 專案中。

1.  **Fork 並 Clone 專案**：
    將此 GitHub 儲存庫 Fork 到您自己的帳號下，然後 Clone 到本地。

2.  **在 Railway 上建立專案**：
    *   登入 Railway，點選 "New Project"。
    *   選擇 "Deploy from GitHub repo"，然後選擇您剛剛 Fork 的儲存庫。
    *   Railway 會自動偵測根目錄下的 `railway.json` 檔案，並為您設定 `frontend` 和 `backend` 兩個服務。

3.  **加入 PostgreSQL 資料庫**：
    *   在您的 Railway 專案儀表板，點選 "New"。
    *   選擇 "Database"，然後選擇 "PostgreSQL"。
    *   Railway 會自動建立資料庫，並將 `DATABASE_URL` 這個環境變數注入到您的 `backend` 服務中。

4.  **設定環境變數**：
    *   **後端 (`backend`)**：
        *   `JWT_SECRET`: 設定一個您自己的 JWT 密鑰。
        *   `FRONTEND_URL`: 到 `frontend` 服務的 "Settings" 分頁，複製它的公開網址，然後貼到這裡。
    *   **前端 (`frontend`)**：
        *   `VITE_API_URL`: 到 `backend` 服務的 "Settings" 分頁，複製它的公開網址，然後貼到這裡。記得在網址後面加上 `/api`。

5.  **觸發部署**：
    完成以上設定後，您可以手動觸發一次部署，或將一個新的 commit 推送到 GitHub，Railway 就會自動為您建置並啟動所有服務。

## 本地開發

### 前端開發

```bash
cd frontend
npm install
npm run dev
```
前端將運行在 `http://localhost:5173` (或 Vite 指定的其他埠號)。

### 後端開發
```bash
cd backend
npm install
cp env.example .env
```
編輯 `.env` 檔案，設定本地 PostgreSQL 資料庫的 `DATABASE_URL` 和其他變數，然後啟動：
```bash
npm run dev
```
後端將運行在 `http://localhost:5000`。

## 技術棧

### 前端
*   React 18, Vite, Tailwind CSS, Day.js, Axios, Serve

### 後端
*   Node.js, Express, PostgreSQL, JWT, bcryptjs

## 資料庫設定

系統使用 PostgreSQL 資料庫，需要以下表：

- `users`: 用戶表
- `bookings`: 預約表

資料庫會在首次啟動時自動初始化。

## API 端點

### 預約相關
- `GET /api/bookings` - 獲取所有預約
- `POST /api/bookings` - 創建新預約
- `PUT /api/bookings/:id` - 更新預約
- `DELETE /api/bookings/:id` - 刪除預約
- `POST /api/bookings/check-conflict` - 檢查時間衝突

### 認證相關
- `GET /api/auth/me` - 獲取當前用戶
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出

## 開發注意事項

1. 確保 PostgreSQL 資料庫已啟動
2. 前端和後端需要同時運行
3. 檢查 CORS 設定是否正確
4. 確保環境變數已正確設定

## 授權

MIT License 