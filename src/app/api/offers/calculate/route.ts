import { NextRequest, NextResponse } from 'next/server';
import { calculateEligibleEntries } from '@/actions/offer.actions';

export async function POST(request: NextRequest) {
  const { offerId } = await request.json();
  const result = await calculateEligibleEntries(offerId);
  return NextResponse.json(result);
}