const { Router } = require('express');
const pkoHandler = require('../handler/pkoHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/pko', [authJwt.verifyToken, authJwt.isAdminOrStaff], pkoHandler.getPko);
router.post('/pko', [authJwt.verifyToken, authJwt.isAdminOrStaff], pkoHandler.addPko);
router.get('/pko/:idPko', [authJwt.verifyToken, authJwt.isAdminOrStaff], pkoHandler.getDetailPko);
router.put('/pko/:idPko', [authJwt.verifyToken, authJwt.isAdminOrStaff], pkoHandler.editPko);
router.delete('/pko/:idPko', [authJwt.verifyToken, authJwt.isAdminOrStaff], pkoHandler.deletePko);

module.exports = router;
