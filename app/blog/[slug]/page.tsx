import { Metadata } from "next";
import ClientBlogPostPage from "./ClientBlogPostPage";
import { getBlogPostBySlug } from "@/lib/blog-data";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "Blog Post Not Found | Lana AI",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: `${post.title} | Lana AI Blog`,
    description: post.excerpt,
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