export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function getSurveyStatus(status: 'draft' | 'published' | 'closed'): { label: string; type: string } {
  const statusMap = {
    draft: { label: '草稿', type: 'info' },
    published: { label: '已发布', type: 'success' },
    closed: { label: '已结束', type: 'warning' }
  }
  return statusMap[status] || statusMap.draft
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

export function getTextFrequency(texts: string[], topN: number = 20): { word: string; count: number }[] {
  const wordCount: Record<string, number> = {}
  const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '个', '来', '对', '他', '她', '它', '们', '那', '些', '什么', '怎么', '为什么', '可以', '能', '这个', '那个', '但', '还是', '因为', '所以', '如果', '虽然', '然后', '或者'])

  texts.forEach(text => {
    if (!text) return
    const words = text.match(/[\u4e00-\u9fa5]+/g) || []
    words.forEach(word => {
      if (word.length >= 2 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })
  })

  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadFile(content: Blob, filename: string): void {
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
