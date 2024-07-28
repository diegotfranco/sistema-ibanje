import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.BASE_URL,
  withCredentials: true,
  timeout: 600000,
});

