// analisis/peramalan/index.js
// Modul logika khusus peramalan permintaan

import { historicalSales, forecastLabels } from '../../data.js';

export function getTraditionalForecast() {
  // Simulasi peramalan tradisional (moving average 3 bulan)
  let result = [];
  for (let i = 0; i < historicalSales.length; i++) {
    if (i < 2) {
      result.push(historicalSales[i]);
    } else {
      result.push(((historicalSales[i] + historicalSales[i-1] + historicalSales[i-2]) / 3).toFixed(0));
    }
  }
  return result;
}

export function getAIForecast() {
  // Simulasi peramalan AI (lebih presisi, deviasi kecil)
  return historicalSales.map(s => (s * (1 + (Math.random() - 0.5) * 0.1)).toFixed(0));
}
