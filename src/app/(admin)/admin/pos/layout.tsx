// ✅ This layout runs on the server and configures dynamic behavior for the POS route
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
