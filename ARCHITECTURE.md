# iQuiz — Web Application Architecture

## 1. Astro + React Integration

Astro owns routing, layouts, and SSR. React powers only interactive islands.

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Routing/Pages | Astro | Page shells, data loading, static generation |
| Interactive widgets | React (client:load) | Quiz editor, quiz runner, file uploader |
| API | Astro endpoints (/api/*) | CRUD, auth, file upload, PDF generation |
| Database | Supabase (PostgreSQL + Auth + Storage) | Data persistence, auth, file hosting |
| Offline drafts | Dexie.js (IndexedDB) | Local quiz drafts when offline |

Flow: Astro page loads → passes SSR-fetched data as props → React island hydrates and handles mutations via fetch to /api/*.

---

## 2. Data Models

### User
```
id            UUID (PK, from Supabase Auth)
email         TEXT
display_name  TEXT
avatar_url    TEXT?
created_at    TIMESTAMPTZ
```

### Quiz
```
id              UUID (PK)
user_id         UUID (FK → users)
title           TEXT
description     TEXT?
cover_image_url TEXT?
is_published    BOOLEAN
tags            TEXT[]
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Question
```
id              UUID (PK)
quiz_id         UUID (FK → quizzes, CASCADE)
type            ENUM: single_choice | multiple_choice | true_false | fill_blank | short_answer
content         TEXT (Markdown + LaTeX)
order_index     INT
correct_answer  JSONB  — string for single, string[] for multiple
points          INT
explanation     TEXT?
created_at      TIMESTAMPTZ
```

### QuestionOption
```
id            UUID (PK)
question_id   UUID (FK → questions, CASCADE)
content       TEXT
is_correct    BOOLEAN
order_index   INT
```

### QuizAttempt
```
id            UUID (PK)
user_id       UUID (FK → users)
quiz_id       UUID (FK → quizzes)
score         INT?
total_points  INT
started_at    TIMESTAMPTZ
completed_at  TIMESTAMPTZ?
time_taken    INT  — seconds
```

### AttemptAnswer
```
id              UUID (PK)
attempt_id      UUID (FK → quiz_attempts, CASCADE)
question_id     UUID (FK → questions)
user_answer     JSONB  — string or string[]
is_correct      BOOLEAN?
points_awarded  INT?
```

### ReferenceMaterial
```
id          UUID (PK)
quiz_id     UUID (FK → quizzes, CASCADE)
file_name   TEXT
file_type   ENUM: pdf | image
file_url    TEXT  — Supabase Storage path
file_size   INT
created_at  TIMESTAMPTZ
```

---

## 3. Key React Components

### QuizEditor (client:load)
- Drag-and-drop question reordering (dnd-kit)
- Question type selector with type-specific sub-forms
- Option editor for choice questions
- Markdown/LaTeX content editing (react-markdown + katex)
- Reference material upload area
- Auto-save to IndexedDB; explicit save to server

### QuestionForm variants
- SingleChoiceEditor — radio options with correct-marking
- MultipleChoiceEditor — checkbox options with correct-marking
- TrueFalseEditor — two-option toggle
- FillBlankEditor — answer field with placeholder markers
- ShortAnswerEditor — text area with rubric notes

### QuizRunner (client:load)
- Progress bar and question navigator
- Timer (optional, configurable per quiz)
- Answer submission with confirmation
- Results screen with score breakdown and explanations
- Responsive layout for mobile

### ReferenceViewer
- PDF rendering via react-pdf
- Image gallery with zoom
- Toggle visibility during quiz-taking

### FileUploader
- Drag-and-drop zone
- File type/size validation (PDF, PNG, JPG; max 10MB)
- Upload progress indicator
- Preview after upload

### QuizHistory
- Attempt list with scores, dates, time taken
- Filter by quiz
- Detailed review of past attempts

### Dashboard
- Quiz cards grid (created quizzes)
- Recent attempts
- Stats summary (total quizzes, avg score, completion rate)

---

## 4. API Routes

### Auth (/api/auth/*)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account via Supabase |
| POST | /api/auth/login | Sign in via Supabase |
| POST | /api/auth/logout | Sign out |
| GET | /api/auth/me | Get current user profile |

### Quizzes (/api/quizzes/*)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/quizzes | List user's quizzes (paginated) |
| POST | /api/quizzes | Create quiz |
| GET | /api/quizzes/[id] | Get quiz with questions |
| PUT | /api/quizzes/[id] | Update quiz metadata |
| DELETE | /api/quizzes/[id] | Delete quiz |
| PUT | /api/quizzes/[id]/publish | Toggle published status |
| POST | /api/quizzes/[id]/duplicate | Clone a quiz |

### Questions (/api/quizzes/[id]/questions/*)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/quizzes/[id]/questions | Add question |
| PUT | /api/quizzes/[id]/questions/[qid] | Update question |
| DELETE | /api/quizzes/[id]/questions/[qid] | Remove question |
| PUT | /api/quizzes/[id]/questions/reorder | Batch reorder |

### Attempts (/api/attempts/*)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/attempts | Start quiz attempt |
| GET | /api/attempts/[id] | Get attempt with answers |
| PUT | /api/attempts/[id]/answer | Submit answer(s) |
| POST | /api/attempts/[id]/complete | Finish attempt, compute score |
| GET | /api/attempts/history | List past attempts (paginated) |

### Files (/api/files/*)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/files/upload | Upload reference material to Supabase Storage |
| DELETE | /api/files/[id] | Remove file |

### Export (/api/export/*)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/export/quiz/[id].pdf | Generate quiz PDF |
| GET | /api/export/attempts/[id].pdf | Generate attempt results PDF |

---

## 5. Storage Solution

### Primary: Supabase (free tier covers MVP)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Auth**: Built-in email/password + OAuth (Google, GitHub)
- **Storage**: For PDF/image reference materials (1GB free)
- **Realtime**: Optional — for live quiz collaboration later

### RLS Policies (key examples)
```sql
-- Users can only see their own quizzes
CREATE POLICY "quiz_owner" ON quizzes
  FOR ALL USING (auth.uid() = user_id);

-- Questions inherit quiz ownership
CREATE POLICY "question_via_quiz" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid())
  );

-- Published quizzes readable by anyone (for quiz-taking)
CREATE POLICY "published_readable" ON quizzes
  FOR SELECT USING (is_published = true);

-- Attempt answers readable by attempt owner
CREATE POLICY "attempt_answer_owner" ON attempt_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid())
  );
```

### Secondary: IndexedDB (Dexie.js)
- Draft quizzes auto-save locally
- Sync to server when online
- Prevents data loss on connection drops

---

## 6. Authentication

Use Supabase Auth client library (`@supabase/ssr` for Astro, `@supabase/supabase-js` for API routes).

### Flow
1. Astro middleware checks session cookie on every request
2. Unauthenticated users redirected to /auth/login for protected routes
3. Published quizzes accessible without auth (quiz-taking)
4. Quiz creation/editing/history requires auth
5. JWT token passed in Authorization header for API calls from React islands

### Account Features
- Email + password registration
- OAuth: Google, GitHub
- Password reset via email
- Profile update (display name, avatar)

---

## 7. PDF Export

### Quiz PDF (for printing/sharing)
- Use `@react-pdf/renderer` in an Astro API endpoint
- Generate server-side to avoid hydration issues
- Layout: Title, instructions, questions with options, answer sheet at end
- Support for LaTeX via pre-rendered images (KaTeX → SVG → embed)

### Attempt Results PDF
- Score summary, per-question breakdown
- User answers marked correct/incorrect
- Explanations included

### Implementation
```typescript
// /api/export/quiz/[id].pdf.ts
import { renderToStream } from '@react-pdf/renderer';
import { QuizPDF } from '../../components/pdf/QuizPDF';

export const GET: APIRoute = async ({ params, request }) => {
  const quiz = await fetchQuizWithQuestions(params.id);
  const stream = await renderToStream(<QuizPDF quiz={quiz} />);
  return new Response(stream, {
    headers: { 'Content-Type': 'application/pdf' }
  });
};
```

---

## 8. Project Structure

```
iquiz/
├── public/
│   ├── fonts/
│   └── images/
├── src/
│   ├── components/
│   │   ├── react/                  # React islands (client:load)
│   │   │   ├── QuizEditor.tsx
│   │   │   ├── QuizRunner.tsx
│   │   │   ├── QuestionForm/
│   │   │   │   ├── SingleChoice.tsx
│   │   │   │   ├── MultipleChoice.tsx
│   │   │   │   ├── TrueFalse.tsx
│   │   │   │   ├── FillBlank.tsx
│   │   │   │   └── ShortAnswer.tsx
│   │   │   ├── ReferenceViewer.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── QuizHistory.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── pdf/                    # PDF generation components
│   │   │   ├── QuizPDF.tsx
│   │   │   └── AttemptPDF.tsx
│   │   └── astro/                  # Astro-native components
│   │       ├── Header.astro
│   │       ├── Footer.astro
│   │       ├── QuizCard.astro
│   │       └── Layout.astro
│   ├── layouts/
│   │   ├── MainLayout.astro
│   │   └── AuthLayout.astro
│   ├── pages/
│   │   ├── index.astro             # Landing page
│   │   ├── dashboard.astro         # User dashboard
│   │   ├── quiz/
│   │   │   ├── create.astro        # New quiz
│   │   │   ├── [id].astro          # Quiz detail/edit
│   │   │   ├── [id]/
│   │   │   │   └── take.astro      # Take quiz
│   │   │   └── [id]/
│   │   │       └── results/
│   │   │           └── [attemptId].astro
│   │   ├── history.astro           # Quiz history
│   │   └── auth/
│   │       ├── login.astro
│   │       ├── register.astro
│   │       └── reset.astro
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   └── me.ts
│   │   ├── quizzes/
│   │   │   ├── index.ts            # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── index.ts        # GET one, PUT update, DELETE
│   │   │       ├── publish.ts
│   │   │       ├── duplicate.ts
│   │   │       └── questions/
│   │   │           ├── index.ts
│   │   │           ├── [qid].ts
│   │   │           └── reorder.ts
│   │   ├── attempts/
│   │   │   ├── index.ts
│   │   │   ├── [id]/
│   │   │   │   ├── index.ts
│   │   │   │   ├── answer.ts
│   │   │   │   └── complete.ts
│   │   │   └── history.ts
│   │   ├── files/
│   │   │   ├── upload.ts
│   │   │   └── [id].ts
│   │   └── export/
│   │       ├── quiz/[id].pdf.ts
│   │       └── attempts/[id].pdf.ts
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client setup
│   │   ├── supabase-server.ts      # Server-side client
│   │   ├── db.ts                   # Dexie.js IndexedDB schema
│   │   └── scoring.ts              # Auto-grading logic
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   └── styles/
│       └── global.css
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         # Schema migration
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── .env.local                      # SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## 9. MVP Implementation Order

| Phase | Scope | Est. Effort |
|-------|-------|-------------|
| 1 — Scaffold | Astro project, Supabase setup, auth pages | 1-2 days |
| 2 — Quiz CRUD | Create/edit/delete quizzes + questions | 3-4 days |
| 3 — Quiz Runner | Take quizzes, auto-grade, show results | 2-3 days |
| 4 — Dashboard + History | Attempt tracking, stats | 1-2 days |
| 5 — PDF Export | Quiz + results PDF generation | 1-2 days |
| 6 — Reference Materials | File upload/display | 1 day |
| 7 — Polish | Offline drafts, responsive, error handling | 2-3 days |

**Total MVP**: ~12-17 days

---

## 10. Key Dependencies

```json
{
  "dependencies": {
    "astro": "^5.x",
    "@astrojs/react": "^4.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.5.x",
    "dexie": "^4.x",
    "@react-pdf/renderer": "^4.x",
    "react-markdown": "^9.x",
    "remark-math": "^6.x",
    "rehype-katex": "^7.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^10.x"
  }
}
```
