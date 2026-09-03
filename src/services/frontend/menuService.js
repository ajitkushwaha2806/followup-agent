import axios from "axios";

export const menuService = {
  async getMenu(resId) {
    const { data } = await axios.get(`/api/zomato/menu/${resId}`);
    return data;
  },

  async importZomatoMenu(resId, credentialId) {
    const params = credentialId ? { credentialId } : {};
    const { data } = await axios.get(`/api/zomato/menu/${resId}/import`, { params });
    return data;
  },

  async saveMenu(resId, menuData) {
    const { data } = await axios.put(`/api/zomato/menu/${resId}`, menuData);
    return data;
  },

  async updateBulkPrices(resId, payload) {
    const { data } = await axios.post(`/api/zomato/menu/${resId}/bulk-editor/price`, payload);
    return data;
  },

  async updateMenu(resId, payload = {}) {
    const { data } = await axios.post(`/api/zomato/menu/${resId}/update-menu`, payload);
    return data;
  },
};

