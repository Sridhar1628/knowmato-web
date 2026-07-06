"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getQuizQuestions,
  getQuestionOptions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createQuestionOption,
  updateQuestionOption,
  deleteQuestionOption,
  reorderQuestions,
  Question,
  QuestionOption,
} from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

export default function QuizQuestionsPage() {
  const { id: quizId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null); // for editing
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [optionForm, setOptionForm] = useState<Partial<QuestionOption>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "question" | "option"; id: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qs = await getQuizQuestions(Number(quizId));
      setQuestions(qs);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [quizId]);

  // --- Question handlers ---
  const handleSaveQuestion = async (data: Partial<Question>) => {
    try {
      if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, data);
        toast.success("Question updated");
      } else {
        await createQuestion({ ...data, quiz: Number(quizId) });
        toast.success("Question created");
      }
      setShowQuestionModal(false);
      setSelectedQuestion(null);
      fetchData();
    } catch {
      toast.error("Failed to save question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "question") return;
    try {
      await deleteQuestion(deleteConfirm.id);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // --- Option handlers ---
  const openOptionModal = (questionId: number, option?: QuestionOption) => {
    setOptionForm(option ? option : { question: questionId, option_text: "", is_correct: false, order: 0, is_active: true });
    setShowOptionModal(true);
  };

  const handleSaveOption = async () => {
    if (!optionForm.question) return;
    try {
      if (optionForm.id) {
        await updateQuestionOption(optionForm.id, optionForm);
        toast.success("Option updated");
      } else {
        await createQuestionOption(optionForm);
        toast.success("Option created");
      }
      setShowOptionModal(false);
      fetchData(); // refresh questions (options not fetched separately, but you might need to refetch options inside the expanded view - we'll store options per question locally)
    } catch {
      toast.error("Failed to save option");
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "option") return;
    try {
      await deleteQuestionOption(deleteConfirm.id);
      toast.success("Option deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // For simplicity, we'll fetch options on demand when expanding a question.
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [optionsMap, setOptionsMap] = useState<Record<number, QuestionOption[]>>({});

  const toggleExpand = async (qId: number) => {
    if (expandedQuestion === qId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(qId);
      if (!optionsMap[qId]) {
        try {
          const opts = await getQuestionOptions({ question: qId });
          setOptionsMap((prev) => ({ ...prev, [qId]: opts }));
        } catch {
          toast.error("Failed to load options");
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">❓ Questions for Quiz #{quizId}</h1>
            <button onClick={() => { setSelectedQuestion(null); setShowQuestionModal(true); }} className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-violet-300 hover:bg-white/20 transition">
              + Add Question
            </button>
          </div>

          {loading ? (
            <div className="text-center text-white/60 py-20">Loading...</div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">Q{q.order || q.id}: {q.question}</p>
                      <p className="text-sm text-white/60">Type: {q.question_type} | Marks: {q.marks}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedQuestion(q); setShowQuestionModal(true); }} className="px-2 py-1 bg-violet-600/60 text-white rounded-lg text-xs">Edit</button>
                      <button onClick={() => setDeleteConfirm({ type: "question", id: q.id })} className="px-2 py-1 bg-red-600/20 text-red-300 rounded-lg text-xs">Delete</button>
                      <button onClick={() => toggleExpand(q.id)} className="px-2 py-1 bg-cyan-600/60 text-white rounded-lg text-xs">
                        {expandedQuestion === q.id ? "Hide Options" : "Options"}
                      </button>
                    </div>
                  </div>

                  {expandedQuestion === q.id && (
                    <div className="mt-4 pl-4 border-l border-white/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/70">Options</span>
                        <button onClick={() => openOptionModal(q.id)} className="text-xs px-2 py-1 bg-cyan-600/40 text-white rounded-lg">+ Add Option</button>
                      </div>
                      {optionsMap[q.id]?.length === 0 && <p className="text-xs text-white/40">No options yet.</p>}
                      {optionsMap[q.id]?.map((opt) => (
                        <div key={opt.id} className="flex justify-between items-center py-1 border-b border-white/10">
                          <span className="text-sm text-white/80">{opt.option_text} {opt.is_correct && "✅"}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openOptionModal(q.id, opt)} className="text-xs text-violet-300">Edit</button>
                            <button onClick={() => setDeleteConfirm({ type: "option", id: opt.id })} className="text-xs text-red-300">Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modals */}
          {showQuestionModal && (
            <QuestionModal
              initial={selectedQuestion}
              onSave={handleSaveQuestion}
              onClose={() => { setShowQuestionModal(false); setSelectedQuestion(null); }}
            />
          )}
          {showOptionModal && (
            <OptionModal
              initial={optionForm}
              onChange={setOptionForm}
              onSave={handleSaveOption}
              onClose={() => setShowOptionModal(false)}
            />
          )}
          <ConfirmModal
            open={!!deleteConfirm}
            title="Confirm Delete"
            message="This action cannot be undone."
            onConfirm={deleteConfirm?.type === "question" ? handleDeleteQuestion : handleDeleteOption}
            onCancel={() => setDeleteConfirm(null)}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

// Inline modal components for brevity
function QuestionModal({ initial, onSave, onClose }: { initial: Question | null; onSave: (d: Partial<Question>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Question>>(initial || { question: "", question_type: "mcq", marks: 1, order: 0, explanation: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1b2e] p-6 rounded-2xl w-full max-w-md mx-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">{initial ? "Edit Question" : "New Question"}</h3>
        <div className="space-y-3">
          <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question text" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value as "mcq" | "true_false" | "short_answer" | "essay" })} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
            <option value="mcq">MCQ</option><option value="true_false">True/False</option><option value="short_answer">Short Answer</option><option value="essay">Essay</option>
          </select>
          <input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} placeholder="Marks" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
          <textarea value={form.explanation || ""} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Explanation" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-xl text-white">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-violet-600 rounded-xl text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

function OptionModal({ initial, onChange, onSave, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1b2e] p-6 rounded-2xl w-full max-w-md mx-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">{initial.id ? "Edit Option" : "New Option"}</h3>
        <input value={initial.option_text || ""} onChange={(e) => onChange({ ...initial, option_text: e.target.value })} placeholder="Option text" className="w-full px-3 py-2 mb-3 rounded-xl bg-white/5 border border-white/10 text-white" />
        <label className="flex items-center gap-2 text-white/70 mb-3">
          <input type="checkbox" checked={initial.is_correct || false} onChange={(e) => onChange({ ...initial, is_correct: e.target.checked })} /> Correct Answer
        </label>
        <input type="number" value={initial.order || 0} onChange={(e) => onChange({ ...initial, order: Number(e.target.value) })} placeholder="Order" className="w-full px-3 py-2 mb-3 rounded-xl bg-white/5 border border-white/10 text-white" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-xl text-white">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-violet-600 rounded-xl text-white">Save</button>
        </div>
      </div>
    </div>
  );
}