"use strict";

const   router = require("express").Router();
const   talentController = require("../controllers/talentController");



//All routes start with /talent 
router.get("/show", talentController.showView);

router.get("/new", talentController.new);
router.post("/create",talentController.validationChainCreate, talentController.validateCreate, talentController.redirectView);

router.get("/login", talentController.loginUpdate);
router.post("/login", talentController.validationChainLogIn, talentController.validateLogIn);

router.get("/edit-info", talentController.editInfo);
router.post("/update-info", talentController.validationChainUpdateInfo, talentController.validateUpdateInfo);

router.get("/edit-password", talentController.editPassword);
router.post("/update-password", talentController.validationChainUpdatePassword, talentController.validateUpdatePassword);

router.get("/signup", talentController.signUp);
router.post("/new", talentController.validationChainSignUp, talentController.validateSignUp);

router.get("/logout", talentController.logout, talentController.redirectView);

module.exports = router;
