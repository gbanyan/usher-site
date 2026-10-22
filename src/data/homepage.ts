/** Static homepage data, copied verbatim from the former Next.js page.tsx (Hugo homepage.yml). */

export const SLIDER_ITEMS = [
  {
    image: "/images/banner/hero-support.jpg",
    title: "台灣尤塞氏症暨視聽弱協會",
    content: "為視聽雙弱病友與家庭，提供支持、關懷與資源連結",
    button: { label: "關於我們", link: "/about" },
  },
  {
    image: "/images/banner/hero-sign-language.jpg",
    title: "尤塞氏症之病友團體",
    content: "我們是視聽雙弱的病友與家屬，彼此扶持，不再孤單",
    button: { label: "病友故事", link: "/story" },
  },
  {
    image: "/images/banner/hero-founding.jpg",
    title: "視聽雙弱障礙",
    content: "協助病友與相同境遇患者，共同面對生活中的挑戰",
    button: { label: "聯繫我們", link: "/contact" },
  },
];

export const FEATURE_ITEMS = [
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
      "有某些類型尤塞氏症患者，會有輕微至嚴重的平衡問題。另外也有案例報告，有嗅味覺喪失的情況。",
  },
];

export const ABOUT_SECTION = {
  title: "視聽雙弱族群的困境",
  image: "/images/banner/about-plight.jpg",
  content:
    "在台灣，除了尤塞氏症患者外，還有一群極為少數的人，因為不明原因（已證明或未證實的相關致病基因、後天因素），而一樣直接影響了視力、聽力，導致其比起正常人來說，直接被剝奪了，與外界溝通最重要的兩個管道。遺憾的是，由於群體極為少眾，以及特殊的雙重受限經驗，傳統的無障礙輔助設計、資源不見得適用。而在罕見疾病族群之中，也極為少見的基因型態，使其更難受到醫藥研究關注、照護資源的挹注。尤塞氏症與這些族群的共同困境，將會是本協會著重的課題。",
  button: { label: "病友故事", link: "/story" },
};

export const DOCUMENTARY = {
  bgImage: "/images/backgrounds/Film-Background.jpg",
  title: "聽\u2027見幸福的樂章",
  content:
    "導演：許豐明\n\n本片歷經一年籌備與三年以上拍攝，紀錄一個住在南澳深山中原住民家庭，經歷三個孩子自出生即失去聽力，成長過程中，三個孩子進入青春期後，卻又面臨即將失去視力的困境。全片透過三年長期追蹤，和分子遺傳學與現代科技知識的陪伴與引導，詳細記錄故事中人物，相互交錯的緣分，如何抉擇？如何讓自己重新開始找回存在的信心和意義，即使這些人這些事，面對未來將走向黑暗的世界已是無可避免，又如何在科技與親情交織下，度過生命中的幽谷與黯淡……。",
  videoLink: "https://www.youtube.com/watch?v=2S5x08XzBwI",
};

/* 合作夥伴 Logo：科懋、龍泰、慈濟大學均使用官方遠端 */
export interface Partner {
  name: string;
  description?: string;
  logo: string;
  logoAlt: string;
  website?: string;
  logoOnLightBg?: boolean;
  logoSize?: string;
}

export const PARTNERS: Partner[] = [
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
    logo: "/images/partners/tcu-logo.png", // 本地圖檔（537×118，寬版）
    logoAlt: "慈濟大學 Logo",
    website: "https://imbhg.tcu.edu.tw",
    logoSize: "h-16 w-52 sm:h-20 sm:w-64", // 裁切後 220×68，寬高比 3.2:1
  },
  {
    name: "Benevity",
    description: "企業慈善與志工平台，連結非營利組織與企業捐贈與志願服務",
    logo: "/images/partners/benevity-logo.svg",
    logoAlt: "Benevity Logo",
    website: "https://benevity.com/nonprofits",
    logoSize: "h-12 w-40 sm:h-14 sm:w-48", // SVG 寬版 216×59
  },
  {
    name: "Geneyx",
    description: "贊助協會每年 10 個家族的分析",
    logo: "/images/partners/geneyx-logo.png",
    logoAlt: "Geneyx Logo",
    website: "https://geneyx.com/",
    logoOnLightBg: true,
    logoSize: "h-20 w-40 sm:h-24 sm:w-48",
  },
  {
    name: "許豐明影像創意工作室",
    description: "感謝許豐明導演與工作室製作紀錄片《聽・見幸福的樂章》",
    logo: "/images/partners/hsu-fengming-studio-logo.svg",
    logoAlt: "許豐明影像創意工作室 Logo",
    website: "https://www.facebook.com/plumpig.tw", // Plum Pig 影像創意工作室
    logoSize: "h-10 w-44 sm:h-12 sm:w-52", // 文字較長，寬版
  },
  {
    name: "財團法人罕見疾病基金會",
    description: "罕見疾病病友服務與倡議",
    logo: "https://www.tfrd.org.tw/tfrd/assets/images/Logo.png",
    logoAlt: "財團法人罕見疾病基金會 Logo",
    website: "https://www.tfrd.org.tw/tfrd/home",
    logoOnLightBg: true, // 官網 Logo 為深色字，在深色區塊加淺底避免被吃掉
  },
];


export const FEATURE_ICON_PATHS: Record<string, string[]> = {
  search: [
    "M8.25 3.75c0 3.75 7.5 3.75 7.5 7.5s-7.5 3.75-7.5 7.5",
    "M15.75 3.75c0 3.75-7.5 3.75-7.5 7.5s7.5 3.75 7.5 7.5",
    "M8.625 6h6.75M7.875 11.25h8.25M8.625 16.5h6.75",
  ],
  headphone: [
    "M10.5 5.25a5.25 5.25 0 015.25 5.25v1.125a4.125 4.125 0 11-8.25 0V9a2.625 2.625 0 115.25 0v.75",
    "M18 8.25a6 6 0 010 7.5M20.25 7.125a7.5 7.5 0 010 9.75",
    "M4.5 4.5l15 15",
  ],
  eye: [
    "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
    "M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
    "M2.25 12h2.25m-1.5-1.5L4.5 12l-1.5 1.5M21.75 12H19.5m1.5-1.5L19.5 12l1.5 1.5",
  ],
  balance: [
    "M12 3.75v14.25M9 21h6",
    "M6 7.5h12M6 7.5l-2.25 4.5h4.5L6 7.5zM18 7.5l-2.25 4.5h4.5L18 7.5z",
    "M9.75 15.75a2.25 2.25 0 104.5 0",
  ],
};

/** Intrinsic pixel sizes of the local hero/section images (for width/height attributes). */
export const IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  "/images/banner/hero-support.jpg": { width: 944, height: 1417 },
  "/images/banner/hero-sign-language.jpg": { width: 1280, height: 960 },
  "/images/banner/hero-founding.jpg": { width: 1280, height: 960 },
  "/images/banner/banner_feature.jpg": { width: 800, height: 1280 },
  "/images/banner/about-plight.jpg": { width: 1620, height: 1080 },
};
