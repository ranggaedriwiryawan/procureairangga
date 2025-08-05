// simulation.js

// Impor data statis untuk modul yang dipulihkan
import { historicalSales as defaultHistoricalSales, automationSteps } from './data.js';

const API_URL_BASE = 'http://localhost:3000'; 
let userVendorData = []; 
let simulationVendors = [];
let lastSimulationResult = null;
let activeSessionFile = 'Tidak ada';
let forecastChart; 

// Variabel baru untuk data peramalan yang dinamis
let currentSalesData = [...defaultHistoricalSales];

// --- FUNGSI UTAMA ---
export function initSimulation() {
    // --- Inisialisasi Modul Analisis & Simulasi Vendor (TETAP) ---
    document.getElementById('vendor-file-input').addEventListener('change', (e) => handleFileUpload(e));
    document.getElementById('analyze-vendor-btn').addEventListener('click', analyzeVendors);
    document.querySelector('#vendorTable tbody').addEventListener('change', handleVendorSelection);
    document.getElementById('simulation-panel').addEventListener('click', (e) => {
        if (e.target && e.target.id === 'run-simulation-btn') runSourcingSimulation();
    });
    document.getElementById('history-list').addEventListener('click', (e) => {
        if (e.target && e.target.dataset.fileName) {
            e.preventDefault();
            loadDataFromFile(e.target.dataset.fileName);
        }
    });
    renderVendorTable();
    renderSimulationPanel();

    // --- Inisialisasi Modul Lain yang Dipulihkan ---
    initForecastChart();
    setupAutomationTooltips();
    // Tambahkan event listener untuk tombol update peramalan
    document.getElementById('update-forecast-chart-btn').addEventListener('click', updateForecastChartWithUserData);
    
    updateDashboard();
}


// --- FUNGSI MODUL PERAMALAN (DIPERBARUI) ---
function updateForecastChartWithUserData() {
    const userInput = document.getElementById('user-forecast-data').value;
    
    if (!userInput.trim()) {
        // Jika input kosong, gunakan data default
        currentSalesData = [...defaultHistoricalSales];
    } else {
        // Jika ada input, proses
        const newData = userInput.split(',').map(item => parseFloat(item.trim())).filter(num => !isNaN(num));
        if (newData.length === 0) {
            alert('Format data tidak valid. Pastikan Anda menggunakan angka yang dipisahkan koma.');
            return;
        }
        currentSalesData = newData;
    }
    
    // Inisialisasi ulang grafik dengan data baru
    initForecastChart();
}

function initForecastChart() {
    if (forecastChart) {
        forecastChart.destroy();
    }
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    // Gunakan currentSalesData sebagai dasar peramalan
    const traditionalForecast = currentSalesData.map(s => s * (1 + (Math.random() - 0.5) * 0.4));
    const forecastLabels = Array.from({ length: currentSalesData.length }, (_, i) => `Periode ${i + 1}`);

    const gridColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = document.documentElement.classList.contains('dark') ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)';

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastLabels,
            datasets: [{
                label: 'Penjualan Aktual',
                data: currentSalesData, // Gunakan data dinamis
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }, {
                label: 'Peramalan Tradisional',
                data: traditionalForecast,
                borderColor: 'rgb(239, 68, 68)',
                borderDash: [5, 5],
                tension: 0.3
            }]
        },
        options: { /* ... (tidak berubah) ... */ }
    });

    document.getElementById('accuracy-traditional').textContent = '78.5'; // Nilai simulasi statis
    document.getElementById('accuracy-ai').textContent = '-';
    // Hapus event listener lama dan tambahkan yang baru untuk mencegah duplikasi
    const applyAiBtn = document.getElementById('apply-ai-btn');
    const newApplyAiBtn = applyAiBtn.cloneNode(true);
    applyAiBtn.parentNode.replaceChild(newApplyAiBtn, applyAiBtn);
    newApplyAiBtn.addEventListener('click', applyAiForecast, { once: true }); // {once: true} untuk mencegah klik ganda
}

function applyAiForecast() {
    // Gunakan currentSalesData sebagai dasar peramalan AI
    const aiForecast = currentSalesData.map(s => s * (1 + (Math.random() - 0.5) * 0.1));
    
    forecastChart.data.datasets.push({
        label: 'Peramalan AI',
        data: aiForecast,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3
    });
    forecastChart.update();
    document.getElementById('accuracy-ai').textContent = '96.2'; // Nilai simulasi statis
    this.disabled = true;
    this.classList.add('opacity-50', 'cursor-not-allowed');
}


// --- FUNGSI MODUL OTOMATISASI (TETAP) ---
function setupAutomationTooltips() { /* ... (tidak berubah) ... */ }


// --- FUNGSI INTERAKSI BACKEND & RIWAYAT (TETAP) ---
async function handleFileUpload(event) { /* ... (tidak berubah) ... */ }
export async function loadHistory() { /* ... (tidak berubah) ... */ }
async function loadDataFromFile(fileName) { /* ... (tidak berubah) ... */ }


// --- FUNGSI ANALISIS & SIMULASI (TETAP) ---
function processVendorData(rawData) { /* ... (tidak berubah) ... */ }
function analyzeVendors() { /* ... (tidak berubah) ... */ }
function runSourcingSimulation() { /* ... (tidak berubah) ... */ }


// --- FUNGSI RENDER & UPDATE UI (TETAP) ---
function renderVendorTable() { /* ... (tidak berubah) ... */ }
function calculateOTD(transactions) { /* ... (tidak berubah) ... */ }
function calculateQualityRate(transactions) { /* ... (tidak berubah) ... */ }
function handleVendorSelection(event) { /* ... (tidak berubah) ... */ }
function renderSimulationPanel() { /* ... (tidak berubah) ... */ }


// --- FUNGSI DASHBOARD (TETAP) ---
function updateDashboard() { /* ... (tidak berubah) ... */ }
function vendorWidgetHTML(vendor) { /* ... (tidak berubah) ... */ }