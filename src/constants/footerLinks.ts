export interface FooterLink {
  readonly badge?: string;
  readonly href: string;
  readonly id: string;
  readonly rel?: string;
  readonly text: string;
}

export const learnMoreLinks: readonly FooterLink[] = [
  {
    href: '/about',
    id: 'about-us',
    text: 'About DuckDuckGo',
  },
  {
    href: '/app',
    id: 'ddg-browser',
    text: 'About Our Browser',
  },
  {
    href: '/pro',
    id: 'subscription',
    text: 'DuckDuckGo Subscription',
  },
  {
    href: '/updates',
    id: 'updates',
    text: 'What’s New',
  },
  {
    href: '/compare-privacy',
    id: 'compare-privacy',
    text: 'Compare Privacy',
  },
  {
    href: 'https://spreadprivacy.com',
    id: 'blog',
    text: 'Blog',
  },
  {
    href: '/newsletter',
    id: 'newsletter',
    text: 'Newsletter',
  },
  {
    badge: 'NEW',
    href: 'https://insideduckduckgo.substack.com/?showWelcome=true',
    id: 'substack',
    text: 'Podcast',
  },
];

export const otherResourcesLinks: readonly FooterLink[] = [
  {
    href: '/duckduckgo-help-pages/',
    id: 'help',
    text: 'Help',
  },
  {
    href: 'https://www.reddit.com/r/duckduckgo/',
    id: 'community',
    rel: 'noopener noreferrer',
    text: 'Community',
  },
  {
    href: '/hiring',
    id: 'careers',
    text: 'Careers',
  },
  {
    href: '/privacy',
    id: 'privacy',
    text: 'Privacy Policy',
  },
  {
    href: '/terms',
    id: 'terms',
    text: 'Terms of Service',
  },
  {
    href: '/press',
    id: 'press',
    text: 'Press Kit',
  },
  {
    href: '/duckduckgo-help-pages/company/advertise-on-duckduckgo-search',
    id: 'advertise',
    text: 'Advertise on Search',
  },
];
