import axios from "axios"

const rawUrl = (process.env.EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL ?? "http://192.168.0.17:8080/api/");
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
