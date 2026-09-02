"use client"; 
 
import { useEffect, useState, useCallback } from "react"; 
import { useRouter } from "next/navigation"; 
import { motion } from "framer-motion"; 
import AdminLayout from "@/app/admin/AdminLayout"; 
import { getAdminCompanyApplications } from "@/services/v2Service"; 
import AlertService from "@/services/alertService"; 
 
// -------------------------------------------------- 
// Types 
// -------------------------------------------------- 
 
interface AdminCompanyApplication { 
  id: number; 
  company_name: string; 
  email: string; 
  phone: string; 
  industry: string | null; 
  status: "pending" | "approved" | "rejected"; 
  reviewed_by_name?: string | null; 
  created_at: string; 
} 
 
// -------------------------------------------------- 
// Status Badge (dark theme) 
// -------------------------------------------------- 
 
const StatusBadge = ({ status }: { status: string }) => { 
  const colors: Record<string, string> = { 
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50", 
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50", 
    rejected: "bg-red-500/20 text-red-300 border-red-500/50", 
  }; 
  return ( 
    <span 
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold border ${colors[status] || "bg-gray-500/20 text-gray-300 border-gray-500/50"}`} 
    > 
      {status.charAt(0).toUpperCase() + status.slice(1)} 
    </span> 
  ); 
}; 
 
// -------------------------------------------------- 
// Page Component 
// -------------------------------------------------- 
 
export default function AdminCompanyApplicationsPage() { 
  const router = useRouter(); 
  const [loading, setLoading] = useState(true); 
  const [applications, setApplications] = useState<AdminCompanyApplication[]>([]); 
  const [statusFilter, setStatusFilter] = useState<string>(""); 
 
  const fetchApplications = useCallback(async () => { 
    try { 
      const res = await getAdminCompanyApplications( 
        statusFilter ? (statusFilter as "pending" | "approved" | "rejected") : undefined 
      ); 
      setApplications(res.results); 
    } catch (error) { 
      console.error(error); 
      AlertService.error("Load Failed", "Failed to load company applications"); 
    } finally { 
      setLoading(false); 
    } 
  }, [statusFilter]); 
 
  useEffect(() => { 
    fetchApplications(); 
  }, [fetchApplications]); 
 
  const filteredCount = applications.length; 
 
  return ( 
    <AdminLayout> 
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden"> 
        {/* Animated blobs */} 
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" /> 
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" /> 
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" /> 
 
        <div className="relative z-10 p-4 sm:p-6 lg:p-8"> 
          {/* Header */} 
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8" 
          > 
            <div> 
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300"> 
                🏢 Company Applications 
              </h1> 
              <p className="text-white/70 mt-1">Review and manage registration requests from companies.</p> 
            </div> 
          </motion.div> 
 
          {/* Filter Tabs */} 
          <div className="flex flex-wrap gap-2 mb-6"> 
            {["", "pending", "approved", "rejected"].map((status) => ( 
              <button 
                key={status} 
                onClick={() => setStatusFilter(status)} 
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${ 
                  statusFilter === status 
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25" 
                    : "bg-white/10 text-white/70 hover:bg-white/20 backdrop-blur-sm" 
                }`} 
              > 
                {status === "" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} 
              </button> 
            ))} 
          </div> 
 
          {/* Loading State */} 
          {loading && ( 
            <div className="flex justify-center py-20"> 
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /> 
            </div> 
          )} 
 
          {/* Empty State */} 
          {!loading && applications.length === 0 && ( 
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-20" 
            > 
              <p className="text-white/60 text-lg">No applications found.</p> 
              {statusFilter && ( 
                <p className="text-white/40 mt-1">Try selecting a different filter.</p> 
              )} 
            </motion.div> 
          )} 
 
          {/* Applications Table */} 
          {!loading && applications.length > 0 && ( 
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl" 
            > 
              <table className="w-full text-left text-sm text-white/80"> 
                <thead className="bg-white/10"> 
                  <tr> 
                    <th className="px-6 py-4 font-semibold">Company</th> 
                    <th className="px-6 py-4 font-semibold hidden sm:table-cell">Email</th> 
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Industry</th> 
                    <th className="px-6 py-4 font-semibold">Status</th> 
                    <th className="px-6 py-4 font-semibold hidden lg:table-cell">Reviewed By</th> 
                    <th className="px-6 py-4 font-semibold hidden lg:table-cell">Date</th> 
                    <th className="px-6 py-4 font-semibold text-right">Action</th> 
                  </tr> 
                </thead> 
                <tbody className="divide-y divide-white/10"> 
                  {applications.map((app) => ( 
                    <tr 
                      key={app.id} 
                      className="hover:bg-white/5 transition cursor-pointer" 
                      onClick={() => router.push(`/admin/company-applications/${app.id}`)} 
                    > 
                      <td className="px-6 py-4 font-medium text-white">{app.company_name}</td> 
                      <td className="px-6 py-4 hidden sm:table-cell text-white/70">{app.email}</td> 
                      <td className="px-6 py-4 hidden md:table-cell text-white/60">{app.industry || "—"}</td> 
                      <td className="px-6 py-4"> 
                        <StatusBadge status={app.status} /> 
                      </td> 
                      <td className="px-6 py-4 hidden lg:table-cell text-white/50"> 
                        {app.reviewed_by_name || "—"} 
                      </td> 
                      <td className="px-6 py-4 hidden lg:table-cell text-white/50"> 
                        {new Date(app.created_at).toLocaleDateString()} 
                      </td> 
                      <td className="px-6 py-4 text-right"> 
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            router.push(`/admin/company-applications/${app.id}`); 
                          }} 
                          className="text-violet-400 hover:text-violet-300 font-medium text-xs uppercase tracking-wide" 
                        > 
                          View 
                        </button> 
                      </td> 
                    </tr> 
                  ))} 
                </tbody> 
              </table> 
            </motion.div> 
          )} 
        </div> 
      </div> 
    </AdminLayout> 
  ); 
}