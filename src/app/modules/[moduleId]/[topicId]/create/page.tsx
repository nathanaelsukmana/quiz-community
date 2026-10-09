"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface OptionDraft {
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
  isCorrect: boolean;
}

export default function CreateQuestionPage() {
  const { moduleId, topicId } = useParams<{
    moduleId: string;
    topicId: string;
  }>();
  const router = useRouter();
  const supabase = createClient();

  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<
    string | null
  >(null);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { text: "", imageFile: null, imagePreview: null, isCorrect: false },
    { text: "", imageFile: null, imagePreview: null, isCorrect: false },
    { text: "", imageFile: null, imagePreview: null, isCorrect: false },
    { text: "", imageFile: null, imagePreview: null, isCorrect: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasteText, setPasteText] = useState("");

  const questionImageRef = useRef<HTMLInputElement>(null);

  function handlePaste() {
    const text = pasteText.trim();
    if (!text) return;

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    // First line = question, strip leading number like "3. "
    const question = lines[0].replace(/^\d+[\.\)]\s*/, "");

    // Remaining lines = options, strip leading "* ", "- ", "a) ", "A. ", etc.
    const optionTexts = lines.slice(1).map((l) =>
      l.replace(/^[\*\-•]\s*/, "").replace(/^[a-zA-Z][\.\)]\s*/, "")
    );

    setQuestionText(question);
    setOptions(
      optionTexts.slice(0, 8).map((t) => ({
        text: t,
        imageFile: null,
        imagePreview: null,
        isCorrect: false,
      }))
    );
    setPasteText("");
  }

  function handleQuestionImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionImage(file);
    setQuestionImagePreview(URL.createObjectURL(file));
  }

  function updateOption(index: number, updates: Partial<OptionDraft>) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, ...updates } : opt))
    );
  }

  function handleOptionImage(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateOption(index, {
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    });
  }

  function addOption() {
    if (options.length >= 8) return;
    setOptions([
      ...options,
      { text: "", imageFile: null, imagePreview: null, isCorrect: false },
    ]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  async function uploadImage(file: File, folder: string): Promise<string> {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("question-images")
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("question-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate at least one correct answer
    if (!options.some((o) => o.isCorrect)) {
      setError("Select at least one correct answer!");
      return;
    }

    // Validate all options have text or image
    if (options.some((o) => !o.text.trim() && !o.imageFile)) {
      setError("Each option needs text or an image.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Upload question image if present
      let questionImageUrl: string | null = null;
      if (questionImage) {
        questionImageUrl = await uploadImage(questionImage, user.id);
      }

      // Create question
      const { data: question, error: qError } = await supabase
        .from("questions")
        .insert({
          topic_id: topicId,
          question_text: questionText,
          question_image_url: questionImageUrl,
          explanation: explanation || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (qError) throw qError;

      // Upload option images and create options
      const optionInserts = await Promise.all(
        options.map(async (opt, index) => {
          let optionImageUrl: string | null = null;
          if (opt.imageFile) {
            optionImageUrl = await uploadImage(opt.imageFile, user.id);
          }
          return {
            question_id: question.id,
            option_text: opt.text,
            option_image_url: optionImageUrl,
            is_correct: opt.isCorrect,
            sort_order: index,
          };
        })
      );

      const { error: oError } = await supabase
        .from("options")
        .insert(optionInserts);
      if (oError) throw oError;

      router.push(`/modules/${moduleId}/${topicId}`);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-sm text-neutral-500 mb-4">
        <Link href="/modules" className="hover:text-white transition-colors">
          Modules
        </Link>
        <span className="mx-2">→</span>
        <Link
          href={`/modules/${moduleId}`}
          className="hover:text-white transition-colors"
        >
          Module
        </Link>
        <span className="mx-2">→</span>
        <Link
          href={`/modules/${moduleId}/${topicId}`}
          className="hover:text-white transition-colors"
        >
          Topic
        </Link>
        <span className="mx-2">→</span>
        <span className="text-white font-medium">New Question</span>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-white">Create Question</h1>

      {/* Quick paste */}
      <div className="card p-4 mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-1">
          Quick Paste
          <span className="text-neutral-600 font-normal ml-2">
            paste a formatted question to auto-fill
          </span>
        </label>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          className="input-field min-h-[100px] text-sm font-mono"
          placeholder={"3. What is the capital of France?\n* London\n* Paris\n* Berlin\n* Madrid"}
        />
        {pasteText.trim() && (
          <button
            type="button"
            onClick={handlePaste}
            className="btn-primary text-sm mt-2"
          >
            Parse & Fill
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Question
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="input-field min-h-[80px]"
            placeholder="Type your question here..."
            required
          />
        </div>

        {/* Question image */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Question Image (optional)
          </label>
          <input
            ref={questionImageRef}
            type="file"
            accept="image/*"
            onChange={handleQuestionImage}
            className="hidden"
          />
          {questionImagePreview ? (
            <div className="relative inline-block">
              <img
                src={questionImagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setQuestionImage(null);
                  setQuestionImagePreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => questionImageRef.current?.click()}
              className="btn-secondary text-sm"
            >
              Add Image
            </button>
          )}
        </div>

        {/* Answer options */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Answer Options
            <span className="text-neutral-600 font-normal ml-2">
              (check correct answers — multiple allowed)
            </span>
          </label>

          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={index} className="card p-3">
                <div className="flex items-start gap-3">
                  {/* Correct checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={(e) =>
                        updateOption(index, { isCorrect: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-green-500 border-neutral-600 bg-neutral-800 focus:ring-green-500"
                    />
                    <span className="text-xs text-neutral-500">Correct</span>
                  </label>

                  <div className="flex-1 space-y-2">
                    {/* Option text */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        updateOption(index, { text: e.target.value })
                      }
                      className="input-field text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />

                    {/* Option image */}
                    {opt.imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={opt.imagePreview}
                          alt=""
                          className="max-h-24 rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateOption(index, {
                              imageFile: null,
                              imagePreview: null,
                            })
                          }
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="inline-block text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors">
                        + Add image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionImage(index, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Remove option */}
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-neutral-600 hover:text-red-400 mt-2 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-neutral-400 hover:text-white mt-2 transition-colors"
            >
              + Add another option
            </button>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Explanation (optional)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="input-field min-h-[60px]"
            placeholder="Explain why the correct answer is right..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create Question"}
          </button>
          <Link
            href={`/modules/${moduleId}/${topicId}`}
            className="btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
