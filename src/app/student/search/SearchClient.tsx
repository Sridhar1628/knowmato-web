'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getMyDoubts,
  getAvailableTutors,
} from '@/services/v1Service';
import toast from 'react-hot-toast';

interface SearchDoubt {
  doubt_id: number;
  title: string;
  category: string;
  status: string;
  tutor: string | null;
  created_at?: string;
}

interface SearchTutor {
  id: number;
  name: string;
  skills: string;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  is_verified: boolean;
  is_top_tutor: boolean;
}

export default function SearchPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const query = searchParams.get('q')?.trim() || '';

  const [loading, setLoading] = useState(true);

  const [
    recentSearches,
    setRecentSearches,
  ] = useState<string[]>([]);

  const [doubts, setDoubts] =
    useState<SearchDoubt[]>([]);

  const [tutors, setTutors] =
    useState<SearchTutor[]>([]);

  

  useEffect(() => {

    const stored =
      JSON.parse(
        localStorage.getItem(
          'recent_searches'
        ) || '[]'
      );

    setRecentSearches(stored);

  }, []);

  const fetchResults =
    useCallback(async () => {

      if (!query) {

        setDoubts([]);
        setTutors([]);
        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        const [
          doubtsRes,
          tutorsRes,
        ] = await Promise.all([
          getMyDoubts({
            search: query,
            page: 1,
          }),
          getAvailableTutors(),
        ]);

        console.log(
          'Doubts:',
          doubtsRes
        );

        console.log(
          'Tutors:',
          tutorsRes
        );

        const doubtsData =
          doubtsRes?.results?.data ||
          doubtsRes?.data ||
          doubtsRes?.results ||
          [];

        const tutorsData =
          tutorsRes?.data || [];

        const filteredDoubts =
          doubtsData.filter(
            (d: SearchDoubt) =>
              d.title
                ?.toLowerCase()
                .includes(
                  query.toLowerCase()
                ) ||
              d.category
                ?.toLowerCase()
                .includes(
                  query.toLowerCase()
                )
          );

        const filteredTutors =
          tutorsData.filter(
            (t: SearchTutor) => {

              const name =
                t.name?.toLowerCase() || '';

              const skills =
                t.skills?.toLowerCase() || '';

              const search =
                query.toLowerCase();

              return (
                name.includes(search) ||
                skills.includes(search)
              );
            }
          );

        setDoubts(filteredDoubts);

        setTutors(filteredTutors);

      } catch (error) {

        console.error(
          'Search error:',
          error
        );

        toast.error(
          'Failed to load search results'
        );

      } finally {

        setLoading(false);

      }

    }, [query]);

  useEffect(() => {

    fetchResults();

  }, [fetchResults]);

  return (
    <div
      className="
        mx-auto
        max-w-7xl
        p-6
      "
    >
      {/* Header */}

      <div className="mb-8">

        <h1
          className="
            text-3xl
            font-bold
            text-gray-800
          "
        >
          🔍 Search Results
        </h1>

        <p
          className="
            mt-2
            text-gray-600
          "
        >
          Search Query:

          <span
            className="
              ml-2
              font-semibold
              text-indigo-600
            "
          >
            {query || 'None'}
          </span>
        </p>

      </div>

      {/* Loading */}

      {loading && (

        <div
          className="
            flex
            items-center
            justify-center
            py-20
          "
        >

          <div
            className="
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-indigo-500
              border-t-transparent
            "
          />

        </div>

      )}

      {/* Results */}

      {!loading && (

        <>
          {/* Doubts */}

          <div className="mb-10">

            <h2
              className="
                mb-4
                text-xl
                font-bold
                text-gray-800
              "
            >
              📚 My Doubts
              <span
                className="
                  ml-2
                  text-sm
                  text-gray-500
                "
              >
                ({doubts.length})
              </span>
            </h2>

            {doubts.length === 0 ? (

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-gray-200
                  bg-white
                  p-6
                  text-center
                "
              >
                No matching doubts found.
              </div>

            ) : (

              <div
                className="
                  grid
                  gap-6
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >

                {doubts.map(
                  (doubt) => (

                    <button
                      key={doubt.doubt_id}
                      onClick={() =>
                        router.push(
                          `/student/my-doubts/${doubt.doubt_id}`
                        )
                      }
                      className="
                        group
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        p-5
                        text-left
                        shadow-sm
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:border-indigo-400
                        hover:shadow-xl
                      "
                    >
                      <div className="flex items-start justify-between">
                        <h3
                          className="
                            line-clamp-2
                            font-semibold
                            text-gray-800
                            group-hover:text-indigo-600
                          "
                        >
                          {doubt.title}
                        </h3>

                        <span
                          className="
                            rounded-full
                            bg-indigo-50
                            px-2
                            py-1
                            text-xs
                            font-medium
                            text-indigo-600
                          "
                        >
                          {doubt.status}
                        </span>
                      </div>

                      <p
                        className="
                          mt-3
                          text-sm
                          text-gray-500
                        "
                      >
                        {doubt.category}
                      </p>

                    </button>
                  )
                )}

              </div>

            )}

          </div>

          {/* Tutors */}

          <div>

            <h2
              className="
                mb-4
                text-xl
                font-bold
                text-gray-800
              "
            >
              👨‍🏫 Tutors
              <span
                className="
                  ml-2
                  text-sm
                  text-gray-500
                "
              >
                ({tutors.length})
              </span>
            </h2>

            {tutors.length === 0 ? (

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-gray-200
                  bg-white
                  p-6
                  text-center
                "
              >
                No matching tutors found.
              </div>

            ) : (

              <div
                className="
                  grid
                  gap-6
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >

                {tutors.map(
                  (tutor) => (

                    <div
                      key={tutor.id}
                      className="
                        group
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        p-5
                        shadow-sm
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:border-indigo-400
                        hover:shadow-xl
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className="
                              flex
                              h-12
                              w-12
                              items-center
                              justify-center
                              rounded-full
                              bg-indigo-600
                              text-lg
                              font-bold
                              text-white
                            "
                          >
                            {tutor.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <h3
                              className="
                                font-semibold
                                text-gray-800
                                group-hover:text-indigo-600
                              "
                            >
                              {tutor.name}
                            </h3>

                            <p
                              className={`
                                text-xs
                                ${
                                  tutor.is_online
                                    ? 'text-green-600'
                                    : 'text-red-500'
                                }
                              `}
                            >
                              {tutor.is_online
                                ? '🟢 Online'
                                : '🔴 Offline'}
                            </p>
                          </div>
                        </div>

                        <h3
                          className="
                            font-semibold
                            text-gray-800
                          "
                        >
                          {tutor.name}
                        </h3>

                        {tutor.is_verified &&
                          <span>✅</span>}

                        {tutor.is_top_tutor &&
                          <span>⭐</span>}

                      </div>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-gray-500
                        "
                      >
                        {tutor.skills}
                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          text-gray-400
                        "
                      >
                        ⭐ {tutor.average_rating}
                        {' • '}
                        {tutor.total_reviews} reviews
                      </p>

                      <button
                        disabled={!tutor.is_online}
                        onClick={() =>
                          router.push(
                            `/student/post-doubt?tutorId=${tutor.id}&tutorName=${encodeURIComponent(
                              tutor.name
                            )}`
                          )
                        }
                        className={`
                          mt-4
                          w-full
                          rounded-lg
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-white
                          transition
                          ${
                            tutor.is_online
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : 'cursor-not-allowed bg-gray-300'
                          }
                        `}
                      >
                        {tutor.is_online
                          ? '🚀 Request This Tutor'
                          : '🔴 Tutor Offline'}
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </>
      )}
    </div>
  );
}