// src/actions/pos-offer.actions.ts
"use server";

import { connectToDatabase } from '@/lib/db';
import Offer from '@/lib/models/offer';
import Invoice from '@/lib/models/invoice';
import mongoose from 'mongoose';

export interface OfferProgress {
  _id: string;
  offerType: 'festival' | 'regular';
  festivalSubType?: 'hitCounter' | 'amountBased';
  regularSubType?: 'visitCount' | 'purchaseAmount';
  festivalName?: string;
  productName: string;
  productVolume: string;
  productId: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed';
  
  // Progress data
  currentCount: number;
  targetCount?: number;
  eligibleCustomers?: Array<{ name: string; phone: string }>;
  
  // Type-specific data
  customerLimit?: number;
  minimumAmount?: number;
  visitCount?: number;
  targetAmount?: number;
  prizeName?: string;
  prizes?: Array<{ rank: string; prizeName: string; imageUrl: string }>;
  
  // Time remaining
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
}

/**
 * Get all active offers with real-time progress for POS display
 */
export async function getActiveOffersForPOS(): Promise<{
  success: boolean;
  data?: OfferProgress[];
  message?: string;
}> {
  try {
    await connectToDatabase();

    const now = new Date();
    
    // Find all active offers that are currently running
    const activeOffers = await Offer.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate({
        path: 'product',
        populate: [
          { path: 'product', select: 'productName' },
          { path: 'unit', select: 'name' }
        ]
      })
      .lean();

    if (!activeOffers || activeOffers.length === 0) {
      return { success: true, data: [] };
    }

    // Calculate progress for each offer
    const offersWithProgress = await Promise.all(
      activeOffers.map(async (offer: any) => {
        let currentCount = 0;
        let eligibleCustomers: Array<{ name: string; phone: string }> = [];
        
        const endDate = new Date(offer.endDate);
        const timeRemaining = endDate.getTime() - now.getTime();
        const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        const productObjectId = new mongoose.Types.ObjectId(offer.product._id);

        // Calculate progress based on offer type
        if (offer.offerType === 'festival' && offer.festivalSubType === 'hitCounter') {
          // FIXED: Get unique customers (first purchase only) up to customer limit
          const uniqueCustomerInvoices = await Invoice.aggregate([
            {
              $match: {
                'items.variantId': productObjectId,
                createdAt: { $gte: new Date(offer.startDate), $lte: new Date(offer.endDate) },
                status: 'active',
              }
            },
            {
              $sort: { createdAt: 1 }
            },
            {
              $group: {
                _id: '$customer',
                firstInvoice: { $first: '$$ROOT' }
              }
            },
            {
              $limit: offer.customerLimit
            },
            {
              $replaceRoot: { newRoot: '$firstInvoice' }
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerData'
              }
            },
            {
              $unwind: { 
                path: '$customerData',
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                _id: 1,
                customer: 1,
                createdAt: 1,
                customerName: { $ifNull: ['$customerData.name', 'Unknown'] },
                customerPhone: { $ifNull: ['$customerData.phone', 'N/A'] }
              }
            }
          ]);

          currentCount = uniqueCustomerInvoices.length;
          eligibleCustomers = uniqueCustomerInvoices.map((inv: any) => ({
            name: inv.customerName,
            phone: inv.customerPhone,
          }));

        } else if (offer.offerType === 'festival' && offer.festivalSubType === 'amountBased') {
          // FIXED: Get unique customers with invoices >= minimum amount
          const eligibleInvoices = await Invoice.aggregate([
            {
              $match: {
                'items.variantId': productObjectId,
                totalPayable: { $gte: offer.minimumAmount },
                createdAt: { $gte: new Date(offer.startDate), $lte: new Date(offer.endDate) },
                status: 'active',
              }
            },
            {
              $group: {
                _id: '$customer',
                latestInvoice: { $last: '$$ROOT' }
              }
            },
            {
              $replaceRoot: { newRoot: '$latestInvoice' }
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerData'
              }
            },
            {
              $unwind: { 
                path: '$customerData',
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                customerName: { $ifNull: ['$customerData.name', 'Unknown'] },
                customerPhone: { $ifNull: ['$customerData.phone', 'N/A'] }
              }
            }
          ]);

          currentCount = eligibleInvoices.length;
          eligibleCustomers = eligibleInvoices.map((inv: any) => ({
            name: inv.customerName,
            phone: inv.customerPhone,
          }));

        } else if (offer.offerType === 'regular' && offer.regularSubType === 'visitCount') {
          // Count unique customers who visited >= required times
          const result = await Invoice.aggregate([
            {
              $match: {
                'items.variantId': productObjectId,
                createdAt: { $gte: new Date(offer.startDate), $lte: new Date(offer.endDate) },
                status: 'active',
              },
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerData',
              },
            },
            { 
              $unwind: { 
                path: '$customerData',
                preserveNullAndEmptyArrays: true 
              } 
            },
            {
              $group: {
                _id: '$customer',
                customerName: { $first: { $ifNull: ['$customerData.name', 'Unknown'] } },
                customerPhone: { $first: { $ifNull: ['$customerData.phone', 'N/A'] } },
                visitCount: { $sum: 1 },
              },
            },
            {
              $match: {
                visitCount: { $gte: offer.visitCount },
              },
            },
          ]);

          currentCount = result.length;
          eligibleCustomers = result.map((r: any) => ({
            name: r.customerName,
            phone: r.customerPhone,
          }));

        } else if (offer.offerType === 'regular' && offer.regularSubType === 'purchaseAmount') {
          // Count customers who spent >= target amount on this product
          const result = await Invoice.aggregate([
            {
              $match: {
                'items.variantId': productObjectId,
                createdAt: { $gte: new Date(offer.startDate), $lte: new Date(offer.endDate) },
                status: 'active',
              },
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerData',
              },
            },
            { 
              $unwind: { 
                path: '$customerData',
                preserveNullAndEmptyArrays: true 
              } 
            },
            {
              $group: {
                _id: '$customer',
                customerName: { $first: { $ifNull: ['$customerData.name', 'Unknown'] } },
                customerPhone: { $first: { $ifNull: ['$customerData.phone', 'N/A'] } },
                totalAmount: { $sum: '$totalPayable' },
              },
            },
            {
              $match: {
                totalAmount: { $gte: offer.targetAmount },
              },
            },
          ]);

          currentCount = result.length;
          eligibleCustomers = result.map((r: any) => ({
            name: r.customerName,
            phone: r.customerPhone,
          }));
        }

        return {
          _id: offer._id.toString(),
          offerType: offer.offerType,
          festivalSubType: offer.festivalSubType,
          regularSubType: offer.regularSubType,
          festivalName: offer.festivalName,
          productName: offer.product?.product?.productName || 'Unknown Product',
          productVolume: `${offer.product?.variantVolume || ''} ${offer.product?.unit?.name || ''}`.trim(),
          productId: offer.product?._id?.toString() || '',
          startDate: offer.startDate,
          endDate: offer.endDate,
          status: offer.status,
          currentCount,
          targetCount: offer.customerLimit || offer.visitCount,
          eligibleCustomers: eligibleCustomers.slice(0, 5), // Show first 5
          customerLimit: offer.customerLimit,
          minimumAmount: offer.minimumAmount,
          visitCount: offer.visitCount,
          targetAmount: offer.targetAmount,
          prizeName: offer.prizeName,
          prizes: offer.prizes,
          daysRemaining,
          hoursRemaining,
          minutesRemaining,
        };
      })
    );

    return { 
      success: true, 
      data: offersWithProgress
    };
  } catch (error) {
    console.error('Error fetching active offers for POS:', error);
    return { 
      success: false, 
      message: 'Failed to fetch active offers' 
    };
  }
}