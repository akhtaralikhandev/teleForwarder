const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ detail: "Request failed" }));
        const apiError = new Error(error.detail || "Request failed");
        apiError.status = response.status;
        throw apiError;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return response.text();
    } catch (error) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email },
    });
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: userData,
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Channel endpoints
  async getChannels() {
    return this.request("/channels/");
  }

  async addChannel(channelData) {
    return this.request("/channels/", {
      method: "POST",
      body: channelData,
    });
  }

  async deleteChannel(channelId) {
    return this.request(`/channels/${channelId}`, {
      method: "DELETE",
    });
  }

  async getAvailableChannels() {
    return this.request("/channels/available");
  }

  // Forwarding rules endpoints
  async getForwardingRules() {
    return this.request("/forwarding-rules/");
  }

  async createForwardingRule(ruleData) {
    return this.request("/forwarding-rules/", {
      method: "POST",
      body: ruleData,
    });
  }

  async updateForwardingRule(ruleId, ruleData) {
    return this.request(`/forwarding-rules/${ruleId}`, {
      method: "PUT",
      body: ruleData,
    });
  }

  async deleteForwardingRule(ruleId) {
    return this.request(`/forwarding-rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  async toggleRule(ruleId) {
    return this.request(`/forwarding-rules/${ruleId}/toggle`, {
      method: "PATCH",
    });
  }

  // Subscription endpoints
  async createSubscription() {
    return this.request("/subscription/create", {
      method: "POST",
    });
  }

  async getSubscriptionStatus() {
    return this.request("/subscription/status");
  }

  async cancelSubscription() {
    return this.request("/subscription/cancel", {
      method: "POST",
    });
  }

  async getSubscriptionPlans() {
    return this.request("/subscription/plans");
  }

  // Telegram bot endpoints
  async startBot() {
    return this.request("/telegram/start-bot", {
      method: "POST",
    });
  }

  async stopBot() {
    return this.request("/telegram/stop-bot", {
      method: "POST",
    });
  }

  async getBotStatus() {
    return this.request("/telegram/bot-status");
  }

  // Statistics
  async getStats() {
    return this.request("/stats/");
  }

  async getForwardingLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/stats/logs${queryString ? `?${queryString}` : ""}`);
  }

  async getAnalytics(days = 30) {
    return this.request(`/stats/analytics?days=${days}`);
  }

  async getPerformanceMetrics() {
    return this.request("/stats/performance");
  }
}

export const apiClient = new ApiClient();
