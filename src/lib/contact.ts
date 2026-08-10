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

// Kept for callers that only need the official fallback phone.
export const OFFICIAL_CONTACT_PHONE = FALLBACK_ORGANIZATION_PROFILE.phone;
export const OFFICIAL_CONTACT_PHONE_DISPLAY = formatPhoneForDisplay(
  OFFICIAL_CONTACT_PHONE
);
