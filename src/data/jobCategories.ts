export interface JobSubcategory {
  name: string;
  notes?: string;
}

export interface JobCategory {
  title: string;
  slug: string; // new slug property
  description: string;
  image: string;
  subcategories: JobSubcategory[];
}

// All categories & subcategories with custom slugs
export const jobCategories: JobCategory[] = [
  {
    title: "Care & Household",
    slug: "care-household",
    description:
      "Find caregiving and household jobs that match your skills. Connect with families and homeowners looking for reliable help.",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Caregivers (elderly, disabled, child care)" },
      { name: "Babysitters / Nannies" },
      { name: "House Helpers / Maids" },
      { name: "Gardeners / Landscapers" },
    ],
  },
  {
    title: "Driving & Transport",
    slug: "driving-transport",
    description:
      "Explore driving and delivery opportunities. Make commuting safe and efficient for families and businesses.",
    image:
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Family / Personal Drivers (with LTO license check)" },
      { name: "Delivery Riders / Drivers (motorcycle, van)" },
    ],
  },
  {
    title: "Construction Trades & Craftsmanship",
    slug: "construction-trades-craftsmanship",
    description:
      "Connect with employers seeking skilled craftsmen and tradespeople for construction and renovation work.",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Carpenters" },
      { name: "Masons" },
      { name: "Welders" },
      { name: "Painters" },
      { name: "Upholsterers" },
      { name: "Mandudukit / Wood Carvers" },
    ],
  },
  {
    title: "Personal & Wellness",
    slug: "personal-wellness",
    description:
      "Jobs related to personal care and wellness. Help clients look and feel their best.",
    image:
      "https://images.unsplash.com/photo-1556228720-7b0c61b47c31?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Manicurists / Pedicurists (Nail Spa Tech)" },
      { name: "Barbers / Beauticians / Spa Staff" },
      { name: "Masseuse / Massage Therapists (TESDA/DOH cert recommended)" },
    ],
  },
  {
    title: "Logistics & General Labor",
    slug: "logistics-general-labor",
    description:
      "Jobs in warehouses, supermarkets, and general labor. Perfect for those seeking physical work opportunities.",
    image:
      "https://images.unsplash.com/photo-1581091215364-16e3cb2e5a47?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Warehouse Workers / Loaders" },
      { name: "Janitors / Utility Workers" },
      { name: "Supermarket Staff / Grocery Workers (baggers, stockers, assistants)" },
    ],
  },
  {
    title: "Specialized/Seasonal Work",
    slug: "specialized-seasonal-work",
    description:
      "Short-term or seasonal jobs for farming, fishing, and poultry work. Perfect for those seeking flexible work.",
    image:
      "https://images.unsplash.com/photo-1578934105117-2fc3c04b7b2b?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Farmers" },
      { name: "Fishermen" },
      { name: "Poultry Workers" },
    ],
  },
  {
    title: "Licensed Healthcare Professionals",
    slug: "licensed-healthcare-professionals",
    description:
      "Jobs for PRC-verified healthcare professionals. Ensure your skills are matched with employers who need certified professionals.",
    image:
      "https://images.unsplash.com/photo-1588776814546-4e2a9f9871da?auto=format&fit=crop&w=1000&q=80",
    subcategories: [
      { name: "Registered Nurses (RNs)" },
      { name: "Physical Therapists (PTs)" },
      { name: "Occupational Therapists (OTs)" },
      { name: "Chiropractors" },
    ],
  },
];
