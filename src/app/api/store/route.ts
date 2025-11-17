// src/app/api/store/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Store from '@/lib/models/store';
import { uploadFile } from '@/lib/uploadHelper';
import { StoreSchema } from '@/lib/schemas';

// GET all stores
export async function GET() {
  try {
    await connectToDatabase();
    const stores = await Store.find({}).sort({ createdAt: 'desc' });
    return NextResponse.json({ success: true, data: stores });
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch stores.' }, { status: 500 });
  }
}

// POST a new store
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const formData = await req.formData();
    const storeData = {
      storeName: formData.get('storeName'),
      address: formData.get('address'),
      city: formData.get('city'),
      pincode: formData.get('pincode'),
      state: formData.get('state'),
      contactNumber: formData.get('contactNumber'),
      email: formData.get('email'),
      fssai: formData.get('fssai'),
      pan: formData.get('pan'),
      gst: formData.get('gst'),
      mediaUrl: formData.get('mediaUrl'),
    };
    const logoFile = formData.get('logo') as File | null;
    const qrCodeFile = formData.get('qrCode') as File | null;
    const mediaQRCodeFile = formData.get('mediaQRCode') as File | null; // ✅ UPDATED
    
    const validation = StoreSchema.safeParse(storeData);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid form data.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const logoPath = await uploadFile(logoFile ?? undefined, 'logo');
    const qrCodePath = await uploadFile(qrCodeFile ?? undefined, 'qr');
    const mediaQRCodePath = await uploadFile(mediaQRCodeFile ?? undefined, 'media-qr'); // ✅ UPDATED

    const newStore = new Store({
      ...validation.data,
      logo: logoPath,
      qrCode: qrCodePath,
      mediaQRCode: mediaQRCodePath, // ✅ UPDATED
      status: 'INACTIVE',
    });

    const storeCount = await Store.countDocuments();
    if (storeCount === 0) {
      newStore.status = 'ACTIVE';
    }

    await newStore.save();
    return NextResponse.json({ success: true, message: 'Store created successfully!' }, { status: 201 });
  } catch (error) {
    console.error("Failed to create store:", error);
    return NextResponse.json({ success: false, message: 'Failed to create store.' }, { status: 500 });
  }
}