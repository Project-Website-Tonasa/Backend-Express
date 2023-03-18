const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const refreshTokenHandler = require('./refreshTokenHandler');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');
const AuthenticationError = require('../exceptions/authError');

const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = {
      text: 'SELECT id, username, password, role FROM users WHERE username=$1',
      values: [username],
    };
    const result = await pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError(`${username} tidak ditemukan`);
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      result.rows[0].password,
    );
    if (!passwordIsValid) {
      throw new AuthenticationError('Invalid Password!');
    }

    const token = jwt.sign({ user: result.rows[0].id }, process.env.SECRET, {
      expiresIn: 600,
    });

    const refreshToken = await refreshTokenHandler.createToken(result.rows[0]);

    return res.status(200).send({
      status: 'success',
      message: 'Login Success',
      userData: {
        id_user: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role,
      },
      token,
      refreshToken,
    });
  } catch (e) {
    if (e instanceof ClientError) {
      return res.status(e.statusCode).send({
        status: 'fail',
        message: e.message,
      });
    }

    return res.status(500).send({
      status: 'fail',
      message: 'Sorry there was a failure on our server.',
    });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    throw new InvariantError('Refresh token harus diisi');
  }
  try {
    const query = {
      text: 'SELECT * FROM refresh_token WHERE token=$1',
      values: [requestToken],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      throw new AuthenticationError('Sesi Anda telah habis atau token tidak valid. Mohon lakukan login kembali');
    }
    if (refreshTokenHandler.verifyExpiration(result.rows[0])) {
      const queryDelete = {
        text: 'DELETE FROM refresh_token WHERE id=$1',
        values: [result.rows[0].id],
      };
      await pool.query(queryDelete);
      throw new AuthenticationError('Sesi Anda telah habis atau token tidak valid. Mohon lakukan login kembali');
    }

    const queryUser = {
      text: 'SELECT username, id, role FROM users WHERE id=$1',
      values: [result.rows[0].id],
    };
    await pool.query(queryUser);
    const newAccessToken = jwt.sign({ user: result.rows[0].id_user }, process.env.SECRET, {
      expiresIn: 600,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Token updated!',
      token: newAccessToken,
      refreshToken: result.rows[0].token,
    });
  } catch (e) {
    if (e instanceof ClientError) {
      return res.status(e.statusCode).send({
        status: 'fail',
        message: e.message,
      });
    }

    return res.status(500).send({
      status: 'fail',
      message: 'Sorry there was a failure on our server.',
    });
  }
};

const logOut = async (req, res) => {
  try {
    // eslint-disable-next-line no-shadow
    const { refreshToken } = req.body;
    const qGetRefToken = {
      text: 'SELECT token FROM refresh_token WHERE token = $1',
      values: [refreshToken],
    };
    const resGetRef = await pool.query(qGetRefToken);
    if (!resGetRef.rows.length) {
      throw new NotFoundError('Token tidak ditemukan atau tidak valid');
    }

    const queryDelete = {
      text: 'DELETE FROM refresh_token WHERE token=$1',
      values: [refreshToken],
    };
    await pool.query(queryDelete);
    return res.status(201).json({
      status: 'success',
      message: 'Authentications has been removed',
    });
  } catch (e) {
    if (e instanceof ClientError) {
      return res.status(e.statusCode).send({
        status: 'fail',
        message: e.message,
      });
    }

    return res.status(500).send({
      status: 'error',
      messgae: e.message,
    });
  }
};

module.exports = {
  signIn,
  refreshToken,
  logOut,
};
