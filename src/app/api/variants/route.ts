// src/app/api/variants/route.ts
import { NextResponse } from 'next/server';
import { getVariants, createVariant, VariantData } from '@/actions/variant.actions'; // Ensure VariantData is imported

// Function to safely extract error message
function getErrorMessage(error: unknown, defaultMessage: string = 'An unknown error occurred.'): string {
  return error instanceof Error ? error.message : defaultMessage;
}

// GET all variants
export async function GET() {
  const result = await getVariants();
  if (result.success) {
    return NextResponse.json(result.data, { status: 200 });
  } else {
    return NextResponse.json({ message: result.message }, { status: 500 });
  }
}

// POST a new variant
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // ✅ FIX: Extract ALL fields required by VariantData interface
    const data: VariantData = {
      product: formData.get('product') as string,
      variantVolume: Number(formData.get('variantVolume')),
      unit: formData.get('unit') as string,
      unitConsumed: Number(formData.get('unitConsumed')),
      unitConsumedUnit: formData.get('unitConsumedUnit') as string,
      variantColor: formData.get('variantColor') as string,
      price: Number(formData.get('price')),
      mrp: Number(formData.get('mrp')),
      discount: Number(formData.get('discount')),
      stockQuantity: Number(formData.get('stockQuantity')),
      stockAlertQuantity: Number(formData.get('stockAlertQuantity')),
      image: formData.get('image') as string,
      qrCode: formData.get('qrCode') as string,
      packingCharges: Number(formData.get('packingCharges')),
      laborCharges: Number(formData.get('laborCharges')),
      electricityCharges: Number(formData.get('electricityCharges')),
      others1: Number(formData.get('others1')),
      others2: Number(formData.get('others2')),
    };
    
    const result = await createVariant(data);
    if (result.success) {
      return NextResponse.json(result.data, { status: 201 });
    } else {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }
  } catch (error) { // 💡 FIX: Removed ': any'
    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}