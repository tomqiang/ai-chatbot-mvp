'use client'

import Image from 'next/image'

/**
 * 一二宝宝的游乐场 - 主组件
 * 
 * 所有 UI、状态、逻辑都在这里
 * 可以创建子组件在 features/playground/components/
 * 可以创建工具函数在 features/playground/lib/
 */
export default function PlaygroundApp() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
          一二宝宝的游乐场
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginTop: '12px' }}>
          欢迎来到游乐场！在这里可以尽情玩耍 🎠
        </p>
      </header>

      <main>
        {/* 一二的自我介绍 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', marginBottom: '20px' }}>
            一二的自我介绍
          </h2>
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '2px solid #fef3c7',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '600px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                }}
              >
                <Image
                  src="/yier-resume.jpeg"
                  alt="一二的简历"
                  width={600}
                  height={800}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* 游乐场内容区域 */}
        <section>
          <div
            style={{
              padding: '32px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '16px',
              border: '2px solid #fbbf24',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p style={{ color: '#92400e', lineHeight: 1.8, fontSize: '16px', margin: 0 }}>
              🎈 游乐场已经准备好啦！
              <br />
              <br />
              在这里可以开始实现你的功能。
              <br />
              所有状态、逻辑、UI 都应该在这个组件或其子组件中。
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}