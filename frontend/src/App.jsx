import { useState, useEffect, useCallback } from 'react'
import './App.css'
import ChatWidget from './ChatWidget'

const API_ROOT = import.meta.env.VITE_API_URL || ''
const API_BASE = `${API_ROOT}/api`

function formatIncome(income) {
  if (income >= 1e9) return `${(income / 1e9).toFixed(1)}B`
  if (income >= 1e6) return `${(income / 1e6).toFixed(1)}M`
  if (income >= 1e3) return `${(income / 1e3).toFixed(1)}K`
  return String(income)
}

function getRarityColor(rarity) {
  const map = {
    Common: 'var(--rarity-common)',
    Uncommon: 'var(--rarity-uncommon)',
    Rare: 'var(--rarity-rare)',
    Epic: 'var(--rarity-epic)',
    Legendary: 'var(--rarity-legendary)',
    Mythical: 'var(--rarity-mythical)',
    Cosmic: 'var(--rarity-cosmic)',
    Secret: 'var(--rarity-secret)',
    Celestial: 'var(--rarity-celestial)',
    Divine: 'var(--rarity-divine)',
    Infinity: 'var(--rarity-infinity)'
  }
  return map[rarity] || 'var(--text-muted)'
}

function ItemCard({ item, onAdd, onRemove, showRemove = false, column }) {
  const [tooltip, setTooltip] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const rawUrl = item.imageThumb || item.image
  // External URLs via proxy (Fandom blocks hotlink)
  const imageUrl = rawUrl && rawUrl.startsWith('http')
    ? `${API_BASE}/image?url=${encodeURIComponent(rawUrl)}`
    : rawUrl
  const showImage = imageUrl && !imgFailed

  return (
    <div
      className={`item-card ${showRemove ? 'in-column' : 'in-pool'}`}
      onClick={() => showRemove ? onRemove() : onAdd(item, column)}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
      draggable={!showRemove}
      onDragStart={(e) => {
        if (!showRemove) {
          e.dataTransfer.setData('application/json', JSON.stringify({ item }))
          e.dataTransfer.effectAllowed = 'copy'
        }
      }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={item.name}
          className="item-thumb"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="item-thumb item-thumb-text" style={{ background: getRarityColor(item.rarity) }}>
          {item.name.slice(0, 2)}
        </span>
      )}
      {tooltip && (
        <div className="tooltip">
          <strong>{item.name}</strong>
          <span style={{ color: getRarityColor(item.rarity) }}>{item.rarity}</span>
          <span>Income: ${formatIncome(item.income)}/s</span>
          {item.source_values && (
            <span className="tooltip-sources">
              Sources: {Object.entries(item.source_values).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </span>
          )}
          <span className="tooltip-updated">Updated: {item.lastUpdated}</span>
        </div>
      )}
    </div>
  )
}

function ItemColumn({ title, items, allItems, onAdd, onRemove, columnId }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data?.item) onAdd(data.item, columnId)
    } catch (_) {}
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div
      className={`column ${dragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <h3 className="column-title">{title}</h3>
      <select
        className="column-select"
        value=""
        onChange={(e) => {
          const id = e.target.value
          if (id) {
            const item = allItems.find(i => i.id === id)
            if (item) onAdd(item, columnId)
            e.target.value = ''
          }
        }}
      >
        <option value="">+ Add item...</option>
        {allItems.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <div className="column-items">
        {items.map(id => {
          const item = allItems.find(i => i.id === id)
          if (!item) return null
          return (
            <ItemCard
              key={id}
              item={item}
              showRemove
              onRemove={() => onRemove(id, columnId)}
              column={columnId}
            />
          )
        })}
        {items.length === 0 && (
          <div className="column-empty">Drag items or select from list</div>
        )}
      </div>
    </div>
  )
}

// Progi WFL z backendu: WIN >15%, FAIR -10..15%, LOSS <-10%
function computeWFL(yourIncome, theirIncome) {
  if (yourIncome <= 0 && theirIncome <= 0) return null
  const diffPercent = yourIncome > 0
    ? ((theirIncome - yourIncome) / yourIncome) * 100
    : (theirIncome > 0 ? 100 : 0)
  const pct = Math.round(diffPercent * 10) / 10
  let status = 'FAIR ⚖️'
  let color = '#ffff00'
  if (diffPercent > 15) {
    status = 'WIN 🔥'
    color = '#00ff00'
  } else if (diffPercent < -10) {
    status = 'LOSS ❌'
    color = '#ff0000'
  }
  return { status, color, diffPercent: pct }
}

function VerschilCenter({ resultData }) {
  if (!resultData) return <div className="verschil-center">Select items to compare trade</div>

  const { status, color, diffPercent } = resultData

  return (
    <div className="verschil-center" style={{ border: `3px solid ${color}`, borderRadius: '12px' }}>
      <div className="verschil-status" style={{ color, fontSize: '1.8rem', fontWeight: 'bold' }}>
        {status}
      </div>
      <div className="verschil-percent" style={{ color }}>
        {diffPercent > 0 ? '+' : ''}{diffPercent}%
      </div>
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [yourItems, setYourItems] = useState([])
  const [theirItems, setTheirItems] = useState([])
  const [tradeResult, setTradeResult] = useState(null)
  const [poolOpen, setPoolOpen] = useState(true)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/items`)
      .then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then(data => {
        setItems(data.items || [])
        setMeta(data.meta || null)
      })
      .catch(() => {
        // Fallback when backend unavailable – load from public/brainrots.json
        fetch('/brainrots.json')
          .then(r => r.json())
          .then(data => {
            const list = data.items || []
            setItems(list.map(it => ({
              ...it,
              income: it.income ?? it.baseIncome ?? 0,
              rp: Math.min(100, Math.max(1, Math.round(10 * Math.log10((it.income ?? it.baseIncome ?? 0) + 1))))
            })))
            setMeta(data.meta || null)
          })
          .catch(() => setItems([]))
      })
      .finally(() => setLoading(false))
  }, [])

  // WFL: call calculate-trade API or compute locally (fallback)
  useEffect(() => {
    if (!items.length || (yourItems.length === 0 && theirItems.length === 0)) {
      setTradeResult(null)
      return
    }
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]))
    const yourIncome = yourItems.reduce((s, id) => s + (itemMap[id]?.income ?? itemMap[id]?.baseIncome ?? 0), 0)
    const theirIncome = theirItems.reduce((s, id) => s + (itemMap[id]?.income ?? itemMap[id]?.baseIncome ?? 0), 0)

    fetch(`${API_BASE}/calculate-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yourItems, theirItems })
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.status != null) {
          setTradeResult({ status: data.status, color: data.color, diffPercent: data.diffPercent ?? 0 })
        } else {
          setTradeResult(computeWFL(yourIncome, theirIncome))
        }
      })
      .catch(() => setTradeResult(computeWFL(yourIncome, theirIncome)))
  }, [items, yourItems, theirItems])

  const filteredItems = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchRarity = !rarityFilter || item.rarity === rarityFilter
    return matchSearch && matchRarity
  })

  const rarities = [...new Set(items.map(i => i.rarity))].sort((a, b) => {
    const order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Cosmic', 'Secret', 'Celestial', 'Divine', 'Infinity']
    return order.indexOf(a) - order.indexOf(b)
  })

  const addItem = useCallback((item, column) => {
    if (column === 'yours') {
      setYourItems(prev => [...prev, item.id])
    } else {
      setTheirItems(prev => [...prev, item.id])
    }
  }, [])

  const removeItem = useCallback((id, column) => {
    if (column === 'yours') {
      setYourItems(prev => prev.filter(x => x !== id))
    } else {
      setTheirItems(prev => prev.filter(x => x !== id))
    }
  }, [])

  const yourSum = yourItems.reduce((s, id) => s + (items.find(i => i.id === id)?.rp || 0), 0)
  const theirSum = theirItems.reduce((s, id) => s + (items.find(i => i.id === id)?.rp || 0), 0)

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Loading Brainrots...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Escape Tsunami Brainrots</h1>
        <p className="subtitle">Trade Calculator & Value List</p>
        {meta && (
          <span className="meta">Last updated: {meta.lastUpdated} • {meta.totalItems} items</span>
        )}
      </header>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={rarityFilter}
          onChange={e => setRarityFilter(e.target.value)}
          className="rarity-select"
        >
          <option value="">All rarities</option>
          {rarities.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          className="pool-toggle"
          onClick={() => setPoolOpen(!poolOpen)}
        >
          {poolOpen ? 'Hide' : 'Show'} item list
        </button>
      </div>

      {poolOpen && (
        <div className="item-pool">
          <p className="pool-hint">Click item to add to column (or drag)</p>
          <div className="pool-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="pool-actions">
                <ItemCard item={item} onAdd={addItem} column="yours" />
                <div className="pool-buttons">
                  <button onClick={(e) => { e.stopPropagation(); addItem(item, 'yours'); }} title="Add to Yours">←</button>
                  <button onClick={(e) => { e.stopPropagation(); addItem(item, 'theirs'); }} title="Add to Theirs">→</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sources-section">
        <button
          className="sources-toggle"
          onClick={() => setSourcesOpen(!sourcesOpen)}
        >
          {sourcesOpen ? '▼' : '▶'} Data sources
        </button>
        {sourcesOpen && (
          <div className="sources-content">
            <div className="sources-grid">
              <div>
                <strong>List (values, rarity)</strong>
                <ul>
                  <li><a href="https://escapetsunamiforbrainrotswiki.com/escape-tsunami-for-brainrots-value" target="_blank" rel="noopener noreferrer">escapetsunamiforbrainrotswiki.com</a></li>
                  <li><a href="https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/" target="_blank" rel="noopener noreferrer">shigjeta.net</a></li>
                  <li><a href="https://gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values/" target="_blank" rel="noopener noreferrer">gamerant.com</a></li>
                  <li><a href="https://escape-tsunami-for-brainrots.com/wiki" target="_blank" rel="noopener noreferrer">escape-tsunami-for-brainrots.com</a></li>
                  <li><a href="https://traderie.com/escapetsunamiforbrainrots/products" target="_blank" rel="noopener noreferrer">traderie.com</a></li>
                </ul>
              </div>
              <div>
                <strong>Images</strong>
                <ul>
                  <li><a href="https://traderie.com/escapetsunamiforbrainrots/products" target="_blank" rel="noopener noreferrer">Traderie – item list</a></li>
                  <li><a href="https://game8.co/games/Roblox/archives/581250" target="_blank" rel="noopener noreferrer">Game8 – List of All Brainrots</a></li>
                  <li><a href="https://stealabrainrot.fandom.com" target="_blank" rel="noopener noreferrer">Steal A Brainrot Fandom</a></li>
                  <li><a href="https://escapetsunamiforbrainrots.info/brainrots" target="_blank" rel="noopener noreferrer">escapetsunamiforbrainrots.info</a></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="vergelijking">
        <ItemColumn
          title="Your items"
          items={yourItems}
          allItems={items}
          onAdd={addItem}
          onRemove={removeItem}
          columnId="yours"
        />
        <div className="center-column">
          <VerschilCenter resultData={tradeResult} />
        </div>
        <ItemColumn
          title="Their items"
          items={theirItems}
          allItems={items}
          onAdd={addItem}
          onRemove={removeItem}
          columnId="theirs"
        />
      </div>
      <ChatWidget />
    </div>
  )
}
