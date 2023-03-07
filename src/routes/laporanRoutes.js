const { Router } = require('express');
const laporanHandler = require('../handler/laporanHandler');
// const pup = require('../handler/pupeteer');
const uploadFile = require('../middleware/uploadFile');
const authJwt = require('../middleware/authUser');

const router = Router();

// KONTRAKTOR FEATURE
router.get('/laporan/:noProyek', laporanHandler.getLaporanByNoProyekKont);
router.post('/laporan/tambah', uploadFile.upload.single('file'), laporanHandler.createLaporan);
router.post('/lapHarian/tambah', laporanHandler.createLapHarian);
router.get('/detailLaporan/:id', laporanHandler.getLaporanDetail);
router.get('/detaillapHarian/:id', laporanHandler.getDetailLapHarian);
router.put('/detaillapHarian/:id', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], laporanHandler.editDetailLapHarian);
router.put('/laporan/edit/:id', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], uploadFile.upload.single('file'), laporanHandler.updateLaporan);

// STAFF OR ADMIN FEATURE
router.get('/laporan', laporanHandler.getAllLaporan);
router.put('/laporanReview/edit/:id', [authJwt.verifyToken, authJwt.isAdminOrStaff], laporanHandler.updateStat);
router.delete('/laporan/:id', [authJwt.verifyToken, authJwt.isAdminOrStaff], laporanHandler.deleteLaporan);
router.put('/bast/:noProyek', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], laporanHandler.updateBastStatus);
router.get('/download/:name', [authJwt.verifyToken, authJwt.isAdminOrStaff], laporanHandler.download);
router.get('/preview/:name', laporanHandler.previewPdf);
// router.get('/testingpup', pup.test);

module.exports = router;
