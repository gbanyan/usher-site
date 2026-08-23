export type SiteLocale = "zh-TW" | "en";

/**
 * First-stage English copy is intentionally kept in one place while the CMS
 * translation model is being designed. Editorial content from the CMS should
 * move here only when it has an approved English translation.
 */
export const EN_COPY = {
  organizationName: "Taiwan Usher Syndrome and Deafblind Association",
  organizationShortName: "Taiwan Usher Syndrome and Deafblind Association",
  languageName: "English",
  languageSwitchLabel: "繁體中文",
  nav: {
    about: "About the Association",
    purpose: "Our Purpose",
    structure: "Organization Structure",
    message: "President's Message",
    logo: "Logo Symbolism",
    relatedNews: "Related News",
    resources: "Resource Center",
    documents: "Association Documents",
    guides: "Advice & Guidelines",
    stories: "Patient Stories",
    updates: "Latest Updates",
    notices: "Announcements",
    blog: "Blog",
    contact: "Contact Information",
  },
  home: {
    slides: [
      {
        title: "Taiwan Usher Syndrome and Deafblind Association",
        content:
          "Providing support, care, and resource connections for deafblind people and their families.",
        button: "About Us",
      },
      {
        title: "An Usher Syndrome Patient Support Group",
        content:
          "We are deafblind people and families, supporting each other so no one is alone.",
        button: "Our Community",
      },
      {
        title: "Deafblindness",
        content:
          "Helping people in our community and others facing similar circumstances meet life's challenges together.",
        button: "Contact Us",
      },
    ],
    featureHeading: "What is Usher Syndrome?",
    features: [
      {
        name: "What is Usher Syndrome?",
        content:
          "Usher syndrome is a rare genetic disorder affecting an estimated 400,000 people worldwide. Its primary characteristics are congenital hearing loss and retinitis pigmentosa, which affects the eyes. Some people with Usher syndrome may also experience balance issues.",
      },
      {
        name: "Hearing Loss",
        content:
          "People with Usher syndrome may experience hearing loss at birth or progressively as they grow. This is primarily sensorineural hearing loss, typically affecting mid-to-high frequencies.",
      },
      {
        name: "Retinitis Pigmentosa",
        content:
          "Usher syndrome causes retinitis pigmentosa. The affected retina gradually degenerates, leading to night blindness and a narrowed visual field, often referred to as tunnel vision—a condition where only central vision remains.",
      },
      {
        name: "Balance Issues and Others",
        content:
          "Some types of Usher syndrome involve mild to severe balance issues. There are also case reports of loss of smell and taste. Clinically, Usher syndrome is traditionally classified by symptom severity and disease progression.",
      },
    ],
    communityTitle: "The Challenges Facing the Deafblind Community",
    communityContent:
      "In Taiwan, apart from people with Usher syndrome, an extremely small group of people also experience direct impacts on both vision and hearing due to various causes, including proven or unconfirmed pathogenic genes and acquired factors. As a result, they are deprived of two of the most important channels for communicating with the world. Unfortunately, because this community is so small and its members have unique dual-sensory experiences, traditional accessibility designs and resources are not always applicable. Their extremely rare genetic profiles also make it harder to attract medical research and care resources within the rare disease community. The shared challenges of people with Usher syndrome and these communities are a core focus of our association.",
    storiesButton: "Our Community",
    storiesTitle: "Patient Stories",
    storiesFallback:
      "These stories are currently presented in Chinese. The original stories remain available below.",
    storiesFallbackLink: "View all stories in Chinese",
    latestNews: "Latest News",
    relatedNews: "Related News",
    more: "View More",
    unavailableTitle: "Latest content temporarily unavailable",
    unavailableDescription:
      "Please refresh the page later, or use the navigation above to explore each content category.",
    supportEyebrow: "Volunteering, Donations, or Partnerships",
    supportTitle: "All forms of support and sponsorship are welcome!",
    contactButton: "Contact Us",
    documentaryTitle: "Hearing and Seeing the Melody of Happiness",
    documentaryContent:
      "Director: Feng-Ming Hsu\n\nAfter a year of preparation and more than three years of filming, this documentary follows an Indigenous family living deep in the mountains of Nan'ao. All three children were born with hearing loss, and upon entering adolescence they faced the additional challenge of impending vision loss. Through three years of long-term observation, accompanied by molecular genetics and modern technology, the film documents their intertwined lives and choices—and how technology and family love help them navigate the valleys and shadows of life.",
    partners: "Partners",
  },
  footer: {
    summary:
      "Dedicated to promoting Usher syndrome research, supporting people with Usher syndrome and their families, and fostering social awareness and understanding of deafblindness.",
    quickLinks: "Quick Links",
    social: "Social Media",
    contact: "Contact Information",
    address: "Address",
    taxId: "Tax ID",
    email: "Email",
    phone: "Phone",
    external: "(opens in a new window)",
  },
  contact: {
    title: "Contact Information",
    description: "Please feel free to contact us; we are here to help.",
    donation: "Donation Channels",
    association: "Association Information",
    associationName: "Association Name",
    legal: "Registration & Legal Information",
    authority: "Registering Authority",
    registrationLetter: "Registration Letter Number",
    corporateRegistration: "Corporate Registration Number",
    referToDocuments: "Please refer to the public documents below.",
    certificate: "Registration certificate is publicly available:",
    social: "Social Media",
    line: "LINE Group",
    lineDescription: "Join our LINE group to connect with other people in the community.",
    facebook: "Facebook Group",
    facebookDescription: "Follow our latest news and event updates.",
    taxId: "Tax ID",
    email: "Email",
    phone: "Phone",
    address: "Address",
  },
  accessibility: {
    skip: "Skip navigation and go to main content",
    home: "Home",
    hero: "Homepage hero carousel",
  },
} as const;

export const EN_SECTION_LABELS = {
  blog: "Blog",
  notice: "Announcements",
  document: "Association Documents",
  related_news: "Related News",
  story: "Patient Stories",
  guides: "Advice & Guidelines",
} as const;
