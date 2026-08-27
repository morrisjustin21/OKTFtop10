import * as pdfjsLib from 'pdfjs-dist'

// Load the matching worker from a CDN by version, rather than trying to
// bundle it — this sidesteps Vite/worker path issues entirely.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

// Returns an array of text lines across the whole document, reconstructed
// from pdf.js's positioned text items (which don't come pre-grouped into
// lines). Items with the same rounded vertical position are treated as
// one line and sorted left-to-right.
export async function extractTextLines(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const lines = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    const rows = new Map()
    for (const item of content.items) {
      const y = Math.round(item.transform[5])
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push(item)
    }

    // pdf.js y-coordinates increase upward, so sort descending for
    // top-to-bottom reading order.
    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a)
    for (const y of sortedYs) {
      const items = rows.get(y).sort((a, b) => a.transform[4] - b.transform[4])
      const line = items
        .map((i) => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) lines.push(line)
    }
  }

  return lines
}
