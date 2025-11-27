"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { uploadImage, deleteImage } from '@/lib/imageUpload';
import Offer, { IOffer } from '@/lib/models/offer';
import Invoice from '@/lib/models/invoice';
import Variant from '@/lib/models/variant';

/**
 * Get all offers
 */
export async function getOffers() {
  try {
    await connectToDatabase();
    const offers = await Offer.find({})
      .populate('product')
      .sort({ createdAt: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(offers)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to fetch offers: ${errorMessage}` };
  }
}

/**
 * Get offer by ID
 */
export async function getOfferById(id: string) {
  try {
    await connectToDatabase();
    const offer = await Offer.findById(id).populate('product').lean();
    
    if (!offer) {
      return { success: false, message: "Offer not found" };
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(offer)) };
  } catch (error) {
    console.error("Error fetching offer by ID:", error);
    return { success: false, message: "Failed to fetch offer" };
  }
}

/**
 * Get all variants (products) for dropdown
 */
export async function getVariantsForOffer() {
  try {
    await connectToDatabase();
    const variants = await Variant.find({})
      .populate('product')
      .populate('unit')
      .select('_id product variantVolume unit')
      .lean();
    
    return { success: true, data: JSON.parse(JSON.stringify(variants)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to fetch variants: ${errorMessage}` };
  }
}

/**
 * Create Festival Hit Counter Offer
 */
export async function createFestivalHitCounterOffer(formData: FormData) {
  try {
    await connectToDatabase();

    const product = formData.get('product') as string;
    const festivalName = formData.get('festivalName') as string;
    const customerLimit = Number(formData.get('customerLimit'));
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    // Upload prize images
    const prizes = [];
    for (const rank of ['first', 'second', 'third']) {
      const prizeName = formData.get(`prize_${rank}_name`) as string;
      const prizeImage = formData.get(`prize_${rank}_image`) as File;
      
      if (!prizeName || !prizeImage) {
        return { success: false, message: `${rank} prize details are incomplete.` };
      }
      
      const imageUrl = await uploadImage(prizeImage, 'offers');
      prizes.push({
        rank,
        prizeName,
        imageUrl,
      });
    }

    const newOffer = new Offer({
      product,
      offerType: 'festival',
      festivalSubType: 'hitCounter',
      festivalName,
      customerLimit,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prizes,
      status: 'active',
    });

    await newOffer.save();
    revalidatePath('/admin/offers');
    return { success: true, message: 'Festival Hit Counter Offer created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create offer: ${errorMessage}` };
  }
}

/**
 * Create Festival Amount-Based Offer
 */
export async function createFestivalAmountOffer(formData: FormData) {
  try {
    await connectToDatabase();

    const product = formData.get('product') as string;
    const festivalName = formData.get('festivalName') as string;
    const minimumAmount = Number(formData.get('minimumAmount'));
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const prizeName = formData.get('prizeName') as string;
    const prizeImage = formData.get('prizeImage') as File;

    const prizeImageUrl = await uploadImage(prizeImage, 'offers');

    const newOffer = new Offer({
      product,
      offerType: 'festival',
      festivalSubType: 'amountBased',
      festivalName,
      minimumAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prizeName,
      prizeImageUrl,
      status: 'active',
    });

    await newOffer.save();
    revalidatePath('/admin/offers');
    return { success: true, message: 'Festival Amount Offer created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create offer: ${errorMessage}` };
  }
}

/**
 * Create Regular Visit Count Offer
 */
export async function createRegularVisitCountOffer(formData: FormData) {
  try {
    await connectToDatabase();

    const product = formData.get('product') as string;
    const visitCount = Number(formData.get('visitCount'));
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const prizeName = formData.get('prizeName') as string;
    const prizeImage = formData.get('prizeImage') as File;

    const prizeImageUrl = await uploadImage(prizeImage, 'offers');

    const newOffer = new Offer({
      product,
      offerType: 'regular',
      regularSubType: 'visitCount',
      visitCount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prizeName,
      prizeImageUrl,
      status: 'active',
    });

    await newOffer.save();
    revalidatePath('/admin/offers');
    return { success: true, message: 'Regular Visit Count Offer created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create offer: ${errorMessage}` };
  }
}

/**
 * Create Regular Purchase Amount Offer
 */
export async function createRegularPurchaseAmountOffer(formData: FormData) {
  try {
    await connectToDatabase();

    const product = formData.get('product') as string;
    const targetAmount = Number(formData.get('targetAmount'));
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const prizeName = formData.get('prizeName') as string;
    const prizeImage = formData.get('prizeImage') as File;

    const prizeImageUrl = await uploadImage(prizeImage, 'offers');

    const newOffer = new Offer({
      product,
      offerType: 'regular',
      regularSubType: 'purchaseAmount',
      targetAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prizeName,
      prizeImageUrl,
      status: 'active',
    });

    await newOffer.save();
    revalidatePath('/admin/offers');
    return { success: true, message: 'Regular Purchase Amount Offer created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create offer: ${errorMessage}` };
  }
}

/**
 * Calculate eligible customers/invoices for an offer
 */
export async function calculateEligibleEntries(offerId: string) {
  try {
    await connectToDatabase();
    const offer = await Offer.findById(offerId);
    
    if (!offer) {
      return { success: false, message: 'Offer not found' };
    }

    const { startDate, endDate, product } = offer;

    if (offer.offerType === 'festival' && offer.festivalSubType === 'hitCounter') {
      // FIXED: Get first N UNIQUE customers (not invoices)
      const uniqueCustomerInvoices = await Invoice.aggregate([
        {
          $match: {
            'items.variantId': product,
            createdAt: { $gte: startDate, $lte: endDate },
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
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        }
      ]);

      const formattedInvoices = uniqueCustomerInvoices.map(inv => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer,
        totalPayable: inv.totalPayable,
        createdAt: inv.createdAt,
        status: inv.status
      }));

      return { 
        success: true, 
        data: { 
          count: uniqueCustomerInvoices.length, 
          invoices: JSON.parse(JSON.stringify(formattedInvoices)) 
        } 
      };
    }

    if (offer.offerType === 'festival' && offer.festivalSubType === 'amountBased') {
      // FIXED: Get unique customers with qualifying invoices
      const qualifyingInvoices = await Invoice.aggregate([
        {
          $match: {
            'items.variantId': product,
            totalPayable: { $gte: offer.minimumAmount },
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'active',
          }
        },
        {
          $group: {
            _id: '$customer',
            invoice: { $last: '$$ROOT' }
          }
        },
        {
          $replaceRoot: { newRoot: '$invoice' }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        }
      ]);

      offer.eligibleInvoices = qualifyingInvoices.map(inv => inv._id);
      await offer.save();

      return { 
        success: true, 
        data: { 
          count: qualifyingInvoices.length, 
          invoices: JSON.parse(JSON.stringify(qualifyingInvoices)) 
        } 
      };
    }

    if (offer.offerType === 'regular' && offer.regularSubType === 'visitCount') {
      // Count visits per customer
      const customers = await Invoice.aggregate([
        {
          $match: {
            'items.variantId': product,
            createdAt: { $gte: startDate, $lte: endDate },
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
        { $unwind: '$customerData' },
        {
          $group: {
            _id: '$customerData.phone',
            customerName: { $first: '$customerData.name' },
            visitCount: { $sum: 1 },
          },
        },
        {
          $match: {
            visitCount: { $gte: offer.visitCount },
          },
        },
      ]);

      offer.eligibleCustomers = customers.map(cust => ({
        mobileNumber: cust._id,
        customerName: cust.customerName,
        visitCount: cust.visitCount,
      }));
      await offer.save();

      return { success: true, data: { count: customers.length, customers } };
    }

    if (offer.offerType === 'regular' && offer.regularSubType === 'purchaseAmount') {
      // Sum purchase amounts per customer
      const customers = await Invoice.aggregate([
        {
          $match: {
            'items.variantId': product,
            createdAt: { $gte: startDate, $lte: endDate },
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
        { $unwind: '$customerData' },
        {
          $group: {
            _id: '$customerData.phone',
            customerName: { $first: '$customerData.name' },
            totalAmount: { $sum: '$totalPayable' },
          },
        },
        {
          $match: {
            totalAmount: { $gte: offer.targetAmount },
          },
        },
      ]);

      offer.eligibleCustomers = customers.map(cust => ({
        mobileNumber: cust._id,
        customerName: cust.customerName,
        totalAmount: cust.totalAmount,
      }));
      await offer.save();

      return { success: true, data: { count: customers.length, customers } };
    }

    return { success: false, message: 'Invalid offer type' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to calculate eligible entries: ${errorMessage}` };
  }
}

/**
 * Randomly select winners for hit counter offer
 */
export async function selectWinners(offerId: string) {
  try {
    await connectToDatabase();
    const offer = await Offer.findById(offerId);

    if (!offer || offer.offerType !== 'festival' || offer.festivalSubType !== 'hitCounter') {
      return { success: false, message: 'Invalid offer type for winner selection' };
    }

    // FIXED: Get first N UNIQUE customers only
    const uniqueCustomerInvoices = await Invoice.aggregate([
      {
        $match: {
          'items.variantId': offer.product,
          createdAt: { $gte: offer.startDate, $lte: offer.endDate },
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
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      }
    ]);

    if (uniqueCustomerInvoices.length < 3) {
      return { 
        success: false, 
        message: `Not enough unique customers for winner selection. Found ${uniqueCustomerInvoices.length}, need at least 3.` 
      };
    }

    // Randomly select 3 unique winners
    const shuffled = [...uniqueCustomerInvoices].sort(() => 0.5 - Math.random());
    const winners = [];
    
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      const rank = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
      const invoice = shuffled[i];
      
      winners.push({
        rank,
        invoiceId: invoice._id,
        customerName: invoice.customer.name,
        mobileNumber: invoice.customer.phone,
        announcedAt: new Date(),
      });
    }

    offer.winners = winners;
    offer.status = 'completed';
    await offer.save();

    revalidatePath('/admin/offers');
    revalidatePath(`/admin/offers/${offerId}`);
    
    return { 
      success: true, 
      message: 'Winners selected successfully!', 
      data: winners 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to select winners: ${errorMessage}` };
  }
}
/**
 * Update offer
 */
export async function updateOffer(offerId: string, formData: FormData) {
  try {
    await connectToDatabase();
    
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return { success: false, message: 'Offer not found' };
    }

    // Update basic fields
    const product = formData.get('product') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (product) offer.product = product;
    if (startDate) offer.startDate = new Date(startDate);
    if (endDate) offer.endDate = new Date(endDate);

    // Update type-specific fields
    const festivalName = formData.get('festivalName') as string;
    const customerLimit = formData.get('customerLimit') as string;
    const minimumAmount = formData.get('minimumAmount') as string;
    const visitCount = formData.get('visitCount') as string;
    const targetAmount = formData.get('targetAmount') as string;
    const prizeName = formData.get('prizeName') as string;

    if (festivalName) offer.festivalName = festivalName;
    if (customerLimit) offer.customerLimit = Number(customerLimit);
    if (minimumAmount) offer.minimumAmount = Number(minimumAmount);
    if (visitCount) offer.visitCount = Number(visitCount);
    if (targetAmount) offer.targetAmount = Number(targetAmount);
    if (prizeName) offer.prizeName = prizeName;

    await offer.save();
    revalidatePath('/admin/offers');
    revalidatePath('/admin/pos');
    
    return { success: true, message: 'Offer updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update offer: ${errorMessage}` };
  }
}
export async function deleteOffer(offerId: string) {
  try {
    await connectToDatabase();
    const offer = await Offer.findById(offerId);
    
    if (!offer) {
      return { success: false, message: 'Offer not found' };
    }

    // Delete associated images
    if (offer.offerType === 'festival' && offer.festivalSubType === 'hitCounter') {
      for (const prize of offer.prizes || []) {
        await deleteImage(prize.imageUrl);
      }
    } else if (offer.prizeImageUrl) {
      await deleteImage(offer.prizeImageUrl);
    }

    await Offer.findByIdAndDelete(offerId);
    revalidatePath('/admin/offers');
    return { success: true, message: 'Offer deleted successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete offer: ${errorMessage}` };
  }
}