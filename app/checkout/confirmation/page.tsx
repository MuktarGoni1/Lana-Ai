"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, User } from "lucide-react";

// This is a placeholder confirmation page to avoid build errors
// The actual confirmation functionality would be implemented separately
export default function CheckoutConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmation Page</h2>
        <p className="text-gray-600 mb-6">
          This is a placeholder for the checkout confirmation page.
        </p>
        <Link 
          href="/homepage" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
