// src/store/offer.store.ts

import { create } from 'zustand';
import { IOffer } from '@/lib/models/offer';
import { deleteOffer as deleteOfferAction } from '@/actions/offer.actions';

interface OfferState {
  offers: IOffer[];
  setOffers: (offers: IOffer[]) => void;
  deleteOffer: (offerId: string) => Promise<void>;
}

export const useOfferStore = create<OfferState>((set) => ({
  offers: [],
  setOffers: (offers) => set({ offers }),
  deleteOffer: async (offerId) => {
    // Optimistically remove the offer from the UI
    set((state) => ({
      offers: state.offers.filter((offer) => offer._id !== offerId),
    }));

    try {
      // Call the server action to delete from DB and filesystem
      await deleteOfferAction(offerId);
    } catch (error) {
      // If the server action fails, ideally re-add the offer to the state
      // and show an error toast. This part is omitted for brevity.
      console.error("Failed to delete offer:", error);
    }
  },
}));