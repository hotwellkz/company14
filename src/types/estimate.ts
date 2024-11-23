import { Timestamp } from 'firebase/firestore';

export interface EstimateItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface EstimateData {
  items: EstimateItem[];
  totalMaterialsCost: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FoundationEstimateItem extends EstimateItem {}

export interface FoundationEstimateData extends EstimateData {
  foundationWorkCost: number;
  totalCost: number;
}

export interface SipWallsEstimateItem extends EstimateItem {}

export interface SipWallsEstimateData extends EstimateData {
  installationCost: number;
  deliveryCost: number;
  totalCost: number;
}

export interface FloorEstimateItem extends EstimateItem {}

export interface FloorEstimateData extends EstimateData {
  installationCost: number;
  deliveryCost: number;
  totalCost: number;
}

export interface RoofEstimateItem extends EstimateItem {}

export interface RoofEstimateData extends EstimateData {
  roofWorkCost: number;
  deliveryCost: number;
  totalCost: number;
}

export interface PartitionEstimateItem extends EstimateItem {}

export interface PartitionEstimateData extends EstimateData {
  installationCost: number;
  deliveryCost: number;
  totalCost: number;
}

export interface ConsumablesEstimateItem extends EstimateItem {}

export interface ConsumablesEstimateData extends EstimateData {}

export interface AdditionalWorksEstimateItem extends EstimateItem {}

export interface AdditionalWorksEstimateData {
  items: AdditionalWorksEstimateItem[];
  totalCost: number;
  grandTotal: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}