// Indonesian currency and date helpers

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahPlain(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatTanggalSingkat(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Terbilang Rupiah untuk Kuitansi dan Bukti Pengeluaran Kas
export function angkaKeTerbilang(nilai: number): string {
  if (isNaN(nilai) || nilai === null || nilai === undefined) return 'Nol Rupiah';

  const isNegatif = nilai < 0;
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function hitung(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return hitung(n - 10) + ' Belas';
    } else if (n < 100) {
      return hitung(Math.floor(n / 10)) + ' Puluh ' + hitung(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + hitung(n - 100);
    } else if (n < 1000) {
      return hitung(Math.floor(n / 100)) + ' Ratus ' + hitung(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + hitung(n - 1000);
    } else if (n < 1000000) {
      return hitung(Math.floor(n / 1000)) + ' Ribu ' + hitung(n % 1000);
    } else if (n < 1000000000) {
      return hitung(Math.floor(n / 1000000)) + ' Juta ' + hitung(n % 1000000);
    } else if (n < 1000000000000) {
      return hitung(Math.floor(n / 1000000000)) + ' Miliar ' + hitung(n % 1000000000);
    } else if (n < 1000000000000000) {
      return hitung(Math.floor(n / 1000000000000)) + ' Triliun ' + hitung(n % 1000000000000);
    }
    return '';
  }

  const bulat = Math.floor(Math.abs(nilai));
  if (bulat === 0) return 'Nol Rupiah';
  const hasil = hitung(bulat).replace(/\s+/g, ' ').trim();
  return `${isNegatif ? 'Minus ' : ''}${hasil} Rupiah`;
}

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        let str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
