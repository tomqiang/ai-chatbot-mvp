export default function StoryEmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📖</div>
      <h2 className="empty-title">Your Chronicle Awaits</h2>
      <p className="empty-description">
        故事尚未开始。输入事件描述，开始你的奇幻之旅。
      </p>
      <div className="empty-example">
        <p className="example-label">Example events:</p>
        <ul className="example-list">
          <li>一二在森林中发现了一处古老的遗迹</li>
          <li>布布在战斗中保护了一二，但受了轻伤</li>
          <li>他们遇到了一位神秘的旅行商人</li>
        </ul>
      </div>
    </div>
  )
}
