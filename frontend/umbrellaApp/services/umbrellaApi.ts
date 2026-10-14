import axios from "axios"

// Use the public API URL defined in .env (EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL).
// It already contains the "/api/" prefix, so we remove any trailing slash to avoid double slashes.
const rawUrl = (process.env.EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL ?? "http://192.168.0.10:8080/api/");
// Remove surrounding quotes if present and trailing slashes
const cleanedUrl = rawUrl.replace(/^"|"$/g, "");
const baseUrl = cleanedUrl.replace(/\/+$/, "");

const umbrellaApi = axios.create({
  baseURL: baseUrl,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
})

export default umbrellaApi;
