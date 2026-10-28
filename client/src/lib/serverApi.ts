import axios from "axios";

const serverApi = axios.create({
  baseURL: "https://movie-hub-edbk.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default serverApi;
