import apiClient from './client';

/**
 * API client for device messages endpoints.
 *
 * All endpoints use session-based authentication (cookies).
 */
export const messagesApi = {
  /**
   * Get list of device messages with optional filtering.
   *
   * GET /api/v1/messages/
   *
   * @param {Object} params - Query parameters for filtering
   * @param {string} params.message_type - Filter by message type (e.g., "alert", "heartbeat")
   * @param {string} params.time_window - Time window ("1h", "24h", "7d", "all")
   * @param {number} params.limit - Maximum number of messages (default: 50, max: 200)
   *
   * @returns {Promise<Array>} Array of message objects
   *
   * Example response:
   * [
   *   {
   *     "id": 123,
   *     "device": "uuid",
   *     "device_name": "ESP32-Sensor-01",
   *     "device_latitude": "54.687200",
   *     "device_longitude": "25.279700",
   *     "message_type": "alert",
   *     "timestamp": "2026-01-27T22:21:44Z",
   *     "data_preview": "{\"event\": \"ultrasonic_detection\", ...}",
   *     "confidence": 0.95,
   *     "recieved_at": "2026-01-27T22:21:45Z"
   *   }
   * ]
   */
  getMessages: async (params = {}) => {
    // Clean up empty string parameters (they should be omitted, not sent as empty strings)
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const response = await apiClient.get('/api/v1/messages/', { params: cleanParams });
    return response.data.results || response.data; // Handle both paginated and non-paginated responses
  },
};