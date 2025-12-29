import { WebMobileLayout } from "@/components/web-mobile-layout";
import { RestaurantLayoutNav } from "@/components/restaurant-layout-nav";
import { GlobalCartFooter } from "@/components/global-cart-footer";

export const dynamic = "force-dynamic";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebMobileLayout>
      <div className="h-full w-full overflow-y-auto no-scrollbar pb-20">
        {children}
      </div>
      <GlobalCartFooter />
      <RestaurantLayoutNav />
    </WebMobileLayout>
  );
}
