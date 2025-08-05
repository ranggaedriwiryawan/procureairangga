// analisis/vendor/index.js
// Modul logika khusus analisis vendor

import { vendorData } from '../../data.js';

export function getTopVendors(limit = 3) {
  return [...vendorData]
    .sort((a, b) => (b.transactions + b.rating) - (a.transactions + a.rating))
    .slice(0, limit);
}

export function calculateVendorScore(vendor) {
  // Skor sederhana: 50% transaksi, 50% rating
  return ((vendor.transactions / 250) * 50) + ((vendor.rating / 5) * 50);
}
