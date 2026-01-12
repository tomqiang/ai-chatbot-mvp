interface StoryEntryProps {
  entry: {
    day: number
    userEvent: string
    storyText: string
  }
}

export default function StoryEntry({ entry }: StoryEntryProps) {
  return (
    <div className="story-entry">
      <div className="story-day">第 {entry.day} 天</div>
      <div className="story-user-event">
        <strong>今日事件：</strong>{entry.userEvent}
      </div>
      <div className="story-text">{entry.storyText}</div>
    </div>
  )
}
