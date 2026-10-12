const watchlistService = require('../services/watchlist.service');

async function list(req, res, next) {
  try {
    const data = await watchlistService.getWatchlist(req.user.id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getIds(req, res, next) {
  try {
    const ids = await watchlistService.getWatchlistIds(req.user.id);
    return res.status(200).json({
      status: 'success',
      data: { ids, shipmentIds: ids },
    });
  } catch (error) {
    next(error);
  }
}

async function add(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const result = await watchlistService.addToWatchlist(req.user.id, shipmentId);
    return res.status(201).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const result = await watchlistService.removeFromWatchlist(req.user.id, shipmentId);
    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
}

module.exports = {
  list,
  getIds,
  add,
  remove,
};
