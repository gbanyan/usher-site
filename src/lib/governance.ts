import type { PublicDocumentSummary } from "./types";

/**
 * Canonical list of the association’s legal/governance documents, as known by
 * the CMS document library. Title-based matching is fragile, so the titles
 * (and the keys used to look them up on the about/contact pages) live in one
 * place.
 */
export interface GovernanceRow {
  key: string;
  title: string;
  purpose: string;
}

export const GOVERNANCE_DOCUMENTS: readonly GovernanceRow[] = [
  {
    key: "license",
    title: "內政部立案證書",
    purpose: "證明本會依法完成立案",
  },
  {
    key: "registration",
    title: "法人登記證書",
    purpose: "證明法人主體登記狀態",
  },
  {
    key: "letter",
    title: "內政部立案函",
    purpose: "主管機關核准立案公函",
  },
  {
    key: "charter",
    title: "台灣尤塞氏症暨視聽弱協會章程（2024-01-27）",
    purpose: "組織治理與會員權責規範",
  },
] as const;

/**
 * Matches the fetched public documents against the canonical governance list.
 * Returns a Record keyed by GOVERNANCE_DOCUMENTS key ("license", "registration", …)
 * containing only the documents that were found.
 */
export function findGovernanceDocuments(
  documents: PublicDocumentSummary[]
): Record<string, PublicDocumentSummary> {
  const found: Record<string, PublicDocumentSummary> = {};

  for (const row of GOVERNANCE_DOCUMENTS) {
    const document = documents.find((doc) => doc.title === row.title);
    if (document) {
      found[row.key] = document;
    }
  }

  return found;
}
