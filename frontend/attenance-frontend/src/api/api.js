import axios from "axios";

const api = axios.create({
  baseURL: "https://college-attendence.onrender.com",
});

export default api;
