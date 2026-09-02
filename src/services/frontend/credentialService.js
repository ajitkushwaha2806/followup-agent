import axios from "axios";
import { API_ENDPOINTS } from "../api-endpoints";

export const credentialService = {
  async getAll() {
    const { data } = await axios.get(API_ENDPOINTS.CREDENTIALS);
    return data;
  },

  async getById(id) {
    const { data } = await axios.get(`${API_ENDPOINTS.CREDENTIALS}/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await axios.post(API_ENDPOINTS.CREDENTIALS, payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await axios.put(`${API_ENDPOINTS.CREDENTIALS}/${id}`, payload);
    return data;
  },

  async delete(id) {
    const { data } = await axios.delete(`${API_ENDPOINTS.CREDENTIALS}/${id}`);
    return data;
  },

  async testConnection(id) {
    const { data } = await axios.post(`${API_ENDPOINTS.CREDENTIALS}/${id}/test`);
    return data;
  },

  async getRestaurants(id, type = "active-requests") {
    const { data } = await axios.get(`${API_ENDPOINTS.CREDENTIALS}/${id}/restaurants`, {
      params: { type },
    });
    return data;
  },
};
