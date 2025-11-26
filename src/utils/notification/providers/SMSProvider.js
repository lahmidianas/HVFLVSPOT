import { formatSMSContent } from '../formatters.js';

/**
 * SMS notification provider
 */
export class SMSProvider {
  /**
   * Send an SMS notification
   * @param {Object} params Send parameters
   * @param {string} params.recipient Phone number
   * @param {string} params.content SMS content
   * @returns {Promise<Object>} Send result
   */
  async send({ recipient, content }) {
    try {
      const formattedContent = formatSMSContent(content);
      
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`[SMS] To: ${recipient}, Content: ${formattedContent}`);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}