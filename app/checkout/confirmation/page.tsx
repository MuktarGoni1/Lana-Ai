"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, User } from "lucide-react";

export default function CheckoutConfirmation() {
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would verify the payment with your backend
    // using the session_id from the URL params
    const sessionId = searchParams.get("session_id");
    
    if (sessionId) {
      // Simulate API call to verify payment
      setTimeout(() => {
        setTransactionId(`txn_${Math.random().toString(36).substr(2, 9)}`);
        setLoading(false);
      }, 1500);
    } else {
      // Fallback for direct access
      setTransactionId(`txn_${Math.random().toString(36).substr(2, 9)}`);
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Confirmed!
          </h1>
          
          <p className="text-gray-600 mb-2">
            Thank you for subscribing to Lana AI!
          </p>
          
          <p className="text-gray-600 mb-8">
            Your payment has been processed successfully.
          </p>
          
          {transactionId && (
            <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
              <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
              <p className="font-mono text-blue-700">{transactionId}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Link>
            
            <Link 
              href="/profile" 
              className="flex items-center justify-center gap-2 w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200"
            >
              <User className="w-5 h-5" />
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}