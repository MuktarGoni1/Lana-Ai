import { Metadata } from "next";
import ClientBlogPostPage from "./ClientBlogPostPage";
import { getBlogPostBySlug } from "@/lib/blog-data";
import { SEO_CONFIG } from "@/lib/seo-config";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | LanaMind",
      description: "The requested blog post could not be found.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const publishedDate = new Date(post.date).toISOString();
  const modifiedDate = new Date(post.date).toISOString();

  return {
    title: `${post.title} | LanaMind Blog`,
    description: post.excerpt,
    keywords: [
      post.title.toLowerCase().replace(/\s+/g, ' '),
      'ai tutoring',
      'personalized learning',
      'educational technology',
      'student success',
      'learning strategies',
      'parent tips',
      'education insights',
    ],
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: SEO_CONFIG.site.name,
    openGraph: {
      type: 'article',
      locale: SEO_CONFIG.site.locale,
      url: `/blog/${post.slug}`,
      siteName: SEO_CONFIG.site.name,
      title: post.title,
      description: post.excerpt,
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
      authors: [post.author],
      section: 'Blog',
      tags: [
        'AI Tutoring',
        'Personalized Learning',
        'Education Technology',
        'Student Success',
      ],
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['/opengraph-image.png'],
      creator: SEO_CONFIG.social.twitter,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default function Page({ params }: Props) {
  return <ClientBlogPostPage slug={params.slug} />;
}

export function generateStaticParams() {
  // This would be dynamic in a real app with a database
  return [
    { slug: 'future-of-personalized-learning' },
    { slug: 'understanding-children-learning-styles' },
    { slug: 'supporting-child-education-home' },
    { slug: 'technology-early-childhood-education' },
    { slug: 'building-confidence-math-science' },
    { slug: 'learning-friendly-home-environment' },
  ];
}