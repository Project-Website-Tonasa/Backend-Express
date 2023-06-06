const { Router } = require('express');
const proyekHandler = require('../handler/proyekHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/proyek', [authJwt.verifyToken, authJwt.isAdminOrStaff], proyekHandler.getAllProyek);
router.get('/proyek/:idUser', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], proyekHandler.getProyekByIdKontraktor);
router.get('/detproyek/:noProyek', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], proyekHandler.getProyekByNoProyek);

module.exports = router;
