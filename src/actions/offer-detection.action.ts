// src/actions/offer-detection.actions.ts
"use server";

import { connectToDatabase } from '@/lib/db';
import Offer from '@/lib/models/offer';
import Invoice from '@/lib/models/invoice';
import mongoose from 'mongoose';
import { IInvoiceOfferQualification } from '@/lib/models/invoice';

/**
 * Check if an invoice qualifies for any active offers
 * Called when creating a new invoice
 */
export async function checkInvoiceForOffers(
  customerId: string,
  items: { variantId: string; quantity: number; price: number }[],
  totalAmount: number,
  invoiceDate: Date = new Date()
): Promise<{
  success: boolean;
  qualifications?: IInvoiceOfferQualification[];
  message?: string;
}> {
  try {
    await connectToDatabase();

    const variantIds = items.map(item => new mongoose.Types.ObjectId(item.variantId));
    
    // Find all active offers for the purchased products
    const activeOffers = await Offer.find({
      status: 'active',
      startDate: { $lte: invoiceDate },
      endDate: { $gte: invoiceDate },
      product: { $in: variantIds },
    }).lean();

    if (!activeOffers || activeOffers.length === 0) {
      return { success: true, qualifications: [] };
    }

    const qualifications: IInvoiceOfferQualification[] = [];

    for (const offer of activeOffers) {
      // ✅ FIX: Cast offer to any to access _id safely
      const offerAny = offer as any;
      const productObjectId = new mongoose.Types.ObjectId(offerAny.product);

      // Check if customer purchased this specific product
      const hasPurchasedProduct = items.some(
        item => item.variantId === productObjectId.toString()
      );

      if (!hasPurchasedProduct) continue;

      // Festival Hit Counter
      if (offerAny.offerType === 'festival' && offerAny.festivalSubType === 'hitCounter') {
        const uniqueCustomers = await Invoice.aggregate([
          {
            $match: {
              'items.variantId': productObjectId,
              createdAt: { $gte: new Date(offerAny.startDate), $lte: invoiceDate },
              status: 'active',
            }
          },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: '$customer',
              firstPurchase: { $first: '$$ROOT' }
            }
          },
          { $limit: offerAny.customerLimit }
        ]);

        const position = uniqueCustomers.length + 1; // Current invoice position
        const isWithinLimit = position <= offerAny.customerLimit;
        
        // Check if this is customer's first purchase for this product
        const customerFirstPurchase = await Invoice.findOne({
          customer: customerId,
          'items.variantId': productObjectId,
          createdAt: { $gte: new Date(offerAny.startDate), $lt: invoiceDate },
          status: 'active',
        });

        const isFirstPurchase = !customerFirstPurchase;

        qualifications.push({
          offerId: offerAny._id.toString(),
          offerName: offerAny.festivalName || 'Festival Offer',
          offerType: 'festival',
          festivalSubType: 'hitCounter',
          qualified: isWithinLimit && isFirstPurchase,
          prizeName: isWithinLimit ? `Position ${position}/${offerAny.customerLimit}` : undefined,
          position: isFirstPurchase ? position : undefined,
          progressToQualify: !isFirstPurchase 
            ? 'Already purchased this product in this offer period' 
            : !isWithinLimit 
            ? `Offer full (${offerAny.customerLimit} customers reached)` 
            : undefined,
        });
      }

      // Festival Amount-Based
      else if (offerAny.offerType === 'festival' && offerAny.festivalSubType === 'amountBased') {
        const meetsMinimum = totalAmount >= offerAny.minimumAmount;

        qualifications.push({
          offerId: offerAny._id.toString(),
          offerName: offerAny.festivalName || 'Festival Offer',
          offerType: 'festival',
          festivalSubType: 'amountBased',
          qualified: meetsMinimum,
          prizeName: offerAny.prizeName,
          progressToQualify: !meetsMinimum 
            ? `Need ₹${(offerAny.minimumAmount - totalAmount).toFixed(2)} more` 
            : undefined,
        });
      }

      // Regular Visit Count
      else if (offerAny.offerType === 'regular' && offerAny.regularSubType === 'visitCount') {
        // Count CURRENT visit
        const visits = await Invoice.countDocuments({
          customer: customerId,
          'items.variantId': productObjectId,
          createdAt: { $gte: new Date(offerAny.startDate), $lte: invoiceDate },
          status: 'active',
        }) + 1; // +1 for current invoice

        const meetsVisitCount = visits >= offerAny.visitCount;

        qualifications.push({
          offerId: offerAny._id.toString(),
          offerName: 'Regular Visit Reward',
          offerType: 'regular',
          regularSubType: 'visitCount',
          qualified: meetsVisitCount,
          prizeName: offerAny.prizeName,
          progressToQualify: !meetsVisitCount 
            ? `${visits}/${offerAny.visitCount} visits completed` 
            : undefined,
        });
      }

      // Regular Purchase Amount
      else if (offerAny.offerType === 'regular' && offerAny.regularSubType === 'purchaseAmount') {
        const result = await Invoice.aggregate([
          {
            $match: {
              customer: new mongoose.Types.ObjectId(customerId),
              'items.variantId': productObjectId,
              createdAt: { $gte: new Date(offerAny.startDate), $lte: invoiceDate },
              status: 'active',
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$totalPayable' }
            }
          }
        ]);

        const totalSpent = (result[0]?.totalSpent || 0) + totalAmount; // Include current invoice
        const meetsTarget = totalSpent >= offerAny.targetAmount;

        qualifications.push({
          offerId: offerAny._id.toString(),
          offerName: 'Purchase Amount Reward',
          offerType: 'regular',
          regularSubType: 'purchaseAmount',
          qualified: meetsTarget,
          prizeName: offerAny.prizeName,
          progressToQualify: !meetsTarget 
            ? `₹${totalSpent.toFixed(2)}/₹${offerAny.targetAmount} spent` 
            : undefined,
        });
      }
    }

    return { success: true, qualifications };
  } catch (error) {
    console.error('Error checking offers:', error);
    return { success: false, message: 'Failed to check offers' };
  }
}