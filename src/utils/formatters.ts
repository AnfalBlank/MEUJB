export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return "Rp 0";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

export function formatCompactNumber(amount: number): string {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " M";
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + " Jt";
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + " Rb";
  }
  return amount.toString();
}

export function calcPercentage(portion: number, total: number): string {
  if (!total || total === 0) return "0%";
  const pct = Math.round((portion / total) * 100);
  return `${pct}%`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function generateNextDocNumber(
  type: "WO" | "SPK", 
  subdiv: string, 
  existingJobsCount: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(existingJobsCount + 1).padStart(3, "0");

  if (type === "WO") {
    return `WO-EXT-${year}-${seq}`;
  } else {
    let divCode = "ENG";
    if (subdiv.includes("Fueling")) divCode = "FS";
    else if (subdiv.includes("IT")) divCode = "IT";
    else if (subdiv.includes("Electrical")) divCode = "EL";
    return `SPK/MKT-${divCode}/${year}/${month}/${seq}`;
  }
}

export function createWhatsAppUrl(phone: string, message?: string): string {
  if (!phone) return "#";
  // Clean phone number (replace +62, 08xx with 628xx)
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleaned}${textParam}`;
}

/**
 * Menghitung selisih hari kalender antara tanggal mulai dan target selesai
 */
export function calculateDurationDays(startDateStr?: string, targetDateStr?: string): number {
  if (!startDateStr || !targetDateStr) return 1;
  try {
    const start = new Date(startDateStr);
    const end = new Date(targetDateStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * Format rentang tanggal pelaksanaan resmi
 * Contoh: 28 Okt 2026 – 02 Nov 2026 (5 Hari)
 */
export function formatDateRange(startDateStr?: string, targetDateStr?: string): string {
  if (!startDateStr && !targetDateStr) return "-";
  if (startDateStr && !targetDateStr) return formatDateIndo(startDateStr);
  if (!startDateStr && targetDateStr) return `Selesai: ${formatDateIndo(targetDateStr)}`;

  const days = calculateDurationDays(startDateStr, targetDateStr);
  return `${formatDateIndo(startDateStr!)} s/d ${formatDateIndo(targetDateStr!)} (${days} Hari)`;
}

/**
 * Cek apakah pekerjaan melewati target selesai saat belum berstatus Done
 * @param targetDateStr Tanggal target selesai (format YYYY-MM-DD)
 * @param status Status pekerjaan (Done, Pending, Hold, Cancel)
 * @param todayStr Tanggal hari ini dari client state (format YYYY-MM-DD)
 */
export function isJobOverdue(
  targetDateStr?: string, 
  status?: string, 
  todayStr?: string
): boolean {
  if (!todayStr) return false;
  if (!targetDateStr || status === "Done" || status === "Cancel") return false;
  try {
    return targetDateStr < todayStr;
  } catch {
    return false;
  }
}

