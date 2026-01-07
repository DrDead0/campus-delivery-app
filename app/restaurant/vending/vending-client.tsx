"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { getVendingMachinesAction } from "../actions";

interface VendingClientProps {
  initialMachines: any[];
}

export default function VendingClient({ initialMachines }: VendingClientProps) {
  const router = useRouter();
  const [vendingLocations, setVendingLocations] =
    useState<any[]>(initialMachines);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getVendingMachinesAction(Date.now());
        const mapped = data.map((m: any) => ({
          id: m.id,
          name: m.names,
          location: m.location,
          hostel: m.hostel || m.building || "",
          type: m.type,
          image: m.image,
        }));
        setVendingLocations(mapped);
      } catch (err) {
        console.error("Failed to update machines", err);
      }
    };
    const interval = setInterval(fetchMachines, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredMachines = vendingLocations.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header - Solid Primary */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vending Machines</h1>
              <p className="text-sm opacity-90 mt-1">Instant snacks near you</p>
            </div>
            <div className="bg-green-100/20 text-green-100 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-200/20">
              24/7 Open
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search machines or hostels..."
            className="w-full bg-secondary/50 border-0 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4">
          {filteredMachines.map((machine) => (
            <Card
              key={machine.id}
              className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-card rounded-2xl"
              onClick={() => router.push(`/restaurant/vending/${machine.id}`)}
            >
              {/* Image Section */}
              <div className="relative h-40 w-full bg-muted overflow-hidden">
                {machine.image ? (
                  <img
                    src={machine.image}
                    alt={machine.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-4xl">
                    🏪
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <MapPin className="w-3 h-3" />
                    {machine.location}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {machine.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {machine.hostel && machine.hostel !== ""
                      ? machine.hostel
                      : "Main Block"}
                  </span>
                  <div className="flex items-center text-primary text-xs font-medium whitespace-nowrap ml-2">
                    Items <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredMachines.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-muted-foreground font-medium">
              No machines found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
