
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch text NOT NULL,
  year int NOT NULL DEFAULT 3,
  cgpa numeric(3,2) NOT NULL DEFAULT 7.0,
  attendance_pct numeric(5,2) NOT NULL DEFAULT 85,
  backlogs int NOT NULL DEFAULT 0,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  faculty text NOT NULL,
  timetable_slot text NOT NULL,
  attendance_pct numeric(5,2) NOT NULL DEFAULT 85,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open courses" ON public.courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  open_roles text[] NOT NULL DEFAULT '{}',
  drive_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placements TO anon, authenticated;
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open placements" ON public.placements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text,
  capacity int NOT NULL DEFAULT 50,
  registered_students uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open events" ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO anon, authenticated;
GRANT ALL ON public.policies TO service_role;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open policies" ON public.policies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New session',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO anon, authenticated;
GRANT ALL ON public.chat_sessions TO service_role;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open chat_sessions" ON public.chat_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'assistant',
  agent text,
  content text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  proactive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open chat_messages" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  turn_id uuid,
  sender_agent text NOT NULL,
  receiver_agent text NOT NULL,
  intent text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_logs TO anon, authenticated;
GRANT ALL ON public.agent_logs TO service_role;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open agent_logs" ON public.agent_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pending_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  summary text NOT NULL,
  reason text,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_approvals TO anon, authenticated;
GRANT ALL ON public.pending_approvals TO service_role;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open pending_approvals" ON public.pending_approvals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.student_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_memory TO anon, authenticated;
GRANT ALL ON public.student_memory TO service_role;
ALTER TABLE public.student_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo open student_memory" ON public.student_memory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_approvals;

-- Seed
INSERT INTO public.students (id, name, branch, year, cgpa, attendance_pct, backlogs, email) VALUES
 ('11111111-1111-1111-1111-111111111111','Aarav Sharma','CSE',3,8.60,72.00,0,'aarav.sharma@campus.edu'),
 ('22222222-2222-2222-2222-222222222222','Priya Reddy','ECE',4,9.10,91.00,0,'priya.reddy@campus.edu'),
 ('33333333-3333-3333-3333-333333333333','Rahul Verma','MECH',3,6.40,80.00,2,'rahul.verma@campus.edu'),
 ('44444444-4444-4444-4444-444444444444','Sneha Iyer','CSE',2,7.90,88.00,1,'sneha.iyer@campus.edu');

INSERT INTO public.courses (name, faculty, timetable_slot, attendance_pct, student_id) VALUES
 ('Database Management Systems','Dr. Meera Krishnan','Mon/Wed 10:00-11:00',68.00,'11111111-1111-1111-1111-111111111111'),
 ('Operating Systems','Dr. S. Balaji','Tue/Thu 09:00-10:00',78.00,'11111111-1111-1111-1111-111111111111'),
 ('Machine Learning','Dr. Anita Rao','Mon/Fri 14:00-15:30',82.00,'11111111-1111-1111-1111-111111111111'),
 ('VLSI Design','Dr. K. Prasad','Tue/Thu 11:00-12:30',93.00,'22222222-2222-2222-2222-222222222222'),
 ('Thermodynamics','Dr. R. Nagarjuna','Wed/Fri 08:00-09:30',74.00,'33333333-3333-3333-3333-333333333333'),
 ('Data Structures','Dr. Meera Krishnan','Mon/Thu 15:00-16:30',89.00,'44444444-4444-4444-4444-444444444444');

INSERT INTO public.placements (company, eligibility_rules, open_roles, drive_date) VALUES
 ('Google', '{"min_cgpa": 8.0, "branches": ["CSE","ECE"], "max_backlogs": 0}', ARRAY['Software Engineer Intern','STEP Intern'], CURRENT_DATE + 14),
 ('Infosys', '{"min_cgpa": 6.0, "branches": ["CSE","ECE","MECH"], "max_backlogs": 2}', ARRAY['Systems Engineer'], CURRENT_DATE + 7),
 ('Qualcomm', '{"min_cgpa": 8.5, "branches": ["ECE"], "max_backlogs": 0}', ARRAY['Hardware Design Intern'], CURRENT_DATE + 21);

INSERT INTO public.events (title, description, date, location, capacity) VALUES
 ('Placement Preparation Workshop','Mock interviews and resume review with the placement cell.', now() + interval '1 day', 'Seminar Hall A', 60),
 ('AI/ML Bootcamp','Hands-on session on transformers and deployment.', now() + interval '3 days', 'Lab Block C', 40),
 ('Google Pre-Placement Talk','Overview of internship roles and hiring process.', now() + interval '6 days', 'Auditorium', 200),
 ('Hostel Council Meet','Monthly grievance and facilities discussion.', now() + interval '9 days', 'Hostel Common Room', 80);

INSERT INTO public.policies (title, content) VALUES
 ('Attendance Policy','§1 Every student must maintain a minimum of 75% attendance in each registered course. §2 Students falling below 75% are marked as detained and are not permitted to write the end-semester examination for that course. §3 Medical leave supported by a certificate from the campus health centre may be condoned up to 10% by the Head of Department. §4 Attendance is computed up to two weeks before the examination start date. §5 Repeated shortage across two semesters triggers a mandatory meeting with the faculty advisor.'),
 ('Examination Regulations','§1 Internal assessment contributes 40 marks and the end-semester examination contributes 60 marks. §2 A student must score at least 40% aggregate to pass a course. §3 Re-evaluation requests must be filed within 7 working days of result publication with a fee of INR 500 per paper. §4 Use of unfair means results in cancellation of that examination and a disciplinary hearing. §5 Supplementary examinations are conducted once per semester for backlog courses.'),
 ('Hostel Rules','§1 Hostel gates close at 22:00 on weekdays and 23:00 on weekends. §2 Overnight leave requires prior online approval from the warden with parent consent. §3 Electrical cooking appliances are prohibited in rooms. §4 Room changes are permitted only during the first two weeks of a semester. §5 Damage to hostel property is recovered from the caution deposit.'),
 ('Scholarship Guidelines','§1 Merit scholarships cover 25% tuition for students with CGPA of 9.0 and above with zero backlogs. §2 Merit-cum-means scholarships require CGPA of 7.5 and above and annual family income below INR 6 lakh. §3 Applications open in the first month of each academic year and close after 30 days. §4 Scholarship continuation requires maintaining 75% attendance. §5 A student may hold only one institute scholarship at a time.');

INSERT INTO public.student_memory (student_id, fact) VALUES
 ('11111111-1111-1111-1111-111111111111','Prefers replies in English with short bullet summaries.'),
 ('11111111-1111-1111-1111-111111111111','Targeting a product-based software internship this cycle.'),
 ('11111111-1111-1111-1111-111111111111','Asked twice about DBMS attendance shortage.'),
 ('22222222-2222-2222-2222-222222222222','Interested in core hardware roles over software roles.'),
 ('33333333-3333-3333-3333-333333333333','Needs backlog clearance guidance before placement season.'),
 ('44444444-4444-4444-4444-444444444444','Prefers Telugu explanations for policy questions.');
