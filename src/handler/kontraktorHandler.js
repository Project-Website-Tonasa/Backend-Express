const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');
const AuthenticationError = require('../exceptions/authError');

const resLap = (data) => {
  const objData = data.map((obj) => (!obj.klasifikasi ? {
    ...obj,
    klasifikasi: '-',
  } : obj));

  return objData;
};

const arraySeparator = (arrData) => {
  let arrDataStr = '';
  for (let i = 0; i < arrData.length; i += 1) {
    if (i === arrData.length - 1) {
      arrDataStr += `'${(arrData[i])}'`;
    } else {
      arrDataStr += `'${(arrData[i])}',`;
    }
  }
  return arrDataStr;
};

const getAllKontraktor = async (req, res) => {
  try {
    const { pageSize, currentPage, search } = req.query;
    let qFilter;
    if (!search) {
      qFilter = "SELECT u.id AS id_user, u.username , d.no_proyek, d.nm_proyek, d.nm_rekanan, d.klasifikasi, d.nm_lokasi FROM users AS u INNER JOIN kontraktor_conn AS k ON u.id = k.id_user INNER JOIN data AS d ON d.id_datum = k.id_datum WHERE role = 'kontraktor' ORDER BY LOWER(d.no_proyek) ASC";
    } else {
      qFilter = `SELECT u.id AS id_user, u.username , d.no_proyek, d.nm_proyek, d.nm_rekanan, d.klasifikasi, d.nm_lokasi FROM users AS u INNER JOIN kontraktor_conn AS k ON u.id = k.id_user INNER JOIN data AS d ON d.id_datum = k.id_datum WHERE LOWER(d.no_proyek) LIKE LOWER('%${search}%') OR LOWER(d.nm_proyek) LIKE LOWER('%${search}%') OR LOWER(d.nm_rekanan) LIKE LOWER('%${search}%') OR LOWER(d.klasifikasi)OR LOWER(d.nm_lokasi) LIKE LOWER('%${search}%') LIKE LOWER('%${search}%') AND role = 'kontraktor' ORDER BY LOWER(d.no_proyek) ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id_user) FROM (${qFilter})sub`);
      const totalPages = Math.ceil(totalRows.rows[0].count / pageSize);
      const offset = (currentPage - 1) * pageSize;

      result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(no_proyek) ASC LIMIT ${pageSize} OFFSET ${offset};`);

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
    result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(no_proyek) ASC;`);

    return res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const getKontraktorById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = {
      text: "SELECT u.id AS id_user, u.username , d.no_proyek, d.nm_proyek, d.nm_rekanan, d.klasifikasi, d.nm_lokasi FROM users AS u INNER JOIN kontraktor_conn AS k ON u.id = k.id_user INNER JOIN data AS d ON d.id_datum = k.id_datum WHERE role = 'kontraktor' AND u.id = $1",
      values: [id],
    };
    const result = await pool.query(query);

    // Check if data is null
    if (!result.rows.length) {
      throw new NotFoundError(`Gagal menampilkan data kontraktor. Kontraktor dengan ${id} tidak ditemukan`);
    }

    const data = resLap(result.rows);
    return res.status(200).send({
      status: 'success',
      data,

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

const createKontraktor = async (req, res) => {
  try {
    const {
      noProyek,
      username,
      password,
      confirmPassword,
    } = req.body;

    const noProyekStr = arraySeparator(noProyek);
    const qGetData = {
      text: `SELECT id_datum, no_proyek FROM data WHERE no_proyek in (${noProyekStr}) ORDER BY id_datum ASC`,
    };
    const resData = await pool.query(qGetData);

    const idDatum = [];
    for (let i = 0; i < noProyek.length; i += 1) {
      if (!resData.rows[i]) {
        throw new InvariantError(`noProyek ${noProyek[i]} tidak valid`);
      }
      idDatum.push(resData.rows[i].id_datum);
    }

    const arrIdStr = arraySeparator(idDatum);
    const qGetKon = {
      text: `SELECT k.id_datum, k.id_user, d.no_proyek FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE k.id_datum in (${arrIdStr}) ORDER BY id_datum ASC`,
    };
    const resKon = await pool.query(qGetKon);
    for (let i = 0; i < resKon.rows.length; i += 1) {
      if (resKon.rows[i]) {
        throw new InvariantError(`Gagal membuat akun kontraktor. noProyek ${resKon.rows[i].no_proyek} telah digunakan di akun kontraktor lain`);
      }
    }

    const hashPassword = bcrypt.hashSync(password, 8);
    if (password !== confirmPassword) {
      throw new InvariantError('Gagal membuat akun kontraktor. Password dan konfirmasi password tidak sama');
    }

    const qAddUser = {
      text: 'INSERT INTO users (id, username, password, role) VALUES (DEFAULT, $1, $2, $3) RETURNING id;',
      values: [username, hashPassword, 'kontraktor'],
    };
    const resUser = await pool.query(qAddUser);

    const promises = [];
    let qNoKontrak;
    for (let i = 0; i < resData.rows.length; i += 1) {
      qNoKontrak = {
        text: 'INSERT INTO kontraktor_conn (id, id_datum, id_user) VALUES (DEFAULT, $1, $2)',
        values: [
          resData.rows[i].id_datum,
          resUser.rows[0].id,
        ],
      };

      promises.push(pool.query(qNoKontrak));
    }
    await Promise.all(promises);

    return res.status(201).send({
      status: 'success',
      message: 'Register Successfull!',
    });
  } catch (e) {
    if (e instanceof ClientError) {
      return res.status(400).send({
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

const updateKontraktor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      noProyek,
      username,
      oldPass,
      newPass,
      confirmNewPass,
    } = req.body;

    const qGetUser = {
      text: 'SELECT id, password, role FROM users WHERE id=$1',
      values: [id],
    };
    const resGetUser = await pool.query(qGetUser);
    const dataGetUser = resGetUser.rows;
    if (!dataGetUser.length || dataGetUser[0].role !== 'kontraktor') {
      throw new InvariantError('Gagal mengubah data kontraktor. Akun ini bukan role kontraktor atau akun tidak ditemukan');
    }

    const noProyekStr = arraySeparator(noProyek);
    const qGetData = {
      text: `SELECT id_datum, no_proyek FROM data WHERE no_proyek in (${noProyekStr}) ORDER BY id_datum ASC`,
    };
    const resData = await pool.query(qGetData);
    const idDatum = [];
    for (let i = 0; i < noProyek.length; i += 1) {
      if (!resData.rows[i]) {
        throw new InvariantError(`noProyek ${noProyek[i]} tidak valid`);
      }
      idDatum.push(resData.rows[i].id_datum);
    }

    const arrIdStr = arraySeparator(idDatum);
    const qGetKon = {
      text: `SELECT k.id_datum, k.id_user, d.no_proyek FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE k.id_datum in (${arrIdStr}) ORDER BY id_datum ASC`,
    };
    const resKon = await pool.query(qGetKon);
    for (let i = 0; i < resKon.rows.length; i += 1) {
      // eslint-disable-next-line radix
      if (resKon.rows[i].id_user !== parseInt(id) && resKon.rows[i]) {
        throw new InvariantError(`Gagal mengubah data kontraktor. noProyek ${resKon.rows[i].no_proyek} telah digunakan di akun kontraktor lain`);
      }
    }

    const qUpUsername = {
      text: 'UPDATE users SET username = $1  WHERE id = $2;',
      values: [username, id],
    };
    await pool.query(qUpUsername);

    const qDelKontrak = {
      text: 'DELETE FROM kontraktor_conn WHERE id_user = $1',
      values: [id],
    };
    await pool.query(qDelKontrak);

    const promises = [];
    let qNoKontrak;
    for (let i = 0; i < resData.rows.length; i += 1) {
      qNoKontrak = {
        text: 'INSERT INTO kontraktor_conn (id, id_datum, id_user) VALUES (DEFAULT, $1, $2)',
        values: [
          resData.rows[i].id_datum,
          id,
        ],
      };
      promises.push(pool.query(qNoKontrak));
    }
    await Promise.all(promises);

    if (oldPass && newPass && confirmNewPass) {
      const passwordIsValid = bcrypt.compareSync(
        oldPass,
        dataGetUser[0].password,
      );
      // If the password is not valid, send the error message
      if (!passwordIsValid) {
        throw new AuthenticationError('Gagal mengubah password. Password lama salah');
      }
      if (newPass !== confirmNewPass) {
        throw new InvariantError('Gagal mengubah password. Password baru dan Konfirmasi Password tidak sama');
      }

      const hashPassword = bcrypt.hashSync(newPass, 8);
      const qUpdatePass = {
        text: 'UPDATE users SET password = $1  WHERE id = $2;',
        values: [hashPassword, id],
      };
      await pool.query(qUpdatePass);
    }

    return res.status(201).send({
      status: 'success',
      message: 'Kontraktor has been updated',
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

const deleteKontraktor = async (req, res) => {
  try {
    const { id } = req.params;
    const queryKontraktor = {
      text: 'SELECT * FROM kontraktor_conn WHERE id_user = $1',
      values: [id],
    };
    const resKontraktor = await pool.query(queryKontraktor);
    if (!resKontraktor.rows[0]) {
      throw new NotFoundError(`Gagal menghapus data kontraktor. Kontraktor dengan ${id} tidak ditemukan`);
    }
    const queryDelete = {
      text: 'DELETE FROM users WHERE id=$1',
      values: [id],
    };
    await pool.query(queryDelete);
    return res.status(201).send({
      status: 'success',
      message: 'User has been removed',
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
  createKontraktor,
  getAllKontraktor,
  getKontraktorById,
  deleteKontraktor,
  updateKontraktor,
};
