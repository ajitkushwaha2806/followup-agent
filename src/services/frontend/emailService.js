import axios from "axios";
import { API_ENDPOINTS } from "../api-endpoints";

export const emailService = {
  async generateEmail(payload) {
    const { data } = await axios.post(API_ENDPOINTS.EMAIL_GENERATE, payload);
    return data;
  },

  async sendViaGmail({ accessToken, to, cc, bcc, subject, body, from, attachments }) {
    const { data } = await axios.post(API_ENDPOINTS.EMAIL_SEND_GMAIL, {
      accessToken,
      to,
      cc,
      bcc,
      subject,
      body,
      from,
      attachments,
    });
    return data;
  },

  async getGoogleConfig() {
    const { data } = await axios.get(API_ENDPOINTS.GOOGLE_CONFIG);
    return data;
  },

  async getGoogleProfile(accessToken) {
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return data;
  },
};
