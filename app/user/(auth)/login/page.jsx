import { redirect } from "next/navigation";

export default function UserLoginRedirectPage() {
  redirect("/login");
}
