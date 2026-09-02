'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import AlertService from '@/services/alertService';
import {
  getAdminTestCases,
  createAdminTestCase,
  updateAdminTestCase,
  deleteAdminTestCase,
  AdminTestCase,
} from '@/services/assessmentService';

export default function AdminTestCasesPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = Number(params.id);

  const [testCases, setTestCases] = useState<AdminTestCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for add/edit
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<AdminTestCase | null>(null);
  const [formData, setFormData] = useState({ input_data: '', expected_output: '' });

  // Fetch test cases
  const fetchTestCases = async () => {
    try {
      const response = await getAdminTestCases(questionId);
      const data = (response as any)?.data ?? response;
      setTestCases(Array.isArray(data) ? data : []);
    } catch (err) {
      AlertService.error('Load Failed', 'Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) fetchTestCases();
  }, [questionId]);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Open form for new test case
  const openNewForm = () => {
    setEditingCase(null);
    setFormData({ input_data: '', expected_output: '' });
    setShowForm(true);
  };

  // Open form for editing an existing test case
  const openEditForm = (tc: AdminTestCase) => {
    setEditingCase(tc);
    setFormData({
      input_data: tc.input_data ?? '',
      expected_output: tc.expected_output ?? '',
    });
    setShowForm(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expected_output.trim()) {
      AlertService.error('Output Required', 'Expected output is required');
      return;
    }

    try {
      if (editingCase) {
        await updateAdminTestCase(editingCase.id, formData);
        AlertService.success('Test Case Updated', 'Test case updated successfully!');
      } else {
        await createAdminTestCase(questionId, formData);
        AlertService.success('Test Case Added', 'Test case added successfully!');
      }
      setShowForm(false);
      setEditingCase(null);
      fetchTestCases(); // refresh list
    } catch (err: any) {
      AlertService.error('Operation Failed', err?.message || 'Operation failed');
    }
  };

  // Delete a test case
  const handleDelete = async (id: number) => {
    AlertService.confirm(
      'Delete Test Case',
      'Are you sure you want to delete this test case?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminTestCase(id);
              AlertService.success('Test Case Deleted', 'Test case deleted successfully');
              fetchTestCases();
            } catch (err: any) {
              AlertService.error('Deletion Failed', err?.message || 'Deletion failed');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading test cases...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
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
              <button
                onClick={() => router.push(`/admin/assessment/questions`)}
                className="mb-2 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                ← Back to Questions
              </button>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                🧪 Test Cases for Question #{questionId}
              </h1>
              <p className="text-white/70 mt-1">Manage input/output pairs for automated evaluation.</p>
            </div>
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition mt-4 sm:mt-0"
            >
              <span>+</span> Add Test Case
            </button>
          </motion.div>

          {/* Add/Edit Form Modal */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  {editingCase ? 'Edit Test Case' : 'New Test Case'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Input Data</label>
                    <textarea
                      name="input_data"
                      value={formData.input_data}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white font-mono text-sm outline-none focus:border-violet-400 resize-none"
                      placeholder="Optional (leave blank if no input)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">
                      Expected Output <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="expected_output"
                      value={formData.expected_output}
                      onChange={handleChange}
                      rows={3}
                      required
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white font-mono text-sm outline-none focus:border-violet-400 resize-none"
                      placeholder="Enter the expected output exactly"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg"
                    >
                      {editingCase ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Test Cases List */}
          {testCases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-white/50">No test cases defined yet. Add one to enable evaluation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testCases.map((tc) => (
                <motion.div
                  key={tc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg"
                >
                  <div className="mb-3 sm:mb-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-400/30">
                        TC #{tc.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-xs text-violet-300 mb-1 font-semibold">📥 Input</p>
                        <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono">
                          {tc.input_data || '(none)'}
                        </pre>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-xs text-emerald-300 mb-1 font-semibold">📤 Expected Output</p>
                        <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono">
                          {tc.expected_output || '(none)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditForm(tc)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tc.id)}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 border border-red-400/30 hover:bg-red-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}