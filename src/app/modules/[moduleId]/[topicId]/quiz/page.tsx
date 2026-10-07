"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizPage() {
  const { moduleId, topicId } = useParams<{
    moduleId: string;
    topicId: string;
  }>();
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [topic, setTopic] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [topicId]);

  async function fetchData() {
    const { data: topicData } = await supabase
      .from("topics")
      .select("name")
      .eq("id", topicId)
      .single();
    setTopic(topicData);

    const { data } = await supabase
      .from("questions")
      .select(
        `
        id, question_text, question_image_url, explanation,
        options(id, option_text, option_image_url, is_correct, sort_order)
      `
      )
      .eq("topic_id", topicId)
      .order("created_at");

    // Shuffle questions AND options
    if (data) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      shuffled.forEach((q: any) => {
        q.options = [...q.options].sort(() => Math.random() - 0.5);
      });
      setQuestions(shuffled);
    }
  }

  const current = questions[currentIndex];
  const displayOptions = current ? current.options : [];

  function toggleOption(optionId: string) {
    if (submitted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  async function handleSubmitAnswer() {
    if (selectedIds.size === 0) return;
    setSubmitted(true);

    // Check if correct
    const correctIds = new Set(
      displayOptions.filter((o: any) => o.is_correct).map((o: any) => o.id)
    );
    const isCorrect =
      selectedIds.size === correctIds.size &&
      Array.from(selectedIds).every((id) => correctIds.has(id));

    if (isCorrect) setScore((s) => s + 1);

    // Save attempt
    if (user) {
      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        question_id: current.id,
        selected_option_ids: Array.from(selectedIds),
        is_correct: isCorrect,
      });
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIds(new Set());
      setSubmitted(false);
    }
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">Loading quiz...</div>
    );
  }

  // Finished screen
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-6xl mb-4">
          {percentage >= 80 ? "🎉" : percentage >= 50 ? "💪" : "📚"}
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">Quiz Complete!</h1>
        <p className="text-lg text-neutral-400 mb-1">
          {score} / {questions.length} correct
        </p>
        <div className="w-full bg-neutral-800 rounded-full h-4 my-4 max-w-xs mx-auto">
          <div
            className={`h-4 rounded-full ${
              percentage >= 80
                ? "bg-green-500"
                : percentage >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-2xl font-bold text-white mb-6">{percentage}%</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setFinished(false);
              setSubmitted(false);
              setSelectedIds(new Set());
              setQuestions((prev) =>
                [...prev]
                  .sort(() => Math.random() - 0.5)
                  .map((q: any) => ({
                    ...q,
                    options: [...q.options].sort(() => Math.random() - 0.5),
                  }))
              );
            }}
            className="btn-primary"
          >
            Try Again
          </button>
          <Link
            href={`/modules/${moduleId}/${topicId}`}
            className="btn-secondary"
          >
            Back to Topic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
          <span>{topic?.name}</span>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card p-6">
        <p className="text-lg font-medium text-white mb-4">
          {current.question_text}
        </p>

        {current.question_image_url && (
          <img
            src={current.question_image_url}
            alt=""
            className="rounded-lg max-h-64 object-contain mb-4"
          />
        )}

        {/* Hint: multiple correct */}
        {displayOptions.filter((o: any) => o.is_correct).length > 1 && (
          <p className="text-xs text-amber-400 bg-amber-900/20 px-3 py-1.5 rounded-lg mb-4">
            Multiple correct answers possible
          </p>
        )}

        {/* Options */}
        <div className="space-y-2">
          {displayOptions.map((opt: any, i: number) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selectedIds.has(opt.id);
            const isCorrect = opt.is_correct;

            let optionStyle = "border-neutral-700 hover:border-neutral-500";
            if (submitted) {
              if (isCorrect) optionStyle = "border-green-600 bg-green-900/20";
              else if (isSelected)
                optionStyle = "border-red-600 bg-red-900/20";
              else optionStyle = "border-neutral-800 bg-neutral-900/50";
            } else if (isSelected) {
              optionStyle = "border-white bg-neutral-800";
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.id)}
                disabled={submitted}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${optionStyle}`}
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                    submitted && isCorrect
                      ? "bg-green-500 text-white"
                      : submitted && isSelected
                        ? "bg-red-500 text-white"
                        : isSelected
                          ? "bg-white text-black"
                          : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {submitted
                    ? isCorrect
                      ? "✓"
                      : isSelected
                        ? "×"
                        : letter
                    : letter}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-neutral-200">{opt.option_text}</p>
                  {opt.option_image_url && (
                    <img
                      src={opt.option_image_url}
                      alt=""
                      className="rounded max-h-32 object-contain mt-2"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation after submit */}
        {submitted && current.explanation && (
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg text-sm text-blue-300">
            <span className="font-medium">Explanation:</span>{" "}
            {current.explanation}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          {!submitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedIds.size === 0}
              className="btn-primary"
            >
              Check Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              {currentIndex + 1 >= questions.length ? "See Results" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
