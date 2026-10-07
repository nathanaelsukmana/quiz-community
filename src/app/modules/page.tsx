"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import type { Module } from "@/types/database";

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchModules();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function fetchModules() {
    const { data } = await supabase
      .from("modules")
      .select(
        `
        id, name, description, created_by, created_at,
        creator:profiles!created_by(username, display_name)
      `
      )
      .order("name");
    if (data) setModules(data as any);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("modules").insert({
      name,
      description: description || null,
      created_by: user.id,
    });
    if (!error) {
      setName("");
      setDescription("");
      setShowCreate(false);
      fetchModules();
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modules</h1>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-sm"
          >
            + New Module
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-4 mb-6 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Module name (e.g. ARBKVS, Mathe 2)"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Short description (optional)"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm" disabled={loading}>
              {loading ? "Creating..." : "Create"}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((mod: any) => (
          <Link
            key={mod.id}
            href={`/modules/${mod.id}`}
            className="card p-5 hover:border-brand-300 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900">{mod.name}</h2>
            {mod.description && (
              <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              by {mod.creator?.display_name || "Unknown"}
            </p>
          </Link>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No modules yet. Create the first one!
        </div>
      )}
    </div>
  );
}
