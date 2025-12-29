import { getVendingMachinesAction } from "../actions";
import VendingClient from "./vending-client";

export const dynamic = "force-dynamic";

export default async function VendingPage() {
  const data = await getVendingMachinesAction(Date.now());

  const mapped = data.map((m: any) => ({
    id: m.id,
    name: m.names,
    location: m.location,
    hostel: m.hostel || m.building || "", // Prioritize hostel, fallback to building
    type: m.type,
    image: m.image,
  }));

  return <VendingClient initialMachines={mapped} />;
}
