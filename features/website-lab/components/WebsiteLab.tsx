'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './WebsiteLab.module.css'

const themes = [
  { name: 'Ocean', color: '#165e66', background: '#e7f3f1' },
  { name: 'Berry', color: '#8d315a', background: '#f9eaf0' },
  { name: 'Violet', color: '#6540a0', background: '#eeeafb' },
]
const initial = {
  name: 'Yier’s little corner',
  headline: 'Small ideas. Beautiful beginnings.',
  description: 'A space for the things I love, the things I make, and everything I’m curious about.',
}

export default function WebsiteLab() {
  const [content, setContent] = useState(initial)
  const [themeIndex, setThemeIndex] = useState(0)
  const [centered, setCentered] = useState(false)
  const [mobile, setMobile] = useState(false)
  const theme = themes[themeIndex]

  function reset() {
    setContent(initial)
    setThemeIndex(0)
    setCentered(false)
    setMobile(false)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/">← All apps</Link>
        <span>YIER / EXPERIMENT 01</span>
      </header>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>A PLACE TO TRY THINGS</p>
        <h1>Your website starts here.</h1>
        <p>Play with words, color, and layout. Watch your ideas turn into a page.</p>
      </section>
      <div className={styles.workspace}>
        <aside className={styles.controls} aria-label="Website controls">
          <div className={styles.sectionHeading}><h2>Make it yours</h2><button onClick={reset}>Reset</button></div>
          <label htmlFor="site-name">01 / Site name</label>
          <input id="site-name" maxLength={60} value={content.name} onChange={e => setContent({ ...content, name: e.target.value })} />
          <label htmlFor="headline">02 / Headline</label>
          <textarea id="headline" rows={3} maxLength={140} value={content.headline} onChange={e => setContent({ ...content, headline: e.target.value })} />
          <label htmlFor="description">03 / A little introduction</label>
          <textarea id="description" rows={4} maxLength={400} value={content.description} onChange={e => setContent({ ...content, description: e.target.value })} />
          <fieldset>
            <legend>04 / Color palette</legend>
            <div className={styles.options}>
              {themes.map((item, index) => (
                <button key={item.name} aria-pressed={themeIndex === index} onClick={() => setThemeIndex(index)}>
                  <span className={styles.swatch} style={{ background: item.color }} />{item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>05 / Layout</legend>
            <div className={styles.options}>
              <button aria-pressed={!centered} onClick={() => setCentered(false)}>Left aligned</button>
              <button aria-pressed={centered} onClick={() => setCentered(true)}>Centered</button>
            </div>
          </fieldset>
          <p className={styles.note}>This is your scratchpad. Changes stay on this page until you refresh; they aren’t saved or published.</p>
        </aside>
        <section className={styles.previewArea} aria-label="Live website preview">
          <div className={styles.toolbar}>
            <span><i /> Live preview</span>
            <div className={styles.options}>
              <button aria-pressed={!mobile} onClick={() => setMobile(false)}>Wide</button>
              <button aria-pressed={mobile} onClick={() => setMobile(true)}>Phone</button>
            </div>
          </div>
          <div className={styles.canvas}>
            <article className={`${styles.website} ${mobile ? styles.mobile : ''}`} style={{ background: theme.background, color: theme.color, textAlign: centered ? 'center' : 'left' }}>
              <div className={styles.siteNav}><strong>{content.name || 'Your site name'}</strong><span aria-hidden="true">✳</span></div>
              <div className={styles.hero}>
                <span className={styles.badge}>HELLO, WORLD</span>
                <h2>{content.headline || 'Your next big idea goes here.'}</h2>
                <p>{content.description || 'Tell visitors a little about yourself.'}</p>
                <div className={styles.decoration} aria-hidden="true">✳</div>
              </div>
              <footer className={styles.siteFooter}><span>Made with curiosity.</span><span>EST. 2026</span></footer>
            </article>
          </div>
          <div className={styles.lesson}><strong>Try this</strong><p>Write a shorter headline. Switch the layout. Notice how the same words can feel completely different.</p></div>
        </section>
      </div>
    </main>
  )
}
