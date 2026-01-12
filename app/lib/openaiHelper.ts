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

// Summary update prompt
export function buildSummaryPrompt(
  oldSummary: string,
  userEvent: string,
  storyText: string
): string {
  return `请根据以下信息，生成一个2-3句话的权威故事摘要：

之前摘要：${oldSummary}

今日事件：${userEvent}

今日故事：${storyText}

请输出更新后的2-3句话摘要，涵盖整个故事至今的关键信息。只输出摘要，不要其他内容。`
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

// Update story summary
export async function updateSummary(
  oldSummary: string,
  userEvent: string,
  storyText: string
): Promise<string> {
  const prompt = buildSummaryPrompt(oldSummary, userEvent, storyText)

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
    temperature: 0.3, // Lower temperature for more consistent summaries
    max_tokens: 200,
  })

  const newSummary = completion.choices[0]?.message?.content?.trim()

  if (!newSummary) {
    throw new Error('No summary generated')
  }

  return newSummary
}
