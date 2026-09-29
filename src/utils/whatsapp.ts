/**
 * WhatsApp integration utilities for SpotSiNi according to PRD Section 11
 */

export const ADMIN_WHATSAPP_NUMBER = '6287881145183';
export const ADMIN_WHATSAPP_DISPLAY = '0878-8114-5183';

/**
 * Normalizes an Indonesian phone number to international WhatsApp format (starts with 62)
 * Handles: 0812..., 812..., +62812..., 62812...
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generates direct WhatsApp link for contacting a business
 */
export function getBusinessWhatsAppUrl(phone: string, businessName?: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return '';
  const text = businessName
    ? encodeURIComponent(`Halo, saya menemukan usaha ${businessName} di direktori SpotSiNi Penggilingan. Mau tanya info produknya ya.`)
    : '';
  return `https://wa.me/${normalized}${text ? `?text=${text}` : ''}`;
}

export interface SubmissionMessageData {
  namaPemilik: string;
  namaUsaha: string;
  sektorUsaha: string;
  teleponAtauEmail: string;
  alamatUsaha: string;
}

/**
 * Generates pre-filled WhatsApp message for submitting a new business to Admin
 * strictly following PRD Section 11.2 template:
 * 
 * Halo Admin SPOTSINI!! 👋
 * Saya ingin mengajukan pendataan usaha mikro untuk masuk ke dalam direktori peta digital SPOTSINI. Berikut data singkat usaha saya:
 * 
 * 📌 Nama Pemilik/Usaha: [nama_pemilik] ([nama_usaha])
 * 🏷️ Jenis Usaha: [sektor_usaha]
 * 📞 Telepon/E-mail: [telepon_atau_email]
 * 📍 Alamat Usaha: [alamat_usaha]
 * 
 * Mohon dibantu proses verifikasi dan pendataan lokasinya ya, Terima kasih!
 */
export function generateSubmissionWhatsAppUrl(data: SubmissionMessageData): string {
  const message = 
`Halo Admin SPOTSINI!! 👋
Saya ingin mengajukan pendataan usaha mikro untuk masuk ke dalam direktori peta digital SPOTSINI. Berikut data singkat usaha saya:

📌 Nama Pemilik/Usaha: ${data.namaPemilik || '-'} (${data.namaUsaha})
🏷️ Jenis Usaha: ${data.sektorUsaha}
📞 Telepon/E-mail: ${data.teleponAtauEmail}
📍 Alamat Usaha: ${data.alamatUsaha}

Mohon dibantu proses verifikasi dan pendataan lokasinya ya, Terima kasih!`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
