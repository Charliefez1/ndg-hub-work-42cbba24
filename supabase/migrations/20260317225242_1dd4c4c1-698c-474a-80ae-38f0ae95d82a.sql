INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "team_upload_documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND public.is_admin_or_team(auth.uid()));

CREATE POLICY "team_read_documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND public.is_admin_or_team(auth.uid()));

CREATE POLICY "team_delete_documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND public.is_admin_or_team(auth.uid()));

CREATE POLICY "public_read_documents" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'documents');