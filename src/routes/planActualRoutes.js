const { Router } = require('express');
const planActualHandler = require('../handler/planActualHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.post('/plan', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.addPlan);
router.get('/plan', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.getPlan);
router.get('/plan/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.getPlanDetail);
router.put('/plan/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.editPlanDetail);
router.delete('/plan/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.deletePlan);

router.post('/actual', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.addActual);
router.get('/actual', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.getActual);
router.get('/actual/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.getActualDetail);
router.put('/actual/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.editActualDetail);
router.delete('/actual/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.deleteActual);

router.get('/planactual', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], planActualHandler.getPlanActual);

module.exports = router;
