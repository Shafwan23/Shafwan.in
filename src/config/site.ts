import { Metadata } from 'next';

export const siteConfig = {
  name: 'shafwan.in',
  title: 'Shafwan Ahmed — Digital Headquarters',
  description: 'Developer, designer, and builder creating digital products, systems, and experiences that combine technology, design, and ambition.',
  url: 'https://shafwan.in',
  ogImage: 'https://shafwan.in/og.jpg',
  author: 'Shafwan Ahmed',
  themeColor: '#000000',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
  subdomains: {
    portfolio: 'https://portfolio.shafwan.in',
    projects: 'https://projects.shafwan.in',
    cv: 'https://cv.shafwan.in',
    blog: 'https://blog.shafwan.in',
    labs: 'https://labs.shafwan.in',
  }
};

export function constructMetadata({
  title = siteConfig.title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    authors: [{ name: siteConfig.author }],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: 'Shafwan Ahmed',
      description: 'Explore the digital headquarters of Shafwan Ahmed — projects, portfolio, experiments, ideas, and the systems behind them.',
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@shafwan',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
