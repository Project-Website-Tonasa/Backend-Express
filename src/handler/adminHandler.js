const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');
const AuthenticationError = require('../exceptions/authError');

const getAllAdmin = async (req, res) => {
  try {
    const { pageSize, currentPage, search } = req.query;
    let qFilter;
    if (!search) {
      qFilter = "SELECT a.id_user, a.nama, a.sap, a.seksi, u.username FROM admin_staff AS a INNER JOIN users AS u ON a.id_user = u.id WHERE u.role='admin' ORDER BY LOWER(a.sap) ASC";
    } else {
      qFilter = `SELECT a.id_user, a.nama, a.sap, a.seksi, u.username FROM admin_staff AS a INNER JOIN users AS u ON a.id_user = u.id WHERE LOWER(a.nama) LIKE LOWER($1) OR LOWER(a.sap) LIKE LOWER('%${search}%') OR LOWER(a.seksi) LIKE LOWER('%${search}%') OR LOWER(u.username) LIKE LOWER('%${search}%') AND u.role='admin'  ORDER BY LOWER(a.sap) ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id_user) FROM (${qFilter})sub`);
      const totalPages = Math.ceil(totalRows.rows[0].count / pageSize);
      const offset = (currentPage - 1) * pageSize;
      result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(sap) ASC LIMIT ${pageSize} OFFSET ${offset};`);
      return res.status(200).send({
        status: 'success',
        data: result.rows,
        page: {
          page_size: pageSize,
          total_rows: totalRows.rows[0].count,
          total_pages: totalPages,
          current_page: currentPage,
        },
      });
    }
    result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(sap) ASC;`);

    return res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'fail',
      // message: "Sorry there was a failure on our server."
      message: e.message,
    });
  }
};

const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Number.isNaN(Number(id))) {
      throw new InvariantError('Gagal mengambil data admin. Mohon isi id admin dengan benar');
    }
    const query = {
      text: "SELECT a.id_user, a.nama, a.sap, a.seksi, u.username FROM admin_staff AS a INNER JOIN users AS u ON a.id_user = u.id WHERE id_user=$1 AND u.role='admin'",
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError(`Admin dengan id ${id} tidak ditemukan`);
    }

    return res.status(200).send({
      status: 'success',
      data: result.rows[0],

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

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      nama,
      sap,
      seksi,
      oldPass,
      newPass,
      confirmNewPass,
    } = req.body;

    // validate the body request
    const qGetUser = {
      text: 'SELECT role, password, id FROM users WHERE id=$1',
      values: [id],
    };
    const resGetUser = await pool.query(qGetUser);
    const dataGetUser = resGetUser.rows;

    if (!dataGetUser.length || dataGetUser[0].role !== 'admin') {
      throw new InvariantError('Gagal mengubah data admin. Akun ini bukan role admin atau akun tidak ditemukan');
    }

    const qGetAdminBySap = {
      text: 'SELECT sap, id_user FROM admin_staff WHERE sap = $1',
      values: [sap],
    };
    const resAdminBySap = await pool.query(qGetAdminBySap);
    const dataAdminBySap = resAdminBySap.rows;
    for (let i = 0; i < dataAdminBySap.length; i += 1) {
      if (dataAdminBySap[i] && dataAdminBySap[i].id_user !== parseInt(id, 10)) {
        throw new InvariantError('Gagal mengubah data admin. sap telah digunakan');
      }
    }

    // Update admin data
    const qUpUsername = {
      text: 'UPDATE users SET username = $1  WHERE id = $2 RETURNING *;',
      values: [username, id],
    };
    const resUpUsername = await pool.query(qUpUsername);

    const qUpAdmin = {
      text: 'UPDATE admin_staff SET nama = $1, sap = $2, seksi = $3  WHERE id_user = $4 RETURNING *',
      values: [nama, sap, seksi, id],
    };
    const resUpAdmin = await pool.query(qUpAdmin);

    if (oldPass && newPass && confirmNewPass) {
      const passwordIsValid = bcrypt.compareSync(
        oldPass,
        dataGetUser[0].password,
      );
      if (!passwordIsValid) {
        throw new AuthenticationError('Gagal mengubah password. Password lama salah');
      }
      const hashPassword = bcrypt.hashSync(newPass, 8);
      if (newPass !== confirmNewPass) {
        throw new InvariantError('Gagal mengubah password. Password baru dan Konfirmasi Password tidak sama');
      }
      const qUpdatePass = {
        text: 'UPDATE users SET password = $1  WHERE id = $2;',
        values: [hashPassword, id],
      };
      await pool.query(qUpdatePass);
    }

    return res.status(201).send({
      status: 'success',
      data: {
        username: resUpUsername.rows[0].username,
        nama: resUpAdmin.rows[0].nama,
        sap: resUpAdmin.rows[0].sap,
        seksi: resUpAdmin.rows[0].seksi,
      },
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
      message: e.message,
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    const {
      nama,
      sap,
      seksi,
      username,
      password,
      confirmPassword,
    } = req.body;
    if (password !== confirmPassword) {
      throw new InvariantError('Gagal membuat akun admin. Password dan konfirmasi password tidak sama');
    }

    const qGetUser = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };
    const resGetUser = await pool.query(qGetUser);
    if (resGetUser.rows.length) {
      throw new InvariantError('Gagal membuat akun admin. Username telah digunakan');
    }

    const qGetAdminBySap = {
      text: 'SELECT sap, id_user FROM admin_staff WHERE sap = $1',
      values: [sap],
    };
    const resAdminBySap = await pool.query(qGetAdminBySap);
    const dataAdminBySap = resAdminBySap.rows;
    for (let i = 0; i < dataAdminBySap.length; i += 1) {
      if (dataAdminBySap[i]) {
        throw new InvariantError('Gagal membuat akun admin. sap telah digunakan');
      }
    }

    const hashPassword = bcrypt.hashSync(password, 8);
    const qAddUser = {
      text: 'INSERT INTO users (id, username, password, role) VALUES (DEFAULT, $1, $2, $3) RETURNING *',
      values: [username, hashPassword, 'admin'],
    };
    const resUser = await pool.query(qAddUser);

    const qAdmin = {
      text: 'INSERT INTO admin_staff (id, nama, sap, seksi, id_user) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *',
      values: [nama, sap, seksi, resUser.rows[0].id],
    };
    const ressAdmin = await pool.query(qAdmin);

    return res.status(201).send({
      status: 'success',
      data: {
        username: resUser.rows[0].username,
        nama: ressAdmin.rows[0].nama,
        sap: ressAdmin.rows[0].sap,
        seksi: ressAdmin.rows[0].seksi,
      },
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
      message: e.message,
    });
  }
};

module.exports = {
  createAdmin,
  getAllAdmin,
  getAdminById,
  updateAdmin,
};
