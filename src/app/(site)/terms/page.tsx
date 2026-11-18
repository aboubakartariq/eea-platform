import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of participation" };

export default function Page() {
  return (
    <LegalPage
      title="Terms of participation"
      intro="The rules that apply to schools, students and parents taking part in EEA competitions."
      sections={[
        { h: "Eligibility", p: ["Students take part in the grade they are currently studying. Each competition page lists the grades and modes available."] },
        { h: "Conduct", p: ["Students must do their own work. Unfair means, sharing papers or impersonation lead to disqualification."] },
        { h: "Results", p: ["Results are final once published, except where a correction request is upheld. Correction requests can be made within the period stated with the results."] },
        { h: "Certificates and awards", p: ["Certificates are issued digitally with a unique number. Physical awards are sent to the student's school unless agreed otherwise."] },
      ]}
    />
  );
}
