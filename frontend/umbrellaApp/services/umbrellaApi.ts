import axios from "axios"

const umbrellaApi = axios.create({
    baseURL: process.env.EXPO_PUBLIC_UMBRELA_PUBLIC_API_URL,
    timeout: parseInt(process.env.EXPO_PUBLIC_REQUEST_TIME_OUT!),
    headers: {
        "Content-Type": "aplication/json"
    }
})

export default umbrellaApi;
