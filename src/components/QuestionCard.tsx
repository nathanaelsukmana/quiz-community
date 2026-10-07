"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  question: any;
  showAnswer: boolean;
  currentUserId?: string;
  onDelete?: () => void;
}

export function QuestionCard({
  question,
  showAnswer: initialShow,
  currentUserId,
  onDelete,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(initialShow);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const sortedOptions = [...(question.options || [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  async function handleDelete() {
    if (!confirm("Delete this question?")) return;
    setDeleting(true);
    await supabase.from("questions").delete().eq("id", question.id);
    onDelete?.();
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-gray-400">
          by {question.creator?.display_name} ·{" "}
          {new Date(question.created_at).toLocaleDateString("de-DE")}
        </div>
        {currentUserId === question.created_by && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600"
          >
            {deleting ? "..." : "Delete"}
          </button>
        )}
      </div>

      {/* Question */}
      <p className="text-gray-900 font-medium mb-3">{question.question_text}</p>

      {question.question_image_url && (
        <img
          src={question.question_image_url}
          alt="Question image"
          className="rounded-lg max-h-64 object-contain mb-3"
        />
      )}

      {/* Options */}
      <div className="space-y-2">
        {sortedOptions.map((opt: any, i: number) => {
          const letter = String.fromCharCode(65 + i); // A, B, C, D...
          const isCorrect = opt.is_correct;

          return (
            <div
              key={opt.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                showAnswer
                  ? isCorrect
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                  : "border-gray-200"
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                  showAnswer && isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {letter}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{opt.option_text}</p>
                {opt.option_image_url && (
                  <img
                    src={opt.option_image_url}
                    alt=""
                    className="rounded-lg max-h-32 object-contain mt-2"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle answer + explanation */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-sm text-brand-600 hover:underline"
        >
          {showAnswer ? "Hide answer" : "Show answer"}
        </button>
      </div>

      {showAnswer && question.explanation && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <span className="font-medium">Explanation:</span>{" "}
          {question.explanation}
        </div>
      )}
    </div>
  );
}
