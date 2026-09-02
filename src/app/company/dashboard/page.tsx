"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getJobs, getInternships, Job, Internship } from "@/services/v2Service";
import CompanyLayout from "@/app/company/layout";
import AlertService from "@/services/alertService";

export default function CompanyDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const companyId = user?.company; // adjust to your actual field

  const [jobs, setJobs] = useState<Job[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchData = async () => {
      try {
        const [jobsRes, intRes] = await Promise.all([
          getJobs({ company: companyId }),
          getInternships({ company: companyId }),
        ]);
        setJobs(jobsRes);
        setInternships(intRes);
      } catch {
        AlertService.error("Load Failed", "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  return (
    <CompanyLayout>
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-8">
          Company Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/70 text-sm">Total Jobs</p>
            <p className="text-3xl font-bold text-violet-300">{jobs.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/70 text-sm">Total Internships</p>
            <p className="text-3xl font-bold text-cyan-300">{internships.length}</p>
          </div>
        </div>

        {/* Quick links to create new */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/company/jobs/new"
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 transition"
          >
            <p className="text-white font-semibold">+ New Job</p>
            <p className="text-white/60 text-sm">Post a job opening</p>
          </a>
          <a
            href="/company/internships/new"
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 transition"
          >
            <p className="text-white font-semibold">+ New Internship</p>
            <p className="text-white/60 text-sm">Create an internship</p>
          </a>
        </div>
      </div>
    </CompanyLayout>
  );
}