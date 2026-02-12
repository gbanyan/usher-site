import Image from "next/image";
import Link from "next/link";
import { getHomepage } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleSummary } from "@/lib/types";
import HeroSlider from "@/components/HeroSlider";

export const revalidate = false;

/* ------------------------------------------------------------------ */
/*  Static homepage data (from original Hugo homepage.yml)             */
/* ------------------------------------------------------------------ */

const SLIDER_ITEMS = [
  {
    image: "/images/banner/banner.jpg",
    title: "台灣尤塞氏症暨視聽弱協會",
    content: "Taiwan Usher Syndrome and Audiovisual Impairment Association",
    button: { label: "關於我們", link: "/about" },
  },
  {
    image: "/images/banner/banner.jpg",
    title: "尤塞氏症之病友團體",
    content:
      "我們是一群因為先天性遺傳疾病（大多為 Usher Syndrome, 尤塞氏症），而導致同時有視網膜色素病變、視力障礙及聽力障礙的病友。",
    button: { label: "更多故事", link: "/story" },
  },
  {
    image: "/images/banner/banner.jpg",
    title: "視聽雙弱障礙",
    content: "協助視聽雙弱病友相同境遇患者，共同面對生活中的挑戰與課題",
    button: { label: "更多故事", link: "/story" },
  },
];

const FEATURE_ITEMS = [
  {
    name: "什麼是尤塞氏症？",
    icon: "search",
    content:
      "尤塞氏症是一種罕見的遺傳性疾病，目前估計全球共有 400,000 名左右的患者。主要特徵是先天性的聽力損失，以及影響眼睛的視網膜色素病變，此外，某些尤塞氏症患者可能還會有平衡問題。",
  },
  {
    name: "聽力損失",
    icon: "headphone",
    content:
      "罹患尤塞氏症，在出生時或於漸漸成長時，會有聽力損失的情形。主要為感音性聽力損失，大多數損失頻率偏向中高頻率。",
  },
  {
    name: "視網膜色素病變",
    icon: "eye",
    content:
      "尤塞氏症會引起視網膜色素病變。受影響的視網膜逐漸退化，導致夜盲、視野狹窄。視野狹窄的特徵又被稱為隧道狀視野，用以形容僅剩中央局部視覺的狀況。",
  },
  {
    name: "平衡問題及其他",
    icon: "balance",
    content:
      "有某些類型尤塞氏症患者，會有輕微至嚴重的平衡問題。另外也有案例報告，有嗅味覺喪失的情況。尤塞氏症患者臨床傳統上，依據症狀嚴重程度、病程進展以分類。",
  },
];

const ABOUT_SECTION = {
  title: "視聽雙弱族群的困境",
  image: "/images/banner/banner.jpg",
  content:
    "在台灣，除了尤塞氏症患者外，還有一群極為少數的人，因為不明原因（已證明或未證實的相關致病基因、後天因素），而一樣直接影響了視力、聽力，導致其比起正常人來說，直接被剝奪了，與外界溝通最重要的兩個管道。遺憾的是，由於群體極為少眾，以及特殊的雙重受限經驗，傳統的無障礙輔助設計、資源不見得適用。而在罕見疾病族群之中，也端為少見的基因型態，使其更難受到醫藥研究關注、照護資源的挹注。尤塞氏症與其這些族群的共同困境，將會是本協會著重的課題。",
  button: { label: "故事", link: "/story" },
};

const DOCUMENTARY = {
  bgImage: "/images/backgrounds/Film-Background.jpg",
  title: "聽\u2027見幸福的樂章",
  content:
    "導演：許豐明\n\n本片歷經一年籌備與三年以上拍攝，紀錄一個住在南澳深山中原住民家庭，經歷三個孩子自出生即失去聽力，成長過程中，三個孩子進入青春期後，卻又面臨即將失去視力的困境。全片透過三年長期追蹤，和分子遺傳學與現代科技知識的陪伴與引導，詳細記錄故事中人物，相互交錯的緣分，如何抉擇？如何讓自己重新開始找回存在的信心和意義，既使這些人這些事，面對未來將走向黑暗的世界已是無可避免，又如何在科技與親情交織下，度過生命中的幽谷與黯淡……。",
  videoLink: "https://www.youtube.com/watch?v=Cj0dRoHjMq4",
};

/* 合作夥伴 Logo：科懋、龍泰、慈濟大學均使用官方遠端 */
const PARTNERS = [
  {
    name: "科懋聯誼活動中心",
    description: "感謝科懋公司贊助活動場地",
    logo: "https://www.excelsiorgroup.com.tw/img/Excelsior%20logo.svg",
    logoAlt: "科懋生物科技股份有限公司 Logo",
    website: "https://www.excelsiorgroup.com.tw",
  },
  {
    name: "龍泰視覺輔具中心",
    description: "感謝龍泰視覺輔具中心支持協會活動",
    logo: "https://static.wixstatic.com/media/ab6733_7bb2d85ea91a435b84820153d00394aa~mv2.jpg/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/ab6733_7bb2d85ea91a435b84820153d00394aa~mv2.jpg",
    logoAlt: "龍泰視覺輔具中心 Logo",
    website: "https://www.shinemed.com.tw",
  },
  {
    name: "慈濟大學分子生物暨人類遺傳學系",
    logo: "https://www.tcu.edu.tw/var/file/33/1033/img/1940/tculogo_new2024.png",
    logoAlt: "慈濟大學 Logo",
    website: "https://imbhg.tcu.edu.tw",
    logoSize: "h-20 w-32 sm:h-24 sm:w-40", // 慈濟大學 logo 較小，放大顯示
  },
];

/* ------------------------------------------------------------------ */
/*  Icon components for feature section                                */
/* ------------------------------------------------------------------ */

function FeatureIcon({ type }: { type: string }) {
  const cls = "h-10 w-10 text-accent";
  switch (type) {
    case "search":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 3.75c0 3.75 7.5 3.75 7.5 7.5s-7.5 3.75-7.5 7.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 3.75c0 3.75-7.5 3.75-7.5 7.5s7.5 3.75 7.5 7.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 6h6.75M7.875 11.25h8.25M8.625 16.5h6.75" />
        </svg>
      );
    case "headphone":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 5.25a5.25 5.25 0 015.25 5.25v1.125a4.125 4.125 0 11-8.25 0V9a2.625 2.625 0 115.25 0v.75" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8.25a6 6 0 010 7.5M20.25 7.125a7.5 7.5 0 010 9.75" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 4.5l15 15" />
        </svg>
      );
    case "eye":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12h2.25m-1.5-1.5L4.5 12l-1.5 1.5M21.75 12H19.5m1.5-1.5L19.5 12l1.5 1.5" />
        </svg>
      );
    case "balance":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3.75v14.25M9 21h6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7.5h12M6 7.5l-2.25 4.5h4.5L6 7.5zM18 7.5l-2.25 4.5h4.5L18 7.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 15.75a2.25 2.25 0 104.5 0" />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Article list helper                                                */
/* ------------------------------------------------------------------ */

function ArticleList({
  articles,
  href,
  title,
}: {
  articles: ArticleSummary[];
  href: string;
  title: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 lg:px-8" aria-labelledby={`article-list-${title.replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 id={`article-list-${title.replace(/\s/g, "-")}`} className="text-heading-2 text-white whitespace-nowrap">{title}</h2>
        <div className="h-px w-full bg-accent hidden sm:block"></div>
        <Link
          href={href}
          className="hidden sm:inline-block whitespace-nowrap rounded-lg border border-accent px-4 py-1.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-primary-dark"
          aria-label={`查看更多${title}列表`}
        >
          查看更多
        </Link>
      </div>
      <ul className="mt-6 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id} className="w-full">
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  let data;
  try {
    data = await getHomepage();
  } catch {
    data = null;
  }

  return (
    <div className="flex flex-col">
      {/* ============ Hero Slider ============ */}
      {/* ============ Hero Slider ============ */}
      <HeroSlider slides={SLIDER_ITEMS} />

      {/* ============ Banner Feature — What is Usher Syndrome? ============ */}
      <section className="bg-gray-100 relative z-10 w-full" aria-labelledby="feature-heading">
        <div className="w-full">
          <div className="relative -mt-12 sm:-mt-24 bg-primary-dark shadow-xl w-full">
            <div className="grid lg:grid-cols-12 w-full">
              {/* Left image */}
              <div className="relative hidden lg:col-span-4 lg:block min-h-[400px]">
                <Image
                  src="/images/banner/banner_feature.jpg"
                  alt="台灣尤塞氏症暨視聽弱協會"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 33vw"
                  loading="lazy"
                />
              </div>
              {/* Right feature cards */}
              <div className="w-full lg:col-span-8 p-6 sm:p-12 lg:pl-[70px] lg:pt-[80px] lg:pr-[10%] xl:pr-[30%]">
                <h2 id="feature-heading" className="sr-only">
                  認識尤塞氏症
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:gap-y-12 sm:grid-cols-2">
                  {FEATURE_ITEMS.map((item) => (
                    <div key={item.name} className="text-white">
                      <FeatureIcon type={item.icon} />
                      <h3 className="mt-6 text-heading-3">{item.name}</h3>
                      <p className="mt-4 text-body text-muted">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ About Section ============ */}
      <section className="py-14 sm:py-20" aria-labelledby="about-heading">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 px-6 lg:px-8">
          <div>

            <h2
              id="about-heading"
              className="text-heading-2 text-accent"
            >
              {ABOUT_SECTION.title}
            </h2>
            <p className="mt-4 text-body text-muted">
              {ABOUT_SECTION.content}
            </p>
            <Link
              href={ABOUT_SECTION.button.link}
              className="mt-6 inline-block rounded-lg border-2 border-accent px-6 py-2.5 font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-primary-dark"
            >
              {ABOUT_SECTION.button.label}
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg mt-6 md:mt-0">
            <Image
              src={ABOUT_SECTION.image}
              alt="視聽雙弱族群的困境"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ============ Dynamic article sections from API ============ */}
      {data && (
        <section className="bg-primary-light py-16 sm:py-24">
          <div className="flex flex-col gap-12 sm:gap-16">
            {/* Related News */}
            <ArticleList
              articles={data.latest_related_news}
              href="/related-news"
              title="相關報導"
            />

            {/* Latest Blog */}
            {/* <ArticleList
              articles={data.latest_blog}
              href="/blog"
              title="最新消息"
            /> */}

            {/* Latest Notices */}
            {/* <ArticleList
              articles={data.latest_notice}
              href="/notice"
              title="事務公告"
            /> */}

            {/* Latest Documents */}
            {/* <ArticleList
              articles={data.latest_document}
              href="/document"
              title="協會文件"
            /> */}
          </div>
        </section>
      )}

      {/* ============ CTA Section ============ */}
      <section className="bg-accent py-14 sm:py-20 text-center text-primary-dark" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-dark/90">
            志工、捐款、或合作計畫
          </p>
          <h2 id="cta-heading" className="mt-3 text-heading-2">
            歡迎任何形式的支援、贊助！
          </h2>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-primary-dark transition-colors duration-200 hover:bg-gray-100"
            aria-label="聯繫我們取得支援與贊助資訊"
          >
            聯繫我們
          </Link>
        </div>
      </section>

      {/* ============ Documentary Section ============ */}
      <section
        className="relative bg-cover bg-center py-14 sm:py-24"
        style={{ backgroundImage: `url('${DOCUMENTARY.bgImage}')` }}
        aria-labelledby="documentary-heading"
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 lg:px-8 md:grid-cols-2">
          <div className="flex items-center justify-center order-first md:order-last">
            <a
              href={DOCUMENTARY.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-accent text-primary-dark shadow-lg transition-transform hover:scale-110"
              aria-label="播放紀錄片影片"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <svg className="relative ml-1 h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          </div>
          <div className="rounded-lg bg-primary-dark/90 p-6 sm:p-8 text-white">
            <h2 id="documentary-heading" className="text-heading-2">
              {DOCUMENTARY.title}
            </h2>
            <p className="mt-4 text-body text-white/85 whitespace-pre-line">
              {DOCUMENTARY.content}
            </p>
          </div>
        </div>
      </section>

      {/* ============ Partners Section ============ */}
      <section className="border-t border-white/10 bg-primary-dark py-12 sm:py-16" aria-labelledby="partners-heading">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 id="partners-heading" className="text-heading-2 text-white whitespace-nowrap">
              合作夥伴
            </h2>
            <div className="h-px w-full bg-accent hidden sm:block" aria-hidden="true" />
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {PARTNERS.map((partner) => {
              const linkClass =
                "flex flex-col items-center gap-2 text-center transition-all hover:opacity-90 hover:scale-[1.02] min-w-[120px] sm:min-w-[140px]";
              const logoContainerClass =
                "relative " + ("logoSize" in partner && partner.logoSize ? partner.logoSize : "h-14 w-24 sm:h-16 sm:w-28");
              const content = (
                <>
                  <div className={logoContainerClass}>
                    <Image
                      src={partner.logo}
                      alt={partner.logoAlt}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 640px) 96px, 112px"
                    />
                  </div>
                  <span className="text-xs font-medium text-white/90">{partner.name}</span>
                </>
              );
              return (
                <li key={partner.name}>
                  {"website" in partner && partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block ${linkClass}`}
                      aria-label={`${partner.name}（在新視窗開啟官網）`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className={linkClass}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
