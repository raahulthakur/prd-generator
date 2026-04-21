import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowUp, FileText, Loader2, Copy, Check, RotateCcw } from 'lucide-react'
import { generatePRD } from './api'
import { renderMarkdown } from './lib/markdown'

type Stage = 'input' | 'loading' | 'result'

export default function App() {
  const [stage, setStage] = useState<Stage>('input')
  const [problem, setProblem] = useState('')
  const [prdContent, setPrdContent] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (stage === 'input') textareaRef.current?.focus()
  }, [stage])

  const handleSubmit = async () => {
    if (!problem.trim() || stage === 'loading') return
    setStage('loading')
    setError('')
    try {
      const result = await generatePRD(problem.trim())
      setPrdContent(result)
      setStage('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStage('input')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prdContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setProblem('')
    setPrdContent('')
    setError('')
    setStage('input')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground tracking-tight">PRD Generator</span>
        </div>
        <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {stage !== 'result' ? (
          <div className="w-full max-w-2xl flex flex-col gap-6">
            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                What problem are you solving?
              </h1>
              <p className="text-muted-foreground text-sm">
                Describe your problem and get a structured one-pager PRD instantly.
              </p>
            </div>

            {/* Input area */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 transition-shadow">
              <Textarea
                ref={textareaRef}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Small business owners struggle to track inventory manually using spreadsheets, leading to stockouts and over-ordering that hurt their margins..."
                className="min-h-[140px] resize-none border-0 shadow-none focus-visible:ring-0 text-base leading-relaxed rounded-2xl pr-4 pb-14"
                disabled={stage === 'loading'}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {problem.trim() && stage !== 'loading' && (
                  <span className="text-xs text-muted-foreground">
                    ⌘↵ to submit
                  </span>
                )}
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={!problem.trim() || stage === 'loading'}
                  className="rounded-xl w-9 h-9 shrink-0"
                >
                  {stage === 'loading'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ArrowUp className="w-4 h-4" />
                  }
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {stage === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground animate-pulse">
                  Generating your PRD…
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Product Requirements Document</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  New PRD
                </Button>
              </div>
            </div>

            {/* Problem statement recap */}
            <Card className="px-4 py-3 bg-muted/40 border-muted">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Problem Statement</p>
              <p className="text-sm text-foreground leading-relaxed">{problem}</p>
            </Card>

            <Separator />

            {/* PRD content */}
            <Card className="p-6 md:p-8 shadow-sm">
              <div
                className="prd-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(prdContent) }}
              />
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 text-center">
        <p className="text-xs text-muted-foreground">Powered by Claude AI</p>
      </footer>
    </div>
  )
}
