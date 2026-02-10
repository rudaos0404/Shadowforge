import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../shared/api/endpoints";

export default function RankingPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["rankings", page, limit],
    queryFn: () => api.rankings({ page, limit }),
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-4">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ranking</h2>
        <Link className="text-sm underline" to="/">
          타이틀
        </Link>
      </div>

      <div className="w-full max-w-2xl rounded border p-4">
        {query.isLoading && <div>랭킹 불러오는 중...</div>}
        {query.isError && (
          <div className="text-red-600">
            /rankings 조회 실패: 서버 실행 여부 확인
          </div>
        )}

        {!query.isLoading && !query.isError && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-xs text-gray-500 pb-2 border-b">
              <div className="col-span-1">#</div>
              <div className="col-span-5">닉네임</div>
              <div className="col-span-2 text-right">점수</div>
              <div className="col-span-2 text-right">시간</div>
              <div className="col-span-2 text-right">날짜</div>
            </div>

            {rows.map((r) => (
              <div key={`${r.rank}-${r.nickname}-${r.playedAt}`} className="grid grid-cols-12 text-sm">
                <div className="col-span-1 font-semibold">{r.rank}</div>
                <div className="col-span-5">{r.nickname}</div>
                <div className="col-span-2 text-right tabular-nums">{r.score}</div>
                <div className="col-span-2 text-right tabular-nums">{r.clearTime}s</div>
                <div className="col-span-2 text-right text-xs text-gray-500">
                  {new Date(r.playedAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {rows.length === 0 && <div className="text-sm text-gray-500">랭킹 데이터가 비어있음</div>}
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl flex justify-between">
        <button
          className="px-3 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          이전
        </button>
        <div className="text-sm text-gray-600">page {page}</div>
        <button
          className="px-3 py-2 rounded border"
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
