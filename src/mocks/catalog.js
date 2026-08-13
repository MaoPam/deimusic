// Catálogo de demostración.
// Sirve de "biblioteca" falsa cuando DEMO está activo: lo que devuelve el buscador
// y lo que se precarga en la cola. Los metadatos (álbum y duración) son de relleno,
// no vienen de ninguna API.

// Portada generada como SVG en data-URI: sin peticiones de red, sin binarios en el repo.
const cover = (from, to, label) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="160" height="160" fill="url(#g)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="monospace" font-size="52" font-weight="bold"
      fill="#0C0C12" fill-opacity="0.55">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const CATALOG = [
  {
    id: 'demo-001',
    title: 'Chulo pt.2',
    artist: 'Bad Gyal',
    album: 'La Joia',
    duration: '3:07',
    thumbnail: cover('#8B5CF6', '#EC4899', 'BG'),
  },
  {
    id: 'demo-002',
    title: 'Fiebre',
    artist: 'Bad Gyal',
    album: 'Worldwide Angel',
    duration: '2:56',
    thumbnail: cover('#EC4899', '#F59E0B', 'BG'),
  },
  {
    id: 'demo-003',
    title: 'Llorando Rímmel',
    artist: 'Métrika',
    album: 'La Minimixxxtape de las Zorras',
    duration: '2:41',
    thumbnail: cover('#06B6D4', '#8B5CF6', 'MK'),
  },
  {
    id: 'demo-004',
    title: 'Vendetta',
    artist: 'Villano Antillano',
    album: 'Kaleidoscópico',
    duration: '3:24',
    thumbnail: cover('#10B981', '#06B6D4', 'VA'),
  },
];

// "3:07" -> 187
export const toSecs = (duration) => {
  const [m, s] = String(duration ?? '0:00').split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
};
