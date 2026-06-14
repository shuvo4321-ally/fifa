import { redirect } from "next/navigation";

// Next routes every unmatched URL (a removed page like /studio, or any typo)
// to the root not-found. Instead of a 404, send the visitor to the homepage.
export default function NotFound() {
  redirect("/");
}
