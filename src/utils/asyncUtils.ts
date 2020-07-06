import axios from "axios";

const accessToken = localStorage.getItem("accessToken");

export const httpClient = axios.create({
  withCredentials: true,
  headers: accessToken && { Authorization: `Bearer ${accessToken}` },
});
