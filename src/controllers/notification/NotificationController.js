import { NotificationService } from '../../services/notification/NotificationService.js';

/**
 * Controller for handling notification-related requests
 */
export class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send a notification
   */
  async sendNotification(req, res, next) {
    try {
      const { type, content, channel } = req.body;
      const userId = req.user.id;

      const notification = await this.notificationService.sendNotification({
        userId,
        type,
        content,
        channel
      });

      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      const updatedPrefs = await this.notificationService.updatePreferences(
        userId,
        preferences
      );

      res.json(updatedPrefs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = await this.notificationService.getPreferences(userId);
      res.json(preferences);
    } catch (error) {
      next(error);
    }
  }
}