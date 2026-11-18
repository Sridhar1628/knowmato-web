'use client';

import { useEffect } from 'react';

interface AssessmentRulesModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
}

const RULES = [
  {
    number: '01',
    title: 'Work independently',
    description: 'Complete the assessment using your own knowledge and skills.',
  },
  {
    number: '02',
    title: 'Do not copy and paste code',
    description: 'Pasting code into the programming editor is disabled during the assessment.',
  },
  {
    number: '03',
    title: 'Stay on the assessment screen',
    description: 'Avoid switching browser tabs or minimising the browser. These actions may be detected and recorded as a violation.',
  },
  {
    number: '04',
    title: 'Keep fullscreen enabled',
    description: 'The assessment opens in fullscreen mode when supported. Exiting fullscreen may trigger a warning.',
  },
  {
    number: '05',
    title: 'Watch the timer',
    description: 'The assessment is time-limited. When the allowed time expires, submission may happen automatically.',
  },
  {
    number: '06',
    title: 'Save and submit your work',
    description: 'Your answers and code are saved while you work. Review your answers and submit before time runs out.',
  },
  {
    number: '07',
    title: 'Use the Run option responsibly',
    description: 'You may run your program against the available test cases. Check your output before moving to the next question.',
  },
];

export default function AssessmentRulesModal({
  open,
  onCancel,
  onConfirm,
  title = 'Assessment Rules & Instructions',
  confirmLabel = 'I Understand — Continue',
}: AssessmentRulesModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-rules-title"
        aria-describedby="assessment-rules-description"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-violet-300/20 bg-[#171333] text-white shadow-[0_25px_100px_rgba(0,0,0,0.6)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-cyan-500/10 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/15 text-2xl">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
                KnowMato Assessment
              </p>
              <h2 id="assessment-rules-title" className="mt-1 text-xl font-extrabold sm:text-2xl">
                {title}
              </h2>
              <p id="assessment-rules-description" className="mt-2 text-sm leading-6 text-white/65">
                Please read these instructions carefully before entering your assessment.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close assessment rules"
              className="rounded-xl px-2 py-1 text-2xl leading-none text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-7">
          {RULES.map((rule) => (
            <div key={rule.number} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 sm:p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-xs font-extrabold text-violet-200">
                {rule.number}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">{rule.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">{rule.description}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Important browser notice</p>
            <p className="mt-1 text-xs leading-5 text-amber-100/70">
              Browser security restrictions mean that KnowMato can detect certain focus and fullscreen changes, but cannot completely prevent operating-system shortcuts, switching to another device, or every form of leaving the browser.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
