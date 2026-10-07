import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createServerSupabase();

  const { data: recentQuestions } = await supabase
    .from("questions")
    .select(
      `
      id, question_text, question_image_url, created_at,
      creator:profiles!created_by(username, display_name),
      topic:topics!topic_id(
        id, name,
        module:modules!module_id(id, name)
      ),
      options(id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: modules } = await supabase
    .from("modules")
    .select("id, name, description")
    .limit(6);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          QUIZ COMMUNITY
        </h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto mb-8">
          Buat soal pilihan ganda dari Vorlesung-mu, share ke teman, dan
          belajar bareng.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/modules" className="btn-primary">
            Browse Modules
          </Link>
        </div>
      </section>

      {/* Modules overview */}
      {modules && modules.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Modules</h2>
            <Link
              href="/modules"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <Link
                key={mod.id}
                href={`/modules/${mod.id}`}
                className="card p-4 hover:border-neutral-600 transition-colors"
              >
                <h3 className="font-semibold text-white">{mod.name}</h3>
                {mod.description && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {mod.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity feed */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">
          Recent Questions
        </h2>
        {recentQuestions && recentQuestions.length > 0 ? (
          <div className="space-y-3">
            {recentQuestions.map((q: any) => (
              <div key={q.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <span className="font-medium text-white">
                        {q.topic?.module?.name}
                      </span>
                      <span>·</span>
                      <span>{q.topic?.name}</span>
                      <span>·</span>
                      <span>by {q.creator?.display_name}</span>
                    </div>
                    <p className="text-neutral-200">{q.question_text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600">
                      <span>{q.options?.length || 0} options</span>
                      <span>
                        {new Date(q.created_at).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>
                  {q.question_image_url && (
                    <img
                      src={q.question_image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-neutral-500">
            <p>No questions yet. Be the first to create one!</p>
          </div>
        )}
      </section>
    </div>
  );
}
