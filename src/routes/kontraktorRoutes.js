const { Router } = require('express');
const kontraktorHandler = require('../handler/kontraktorHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.post('/kontraktor/tambah', [authJwt.verifyToken, authJwt.isAdminOrStaff], kontraktorHandler.createKontraktor);
router.get('/kontraktor', [authJwt.verifyToken, authJwt.isAdminOrStaff], kontraktorHandler.getAllKontraktor);
router.get('/kontraktor/:id', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], kontraktorHandler.getKontraktorById);
router.delete('/kontraktor/:id', [authJwt.verifyToken, authJwt.isAdminOrStaff], kontraktorHandler.deleteKontraktor);
router.put('/kontraktor/:id', kontraktorHandler.updateKontraktor);

module.exports = router;
