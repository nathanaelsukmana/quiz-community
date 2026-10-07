"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [moduleId]);

  async function fetchData() {
    // Fetch module
    const { data: modData } = await supabase
      .from("modules")
      .select("*, creator:profiles!created_by(username, display_name)")
      .eq("id", moduleId)
      .single();
    setMod(modData);

    // Fetch topics with question counts
    const { data: topicsData } = await supabase
      .from("topics")
      .select(
        `
        id, name, description, created_at,
        creator:profiles!created_by(username, display_name),
        questions(id)
      `
      )
      .eq("module_id", moduleId)
      .order("created_at");
    setTopics(topicsData || []);
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("topics").insert({
      module_id: moduleId,
      name,
      description: description || null,
      created_by: user.id,
    });
    if (!error) {
      setName("");
      setDescription("");
      setShowCreate(false);
      fetchData();
    }
    setLoading(false);
  }

  if (!mod) {
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
        <span className="text-gray-900 font-medium">{mod.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{mod.name}</h1>
          {mod.description && (
            <p className="text-gray-500 mt-1">{mod.description}</p>
          )}
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-sm"
          >
            + New Topic
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateTopic} className="card p-4 mb-6 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Topic name (e.g. Vorlesung 1: Einführung)"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Description (optional)"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm" disabled={loading}>
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Topics list */}
      <div className="space-y-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/modules/${moduleId}/${topic.id}`}
            className="card p-4 flex items-center justify-between hover:border-brand-300 transition-colors block"
          >
            <div>
              <h3 className="font-medium text-gray-900">{topic.name}</h3>
              {topic.description && (
                <p className="text-sm text-gray-500">{topic.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                by {topic.creator?.display_name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-brand-600">
                {topic.questions?.length || 0}
              </span>
              <p className="text-xs text-gray-400">questions</p>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No topics yet. Add a Vorlesung or Thema to get started!
        </div>
      )}
    </div>
  );
}
