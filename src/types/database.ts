// TypeScript types matching our Supabase schema

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  // joined fields
  creator?: Profile;
  topic_count?: number;
  question_count?: number;
}

export interface Topic {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  // joined
  creator?: Profile;
  question_count?: number;
  contributor_count?: number;
}

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  question_image_url: string | null;
  explanation: string | null;
  created_by: string;
  created_at: string;
  // joined
  creator?: Profile;
  options?: Option[];
  topic?: Topic;
  module?: Module;
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  option_image_url: string | null;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean;
  answered_at: string;
}
