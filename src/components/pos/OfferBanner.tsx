"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift, Users, TrendingUp, Clock, Sparkles, Award } from "lucide-react";
import { getActiveOffersForPOS, OfferProgress } from "@/actions/pos-offer.actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function OfferBanner() {
  const [offers, setOffers] = useState<OfferProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveOffers();
    // Refresh every 15 seconds for real-time updates
    const interval = setInterval(fetchActiveOffers, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOffers = async () => {
    const result = await getActiveOffersForPOS();
    if (result.success && result.data) {
      setOffers(result.data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-40" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-3">
      <AnimatePresence mode="popLayout">
        {offers.map((offer, index) => (
          <motion.div
            key={offer._id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.1,
            }}
          >
            <OfferCard offer={offer} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function OfferCard({ offer }: { offer: OfferProgress }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOfferIcon = () => {
    if (offer.offerType === 'festival') {
      return <Gift className="h-5 w-5" />;
    }
    return <Trophy className="h-5 w-5" />;
  };

  const getProgressPercentage = () => {
    if (offer.targetCount) {
      return Math.min((offer.currentCount / offer.targetCount) * 100, 100);
    }
    return 0;
  };

  const getOfferTitle = () => {
    if (offer.offerType === 'festival' && offer.festivalSubType === 'hitCounter') {
      return `${offer.festivalName} - Hit The Counter!`;
    }
    if (offer.offerType === 'festival' && offer.festivalSubType === 'amountBased') {
      return `${offer.festivalName} - Minimum Purchase`;
    }
    if (offer.offerType === 'regular' && offer.regularSubType === 'visitCount') {
      return `Regular Visit Rewards`;
    }
    if (offer.offerType === 'regular' && offer.regularSubType === 'purchaseAmount') {
      return `Purchase Amount Rewards`;
    }
    return 'Special Offer';
  };

  const getOfferDescription = () => {
    if (offer.festivalSubType === 'hitCounter') {
      return `First ${offer.customerLimit} customers purchasing ${offer.productName}`;
    }
    if (offer.festivalSubType === 'amountBased') {
      return `Purchase ${offer.productName} worth ₹${offer.minimumAmount}+ to qualify`;
    }
    if (offer.regularSubType === 'visitCount') {
      return `Make ${offer.visitCount}+ purchases of ${offer.productName}`;
    }
    if (offer.regularSubType === 'purchaseAmount') {
      return `Spend ₹${offer.targetAmount}+ total on ${offer.productName}`;
    }
    return '';
  };

  const getProgressText = () => {
    if (offer.festivalSubType === 'hitCounter') {
      return `${offer.currentCount}/${offer.customerLimit} Customers Enrolled`;
    }
    if (offer.festivalSubType === 'amountBased') {
      return `${offer.currentCount} Eligible Customers`;
    }
    if (offer.regularSubType === 'visitCount') {
      return `${offer.currentCount} Qualified Customers`;
    }
    if (offer.regularSubType === 'purchaseAmount') {
      return `${offer.currentCount} Reached Target`;
    }
    return `${offer.currentCount} Participants`;
  };

  const getTimeRemainingText = () => {
    if (offer.daysRemaining > 0) {
      return `${offer.daysRemaining}d ${offer.hoursRemaining}h`;
    }
    if (offer.hoursRemaining > 0) {
      return `${offer.hoursRemaining}h ${offer.minutesRemaining}m`;
    }
    return `${offer.minutesRemaining}m`;
  };

  const getColorScheme = () => {
    if (offer.offerType === 'festival') {
      return {
        bg: 'bg-gradient-to-br from-purple-900/50 via-pink-900/40 to-purple-900/50',
        border: 'border-purple-400/40',
        text: 'text-purple-200',
        badge: 'bg-purple-600/90',
        glow: 'shadow-purple-500/20',
        icon: 'text-purple-300',
      };
    }
    return {
      bg: 'bg-gradient-to-br from-blue-900/50 via-cyan-900/40 to-blue-900/50',
      border: 'border-cyan-400/40',
      text: 'text-cyan-200',
      badge: 'bg-cyan-600/90',
      glow: 'shadow-cyan-500/20',
      icon: 'text-cyan-300',
    };
  };

  const colors = getColorScheme();
  const progressPercentage = getProgressPercentage();
  const isNearComplete = progressPercentage >= 80;

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 p-4 relative overflow-hidden shadow-lg ${colors.glow}`}>
      {/* Sparkles for near completion */}
      {isNearComplete && (
        <div className="absolute top-2 right-2">
          <Sparkles className={`h-5 w-5 ${colors.icon} animate-pulse`} />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`${colors.badge} p-2 rounded-lg shadow-lg`}>
              {getOfferIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">
                {getOfferTitle()}
              </h3>
              <p className="text-sm text-gray-300">
                {offer.productName} ({offer.productVolume})
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1 bg-black/40 text-white border border-white/20"
          >
            <Clock className="h-3 w-3" />
            {getTimeRemainingText()}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-200 mb-3">
          {getOfferDescription()}
        </p>

        {/* Progress Bar */}
        {offer.targetCount && (
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-200 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {getProgressText()}
              </span>
              <span className={`font-bold ${colors.text}`}>
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        )}

        {!offer.targetCount && (
          <div className="flex items-center gap-2 text-sm text-gray-200 mb-3">
            <TrendingUp className="h-4 w-4" />
            <span>{getProgressText()}</span>
          </div>
        )}

        {/* Eligible Customers */}
        {offer.eligibleCustomers && offer.eligibleCustomers.length > 0 && (
          <>
            {isExpanded && (
              <div className="bg-black/30 rounded-lg p-3 mb-2">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Recent Eligible Customers:
                </p>
                <div className="space-y-1">
                  {offer.eligibleCustomers.map((customer, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-300"
                    >
                      • {customer.name} - {customer.phone}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-white transition-colors mb-2"
            >
              {isExpanded ? '▲ Hide' : '▼ Show'} Eligible Customers
            </button>
          </>
        )}

        {/* Prize Information */}
        {offer.festivalSubType === 'hitCounter' && offer.prizes && (
          <div className="bg-black/30 rounded-lg p-3 mt-2">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Prizes:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {offer.prizes.map((prize) => (
                <Badge 
                  key={prize.rank}
                  variant="outline" 
                  className="capitalize bg-white/10 border-white/20"
                >
                  {prize.rank}: {prize.prizeName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {offer.prizeName && (
          <div className="bg-black/30 rounded-lg p-3 mt-2">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Prize:
            </p>
            <p className="text-sm font-semibold text-white mt-1">{offer.prizeName}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
