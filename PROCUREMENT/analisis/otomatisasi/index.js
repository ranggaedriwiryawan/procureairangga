// analisis/otomatisasi/index.js
// Modul logika khusus visualisasi otomatisasi

import { automationSteps } from '../../data.js';

export function getStepDescription(step) {
  return automationSteps[step] || '';
}
