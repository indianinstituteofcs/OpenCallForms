"use strict";

const   router = require("express").Router();
const   homeController = require("../controllers/homeController");

router.get("/", homeController.getRoot);
router.get("/submitted-talent", homeController.getAllTalent);

module.exports = router;

