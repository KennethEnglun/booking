# 場地預約系統

這是一個智能場地預約系統，支援表單預約和 AI 對話式預約。

## 系統架構

- **前端**: React + Vite (部署到 Netlify)
- **後端**: Node.js + Express + PostgreSQL (部署到 Railway)

## 功能特色

- 📅 表單式預約：傳統的表單界面，支援多日期預約
- 🤖 AI 對話預約：自然語言處理，支援中文對話
- 📊 時間表查看：查看所有預約，支援篩選功能
- 🔒 時間衝突檢測：自動檢查並防止重複預約
- 📱 響應式設計：支援桌面和移動設備

## 本地開發

### 前端開發

```bash
cd frontend
npm install
npm run dev
```

前端將運行在 http://localhost:3000

### 後端開發

```bash
cd backend
npm install
cp env.example .env
# 編輯 .env 文件，設定資料庫連接等
npm run dev
```

後端將運行在 http://localhost:5000

## 部署

### 前端部署 (Netlify)

1. 將 `frontend` 目錄推送到 GitHub
2. 在 Netlify 中連接 GitHub 倉庫
3. 設定環境變數：
   - `VITE_API_URL`: 後端 API URL
4. 部署設定：
   - Build command: `npm run build`
   - Publish directory: `dist`

### 後端部署 (Railway)

1. 將 `backend` 目錄推送到 GitHub
2. 在 Railway 中連接 GitHub 倉庫
3. 設定環境變數：
   - `DATABASE_URL`: PostgreSQL 連接字串
   - `JWT_SECRET`: JWT 密鑰
   - `FRONTEND_URL`: 前端 URL
   - `NODE_ENV`: production

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

## 技術棧

### 前端
- React 18
- Vite
- Tailwind CSS
- Day.js
- Axios

### 後端
- Node.js
- Express
- PostgreSQL
- JWT
- bcryptjs

## 環境變數

### 前端 (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### 後端 (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/venue_booking
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 開發注意事項

1. 確保 PostgreSQL 資料庫已啟動
2. 前端和後端需要同時運行
3. 檢查 CORS 設定是否正確
4. 確保環境變數已正確設定

## 授權

MIT License 