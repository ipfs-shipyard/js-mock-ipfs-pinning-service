'use strict'

var varpinsController = require('./pinsControllerService');

module.exports.funcpinsGET = function funcpinsGET(req, res, next) {
  varpinsController.funcpinsGET(req.swagger.params, res, next);
};

module.exports.funcpinsPOST = function funcpinsPOST(req, res, next) {
  varpinsController.funcpinsPOST(req.swagger.params, res, next);
};