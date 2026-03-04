// UI Styles Utility for consistent design across all pages
// Based on the landing page's clean, child-friendly aesthetic

export const getChildFriendlyClasses = {
  // Clean, pastel cards like the "Advanced Editing Tools" section in the landing page
  card: "rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden",
  
  // The specific Golden Yellow button from the landing page
  button: "rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-extrabold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
  
  // Secondary button (White with subtle border)
  buttonSecondary: "rounded-full bg-white text-slate-700 font-bold py-4 px-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-200",
  
  buttonSmall: "rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-bold py-3 px-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
  input: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
  
  // Clean white header
  header: "bg-white/90 backdrop-blur-md border-b border-slate-100",
  
  // Clean backgrounds instead of heavy gradients
  section: "py-16 bg-white",
  sectionAlt: "py-16 bg-slate-50", 
  hero: "py-12 bg-white",
};

// Helper for pastel backgrounds seen in the landing page (Purple, Green, Peach, Blue)
export const getPastelBg = (index: number) => {
  const colors = [
    "bg-[#F3F0FF]", // Light Purple
    "bg-[#ECFDF5]", // Light Mint
    "bg-[#FFF7ED]", // Light Peach
    "bg-[#EFF6FF]", // Light Blue
  ];
  return colors[index % colors.length];
};