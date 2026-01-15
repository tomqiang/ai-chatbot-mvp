import OpenAI from 'openai'
import { z } from 'zod'
import { callLLMWithLog } from '../logging/llmLogger'
import { generateAnchoredSuggestions } from '../story/anchoredSuggestions'
import { getWorldById, type World } from '../lib/worlds'
import { detectSetPiece, type SetPieceDetection } from '../story/setPiece'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Chapter length constants (unified across all prompts and validation)
export const CHAPTER_MIN_CHARS = 700
export const CHAPTER_MAX_CHARS = 900

// Anchor key type (tightened to only 'A' | 'B' | 'C')
export type AnchorKey = 'A' | 'B' | 'C'

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
- 输出仅故事文本，${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符
- 将今日事件作为旅程中的小片段融入
- 保持角色个性和关系一致性
- 结尾要有微妙的钩子，为明天铺垫

动作密度要求（ACTION DENSITY）：
1) 每章必须包含至少3个不同的动作节拍（action beats）。
   - 动作节拍：可观察的物理动作或决策，改变当前情况。
   - 包括：移动、物体交互、战斗/保护、具体魔法效果、因果序列。
   - 不包括：内心想法、抽象情绪、通用风景描写。
2) 至少一个动作节拍必须涉及：
   - 一二使用魔法的具体、可视化方式（如：屏障、光、束缚、感知），
   或
   - 布布执行保护/战斗导向的动作（如：阻挡、掩护、清除威胁）。
3) 微弧要求（因果链）：
   - 情况 → 动作 → 反应 → 新情况。
   - 章节必须以改变的状态、新线索或新约束结束（不能是"什么都没发生"的结尾）。

反废话/低浪费（ANTI-FLUFF）：
4) 环境描写仅在以下情况允许：
   - 直接影响动作（能见度、立足点、声音、寒冷、隐藏、追踪），
   - 引入/更新具体锚点A（地点/物体），
   - 创建与锚点C相关的即时约束（受伤、魔法限制、时间压力）。
   否则压缩为一句短语或省略。
5) 连续不超过2句没有物理动作/决策/后果的句子。
6) 每个段落必须包含至少一个：
   - 物理动作、决策、后果或新线索。
   如果段落没有，删除或合并为一句。
7) 优先使用动词而非形容词：
   - 避免连续3+个描述性形容词。
   - 每个场景最多使用1-2个具体感官细节（如"碎石滑落"、"潮湿苔藓"），仅在影响动作时使用。
8) 仅通过动作展现情感：
   - 例如：挡在前面、握紧、转身、默默分享物资。
   - 不要明确标注情感（如"他很害怕/她很感动"）。
9) 保持精简：
   - 目标约500-900中文字符。
   - 不要用风景或抒情填充物来填充长度。

模型自编辑检查（在最终确定章节前）：
- 删除任何不改变情况的句子。
- 将任何环境描写压缩为一行，除非它直接影响动作或锚点。
- 确保章节包含>=3个动作节拍，并以具体变化/线索/约束结束。
`

  return `${worldRules}

故事至今的摘要（第${day}天）：
${summary}

今日事件：${userEvent}

请续写故事，输出仅故事文本（${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符），不要任何说明或注释。`
}

// Build enhanced world prompt snippet with optional boundary rules, action style, and entity policy
function buildWorldPromptSnippet(world: World): string {
  let snippet = world.promptSnippet

  // Append world boundary rules if present
  if (world.worldBoundaryRules) {
    snippet += `\n\n${world.worldBoundaryRules}`
  }

  // Append action style if present
  if (world.actionStyle) {
    snippet += `\n\n${world.actionStyle}`
  }

  // Append entity policy if present (rendered as natural-language rules)
  if (world.entityPolicy) {
    const policyRules: string[] = []
    
    if (world.entityPolicy.newNamedCharacters === 'forbidden') {
      policyRules.push('新命名角色：禁止引入，故事应围绕现有角色展开')
    } else if (world.entityPolicy.newNamedCharacters === 'limited') {
      policyRules.push('新命名角色：有限引入，不要一次引入多个，优先使用现有角色')
    } else if (world.entityPolicy.newNamedCharacters === 'allowed') {
      policyRules.push('新命名角色：允许引入，但应适度且符合故事需要')
    }

    if (world.entityPolicy.newNamedPlaces === 'forbidden') {
      policyRules.push('新命名地点：禁止引入，使用现有地点或通用描述（如"古老的石桥"、"森林深处"）')
    } else if (world.entityPolicy.newNamedPlaces === 'limited') {
      policyRules.push('新命名地点：有限引入，优先使用现有地点，新地点应服务于情节')
    } else if (world.entityPolicy.newNamedPlaces === 'allowed') {
      policyRules.push('新命名地点：允许引入，但应适度且符合故事需要')
    }

    if (policyRules.length > 0) {
      snippet += `\n\n实体引入规则：\n${policyRules.map(rule => `- ${rule}`).join('\n')}`
    }
  }

  return snippet
}

// Build prompt for merged chapter bundle generation
function buildChapterBundlePrompt(
  authoritativeSummary: string,
  todayUserEvent: string,
  latestChapterText?: string,
  allowFinal: boolean = false,
  worldPromptSnippet?: string,
  setPiece?: SetPieceDetection
): string {
  const latestChapterContext = latestChapterText 
    ? `\n上一章结尾（参考用，保持简短）：${latestChapterText.slice(-300)}`
    : ''

  // Use world-specific prompt snippet if provided, otherwise use default
  const worldSettings = worldPromptSnippet || `世界设定：
- 类型：托尔金式高奇幻
- 语调：史诗、温暖、克制（无现代俚语，无喜剧）
- 主任务：寻找「月影宝石」（主任务不能结束，除非用户明确要求最终章节）
- 主题：陪伴、勇气、安静的选择

角色：
- 一二（女性）：沉静、深思、擅长魔法
- 布布（男性）：勇敢、保护性强、擅长近战
- 关系：他们是伴侣；情感通过行动展现，而非说明`

  return `你是一位擅长写托尔金式高奇幻故事的作家。请根据以下信息，生成完整的章节内容、摘要、标题、锚点和明日建议。

${worldSettings}

权威故事摘要（长期记忆，2-3句话）：
${authoritativeSummary}

今日事件（用户输入的一句话）：
${todayUserEvent}${latestChapterContext}

动作密度要求（ACTION DENSITY）：
1) 每章必须包含至少3个不同的动作节拍（action beats）。
   - 动作节拍：可观察的物理动作或决策，改变当前情况。
   - 包括：移动、物体交互、战斗/保护、具体魔法效果、因果序列。
   - 不包括：内心想法、抽象情绪、通用风景描写。
2) 至少一个动作节拍必须涉及：
   - 一二使用魔法的具体、可视化方式（如：屏障、光、束缚、感知），
   或
   - 布布执行保护/战斗导向的动作（如：阻挡、掩护、清除威胁）。
3) 微弧要求（因果链）：
   - 情况 → 动作 → 反应 → 新情况。
   - 章节必须以改变的状态、新线索或新约束结束（不能是"什么都没发生"的结尾）。

多日大场面规则（MULTI-DAY SET PIECES）：
**当今日事件暗示重大冲突或大场面时，章节必须只描绘一个阶段，不得完全解决。**

重大冲突识别（服务器端检测结果）：
${setPiece ? `- set_piece.isMajor = ${setPiece.isMajor}
- set_piece.type = ${setPiece.type}
- 匹配的关键词：${setPiece.matched.join('、') || '无'}

**重要：模型必须严格遵守 set_piece.isMajor = ${setPiece.isMajor} 的约束。如果 isMajor = true，必须应用以下硬性结尾规则，即使模型自己的判断不同。**` : `- 服务器端检测未启用（使用模型判断）`}

重大冲突日的硬性结尾规则（仅在 set_piece.isMajor = true 时强制应用）：
1) **禁止完全解决**：
   - 不要击败/杀死/捕获主要敌人
   - 不要以平静的"收尾 + 展望明天上路"结束
2) **必须悬疑结尾**：
   章节必须以未解决的时刻结束，自然地延续到明天，例如：
   - 突然的反击 / 巨龙展现新能力
   - 地形崩塌 / 火势蔓延 / 能见度丧失
   - 武器损坏 / 盾牌开裂 / 魔法几乎耗尽
   - 被迫撤退到特定地点/物体（与锚点A关联）
   - 战斗中涌现新线索或约束（与锚点B/C关联）
3) **状态变化仍必须发生**：
   即使没有解决，章节必须以改变的情况结束：
   - 新伤、新约束、新战术位置、新线索、危险升级

重大冲突日的锚点要求：
- anchors.B **必须**捕捉未解决的核心（例如："巨龙未露面的第二次吐息/鳞片弱点尚未确认/它在守护某物"）
- anchors.C **必须**捕捉此阶段产生的具体限制（例如："一二魔力只够维持屏障一次/布布右臂麻木/地形逼迫他们退到石桥下"）
- tomorrow_suggestions **必须**包含至少2个直接延续同一大场面的选项（不要切换到旅行/平静场景）

非重大冲突日：
- 正常章节可以解决小冲突，但仍不得结束主任务。

反废话/低浪费（ANTI-FLUFF）：
4) 环境描写仅在以下情况允许：
   - 直接影响动作（能见度、立足点、声音、寒冷、隐藏、追踪），
   - 引入/更新具体锚点A（地点/物体），
   - 创建与锚点C相关的即时约束（受伤、魔法限制、时间压力）。
   否则压缩为一句短语或省略。
5) 连续不超过2句没有物理动作/决策/后果的句子。
6) 每个段落必须包含至少一个：
   - 物理动作、决策、后果或新线索。
   如果段落没有，删除或合并为一句。
7) 优先使用动词而非形容词：
   - 避免连续3+个描述性形容词。
   - 每个场景最多使用1-2个具体感官细节（如"碎石滑落"、"潮湿苔藓"），仅在影响动作时使用。
8) 仅通过动作展现情感：
   - 例如：挡在前面、握紧、转身、默默分享物资。
   - 不要明确标注情感（如"他很害怕/她很感动"）。
9) 章节长度要求（CRITICAL）：
   - **chapter字段必须达到${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符，这是硬性要求。**
   - 不要用风景或抒情填充物来填充长度，但必须通过足够的动作、对话和情节发展来达到长度要求。
   - 如果章节太短，模型输出将被视为不合格。

输出要求（按优先级）：
**CRITICAL：chapter字段必须达到${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符，这是最重要的输出。请确保章节有足够的长度、动作密度和情节发展。如果章节少于${CHAPTER_MIN_CHARS}字符，输出将被视为失败。**

1. event_keywords: 从"今日事件"中直接提取2-4个短短语（每个1-12个字符），必须是今日事件中的具体名词或动作，不要发明新词。
2. title: 6-16个中文字符，史诗、温暖、克制的风格，符合托尔金式高奇幻，不要标点符号，不要透露主任务结局。
   **重要约束：标题必须包含至少一个event_keywords中的关键词作为字面子串（完全匹配，区分大小写）。**
3. chapter: **这是最重要的输出字段，必须达到${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符。** 故事文本，动作密集，低废话，符合上述所有规则。请确保章节有足够的长度和内容深度，包含至少3个动作节拍和完整的情节发展。
4. next_story_state_summary: 2-3句话的权威摘要，涵盖整个故事至今的关键信息。
5. anchors:
   - A: 具体地点/物品（例如："古老的石桥"、"破损的地图"、"神秘的符文"）
   - B: 未解决的线索/伏笔（例如："远处传来的低语"、"地图上的标记"、"一二的担忧"）
   - C: 角色状态/限制（例如："布布的疲惫"、"魔法的消耗"、"食物的短缺"）
6. tomorrow_suggestions: 5个明日事件建议，每个必须：
   - 明确引用至少一个锚点（usesAnchors数组，值为["A"]、["B"]、["C"]、["A","B"]等）
   - 包含具体的动作动词
   - 不要透露主任务结局
   - 不要引入过多新元素（最多1个新元素）
   - 语调：托尔金式高奇幻，温暖、克制，无现代俚语，无表情符号
   - **如果今日事件是重大冲突，前3个建议必须直接延续同一大场面（使用锚点B和/或C），后2个可以是其他类型**
   - 非重大冲突日的多样性要求（按顺序）：
     1) 安静/氛围类（引用锚点A或B）
     2) 关系/情感类（引用锚点B或C）
     3) 发现/伏笔类（引用锚点A或B）
     4) 行动/危险类（引用锚点A或C）
     5) 选择/困境类（引用锚点B或C）

请严格按照以下JSON格式输出（只输出JSON，不要其他内容）：

{
  "event_keywords": ["关键词1", "关键词2", "关键词3"],
  "title": "章节标题（必须包含至少一个event_keywords中的关键词作为字面子串）",
  "chapter": "故事文本（**CRITICAL: 必须${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}中文字符，不能少于${CHAPTER_MIN_CHARS}字符**，动作密集，低废话，这是主要输出内容。请确保通过足够的动作、对话和情节发展来达到长度要求）",
  "next_story_state_summary": "2-3句话的权威摘要",
  "anchors": {
    "A": "具体地点/物品",
    "B": "未解决的线索/伏笔",
    "C": "角色状态/限制"
  },
  "tomorrow_suggestions": [
    { "text": "建议1", "usesAnchors": ["A"] },
    { "text": "建议2", "usesAnchors": ["B"] },
    { "text": "建议3", "usesAnchors": ["C"] },
    { "text": "建议4", "usesAnchors": ["A", "B"] },
    { "text": "建议5", "usesAnchors": ["A", "B", "C"] }
  ]
}`
}

// Zod schema for chapter bundle validation
const ChapterBundleSchema = z.object({
  event_keywords: z.array(z.string().min(1).max(12)).min(2).max(4),
  title: z.string().min(1),
  chapter: z.string().min(1),
  next_story_state_summary: z.string().min(1),
  anchors: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
  }),
  tomorrow_suggestions: z.array(
    z.object({
      text: z.string().min(1),
      usesAnchors: z.array(z.enum(['A', 'B', 'C'] as const)).min(1),
    })
  ).length(5),
})

export type ChapterBundle = z.infer<typeof ChapterBundleSchema>

// Generate fallback title from keyword
function generateFallbackTitleFromKeyword(kw0: string, anchorA?: string): string {
  // Template 1: `《${kw0}》`
  let fallbackTitle = `《${kw0}》`
  
  // Template 2: If anchorA exists and non-empty, try `《在${A}的${kw0}》`
  if (anchorA && anchorA.trim().length > 0) {
    const anchorTrimmed = anchorA.trim()
    const combined = `在${anchorTrimmed}的${kw0}`
    const charCount = Array.from(combined).length
    if (charCount <= 16) {
      fallbackTitle = `《${combined}》`
      return fallbackTitle
    }
  }
  
  // Template 3: `《${kw0}之日》`
  const template3 = `${kw0}之日`
  const charCount3 = Array.from(template3).length
  if (charCount3 <= 16) {
    fallbackTitle = `《${template3}》`
    return fallbackTitle
  }
  
  // If template 3 is also too long, use template 1
  return `《${kw0}》`
}

// Validate and fix title to include event keyword
function validateAndFixTitle(
  title: string,
  eventKeywords: string[],
  anchorA?: string
): { finalTitle: string; wasFallback: boolean } {
  const titleTrimmed = title.trim().replace(/[。，、！？；：]$/g, '')
  const charCount = Array.from(titleTrimmed).length
  
  // Check if title includes at least one keyword
  const includesKeyword = eventKeywords.some(kw => titleTrimmed.includes(kw.trim()))
  
  // Check length
  if (charCount >= 6 && charCount <= 16 && includesKeyword) {
    return { finalTitle: titleTrimmed, wasFallback: false }
  }
  
  // Use fallback
  const kw0 = eventKeywords[0]?.trim() || '事件'
  return { finalTitle: generateFallbackTitleFromKeyword(kw0, anchorA), wasFallback: true }
}

// Generate fallback suggestions from anchors (action-dense, low fluff)
function generateFallbackSuggestionsFromAnchors(anchors: { A: string; B: string; C: string }): Array<{ text: string; usesAnchors: AnchorKey[] }> {
  return [
    { text: `一二在${anchors.A}附近侦察，寻找隐藏的入口或标记`, usesAnchors: ['A'] },
    { text: `布布追踪${anchors.B}的线索，试图解开谜团`, usesAnchors: ['B'] },
    { text: `考虑到${anchors.C}，一二施法设下防护屏障`, usesAnchors: ['C'] },
    { text: `在${anchors.A}，他们发现与${anchors.B}相关的古老符文`, usesAnchors: ['A', 'B'] },
    { text: `面对${anchors.C}，布布在${anchors.A}附近清理障碍，一二尝试修复${anchors.B}`, usesAnchors: ['A', 'B', 'C'] },
  ]
}

// Validate and fix suggestions
function validateAndFixSuggestions(
  suggestions: Array<{ text: string; usesAnchors: string[] }>,
  anchors: { A: string; B: string; C: string }
): Array<{ text: string; usesAnchors: AnchorKey[] }> {
  // Validate each suggestion has non-empty usesAnchors and valid anchor references
  const validSuggestions = suggestions
    .filter(s => s.text.trim().length > 0 && 
                 Array.isArray(s.usesAnchors) && 
                 s.usesAnchors.length > 0 &&
                 s.usesAnchors.every(a => ['A', 'B', 'C'].includes(a)))
    .map(s => ({
      text: s.text.trim(),
      usesAnchors: s.usesAnchors.filter((a): a is AnchorKey => ['A', 'B', 'C'].includes(a))
    }))
    .slice(0, 5)
  
  // If we don't have 5 valid suggestions, generate fallbacks
  if (validSuggestions.length < 5) {
    const fallbacks = generateFallbackSuggestionsFromAnchors(anchors)
    return [...validSuggestions, ...fallbacks].slice(0, 5)
  }
  
  return validSuggestions.slice(0, 5)
}

// Compress summary to 2-3 sentences
function compressSummary(summary: string): string {
  const sentences = summary.split(/[。！？]/).filter(s => s.trim().length > 0)
  if (sentences.length <= 3) {
    return summary.trim()
  }
  // Take first 2-3 sentences
  return sentences.slice(0, 3).join('。') + '。'
}

// Generate complete chapter bundle in a single LLM call
export async function generateChapterBundle(
  authoritativeSummary: string,
  todayUserEvent: string,
  latestChapterText?: string,
  allowFinal: boolean = false,
  meta?: { day?: number; revision?: number; requestId?: string; storyId?: string; worldId?: string }
): Promise<{
  event_keywords: string[]
  title: string
  chapter: string
  next_story_state_summary: string
  anchors: { A: string; B: string; C: string }
  tomorrow_suggestions: Array<{ text: string; usesAnchors: AnchorKey[] }>
}> {
  // Get world prompt snippet if worldId provided
  let worldPromptSnippet: string | undefined
  if (meta?.worldId) {
    const world = getWorldById(meta.worldId)
    if (world) {
      // Build enhanced prompt snippet with optional world-specific rules
      worldPromptSnippet = buildWorldPromptSnippet(world)
    }
  }

  // Detect set piece (deterministic server-side)
  const setPiece = detectSetPiece(todayUserEvent)

  const prompt = buildChapterBundlePrompt(authoritativeSummary, todayUserEvent, latestChapterText, allowFinal, worldPromptSnippet, setPiece)

  return await callLLMWithLog(
    {
      op: 'chapter_bundle',
      route: '/api/chat',
      model,
      input: { authoritativeSummary, todayUserEvent, latestChapterText, allowFinal, prompt },
      meta: { ...meta },
    },
    async () => {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一位擅长写托尔金式高奇幻故事的作家。请严格按照JSON格式输出，不要添加任何说明或注释。**重要：chapter字段必须达到700-900中文字符，这是硬性要求。如果章节太短，输出将被视为不合格。**'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 3000, // Increased to ensure chapter has enough tokens (700-900 chars ≈ 1400-1800 tokens, plus other fields)
        response_format: { type: 'json_object' }, // Force JSON output
      })

      const responseText = completion.choices[0]?.message?.content?.trim()

      if (!responseText) {
        throw new Error('No response generated')
      }

      // Parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in response')
        }

        const parsed = JSON.parse(jsonMatch[0])
        
        // Validate with Zod
        const validationResult = ChapterBundleSchema.safeParse(parsed)
        
        if (!validationResult.success) {
          console.warn('[Chapter Bundle] Validation failed:', validationResult.error.errors)
          // Extract what we can and use fallbacks
          const eventKeywords = Array.isArray(parsed.event_keywords) && parsed.event_keywords.length >= 2
            ? parsed.event_keywords.slice(0, 4).map((kw: unknown) => String(kw).trim()).filter((kw: string) => kw.length > 0 && kw.length <= 12)
            : todayUserEvent.split(/[，。、]/).filter(p => p.trim().length > 0).slice(0, 4).map(p => p.trim().slice(0, 12))
          
          const anchors = parsed.anchors && typeof parsed.anchors === 'object'
            ? {
                A: String(parsed.anchors.A || '旅途中的发现').trim(),
                B: String(parsed.anchors.B || '未解的谜团').trim(),
                C: String(parsed.anchors.C || '角色的状态').trim(),
              }
            : { A: '旅途中的发现', B: '未解的谜团', C: '角色的状态' }
          
          const chapter = String(parsed.chapter || '').trim() || `一二和布布继续他们的旅程。${todayUserEvent}`
          const summary = compressSummary(String(parsed.next_story_state_summary || authoritativeSummary).trim())
          
          // Validate and fix title
          const titleValidation = validateAndFixTitle(
            String(parsed.title || '').trim(),
            eventKeywords.length >= 2 ? eventKeywords : [todayUserEvent.slice(0, 12)],
            anchors.A
          )
          
          // Validate and fix suggestions
          const suggestions = Array.isArray(parsed.tomorrow_suggestions)
            ? validateAndFixSuggestions(parsed.tomorrow_suggestions, anchors)
            : generateFallbackSuggestionsFromAnchors(anchors)
          
          return {
            event_keywords: eventKeywords.length >= 2 ? eventKeywords : [todayUserEvent.slice(0, 12)],
            title: titleValidation.finalTitle,
            chapter,
            next_story_state_summary: summary,
            anchors,
            tomorrow_suggestions: suggestions,
          }
        }

        // Validated data - apply server-side fixes
        const validated = validationResult.data
        
        // Validate chapter length
        const chapterText = validated.chapter.trim()
        const chapterCharCount = Array.from(chapterText.replace(/\s+/g, '')).length
        
        if (chapterCharCount < CHAPTER_MIN_CHARS) {
          console.warn(`[Chapter Bundle] Chapter too short: ${chapterCharCount} chars (target: ${CHAPTER_MIN_CHARS}-${CHAPTER_MAX_CHARS}), requestId=${meta?.requestId}, day=${meta?.day}`)
        }
        
        // Validate and fix title
        const titleValidation = validateAndFixTitle(
          validated.title,
          validated.event_keywords,
          validated.anchors.A
        )
        
        // Compress summary if needed
        const compressedSummary = compressSummary(validated.next_story_state_summary)
        
        // Validate and fix suggestions
        const fixedSuggestions = validateAndFixSuggestions(
          validated.tomorrow_suggestions,
          validated.anchors
        )
        
        // Log fallback if used
        if (titleValidation.wasFallback && meta?.requestId) {
          console.log(`[Title Fallback] requestId=${meta.requestId}, day=${meta.day}`)
        }

        return {
          event_keywords: validated.event_keywords,
          title: titleValidation.finalTitle,
          chapter: chapterText,
          next_story_state_summary: compressedSummary,
          anchors: validated.anchors,
          tomorrow_suggestions: fixedSuggestions,
        }
      } catch (error) {
        console.error('Error parsing chapter bundle JSON:', error)
        // Complete fallback
        const eventKeywords = todayUserEvent.split(/[，。、]/).filter(p => p.trim().length > 0).slice(0, 4).map(p => p.trim().slice(0, 12))
        const anchors = { A: '旅途中的发现', B: '未解的谜团', C: '角色的状态' }
        const titleValidation = validateAndFixTitle('', eventKeywords.length >= 2 ? eventKeywords : ['事件'], anchors.A)
        
        return {
          event_keywords: eventKeywords.length >= 2 ? eventKeywords : ['事件'],
          title: titleValidation.finalTitle,
          chapter: `一二和布布继续他们的旅程。${todayUserEvent}`,
          next_story_state_summary: authoritativeSummary,
          anchors,
          tomorrow_suggestions: generateFallbackSuggestionsFromAnchors(anchors),
        }
      }
    }
  )
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
2. 事件关键词提取（event_keywords）：从"今日事件"中直接提取2-4个短短语（每个1-12个字符），必须是今日事件中的具体名词或动作，不要发明新词。例如："一二在森林中发现了一处古老的遗迹" → ["森林", "发现", "古老遗迹"]
3. 标题：6-16个中文字符，史诗、温暖、克制的风格，符合托尔金式高奇幻，不要标点符号，不要透露主任务结局。
   **重要约束：标题必须包含至少一个event_keywords中的关键词作为字面子串（完全匹配，区分大小写）。**
   优先使用具体名词/动作，避免纯抽象标题（除非仍包含关键词子串）。
4. 建议：5个明日事件选项，每个选项一句话（中文），要求：
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
  "event_keywords": ["关键词1", "关键词2", "关键词3"],
  "title": "章节标题（必须包含至少一个event_keywords中的关键词作为字面子串）",
  "summary": "更新后的摘要",
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

只输出JSON，不要其他内容。`
}

// LEGACY: main flow should use generateChapterBundle() only.
// This function is kept for backward compatibility but should not be used in new code.
export async function generateStory(
  summary: string,
  userEvent: string,
  day: number,
  allowFinal: boolean,
  meta?: { requestId?: string }
): Promise<string> {
  const prompt = buildStoryPrompt(summary, userEvent, day, allowFinal)

  return await callLLMWithLog(
    {
      op: 'chapter',
      route: '/api/chat',
      model,
      input: { summary, userEvent, day, allowFinal, prompt },
      meta: { day, ...meta },
    },
    async () => {
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
  )
}

// LEGACY: main flow should use generateChapterBundle() only.
// This function is kept for backward compatibility but should not be used in new code.
export async function updateSummaryTitleAndSuggestions(
  oldSummary: string,
  userEvent: string,
  storyText: string,
  meta?: { day?: number; revision?: number; requestId?: string }
): Promise<{ summary: string; title: string; anchors?: { a: string; b: string; c: string }; suggestions: string[]; event_keywords?: string[] }> {
  const prompt = buildSummaryTitleAndSuggestionsPrompt(oldSummary, userEvent, storyText)

  return await callLLMWithLog(
    {
      op: 'metadata',
      route: '/api/chat',
      model,
      input: { oldSummary, userEvent, storyText, prompt },
      meta: { ...meta },
    },
    async () => {
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
          
          const summary = parsed.summary?.trim() || ''
          
          if (!summary) {
            throw new Error('No summary in response')
          }
          
          // Parse and validate event_keywords
          let eventKeywords: string[] = []
          if (Array.isArray(parsed.event_keywords)) {
            eventKeywords = parsed.event_keywords
              .map((kw: unknown) => String(kw).trim())
              .filter((kw: string) => kw.length > 0)
          }
          
          // If no event_keywords provided, try to extract from userEvent as fallback
          if (eventKeywords.length === 0) {
            // Simple extraction: split by common separators and take meaningful parts
            const parts = userEvent.split(/[，。、]/).filter(p => p.trim().length > 0)
            eventKeywords = parts.slice(0, 4).map(p => p.trim().slice(0, 12))
          }
          
          // LEGACY: generateAnchoredSuggestions() is only used in legacy updateSummaryTitleAndSuggestions()
          // Main flow should use generateChapterBundle() which includes anchors in the bundle.
          const anchored = await generateAnchoredSuggestions(
            summary,
            userEvent,
            storyText,
            meta
          )
          
          // Validate and clean title
          let title = parsed.title || ''
          title = title.trim()
          // Remove any trailing punctuation
          title = title.replace(/[。，、！？；：]$/g, '')
          
          // Validate title using single source of truth
          const titleValidation = validateAndFixTitle(
            title,
            eventKeywords.length >= 2 ? eventKeywords : [userEvent.slice(0, 12)],
            anchored.anchors?.a
          )
          
          const finalTitle = titleValidation.finalTitle
          
          // Log fallback if used
          if (titleValidation.wasFallback && meta?.requestId) {
            console.log(`[Title Fallback] requestId=${meta.requestId}, day=${meta.day}`)
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

          return { 
            summary, 
            title: finalTitle, 
            suggestions: anchored.suggestions, 
            anchors: anchored.anchors,
            event_keywords: eventKeywords.length >= 2 ? eventKeywords : undefined
          }
        }
      } catch (error) {
        console.error('Error parsing JSON response:', error)
      }

      // Fallback: extract summary from text, generate title and suggestions
      const summary = responseText.split('\n').find(line => line.trim().length > 10) || responseText
      
      // Generate anchored suggestions as fallback
      const anchored = await generateAnchoredSuggestions(
        summary.trim(),
        userEvent,
        storyText,
        meta
      )
      
      // Try to extract keywords from userEvent for fallback title
      const parts = userEvent.split(/[，。、]/).filter(p => p.trim().length > 0)
      const fallbackKeywords = parts.slice(0, 4).map(p => p.trim().slice(0, 12))
      const titleValidation = validateAndFixTitle(
        '',
        fallbackKeywords.length >= 1 ? fallbackKeywords : ['事件'],
        anchored.anchors?.a
      )
      
      return {
        summary: summary.trim(),
        title: titleValidation.finalTitle,
        anchors: anchored.anchors,
        suggestions: anchored.suggestions,
        event_keywords: fallbackKeywords.length >= 2 ? fallbackKeywords : undefined
      }
    }
  )
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

// REMOVED: ensureTitleAnchoredToEvent() - duplicate of validateAndFixTitle()
// All title validation now uses validateAndFixTitle() + generateFallbackTitleFromKeyword() as single source of truth.
// The removed function had identical logic to validateAndFixTitle() but with an extra selectedKeyword field.

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

  return await callLLMWithLog(
    {
      op: 'rewrite',
      route: '/api/rewrite-latest',
      model,
      input: { entries: entries.length, upToDay, prompt },
      meta: { day: upToDay },
    },
    async () => {
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
  )
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
