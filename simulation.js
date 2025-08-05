// simulation.js
const API_URL_BASE = 'http://localhost:3000'; // Default, bisa di-override
let userVendorData = []; // Data vendor dinamis dari file
let simulationVendors = []; // Vendor yang dipilih untuk simulasi
let lastSimulationResult = null; // Menyimpan hasil simulasi terakhir
let activeSessionFile = 'Tidak ada'; // Menyimpan nama file yang aktif
let forecastChart; 

// Variabel untuk data peramalan yang dinamis
let currentSalesData = [];

// --- FUNGSI UTAMA ---
export function initSimulation() {
    // Event listener... (TETAP SAMA)
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

    // Inisialisasi modul lain
    initForecastChart();
    setupAutomationTooltips();
    document.getElementById('update-forecast-chart-btn').addEventListener('click', updateForecastChartWithUserData);
    
    renderVendorTable();
    renderSimulationPanel();
    updateDashboard();
}

// --- FUNGSI INTERAKSI BACKEND & RIWAYAT (TETAP SAMA) ---
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('vendorFile', file);
    try {
        const response = await fetch(`${API_URL_BASE}/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            alert('File berhasil diunggah!');
            await loadHistory();
            await loadDataFromFile(result.fileName);
        } else { throw new Error(result.message); }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Gagal mengunggah file.');
    }
}

export async function loadHistory() {
    // ... (Fungsi ini tetap sama)
    const list = document.getElementById('history-list');
    list.innerHTML = `<p class="text-sm text-slate-500">Memuat riwayat...</p>`;
    try {
        const response = await fetch(`${API_URL_BASE}/history`);
        const files = await response.json();
        if (files.length === 0) {
            list.innerHTML = `<p class="text-sm text-slate-500">Belum ada riwayat unggahan.</p>`;
        } else {
            list.innerHTML = files.map(file => `<a href="#" data-file-name="${file}" class="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">${file}</a>`).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        list.innerHTML = `<p class="text-sm text-red-500">Gagal memuat riwayat.</p>`;
    }
}

async function loadDataFromFile(fileName) {
    // ... (Fungsi ini tetap sama)
    try {
        const response = await fetch(`${API_URL_BASE}/data/${fileName}`);
        if (!response.ok) throw new Error('File not found on server.');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            let parsedData;
            if (fileName.endsWith('.csv')) {
                parsedData = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
            } else if (fileName.endsWith('.xlsx')) {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                parsedData = XLSX.utils.sheet_to_json(sheet);
            }
            activeSessionFile = fileName;
            processVendorData(parsedData); // Kirim ke fungsi yang diperbarui
        };
        if (fileName.endsWith('.csv')) reader.readAsText(blob);
        else reader.readAsBinaryString(blob);
    } catch (error) {
        console.error('Error loading data file:', error);
        alert(`Gagal memuat data dari file: ${fileName}`);
    }
}

// --- FUNGSI ANALISIS & SIMULASI (LOGIKA DIPERBARUI) ---

/**
 * Memproses data mentah dari file dan mengubahnya menjadi format standar aplikasi.
 * FUNGSI INI TELAH DIPERBARUI untuk menjadi lebih fleksibel terhadap nama kolom.
 * @param {Array<Object>} rawData - Data hasil parsing dari file.
 */
function processVendorData(rawData) {
    if (!rawData || rawData.length === 0) {
        alert("File yang diunggah kosong atau formatnya tidak didukung.");
        return;
    }

    // Pemetaan header yang diharapkan (dalam huruf kecil) ke nama aslinya dari file
    const headerMapping = {};
    const expectedHeaders = {
        'nama vendor': null,
        'tgl pesan': null,
        'tgl kirim janji': null,
        'tgl kirim aktual': null,
        'kualitas lolos': null,
        'harga': null,
    };

    // Ambil header dari baris pertama data dan normalisasikan
    const actualHeaders = Object.keys(rawData[0]);
    actualHeaders.forEach(header => {
        const normalizedHeader = header.trim().toLowerCase();
        if (normalizedHeader in expectedHeaders) {
            headerMapping[normalizedHeader] = header;
        }
    });

    // Validasi apakah semua header yang dibutuhkan ada
    for (const key in expectedHeaders) {
        if (!headerMapping[key]) {
            alert(`Error: Kolom yang dibutuhkan '${key}' tidak ditemukan di dalam file Anda. Silakan periksa kembali file Anda.`);
            return;
        }
    }

    const vendorMap = new Map();
    rawData.forEach(row => {
        // Gunakan mapping untuk mendapatkan nama vendor
        const vendorName = row[headerMapping['nama vendor']];
        if (!vendorName) return;

        if (!vendorMap.has(vendorName)) {
            vendorMap.set(vendorName, { id: vendorName, name: vendorName, transactions: [] });
        }
        
        // Gunakan mapping untuk mendapatkan data lainnya
        vendorMap.get(vendorName).transactions.push({
            tglPesan: row[headerMapping['tgl pesan']],
            tglKirimJanji: row[headerMapping['tgl kirim janji']],
            tglKirimAktual: row[headerMapping['tgl kirim aktual']],
            kualitasLolos: String(row[headerMapping['kualitas lolos']]).trim().toLowerCase() === 'true',
            harga: parseFloat(row[headerMapping['harga']]) || 0
        });
    });

    userVendorData = Array.from(vendorMap.values());

    if(userVendorData.length === 0) {
        alert("Tidak ada data vendor valid yang dapat diproses dari file. Pastikan data terisi dengan benar.");
    }

    renderVendorTable();
    document.getElementById('analyze-vendor-btn').disabled = userVendorData.length === 0;
    simulationVendors = [];
    renderSimulationPanel();
    updateDashboard();
}

// ... SISA FILE simulation.js TETAP SAMA DARI FASE SEBELUMNYA ...
// (Fungsi analyzeVendors, runSourcingSimulation, renderVendorTable, dll. tidak perlu diubah)


function analyzeVendors() {
    if (userVendorData.length === 0) return;
    userVendorData.forEach(vendor => {
        const otdRate = calculateOTD(vendor.transactions);
        const qualityRate = calculateQualityRate(vendor.transactions);
        vendor.otd = otdRate;
        vendor.quality = qualityRate;
        vendor.score = (otdRate * 0.5) + (qualityRate * 0.5);
    });
    userVendorData.sort((a, b) => b.score - a.score);
    renderVendorTable();
    updateDashboard();
}

function runSourcingSimulation() {
    const inputs = document.querySelectorAll('.allocation-input');
    let totalAllocation = 0, projectedQuality = 0, projectedOTD = 0;
    const allocations = Array.from(inputs).map(input => {
        const allocation = parseFloat(input.value) || 0;
        totalAllocation += allocation;
        return { name: input.dataset.vendorName, value: allocation };
    });
    const resultsDiv = document.getElementById('simulation-results');
    if (totalAllocation.toFixed(1) !== '100.0') {
        resultsDiv.innerHTML = `<p class="text-red-500 font-bold">Error: Total alokasi harus 100%. Saat ini: ${totalAllocation}%</p>`;
        return;
    }
    allocations.forEach(alloc => {
        const vendor = simulationVendors.find(v => v.name === alloc.name);
        if (vendor) {
            projectedQuality += (vendor.quality || 0) * (alloc.value / 100);
            projectedOTD += (vendor.otd || 0) * (alloc.value / 100);
        }
    });
    resultsDiv.innerHTML = `<p class="font-semibold">Hasil Proyeksi Gabungan:</p><ul class="list-disc list-inside mt-2 space-y-1"><li><span class="font-medium">Kualitas:</span> <span class="font-bold text-green-600 dark:text-green-400">${projectedQuality.toFixed(2)}%</span></li><li><span class="font-medium">OTD:</span> <span class="font-bold text-green-600 dark:text-green-400">${projectedOTD.toFixed(2)}%</span></li></ul>`;
    lastSimulationResult = { projectedQuality, projectedOTD };
    updateDashboard();
}

function renderVendorTable() {
    const tbody = document.querySelector('#vendorTable tbody');
    tbody.innerHTML = '';
    document.getElementById('vendor-table-placeholder').classList.toggle('hidden', userVendorData.length > 0);
    userVendorData.forEach(vendor => {
        const row = document.createElement('tr');
        const isSelected = simulationVendors.some(sv => sv.id === vendor.id);
        const otd = vendor.otd !== undefined ? `${vendor.otd.toFixed(1)}%` : '-';
        const quality = vendor.quality !== undefined ? `${vendor.quality.toFixed(1)}%` : '-';
        const score = vendor.score !== undefined ? vendor.score.toFixed(1) : '-';
        row.innerHTML = `<td class="p-3 text-center"><input type="checkbox" class="vendor-select-checkbox w-4 h-4" data-vendor-name="${vendor.name}" ${isSelected ? 'checked' : ''}></td><td class="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium">${vendor.name}</td><td class="p-3 text-sm">${otd}</td><td class="p-3 text-sm">${quality}</td><td class="p-3 text-sm font-bold text-blue-500">${score}</td>`;
        tbody.appendChild(row);
    });
}

function calculateOTD(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    const onTime = transactions.filter(t => new Date(t.tglKirimAktual) <= new Date(t.tglKirimJanji)).length;
    return (onTime / transactions.length) * 100;
}

function calculateQualityRate(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    const passes = transactions.filter(t => t.kualitasLolos).length;
    return (passes / transactions.length) * 100;
}

function handleVendorSelection(event) {
    if (!event.target.classList.contains('vendor-select-checkbox')) return;
    const vendorName = event.target.dataset.vendorName;
    const vendor = userVendorData.find(v => v.name === vendorName);
    if (event.target.checked) {
        if (!simulationVendors.some(sv => sv.id === vendor.id)) simulationVendors.push(vendor);
    } else {
        simulationVendors = simulationVendors.filter(sv => sv.id !== vendor.id);
    }
    renderSimulationPanel();
}

function renderSimulationPanel() {
    const listContainer = document.getElementById('simulation-vendor-list');
    const controlsContainer = document.getElementById('simulation-controls');
    listContainer.innerHTML = '';
    if (simulationVendors.length === 0) {
        listContainer.innerHTML = `<p class="text-sm text-center text-slate-500 dark:text-slate-400 py-8">Pilih vendor dari tabel untuk memulai simulasi.</p>`;
        controlsContainer.classList.add('hidden');
    } else {
        simulationVendors.forEach(vendor => {
            const vendorDiv = document.createElement('div');
            vendorDiv.className = 'p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm';
            vendorDiv.innerHTML = `<div class="flex justify-between items-center"><p class="font-semibold text-sm">${vendor.name}</p><p class="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">Skor: ${vendor.score ? vendor.score.toFixed(1) : 'N/A'}</p></div><div class="mt-2"><label class="text-xs text-slate-500">Alokasi (%):</label><input type="number" class="allocation-input w-full mt-1 p-1.5 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm" data-vendor-name="${vendor.name}" min="0" max="100" placeholder="e.g., 60"></div>`;
            listContainer.appendChild(vendorDiv);
        });
        controlsContainer.classList.remove('hidden');
    }
}

function updateDashboard() {
    const kpiAvgScore = document.getElementById('kpi-avg-score');
    const kpiAvgOtd = document.getElementById('kpi-avg-otd');
    const kpiAvgQuality = document.getElementById('kpi-avg-quality');
    const kpiActiveSession = document.getElementById('kpi-active-session');
    kpiActiveSession.textContent = activeSessionFile;
    if (userVendorData.length > 0 && userVendorData[0].score !== undefined) {
        const totalScore = userVendorData.reduce((sum, v) => sum + v.score, 0);
        const totalOtd = userVendorData.reduce((sum, v) => sum + v.otd, 0);
        const totalQuality = userVendorData.reduce((sum, v) => sum + v.quality, 0);
        kpiAvgScore.textContent = (totalScore / userVendorData.length).toFixed(1);
        kpiAvgOtd.textContent = `${(totalOtd / userVendorData.length).toFixed(1)}%`;
        kpiAvgQuality.textContent = `${(totalQuality / userVendorData.length).toFixed(1)}%`;
        const topVendorsContainer = document.getElementById('widget-top-vendors');
        const bottomVendorsContainer = document.getElementById('widget-bottom-vendors');
        topVendorsContainer.innerHTML = '';
        bottomVendorsContainer.innerHTML = '';
        const sortedByScore = [...userVendorData].sort((a, b) => b.score - a.score);
        sortedByScore.slice(0, 3).forEach(v => topVendorsContainer.innerHTML += vendorWidgetHTML(v));
        sortedByScore.slice(-3).reverse().forEach(v => bottomVendorsContainer.innerHTML += vendorWidgetHTML(v));
    } else {
        kpiAvgScore.textContent = '-';
        kpiAvgOtd.textContent = '-';
        kpiAvgQuality.textContent = '-';
        document.getElementById('widget-top-vendors').innerHTML = '';
        document.getElementById('widget-bottom-vendors').innerHTML = '';
    }
    const lastSimContainer = document.getElementById('widget-last-simulation');
    if (lastSimulationResult) {
        lastSimContainer.innerHTML = `<p class="font-semibold text-slate-800 dark:text-slate-200">Hasil Proyeksi Gabungan:</p><ul class="list-disc list-inside mt-2 space-y-1 text-sm"><li><span class="font-medium">Kualitas:</span> <span class="font-bold text-green-600 dark:text-green-400">${lastSimulationResult.projectedQuality.toFixed(2)}%</span></li><li><span class="font-medium">OTD:</span> <span class="font-bold text-green-600 dark:text-green-400">${lastSimulationResult.projectedOTD.toFixed(2)}%</span></li></ul>`;
    }
}

function vendorWidgetHTML(vendor) {
    return `<div class="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"><span class="font-medium text-slate-700 dark:text-slate-300">${vendor.name}</span><span class="font-bold text-blue-500">${vendor.score.toFixed(1)}</span></div>`;
}
