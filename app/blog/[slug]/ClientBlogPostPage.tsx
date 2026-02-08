"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Header, Footer } from "@/components/navigation";
import { getBlogPostBySlug, type BlogPost } from "@/lib/blog-data";

type Props = {
  slug: string;
};

function BlogPostContent({ post }: { post: BlogPost }) {
  return (
    <article className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-primary hover:underline mb-6 text-sm"
          >
            ← Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:underline">
          {post.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{paragraph.substring(2)}</h1>;
            } else if (paragraph.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.substring(3)}</h2>;
            } else if (paragraph.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-bold mt-4 mb-2">{paragraph.substring(4)}</h3>;
            } else if (paragraph.startsWith('1. ')) {
              return <ol key={index} className="list-decimal pl-6 mt-3 space-y-1 text-muted-foreground">
                {paragraph.split('\n').map((item, i) => (
                  <li key={i} className="pl-2">{item.substring(3)}</li>
                ))}
              </ol>;
            } else if (paragraph.startsWith('- ')) {
              return <ul key={index} className="list-disc pl-6 mt-3 space-y-1 text-muted-foreground">
                {paragraph.split('\n').map((item, i) => (
                  <li key={i} className="pl-2">{item.substring(2)}</li>
                ))}
              </ul>;
            } else if (paragraph.trim() !== '') {
              return <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>;
            }
            return null;
          })}
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Share this article</h3>
              <div className="flex gap-3">
                <Link 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://lanamind.com/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  Twitter
                </Link>
                <Link 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://lanamind.com/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-900 transition-colors"
                >
                  Facebook
                </Link>
              </div>
            </div>
            <Link 
              href="/blog" 
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View All Articles
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function NotFoundContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been moved.</p>
        <Link 
          href="/blog" 
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Blog
        </Link>
      </div>
    </section>
  );
}

export default function ClientBlogPostPage({ slug }: Props) {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  
  useEffect(() => { 
    setMounted(true); 
    setTheme("light");
    
    const foundPost = getBlogPostBySlug(slug);
    setPost(foundPost || null);
  }, [slug, setTheme]);

  if (!mounted) { 
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-cyan-900/20 text-foreground font-sans">
        <Header />
        <main className="flex-grow">
          <div className="py-12 md:py-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-8"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-cyan-900/20 text-foreground font-sans">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      
      <Header />
      <main id="main-content" className="flex-grow">
        {post ? <BlogPostContent post={post} /> : <NotFoundContent />}
      </main>
      <Footer />
    </div>
  );
}