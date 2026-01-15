'use client'

import Link from 'next/link'

interface AppItem {
  id: string
  name: string
  desc: string
  href: string
  icon: string
  gradient: string
}

const APPS: AppItem[] = [
  {
    id: 'story',
    name: '故事书',
    desc: '创作你的奇幻故事，在多个世界中展开冒险。每天一句话，AI 帮你续写精彩章节。',
    href: '/apps/story',
    icon: '📖',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    id: 'decider',
    name: '一二布布决策转盘',
    desc: '当一二和布布意见不一致时，用可爱的转盘决定：听谁的，或者折中。',
    href: '/apps/decider',
    icon: '🎡',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #60a5fa 100%)',
  },
]

function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 15L12.5 10L7.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LauncherPage() {
  return (
    <div className="launcher-page">
      {/* Header */}
      <header className="launcher-header">
        <div className="header-content">
          <h1 className="launcher-title">应用中心</h1>
          <p className="launcher-subtitle">选择一个应用开始</p>
        </div>
      </header>

      {/* App List */}
      <main className="launcher-main">
        <div className="app-list">
          {APPS.map((app) => (
            <Link
              key={app.id}
              href={app.href}
              className="app-row"
              aria-label={`打开 ${app.name}`}
            >
              <div className="app-icon" style={{ background: app.gradient }}>{app.icon}</div>
              <div className="app-info">
                <h2 className="app-name">{app.name}</h2>
                <p className="app-desc">{app.desc}</p>
              </div>
              <div className="app-chevron">
                <ChevronIcon />
              </div>
            </Link>
          ))}
        </div>

        {APPS.length === 0 && (
          <div className="empty-state">
            <p>暂无可用应用</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .launcher-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .launcher-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 48px 16px;
        }

        .header-content {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }

        .launcher-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .launcher-subtitle {
          font-size: 16px;
          margin: 0;
          opacity: 0.85;
          font-weight: 400;
        }

        .launcher-main {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        .app-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .app-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .app-row:hover {
          border-color: #d1d5db;
          background: #fafafa;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .app-row:active {
          background: #f3f4f6;
          transform: scale(0.99);
        }

        .app-row:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
          border-color: #6366f1;
        }

        .app-icon {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .app-info {
          flex: 1;
          min-width: 0;
        }

        .app-name {
          font-size: 17px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .app-desc {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .app-chevron {
          flex-shrink: 0;
          color: #9ca3af;
          transition: all 0.2s ease;
        }

        .app-row:hover .app-chevron {
          color: #6b7280;
          transform: translateX(2px);
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: #9ca3af;
        }

        @media (min-width: 640px) {
          .launcher-header {
            padding: 64px 24px;
          }

          .launcher-title {
            font-size: 40px;
          }

          .launcher-subtitle {
            font-size: 18px;
          }

          .launcher-main {
            padding: 32px 24px 48px;
          }

          .app-row {
            padding: 20px;
          }

          .app-icon {
            width: 64px;
            height: 64px;
            font-size: 32px;
          }

          .app-name {
            font-size: 18px;
          }

          .app-desc {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  )
}
