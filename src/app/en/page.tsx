import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import HeroSlider from "@/components/HeroSlider";
import ArticleCard from "@/components/ArticleCard";
import {
  getAllArticles,
  getChineseStoryFallbackArticles,
  getOrganizationProfile,
} from "@/lib/api";
import type { ArticleSummary } from "@/lib/types";
import { EN_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: EN_COPY.organizationName },
  description:
    "Supporting people with Usher syndrome and deafblind people through connection, resources, advocacy, and community.",
  alternates: {
    canonical: "/en",
    languages: { "zh-TW": "/", en: "/en" },
  },
};

const SLIDES = [
  {
    image: "/images/banner/hero-support.jpg",
    ...EN_COPY.home.slides[0],
    button: { label: "About", link: "/en#about" },
  },
  {
    image: "/images/banner/hero-sign-language.jpg",
    ...EN_COPY.home.slides[1],
    button: { label: EN_COPY.home.slides[1].button, link: "/en#stories" },
  },
  {
    image: "/images/banner/hero-founding.jpg",
    ...EN_COPY.home.slides[2],
    button: { label: "Contact", link: "/en#contact" },
  },
];

const PARTNERS = [
  {
    name: "Excelsior Activity Center",
    description: "Special thanks to Excelsior for sponsoring our event venue.",
    logo: "https://www.excelsiorgroup.com.tw/img/Excelsior%20logo.svg",
    website: "https://www.excelsiorgroup.com.tw",
  },
  {
    name: "Shine Visual Aids Center",
    description: "Special thanks to Shine Visual Aids Center for supporting our association's activities.",
    logo: "https://static.wixstatic.com/media/ab6733_7bb2d85ea91a435b84820153d00394aa~mv2.jpg/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/ab6733_7bb2d85ea91a435b84820153d00394aa~mv2.jpg",
    website: "https://www.shinemed.com.tw",
  },
  {
    name: "Department of Molecular Biology and Human Genetics, Tzu Chi University",
    description: "",
    logo: "/images/partners/tcu-logo.png",
    website: "https://imbhg.tcu.edu.tw",
  },
  {
    name: "Benevity",
    description:
      "Corporate philanthropy and volunteering platform connecting nonprofits with corporate giving and volunteer services.",
    logo: "/images/partners/benevity-logo.svg",
    website: "https://benevity.com/nonprofits",
  },
  {
    name: "Geneyx",
    description: "Sponsoring genetic analysis for 10 families annually.",
    logo: "/images/partners/geneyx-logo.png",
    website: "https://geneyx.com/",
  },
  {
    name: "Feng-Ming Hsu Creative Studio",
    description:
      "Special thanks to Director Feng-Ming Hsu and his studio for producing the documentary.",
    logo: "/images/partners/hsu-fengming-studio-logo.svg",
    website: "https://www.facebook.com/plumpig.tw",
  },
  {
    name: "Taiwan Foundation for Rare Disorders (TFRD)",
    description: "Services and advocacy for rare disease patients.",
    logo: "https://www.tfrd.org.tw/tfrd/assets/images/Logo.png",
    website: "https://www.tfrd.org.tw/tfrd/home",
  },
];

function FeatureIcon({ index }: { index: number }) {
  const symbols = ["✦", "◌", "◉", "＋"];
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full border border-accent text-xl text-accent"
      aria-hidden="true"
    >
      {symbols[index]}
    </span>
  );
}

export default async function EnglishHomePage() {
  const [profile, fallbackStories] = await Promise.all([
    getOrganizationProfile(),
    getFallbackStories(),
  ]);

  return (
    <div data-pagefind-body className="bg-black text-white">
      <HeroSlider slides={SLIDES} locale="en" />

      <section
        id="usher-syndrome"
        className="relative z-10 w-full bg-gray-100"
        aria-labelledby="feature-heading-en"
      >
        <div className="relative -mt-12 w-full bg-primary-dark shadow-xl sm:-mt-24">
          <div className="grid w-full lg:grid-cols-12">
            <div className="relative hidden min-h-[400px] lg:col-span-4 lg:block">
              <Image
                src="/images/banner/banner_feature.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0px, 33vw"
                loading="lazy"
              />
            </div>
            <div className="w-full p-6 sm:p-12 lg:col-span-8 lg:pl-[70px] lg:pr-[10%] lg:pt-[80px] xl:pr-[30%]">
              <h2 id="feature-heading-en" className="sr-only">
                {EN_COPY.home.featureHeading}
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-y-12">
                {EN_COPY.home.features.map((feature, index) => (
                  <article key={feature.name} className="text-white">
                    <FeatureIcon index={index} />
                    <h3 className="mt-6 text-heading-3">{feature.name}</h3>
                    <p className="mt-4 text-body text-muted">{feature.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-14 sm:py-20" aria-labelledby="about-heading-en">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-accent">
              About
            </p>
            <h2 id="about-heading-en" className="mt-3 text-heading-2 text-accent">
              {EN_COPY.home.communityTitle}
            </h2>
            <p className="mt-4 text-body text-muted">{EN_COPY.home.communityContent}</p>
            <Link
              href="/en#stories"
              className="mt-6 inline-block rounded-lg border-2 border-accent px-6 py-2.5 font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-primary-dark"
            >
              {EN_COPY.home.storiesButton}
            </Link>
          </div>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-lg md:mt-0">
            <Image
              src="/images/banner/about-plight.jpg"
              alt="The challenges facing the deafblind community"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {fallbackStories.length > 0 && (
        <section
          id="stories"
          className="bg-primary-light py-16 sm:py-24"
          aria-labelledby="stories-heading-en"
        >
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wider text-accent">
              {EN_COPY.home.storiesTitle}
            </p>
            <h2 id="stories-heading-en" className="mt-3 text-heading-2 text-white">
              Stories from our community
            </h2>
            <p className="mt-4 max-w-3xl text-body text-muted">
              {EN_COPY.home.storiesFallback}
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackStories.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
            <Link
              href="/story"
              className="mt-8 inline-flex rounded-lg border border-accent px-5 py-2.5 font-medium text-accent transition-colors hover:bg-accent hover:text-primary-dark"
            >
              {EN_COPY.home.storiesFallbackLink}
            </Link>
          </div>
        </section>
      )}

      <section className="bg-accent py-14 text-center text-primary-dark sm:py-20" aria-labelledby="support-heading-en">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-dark/90">
            {EN_COPY.home.supportEyebrow}
          </p>
          <h2 id="support-heading-en" className="mt-3 text-heading-2">
            {EN_COPY.home.supportTitle}
          </h2>
          <Link
            href="/en#contact"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary-dark px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-primary"
          >
            {EN_COPY.home.contactButton}
          </Link>
        </div>
      </section>

      <section className="relative bg-cover bg-center py-14 sm:py-24" style={{ backgroundImage: "url('/images/backgrounds/Film-Background.jpg')" }} aria-labelledby="documentary-heading-en">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 lg:px-8">
          <div className="order-first flex items-center justify-center md:order-last">
            <a
              href="https://www.youtube.com/watch?v=2S5x08XzBwI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent bg-black/30 text-accent transition-colors hover:bg-accent hover:text-primary-dark"
              aria-label="Watch the documentary on YouTube (opens in a new window)"
            >
              <span className="ml-1 text-3xl" aria-hidden="true">▶</span>
            </a>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-accent">Documentary</p>
            <h2 id="documentary-heading-en" className="mt-3 text-heading-2 text-white">
              {EN_COPY.home.documentaryTitle}
            </h2>
            <p className="mt-5 whitespace-pre-line text-body text-white/80">
              {EN_COPY.home.documentaryContent}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary-dark py-14 sm:py-20" aria-labelledby="partners-heading-en">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 id="partners-heading-en" className="text-heading-2 text-white">
            {EN_COPY.home.partners}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-primary p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex h-20 items-center justify-center rounded-lg bg-white p-3">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    width={220}
                    height={80}
                    className="max-h-14 w-auto max-w-full object-contain"
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{partner.name}</h3>
                {partner.description && <p className="mt-2 text-sm text-muted">{partner.description}</p>}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-primary-light py-16 sm:py-24" aria-labelledby="contact-heading-en">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-accent">{EN_COPY.contact.title}</p>
            <h2 id="contact-heading-en" className="mt-3 text-heading-2 text-white">
              {EN_COPY.contact.description}
            </h2>
            <p className="mt-5 max-w-xl text-body text-muted">
              We welcome questions from people with Usher syndrome, families, researchers, accessibility partners, and anyone who would like to support the community.
            </p>
          </div>
          <dl className="grid gap-5 rounded-xl border border-white/10 bg-primary/50 p-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">{EN_COPY.contact.associationName}</dt>
              <dd className="mt-1 text-white">{EN_COPY.organizationName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{EN_COPY.contact.address}</dt>
              <dd className="mt-1 whitespace-pre-line text-white">{profile.address}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{EN_COPY.contact.email}</dt>
              <dd className="mt-1"><a className="text-accent hover:text-accent-light" href={`mailto:${profile.email}`}>{profile.email}</a></dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{EN_COPY.contact.phone}</dt>
              <dd className="mt-1"><a className="text-accent hover:text-accent-light" href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}>{profile.phone}</a></dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

async function getFallbackStories(): Promise<ArticleSummary[]> {
  try {
    const liveStories = await getAllArticles({ type: "blog", category: "story" });
    if (liveStories.length > 0) return liveStories.slice(0, 3);
  } catch {
    // Use the committed Chinese snapshot when the CMS is unavailable at build time.
  }

  return (await getChineseStoryFallbackArticles()).slice(0, 3);
}
