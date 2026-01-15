// World registry for story creation
export interface WorldSettings {
  genre: string
  tone: string[]
  coreLoop: string
  actionStyle: string[]
  boundaryRules: string[]
  entityPolicy: {
    newNamedCharacters: 'forbidden' | 'limited' | 'allowed'
    newNamedPlaces: 'forbidden' | 'limited' | 'allowed'
  }
  longArc: string
  setPiece: string[]
}

export interface WorldExamples {
  todayUserEvent: string
  expectedEmphasis: string[]
  anchorShapeHint?: {
    A: string
    B: string
    C: string
  }
}

export interface World {
  id: string
  displayName: string
  description: string
  initialSummary: string
  promptSnippet: string // Additional prompt context injected into chapter generation
  settings: WorldSettings
  examples: WorldExamples
  // Optional helpers for existing logic
  actionStyle?: string
  worldBoundaryRules?: string
  entityPolicy?: {
    newNamedCharacters: 'forbidden' | 'limited' | 'allowed'
    newNamedPlaces: 'forbidden' | 'limited' | 'allowed'
  }
}

export const WORLDS: World[] = [
  {
    id: 'middle_earth',
    displayName: '中土世界 (Middle Earth)',
    description: '托尔金式高奇幻世界，寻找「月影宝石」的史诗旅程',
    initialSummary: '一二和布布是一对伴侣，他们踏上了寻找「月影宝石」的旅程。一二擅长魔法，性格沉静；布布勇敢坚强，擅长近战。他们相互扶持，在奇幻世界中前行。',
    promptSnippet: `世界设定：
- 类型：托尔金式高奇幻
- 语调：史诗、温暖、克制（无现代俚语，无喜剧）
- 主任务：寻找「月影宝石」
- 主题：陪伴、勇气、安静的选择

角色：
- 一二（女性）：沉静、深思、擅长魔法
- 布布（男性）：勇敢、保护性强、擅长近战
- 关系：他们是伴侣；情感通过行动展现，而非说明`,
    worldBoundaryRules: `叙事边界规则：
- 重点：长途旅行、荒野探索、古老遗迹、跨地域的旅程
- 避免：频繁引入新的命名角色和地点
- 场景应围绕：荒野、森林、山脉、废墟、古道、河流、洞穴
- 故事推进通过：旅程中的遭遇、环境挑战、古老线索、资源限制`,
    actionStyle: `动作风格：
- 优先动作类型：旅行、战斗、生存、保护、资源管理、地形导航
- 动作应体现：长途跋涉的疲惫、野外生存的智慧、战斗中的配合、对环境的适应
- 避免：室内场景过多、静态对话、重复性日常活动`,
    entityPolicy: {
      newNamedCharacters: 'forbidden',
      newNamedPlaces: 'forbidden',
    },
    settings: {
      genre: '托尔金式高奇幻',
      tone: ['史诗', '温暖', '克制'],
      coreLoop: '旅途选择 → 遇险解决 → 追寻线索',
      actionStyle: [
        '侦察与绕行',
        '自然生存与资源调整',
        '保护伴侣与突破地形限制',
      ],
      boundaryRules: [
        '聚焦旅途与古老遗迹',
        '避免频繁引入新命名角色/地点',
        '场景限定在荒野、森林、山脉、废墟',
      ],
      entityPolicy: {
        newNamedCharacters: 'forbidden',
        newNamedPlaces: 'forbidden',
      },
      longArc: '逐日递进的线索披露与资源耗散，保持旅途节奏',
      setPiece: [
        '第一天：发现异常遗迹或符文',
        '后续：探查机关/古碑 → 遭遇危机 → 新限制/线索',
      ],
    },
    examples: {
      todayUserEvent:
        '他们在夜里发现一个被封锁的入口，入口另一侧传来断断续续的异常信号。',
      expectedEmphasis: [
        '行动偏向侦察、绕行、触碰遗迹机关与野外应对',
        '异常会被解释为符文、低语或古老回响，而非科技信号',
        '结尾更可能落在‘遗迹入口/符号线索/地形限制’的钩子上',
        '锚点A多为遗迹/石门/古道；B多为符文与传说线索；C多为体力/魔力/夜色限制',
      ],
      anchorShapeHint: {
        A: '古老的石门或遗迹入口',
        B: '断续低语般的符文回响',
        C: '夜色与魔力消耗带来的限制',
      },
    },
  },
  {
    id: 'wizard_school',
    displayName: '魔法学院 (Wizard School)',
    description: '魔法学院背景，探索古老魔法与学院秘密',
    initialSummary: '一二和布布是魔法学院的学生，他们发现了学院中隐藏的秘密。一二擅长理论魔法，性格冷静；布布擅长实战魔法，保护欲强。他们一起探索学院的奥秘。',
    promptSnippet: `世界设定：
- 类型：魔法学院奇幻（学院内部与其相关区域）
- 语调：神秘、克制、紧张而温暖（无现代俚语，无喜剧）
- 世界重心：学习、规则、隐藏的危险、未被理解的魔法
- 核心驱动力：事件的连锁反应，而非远征或战争
- 主线方向：探索学院中逐渐浮现的秘密（不得快速揭示或一次性解决）

角色：
- 一二（女性）：冷静、理性，擅长精细与感知型魔法，习惯先观察再行动
- 布布（男性）：勇敢、反应迅速，偏向防护、对抗与实用魔法，常在关键时刻挡在前方
- 关系：他们是伴侣；信任与情感通过行动、站位与选择体现，而非直接说明

世界边界规则（非常重要）：
- 故事主要发生在学院及其附属空间（教室、走廊、塔楼、庭院、地下、受限区域）
- 避免长途旅行、野外漂泊、远征式叙事
- 冲突规模以"事件级"为主，而非战争或大规模战斗
- 危险往往源自规则失效、魔法失控、禁忌知识或被忽视的细节

行动定义（ACTION STYLE）：
- 行动不等同于战斗
- 有效行动包括（但不限于）：
  - 具体施法（防护、感知、束缚、破解、稳定）
  - 决斗或对抗（短暂、高风险、受规则限制）
  - 潜行、追踪、调查、偷听、破坏或修复魔法结构
  - 因违反或遵守规则而产生的直接后果
- 每个章节的行动必须改变局势（信息、限制、风险或选择）

实体引入规则：
- 新命名角色：有限引入（如同学或导师），一次最多1人，避免快速堆叠
- 新命名地点：有限引入（如特定教室、区域），必须与当前事件直接相关
- 不要快速扩展世界规模；保持学院作为叙事中心

多日事件（SET PIECE）指导：
- 学院中的重大事件（如魔法事故、禁区触发、失控实验、持续对抗）通常需要多日推进
- 这些事件必须分阶段展开：
  - 第一天：异常或风险显现
  - 后续：尝试应对 → 代价 → 新限制
- 不要在单一章节内"解决一切"
- 每一日必须留下未解状态，推动下一天继续

写作基调约束：
- 氛围来自具体行动与后果，而非长段环境描写
- 情感通过行动体现：挡在前方、低声提醒、默契分工、共同承担后果
- 保持节制、紧凑与连续性`,
    worldBoundaryRules: `叙事边界规则：
- 重点：学院内部场景（教室、走廊、塔楼、图书馆、禁地、训练场）
- 避免：长途旅行、跨地域的史诗旅程、频繁离开学院
- 场景应围绕：学院建筑、魔法设施、秘密通道、古老教室、禁书区
- 故事推进通过：学院事件、规则冲突、秘密发现、魔法事故、决斗、调查`,
    actionStyle: `动作风格：
- 优先动作类型：施法、决斗、调查、意外事件、规则违反、潜行、解谜
- 动作应体现：魔法的具体效果、学院生活的节奏、秘密探索的紧张、学术与实战的平衡
- 避免：长时间旅行、野外生存、大规模战斗、远离学院的场景`,
    entityPolicy: {
      newNamedCharacters: 'limited',
      newNamedPlaces: 'limited',
    },
    settings: {
      genre: '魔法学院奇幻',
      tone: ['神秘', '克制', '紧张'],
      coreLoop: '情报收集 → 规则试探 → 即刻应对',
      actionStyle: [
        '潜行与调查',
        '施法/破解封印',
        '短促对抗与规则压力',
      ],
      boundaryRules: [
        '限制在学院及附属空间',
        '避免远征/野外旅程',
        '冲突以事件级为主',
      ],
      entityPolicy: {
        newNamedCharacters: 'limited',
        newNamedPlaces: 'limited',
      },
      longArc: '多日事件分阶段展开（异常显现 → 应对 → 新限制）',
      setPiece: [
        '第一天：异常或禁区波动被察觉',
        '后续：暗中调查 → 触发对抗/封印升级 → 新规限制',
      ],
    },
    examples: {
      todayUserEvent:
        '他们在夜里发现一个被封锁的入口，入口另一侧传来断断续续的异常信号。',
      expectedEmphasis: [
        '行动偏向潜行、调查、破解封印、短促对抗与规则压力',
        '异常会被解释为禁区警报、封印波动或被隐藏的记录',
        '结尾更可能落在‘宵禁/被发现风险/封印升级’的钩子上',
        '锚点A多为走廊/禁区门；B多为规则与秘密线索；C多为宵禁与施法代价',
      ],
      anchorShapeHint: {
        A: '禁区走廊尽头的封锁门',
        B: '封印波动与被删改的记录',
        C: '宵禁与被发现的风险',
      },
    },
  },
  {
    id: 'future_city',
    displayName: '未来城市 (Future City)',
    description: '高密度未来城市，系统、权限与异常信号交织的科幻叙事',
    initialSummary: '一二和布布生活在一座高度系统化的未来城市中。城市由层层权限、自动系统与无处不在的监控维系运转。当异常开始出现，他们被迫在城市的缝隙中行动，寻找真相与出路。',
    promptSnippet: `世界设定：
- 类型：未来城市科幻
- 语调：冷静、紧张、克制而真实（无现代俚语，无喜剧）
- 世界重心：系统、权限、信息不对称、被忽视的异常
- 核心张力：城市"看似正常"的运转正在偏离
- 主线方向：逐步揭开城市系统背后的异常（不得快速揭示或一次性解决）

角色：
- 一二（女性）：冷静、分析能力强，擅长感知系统异常、解析数据与制定最小暴露策略
- 布布（男性）：反应迅速，擅长物理行动、干扰系统与在关键时刻保护撤离
- 关系：他们是伴侣；信任通过站位、分工与撤退决策体现，而非说明

世界边界规则（非常重要）：
- 故事发生在城市及其内部结构中（街区、通道、平台、节点、维护空间）
- 避免长途旅行或自然风景描写
- 冲突以"系统级事件"为主，而非战争或大规模武装对抗
- 危险通常来自监控、权限不足、自动响应机制与时间窗口

行动定义（ACTION STYLE）：
- 行动不等同于战斗
- 有效行动包括：
  - 接入、断开、绕过、伪装系统
  - 潜行、快速移动、物理干预设备
  - 延迟追踪、争取时间、强制中断
- 每个行动必须改变系统状态、暴露风险或可用选项

实体引入规则：
- 新命名角色：有限引入（技术人员、巡查者等），一次最多1人
- 新命名地点：有限引入（节点、区域、通道），必须与当前事件直接相关
- 不要快速扩展城市规模；保持叙事聚焦在当前区域

多日事件（SET PIECE）指导：
- 城市中的重大事件（系统异常、持续追踪、权限崩溃）通常需要多日推进
- 事件必须分阶段展开：
  - 第一天：异常显现或被察觉
  - 后续：应对 → 暴露 → 新限制
- 不要在单一章节内解决系统性问题
- 每一日必须留下未解状态或倒计时压力

写作基调约束：
- 氛围来自行动后果与系统反应，而非抒情描写
- 情感通过选择体现：是否冒险、是否撤退、是否为对方承担风险
- 保持紧凑、现实感与连续性`,
    worldBoundaryRules: `叙事边界规则：
- 重点：城市内部结构（街区、通道、平台、节点、维护空间、监控盲区）
- 避免：长途旅行、自然风景、远离城市的场景
- 场景应围绕：城市建筑、系统节点、数据流、权限边界、隐藏通道
- 故事推进通过：系统异常、权限冲突、追踪与反追踪、时间窗口压力`,
    actionStyle: `动作风格：
- 优先动作类型：系统操作、潜行、快速移动、物理干预、时间争取
- 动作应体现：系统反应的即时性、权限的约束、追踪的紧迫、选择的代价
- 避免：长时间静态对话、大规模战斗、远离系统核心的场景`,
    entityPolicy: {
      newNamedCharacters: 'limited',
      newNamedPlaces: 'limited',
    },
    settings: {
      genre: '未来城市科幻',
      tone: ['冷静', '紧张', '克制'],
      coreLoop: '监控 → 异常确认 → 系统干预',
      actionStyle: [
        '扫描/接入系统',
        '物理干预与快速移动',
        '时间窗口争夺与权限策略',
      ],
      boundaryRules: [
        '场景限定在城市结构及节点内',
        '避免自然风景与远程旅行',
        '冲突以系统异常与自动响应为主',
      ],
      entityPolicy: {
        newNamedCharacters: 'limited',
        newNamedPlaces: 'limited',
      },
      longArc: '逐日揭露系统异常 → 权限冲突 → 限时窗口压力',
      setPiece: [
        '第一天：监控/日志出现异常信号',
        '后续：追踪信号源 → 权限回落/报警 → 新限制+倒计时',
      ],
    },
    examples: {
      todayUserEvent:
        '他们在夜里发现一个被封锁的入口，入口另一侧传来断断续续的异常信号。',
      expectedEmphasis: [
        '行动偏向扫描、接入、绕过、物理干预与争取时间窗口',
        '异常会被解释为系统日志不一致、权限回落或异常信号源',
        '结尾更可能落在‘追踪计数上升/权限不足/窗口关闭’的钩子上',
        '锚点A多为安全闸门/维护通道；B多为异常信号与日志；C多为权限/热量/倒计时限制',
      ],
      anchorShapeHint: {
        A: '维护通道的安全闸门',
        B: '断续的异常信号源',
        C: '权限不足与追踪计数上升',
      },
    },
  },
]

export function getWorldById(worldId: string): World | undefined {
  return WORLDS.find(w => w.id === worldId)
}
