import StoreClient from "./client";

export const dynamic = "force-dynamic";

export default function StorePage(props: any) {
  return <StoreClient {...props} />;
}
