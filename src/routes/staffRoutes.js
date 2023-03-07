const { Router } = require('express');
const staffHandler = require('../handler/staffhandler');
const authJwt = require('../middleware/authUser');

const router = Router();

router.post('/staff/tambah', [authJwt.verifyToken, authJwt.isAdmin], staffHandler.createStaff);
router.get('/staff', [authJwt.verifyToken, authJwt.isAdmin], staffHandler.getAllStaff);
router.get('/staff/:id', [authJwt.verifyToken, authJwt.isAdmin], staffHandler.getStaffById);
router.delete('/staff/:id', [authJwt.verifyToken, authJwt.isAdmin], staffHandler.deleteStaff);
router.put('/staff/:id', [authJwt.verifyToken, authJwt.isAdminOrStaff], staffHandler.updateStaff);

module.exports = router;
