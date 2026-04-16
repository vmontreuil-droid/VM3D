-- ═══════════════════════════════════════════════════════════
-- RLS Policies voor klantenportaal
-- ═══════════════════════════════════════════════════════════

-- PROJECTS: Klant ziet eigen werven, admin ziet alles
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects"
  ON public.projects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PROFILES: Klant ziet eigen profiel, admin ziet alles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- OFFERTES: Klant ziet eigen offertes, admin ziet alles
ALTER TABLE public.offertes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own offertes" ON public.offertes;
CREATE POLICY "Users can view own offertes"
  ON public.offertes FOR SELECT
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all offertes" ON public.offertes;
CREATE POLICY "Admins can manage all offertes"
  ON public.offertes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- OFFERTE_LINES: Toegang via offerte
ALTER TABLE public.offerte_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own offerte lines" ON public.offerte_lines;
CREATE POLICY "Users can view own offerte lines"
  ON public.offerte_lines FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.offertes WHERE id = offerte_id AND customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all offerte lines" ON public.offerte_lines;
CREATE POLICY "Admins can manage all offerte lines"
  ON public.offerte_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- FACTUREN: Klant ziet eigen facturen, admin ziet alles
ALTER TABLE public.facturen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own facturen" ON public.facturen;
CREATE POLICY "Users can view own facturen"
  ON public.facturen FOR SELECT
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all facturen" ON public.facturen;
CREATE POLICY "Admins can manage all facturen"
  ON public.facturen FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- FACTUUR_LINES: Toegang via factuur
ALTER TABLE public.factuur_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own factuur lines" ON public.factuur_lines;
CREATE POLICY "Users can view own factuur lines"
  ON public.factuur_lines FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.facturen WHERE id = factuur_id AND customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all factuur lines" ON public.factuur_lines;
CREATE POLICY "Admins can manage all factuur lines"
  ON public.factuur_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- TICKETS: Klant ziet eigen tickets, admin ziet alles
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  USING (
    customer_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;
CREATE POLICY "Admins can manage all tickets"
  ON public.tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- TICKET_MESSAGES: Toegang via ticket
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages of own tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND (customer_id = auth.uid() OR created_by = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can post messages to own tickets" ON public.ticket_messages;
CREATE POLICY "Users can post messages to own tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can manage all ticket messages"
  ON public.ticket_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PROJECT_FILES: Klant ziet bestanden van eigen projecten
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project files" ON public.project_files;
CREATE POLICY "Users can view own project files"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can upload to own projects" ON public.project_files;
CREATE POLICY "Users can upload to own projects"
  ON public.project_files FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all project files" ON public.project_files;
CREATE POLICY "Admins can manage all project files"
  ON public.project_files FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PROJECT_TIMELINE: Klant ziet timeline van eigen projecten
ALTER TABLE public.project_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project timeline" ON public.project_timeline;
CREATE POLICY "Users can view own project timeline"
  ON public.project_timeline FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all project timeline" ON public.project_timeline;
CREATE POLICY "Admins can manage all project timeline"
  ON public.project_timeline FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
