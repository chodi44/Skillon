
-- Helper to insert a confirmed user with password
DO $$
DECLARE
  v_uid uuid;
  v_users jsonb := '[
    {"email":"praveenadmin@chodi.com","password":"Chodi@765","name":"Praveen (Admin)"},
    {"email":"24a31a43e2@skillon.local","password":"ishana","name":"Ishana"},
    {"email":"24a31a43e3@skillon.local","password":"hasini","name":"Hasini"},
    {"email":"24a31a43d7@skillon.local","password":"kruthika","name":"Kruthika"},
    {"email":"24a31a43f0@skillon.local","password":"bhuvana","name":"Bhuvana"},
    {"email":"24a31a43g8@skillon.local","password":"praveen","name":"Praveen"},
    {"email":"24a31a43h3@skillon.local","password":"mourya","name":"Mourya"},
    {"email":"24a31a43h7@skillon.local","password":"masthan","name":"Masthan"},
    {"email":"24a31a43i3@skillon.local","password":"ganeshneeli","name":"Ganesh Neeli"},
    {"email":"24a31a43i6@skillon.local","password":"Rahul","name":"Rahul"}
  ]'::jsonb;
  v_user jsonb;
BEGIN
  FOR v_user IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_user->>'email') THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_uid, 'authenticated', 'authenticated',
        v_user->>'email',
        crypt(v_user->>'password', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_user->>'name'),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_user->>'email'),
        'email', v_uid::text, now(), now(), now());
    END IF;
  END LOOP;
END $$;
