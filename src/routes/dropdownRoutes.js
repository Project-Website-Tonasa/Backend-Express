const { Router } = require('express');
const dropdownHandler = require('../handler/dropdown');
const authJwt = require('../middleware/authUser');

const router = Router();

router.get('/dropdown/proyek', dropdownHandler.dropdownProyek);
router.get('/dropdown/kontraktor', dropdownHandler.dropdownKontraktor);
router.get('/search', [authJwt.verifyToken, authJwt.isAdminOrStafOrKontraktor], dropdownHandler.searchProyek);

module.exports = router;
