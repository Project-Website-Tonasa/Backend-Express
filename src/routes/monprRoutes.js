const { Router } = require('express');
const monPrHandler = require('../handler/monprHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/monpr', [authJwt.verifyToken, authJwt.isAdminOrStaff], monPrHandler.getMonitoringPR);
router.post('/monpr', [authJwt.verifyToken, authJwt.isAdminOrStaff], monPrHandler.addMonitoringPR);
router.get('/monpr/:idMonitor', [authJwt.verifyToken, authJwt.isAdminOrStaff], monPrHandler.getDetailMonPr);
router.put('/monpr/:idMonitor', [authJwt.verifyToken, authJwt.isAdminOrStaff], monPrHandler.editMonPr);
router.delete('/monpr/:idMonitor', [authJwt.verifyToken, authJwt.isAdminOrStaff], monPrHandler.deleteMonPr);

module.exports = router;
