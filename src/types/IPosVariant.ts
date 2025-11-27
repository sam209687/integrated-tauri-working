export interface IPosVariant {
  _id: string;
  product: {
    _id: string;
    productCode: string;
    productName: string;
    tax: {
      _id: string;
      gst: number;
    };
  };
  variantVolume: number;
  unit: {
    _id: string;
    name: string;
  };
  unitConsumed: number;
  unitConsumedUnit: string;
  variantColor: string;
  price: number;
  mrp: number;
  discount: number;
  stockQuantity: number;
  stockAlertQuantity: number;
  image: string;
  qrCode: string;
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  others1: number;
  others2: number;
  createdAt: string;
  updatedAt: string;
}
