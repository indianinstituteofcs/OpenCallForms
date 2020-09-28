"use strict";

const   router = require("express").Router();
const   talentRoutes = require("./talentRoutes");
const   homeRoutes = require("./homeRoutes");
const   errorRoutes = require("./errorRoutes");

/* Order is important. Search for routes depends on the order here.*/
router.use("/talent", talentRoutes);
router.use("/", homeRoutes);
router.use("/", errorRoutes);

module.exports = router;