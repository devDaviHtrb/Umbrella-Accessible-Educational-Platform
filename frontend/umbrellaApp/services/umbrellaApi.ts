import axios from "axios"

const umbrellaApi = axios.create({
  baseURL: "http://localhost:8080/",
  timeout: parseInt(process.env.EXPO_PUBLIC_REQUEST_TIME_OUT || "10000") || 10000,
  headers: {
    "Content-Type": "application/json"
  }
})

export default umbrellaApi;
