'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

// Ensure this page is not statically generated
export const dynamic = 'force-dynamic';

function ConsentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestUserConsent, hasGivenConsent, user } = useComprehensiveAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [consentValues, setConsentValues] = useState({
    privacyPolicyAccepted: false,
    termsOfServiceAccepted: false,
    marketingCommunication: false,
    childDataUsage: false,
  });
  
  const returnTo = searchParams.get('returnTo') || '/homepage';

  // Check if user has already given consent
  useEffect(() => {
    if (hasGivenConsent()) {
      router.push(returnTo);
    }
  }, [hasGivenConsent, router, returnTo]);

  const handleConsentChange = (field: keyof typeof consentValues) => {
    setConsentValues(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestUserConsent({
        ...consentValues,
        createdAt: new Date().toISOString()
      });

      if (result.success) {
        // Redirect to the intended destination
        router.push(returnTo);
      } else {
        setError(result.error || 'Failed to save consent. Please try again.');
      }
    } catch (err) {
      console.error('Consent submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if all required consents are given
  const allRequiredConsentsGiven = consentValues.privacyPolicyAccepted && consentValues.termsOfServiceAccepted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Data Usage Consent</CardTitle>
          <CardDescription className="text-gray-300">
            Please review and accept our terms to continue
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg">
                <Checkbox
                  id="privacy-policy"
                  checked={consentValues.privacyPolicyAccepted}
                  onCheckedChange={() => handleConsentChange('privacyPolicyAccepted')}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="privacy-policy" className="font-medium">
                    Privacy Policy
                  </Label>
                  <p className="text-sm text-gray-400">
                    I agree to the{' '}
                    <Link href="/privacy-policy" className="text-blue-400 hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    and understand how my data will be collected, used, and protected.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg">
                <Checkbox
                  id="terms-of-service"
                  checked={consentValues.termsOfServiceAccepted}
                  onCheckedChange={() => handleConsentChange('termsOfServiceAccepted')}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms-of-service" className="font-medium">
                    Terms of Service
                  </Label>
                  <p className="text-sm text-gray-400">
                    I agree to the{' '}
                    <Link href="/terms-of-service" className="text-blue-400 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and understand the rules governing my use of this service.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg">
                <Checkbox
                  id="marketing-communication"
                  checked={consentValues.marketingCommunication}
                  onCheckedChange={() => handleConsentChange('marketingCommunication')}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="marketing-communication" className="font-medium">
                    Marketing Communications
                  </Label>
                  <p className="text-sm text-gray-400">
                    I consent to receive marketing communications, updates, and promotional materials via email.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg">
                <Checkbox
                  id="child-data-usage"
                  checked={consentValues.childDataUsage}
                  onCheckedChange={() => handleConsentChange('childDataUsage')}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="child-data-usage" className="font-medium">
                    Child Data Usage
                  </Label>
                  <p className="text-sm text-gray-400">
                    I consent to the collection and usage of my child's data for educational purposes as outlined in our privacy policy.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              type="submit"
              disabled={!allRequiredConsentsGiven || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/logout')}
              className="w-full sm:w-auto"
            >
              Decline and Log Out
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm border-gray-700 rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Loading consent form...</p>
        </div>
      </div>
    }>
      <ConsentPageContent />
    </Suspense>
  );
}