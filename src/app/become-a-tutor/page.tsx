'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  submitTutorApplication,
} from '@/services/v1Service';

const SUBJECT_OPTIONS = [
  'Programming',
  'Python',
  'Java',
  'Web Development',
  'AI / ML',
  'Data Science',
  'Mathematics',
  'Science',
  'English',
  'Current Affairs',
];

const LANGUAGE_OPTIONS = [
  'English',
  'Tamil',
  'Hindi',
  'Telugu',
  'Malayalam',
  'Kannada',
];

export default function BecomeTutorPage() {

  const [loading, setLoading] =
    useState(false);

  const [resume, setResume] =
    useState<File | null>(null);

    const [submitted, setSubmitted] =
    useState(false);

    const [applicationId, setApplicationId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState({

      full_name: '',

      email: '',

      phone: '',

      city_state: '',

      linkedin_profile: '',

      highest_qualification: '',

      degree: '',

      college_name: '',

      year_of_completion: '',

      skills: '',

      experience: '',

      expertise_level: '',

      current_status: '',

      organization: '',

      professional_summary: '',

      mentor_subjects: [] as string[],

      mentor_languages: [] as string[],
    });

  const updateField = (
    field: string,
    value: string
  ) => {

    setForm(prev => ({
      ...prev,
      [field]: value,
    }));

  };

  const toggleSubject = (
    subject: string
  ) => {

    setForm(prev => ({

      ...prev,

      mentor_subjects:
        prev.mentor_subjects.includes(subject)

          ? prev.mentor_subjects.filter(
              item =>
                item !== subject
            )

          : [
              ...prev.mentor_subjects,
              subject,
            ],

    }));

  };

  const toggleLanguage = (
    language: string
  ) => {

    setForm(prev => ({

      ...prev,

      mentor_languages:
        prev.mentor_languages.includes(language)

          ? prev.mentor_languages.filter(
              item =>
                item !== language
            )

          : [
              ...prev.mentor_languages,
              language,
            ],

    }));

  };

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      try {

        setLoading(true);

        const formData =
          new FormData();

        Object.entries(form)
          .forEach(
            ([key, value]) => {

              if (
                Array.isArray(value)
              ) {

                formData.append(
                  key,
                  JSON.stringify(
                    value
                  )
                );

              } else {

                formData.append(
                  key,
                  String(value)
                );

              }

            }
          );

        if (resume) {

          formData.append(
            'resume',
            resume
          );

        }

        const response =
            await submitTutorApplication(
                formData
            );

            setApplicationId(
            response.application_id
            );

            setSubmitted(true);

      } catch (error) {

        console.error(error);

        toast.error(
          'Failed to submit application'
        );

      } finally {

        setLoading(false);

      }

    };

    if (submitted) {

        return (

            <div
            className="
                flex
                min-h-screen
                items-center
                justify-center
                bg-gray-50
                p-4
            "
            >

            <div
                className="
                w-full
                max-w-2xl
                rounded-3xl
                bg-white
                p-10
                text-center
                shadow-xl
                "
            >

                <div
                className="
                    mb-6
                    text-7xl
                "
                >
                🎉
                </div>

                <h1
                className="
                    text-3xl
                    font-bold
                    text-gray-900
                "
                >
                Application Submitted!
                </h1>

                <p
                className="
                    mt-4
                    text-lg
                    text-gray-600
                "
                >
                Thank you for applying to become
                a Knowmato Tutor.
                </p>

                <div
                className="
                    mt-8
                    rounded-2xl
                    bg-indigo-50
                    p-6
                "
                >

                <p
                    className="
                    text-sm
                    text-gray-600
                    "
                >
                    Application ID
                </p>

                <p
                    className="
                    mt-2
                    text-2xl
                    font-bold
                    text-indigo-600
                    "
                >
                    #{applicationId}
                </p>

                </div>

                <div
                className="
                    mt-8
                    space-y-3
                    text-left
                "
                >

                <div className="flex gap-3">
                    <span>✅</span>
                    <span>
                    Your application has been received.
                    </span>
                </div>

                <div className="flex gap-3">
                    <span>✅</span>
                    <span>
                    Our team will review your profile.
                    </span>
                </div>

                <div className="flex gap-3">
                    <span>✅</span>
                    <span>
                    Approved tutors will receive
                    login credentials via email.
                    </span>
                </div>

                </div>

                <button
                onClick={() => {
                    window.location.href = '/';
                }}
                className="
                    mt-8
                    rounded-xl
                    bg-indigo-600
                    px-8
                    py-3
                    font-semibold
                    text-white
                    transition
                    hover:bg-indigo-700
                "
                >
                Back to Home
                </button>

            </div>

            </div>

        );

        }

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
      "
    >

      <div
        className="
          mx-auto
          max-w-5xl
          p-4
          md:p-8
        "
      >

        {/* Hero */}

        <div
          className="
            mb-8
            rounded-3xl
            bg-gradient-to-r
            from-indigo-600
            to-purple-600
            p-8
            text-white
          "
        >

          <h1
            className="
              text-3xl
              font-bold
            "
          >
            Become a Knowmato Tutor
          </h1>

          <p
            className="
              mt-3
              text-indigo-100
            "
          >
            Share your knowledge,
            help students and earn.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="
            space-y-8
          "
        >

          {/* Personal Information */}

          <section
            className="
                rounded-3xl
                bg-white
                p-6
                shadow-sm
            "
            >

            <h2
                className="
                mb-6
                text-xl
                font-bold
                text-gray-900
                "
            >
                Personal Information
            </h2>

            <div
                className="
                grid
                grid-cols-1
                gap-5

                md:grid-cols-2
                "
            >

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name *
                </label>

                <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) =>
                    updateField(
                        'full_name',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email *
                </label>

                <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                    updateField(
                        'email',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number *
                </label>

                <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                    updateField(
                        'phone',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    City & State *
                </label>

                <input
                    type="text"
                    value={form.city_state}
                    onChange={(e) =>
                    updateField(
                        'city_state',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

            </div>

            <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                LinkedIn Profile
                </label>

                <input
                type="url"
                value={form.linkedin_profile}
                onChange={(e) =>
                    updateField(
                    'linkedin_profile',
                    e.target.value
                    )
                }
                className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                "
                />

            </div>

            </section>

          {/* Education */}

          <section
            className="
                rounded-3xl
                bg-white
                p-6
                shadow-sm
            "
            >

            <h2
                className="
                mb-6
                text-xl
                font-bold
                text-gray-900
                "
            >
                Educational Background
            </h2>

            <div
                className="
                grid
                grid-cols-1
                gap-5

                md:grid-cols-2
                "
            >

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Highest Qualification
                </label>

                <input
                    type="text"
                    value={form.highest_qualification}
                    onChange={(e) =>
                    updateField(
                        'highest_qualification',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Degree
                </label>

                <input
                    type="text"
                    value={form.degree}
                    onChange={(e) =>
                    updateField(
                        'degree',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    College Name
                </label>

                <input
                    type="text"
                    value={form.college_name}
                    onChange={(e) =>
                    updateField(
                        'college_name',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Year Of Completion
                </label>

                <input
                    type="number"
                    value={form.year_of_completion}
                    onChange={(e) =>
                    updateField(
                        'year_of_completion',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

            </div>

            </section>

          {/* Professional */}

          <section
            className="
                rounded-3xl
                bg-white
                p-6
                shadow-sm
            "
            >

            <h2
                className="
                mb-6
                text-xl
                font-bold
                text-gray-900
                "
            >
                Professional Experience
            </h2>

            <div
                className="
                grid
                grid-cols-1
                gap-5

                md:grid-cols-2
                "
            >

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Skills *
                </label>

                <input
                    type="text"
                    value={form.skills}
                    onChange={(e) =>
                    updateField(
                        'skills',
                        e.target.value
                    )
                    }
                    placeholder="Python, React, AI..."
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Experience (Years)
                </label>

                <input
                    type="number"
                    value={form.experience}
                    onChange={(e) =>
                    updateField(
                        'experience',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Expertise Level
                </label>

                <select
                    value={form.expertise_level}
                    onChange={(e) =>
                    updateField(
                        'expertise_level',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                >
                    <option value="">
                    Select
                    </option>

                    <option value="Beginner">
                    Beginner
                    </option>

                    <option value="Intermediate">
                    Intermediate
                    </option>

                    <option value="Advanced">
                    Advanced
                    </option>

                    <option value="Expert">
                    Expert
                    </option>
                </select>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Current Status
                </label>

                <select
                    value={form.current_status}
                    onChange={(e) =>
                    updateField(
                        'current_status',
                        e.target.value
                    )
                    }
                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                    "
                >
                    <option value="">
                    Select
                    </option>

                    <option value="Student">
                    Student
                    </option>

                    <option value="Working Professional">
                    Working Professional
                    </option>

                    <option value="Freelancer">
                    Freelancer
                    </option>

                    <option value="Teacher">
                    Teacher
                    </option>
                </select>
                </div>

            </div>

            <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                Organization
                </label>

                <input
                type="text"
                value={form.organization}
                onChange={(e) =>
                    updateField(
                    'organization',
                    e.target.value
                    )
                }
                className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                "
                />

            </div>

            <div className="mt-5">
            <section
                className="
                    rounded-3xl
                    bg-white
                    p-6
                    shadow-sm
                "
                >

                <h2
                    className="
                    mb-5
                    text-xl
                    font-bold
                    text-gray-900
                    "
                >
                    Subjects You Can Teach
                </h2>

                <div
                    className="
                    flex
                    flex-wrap
                    gap-3
                    "
                >

                    {SUBJECT_OPTIONS.map(
                    (subject) => (

                        <button
                        type="button"
                        key={subject}
                        onClick={() =>
                            toggleSubject(
                            subject
                            )
                        }
                        className={`
                            rounded-full
                            px-4
                            py-2
                            text-sm
                            font-medium
                            transition

                            ${
                            form.mentor_subjects.includes(
                                subject
                            )
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }
                        `}
                        >
                        {subject}
                        </button>

                    )
                    )}

                </div>

                </section>

            </div>

            <div className="mt-5">

            <section
                className="
                    rounded-3xl
                    bg-white
                    p-6
                    shadow-sm
                "
                >

                <h2
                    className="
                    mb-5
                    text-xl
                    font-bold
                    text-gray-900
                    "
                >
                    Languages
                </h2>

                <div
                    className="
                    flex
                    flex-wrap
                    gap-3
                    "
                >

                    {LANGUAGE_OPTIONS.map(
                    (language) => (

                        <button
                        type="button"
                        key={language}
                        onClick={() =>
                            toggleLanguage(
                            language
                            )
                        }
                        className={`
                            rounded-full
                            px-4
                            py-2
                            text-sm
                            font-medium
                            transition

                            ${
                            form.mentor_languages.includes(
                                language
                            )
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }
                        `}
                        >
                        {language}
                        </button>

                    )
                    )}

                </div>

                </section>
            </div>

            <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                Professional Summary
                </label>

                <textarea
                rows={5}
                value={form.professional_summary}
                onChange={(e) =>
                    updateField(
                    'professional_summary',
                    e.target.value
                    )
                }
                className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    p-3
                    text-black
                "
                />

            </div>

            <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                Upload Resume
                </label>
                <section
                    className="
                        rounded-3xl
                        bg-white
                        p-6
                        shadow-sm
                    "
                    >

                    <h2
                        className="
                        mb-5
                        text-xl
                        font-bold
                        text-gray-900
                        "
                    >
                        Resume Upload
                    </h2>

                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                        setResume(
                            e.target.files?.[0] || null
                        )
                        }
                        className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        p-3
                        text-black
                        "
                    />

                    {resume && (

                        <p
                        className="
                            mt-3
                            text-sm
                            text-green-600
                        "
                        >
                        ✓ {resume.name}
                        </p>

                    )}

                    </section>

                    <button
                    type="submit"
                    disabled={loading}
                    className="
                        w-full
                        rounded-2xl
                        bg-indigo-600
                        py-4
                        text-lg
                        font-semibold
                        text-white
                        transition

                        hover:bg-indigo-700
                        disabled:opacity-50
                    "
                    >
                    {loading
                        ? 'Submitting...'
                        : 'Submit Application'}
                    </button>
                </div>

            </section>

        </form>

      </div>

    </div>

  );

}