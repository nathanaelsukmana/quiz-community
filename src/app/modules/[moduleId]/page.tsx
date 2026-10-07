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

  // Edit module state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [moduleId]);

  async function fetchData() {
    const { data: modData } = await supabase
      .from("modules")
      .select("*, creator:profiles!created_by(username, display_name)")
      .eq("id", moduleId)
      .single();
    setMod(modData);

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

  function startEditing() {
    setEditName(mod.name);
    setEditDescription(mod.description || "");
    setEditing(true);
  }

  async function handleEditModule(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    const { error } = await supabase
      .from("modules")
      .update({
        name: editName,
        description: editDescription || null,
      })
      .eq("id", moduleId);
    if (!error) {
      setEditing(false);
      fetchData();
    }
    setEditLoading(false);
  }

  if (!mod) {
    return (
      <div className="text-center py-12 text-neutral-500">Loading...</div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500 mb-4">
        <Link href="/modules" className="hover:text-white transition-colors">
          Modules
        </Link>
        <span className="mx-2">→</span>
        <span className="text-white font-medium">{mod.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          {editing ? (
            <form onSubmit={handleEditModule} className="space-y-3 max-w-md">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field text-lg font-bold"
                required
                autoFocus
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input-field text-sm"
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary text-sm"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{mod.name}</h1>
                {user && user.id === mod.created_by && (
                  <button
                    onClick={startEditing}
                    className="text-neutral-600 hover:text-white transition-colors text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>
              {mod.description && (
                <p className="text-neutral-500 mt-1">{mod.description}</p>
              )}
            </div>
          )}
        </div>
        {user && !editing && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-sm"
          >
            + New Topic
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateTopic}
          className="card p-4 mb-6 space-y-3"
        >
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
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={loading}
            >
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
            className="card p-4 flex items-center justify-between hover:border-neutral-600 transition-colors block"
          >
            <div>
              <h3 className="font-medium text-white">{topic.name}</h3>
              {topic.description && (
                <p className="text-sm text-neutral-500">{topic.description}</p>
              )}
              <p className="text-xs text-neutral-600 mt-1">
                by {topic.creator?.display_name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">
                {topic.questions?.length || 0}
              </span>
              <p className="text-xs text-neutral-600">questions</p>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="card p-8 text-center text-neutral-500">
          No topics yet. Add a Vorlesung or Thema to get started!
        </div>
      )}
    </div>
  );
}
