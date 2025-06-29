const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// 安全中間件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 15 分鐘內最多 100 個請求
  message: '請求過於頻繁，請稍後再試。'
});
app.use(limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 基本 API 端點（不依賴資料庫）
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API 服務正常運行',
    timestamp: new Date().toISOString()
  });
});

// 模擬預約 API（暫時使用記憶體存儲）
let mockBookings = [];

app.get('/api/bookings', (req, res) => {
  res.json(mockBookings);
});

app.post('/api/bookings', (req, res) => {
  const booking = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  mockBookings.push(booking);
  res.status(201).json(booking);
});

app.post('/api/bookings/check-conflict', (req, res) => {
  const { venue, date, startTime, endTime } = req.body;
  
  // 簡單的衝突檢查
  const hasConflict = mockBookings.some(booking => 
    booking.venue === venue && 
    booking.booking_date === date &&
    ((startTime < booking.end_time && endTime > booking.start_time))
  );
  
  res.json({ 
    hasConflict,
    conflictingBookings: hasConflict ? mockBookings.filter(b => 
      b.venue === venue && b.booking_date === date
    ) : []
  });
});

// 模擬認證 API
app.get('/api/auth/me', (req, res) => {
  res.json({
    id: 'default',
    username: '訪客',
    email: 'guest@example.com',
    created_at: new Date().toISOString()
  });
});

// API 路由
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '找不到請求的資源',
    path: req.originalUrl 
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('服務器錯誤:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: '無效的 JSON 格式' 
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服務器內部錯誤' 
      : err.message
  });
});

// 啟動服務器
async function startServer() {
  try {
    // 初始化資料庫
    await initializeDatabase();
    console.log('資料庫初始化完成');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服務器運行在端口 ${PORT}`);
      console.log(`健康檢查: http://localhost:${PORT}/health`);
      console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('啟動服務器失敗:', error);
    process.exit(1);
  }
}

startServer(); 