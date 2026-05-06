require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('./')); // Serve frontend

const rawDbUrl = process.env.DATABASE_URL || '';
// Bỏ ?sslmode=require để pg không bị lỗi warning tự parse và đè cấu hình SSL
const cleanDbUrl = rawDbUrl.split('?')[0];

const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false }
});

// Init Table
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prompts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                content TEXT,
                description TEXT,
                tags JSONB,
                "isFavorite" BOOLEAN DEFAULT false,
                "usageCount" INTEGER DEFAULT 0,
                "lastUsed" TIMESTAMP,
                versions JSONB,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Database 'prompts' initialized");
    } catch (err) {
        console.error("❌ Database error:", err);
    }
};
initDB();

// Lấy danh sách
app.get('/api/prompts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM prompts ORDER BY "updatedAt" DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lưu / Cập nhật mảng prompts (Sync)
app.post('/api/prompts/sync', async (req, res) => {
    const client = await pool.connect();
    try {
        const prompts = req.body;
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE prompts RESTART IDENTITY');
        
        for (const p of prompts) {
            await client.query(`
                INSERT INTO prompts (
                    title, category, content, description, tags, 
                    "isFavorite", "usageCount", "lastUsed", versions, "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                p.title, p.category, p.content, p.description, 
                JSON.stringify(p.tags || []), 
                p.isFavorite || false, 
                p.usageCount || 0, 
                p.lastUsed || null, 
                JSON.stringify(p.versions || []), 
                p.updatedAt || new Date().toISOString()
            ]);
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
