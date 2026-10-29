/**
 * تصدير البيانات إلى ملف CSV متوافق تماماً مع اللغة العربية عبر UTF-8 BOM
 */

/**
 * تنظيف وحماية النصوص في CSV
 */
function escapeCSVValue(val) {
  if (val === undefined || val === null) {
    return '""';
  }
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * تصدير جدول بيانات إلى ملف CSV
 * @param {Array<object>} data - مصفوفة البيانات
 * @param {Array<{key: string, label: string}>} columns - تعريف الأعمدة
 * @param {string} filename - اسم الملف بدون الامتداد
 */
export function exportToCSV(data, columns, filename = 'تقرير-التوصيل') {
  if (!data || !data.length) {
    alert('لا توجد بيانات متاحة للتصدير حالياً');
    return;
  }

  // 1. عناوين الأعمدة بالعربية
  const headerRow = columns.map(col => escapeCSVValue(col.label)).join(',');

  // 2. صفوف البيانات
  const rows = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (col.formatter && typeof col.formatter === 'function') {
        val = col.formatter(val, row);
      }
      return escapeCSVValue(val);
    }).join(',');
  });

  // 3. إضافة UTF-8 BOM لضمان قراءة اللغة العربية بامتياز في Excel وجميع البرامج
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');

  // 4. إنشاء Blob والتنزيل التلقائي
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filename}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
