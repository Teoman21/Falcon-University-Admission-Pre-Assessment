# 🦅 Falcon University — Admission Pre-Assessment System

An AI-powered web application that simulates an admission officer, guiding applicants through a chat-based eligibility check. Built with Next.js 14, LangChain, OpenAI GPT-4o-mini, and RAG.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Admin Login | Cookie-based session authentication |
| 📄 PDF Upload | Upload admission requirements PDF; parsed + embedded for RAG |
| 🤖 AI Interview | GPT-4o-mini conducts the eligibility interview |
| 🔍 RAG | LangChain retrieves relevant requirements from the PDF |
| 📊 Results Table | Live-updating table with all applicant results |
| 📜 Transcript Viewer | Side drawer shows full chat transcript per applicant |
| ✅ Eligibility Check | AI decides: "Meets Criteria" or "Criteria Not Met" |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone the repository
```bash
git clone https://github.com/rmyzm/falcon-university-admission
cd falcon-university-admission
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...your-key-here...
```

### 4. Run the development server
```bash
npm run dev
```

### 5. Open the app
Navigate to [http://localhost:3000](http://localhost:3000)

**Admin credentials:**
- Username: `admin`
- Password: `falcon2024`

---

## 📱 Usage Workflow

### Step 1: Admin Login
Go to `/admin/login` and sign in with the credentials above.

### Step 2: Upload Requirements PDF
On the dashboard, drag-and-drop or click to upload your admission requirements PDF. The system will parse and embed it for RAG.

### Step 3: Start Interview
Click **"Start Interview"** to open the student chat interface in a new tab. Share this link with applicants.

### Step 4: Student Interview
The AI greets the student and conducts the eligibility assessment. Upon completion, results are automatically saved.

### Step 5: View Results
Return to the dashboard — the results table auto-updates every 8 seconds. Click **"View Details"** to see the full transcript.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18 |
| **Styling** | Tailwind CSS with custom design system |
| **LLM** | OpenAI GPT-4o-mini via LangChain.js |
| **Embeddings** | OpenAI text-embedding-3-small |
| **RAG** | LangChain `MemoryVectorStore` + `RecursiveCharacterTextSplitter` |
| **PDF Parsing** | `pdf-parse` |
| **Database** | JSON file (demo) |
| **Auth** | HTTP-only cookie sessions |

---

## 🤖 LLM & Copilot Usage

### Where and How LLM Was Used

**1. GPT-4o-mini (OpenAI) — Core Interview Agent**
- Acts as the AI Admissions Officer conducting the interview
- Asks structured eligibility questions (name, program, GPA, test scores, coursework)
- Evaluates student data against retrieved requirements
- Returns a structured eligibility decision (Meets Criteria / Criteria Not Met)
- Outputs a hidden `<ELIGIBILITY_RESULT>` JSON block parsed server-side to save results

**2. text-embedding-3-small (OpenAI) — RAG Embeddings**
- Embeds PDF chunks when uploaded
- Generates query embeddings to retrieve relevant requirement sections
- Ensures the LLM always cites the actual PDF content, not hallucinated rules

**3. LangChain.js — Orchestration**
- `RecursiveCharacterTextSplitter`: Splits PDF text into 800-char chunks with 150-char overlap
- `MemoryVectorStore`: In-memory vector store for similarity search
- Retrieved context injected into system prompt for every conversation turn

**4. GitHub Copilot / AI Coding Assistance**
- Used for boilerplate generation (API route structure, TypeScript types)
- Helped debug LangChain import patterns for Next.js App Router compatibility
- Generated the glassmorphism CSS design system

---

## 💡 Product Thinking Questions

### Q1: What problem does this product solve?
University admissions teams receive thousands of applications and spend significant time on initial screening — checking whether applicants even meet basic criteria before investing in detailed review. This AI pre-assessment system automates that first-pass screening, saving admissions staff time and giving applicants instant, 24/7 feedback on their eligibility.

### Q2: Who is the target user?
- **Primary**: Admissions officers who want to automate first-pass eligibility screening
- **Secondary**: Prospective university applicants who want immediate feedback on whether they qualify
- **Tertiary**: University administrators who want data-driven insights on applicant pools

### Q3: How does RAG improve the system vs. a static prompt?
A static prompt hardcodes rules that become stale when requirements change each academic year. With RAG, the admin simply uploads a new PDF and the system immediately reflects the updated criteria — no code changes required. This also grounds the LLM's decisions in authoritative source documents, reducing hallucination risk.

### Q4: What would you add if you had more time?
1. **Email notifications** — notify applicants of results via SendGrid
2. **PostgreSQL** — replace JSON file with a proper database for production scale
3. **Multi-step verification** — ask for document uploads (transcripts, certificates)
4. **Analytics dashboard** — charts showing eligibility rates by program, GPA distributions
5. **Program matching** — if ineligible for one program, suggest alternatives they qualify for
6. **Multi-language support** — interview in the student's preferred language
7. **AWS deployment** — Elastic Beanstalk or ECS with RDS PostgreSQL
8. **Export to CSV** — allow admin to export results table

### Q5: What are the limitations of the current approach?
- **In-memory vector store**: Resets on server restart; a persistent vector DB (e.g., Pinecone, Chroma) is needed for production
- **Single PDF**: Only one knowledge base at a time; could support multiple programs/PDFs
- **No multi-tenancy**: Single admin account; needs user management for larger institutions
- **JSON database**: Not production-safe for concurrent writes

---

## 📁 Project Structure

```
├── app/
│   ├── admin/
│   │   ├── login/page.tsx      # Admin login UI
│   │   └── dashboard/page.tsx  # Dashboard: upload, stats, results table
│   ├── interview/page.tsx      # Student chat interface
│   ├── api/
│   │   ├── auth/route.ts       # Login/logout endpoints
│   │   ├── upload/route.ts     # PDF upload + RAG indexing
│   │   ├── chat/route.ts       # LLM conversation + eligibility check
│   │   ├── results/route.ts    # GET all applicant results
│   │   └── transcript/[id]/    # GET individual transcript
│   ├── globals.css             # Design system + animations
│   └── layout.tsx
├── lib/
│   ├── vectorStore.ts          # LangChain RAG setup
│   ├── db.ts                   # JSON database helpers
│   └── session.ts              # Cookie-based auth
├── data/
│   └── results.json            # Persisted applicant records
└── .env.local                  # OPENAI_API_KEY
```

---

## 🌐 Deployment

### Local (Development)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add `OPENAI_API_KEY` environment variable
4. Deploy!

> ⚠️ **Note**: The in-memory vector store resets on each serverless function cold start. For Vercel deployment, the PDF must be re-uploaded after each restart, or upgrade to a persistent vector DB.

---

## 📄 License
MIT — Built for Falcon University Admission Pre-Assessment Mock Project
