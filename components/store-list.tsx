import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, Clock } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

interface Store {
  _id: string;
  id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  items: any[];
  type?: "veg" | "non-veg" | "both";
}

export const FoodTypeBadge = ({
  type,
  className,
}: {
  type?: string;
  className?: string;
}) => {
  if (!type) return null;
  // If type is "both", we treat it as non-veg (red) per user request: "if the store items are non-veg and veg both use nonveg logo"

  const isVeg = type === "veg";
  const colorClass = isVeg ? "border-green-600" : "border-red-600";
  const dotClass = isVeg ? "bg-green-600" : "bg-red-600";

  return (
    <div
      className={`border ${colorClass} p-[1px] rounded-[4px] w-4 h-4 flex items-center justify-center ${className}`}
    >
      <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
    </div>
  );
};

interface StoreListProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
}

export function StoreList({ stores, onSelectStore }: StoreListProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "name">("relevance");
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  const toggleDescription = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedStoreId(expandedStoreId === id ? null : id);
  };

  // Sort stores
  const sortedStores = useMemo(() => {
    let result = [...stores];
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    // "relevance" is default order
    return result;
  }, [stores, sortBy]);

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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by</span>
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as "relevance" | "name")}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs border-none bg-transparent shadow-none focus:ring-0 px-0 gap-1 text-primary data-[placeholder]:text-foreground justify-end [&>svg]:opacity-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedStores.map((store) => {
          const isExpanded = expandedStoreId === store._id;

          return (
            <div
              key={store._id}
              className="cursor-pointer group flex gap-4 items-start"
              onClick={() => onSelectStore(store)}
            >
              {/* Left: Image (Bigger: 35% of width roughly, or w-36) */}
              <div className="relative w-36 h-36 shrink-0 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                {store.image ? (
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl opacity-50">🍽️</span>
                  </div>
                )}
              </div>

              {/* Right: Content Section */}
              <div className="flex-1 flex flex-col justify-start min-w-0 pt-0.5 h-36 relative overflow-hidden">
                {/* Marquee Title Container */}
                <div className="mb-1 w-full overflow-hidden relative h-7 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                      {store.name}
                    </h3>
                  </div>
                  <FoodTypeBadge
                    type={store.type || "both"}
                    className="shrink-0 mt-0.5"
                  />
                </div>

                {/* Description Section with Read More */}
                <div className="relative flex-1 overflow-hidden">
                  <div
                    className={`text-sm text-muted-foreground leading-snug ${
                      isExpanded
                        ? "overflow-y-auto max-h-[4.5rem] pr-1"
                        : "line-clamp-2"
                    }`}
                  >
                    {store.description}
                  </div>
                  {/* Read More / Less Toggle */}
                  {store.description && store.description.length > 60 && (
                    <button
                      onClick={(e) => toggleDescription(e, store._id)}
                      className="text-[10px] font-bold text-primary mt-0.5 hover:underline bg-background/80 px-1 rounded block w-fit"
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
                  <span className="font-medium bg-secondary/50 px-2 py-0.5 rounded-md text-foreground/80 truncate max-w-[150px]">
                    {store.location || "On Campus"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
