import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { WebMobileLayout } from "@/components/web-mobile-layout";

export default function TermsAndConditions() {
  return (
    <WebMobileLayout>
      <div className="h-full w-full overflow-y-auto no-scrollbar pb-10 bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-md">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/restaurant/profile">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Terms & Conditions</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-md">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Unigo.in – Campus Snack Delivery Service
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm">
                Last Updated: 18.01.2026
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border text-sm text-center">
                <strong>Welcome to Unigo</strong>. By accessing or using our
                snack delivery service within Chandigarh university campus, you
                agree to comply with and be bound by the following Terms and
                Conditions. Please read them carefully.
              </div>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  1. Eligibility
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    This service is available{" "}
                    <strong>
                      only to students, faculty, and staff of hostel
                    </strong>
                    .
                  </li>
                  <li>
                    By placing an order, you confirm that you are authorized to
                    use the Platform and provide accurate information.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  2. Service Scope
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    The Platform facilitates{" "}
                    <strong>
                      ordering and delivery of snacks, beverages, and related
                      food items
                    </strong>{" "}
                    within the college campus only.
                  </li>
                  <li>
                    Delivery locations are restricted to{" "}
                    <strong>
                      hostels, academic blocks, libraries, and other permitted
                      campus areas
                    </strong>
                    .
                  </li>
                  <li>
                    Service hours are subject to availability and may change due
                    to college rules, exams, events, or holidays.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  3. Orders
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Orders can be placed through our designated ordering method
                    (app, website, WhatsApp, QR code, etc.).
                  </li>
                  <li>
                    Once an order is placed and confirmed,{" "}
                    <strong>it cannot be modified or canceled</strong> unless
                    explicitly allowed by the Platform.
                  </li>
                  <li>
                    We reserve the right to{" "}
                    <strong>refuse or cancel any order</strong> due to
                    unavailability of items, incorrect information, or misuse of
                    the service.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  4. Pricing & Payments
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    All prices are listed in <strong>INR</strong> and are
                    inclusive of applicable taxes unless stated otherwise.
                  </li>
                  <li>
                    Delivery charges, if any, will be displayed before order
                    confirmation.
                  </li>
                  <li>
                    Payments must be made through{" "}
                    <strong>approved payment methods only</strong> (UPI, cash,
                    wallet, etc.).
                  </li>
                  <li>
                    No credit or “pay later” facility is provided unless clearly
                    mentioned.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  5. Delivery
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Delivery times are <strong>estimated</strong> and may vary
                    due to demand, weather, campus restrictions, or operational
                    constraints.
                  </li>
                  <li>
                    Users must ensure availability at the delivery location.
                  </li>
                  <li>
                    If the user is unavailable or provides incorrect details,
                    the order may be marked as <strong>delivered</strong> and no
                    refund will be issued.
                  </li>
                  <li>
                    Delivery personnel must be treated respectfully. Any
                    misconduct may result in account suspension.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  6. Refunds & Replacements
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Refunds or replacements are applicable{" "}
                    <strong>only if</strong>:
                    <ul className="list-[circle] pl-5 mt-1 space-y-1">
                      <li>The wrong item is delivered</li>
                      <li>Items are missing</li>
                      <li>
                        Food is damaged or spoiled at the time of delivery
                      </li>
                    </ul>
                  </li>
                  <li>
                    Issues must be reported{" "}
                    <strong>within 30 minutes of delivery</strong> with valid
                    proof (photo/video).
                  </li>
                  <li>
                    No refunds will be provided for taste preferences or delayed
                    delivery due to uncontrollable circumstances.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  7. Food Safety & Allergies
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    While we strive to maintain hygiene and quality,{" "}
                    <strong>we do not guarantee allergen-free food</strong>.
                  </li>
                  <li>
                    Users are responsible for checking ingredients and
                    allergy-related concerns before ordering.
                  </li>
                  <li>
                    The Platform is not liable for any allergic reactions or
                    health issues arising from food consumption.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  8. User Conduct
                </h2>
                <p className="text-muted-foreground">
                  You agree <strong>not to</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Misuse the Platform or place fake/malicious orders</li>
                  <li>Harass delivery staff or vendors</li>
                  <li>Violate college rules using the Platform</li>
                  <li>Resell food items without permission</li>
                </ul>
                <p className="text-sm font-medium text-red-500 mt-2">
                  Violation may result in{" "}
                  <strong>temporary or permanent suspension</strong> of access.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  9. Intellectual Property
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    All logos, brand names, content, and materials associated
                    with the Platform are the{" "}
                    <strong>property of Unigo.in</strong>.
                  </li>
                  <li>
                    Unauthorized use, copying, or distribution is prohibited.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  10. Limitation of Liability
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    The Platform acts as a <strong>service facilitator</strong>{" "}
                    and shall not be liable for:
                    <ul className="list-[circle] pl-5 mt-1 space-y-1">
                      <li>Delays caused by campus restrictions</li>
                      <li>User negligence</li>
                      <li>
                        Force majeure events (power cuts, strikes, natural
                        events)
                      </li>
                    </ul>
                  </li>
                  <li>
                    Our maximum liability, if any, shall not exceed the{" "}
                    <strong>value of the order placed</strong>.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  11. Account Suspension or Termination
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate access without
                  notice if:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>These Terms are violated</li>
                  <li>Fraud or misuse is detected</li>
                  <li>Required by college authorities</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  12. Amendments
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>These Terms may be updated at any time.</li>
                  <li>
                    Continued use of the Platform after updates constitutes
                    acceptance of revised Terms.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  13. Governing Law
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    These Terms shall be governed by the laws of{" "}
                    <strong>India</strong>.
                  </li>
                  <li>
                    Any disputes shall fall under the jurisdiction of courts
                    located in <strong>Chandigarh</strong>.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  14. Contact Information
                </h2>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">
                    For support, complaints, or queries, contact us at:
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a
                      href="mailto:reelish09@gmail.com"
                      className="text-primary hover:underline"
                    >
                      reelish09@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a
                      href="tel:6205574746"
                      className="text-primary hover:underline"
                    >
                      6205574746
                    </a>
                  </div>
                </div>
              </section>

              <div className="pt-6 border-t text-center text-sm text-muted-foreground">
                By using <strong>Unigo</strong>, you acknowledge that you have
                read, understood, and agreed to these Terms and Conditions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WebMobileLayout>
  );
}
