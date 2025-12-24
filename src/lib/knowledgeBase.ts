// src/lib/knowledgeBase.ts

// --- TYPES & INTERFACES ---

export type QCType = 'physical' | 'service' | 'software';

export type Standard = 
  | 'General' 
  | 'ISO 9001' 
  | 'HACCP' 
  | 'ASTM' 
  | 'EU-GMP' 
  | 'API (Oil)' 
  | 'Kimberley (Gems)' 
  | 'FDA (21 CFR)'
  | 'ISO 27001';

export type BusinessModel = 'B2B' | 'B2C' | 'B2B2C' | 'C2C' | 'B2G';
export type AgreementStatus = 'pending_qc' | 'ready_to_sign' | 'party_a_signed' | 'completed'; 

export interface QcParam {
  cat: string;
  hint: string;
}

export interface BusinessModelRequirement {
  name: string;
  hint: string;
}

export interface Category {
  name: string;
  params: QcParam[];
}

export interface BusinessSegment {
  name: 'B2B' | 'B2C' | 'B2G' | 'All';
  requirements: BusinessModelRequirement[];
  categories: Category[];
}

export interface Industry {
  name: string;
  applicable_types: QCType[];
  default_standard: Standard;
  segments: BusinessSegment[];
}

// --- SHARED TYPES FOR DASHBOARD (Centralized here to avoid duplicates) ---
export interface ChecklistItem {
  category: string;
  requirement: string;
  status: 'pending' | 'pass' | 'fail';
  gapAnalysis?: string;
  evidence?: string;
  evidenceBefore?: string;
  evidenceAfter?: string;
}

export interface ChatMessage {
  senderId: string;
  senderEmail: string;
  textOriginal: string;
  textTranslated: string;
  originalLang: string;
  timestamp: any;
}

export interface Checklist {
  id: string;
  uid: string;
  sellerEmail?: string; 
  buyerEmail?: string;  
  title: string;
  type: QCType;
  businessModel: BusinessModel;
  industry: string;
  standard: Standard;
  score: number;
  items: ChecklistItem[];
  messages?: ChatMessage[];
  createdAt: any;
  agreementStatus?: 'ready_to_sign' | 'party_a_signed' | 'completed';
  meetingStartedAt?: any;
  lastMeetingInitiator?: string;
  activeMeetingPlatform?: 'teams' | 'meet';
  activeMeetingUrl?: string;
}

// --- THE ULTIMATE GLOBAL KNOWLEDGE BASE ---
export const KNOWLEDGE_BASE: Industry[] = [
  // --- 1. Industrial Machinery ---
  {
    name: "Industrial Machinery",
    applicable_types: ['physical'],
    default_standard: 'ISO 9001',
    segments: [
      {
        name: "B2B",
        requirements: [{ name: "Purchase Order (PO) Compliance", hint: "Verify model numbers, quantities, and pricing against PO." }, { name: "Factory Acceptance Test (FAT)", hint: "Confirm FAT was completed and passed." }],
        categories: [
          { name: "Mechanical", params: [{ cat: "Welding Integrity", hint: "X-ray/Ultrasonic weld inspection" }, { cat: "Dimensional Tolerance", hint: "CNC precision verification (+/- 0.05mm)" }] },
          { name: "Electrical", params: [{ cat: "Motor Performance", hint: "Load testing and heat dissipation check" }, { cat: "Control Panel", hint: "PLC logic and wiring conforms to specs" }] },
          { name: "Safety", params: [{ cat: "Emergency Stop", hint: "Functionality and response time test" }, { cat: "CE/UL Certification", hint: "Verify compliance markings and documentation" }] },
        ]
      },
      {
        name: "B2G",
        requirements: [{ name: "Tender Specification Adherence", hint: "Ensure every line item from the government tender is met." }, { name: "Country of Origin Certificate", hint: "Verify COO for customs." }],
        categories: [
          { name: "Military Spec (MIL-STD)", params: [{ cat: "Vibration Resistance", hint: "MIL-STD-810G vibration test passed" }, { cat: "EMP Shielding", hint: "Electromagnetic pulse shielding verification" }] },
        ]
      }
    ]
  },
  // --- 2. Home Appliances & Cookware ---
  {
    name: "Home Appliances & Cookware",
    applicable_types: ['physical'],
    default_standard: 'General',
    segments: [
      {
        name: "B2C",
        requirements: [{ name: "Packaging Integrity", hint: "Box is sealed and undamaged." }, { name: "User Manual", hint: "Manual is included and legible." }],
        categories: [
          { name: "Safety", params: [{ cat: "Electrical Safety", hint: "Hi-pot and ground continuity test" }, { cat: "Material Safety", hint: "Food-grade (FDA/LFGB) material certs" }] },
          { name: "Performance", params: [{ cat: "Energy Efficiency", hint: "Power consumption meets rating" }, { cat: "Functional Test", hint: "Verify all advertised functions work" }] },
          { name: "Cosmetics", params: [{ cat: "Surface Finish", hint: "Check for scratches, dents, or paint defects" }] },
        ]
      },
      {
        name: "B2B",
        requirements: [{ name: "Bulk Order Manifest", hint: "Verify quantities and SKUs for pallets." }],
        categories: [
          { name: "Durability", params: [{ cat: "Lifecycle Test", hint: "Endurance test for commercial use" }] },
          { name: "Packaging", params: [{ cat: "Packaging", hint: "Bulk packaging drop test passed" }] },
        ]
      }
    ]
  },
  // --- 3. Garments & Apparel ---
  {
    name: "Garments & Apparel",
    applicable_types: ['physical'],
    default_standard: 'General',
    segments: [
      {
        name: "All",
        requirements: [{ name: "Tech Pack Adherence", hint: "All specs must match the buyer's technical package." }, { name: "Labeling Compliance", hint: "Care, fiber, and COO labels are correct." }],
        categories: [
          { name: "Fabric Quality", params: [{ cat: "GSM Check", hint: "Fabric weight (Grams per Square Meter)" }, { cat: "Color Fastness", hint: "Rub test for color bleeding" }, { cat: "Shrinkage Test", hint: "Verify fabric shrinkage % after wash" }] },
          { name: "Workmanship", params: [{ cat: "Stitches Per Inch (SPI)", hint: "Verify SPI matches tech pack" }, { cat: "Symmetry Check", hint: "Alignment of collars, pockets, sleeves" }] },
          { name: "Measurement", params: [{ cat: "Point of Measure (POM)", hint: "Check critical measurements against size chart tolerance" }] },
          { name: "Trims & Accessories", params: [{ cat: "Zipper/Button Test", hint: "Functionality and attachment strength (pull test)" }] },
        ]
      }
    ]
  },
   // --- 4. Food & Beverage ---
  {
    name: "Food & Beverage",
    applicable_types: ['physical'],
    default_standard: 'HACCP',
    segments: [
      {
        name: "All",
        requirements: [{ name: "Expiry Date & Lot Code", hint: "Verify dates are correct and legible." }, { name: "Cold Chain Integrity", hint: "Temperature logs show no breaches." }],
        categories: [
          { name: "Microbiological", params: [{ cat: "Pathogen Test", hint: "Absence of Salmonella, E. coli, Listeria" }, { cat: "Total Plate Count", hint: "Check for overall bacterial levels" }] },
          { name: "Chemical", params: [{ cat: "Allergen Statement", hint: "Verify label for common allergens" }, { cat: "Nutritional Analysis", hint: "Lab report matches label information" }] },
          { name: "Physical", params: [{ cat: "Foreign Matter Detection", hint: "X-ray or metal detector scan" }] },
          { name: "Traceability", params: [{ cat: "Cold Chain Log", hint: "Verify temperature from origin to facility" }, { cat: "Lot Code Verification", hint: "Batch/Lot number is correct and legible" }] },
        ]
      }
    ]
  },
  // --- 5. Electric & Electronics ---
  {
    name: "Electric & Electronics",
    applicable_types: ['physical'],
    default_standard: 'General',
    segments: [
      {
        name: "All",
        requirements: [{ name: "BOM Check", hint: "Verify all components match Bill of Materials." }],
        categories: [
          { name: "Component Verification", params: [{ cat: "Authenticity", hint: "Check for counterfeit components via sourcing docs" }] },
          { name: "Soldering Quality", params: [{ cat: "IPC-A-610 Standard", hint: "Visual inspection for solder joints" }] },
          { name: "Functional Test", params: [{ cat: "Firmware Flash", hint: "Device powers on and boots correctly" }, { cat: "I/O Port Test", hint: "Verify all ports and connectors are functional" }] },
          { name: "Compliance", params: [{ cat: "RoHS/REACH", hint: "Certification for hazardous substances" }, { cat: "FCC/CE Marking", hint: "Verify EMI/EMC compliance marks" }] },
        ]
      }
    ]
  },
  // --- 6. Pharmaceuticals & Biotech ---
  {
    name: "Pharmaceuticals & Biotech",
    applicable_types: ['physical'],
    default_standard: 'EU-GMP',
    segments: [
        {
            name: 'All',
            requirements: [{ name: "Batch Manufacturing Record (BMR)", hint: "Verify all steps of BMR are signed and complete." }, { name: "Certificate of Analysis (CoA)", hint: "CoA results must match product specifications." }],
            categories: [
              { name: "Identity & Purity", params: [{ cat: "HPLC Analysis", hint: "High-Performance Liquid Chromatography results" }, { cat: "Heavy Metals Test", hint: "Results below USP <232> limits" }] },
              { name: "Safety", params: [{ cat: "Sterility Test", hint: "Microbial limit test (USP <61>)" }, { cat: "Stability", hint: "Shelf-life validation data" }] },
            ]
        }
    ]
  },
  // --- 7. Medical Devices ---
  {
    name: "Medical Devices",
    applicable_types: ['physical'],
    default_standard: 'FDA (21 CFR)',
    segments: [
        {
            name: "All",
            requirements: [{ name: "Device History Record (DHR)", hint: "Review DHR for completeness and accuracy." }],
            categories: [
                { name: "Regulatory", params: [{ cat: "FDA 510(k) / CE Mark", hint: "Verify regulatory clearance documentation" }, { cat: "ISO 13485 Cert", hint: "Verify Quality Management System certificate" }] },
                { name: "Sterilization", params: [{ cat: "Sterility Assurance Level", hint: "SAL validation records (e.g., gamma, EtO)" }, { cat: "Biocompatibility", hint: "ISO 10993 test results" }] },
            ]
        }
    ]
  },
  // --- 8. Agriculture & Fresh Produce ---
  {
    name: "Agriculture & Fresh Produce",
    applicable_types: ['physical'],
    default_standard: 'HACCP',
    segments: [
      {
        name: "All",
        requirements: [{ name: "Phytosanitary Certificate", hint: "Verify plant health certificate for export." }],
        categories: [
          { name: "Quality Grading", params: [{ cat: "Size/Color Uniformity", hint: "Grade A/B/C based on visual standards" }, { cat: "Brix Level", hint: "Measure sugar content for ripeness" }] },
          { name: "Safety", params: [{ cat: "Pesticide Residue", hint: "Lab test results below MRL" }, { cat: "Mould/Decay", hint: "Visual inspection for spoilage" }] },
          { name: "Packaging", params: [{ cat: "Ventilation", hint: "Ensure proper airflow in crates/boxes to prevent spoilage" }] },
        ]
      }
    ]
  },
  // --- 9. Seafood & Fisheries ---
  {
    name: "Seafood & Fisheries",
    applicable_types: ['physical'],
    default_standard: 'HACCP',
    segments: [
      {
        name: "All",
        requirements: [{ name: "Catch Certificate", hint: "Verify legal catch documentation." }],
        categories: [
          { name: "Sensory Evaluation", params: [{ cat: "Organoleptic Test", hint: "Check for freshness (odor, texture, eyes)" }] },
          { name: "Safety", params: [{ cat: "Histamine Levels", hint: "Check for scombroid poisoning risk" }, { cat: "Heavy Metals", hint: "Mercury/Cadmium levels" }] },
          { name: "Processing", params: [{ cat: "Net Drained Weight", hint: "Verify product weight without glazing/ice" }] },
        ]
      }
    ]
  },
  // --- 10. Automotive & Aerospace ---
  {
    name: "Automotive & Aerospace",
    applicable_types: ['physical'],
    default_standard: 'ISO 9001', // Should ideally be IATF 16949
    segments: [
      {
        name: "B2B",
        requirements: [{ name: "PPAP Documentation", hint: "Production Part Approval Process documents." }],
        categories: [
          { name: "Dimensional", params: [{ cat: "CMM Report", hint: "Coordinate Measuring Machine report" }, { cat: "GD&T Compliance", hint: "Geometric Dimensioning and Tolerancing check" }] },
          { name: "Material", params: [{ cat: "Tensile Strength", hint: "Lab report for material strength" }, { cat: "Chemical Composition", hint: "Spectroscopy results" }] },
        ]
      }
    ]
  },
  // --- 11. Chemicals & Raw Materials (NEW) ---
  {
      name: "Chemicals & Raw Materials",
      applicable_types: ['physical'],
      default_standard: 'ISO 9001',
      segments: [
          {
              name: "B2B",
              requirements: [{ name: "MSDS / SDS", hint: "Material Safety Data Sheet must be present." }, { name: "REACH Compliance", hint: "EU chemical regulation adherence." }],
              categories: [
                  { name: "Purity", params: [{ cat: "Assay Percentage", hint: "Active ingredient concentration > 99%" }, { cat: "Impurities", hint: "Check for moisture, ash, or other contaminants" }] },
                  { name: "Physical Properties", params: [{ cat: "pH Level", hint: "Acidity/Alkalinity check" }, { cat: "Viscosity", hint: "Flow resistance check" }] }
              ]
          }
      ]
  },
  // --- 12. Logistics & Shipping (NEW - Service) ---
  {
      name: "Logistics & Shipping",
      applicable_types: ['service'],
      default_standard: 'General',
      segments: [
          {
              name: "All",
              requirements: [{ name: "Bill of Lading (BOL)", hint: "Verify BOL details match cargo." }, { name: "Insurance Certificate", hint: "Cargo insurance policy is active." }],
              categories: [
                  { name: "Container", params: [{ cat: "Container Condition", hint: "Check for holes, rust, or floor damage" }, { cat: "Seal Verification", hint: "Seal number matches documentation" }] },
                  { name: "Loading", params: [{ cat: "Load Stability", hint: "Cargo is secured and weight distributed" }, { cat: "Count Verification", hint: "Carton count matches packing list" }] }
              ]
          }
      ]
  },
  // --- 13. Software / SaaS ---
  {
      name: "Software / SaaS",
      applicable_types: ['software'],
      default_standard: 'ISO 27001',
      segments: [
          {
              name: 'B2C',
              requirements: [{ name: "App Store Guidelines", hint: "Meets Apple/Google review guidelines." }, { name: "GDPR/CCPA Compliance", hint: "User data consent flow is active." }],
              categories: [
                { name: "Performance", params: [{ cat: "App Launch Time", hint: "Must be < 2s on target devices" }] },
                { name: "UX/UI", params: [{ cat: "Accessibility (WCAG)", hint: "Screen reader compatibility check" }, { cat: "Broken Links", hint: "Automated crawl for 404s" }] },
              ]
          },
          {
              name: 'B2B',
              requirements: [{ name: "SLA Uptime", hint: "Verify uptime meets Service Level Agreement (e.g., 99.9%)." }, { name: "Data Processing Agreement (DPA)", hint: "Contractual data handling terms met." }],
              categories: [
                { name: "Security", params: [{ cat: "Vulnerability Scan", hint: "OWASP Top 10 scan passed" }, { cat: "Penetration Test", hint: "Review latest pen-test report" }] },
                { name: "API", params: [{ cat: "API Response Time", hint: "P95 latency < 200ms under load" }, { cat: "Rate Limiting", hint: "Verify throttle limits" }] },
              ]
          }
      ]
  },
  // --- 14. Professional Services ---
  {
      name: "Professional Services",
      applicable_types: ['service'],
      default_standard: 'General',
      segments: [
          {
              name: 'All',
              requirements: [{ name: "Statement of Work (SOW) Compliance", hint: "All deliverables from SOW have been met." }, { name: "Invoice Accuracy", hint: "Hours/costs match the agreed-upon rates."}],
              categories: [
                { name: "Quality", params: [{ cat: "Customer Satisfaction (CSAT)", hint: "Survey score > 4.5/5" }, { cat: "Deliverable Accuracy", hint: "Error rate < 1%" }] },
                { name: "Timeliness", params: [{ cat: "Response Time", hint: "Mean Time to Respond (MTTR) within SLA" }, { cat: "Deadline Adherence", hint: "Project milestones met on time" }] }
              ]
          }
      ]
  }
];

// Helper function to get the list of industries for the dropdown
// UPDATED: Now returns ALL industries, not just physical ones, to support Software/Services logic
export const DYNAMIC_INDUSTRIES = KNOWLEDGE_BASE.map(industry => industry.name);