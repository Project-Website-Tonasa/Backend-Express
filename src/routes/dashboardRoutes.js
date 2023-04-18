const { Router } = require('express');
const dashboardHandler = require('../handler/dashboardHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/stat/data', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dashboardHandler.getStatistikbyDataStatus);
router.get('/stat/planactual/:id_datum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dashboardHandler.getStatistikPlanVsActual);
router.get('/stat/monPr', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getStatistikMonPr);
router.get('/stat/picpr', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getStatistikPrKonstruksi);
router.get('/stat/pko', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getStatistikPko);
router.get('/stat/progress', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getProgress);
router.get('/stat/progress/listproyek', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getListProyekByProgress);
router.get('/stat/data/listproyek', [authJwt.verifyToken, authJwt.isAdminOrStaff], dashboardHandler.getListProyekByStatus);

module.exports = router;
