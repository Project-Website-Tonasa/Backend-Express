const pool = require('../config/db');

const resPo = (data) => {
  const objData = data.map((obj) => (!obj.catatan_bast ? {
    ...obj,
    catatan_bast: '-',
  } : obj));
  return objData;
};

const getProyekByIdKontraktor = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { pageSize, currentPage, search } = req.query;

    let qFilter;
    if (!search) {
      qFilter = `SELECT k.id, d.no_proyek, d.nm_proyek, d.nm_rekanan, d.status_bast1, d.catatan_bast FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE k.id_user = '${idUser}' ORDER BY LOWER(d.no_proyek) ASC`;
    } else {
      qFilter = `SELECT k.id, d.no_proyek, d.nm_proyek, d.nm_rekanan, d.status_bast1, d.catatan_bast FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE LOWER(d.no_proyek) LIKE LOWER('%${search}%') OR LOWER(d.nm_proyek) LIKE LOWER('%${search}%') OR LOWER(d.nm_rekanan) LIKE LOWER('%${search}%') AND k.id_user = '${idUser}'  ORDER BY LOWER(d.no_proyek) ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id) FROM (${qFilter})sub`);
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
    const data = resPo(result.rows);
    return res.status(200).send({
      status: 'success',
      data,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const getAllProyek = async (req, res) => {
  try {
    const { pageSize, currentPage, search } = req.query;

    let qFilter;
    if (!search) {
      qFilter = "SELECT k.id, d.no_proyek, d.nm_proyek, d.nm_rekanan, d.status_bast1, d.catatan_bast FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE d.status_bast1 IN ('Approved', 'Pending', 'Reject', 'Request') ORDER BY LOWER(d.no_proyek) ASC";
    } else {
      qFilter = `SELECT k.id, d.no_proyek, d.nm_proyek, d.nm_rekanan, d.status_bast1, d.catatan_bast FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE LOWER(d.nm_proyek) LIKE LOWER('%${search}%') OR LOWER(d.no_proyek) LIKE LOWER('%${search}%') OR LOWER(d.nm_rekanan) LIKE LOWER('%${search}%') AND d.status_bast1 IN ('Approved', 'Pending', 'Reject', 'Request') ORDER BY LOWER(d.no_proyek) ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id) FROM (${qFilter})sub`);
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
    const data = resPo(result.rows);
    return res.status(200).send({
      status: 'success',
      data,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const getProyekByNoProyek = async (req, res) => {
  try {
    const { noProyek } = req.params;
    const query = {
      text: 'SELECT k.id, d.no_proyek, d.nm_proyek, d.nm_rekanan, d.status_bast1, d.catatan_bast FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE d.no_proyek = $1 ORDER BY LOWER(d.no_proyek) ASC',
      values: [noProyek],
    };
    const result = await pool.query(query);
    const data = resPo(result.rows);
    return res.status(200).send({
      status: 'success',
      data,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

module.exports = {
  getProyekByIdKontraktor,
  getAllProyek,
  getProyekByNoProyek,
};
