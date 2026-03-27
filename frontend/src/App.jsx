import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import './App.css'
import ChatWidget from './ChatWidget'

const API_ROOT = import.meta.env.VITE_API_URL || ''
const API_BASE = `${API_ROOT}/api`

/**
 * Wikia / Beebom often block hotlinking — use /api/image when backend is available.
 * When `direct` is true (static fallback, no API), use raw URLs so playbrainrot/beebom still load.
 */
function displayImageUrl(raw, direct = false) {
  if (!raw || typeof raw !== 'string') return ''
  const s = raw.trim()
  if (!s.startsWith('http')) return s
  if (direct) return s
  const lower = s.toLowerCase()
  const needsProxy =
    lower.includes('wikia.nocookie.net') ||
    lower.includes('fandom.com') ||
    lower.includes('wikia.com') ||
    lower.includes('techwiser.com') ||
    lower.includes('beebom.com') ||
    lower.includes('game8.co') ||
    lower.includes('traderie.com') ||
    lower.includes('progameguides.com') ||
    lower.includes('itemku.com') ||
    lower.includes('shigjeta.net') ||
    lower.includes('escape-tsunami-for-brainrots.com') ||
    lower.includes('escapetsunamiforbrainrots.com') ||
    lower.includes('escapetsunamiforbrainrots.org') ||
    lower.includes('gamerant.com')
  if (needsProxy) {
    return `${API_ROOT}/api/image?url=${encodeURIComponent(s)}`
  }
  return s
}

/** Only desktop mouse hover — avoids sticky/fake tooltips on touch and hybrid laptops */
function useFinePointerHover() {
  const [ok, setOk] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const fn = () => setOk(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return ok
}

function formatIncome(income) {
  if (income >= 1e9) return `${(income / 1e9).toFixed(1)}B`
  if (income >= 1e6) return `${(income / 1e6).toFixed(1)}M`
  if (income >= 1e3) return `${(income / 1e3).toFixed(1)}K`
  return String(income)
}

/** No real thumbnail yet — avoid loading brainrot-missing.svg (big “?”); show initials like other gaps */
function isPlaceholderThumbUrl(raw) {
  if (!raw || typeof raw !== 'string') return true
  const s = raw.trim().toLowerCase()
  return s.includes('brainrot-missing')
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

const ItemCard = memo(function ItemCard({ item, onAdd, onRemove, showRemove = false, column, imageDirect = false }) {
  const fineHover = useFinePointerHover()
  const [tooltip, setTooltip] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const incomeVal = item.income ?? item.baseIncome ?? 0
  const rawUrl = item.imageThumb || item.image
  const usePlaceholder = isPlaceholderThumbUrl(rawUrl)
  const imageUrl = usePlaceholder ? '' : displayImageUrl(rawUrl, imageDirect)

  useEffect(() => {
    setImgFailed(false)
  }, [rawUrl, imageUrl, imageDirect])

  const showImage = imageUrl && !imgFailed && !usePlaceholder

  return (
    <div
      className={`item-card ${showRemove ? 'in-column' : 'in-pool'}`}
      onClick={() => showRemove ? onRemove() : onAdd(item, column)}
      onMouseEnter={() => fineHover && setTooltip(true)}
      onMouseLeave={() => fineHover && setTooltip(false)}
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
          decoding="async"
          fetchPriority="low"
          onError={() => setImgFailed(true)}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget
            if (w < 2 || h < 2) setImgFailed(true)
          }}
        />
      ) : (
        <span className="item-thumb item-thumb-text" style={{ background: getRarityColor(item.rarity) }}>
          {item.name.slice(0, 2)}
        </span>
      )}
      {incomeVal > 0 && (
        <div className="item-income-line" title={`Income $${formatIncome(incomeVal)}/s`}>
          <span className="item-income-curr">$</span>
          {formatIncome(incomeVal)}
          <span className="item-income-unit">/s</span>
        </div>
      )}
      {fineHover && tooltip && (
        <div className="tooltip">
          <strong>{item.name}</strong>
          <span style={{ color: getRarityColor(item.rarity) }}>{item.rarity}</span>
          <span>Income: ${formatIncome(incomeVal)}/s</span>
          {item.source_values && (
            <span className="tooltip-sources">
              Sources: {Object.entries(item.source_values).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </span>
          )}
          {item.lastUpdated && <span className="tooltip-updated">Updated: {item.lastUpdated}</span>}
        </div>
      )}
    </div>
  )
})

ItemCard.displayName = 'ItemCard'

function ItemColumn({ title, items, allItems, onAdd, onRemove, columnId, imageDirect = false, incomeSum = 0 }) {
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
      <h3 className="column-title">
        {title}
        {incomeSum > 0 && (
          <span className="column-income-sum"> · ${formatIncome(incomeSum)}/s</span>
        )}
      </h3>
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
              imageDirect={imageDirect}
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

// Progi jak w backendzie: WIN >15%, FAIR -10..15%, LOSS <-10%. Przy sumach $/s = 0 używamy sumy RP.
function computeTradeLocal(yourIncome, theirIncome, yourRp, theirRp) {
  let baseYour = yourIncome
  let baseTheir = theirIncome
  let basis = 'income'
  if (yourIncome === 0 && theirIncome === 0 && (yourRp > 0 || theirRp > 0)) {
    baseYour = yourRp
    baseTheir = theirRp
    basis = 'rp'
  }
  let status = 'FAIR ⚖️'
  let color = '#fbbf24'
  let diffPercent = 0
  if (baseYour <= 0 && baseTheir <= 0) {
    return { status: 'NO DATA', color: '#94a3b8', diffPercent: 0, basis: 'none' }
  }
  if (baseYour > 0) {
    const raw = ((baseTheir - baseYour) / baseYour) * 100
    diffPercent = Math.round(raw * 10) / 10
    if (diffPercent > 15) {
      status = 'WIN 🔥'
      color = '#22c55e'
    } else if (diffPercent >= -10) {
      status = 'FAIR ⚖️'
      color = '#fbbf24'
    } else {
      status = 'LOSS ❌'
      color = '#ef4444'
    }
  } else if (baseTheir > 0) {
    status = 'WIN 🔥'
    color = '#22c55e'
    diffPercent = 100
  }
  return { status, color, diffPercent, basis }
}

function VerschilCenter({ resultData }) {
  if (!resultData) return <div className="verschil-center">Select items to compare trade</div>

  const { status, color, diffPercent, basis } = resultData
  const basisNote =
    basis === 'rp'
      ? 'Compared using RP — $/s is 0 in our data for these picks'
      : basis === 'none'
        ? 'Nothing to compare yet'
        : null

  return (
    <div className="verschil-center" style={{ border: `3px solid ${color}`, borderRadius: '12px' }}>
      <div className="verschil-status" style={{ color, fontSize: '1.8rem', fontWeight: 'bold' }}>
        {status}
      </div>
      <div className="verschil-percent" style={{ color }}>
        {diffPercent > 0 ? '+' : ''}{diffPercent}%
      </div>
      {basisNote && (
        <div className="verschil-basis" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', maxWidth: '220px', marginLeft: 'auto', marginRight: 'auto' }}>
          {basisNote}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  /** Static JSON fallback (no backend): load image URLs directly without /api/image proxy */
  const [imageDirect, setImageDirect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [yourItems, setYourItems] = useState([])
  const [theirItems, setTheirItems] = useState([])
  const [tradeResult, setTradeResult] = useState(null)
  const [poolOpen, setPoolOpen] = useState(true)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  useEffect(() => {
    if (!sourcesOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSourcesOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [sourcesOpen])

  useEffect(() => {
    fetch(`${API_BASE}/items`)
      .then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then(data => {
        setImageDirect(false)
        setItems(data.items || [])
        setMeta(data.meta || null)
      })
      .catch(() => {
        Promise.all([
          fetch('/brainrots.json').then((r) => {
            if (!r.ok) throw new Error('brainrots')
            return r.json()
          }),
          fetch('/image-mapping.json')
            .then((r) => (r.ok ? r.json() : { mapping: {} }))
            .catch(() => ({ mapping: {} }))
        ])
          .then(([data, mapData]) => {
            const mapping = mapData.mapping || {}
            const list = (data.items || []).map((it) => {
              const income = it.income ?? it.baseIncome ?? 0
              const raw = (mapping[it.id] || it.imageUrl || '').trim()
              const img = raw ? displayImageUrl(raw, true) : ''
              const rp = Math.min(100, Math.max(1, Math.round(10 * Math.log10(income + 1))))
              return { ...it, income, rp, image: img, imageThumb: img }
            })
            setItems(list)
            setMeta(data.meta || null)
            setImageDirect(true)
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
    const yourRp = yourItems.reduce((s, id) => s + (itemMap[id]?.rp || 0), 0)
    const theirRp = theirItems.reduce((s, id) => s + (itemMap[id]?.rp || 0), 0)

    fetch(`${API_BASE}/calculate-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yourItems, theirItems })
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.status != null) {
          setTradeResult({
            status: data.status,
            color: data.color,
            diffPercent: data.diffPercent ?? 0,
            basis: data.basis || 'income'
          })
        } else {
          setTradeResult(computeTradeLocal(yourIncome, theirIncome, yourRp, theirRp))
        }
      })
      .catch(() => setTradeResult(computeTradeLocal(yourIncome, theirIncome, yourRp, theirRp)))
  }, [items, yourItems, theirItems])

  const filteredItems = useMemo(() => items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchRarity = !rarityFilter || item.rarity === rarityFilter
    return matchSearch && matchRarity
  }), [items, search, rarityFilter])

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
  const yourIncomeSum = yourItems.reduce((s, id) => s + (items.find(i => i.id === id)?.income ?? items.find(i => i.id === id)?.baseIncome ?? 0), 0)
  const theirIncomeSum = theirItems.reduce((s, id) => s + (items.find(i => i.id === id)?.income ?? items.find(i => i.id === id)?.baseIncome ?? 0), 0)

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
                <ItemCard item={item} onAdd={addItem} column="yours" imageDirect={imageDirect} />
                <div className="pool-buttons">
                  <button onClick={(e) => { e.stopPropagation(); addItem(item, 'yours'); }} title="Add to Yours">←</button>
                  <button onClick={(e) => { e.stopPropagation(); addItem(item, 'theirs'); }} title="Add to Theirs">→</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`sources-section${sourcesOpen ? ' sources-section-open' : ''}`}>
        {sourcesOpen && (
          <div
            className="sources-backdrop"
            role="presentation"
            onClick={() => setSourcesOpen(false)}
          />
        )}
        <div className={`sources-toolbar ${sourcesOpen ? 'sources-toolbar-open' : ''}`}>
          <button
            type="button"
            className="sources-toggle"
            onClick={() => setSourcesOpen(!sourcesOpen)}
          >
            {sourcesOpen ? '▼' : '▶'} Data sources
          </button>
          {sourcesOpen && (
            <button
              type="button"
              className="sources-close"
              onClick={() => setSourcesOpen(false)}
            >
              Close
            </button>
          )}
        </div>
        {sourcesOpen && (
          <div className="sources-content">
            <div className="sources-grid">
              <div>
                <strong>List (values, rarity)</strong>
                <ul>
                  <li><a href="https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/" target="_blank" rel="noopener noreferrer">TechWiser</a> — lista, $/s, miniatury w tabeli</li>
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
                  <li><a href="https://traderie.com/escapetsunamiforbrainrots/products" target="_blank" rel="noopener noreferrer">Traderie – item list</a> (403 dla botów; tylko w przeglądarce)</li>
                  <li><a href="https://game8.co/games/Roblox/archives/581250" target="_blank" rel="noopener noreferrer">Game8 – List of All Brainrots</a></li>
                  <li><a href="https://stealabrainrot.fandom.com" target="_blank" rel="noopener noreferrer">Steal A Brainrot Fandom</a> (API w projekcie)</li>
                  <li><a href="https://escapetsunamiforbrainrots.info/brainrots" target="_blank" rel="noopener noreferrer">escapetsunamiforbrainrots.info</a></li>
                  <li className="sources-cli">CLI: <code>npm run fill-ui-sources</code> → Game8 + wiki ETFB + wiki Steal (MediaWiki API), potem <code>npm run cache-thumbnails</code></li>
                </ul>
              </div>
              <div>
                <strong>Community &amp; official</strong>
                <ul>
                  <li><a href="https://www.pinterest.com/ideas/escape-tsunami-for-brainrot/907294892470/" target="_blank" rel="noopener noreferrer">Pinterest</a> — fanarty / memy (ręcznie)</li>
                  <li><a href="https://roblox.fandom.com/wiki/Wave_of_Brainrots/Escape_Tsunami_For_Brainrots" target="_blank" rel="noopener noreferrer">Roblox Fandom wiki</a> — opis gry, screeny</li>
                  <li><a href="https://www.roblox.com/games/131623223084840/Escape-Tsunami-For-Brainrots" target="_blank" rel="noopener noreferrer">Roblox — strona gry</a> — oficjalne assety</li>
                  <li><a href="https://discord.com/invite/escapetsunamiforbrainrots" target="_blank" rel="noopener noreferrer">Discord</a> — community, trading, value updates</li>
                  <li><a href="https://tenor.com/search/roblox-escape-tsunami-brainrots-gifs" target="_blank" rel="noopener noreferrer">Tenor</a> — GIF-y (np. „roblox escape tsunami brainrots”)</li>
                  <li><a href="https://giphy.com/search/escape-tsunami-brainrots" target="_blank" rel="noopener noreferrer">GIPHY</a> — animacje / memy</li>
                  <li className="sources-muted">Instagram / TikTok: <a href="https://www.instagram.com/explore/tags/escapetsunamiforbrainrots/" target="_blank" rel="noopener noreferrer">#escapetsunamiforbrainrots</a>, <a href="https://www.tiktok.com/tag/escapetsunamiforbrainrots" target="_blank" rel="noopener noreferrer">TikTok tag</a> — reels, ręcznie (licencje)</li>
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
          imageDirect={imageDirect}
          incomeSum={yourIncomeSum}
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
          imageDirect={imageDirect}
          incomeSum={theirIncomeSum}
        />
      </div>
      <ChatWidget />
    </div>
  )
}
