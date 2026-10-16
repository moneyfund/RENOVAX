/**
 * RENOVAX cartography sources.
 * OpenStreetMap raster tiles show their natural colors, with no visual filter
 * or provider API key.
 * Follow provider tile-use policies, provide attribution and avoid bulk use.
 */
export const BASEMAPS = {
  street: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: 'Imagery © <a href="https://www.esri.com">Esri</a> and its data providers',
      maxZoom: 19,
    },
  },
} as const;
