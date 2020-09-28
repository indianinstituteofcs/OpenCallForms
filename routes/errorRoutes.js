"use strict";

const   router = require("express").Router();
const   errorController = require("../controllers/errorController");


router.use(errorController.logErrors);
router.use(errorController.respondInternalError);
router.use(errorController.respondNoResourceFound);

module.exports = router;
