# analisis/otomatisasi

Modul ini berisi logika dan utilitas untuk visualisasi serta deskripsi langkah-langkah otomatisasi proses procurement.

## API

- `getStepDescription(step: number): string`
  - Mengembalikan deskripsi singkat untuk setiap langkah otomatisasi berdasarkan data di `data.js`.

## Struktur
- `index.js` — fungsi utama untuk mengambil deskripsi langkah otomatisasi.

## Cara Pakai
Import dan gunakan fungsi sesuai kebutuhan pada modul visualisasi utama.

```js
import { getStepDescription } from './analisis/otomatisasi/index.js';
const desc = getStepDescription(1);
```
