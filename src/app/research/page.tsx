import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { EN_COPY } from "@/lib/i18n";
import { getWebPageSchema } from "@/lib/jsonld";
import { getSiteUrl } from "@/lib/site";

const PAGE_TITLE =
  "Research & Open Science | Taiwan Usher Syndrome and Deafblind Association";
const PAGE_DESCRIPTION =
  "Open, reproducible research and collaboration focused on Usher syndrome, deafblindness, rare disease genetics, and accessible science.";
const REPOSITORY_URL = "https://github.com/gbanyan/usher-exploring";
const SUBMISSION_URL =
  "https://github.com/gbanyan/usher-exploring/tree/master/submission/bmc_bioinformatics";
const PROJECT_TITLE =
  "UsherPipe: A genome-wide multi-evidence pipeline for prioritizing candidate genes in Usher syndrome and related ciliopathies";
const PROJECT_DESCRIPTION =
  "An open-source, reproducible bioinformatics pipeline that integrates complementary evidence layers to generate auditable candidate hypotheses for downstream validation.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/research",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: EN_COPY.organizationName,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ["/images/banner/hero-founding.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ["/images/banner/hero-founding.jpg"],
  },
};

const RESEARCH_PRIORITIES = [
  {
    number: "01",
    title: "Rare disease genetics",
    description:
      "Candidate genes, genotype–phenotype relationships, and unresolved questions in Usher syndrome and related ciliopathies.",
  },
  {
    number: "02",
    title: "Reproducible computational biology",
    description:
      "Auditable workflows built from versioned public datasets, explicit assumptions, and outputs that other researchers can inspect and rerun.",
  },
  {
    number: "03",
    title: "Patient-centered research",
    description:
      "Research communication and participation that take the lived experience and access needs of deafblind communities seriously.",
  },
  {
    number: "04",
    title: "Accessible knowledge exchange",
    description:
      "Bridging researchers, clinicians, families, and international partners across language, sensory, and institutional boundaries.",
  },
] as const;

const WORKFLOW = [
  {
    step: "Collect",
    description: "Start with version-pinned public evidence and documented provenance.",
  },
  {
    step: "Compare",
    description: "Combine complementary signals without treating missing data as negative evidence.",
  },
  {
    step: "Prioritize",
    description: "Rank candidate hypotheses with transparent, configurable scoring.",
  },
  {
    step: "Validate",
    description: "Report limitations clearly and identify questions for independent follow-up.",
  },
] as const;

const COLLABORATION_AREAS = [
  "Computational and genetic research partnerships",
  "Community-informed research design and communication",
  "Accessible translation of scientific findings",
  "International rare-disease and deafblindness networks",
] as const;

const CONTACTS = [
  {
    role: "President",
    email: "president@usher.org.tw",
    description: "Organizational leadership and institutional enquiries",
  },
  {
    role: "Secretary-General",
    email: "secgen@usher.org.tw",
    description: "Research partnerships, grants, and coordination",
  },
] as const;

export default function ResearchPage() {
  const pageSchema = getWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, "/research");
  const projectUrl = `${getSiteUrl()}/research#featured-project`;

  return (
    <div
      lang="en"
      data-pagefind-body
      className="overflow-hidden bg-primary-dark text-white"
    >
      <JsonLd
        data={[
          pageSchema,
          {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: PROJECT_TITLE,
            description: PROJECT_DESCRIPTION,
            codeRepository: REPOSITORY_URL,
            url: projectUrl,
            programmingLanguage: "Python",
            keywords: [
              "Usher syndrome",
              "ciliopathies",
              "rare disease genetics",
              "bioinformatics",
              "reproducible research",
            ],
          },
        ]}
      />

      <section
        className="relative isolate min-h-[620px] overflow-hidden border-b border-white/10"
        aria-labelledby="research-page-title"
      >
        <Image
          src="/images/banner/hero-founding.jpg"
          alt="A community research gathering in Taiwan"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-primary-dark/80" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(236,155,5,0.18),transparent_32%),linear-gradient(90deg,rgba(13,13,31,0.98)_0%,rgba(13,13,31,0.87)_52%,rgba(13,13,31,0.58)_100%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-between px-6 pb-16 pt-20 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="flex items-center justify-between gap-6">
            <p className="inline-flex items-center gap-3 text-sm font-medium tracking-[0.12em] text-accent">
              <span className="h-px w-10 bg-accent" aria-hidden="true" />
              Research &amp; Open Science
            </p>
            <p className="hidden text-right text-xs tracking-[0.18em] text-white/50 sm:block">
              TAIWAN / USHER / OPEN SCIENCE
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.72fr)] lg:items-end">
            <div>
              <h1
                id="research-page-title"
                className="max-w-4xl text-display text-white"
              >
                Building evidence around Usher syndrome and deafblindness.
              </h1>
              <p className="mt-7 max-w-2xl text-lead text-white/80">
                A Taiwan-based community organization connecting lived experience,
                computational biology, and open research collaboration.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#featured-project"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-primary-dark transition-colors duration-200 hover:bg-accent-light active:scale-[0.98]"
                >
                  Explore the featured project
                  <ArrowUpRight />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:border-accent hover:text-accent active:scale-[0.98]"
                >
                  Research enquiries
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-white/20 bg-primary-dark/70 p-6 shadow-2xl shadow-primary-dark/40 backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <p className="text-sm font-semibold text-white">Research snapshot</p>
                <span className="font-mono text-xs text-accent">01 / 04</span>
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-6">
                  <dt className="text-white/55">Field</dt>
                  <dd className="text-right font-medium text-white">Rare disease genomics</dd>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <dt className="text-white/55">Research model</dt>
                  <dd className="max-w-[12rem] text-right font-medium text-white">Open and reproducible</dd>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <dt className="text-white/55">Base</dt>
                  <dd className="text-right font-medium text-white">Taiwan · international</dd>
                </div>
              </dl>
              <div className="mt-7 border-t border-white/15 pt-6">
                <p className="font-mono text-5xl font-medium tracking-[-0.06em] text-accent">20,116</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/65">
                  protein-coding genes evaluated in the featured pipeline
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        className="border-b border-white/10 bg-primary-dark px-6 py-20 sm:py-28 lg:px-8"
        aria-labelledby="initiative-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium tracking-[0.12em] text-accent">Why this work</p>
            <h2 id="initiative-heading" className="mt-4 text-heading-1 text-white">
              Rare conditions need research that stays close to the people affected.
            </h2>
          </div>
          <div className="max-w-2xl space-y-5 text-body text-white/75">
            <p>
              Usher syndrome sits at the intersection of rare disease genetics,
              vision, hearing, and everyday access. The evidence is distributed
              across disciplines, databases, and communities that do not always
              share the same language or research priorities.
            </p>
            <p>
              The Taiwan Usher Syndrome and Deafblind Association is building a
              public-facing research and collaboration pathway that keeps lived
              experience visible while supporting careful, reproducible scientific
              work.
            </p>
          </div>
        </div>
      </section>

      <section
        className="bg-primary px-6 py-20 sm:py-28 lg:px-8"
        aria-labelledby="priorities-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium tracking-[0.12em] text-accent">Areas of interest</p>
            <h2 id="priorities-heading" className="mt-4 text-heading-1 text-white">
              Questions worth following.
            </h2>
            <p className="mt-5 max-w-md text-body text-white/65">
              We welcome collaborations that move between computation, clinical
              questions, community knowledge, and accessible communication.
            </p>
          </div>
          <ol className="divide-y divide-white/15 border-y border-white/15">
            {RESEARCH_PRIORITIES.map((priority) => (
              <li key={priority.number} className="grid gap-5 py-7 sm:grid-cols-[4rem_1fr] sm:gap-8">
                <span className="font-mono text-sm text-accent">{priority.number}</span>
                <div>
                  <h3 className="text-heading-3 text-white">{priority.title}</h3>
                  <p className="mt-2 max-w-2xl text-body text-white/65">{priority.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="featured-project"
        className="bg-primary-dark px-6 py-20 sm:py-28 lg:px-8"
        aria-labelledby="featured-project-heading"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-medium tracking-[0.12em] text-accent">Featured research output</p>
              <h2 id="featured-project-heading" className="mt-4 text-heading-1 text-white">
                An open pipeline for overlooked hypotheses.
              </h2>
            </div>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border-b border-accent pb-1 text-sm font-semibold text-accent transition-colors hover:border-accent-light hover:text-accent-light"
              aria-label="View the UsherPipe source repository on GitHub (opens in a new window)"
            >
              View source repository
              <ArrowUpRight />
            </a>
          </div>

          <article className="mt-10 overflow-hidden rounded-3xl border border-white/15 bg-primary shadow-2xl shadow-primary-dark/30">
            <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
              <div className="p-7 sm:p-10 lg:p-14">
                <div className="flex items-center justify-between gap-4 text-xs font-medium tracking-[0.12em] text-white/55">
                  <span>OPEN SOURCE RESEARCH ARTIFACT</span>
                  <span className="font-mono text-accent">USHERPIPE</span>
                </div>
                <h3 className="mt-7 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                  {PROJECT_TITLE}
                </h3>
                <p className="mt-6 max-w-2xl text-body text-white/70">
                  {PROJECT_DESCRIPTION} The project integrates six complementary
                  evidence layers and preserves the distinction between a
                  computational priority and an established gene–disease relationship.
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <ExternalLink href={REPOSITORY_URL} label="Source code" />
                  <ExternalLink href={SUBMISSION_URL} label="Submission package" />
                </div>
              </div>

              <aside className="border-t border-white/10 bg-primary-light/45 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
                <p className="text-sm font-semibold text-white">At a glance</p>
                <ul className="mt-7 space-y-6" role="list">
                  <ProjectFact value="20,116" label="protein-coding genes evaluated" />
                  <ProjectFact value="06" label="complementary evidence layers" />
                  <ProjectFact value="01" label="versioned, reproducible workflow" />
                </ul>
              </aside>
            </div>
            <div className="grid gap-5 border-t border-white/10 px-7 py-6 sm:grid-cols-[auto_1fr] sm:items-start sm:px-10 lg:px-14">
              <p className="text-sm font-semibold text-accent">Research status</p>
              <div className="space-y-2 text-sm text-white/70">
                <p>Manuscript submitted to <em>BMC Bioinformatics</em> on 15 August 2026.</p>
                <p>
                  Scope note: the rankings are computational hypotheses for
                  downstream validation, not clinical diagnoses or confirmed causal relationships.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        className="border-y border-white/10 bg-primary px-6 py-20 sm:py-28 lg:px-8"
        aria-labelledby="workflow-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium tracking-[0.12em] text-accent">Research practice</p>
            <h2 id="workflow-heading" className="mt-4 text-heading-1 text-white">
              Make each conclusion traceable.
            </h2>
            <p className="mt-5 max-w-md text-body text-white/65">
              Good computational research makes it possible to see where a result
              came from, what it means, and where it still needs evidence.
            </p>
          </div>
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2" role="list">
            {WORKFLOW.map((item, index) => (
              <li key={item.step} className="relative border-l border-accent/70 pl-5">
                <span className="font-mono text-xs text-accent">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-semibold text-white">{item.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="bg-primary-dark px-6 py-20 sm:py-28 lg:px-8"
        aria-labelledby="collaboration-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium tracking-[0.12em] text-accent">Collaboration</p>
            <h2 id="collaboration-heading" className="mt-4 text-heading-1 text-white">
              Bring the right people into the same conversation.
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-[0.9fr_1.1fr] sm:gap-14">
            <div>
              <h3 className="text-heading-3 text-white">We welcome conversations about</h3>
              <ul className="mt-5 space-y-3" role="list">
                {COLLABORATION_AREAS.map((area) => (
                  <li key={area} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-white/15 pt-6 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0">
              <h3 className="text-heading-3 text-white">A community partner, not a substitute for review.</h3>
              <p className="mt-4 text-body text-white/65">
                Any study involving people, identifiable information, or clinical
                decisions must follow the appropriate institutional and ethical
                review process. Our public research work uses careful scope notes
                and separates exploratory computation from validated clinical evidence.
              </p>
              <Link
                href="/document"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-light"
              >
                View public association documents
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="bg-accent px-6 py-16 text-primary-dark sm:py-24 lg:px-8"
        aria-labelledby="research-contact-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-primary-dark/70">Research enquiries</p>
            <h2 id="research-contact-heading" className="mt-4 text-heading-1">
              Start with a clear question.
            </h2>
            <p className="mt-5 max-w-xl text-body text-primary-dark/75">
              For research collaboration, grant-related enquiries, institutional
              partnerships, or questions about the featured project, contact the association directly.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACTS.map((contact) => (
              <a
                key={contact.email}
                href={`mailto:${contact.email}`}
                className="group rounded-2xl bg-primary-dark p-5 text-white transition-transform duration-200 hover:-translate-y-1 hover:bg-primary active:translate-y-0"
                aria-label={`Email ${contact.role} at ${contact.email}`}
              >
                <span className="text-sm text-white/55">{contact.role}</span>
                <span className="mt-3 block break-words text-lg font-semibold text-accent transition-colors group-hover:text-accent-light">
                  {contact.email}
                </span>
                <span className="mt-4 block text-xs leading-relaxed text-white/60">{contact.description}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ArrowUpRight() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:border-accent hover:text-accent active:scale-[0.98]"
      aria-label={`${label} (opens in a new window)`}
    >
      {label}
      <ArrowUpRight />
    </a>
  );
}

function ProjectFact({ value, label }: { value: string; label: string }) {
  return (
    <li className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
      <p className="font-mono text-3xl tracking-[-0.04em] text-accent">{value}</p>
      <p className="mt-1 text-sm leading-relaxed text-white/65">{label}</p>
    </li>
  );
}
