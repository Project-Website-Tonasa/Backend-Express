const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');

const resBeautifier = (data) => {
  const dataobj = data;
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  dataobj.pr_valprice_str = (Number(dataobj.pr_valprice)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

  if (dataobj.pr_date) {
    dataobj.pr_date = (dataobj.pr_date).toLocaleString('id-ID', options);
  }

  Object.keys(dataobj).forEach((key) => {
    if (dataobj[key] == null) { dataobj[key] = ''; }
  });

  return dataobj;
};

const addMonitoringPR = async (req, res) => {
  try {
    const {
      tahun, prDate, prNumber, description, prValprice, collStatus,
      opexCapex, notifikasi, purchaseOrder,
    } = req.body;

    let pic;
    if (collStatus === 'PO') {
      pic = 'KONSTRUKSI';
    } else if (collStatus === 'ECE/BOQ NOT OK') {
      pic = 'USER';
    } else if (collStatus === 'APROVAL PR' || collStatus === 'SUBMIT EPROC' || collStatus === 'EVALTEK' || collStatus === 'EVAL ECE') {
      pic = 'RB/CAPEX';
    } else if (collStatus === 'TENDER' || collStatus === 'EVALKOM') {
      pic = 'PENGADAAN';
    } else {
      throw new InvariantError('Gagal Menambahkan data. Mohon isi coll Status dengan benar.');
    }

    const queryInsert = {
      text: 'INSERT INTO monitoring_pr (id_monitor, tahun, pr_date, pr_number, description, pr_valprice, coll_status, opex_capex, notifikasi, purchase_order, pic) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;',
      values: [
        tahun, prDate, prNumber, description, prValprice, collStatus,
        opexCapex, notifikasi, purchaseOrder, pic,
      ],
    };

    let poolRes;

    try {
      poolRes = await pool.query(queryInsert);
      poolRes.rows[0] = resBeautifier(poolRes.rows[0]);
    } catch (e) {
      throw new InvariantError(e);
    }

    return res.status(201).send({
      status: 'success',
      message: 'Berhasil menambahkan data Monitoring PR baru',
      data: poolRes.rows[0],
    });
  } catch (e) {
    console.error(e);

    if (e instanceof ClientError) {
      return res.status(400).send({
        status: 'fail',
        message: e.message,
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Gagal menambahkan data Monitoring PR',
    });
  }
};

const getMonitoringPR = async (req, res) => {
  try {
    const { pageSize, currentPage } = req.query;

    // PAGINATION
    if (pageSize && currentPage) {
      const totalRows = await pool.query('SELECT COUNT (id_monitor) FROM monitoring_pr;');
      // console.log('Total Rows:', totalRows.rows[0].count);
      const totalPages = Math.ceil(totalRows.rows[0].count / pageSize);
      const offset = (currentPage - 1) * pageSize;

      const queryGet = {
        text: `SELECT * FROM monitoring_pr ORDER BY id_monitor LIMIT ${pageSize} OFFSET ${offset}`,
      };
      const data = await pool.query(queryGet);

      for (let i = 0; i < (data.rows).length; i += 1) {
        data.rows[i] = resBeautifier(data.rows[i]);
      }
      return res.status(200).send({
        status: 'success',
        data: data.rows,
        page: {
          page_size: pageSize,
          total_rows: totalRows.rows[0].count,
          total_pages: totalPages,
          current_page: currentPage,
        },
      });
    }

    // TANPA PAGINATION
    const queryGet = {
      text: 'SELECT * FROM monitoring_pr ORDER BY id_monitor',
    };
    const data = await pool.query(queryGet);

    for (let i = 0; i < (data.rows).length; i += 1) {
      data.rows[i] = resBeautifier(data.rows[i]);
    }
    return res.status(200).send({
      status: 'success',
      data: data.rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      status: 'error',
      message: `Gagal mengambil data. ${e.message}`,
    });
  }
};

const getDetailMonPr = async (req, res) => {
  try {
    const { idMonitor } = req.params;

    if (Number.isNaN(Number(idMonitor))) {
      throw new InvariantError('Gagal mengambil data. Mohon isi idMonitor proyek dengan benar');
    }

    const queryGet = {
      text: 'SELECT * FROM monitoring_pr WHERE id_monitor = $1',
      values: [idMonitor],
    };
    const poolRes = await pool.query(queryGet);

    if (!(poolRes.rows[0])) {
      throw new NotFoundError(`Data dengan id: ${idMonitor} tidak ditemukan`);
    }
    poolRes.rows[0] = resBeautifier(poolRes.rows[0]);

    return res.status(200).send({
      status: 'success',
      data: poolRes.rows[0],
    });
  } catch (e) {
    console.error(e);

    if (e instanceof ClientError) {
      return res.status(400).send({
        status: 'fail',
        message: e.message,
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengambil data Monitoring PR',
    });
  }
};

const editMonPr = async (req, res) => {
  try {
    const { idMonitor } = req.params;

    if (!idMonitor || Number.isNaN(Number(idMonitor))) {
      throw new InvariantError('Gagal mengedit data. Mohon isi idMonitor proyek dengan benar');
    }

    const {
      tahun, prDate, prNumber, description, prValprice, collStatus,
      opexCapex, notifikasi, purchaseOrder,
    } = req.body;

    let pic;
    if (collStatus === 'PO') {
      pic = 'KONSTRUKSI';
    } else if (collStatus === 'ECE/BOQ NOT OK') {
      pic = 'USER';
    } else if (collStatus === 'APROVAL PR' || collStatus === 'SUBMIT EPROC' || collStatus === 'EVALTEK' || collStatus === 'EVAL ECE') {
      pic = 'RB/CAPEX';
    } else if (collStatus === 'TENDER' || collStatus === 'EVALKOM') {
      pic = 'PENGADAAN';
    } else {
      throw new InvariantError('Gagal Menambahkan data. Mohon isi coll Status dengan benar.');
    }

    const queryInsert = {
      text: 'UPDATE monitoring_pr SET tahun = $1, pr_date = $2, pr_number = $3, description = $4, pr_valprice = $5, coll_status = $6, opex_capex = $7, notifikasi = $8, purchase_order = $9, pic = $10 WHERE id_monitor = $11 RETURNING *;',
      values: [
        tahun, prDate, prNumber, description, prValprice, collStatus,
        opexCapex, notifikasi, purchaseOrder, pic, idMonitor,
      ],
    };

    let poolRes;

    try {
      poolRes = await pool.query(queryInsert);
    } catch (e) {
      throw new InvariantError(e);
    }
    if (!poolRes.rows[0]) {
      throw new NotFoundError(`Tidak dapat menemukan data Monitoring PR ${idMonitor}`);
    }
    poolRes.rows[0] = resBeautifier(poolRes.rows[0]);

    return res.status(201).send({
      status: 'success',
      message: 'Berhasil mengedit data Monitoring PR',
      data: poolRes.rows[0],
    });
  } catch (e) {
    console.error(e);

    if (e instanceof ClientError) {
      return res.status(400).send({
        status: 'fail',
        message: e.message,
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengedit data Monitoring PR',
    });
  }
};

const deleteMonPr = async (req, res) => {
  try {
    const { idMonitor } = req.params;

    if (!idMonitor || Number.isNaN(Number(idMonitor))) {
      throw new InvariantError('Gagal menghapus data Monitoring PR. Mohon isi idMonitor proyek dengan benar');
    }

    const queryDel = {
      text: 'DELETE FROM monitoring_pr WHERE id_monitor = $1 RETURNING description',
      values: [idMonitor],
    };
    const poolDel = await pool.query(queryDel);

    if (!(poolDel.rows[0])) {
      throw new NotFoundError(`Data Monitoring PR dengan id: ${idMonitor} tidak ditemukan`);
    }

    return res.status(200).send({
      status: 'success',
      message: `Data Monitoring PR ${poolDel.rows[0].description} berhasil dihapus`,
    });
  } catch (e) {
    console.error(e);

    if (e instanceof ClientError) {
      return res.status(400).send({
        status: 'fail',
        message: e.message,
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Gagal menghapus data Monitoring PR',
    });
  }
};

module.exports = {
  getMonitoringPR, addMonitoringPR, getDetailMonPr, editMonPr, deleteMonPr,
};
