
CREATE POLICY "learning_assets_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'learning-assets');

CREATE POLICY "learning_assets_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'learning-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "learning_assets_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'learning-assets' AND public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (bucket_id = 'learning-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "learning_assets_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'learning-assets' AND public.has_role(auth.uid(), 'super_admin'));
