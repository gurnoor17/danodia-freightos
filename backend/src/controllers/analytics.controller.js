const analyticsService = require('../services/analytics.service');

async function getAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAnalytics(req.user.id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalytics,
};
