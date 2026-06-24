'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOnlineTutors } from '@/services/v1Service';

import {
  subscribeDashboard,
} from '@/store/dashboardRealtime';

import {
  dashboardCache,
} from '@/store/dashboardCache';

interface Tutor {
  id: number;
  display_name: string;
  skills: string;
  experience: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_top_tutor: boolean;
  is_online: boolean;
}

export default function TutorsPage() {
  const router = useRouter();

  const [tutors, setTutors] =
    useState<Tutor[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  useEffect(() => {

    const fetchTutors = async () => {

      try {

        const res =
          await getOnlineTutors();

        const tutorData =
          res.data || [];

        dashboardCache.onlineTutors =
          tutorData;

        setTutors(tutorData);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

    fetchTutors();

  }, []);

  useEffect(() => {

    const unsubscribe =
      subscribeDashboard(() => {

        console.log(
          '🔄 Tutors Realtime Update'
        );

        setTutors([
          ...dashboardCache.onlineTutors,
        ]);

      });

    return unsubscribe;

  }, []);

  const filteredTutors =
    tutors.filter((tutor) => {

      const q =
        search
          .toLowerCase()
          .trim();

      return (

        tutor.display_name
          .toLowerCase()
          .includes(q)

        ||

        tutor.skills
          ?.toLowerCase()
          .includes(q)

      );

    });

  return (
    <div
      className="
        mx-auto
        max-w-7xl
        p-6
      "
    >
      {/* Header */}

      <div
        className="
          mb-8
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div>

          <h1
            className="
              text-3xl
              font-bold
              text-gray-900
            "
          >
            👨‍🏫 Expert Tutors
          </h1>

          <p
            className="
              mt-2
              text-gray-500
            "
          >
            Connect with verified experts
          </p>

        </div>

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search tutors..."
          className="
            w-full
            rounded-xl
            border
            border-gray-300
            px-4
            py-3
            md:w-80
          "
        />
      </div>

      {loading ? (

        <div
          className="
            flex
            justify-center
            py-20
          "
        >
          Loading...
        </div>

      ) : filteredTutors.length === 0 ? (

        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-gray-300
            bg-white
            p-10
            text-center
          "
        >
          No tutors available.
        </div>

      ) : (

        <div
          className="
            grid
            grid-cols-1
            gap-6

            lg:grid-cols-3
          "
        >
          {filteredTutors.map(
            (tutor) => (

              <div
                key={tutor.id}
                className="
                  group
                  rounded-3xl
                  border
                  border-gray-200
                  bg-white
                  p-6
                  shadow-sm
                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:border-indigo-300
                  hover:shadow-xl
                "
              >
                {/* Header */}

                <div
                  className="
                    flex
                    items-start
                    justify-between
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-indigo-600
                        font-bold
                        text-white
                      "
                    >
                      {tutor.display_name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div>

                      <h3
                        className="
                          font-semibold
                          text-gray-900
                        "
                      >
                        {tutor.display_name}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-gray-500
                        "
                      >
                        {tutor.experience}
                        + Years Experience
                      </p>

                    </div>
                  </div>

                  <span
                    className={`
                      h-3
                      w-3
                      rounded-full
                      ${
                        tutor.is_online
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }
                    `}
                  />
                </div>

                {/* Skills */}

                <div
                  className="
                    mt-4
                  "
                >
                  <p
                    className="
                      text-sm
                      text-gray-600
                    "
                  >
                    {tutor.skills}
                  </p>
                </div>

                {/* Badges */}

                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {tutor.is_verified && (
                    <span
                      className="
                        rounded-full
                        bg-green-100
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-green-700
                      "
                    >
                      ✅ Verified
                    </span>
                  )}

                  {tutor.is_top_tutor && (
                    <span
                      className="
                        rounded-full
                        bg-yellow-100
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-yellow-700
                      "
                    >
                      ⭐ Top Tutor
                    </span>
                  )}
                </div>

                {/* Rating */}

                <div
                  className="
                    mt-4
                    text-sm
                    text-gray-600
                  "
                >
                  ⭐ {tutor.average_rating}
                  {' • '}
                  {tutor.total_reviews}
                  Reviews
                </div>

                {/* Button */}

                <button
                  onClick={() =>
                    router.push(
                      `/student/post-doubt?tutorId=${tutor.id}`
                    )
                  }
                  className="
                    mt-6
                    w-full
                    rounded-xl
                    bg-indigo-600
                    py-3
                    font-semibold
                    text-white
                    transition

                    hover:bg-indigo-700
                  "
                >
                  Request Tutor
                </button>
              </div>
            )
          )}
        </div>

      )}
    </div>
  );
}