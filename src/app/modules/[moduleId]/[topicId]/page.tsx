"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";

export default function TopicPage() {
  const { moduleId, topicId } = useParams<{
    moduleId: string;
    topicId: string;
  }>();
  const [mod, setMod] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [topicId]);

  async function fetchData() {
    const { data: modData } = await supabase
      .from("modules")
      .select("id, name")
      .eq("id", moduleId)
      .single();
    setMod(modData);

    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();
    setTopic(topicData);

    const { data: questionsData } = await supabase
      .from("questions")
      .select(
        `
        id, question_text, question_image_url, explanation, created_at, created_by,
        creator:profiles!created_by(username, display_name),
        options(id, option_text, option_image_url, is_correct, sort_order)
      `
      )
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });
    setQuestions(questionsData || []);
  }

  if (!topic || !mod) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/modules" className="hover:text-brand-600">
          Modules
        </Link>
        <span className="mx-2">→</span>
        <Link href={`/modules/${moduleId}`} className="hover:text-brand-600">
          {mod.name}
        </Link>
        <span className="mx-2">→</span>
        <span className="text-gray-900 font-medium">{topic.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{topic.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {questions.length} question{questions.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          {questions.length > 0 && (
            <Link
              href={`/modules/${moduleId}/${topicId}/quiz`}
              className="btn-secondary text-sm"
            >
              🎯 Start Quiz
            </Link>
          )}
          {user && (
            <Link
              href={`/modules/${moduleId}/${topicId}/create`}
              className="btn-primary text-sm"
            >
              + New Question
            </Link>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            showAnswer={false}
            currentUserId={user?.id}
            onDelete={() => fetchData()}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          <p>No questions for this topic yet.</p>
          {user && (
            <Link
              href={`/modules/${moduleId}/${topicId}/create`}
              className="text-brand-600 hover:underline mt-2 block"
            >
              Create the first question →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
