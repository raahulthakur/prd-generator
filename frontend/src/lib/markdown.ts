/**
 * Minimal markdown renderer for PRD content.
 * Handles: headings, bold, italic, bullet lists, ordered lists, horizontal rules, paragraphs.
 */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false
  let listTag = ''

  const flushList = () => {
    if (inList) {
      html.push(`</${listTag}>`)
      inList = false
      listTag = ''
    }
  }

  const inline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line)) {
      flushList()
      html.push('<hr />')
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      html.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`)
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)/)
    if (ulMatch) {
      if (!inList || listTag !== 'ul') {
        flushList()
        html.push('<ul>')
        inList = true
        listTag = 'ul'
      }
      html.push(`<li>${inline(ulMatch[1])}</li>`)
      continue
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/)
    if (olMatch) {
      if (!inList || listTag !== 'ol') {
        flushList()
        html.push('<ol>')
        inList = true
        listTag = 'ol'
      }
      html.push(`<li>${inline(olMatch[1])}</li>`)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      flushList()
      continue
    }

    // Paragraph
    flushList()
    html.push(`<p>${inline(line)}</p>`)
  }

  flushList()
  return html.join('\n')
}
