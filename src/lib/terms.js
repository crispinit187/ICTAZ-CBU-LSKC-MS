import { configured, demoOpen, supabase } from "./supabase.js";

// The newest published version of a document, or null when the database is not set up.
export async function latestTerms(docType) {
  if (!configured || demoOpen) return null;
  const { data, error } = await supabase.rpc("latest_terms", {
    p_doc_type: docType,
  });
  if (error || !data || !data.length) return null;
  return data[0];
}
