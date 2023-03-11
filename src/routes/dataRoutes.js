const { Router } = require('express');
const dataHandler = require('../handler/dataHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/data', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.getData);
router.get('/data/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.getDatum);
router.post('/data', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.addDatum);
router.put('/data/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.editDatum);
router.delete('/data/:idDatum', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.deleteDatum);
router.delete('/data', [authJwt.verifyToken, authJwt.isAdminOrStaff], dataHandler.deleteDatum);

module.exports = router;
