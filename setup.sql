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

-- 6. Routes Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  route_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Lese- und Schreib-Rechte für die Routes Tabelle (RLS)
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- User können ihre eigenen Routen sehen
CREATE POLICY "Users can view own routes." ON public.routes FOR SELECT USING (auth.uid() = user_id);

-- Admins/Superadmins können alle Routen sehen
CREATE POLICY "Admins can view all routes." ON public.routes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- User können eigene Routen erstellen
CREATE POLICY "Users can insert own routes." ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User können eigene Routen aktualisieren
CREATE POLICY "Users can update own routes." ON public.routes FOR UPDATE USING (auth.uid() = user_id);

-- User können eigene Routen löschen
CREATE POLICY "Users can delete own routes." ON public.routes FOR DELETE USING (auth.uid() = user_id);

-- Admins/Superadmins können alle Routen löschen
CREATE POLICY "Admins can delete any route." ON public.routes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);
