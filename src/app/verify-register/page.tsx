import { Suspense } from "react";
import VerifyRegisterClient from "./VerifyRegisterClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRegisterClient />
    </Suspense>
  );
}