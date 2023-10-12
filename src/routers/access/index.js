"use strict";

const express = require("express");
const AccessController = require("../../controllers/access.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");

const router = express.Router();

router.post("/shop/signup", asyncHandler(AccessController.signUp));
router.post("/shop/login", asyncHandler(AccessController.login));

//authen//
router.use(authentication);

//logout
router.post("/shop/logout", asyncHandler(AccessController.logout));
router.post(
  "/shop/handlerRefreshToken",
  asyncHandler(AccessController.handlerRefreshToken)
);

module.exports = router;
