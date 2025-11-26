import { PreferencesService } from '../../services/notification/PreferencesService.js';

export class PreferencesController {
  constructor() {
    this.preferencesService = new PreferencesService();
  }

  /**
   * Get user preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const preferences = await this.preferencesService.getPreferences(userId);
      res.json(preferences);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const preferences = req.body;
      
      const updatedPrefs = await this.preferencesService.updatePreferences(
        userId,
        preferences
      );
      
      res.json(updatedPrefs);
    } catch (error) {
      next(error);
    }
  }
}