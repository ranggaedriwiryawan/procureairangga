const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Direktori untuk menyimpan file yang diunggah
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

app.use(cors());
app.use(express.json());

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Gunakan nama file asli untuk kemudahan identifikasi
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// === ENDPOINTS API ===

// Task 2.1: Endpoint untuk mengunggah file
app.post('/upload', upload.single('vendorFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
    }
    res.json({
        success: true,
        message: 'File berhasil diunggah!',
        fileName: req.file.filename
    });
});

// Task 2.1: Endpoint untuk mendapatkan riwayat file
app.get('/history', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal membaca riwayat file.' });
        }
        // Urutkan file dari yang terbaru
        const sortedFiles = files.filter(file => file.endsWith('.csv') || file.endsWith('.xlsx')).reverse();
        res.json(sortedFiles);
    });
});

// Task 2.1: Endpoint untuk mengambil konten file spesifik
app.get('/data/:fileName', (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(UPLOADS_DIR, fileName);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    }
});


app.listen(PORT, () => {
    console.log(`Backend server berjalan di http://localhost:${PORT}`);
});