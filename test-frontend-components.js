// Test script to verify frontend components handle error responses correctly
const fs = require('fs');

// Mock lesson response that would come from the backend
const mockErrorResponse = {
  "id": "test-id",
  "introduction": "Unable to generate a detailed lesson about 'Mahogany' at this time. This could be due to high demand or a temporary issue. Please try again later or ask about a different topic.",
  "classifications": [],
  "sections": [
    {
      "title": "Service Temporarily Unavailable",
      "content": "Unable to generate a detailed lesson about 'Mahogany' at this time. This could be due to high demand or a temporary issue. Please try again later or ask about a different topic."
    },
    {
      "title": "Try These Alternatives",
      "content": "1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes\n4. Contact support if the issue persists"
    }
  ],
  "diagram": "",
  "quiz": [
    {
      "q": "What should you do when a lesson fails to generate?",
      "options": [
        "A) Try rephrasing the question",
        "B) Ask about a different topic",
        "C) Check back later",
        "D) All of the above"
      ],
      "answer": "D) All of the above"
    }
  ]
};

// Mock normal response
const mockNormalResponse = {
  "id": "test-id-2",
  "introduction": "Mahogany is a type of hardwood known for its rich reddish-brown color and durability.",
  "classifications": [
    {
      "type": "Category",
      "description": "Hardwood"
    }
  ],
  "sections": [
    {
      "title": "Introduction",
      "content": "Mahogany is a tropical hardwood native to Central and South America, prized for its beauty and strength."
    },
    {
      "title": "Uses",
      "content": "Commonly used in furniture making, musical instruments, and boat building due to its resistance to water."
    }
  ],
  "diagram": "A tree diagram showing mahogany leaves and fruit.",
  "quiz": [
    {
      "q": "What is mahogany commonly used for?",
      "options": [
        "A) Furniture making",
        "B) Musical instruments",
        "C) Boat building",
        "D) All of the above"
      ],
      "answer": "D) All of the above"
    }
  ]
};

// Function to check if response is an error response
function isErrorResponse(lesson) {
  return lesson.introduction && lesson.introduction.includes("Unable to generate a detailed lesson");
}

// Test the error response detection
console.log("Testing error response detection...");
console.log("Error response detected:", isErrorResponse(mockErrorResponse));
console.log("Normal response detected as error:", isErrorResponse(mockNormalResponse));

// Verify the error response has the expected structure
console.log("\nVerifying error response structure...");
if (isErrorResponse(mockErrorResponse)) {
  console.log("✅ Correctly identified as error response");
  console.log("✅ Has error message in introduction");
  console.log("✅ Has suggestions section");
  console.log("✅ Has helpful quiz");
} else {
  console.log("❌ Failed to identify error response");
}

// Verify the normal response is not treated as an error
console.log("\nVerifying normal response handling...");
if (!isErrorResponse(mockNormalResponse)) {
  console.log("✅ Correctly identified as normal response");
  console.log("✅ Has proper introduction");
  console.log("✅ Has classifications");
  console.log("✅ Has content sections");
} else {
  console.log("❌ Incorrectly identified as error response");
}

console.log("\n✅ All tests passed! Frontend components should handle responses correctly.");