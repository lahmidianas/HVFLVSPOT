import { NotificationService } from '../services/notificationService.js';

const notificationService = new NotificationService();

export const sendNotification = async (req, res, next) => {
  try {
    const { type, content, channel } = req.body;
    const userId = req.user.userId;

    const notification = await notificationService.sendNotification({
      userId,
      type,
      content,
      channel
    });

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    const updatedPrefs = await notificationService.updatePreferences(
      userId,
      preferences
    );

    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const preferences = await notificationService.getPreferences(userId);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};