-- 1. Profile Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Bestehende Nutzer in Profiles übernehmen (falls es schon welche gibt)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 
  CASE WHEN email = 'christophe.schneider86@googlemail.com' THEN 'superadmin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Trigger-Funktion: Neuen Nutzer automatisch in Profiles eintragen
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email = 'christophe.schneider86@googlemail.com' THEN 'superadmin' ELSE 'user' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

-- 4. Trigger an auth.users anhängen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Lese-Rechte für alle in der profiles Tabelle (wichtig für die App)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admins/Superadmins können Profile ändern:
CREATE POLICY "Superadmins can update all profiles." ON public.profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
  )
);
