const { Router } = require('express');
const laporanHandler = require('../handler/laporanHandler');
// const pup = require('../handler/pupeteer');
const uploadFile = require('../middleware/uploadFile');

const router = Router();

// KONTRAKTOR FEATURE
router.get('/laporan/:noProyek', laporanHandler.getLaporanByNoProyekKont);
router.post('/laporan/tambah', uploadFile.upload.single('file'), laporanHandler.createLaporan);
router.post('/lapHarian/tambah', laporanHandler.createLapHarian);
router.get('/detailLaporan/:id', laporanHandler.getLaporanDetail);
router.get('/detaillapHarian/:id', laporanHandler.getDetailLapHarian);
router.put('/detaillapHarian/:id', laporanHandler.editDetailLapHarian);
router.put('/laporan/edit/:id', uploadFile.upload.single('file'), laporanHandler.updateLaporan);

// STAFF OR ADMIN FEATURE
router.get('/laporan', laporanHandler.getAllLaporan);
router.put('/laporanReview/edit/:id', laporanHandler.updateStat);
router.delete('/laporan/:id', laporanHandler.deleteLaporan);
router.put('/bast/:noProyek', laporanHandler.updateBastStatus);
router.get('/download/:name', laporanHandler.download);
router.get('/preview/:name', laporanHandler.previewPdf);
// router.get('/testingpup', pup.test);

module.exports = router;
