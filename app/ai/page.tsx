'use client'

export default function AiTestPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">AI Microservice</h1>

      <p className="mb-4 text-gray-700 dark:text-gray-300">
  The AI functionality for this project is provided by a separate FastAPI microservice located in the project&apos;s `ai/` folder.
  The Next.js app no longer contains the previous in-app server action. To run the AI service locally:
      </p>

      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded">{
`cd ai
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
      }</pre>

      <p className="mt-4 text-gray-700 dark:text-gray-300">Set the backend environment variables first, then point the frontend at the service using <code>AI_SERVICE_URL</code> and the shared server token.</p>
    </div>
  );
}