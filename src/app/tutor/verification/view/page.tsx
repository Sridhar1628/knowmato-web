"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTutorBankVerification,
} from "@/services/v1Service";
import toast from "react-hot-toast";

export default function VerificationViewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await getTutorBankVerification();

        if (!res.submitted) {
          router.replace("/tutor/verification");
          return;
        }

        setVerification(res.data);
      } catch {
        toast.error("Failed to load verification.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!verification) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Bank Verification
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Info title="Account Holder" value={verification.account_holder_name} />

          <Info
            title="Account Number"
            value={`XXXXXX${verification.account_number.slice(-4)}`}
          />

          <Info title="IFSC" value={verification.ifsc_code} />

          <Info title="Bank" value={verification.bank_name} />

          <Info title="Branch" value={verification.branch_name} />

          <Info title="Account Type" value={verification.account_type} />

          <Info title="PAN" value={verification.pan_number} />

          <Info
            title="Aadhaar"
            value={`XXXXXXXX${verification.aadhaar_number.slice(-4)}`}
          />

          <Info title="Mobile" value={verification.mobile_number} />

          <Info
            title="Status"
            value={verification.status.toUpperCase()}
          />

        </div>

        {verification.rejection_reason && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="font-semibold text-red-700">
              Rejection Reason
            </p>
            <p className="text-red-600">
              {verification.rejection_reason}
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-8">

          <button
            onClick={() => router.push("/tutor/wallet")}
            className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-xl py-3 font-semibold"
          >
            Back
          </button>

          {verification.status === "rejected" && (
            <button
              onClick={() => router.push("/tutor/verification")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold"
            >
              Update Verification
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}