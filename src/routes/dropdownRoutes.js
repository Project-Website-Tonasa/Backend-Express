const { Router } = require('express');
const dropdownHandler = require('../handler/dropdown');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/dropdown/proyek', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dropdownHandler.dropdownProyek);
router.get('/dropdown/kontraktor', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dropdownHandler.dropdownKontraktor);
router.get('/search', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dropdownHandler.searchProyek);

module.exports = router;
