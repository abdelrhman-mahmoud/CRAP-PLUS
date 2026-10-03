const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const localKey = 'crab-plus-site-data'

function stripMockImages(data) {
  const mock = url => typeof url === 'string' && /\/images\/reference\/(feast|shrimp|claws|lemon|mussels|corn|offer|about)\.jpg(?:[?#].*)?$/.test(url)
  return { ...data, items: (data.items || []).map(item => { const images = (item.images || []).filter(url => !mock(url)); const image = mock(item.image) ? '' : (images[0] || item.image || ''); return { ...item, image, images } }), offers: (data.offers || []).map(offer => ({ ...offer, image: mock(offer.image) ? '' : offer.image, image_url: mock(offer.image_url) ? '' : offer.image_url })) }
}

export async function getSiteData() {
  try {
    const response = await fetch(`${API}/api/public`)
    if (!response.ok) throw new Error('API unavailable')
    return await response.json()
  } catch {
    const cached = localStorage.getItem(localKey)
    if (cached) return stripMockImages(JSON.parse(cached))
    const { seedData } = await import('./data.js')
    return seedData
  }
}

export async function adminRequest(path, token, options = {}) {
  const response = await fetch(`${API}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'تعذر حفظ التغييرات')
  }
  return response.status === 204 ? null : response.json()
}

export async function uploadAdminImage(file, token) {
  const response = await fetch(`${API}/api/admin/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name || 'image'),
    },
    body: file,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'تعذر رفع الصورة')
  }
  const result = await response.json()
  return { ...result, url: `${API}${result.url}` }
}

export function cacheSiteData(data) { localStorage.setItem(localKey, JSON.stringify(data)) }
