// simulation.js

// Impor data statis untuk modul yang dipulihkan
import { historicalSales as defaultHistoricalSales, automationSteps } from './data.js';

const API_URL_BASE = 'http://localhost:3000';
let userVendorData = [];
let simulationVendors = [];
let lastSimulationResult = null;
let activeSessionFile = 'Tidak ada';
let forecastChart;
let currentSalesData = [...defaultHistoricalSales];
let isForecastChartInitialized = false; // Penanda untuk mencegah render ulang

// --- FUNGSI UTAMA ---
export function initSimulation() {
    console.log("Platform Simulasi diinisialisasi..."); // Pesan untuk debugging

    // --- Alur Kerja Unggah File ---
    const fileInput = document.getElementById('vendor-file-input');
    const uploadBtn = document.getElementById('upload-file-btn');
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) uploadBtn.classList.remove('hidden');
        else uploadBtn.classList.add('hidden');
    });

    uploadBtn.addEventListener('click', () => {
        handleFileUpload(fileInput.files[0]);
        uploadBtn.classList.add('hidden');
    });

    // Event listener lainnya...
    document.getElementById('analyze-vendor-btn').addEventListener('click', analyzeVendors);
    document.querySelector('#vendorTable tbody').addEventListener('change', handleVendorSelection);
    document.getElementById('simulation-panel').addEventListener('click', (e) => {
        if (e.target.id === 'run-simulation-btn') runSourcingSimulation();
    });
    document.getElementById('history-list').addEventListener('click', (e) => {
        if (e.target.dataset.fileName) {
            e.preventDefault();
            loadDataFromFile(e.target.dataset.fileName);
        }
    });
    document.getElementById('update-forecast-chart-btn').addEventListener('click', updateForecastChartWithUserData);

    setupAutomationTooltips();
    renderVendorTable();
    renderSimulationPanel();
    updateDashboard();
}

// Fungsi ini dipanggil dari main.js setiap kali tab diganti
export function handleTabClick(tabId) {
    if (tabId === 'forecast' && !isForecastChartInitialized) {
        initForecastChart();
    }
}

// --- FUNGSI MODUL PERAMALAN (DIPERBAIKI) ---
function updateForecastChartWithUserData() {
    const userInput = document.getElementById('user-forecast-data').value;
    
    if (!userInput.trim()) {
        currentSalesData = [...defaultHistoricalSales];
    } else {
        const newData = userInput.split(',').map(item => parseFloat(item.trim())).filter(num => !isNaN(num));
        if (newData.length === 0) {
            alert('Format data tidak valid.');
            return;
        }
        currentSalesData = newData;
    }
    
    // Hancurkan chart lama dan render ulang
    if (forecastChart) forecastChart.destroy();
    isForecastChartInitialized = false; // Izinkan render ulang saat tab diklik
    initForecastChart();
}

function initForecastChart() {
    if (isForecastChartInitialized) return; // Jangan render jika sudah ada

    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;

    if (forecastChart) forecastChart.destroy();

    const traditionalForecast = currentSalesData.map(s => s * (1 + (Math.random() - 0.5) * 0.4));
    const forecastLabels = Array.from({ length: currentSalesData.length }, (_, i) => `Periode ${i + 1}`);

    const gridColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = document.documentElement.classList.contains('dark') ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)';

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastLabels,
            datasets: [
                {
                    label: 'Penjualan Aktual',
                    data: currentSalesData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Peramalan Tradisional',
                    data: traditionalForecast,
                    borderColor: 'rgb(239, 68, 68)',
                    borderDash: [5, 5],
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: textColor }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: { legend: { labels: { color: textColor } } }
        }
    });

    document.getElementById('accuracy-traditional').textContent = '78.5';
    document.getElementById('accuracy-ai').textContent = '-';
    
    const applyAiBtn = document.getElementById('apply-ai-btn');
    const newApplyAiBtn = applyAiBtn.cloneNode(true);
    applyAiBtn.parentNode.replaceChild(newApplyAiBtn, applyAiBtn);
    newApplyAiBtn.addEventListener('click', applyAiForecast);

    isForecastChartInitialized = true;
}

function applyAiForecast() {
    if (forecastChart.data.datasets.some(d => d.label === 'Peramalan AI')) return;

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
    document.getElementById('accuracy-ai').textContent = '96.2';
    this.disabled = true;
    this.classList.add('opacity-50', 'cursor-not-allowed');
}

// ... SISA FILE simulation.js TETAP SAMA SEPERTI SEBELUMNYA ...

function setupAutomationTooltips() {
    const steps = document.querySelectorAll('.automation-step');
    const tooltip = document.getElementById('automation-tooltip');
    if (!tooltip) return; // Pengaman

    steps.forEach(step => {
        step.addEventListener('mouseenter', (event) => {
            const stepNumber = event.currentTarget.dataset.step;
            tooltip.textContent = automationSteps[stepNumber];
            tooltip.classList.remove('hidden');
        });
        
        step.addEventListener('mousemove', (event) => {
            tooltip.style.left = `${event.pageX + 15}px`;
            tooltip.style.top = `${event.pageY + 15}px`;
        });

        step.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    });
}
async function handleFileUpload(file) {
    if (!file) {
        alert("Silakan pilih file terlebih dahulu.");
        return;
    }
    const formData = new FormData();
    formData.append('vendorFile', file);
    try {
        const response = await fetch(`${API_URL_BASE}/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            alert('File berhasil diunggah! Memproses data...');
            await loadHistory();
            await loadDataFromFile(result.fileName);
        } else { throw new Error(result.message); }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Gagal mengunggah file. Pastikan server backend berjalan.');
    }
}
export async function loadHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = `<p class="text-sm text-slate-500">Memuat riwayat...</p>`;
    try {
        const response = await fetch(`${API_URL_BASE}/history`);
        if (!response.ok) throw new Error('Gagal terhubung ke server.');
        const files = await response.json();
        if (files.length === 0) {
            list.innerHTML = `<p class="text-sm text-slate-500">Belum ada riwayat unggahan.</p>`;
        } else {
            list.innerHTML = files.map(file => `<a href="#" data-file-name="${file}" class="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">${file}</a>`).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        list.innerHTML = `<p class="text-sm text-red-500">Gagal memuat riwayat. Pastikan server backend berjalan.</p>`;
    }
}
async function loadDataFromFile(fileName) {
    try {
        const response = await fetch(`${API_URL_BASE}/data/${fileName}`);
        if (!response.ok) throw new Error('File tidak ditemukan di server.');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let parsedData;
                if (fileName.endsWith('.csv')) {
                    const parseResult = Papa.parse(data, { header: true, skipEmptyLines: true });
                    if (parseResult.errors.length > 0) {
                        console.error("CSV Parsing Errors:", parseResult.errors);
                        throw new Error("Gagal mem-parsing file CSV. Periksa format file.");
                    }
                    parsedData = parseResult.data;
                } else if (fileName.endsWith('.xlsx')) {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    parsedData = XLSX.utils.sheet_to_json(sheet);
                }
                activeSessionFile = fileName;
                processVendorData(parsedData);
            } catch (processingError) {
                 console.error('Error processing file content:', processingError);
                 alert(`Terjadi kesalahan saat memproses file: ${processingError.message}`);
            }
        };
        if (fileName.endsWith('.csv')) reader.readAsText(blob);
        else reader.readAsBinaryString(blob);
    } catch (error) {
        console.error('Error loading data file:', error);
        alert(`Gagal memuat data dari file: ${fileName}. Pastikan server backend berjalan.`);
    }
}
function processVendorData(rawData) {
    try {
        if (!rawData || rawData.length === 0) {
            throw new Error("File yang diunggah kosong atau formatnya tidak bisa dibaca.");
        }
        const expectedHeaders = [
            'nama vendor', 'tgl pesan', 'tgl kirim janji', 
            'tgl kirim aktual', 'kualitas lolos', 'harga'
        ];
        const headerMapping = {};
        const firstRow = rawData[0];
        const actualHeaders = Object.keys(firstRow);
        expectedHeaders.forEach(expectedHeader => {
            const foundHeader = actualHeaders.find(actualHeader => actualHeader.trim().toLowerCase() === expectedHeader);
            if (foundHeader) {
                headerMapping[expectedHeader] = foundHeader;
            } else {
                throw new Error(`Kolom wajib '${expectedHeader}' tidak ditemukan di file Anda.`);
            }
        });
        const vendorMap = new Map();
        rawData.forEach((row, index) => {
            const vendorName = row[headerMapping['nama vendor']];
            if (!vendorName || !vendorName.trim()) {
                console.warn(`Melewatkan baris ke-${index + 2} karena Nama Vendor kosong.`);
                return;
            }
            if (!vendorMap.has(vendorName)) {
                vendorMap.set(vendorName, { id: vendorName, name: vendorName, transactions: [] });
            }
            const transaction = {
                tglPesan: row[headerMapping['tgl pesan']],
                tglKirimJanji: row[headerMapping['tgl kirim janji']],
                tglKirimAktual: row[headerMapping['tgl kirim aktual']],
                kualitasLolos: String(row[headerMapping['kualitas lolos']]).trim().toLowerCase() === 'true',
                harga: parseFloat(row[headerMapping['harga']]) || 0
            };
            if (!transaction.tglPesan || !transaction.tglKirimJanji || !transaction.tglKirimAktual) {
                 console.warn(`Melewatkan transaksi untuk ${vendorName} di baris ke-${index + 2} karena data tanggal tidak lengkap.`);
                 return;
            }
            vendorMap.get(vendorName).transactions.push(transaction);
        });
        userVendorData = Array.from(vendorMap.values());
        if (userVendorData.length === 0) {
            throw new Error("Tidak ada data vendor valid yang dapat diproses. Pastikan file terisi dengan benar dan sesuai format.");
        }
        renderVendorTable();
        document.getElementById('analyze-vendor-btn').disabled = userVendorData.length === 0;
        simulationVendors = [];
        renderSimulationPanel();
        updateDashboard();
    } catch (error) {
        console.error("Kesalahan di processVendorData:", error);
        alert(`Gagal memproses data: ${error.message}`);
        userVendorData = [];
        renderVendorTable();
        updateDashboard();
    }
}
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
