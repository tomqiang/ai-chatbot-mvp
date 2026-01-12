import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Story generation prompt template
export function buildStoryPrompt(
  summary: string,
  userEvent: string,
  day: number,
  allowFinal: boolean
): string {
  const worldRules = `
世界设定：
- 类型：托尔金式高奇幻
- 语调：史诗、温暖、克制（无现代俚语，无喜剧）
- 主任务：寻找「月影宝石」
- 主题：陪伴、勇气、安静的选择

角色：
- 一二（女性）：沉静、深思、擅长魔法
- 布布（男性）：勇敢、保护性强、擅长近战
- 关系：他们是伴侣；情感通过行动展现，而非说明

规则：
- 故事永不重置
- ${allowFinal ? '可以写最终章节' : '主任务不能结束，除非用户明确要求最终章节'}
- 输出仅故事文本，500-900中文字符
- 将今日事件作为旅程中的小片段融入
- 保持角色个性和关系一致性
- 如有危险，描述清晰的物理动作
- 如安静，聚焦氛围和情感连续性
- 结尾要有微妙的钩子，为明天铺垫
`

  return `${worldRules}

故事至今的摘要（第${day}天）：
${summary}

今日事件：${userEvent}

请续写故事，输出仅故事文本（500-900中文字符），不要任何说明或注释。`
}

// Combined summary + title + suggestions update prompt
export function buildSummaryTitleAndSuggestionsPrompt(
  oldSummary: string,
  userEvent: string,
  storyText: string
): string {
  return `请根据以下信息，生成一个2-3句话的权威故事摘要、一个章节标题，以及5个明日事件建议：

之前摘要：${oldSummary}

今日事件：${userEvent}

今日故事：${storyText}

要求：
1. 摘要：2-3句话，涵盖整个故事至今的关键信息
2. 标题：6-14个中文字符，史诗、温暖、克制的风格，符合托尔金式高奇幻，不要标点符号，不要透露主任务结局
3. 建议：5个明日事件选项，每个选项一句话（中文），要求：
   - 与故事连续，符合当前情节发展
   - 不要透露主任务结局，不要引入过多新元素（最多1个新元素）
   - 语调：托尔金式高奇幻，温暖、克制，无现代俚语，无表情符号
   - 多样性要求（按顺序）：
     1) 安静/氛围类
     2) 关系/情感类
     3) 发现/伏笔类
     4) 行动/危险类（轻微，非高潮）
     5) 选择/困境类

请以JSON格式输出：
{
  "title": "章节标题",
  "summary": "更新后的摘要",
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

只输出JSON，不要其他内容。`
}

// Generate story text
export async function generateStory(
  summary: string,
  userEvent: string,
  day: number,
  allowFinal: boolean
): Promise<string> {
  const prompt = buildStoryPrompt(summary, userEvent, day, allowFinal)

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: '你是一位擅长写托尔金式高奇幻故事的作家。你的风格史诗、温暖、克制。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1200, // Allow more tokens for Chinese text
  })

  const storyText = completion.choices[0]?.message?.content?.trim()

  if (!storyText) {
    throw new Error('No story text generated')
  }

  return storyText
}

// Update story summary, generate title, and generate suggestions (combined call)
export async function updateSummaryTitleAndSuggestions(
  oldSummary: string,
  userEvent: string,
  storyText: string
): Promise<{ summary: string; title: string; suggestions: string[] }> {
  const prompt = buildSummaryTitleAndSuggestionsPrompt(oldSummary, userEvent, storyText)

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: '你负责生成简洁准确的故事摘要、章节标题和明日事件建议。请严格按照JSON格式输出。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.4, // Slightly higher for more creative suggestions
    max_tokens: 500, // Increased for suggestions
  })

  const responseText = completion.choices[0]?.message?.content?.trim()

  if (!responseText) {
    throw new Error('No response generated')
  }

  // Try to parse JSON response
  try {
    // Extract JSON from response (handle cases where model adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and clean title
      let title = parsed.title || ''
      title = title.trim()
      // Remove any trailing punctuation
      title = title.replace(/[。，、！？；：]$/g, '')
      
      // Validate title length (6-14 Chinese characters)
      const charCount = Array.from(title).length
      if (charCount < 6 || charCount > 14) {
        title = generateFallbackTitle(storyText)
      }
      
      const summary = parsed.summary?.trim() || ''
      
      if (!summary) {
        throw new Error('No summary in response')
      }
      
      // Validate and clean suggestions
      let suggestions = parsed.suggestions || []
      if (!Array.isArray(suggestions)) {
        suggestions = []
      }
      
      // Ensure exactly 5 suggestions, clean them
      suggestions = suggestions
        .slice(0, 5)
        .map((s: string) => String(s).trim())
        .filter((s: string) => s.length > 0)
      
      // If we don't have 5, generate fallback suggestions
      if (suggestions.length < 5) {
        const fallbackSuggestions = generateFallbackSuggestions(storyText)
        suggestions = [...suggestions, ...fallbackSuggestions].slice(0, 5)
      }
      
      return { summary, title, suggestions }
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error)
  }

  // Fallback: extract summary from text, generate title and suggestions
  const summary = responseText.split('\n').find(line => line.trim().length > 10) || responseText
  const title = generateFallbackTitle(storyText)
  const suggestions = generateFallbackSuggestions(storyText)
  
  return {
    summary: summary.trim(),
    title,
    suggestions
  }
}

// Generate fallback suggestions from story text
function generateFallbackSuggestions(storyText: string): string[] {
  const defaults = [
    '一二和布布继续他们的旅程',
    '他们遇到了一位神秘的旅行者',
    '一二发现了一个古老的魔法痕迹',
    '布布在战斗中保护了同伴',
    '他们面临一个重要的选择'
  ]
  
  // Try to extract meaningful phrases from the story
  const sentences = storyText.split(/[。！？\n]/).filter(s => s.trim().length > 5)
  
  if (sentences.length >= 2) {
    const suggestions: string[] = []
    
    // Try to create suggestions based on story content
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim()
      if (firstSentence.includes('一二') || firstSentence.includes('布布')) {
        suggestions.push(`${firstSentence.slice(0, 20)}...`)
      }
    }
    
    // Fill remaining with defaults
    while (suggestions.length < 5) {
      suggestions.push(defaults[suggestions.length % defaults.length])
    }
    
    return suggestions.slice(0, 5)
  }
  
  return defaults
}

// Legacy function for backward compatibility
export async function updateSummaryAndTitle(
  oldSummary: string,
  userEvent: string,
  storyText: string
): Promise<{ summary: string; title: string }> {
  const result = await updateSummaryTitleAndSuggestions(oldSummary, userEvent, storyText)
  return { summary: result.summary, title: result.title }
}

// Generate fallback title from story text
function generateFallbackTitle(storyText: string): string {
  // Try to extract a meaningful phrase from the first sentence
  const firstSentence = storyText.split(/[。！？\n]/)[0] || storyText.trim()
  
  if (!firstSentence) {
    return '无题'
  }
  
  // Remove common prefixes and get meaningful words
  const cleaned = firstSentence.replace(/^(一二|布布|他们|这时|此刻|突然|然后|接着)/, '').trim()
  const words = Array.from(cleaned)
  
  // Try to get 6-14 characters
  if (words.length >= 6) {
    const title = words.slice(0, Math.min(14, words.length)).join('')
    return title
  }
  
  // If too short, try to get more from the story
  const moreWords = Array.from(storyText.replace(/\s+/g, '')).slice(0, 12)
  if (moreWords.length >= 6) {
    return moreWords.join('')
  }
  
  return '无题'
}

// Generate summary up to a specific day (for rewrite)
export async function generateSummaryUpToDay(entries: Array<{ day: number; userEvent: string; storyText: string }>, upToDay: number): Promise<string> {
  if (upToDay === 0 || upToDay === 1) {
    return '一二与布布踏上寻找月影宝石的旅途，故事刚刚开始。'
  }

  // Get entries up to (upToDay - 1)
  const relevantEntries = entries
    .filter(e => e.day < upToDay)
    .sort((a, b) => a.day - b.day)

  if (relevantEntries.length === 0) {
    return '一二与布布踏上寻找月影宝石的旅途，故事刚刚开始。'
  }

  // Build summary input from entries
  const summaryInput = relevantEntries
    .map(e => `第${e.day}天：${e.userEvent}\n${e.storyText.slice(0, 300)}`) // Truncate long stories
    .join('\n\n')

  const prompt = `请根据以下故事章节，生成一个2-3句话的权威摘要，涵盖从第1天到第${upToDay - 1}天的所有关键信息：

${summaryInput}

请输出2-3句话的摘要，只输出摘要，不要其他内容。`

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: '你负责生成简洁准确的故事摘要。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200,
  })

  const summary = completion.choices[0]?.message?.content?.trim()

  if (!summary) {
    throw new Error('No summary generated')
  }

  return summary
}

// Legacy function for backward compatibility (if needed)
export async function updateSummary(
  oldSummary: string,
  userEvent: string,
  storyText: string
): Promise<string> {
  const result = await updateSummaryAndTitle(oldSummary, userEvent, storyText)
  return result.summary
}
