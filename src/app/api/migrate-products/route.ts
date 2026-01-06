// app/api/migrate-products/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/product";
import Unit from "@/lib/models/unit";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get a default unit (or create one if none exists)
    let defaultUnit = await Unit.findOne({});
    if (!defaultUnit) {
      // Create a default kg unit if no units exist
      defaultUnit = await Unit.create({ name: "kg" });
    }
    
    const products = await Product.find({});
    const results = {
      total: products.length,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[],
    };

    for (const product of products) {
      try {
        const productData = product.toObject();
        let needsSave = false;
        
        // Fix 1: Convert old sellingType to sellingTypes array
        if ((productData as any).sellingType && !productData.sellingTypes) {
          const oldType = (productData as any).sellingType;
          product.sellingTypes = [oldType];
          (product as any).sellingType = undefined;
          needsSave = true;
          results.details.push(`✅ ${product.productName}: ${oldType} → [${oldType}]`);
        } 
        // Fix 2: Add default sellingTypes if missing
        else if (!productData.sellingTypes || productData.sellingTypes.length === 0) {
          product.sellingTypes = ["FIXED"];
          needsSave = true;
          results.details.push(`✅ ${product.productName}: Added default [FIXED]`);
        }
        
        // Fix 3: Add baseUnit if missing
        if (!productData.baseUnit) {
          product.baseUnit = defaultUnit._id;
          needsSave = true;
          results.details.push(`✅ ${product.productName}: Added baseUnit (${defaultUnit.name})`);
        }
        
        // Fix 4: Add allowLooseSale if missing
        if (productData.allowLooseSale === undefined || productData.allowLooseSale === null) {
          product.allowLooseSale = false;
          needsSave = true;
        }
        
        if (needsSave) {
          await product.save();
          results.migrated++;
        } else {
          results.skipped++;
        }
        
      } catch (error) {
        results.errors++;
        results.details.push(`❌ ${product.productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration complete!",
      results,
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Migration failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}