import { supabase } from "@/integrations/supabase/client";

/**
 * Document service
 * - uploadDocument: uploads file to storage and inserts a documents row
 */

export async function uploadDocumentToStorage({
  file,
  patientId,
  uploadedBy
}: {
  file: File;
  patientId: string;
  uploadedBy?: string | null;
}) {
  // generate path: documents/{patientId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `documents/${patientId}/${timestamp}_${safeName}`;

  // upload
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  // insert metadata row
  const { data: docRow, error: insertError } = await supabase.from("documents").insert({
    patient_id: patientId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    uploaded_by: uploadedBy || null
  }).select("*").single();

  if (insertError) {
    // Attempt to remove uploaded object on failure (best effort)
    await supabase.storage.from("documents").remove([path]).catch(() => null);
    throw insertError;
  }

  return docRow;
}

export async function getDocumentPublicUrl(documentRow: { file_path: string }) {
  // documents bucket is private by design; generate a signed URL valid for short time
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(documentRow.file_path, 60);
  if (error) throw error;
  return data.signedUrl;
}
