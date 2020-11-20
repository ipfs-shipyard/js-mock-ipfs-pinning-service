'use strict'

var varpinsrequestidController = require('./pinsrequestidControllerService');

module.exports.funcpinsrequestidPARAMETERS = function funcpinsrequestidPARAMETERS(req, res, next) {
  varpinsrequestidController.funcpinsrequestidPARAMETERS(req.swagger.params, res, next);
};

module.exports.funcpinsrequestidGET = function funcpinsrequestidGET(req, res, next) {
  varpinsrequestidController.funcpinsrequestidGET(req.swagger.params, res, next);
};

module.exports.funcpinsrequestidPOST = function funcpinsrequestidPOST(req, res, next) {
  varpinsrequestidController.funcpinsrequestidPOST(req.swagger.params, res, next);
};

module.exports.funcpinsrequestidDELETE = function funcpinsrequestidDELETE(req, res, next) {
  varpinsrequestidController.funcpinsrequestidDELETE(req.swagger.params, res, next);
};