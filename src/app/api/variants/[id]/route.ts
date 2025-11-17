// src/app/api/variants/[id]/route.ts
import { NextResponse } from 'next/server';
import {
  getVariantById,
  updateVariant,
  deleteVariant,
  VariantData,
} from '@/actions/variant.actions';

// ✅ Correct type for Next.js 15+
type RouteContext = { params: Promise<{ id: string }> };

// ───────────────────────────────
// GET — Fetch a variant by ID
// ───────────────────────────────
export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params; // 👈 await required in Next.js 15

  const result = await getVariantById(id);
  if (result.success) {
    return NextResponse.json(result.data, { status: 200 });
  }

  return NextResponse.json({ message: result.message }, { status: 404 });
}

// ───────────────────────────────
// PUT — Update a variant by ID
// ───────────────────────────────
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();

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

    const result = await updateVariant(id, data);
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }

    return NextResponse.json({ message: result.message }, { status: 400 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// ───────────────────────────────
// DELETE — Delete a variant by ID
// ───────────────────────────────
export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const result = await deleteVariant(id);
  if (result.success) {
    return NextResponse.json({ message: result.message }, { status: 200 });
  }

  return NextResponse.json({ message: result.message }, { status: 404 });
}
