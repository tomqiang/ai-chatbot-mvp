import OpenAI from 'openai'
import { callLLMWithLog } from '../logging/llmLogger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export interface AnchoredSuggestions {
  anchors: {
    a: string // specific place/object
    b: string // unresolved clue/foreshadowing
    c: string // character state/constraint
  }
  suggestions: string[] // 5 one-sentence events
}

// Extract last portion of story for better context
function getStoryTail(storyText: string, maxChars: number = 1200): string {
  if (storyText.length <= maxChars) {
    return storyText
  }
  // Get last 25-35% of story, but cap at maxChars
  const tailLength = Math.min(maxChars, Math.floor(storyText.length * 0.3))
  return storyText.slice(-tailLength)
}

// Build prompt for anchored suggestions
function buildAnchoredSuggestionsPrompt(
  summary: string,
  userEvent: string,
  storyTail: string
): string {
  return `请根据以下信息，提取3个锚点（anchors）并生成5个明日事件建议：

故事摘要：${summary}

今日事件：${userEvent}

今日故事结尾（最后部分）：${storyTail}

要求：

1. 锚点（必须提取3个，格式严格）：
   A: 具体地点/物品（例如："古老的石桥"、"破损的地图"、"神秘的符文"）
   B: 未解决的线索/伏笔（例如："远处传来的低语"、"地图上的标记"、"一二的担忧"）
   C: 角色状态/限制（例如："布布的疲惫"、"魔法的消耗"、"食物的短缺"）

2. 建议（必须5个，每个一句话，中文）：
   - 每个建议必须明确引用至少一个锚点（必须包含锚点中的关键词）
   - 每个建议必须包含具体的动作动词（发现/决定/躲避/尝试/修补/守夜/追踪/交涉等）
   - 不要透露主任务结局
   - 不要引入过多新元素（最多1个新元素）
   - 语调：托尔金式高奇幻，温暖、克制，无现代俚语，无表情符号
   - 多样性要求（按顺序）：
     1) 安静/氛围类（引用锚点A或B）
     2) 关系/情感类（引用锚点B或C）
     3) 发现/伏笔类（引用锚点A或B）
     4) 行动/危险类（引用锚点A或C）
     5) 选择/困境类（引用锚点B或C）

请严格按照以下格式输出（不要其他内容）：

ANCHORS:
A: [锚点A]
B: [锚点B]
C: [锚点C]

SUGGESTIONS:
1) [建议1]
2) [建议2]
3) [建议3]
4) [建议4]
5) [建议5]`
}

// Parse anchors and suggestions from response
function parseAnchoredSuggestions(responseText: string): AnchoredSuggestions | null {
  try {
    // Extract anchors
    const anchorAMatch = responseText.match(/A:\s*(.+?)(?:\n|$)/)
    const anchorBMatch = responseText.match(/B:\s*(.+?)(?:\n|$)/)
    const anchorCMatch = responseText.match(/C:\s*(.+?)(?:\n|$)/)

    // Extract suggestions (numbered 1-5)
    const suggestions: string[] = []
    for (let i = 1; i <= 5; i++) {
      const match = responseText.match(new RegExp(`${i}\\)\\s*(.+?)(?:\n|$)`))
      if (match) {
        suggestions.push(match[1].trim())
      }
    }

    // Validate we have all required data
    if (anchorAMatch && anchorBMatch && anchorCMatch && suggestions.length === 5) {
      return {
        anchors: {
          a: anchorAMatch[1].trim(),
          b: anchorBMatch[1].trim(),
          c: anchorCMatch[1].trim(),
        },
        suggestions: suggestions.map(s => s.trim()),
      }
    }
  } catch (error) {
    console.error('Error parsing anchored suggestions:', error)
  }

  return null
}

// Generate fallback anchors from story tail
function generateFallbackAnchors(storyTail: string): { a: string; b: string; c: string } {
  // Simple heuristic: extract nouns/phrases from last paragraph
  const sentences = storyTail.split(/[。！？\n]/).filter(s => s.trim().length > 0)
  const lastSentence = sentences[sentences.length - 1] || storyTail.slice(-100)

  // Try to extract meaningful phrases
  const nouns = lastSentence.match(/[一二布布]的[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]{2,6}(?:的|之)[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]{3,8}/g) || []

  return {
    a: nouns[0]?.slice(0, 12) || '旅途中的发现',
    b: nouns[1]?.slice(0, 12) || '未解的谜团',
    c: nouns[2]?.slice(0, 12) || '角色的状态',
  }
}

// Generate fallback suggestions
function generateFallbackSuggestions(): string[] {
  return [
    '一二和布布继续他们的旅程',
    '他们遇到了一位神秘的旅行者',
    '一二发现了一个古老的魔法痕迹',
    '布布在战斗中保护了同伴',
    '他们面临一个重要的选择',
  ]
}

// Generate anchored suggestions
export async function generateAnchoredSuggestions(
  summary: string,
  userEvent: string,
  storyText: string,
  meta?: { day?: number; requestId?: string }
): Promise<AnchoredSuggestions> {
  const storyTail = getStoryTail(storyText)
  const prompt = buildAnchoredSuggestionsPrompt(summary, userEvent, storyTail)

  try {
    const responseText = await callLLMWithLog(
      {
        op: 'metadata',
        route: '/api/chat',
        model,
        input: { summary, userEvent, storyTail, prompt },
        meta: { ...meta },
      },
      async () => {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: '你负责从故事中提取锚点并生成与锚点紧密相关的明日事件建议。请严格按照格式输出。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 600,
        })

        const text = completion.choices[0]?.message?.content?.trim()
        if (!text) {
          throw new Error('No response generated')
        }
        return text
      }
    )

    // Try to parse the response
    const parsed = parseAnchoredSuggestions(responseText)
    if (parsed) {
      return parsed
    }

    // Fallback if parsing fails
    console.warn('[Anchored Suggestions] Parsing failed, using fallbacks')
    return {
      anchors: generateFallbackAnchors(storyTail),
      suggestions: generateFallbackSuggestions(),
    }
  } catch (error) {
    console.error('[Anchored Suggestions] Error generating:', error)
    // Return fallbacks on error
    return {
      anchors: generateFallbackAnchors(storyText),
      suggestions: generateFallbackSuggestions(),
    }
  }
}
