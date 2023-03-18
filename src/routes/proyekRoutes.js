const { Router } = require('express');
const laporanHandler = require('../handler/proyekHandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/proyek', [authJwt.verifyToken, authJwt.isAdminOrStaff], laporanHandler.getAllProyek);
router.get('/proyek/:idUser', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], laporanHandler.getProyekByIdKontraktor);
router.get('/detproyek/:noProyek', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], laporanHandler.getProyekByNoProyek);

module.exports = router;
