import axios from "axios"

const rawUrl = (process.env.EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL ?? "http://192.168.0.17:8080/api/");
const cleanedUrl = rawUrl.replace(/^"|"$/g, "");
const baseUrl = cleanedUrl.replace(/\/+$/, "");

const umbrellaApi = axios.create({
  baseURL: baseUrl,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
    // Evita a página de aviso do ngrok free, que de outra forma intercepta as
    // requisições de API com uma página HTML em vez do JSON esperado.
    "ngrok-skip-browser-warning": "true",
  },
})

export default umbrellaApi;

/** Base da API, ex. "http://192.168.0.17:8080/api". */
export const API_BASE_URL = baseUrl;

/** Origem do servidor (sem o sufixo /api), ex. "http://192.168.0.17:8080". */
export const SERVER_ORIGIN = baseUrl.replace(/\/api\/?$/, "");

/**
 * URL do bundle do avatar VLibras servido estaticamente pelo backend Spring
 * (src/main/resources/static/vlibras/index.html).
 */
export const AVATAR_BUNDLE_URI = `${SERVER_ORIGIN}/vlibras/index.html`;
