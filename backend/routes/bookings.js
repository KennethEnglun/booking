const express = require('express');
const { pool } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 獲取所有預約
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.venue,
        b.purpose,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.user_id,
        b.person_in_charge,
        u.username
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.booking_date ASC, b.start_time ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('獲取預約失敗:', error);
    res.status(500).json({ error: '獲取預約失敗' });
  }
});

// 獲取特定預約
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        b.*,
        u.username
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到預約' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('獲取預約失敗:', error);
    res.status(500).json({ error: '獲取預約失敗' });
  }
});

// 創建新預約
router.post('/', async (req, res) => {
  try {
    const {
      venue,
      booking_date,
      start_time,
      end_time,
      purpose,
      person_in_charge,
      user_id
    } = req.body;

    // 驗證必填欄位
    if (!venue || !booking_date || !start_time || !end_time || !person_in_charge) {
      return res.status(400).json({ 
        error: '缺少必填欄位：場地、日期、開始時間、結束時間、負責人' 
      });
    }

    // 驗證時間邏輯
    if (start_time >= end_time) {
      return res.status(400).json({ 
        error: '結束時間必須晚於開始時間' 
      });
    }

    // 檢查日期是否為未來日期
    const bookingDate = new Date(booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({ 
        error: '只能預約未來日期' 
      });
    }

    // 檢查時間衝突
    const conflictQuery = `
      SELECT id FROM bookings 
      WHERE venue = $1 
        AND booking_date = $2 
        AND (
          (start_time < $3 AND end_time > $3) OR
          (start_time < $4 AND end_time > $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    
    const conflictResult = await pool.query(conflictQuery, [
      venue, booking_date, start_time, end_time
    ]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ 
        error: '該時段已被預約，請選擇其他時間' 
      });
    }

    // 創建預約
    const insertQuery = `
      INSERT INTO bookings (
        id, venue, booking_date, start_time, end_time, 
        purpose, person_in_charge, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const bookingId = uuidv4();
    const result = await pool.query(insertQuery, [
      bookingId,
      venue,
      booking_date,
      start_time,
      end_time,
      purpose || '未提供',
      person_in_charge,
      user_id || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('創建預約失敗:', error);
    res.status(500).json({ error: '創建預約失敗' });
  }
});

// 更新預約
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      venue,
      booking_date,
      start_time,
      end_time,
      purpose,
      person_in_charge
    } = req.body;

    // 檢查預約是否存在
    const checkQuery = 'SELECT * FROM bookings WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到預約' });
    }

    // 驗證時間邏輯
    if (start_time && end_time && start_time >= end_time) {
      return res.status(400).json({ 
        error: '結束時間必須晚於開始時間' 
      });
    }

    // 檢查時間衝突（排除當前預約）
    if (venue && booking_date && start_time && end_time) {
      const conflictQuery = `
        SELECT id FROM bookings 
        WHERE id != $1 
          AND venue = $2 
          AND booking_date = $3 
          AND (
            (start_time < $4 AND end_time > $4) OR
            (start_time < $5 AND end_time > $5) OR
            (start_time >= $4 AND end_time <= $5)
          )
      `;
      
      const conflictResult = await pool.query(conflictQuery, [
        id, venue, booking_date, start_time, end_time
      ]);

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({ 
          error: '該時段已被預約，請選擇其他時間' 
        });
      }
    }

    // 更新預約
    const updateQuery = `
      UPDATE bookings 
      SET 
        venue = COALESCE($2, venue),
        booking_date = COALESCE($3, booking_date),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        purpose = COALESCE($6, purpose),
        person_in_charge = COALESCE($7, person_in_charge),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      id, venue, booking_date, start_time, end_time, purpose, person_in_charge
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新預約失敗:', error);
    res.status(500).json({ error: '更新預約失敗' });
  }
});

// 刪除預約
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteQuery = 'DELETE FROM bookings WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到預約' });
    }
    
    res.json({ message: '預約已成功刪除' });
  } catch (error) {
    console.error('刪除預約失敗:', error);
    res.status(500).json({ error: '刪除預約失敗' });
  }
});

// 檢查時間衝突
router.post('/check-conflict', async (req, res) => {
  try {
    const { venue, date, startTime, endTime } = req.body;

    if (!venue || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        error: '缺少必填欄位：場地、日期、開始時間、結束時間' 
      });
    }

    const conflictQuery = `
      SELECT id FROM bookings 
      WHERE venue = $1 
        AND booking_date = $2 
        AND (
          (start_time < $3 AND end_time > $3) OR
          (start_time < $4 AND end_time > $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    
    const result = await pool.query(conflictQuery, [
      venue, date, startTime, endTime
    ]);

    res.json({ 
      hasConflict: result.rows.length > 0,
      conflictingBookings: result.rows
    });
  } catch (error) {
    console.error('檢查時間衝突失敗:', error);
    res.status(500).json({ error: '檢查時間衝突失敗' });
  }
});

module.exports = router; 