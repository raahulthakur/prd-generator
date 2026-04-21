const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function generatePRD(problemStatement: string): Promise<string> {
  const response = await fetch(`${API_BASE}/generate-prd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem_statement: problemStatement }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { detail?: string }).detail ?? `Server error: ${response.status}`)
  }

  const data = await response.json() as { prd: string }
  return data.prd
}
