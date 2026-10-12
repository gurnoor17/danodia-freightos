/**
 * Danodia FreightOS — Dashboard Mock Data & Types
 *
 * Clearly isolated mock-data module for Phase 4 UI prototyping.
 * Note: Database persistence and CRUD will be implemented in Phase 5.
 */

export interface ShipmentItem {
  id: string;
  invoiceNo: string;
  fbaId: string;
  origin: 'USA' | 'UK' | 'Germany' | 'Walmart US' | string;
  destination: string;
  manager: string;
  boxes: number;
  weightKg: number;
  volumeCbm: number;
  departureDate: string;
  estimatedArrival: string;
  status: 'In Transit' | 'Delivered' | 'Pending Customs' | 'Booked' | 'Cancelled';
}

export interface OriginSummary {
  id: string;
  title: string;
  shipmentCount: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  isHighlighted?: boolean;
}

// Initial origin summary cards matching the 5 reference cards
export const INITIAL_ORIGIN_SUMMARIES: OriginSummary[] = [
  {
    id: 'all',
    title: 'All Origins',
    shipmentCount: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
    isHighlighted: true,
  },
  {
    id: 'usa',
    title: 'USA',
    shipmentCount: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
  },
  {
    id: 'uk',
    title: 'UK',
    shipmentCount: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
  },
  {
    id: 'germany',
    title: 'Germany',
    shipmentCount: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
  },
  {
    id: 'walmart_us',
    title: 'Walmart US',
    shipmentCount: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
  },
];

// Sample freight shipments for previewing the table view state
export const SAMPLE_SHIPMENTS: ShipmentItem[] = [
  {
    id: 'ship-001',
    invoiceNo: 'INV-2026-8812',
    fbaId: 'FBA18ZK99',
    origin: 'USA',
    destination: 'DFW7 (Fort Worth, TX)',
    manager: 'Sarah Jenkins',
    boxes: 140,
    weightKg: 2850.5,
    volumeCbm: 14.8,
    departureDate: '2026-10-08',
    estimatedArrival: '2026-10-24',
    status: 'In Transit',
  },
  {
    id: 'ship-002',
    invoiceNo: 'INV-2026-8815',
    fbaId: 'FBA17XY41',
    origin: 'UK',
    destination: 'LTN4 (Dunstable, UK)',
    manager: 'Marcus Sterling',
    boxes: 95,
    weightKg: 1640.0,
    volumeCbm: 8.5,
    departureDate: '2026-10-10',
    estimatedArrival: '2026-10-28',
    status: 'In Transit',
  },
  {
    id: 'ship-003',
    invoiceNo: 'INV-2026-8799',
    fbaId: 'FBA16AA02',
    origin: 'Germany',
    destination: 'DTM2 (Werne, DE)',
    manager: 'Lars Weber',
    boxes: 210,
    weightKg: 4200.0,
    volumeCbm: 21.2,
    departureDate: '2026-10-02',
    estimatedArrival: '2026-10-14',
    status: 'Pending Customs',
  },
  {
    id: 'ship-004',
    invoiceNo: 'INV-2026-8740',
    fbaId: 'WMT-DC-4401',
    origin: 'Walmart US',
    destination: 'Walmart DC 6024 (Bentonville, AR)',
    manager: 'Sarah Jenkins',
    boxes: 310,
    weightKg: 6150.0,
    volumeCbm: 32.0,
    departureDate: '2026-09-28',
    estimatedArrival: '2026-10-11',
    status: 'Delivered',
  },
];

export const STATUS_OPTIONS = [
  'All Statuses',
  'In Transit',
  'Pending Customs',
  'Booked',
  'Delivered',
  'Cancelled',
];
