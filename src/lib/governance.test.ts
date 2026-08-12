import { describe, expect, it } from "vitest";
import { GOVERNANCE_DOCUMENTS, findGovernanceDocuments } from "./governance";
import type { PublicDocumentSummary } from "./types";

function makeDocument(title: string, slug: string): PublicDocumentSummary {
  return {
    id: 1,
    slug,
    public_uuid: slug,
    title,
    document_number: null,
    summary: null,
    description: null,
    status: "active",
    status_label: "啟用",
    access_level: "public",
    access_level_label: "公開",
    published_at: null,
    updated_at: null,
    expires_at: null,
    version_count: 1,
    category: null,
    current_version: null,
    links: {
      api_url: "",
      detail_url: "",
      web_url: "",
      download_url: null,
    },
    metadata: {
      document_type: null,
      expiration_status: null,
      auto_archive_on_expiry: false,
      expiry_notice: null,
    },
  };
}

describe("findGovernanceDocuments", () => {
  it("matches documents by the canonical governance titles", () => {
    const documents = [
      makeDocument("內政部立案函", "letter-2024"),
      makeDocument("法人登記證書", "registration-2024"),
    ];

    const found = findGovernanceDocuments(documents);

    expect(Object.keys(found).sort()).toEqual(["letter", "registration"]);
    expect(found["letter"]?.slug).toBe("letter-2024");
    expect(found["registration"]?.slug).toBe("registration-2024");
    expect(found["charter"]).toBeUndefined();
  });

  it("covers every GOVERNANCE_DOCUMENTS key when all documents exist", () => {
    const found = findGovernanceDocuments(
      GOVERNANCE_DOCUMENTS.map((row) => makeDocument(row.title, row.key))
    );
    expect(Object.keys(found).sort()).toEqual(
      GOVERNANCE_DOCUMENTS.map((row) => row.key).sort()
    );
  });
});
