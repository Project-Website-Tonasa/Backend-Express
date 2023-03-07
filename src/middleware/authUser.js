const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).send({ message: 'Unauthorized! Access Token was expired!' });
  }

  return res.sendStatus(401).send({ message: 'Unauthorized!' });
};
// eslint-disable-next-line consistent-return
const verifyToken = (req, res, next) => {
  // eslint-disable-next-line dot-notation
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) {
    return res.status(403).send({
      message: 'No token provided!',
    });
  }

  // eslint-disable-next-line consistent-return
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: err.message,
      });
    }
    req.user = decoded;
    next();
  });
};

const isAdminOrStaff = async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT username, role, id FROM users WHERE id=$1;',
      values: [req.user.user],
    };
    const result = await pool.query(query);
    if (result.rows[0].role === 'admin' || result.rows[0].role === 'staff') {
      next();
      return;
    }
    res.status(403).json({ msg: 'Require admin or staff role!' });
    return;
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT username, role, id FROM users WHERE id=$1;',
      values: [req.user.user],
    };
    const result = await pool.query(query);
    if (result.rows[0].role === 'admin') {
      next();
      return;
    }
    res.status(403).json({ msg: 'Require admin role!' });
    return;
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const isAdminOrStafOrKontraktor = async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT username, role, id FROM users WHERE id=$1',
      values: [req.user.user],
    };

    const result = await pool.query(query);
    if (result.rows[0].role === 'kontraktor' || result.rows[0].role === 'admin' || result.rows[0].role === 'staff') {
      next();
      return;
    }
    res.status(403).json({ msg: 'Require Admin or Kontraktor Role!' });
    return;
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isAdminOrStafOrKontraktor,
  isAdminOrStaff,
  catchError,
};
