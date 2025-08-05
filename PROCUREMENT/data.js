// data.js

// Data untuk simulasi Peramalan Permintaan
export const historicalSales = [210, 230, 250, 280, 320, 450, 300, 310, 340, 380, 480, 650, 350, 370, 390, 410, 450, 600, 440, 460, 500, 550, 650, 850];
export const forecastLabels = Array.from({ length: 24 }, (_, i) => `Bulan ${i + 1}`);

// Data untuk teks tooltip pada Visualisasi Otomatisasi
export const automationSteps = {
    1: "AI memvalidasi permintaan berdasarkan histori dan budget.",
    2: "Sistem secara otomatis meneruskan permintaan ke manajer yang relevan.",
    3: "AI merekomendasikan vendor terbaik berdasarkan skor performa.",
    4: "Purchase Order (PO) dibuat dan dikirim ke vendor secara digital.",
    5: "AI melakukan OCR pada surat jalan dan memverifikasi dengan PO.",
    6: "Setelah verifikasi cocok, sistem menjadwalkan pembayaran otomatis."
};