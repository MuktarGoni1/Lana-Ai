import React from 'react';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-lg text-gray-600">
            Last Updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              At LanaMind, we are committed to providing exceptional educational services and ensuring complete customer satisfaction. This Refund Policy outlines the terms and conditions under which refunds may be issued for our services.
            </p>
            <p className="text-gray-700">
              This policy applies to all purchases made through our website and is designed to be fair and transparent for all users.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility for Refunds</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Full Refunds</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Services purchased but not yet activated or used</li>
              <li>Technical issues that prevent access to purchased services</li>
              <li>Services that do not function as described on our website</li>
              <li>Billing errors or duplicate charges</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Partial Refunds</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Unused portion of subscription periods</li>
              <li>Services used for less than 7 days with valid technical issues</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Time Limits for Refund Requests</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>General Time Limit:</strong> Refund requests must be submitted within 30 days of purchase.
              </p>
            </div>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Subscription services: Within 30 days of initial charge</li>
              <li>One-time purchases: Within 30 days of purchase date</li>
              <li>Unused services: Must be requested before service activation</li>
            </ul>
            <p className="text-gray-700">
              Requests submitted after these time limits may be considered on a case-by-case basis but are not guaranteed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Non-Refundable Items</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Services that have been fully utilized or expired</li>
              <li>Customized content or personalized services already delivered</li>
              <li>Downloadable materials that have been accessed</li>
              <li>Services used for more than 7 days without technical issues</li>
              <li>Refunds requested due to change of mind or personal circumstances</li>
              <li>Services purchased during promotional periods with specific non-refundable terms</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Refund Process</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">How to Request a Refund</h3>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>Contact our customer support team at <a href="mailto:support@lanamind.com" className="text-blue-600 hover:underline">support@lanamind.com</a></li>
              <li>Provide your order details, including purchase date and transaction ID</li>
              <li>Explain the reason for your refund request</li>
              <li>Include any relevant documentation or screenshots</li>
            </ol>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Processing Time</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Initial response: Within 24-48 business hours</li>
              <li>Refund processing: 5-10 business days after approval</li>
              <li>Payment method return: Varies by payment provider (typically 3-5 business days)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Special Circumstances</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">Technical Issues</h3>
            <p className="text-gray-700 mb-4">
              If you experience technical issues that prevent you from accessing our services, please contact support immediately. We will work to resolve the issue or provide a refund if resolution is not possible.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Family Plans and Group Subscriptions</h3>
            <p className="text-gray-700 mb-4">
              Refunds for family plans or group subscriptions are handled on a pro-rated basis for unused portions, subject to the standard 30-day time limit.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Promotional Offers</h3>
            <p className="text-gray-700">
              Special promotional offers may have different refund terms, which will be clearly stated at the time of purchase.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
            <div className="bg-gray-100 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Customer Support:</strong> <a href="mailto:support@lanamind.com" className="text-blue-600 hover:underline">support@lanamind.com</a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className="text-gray-700">
                <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Policy Changes</h2>
            <p className="text-gray-700">
              LanaMind reserves the right to modify this refund policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after any changes constitutes acceptance of the modified policy.
            </p>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-gray-600 text-center">
              For questions about this Refund Policy, please contact us at{' '}
              <a href="mailto:support@lanamind.com" className="text-blue-600 hover:underline">
                support@lanamind.com
              </a>
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}