import { describe, expect, it } from "vitest";
import {
  DONATION_INFO,
  formatDonationAccount,
  formatPhoneForDisplay,
  getPhoneHref,
} from "./contact";

describe("formatPhoneForDisplay", () => {
  it("formats a Taiwanese mobile number", () => {
    expect(formatPhoneForDisplay("0912142352")).toBe("0912-142-352");
  });

  it("leaves non-mobile numbers untouched", () => {
    expect(formatPhoneForDisplay("02-1234-5678")).toBe("02-1234-5678");
  });
});

describe("getPhoneHref", () => {
  it("builds a tel: href from digits only", () => {
    expect(getPhoneHref("0912-142-352")).toBe("tel:0912142352");
  });
});

describe("donation account", () => {
  it("formats the donated account string in one place", () => {
    expect(formatDonationAccount(DONATION_INFO)).toBe(
      "帳戶 台北富邦銀行 帳號 82120000204387"
    );
  });
});
