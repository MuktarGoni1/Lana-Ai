"use client";

import { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { getUserSubscription, cancelSubscription, updateSubscription } from "@/services/paymentService";
import { CreditCard, Calendar, Package, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SubscriptionManagement() {
  const { user } = useUnifiedAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch the user's subscription
      // For now, we'll simulate a subscription
      const mockSubscription = {
        id: "sub_mock123",
        planName: "Family",
        interval: "monthly",
        status: "active",
        startDate: "2024-01-15",
        endDate: "2024-02-15",
        amount: 19,
        nextBillingDate: "2024-02-15"
      };
      setSubscription(mockSubscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setCancelling(true);
    
    try {
      const success = await cancelSubscription(subscription.id);
      
      if (success) {
        // Refresh subscription data
        fetchSubscription();
        setShowCancelConfirm(false);
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to manage your subscription.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">No Active Subscription</h1>
              <p className="text-gray-600">You don't have an active subscription yet.</p>
            </div>
            
            <div className="text-center">
              <Link 
                href="/pricing" 
                className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Browse Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Subscription Management
          </h1>
          <p className="text-gray-600 mt-2">Manage your Lana AI subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Current Plan</h2>
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : subscription.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-xl mr-4">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{subscription.planName} Plan</h3>
                    <p className="text-gray-600">${subscription.amount}/{subscription.interval}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-3 rounded-xl mr-4">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Started</p>
                      <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 p-3 rounded-xl mr-4">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Next Billing</p>
                      <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">Payment Method</h3>
                  <div className="flex items-center bg-gray-50 rounded-xl p-4">
                    <CreditCard className="w-8 h-8 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium">Visa ending in •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/2025</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {subscription.status === 'active' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-1 bg-red-50 text-red-600 font-bold py-3 px-6 rounded-full border border-red-200 hover:bg-red-100 transition-all duration-300"
                    >
                      Cancel Subscription
                    </button>
                    <Link 
                      href="/pricing" 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Change Plan
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Summary */}
          <div>
            <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Account Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Account Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium truncate max-w-[120px]">{user.email}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Plan Type</span>
                  <span className="font-medium">{subscription.planName}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Next Billing</span>
                  <span className="font-medium">${subscription.amount}/{subscription.interval}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-3xl shadow-lg p-6 mt-6">
              <div className="flex">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Need Help?</h3>
                  <p className="text-sm text-gray-600">
                    Contact our support team for assistance with your subscription.
                  </p>
                  <Link 
                    href="/contact" 
                    className="inline-block mt-2 text-blue-600 font-medium text-sm hover:underline"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Subscription?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel your {subscription.planName} plan? You will lose access to premium features at the end of your billing period.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-full hover:bg-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                  >
                    {cancelling ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </span>
                    ) : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}