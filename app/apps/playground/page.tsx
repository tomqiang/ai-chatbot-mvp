import { PlaygroundApp } from '@/features/playground/components'

/**
 * 一二宝宝的游乐场 - 路由层（薄壳）
 * 
 * 规则：
 * - ✅ 只负责 render
 * - ✅ 只导入 @/features/playground/ 的组件
 * - ❌ 不能包含状态、逻辑、业务代码
 */
export default function PlaygroundPage() {
  return <PlaygroundApp />
}