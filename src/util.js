// export const asset = (p) => new URL(p, import.meta.env.BASE_URL).href

// src/util.js
export const asset = (p) => {
  const clean = String(p).replace(/^\/+/, '') // strip leading slash
  return new URL(clean, document.baseURI).href
}
