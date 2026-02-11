import { Metadata } from "next";
import ClientFeaturesPage from './ClientFeaturesPage';
import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Features | LanaMind AI Tutoring Platform'
  },
  description: 'Discover LanaMind\'s powerful AI tutoring features including personalized learning paths, real-time progress tracking, adaptive assessments, and parent dashboard monitoring.',
  keywords: [
    'ai tutoring features',
    'personalized learning tools',
    'educational ai capabilities',
    'student progress tracking',
    'adaptive learning technology',
    'parent dashboard features',
    'ai quiz generation',
    'learning analytics dashboard'
  ],
};

export default function Page() {
  return <ClientFeaturesPage />;
}