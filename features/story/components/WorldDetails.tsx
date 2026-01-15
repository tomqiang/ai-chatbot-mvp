"use client"

import { World } from "@/features/story/lib/worlds"
import { useEffect } from "react"

interface WorldDetailsProps {
  world: World
  open: boolean
  onClose: () => void
  onSelect: (worldId: string) => void
}

export function WorldDetails({ world, open, onClose, onSelect }: WorldDetailsProps) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="world-details-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,13,17,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "48px 16px",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        className="world-details-panel"
        style={{
          background: "white",
          borderRadius: "20px",
          width: "min(960px, 100%)",
          maxHeight: "min(90vh, 1000px)",
          overflowY: "auto",
          padding: "32px",
          boxShadow: "0 20px 45px rgba(15,23,42,0.25)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px" }}>{world.displayName}</h2>
              <p style={{ margin: "6px 0 0", color: "#4b4b4b" }}>{world.description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#999",
                padding: 0,
              }}
              aria-label="Close world details"
            >
              ×
            </button>
          </div>
        </header>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>类型 / 语调</h3>
          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>{world.settings.genre}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {world.settings.tone.map((tone) => (
              <span
                key={tone}
                style={{
                  background: "#f2f5ff",
                  color: "#1f2a44",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  border: "1px solid #dfe7ff",
                }}
              >
                {tone}
              </span>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>核心驱动力</h3>
          <p style={{ margin: 0 }}>{world.settings.coreLoop}</p>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>行动风格</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7 }}>
            {world.settings.actionStyle.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>边界规则</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7 }}>
            {world.settings.boundaryRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>命名元素策略</h3>
          <p style={{ margin: 0 }}>
            角色：{world.settings.entityPolicy.newNamedCharacters} / 地点：{world.settings.entityPolicy.newNamedPlaces}
          </p>
          <small style={{ color: "#666" }}>（来自设定中的持续限制，保持世界一致性。）</small>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>长线结构</h3>
          <p style={{ margin: 0 }}>{world.settings.longArc}</p>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px" }}>多日事件推进</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7 }}>
            {world.settings.setPiece.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>

        <section
          style={{
            marginBottom: "20px",
            padding: "16px",
            background: "#f7f7ff",
            borderRadius: "16px",
            border: "1px solid #e1e1ef",
          }}
        >
          <h3 style={{ margin: "0 0 10px" }}>示例输入与预期风格</h3>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "12px",
              border: "1px dashed #b7c0ff",
              fontStyle: "italic",
              color: "#333",
            }}
          >
            {world.examples.todayUserEvent}
          </div>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7 }}>
            {world.examples.expectedEmphasis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {world.examples.anchorShapeHint && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "12px", marginTop: "16px" }}>
              {Object.entries(world.examples.anchorShapeHint).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid #d3d3e5",
                    background: "white",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "6px" }}>{key}</strong>
                  <span style={{ fontSize: "12px", color: "#444" }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid #d6d6d6",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            关闭
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(world.id)
              onClose()
            }}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #5b4bdb 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            选择这个世界
          </button>
        </footer>
      </div>
    </div>
  )
}
