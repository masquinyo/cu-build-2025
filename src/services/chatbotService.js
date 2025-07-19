const API_BASE_URL = 'http://localhost:4002/api';

class ChatbotService {
  static async createSession(accountNumbers = ['16312']) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumbers }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  static async sendMessage(sessionId, message, onChunk) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk && onChunk) {
          onChunk(chunk);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to get session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  static async refreshSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  }

  static async deleteSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}

export default ChatbotService;