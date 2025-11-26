/**
 * Format content for email notifications
 * @param {string} content Raw content
 * @returns {string} Formatted email content
 */
export const formatEmailContent = (content) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      ${content}
    </div>
  `.trim();
};

/**
 * Format content for push notifications
 * @param {string} content Raw content
 * @returns {string} Formatted push content
 */
export const formatPushContent = (content) => {
  return content.length > 100 ? `${content.substring(0, 97)}...` : content;
};

/**
 * Format content for SMS notifications
 * @param {string} content Raw content
 * @returns {string} Formatted SMS content
 */
export const formatSMSContent = (content) => {
  return content.length > 160 ? `${content.substring(0, 157)}...` : content;
};