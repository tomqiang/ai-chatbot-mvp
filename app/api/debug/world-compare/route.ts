import { NextRequest, NextResponse } from 'next/server'
import { generateChapterBundle } from '@/app/lib/openaiHelper'
import { getWorldById } from '@/app/lib/worlds'

// Action verb keywords (Chinese)
const ACTION_VERBS = [
  '冲', '退', '挡', '砍', '刺', '追', '潜', '躲', '攀', '翻', '抓', '封', '破', '解',
  '施法', '吟唱', '束缚', '感知', '侦察', '追踪', '修复', '破坏', '开锁', '躲避', '包扎', '护住', '拉住', '推开',
  '移动', '奔跑', '跳跃', '闪避', '攻击', '防御', '释放', '召唤', '治疗', '探索', '发现', '检查', '观察', '倾听'
]

// Academy keywords
const ACADEMY_KEYWORDS = [
  '教室', '走廊', '塔楼', '庭院', '地下', '图书馆', '禁区', '宵禁', '导师', '课', '作业', '社团', '徽章', '学院', '宿舍',
  '训练场', '禁书区', '实验室', '办公室', '礼堂', '食堂', '医务室'
]

// Wilderness/ruins keywords
const WILDERNESS_KEYWORDS = [
  '森林', '山', '荒野', '营火', '石桥', '遗迹', '古道', '洞穴', '溪', '雪', '苔藓', '符文门', '断崖',
  '废墟', '古堡', '神庙', '荒原', '沼泽', '峡谷', '瀑布', '古树'
]

// Extract action verbs from text
function extractActionVerbs(text: string): string[] {
  const found: string[] = []
  for (const verb of ACTION_VERBS) {
    if (text.includes(verb)) {
      found.push(verb)
    }
  }
  // Remove duplicates
  const unique: string[] = []
  for (const verb of found) {
    if (!unique.includes(verb)) {
      unique.push(verb)
    }
  }
  return unique
}

// Analyze pacing signals
function analyzePacing(text: string): {
  paragraphCount: number
  avgParagraphLengthChars: number
  actionParagraphRatio: number
  scenerySentenceRatio: number
} {
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
  const paragraphCount = paragraphs.length

  // Calculate average paragraph length
  const totalChars = paragraphs.reduce((sum, p) => sum + Array.from(p.trim()).length, 0)
  const avgParagraphLengthChars = paragraphCount > 0 ? Math.round(totalChars / paragraphCount) : 0

  // Count paragraphs with action verbs
  let actionParagraphCount = 0
  for (const para of paragraphs) {
    const verbs = extractActionVerbs(para)
    if (verbs.length > 0) {
      actionParagraphCount++
    }
  }
  const actionParagraphRatio = paragraphCount > 0 ? actionParagraphCount / paragraphCount : 0

  // Count scenery-only sentences (heuristic: sentences with no action verbs)
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0)
  let scenerySentenceCount = 0
  for (const sentence of sentences) {
    const verbs = extractActionVerbs(sentence)
    if (verbs.length === 0) {
      // Check if sentence contains scenery keywords
      const hasScenery = ACADEMY_KEYWORDS.some(kw => sentence.includes(kw)) ||
                        WILDERNESS_KEYWORDS.some(kw => sentence.includes(kw)) ||
                        sentence.match(/[\u4e00-\u9fa5]{2,}(的|中|上|下|里|外|前|后)/)
      if (hasScenery) {
        scenerySentenceCount++
      }
    }
  }
  const scenerySentenceRatio = sentences.length > 0 ? scenerySentenceCount / sentences.length : 0

  return {
    paragraphCount,
    avgParagraphLengthChars,
    actionParagraphRatio,
    scenerySentenceRatio,
  }
}

// Guess anchor category
function guessAnchorCategory(anchorA: string): 'academy' | 'wilderness' | 'unknown' {
  const a = anchorA.trim()
  
  if (ACADEMY_KEYWORDS.some(kw => a.includes(kw))) {
    return 'academy'
  }
  
  if (WILDERNESS_KEYWORDS.some(kw => a.includes(kw))) {
    return 'wilderness'
  }
  
  return 'unknown'
}

export async function POST(request: NextRequest) {
  // Only enable in development or with DEBUG_TOOLS flag
  const isDebugEnabled = process.env.DEBUG_TOOLS === 'true' || process.env.NODE_ENV === 'development'
  
  if (!isDebugEnabled) {
    return NextResponse.json(
      { error: 'Debug tools are disabled. Set DEBUG_TOOLS=true to enable.' },
      { status: 404 }
    )
  }

  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { today_user_event, authoritativeSummary, latestChapterText } = body

    // Validate required input
    if (!today_user_event || typeof today_user_event !== 'string') {
      return NextResponse.json(
        { error: 'today_user_event is required and must be a string' },
        { status: 400 }
      )
    }

    const userEvent = today_user_event.trim()
    if (userEvent.length === 0) {
      return NextResponse.json(
        { error: 'today_user_event cannot be empty' },
        { status: 400 }
      )
    }

    // Get default summaries if not provided
    const middleEarthWorld = getWorldById('middle_earth')
    const wizardSchoolWorld = getWorldById('wizard_school')

    if (!middleEarthWorld || !wizardSchoolWorld) {
      return NextResponse.json(
        { error: 'Required worlds not found' },
        { status: 500 }
      )
    }

    const summary = authoritativeSummary || middleEarthWorld.initialSummary

    // Generate request ID for logging
    const requestId = `debug-compare-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Generate chapter bundle for middle_earth
    const middleEarthBundle = await generateChapterBundle(
      summary,
      userEvent,
      latestChapterText,
      false, // allowFinal
      {
        worldId: 'middle_earth',
        requestId: `${requestId}-me`,
      }
    )

    // Generate chapter bundle for wizard_school
    const wizardSchoolBundle = await generateChapterBundle(
      summary,
      userEvent,
      latestChapterText,
      false, // allowFinal
      {
        worldId: 'wizard_school',
        requestId: `${requestId}-ws`,
      }
    )

    // Extract action verbs
    const meActionVerbs = extractActionVerbs(middleEarthBundle.chapter)
    const wsActionVerbs = extractActionVerbs(wizardSchoolBundle.chapter)

    // Analyze pacing
    const mePacing = analyzePacing(middleEarthBundle.chapter)
    const wsPacing = analyzePacing(wizardSchoolBundle.chapter)

    // Guess anchor categories
    const meAnchorCategory = guessAnchorCategory(middleEarthBundle.anchors.A)
    const wsAnchorCategory = guessAnchorCategory(wizardSchoolBundle.anchors.A)

    // Build comparison response
    return NextResponse.json({
      input: {
        today_user_event: userEvent,
        authoritativeSummary: summary,
        latestChapterText: latestChapterText || null,
      },
      outputs: {
        middle_earth: {
          title: middleEarthBundle.title,
          chapter: middleEarthBundle.chapter,
          anchors: middleEarthBundle.anchors,
          tomorrow_suggestions: middleEarthBundle.tomorrow_suggestions,
        },
        wizard_school: {
          title: wizardSchoolBundle.title,
          chapter: wizardSchoolBundle.chapter,
          anchors: wizardSchoolBundle.anchors,
          tomorrow_suggestions: wizardSchoolBundle.tomorrow_suggestions,
        },
      },
      comparison: {
        actionTypeSignals: {
          middle_earth: {
            extractedActionVerbs: meActionVerbs,
            actionVerbCount: meActionVerbs.length,
          },
          wizard_school: {
            extractedActionVerbs: wsActionVerbs,
            actionVerbCount: wsActionVerbs.length,
          },
        },
        pacingSignals: {
          middle_earth: mePacing,
          wizard_school: wsPacing,
        },
        anchorShape: {
          middle_earth: {
            A: middleEarthBundle.anchors.A,
            B: middleEarthBundle.anchors.B,
            C: middleEarthBundle.anchors.C,
            anchorCategoryGuess: meAnchorCategory,
          },
          wizard_school: {
            A: wizardSchoolBundle.anchors.A,
            B: wizardSchoolBundle.anchors.B,
            C: wizardSchoolBundle.anchors.C,
            anchorCategoryGuess: wsAnchorCategory,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error in world-compare endpoint:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
