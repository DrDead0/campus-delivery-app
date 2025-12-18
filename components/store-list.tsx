import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock } from "lucide-react";

interface Store {
  _id: string;
  id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  items: any[];
}

interface StoreListProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
}

export function StoreList({ stores, onSelectStore }: StoreListProps) {
  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🏪</span>
        </div>
        <h3 className="text-lg font-semibold">No stores found</h3>
        <p className="text-muted-foreground">
          Try adjusting your location or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Top Stores for you</h2>
        <span className="text-xs text-muted-foreground border p-1 rounded-full px-2">
          Sort by ▼
        </span>
      </div>

      <div className="space-y-6">
        {stores.map((store) => (
          <div
            key={store._id}
            className="cursor-pointer group"
            onClick={() => onSelectStore(store)}
          >
            {/* Card Image Section */}
            <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-sm mb-3">
              {store.image ? (
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-4xl opacity-50">🍽️</span>
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

              {/* Offers Badge */}
              <div className="absolute bottom-3 left-3 flex flex-col items-start gap-0.5">
                <span className="text-white font-extrabold text-xl tracking-tight drop-shadow-md">
                  60% OFF
                </span>
                <span className="text-white/90 text-xs font-medium drop-shadow-md">
                  UPTO ₹120
                </span>
              </div>

              {/* Like Button */}
              <button className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white">
                <span className="text-lg">🤍</span>
              </button>
            </div>

            {/* Content Section */}
            <div className="px-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {store.name}
                </h3>
                <div className="flex items-center gap-1 bg-green-700 text-white px-1.5 py-0.5 rounded-[4px] text-xs font-bold text-[10px]">
                  <span>4.2</span>
                  <Star className="w-2.5 h-2.5 fill-current" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-green-700 flex items-center justify-center p-[2px]">
                    <div className="w-full h-full rounded-full border border-white" />
                  </span>
                  <span>{store.description}</span> {/* Cuisines */}
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">₹200 for two</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {/* <MapPin className="w-3 h-3" /> */}
                  <span>{store.location || "On Campus"}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1 font-bold text-foreground/60">
                  {/* <Clock className="w-3 h-3" /> */}
                  <span>25-30 mins</span>
                </div>
              </div>

              {/* Free Delivery Badge */}
              <div className="mt-3 flex items-center gap-2 border-t pt-2 border-dashed border-border/60">
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                  FREE DELIVERY
                </span>
                <span className="text-xs text-muted-foreground">
                  Valid on orders above ₹149
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
