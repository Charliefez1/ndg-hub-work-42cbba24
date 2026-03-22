
CREATE POLICY "team_write_partners" ON public.partners FOR INSERT TO public WITH CHECK (is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_partners" ON public.partners FOR UPDATE TO public USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_partners" ON public.partners FOR DELETE TO public USING (is_admin_or_team(auth.uid()));
