import { redirect } from "next/navigation";

/** "Services" was renamed to "Shop" — keep old links working. */
export default function UserServicesPage() {
  redirect("/user/shop");
}
