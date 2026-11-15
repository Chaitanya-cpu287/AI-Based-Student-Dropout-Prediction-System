const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentControllers");

router.get("/:admission_id", studentController.getStudentProfile);
router.post("/:admission_id/refresh", studentController.refreshStudentPrediction);

module.exports = router;
