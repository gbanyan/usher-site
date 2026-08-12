import type { OrganizationProfile } from "./types";

export const FALLBACK_ORGANIZATION_PROFILE: OrganizationProfile = {
  name: "台灣尤塞氏症暨視聽弱協會",
  address: "台北市中正區忠孝西路一段50號14樓之20、22號",
  tax_id: "00577231",
  email: "president@usher.org.tw",
  phone: "0912142352",
};

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("09")) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export function getPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Donation channel shown on /contact until the CMS copy carries real
 * donation instructions (it currently only has a “待建立金流” placeholder).
 * Public bank details: safe to keep in source, but they must stay in one place.
 */
export const DONATION_INFO = {
  bank: "台北富邦銀行",
  accountNumber: "82120000204387",
} as const;

export function formatDonationAccount(info: typeof DONATION_INFO): string {
  return `帳戶 ${info.bank} 帳號 ${info.accountNumber}`;
}
