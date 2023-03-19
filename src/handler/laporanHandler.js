const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
// import fetch from "node-fetch";
const hbs = require('handlebars');
const fse = require('fs-extra');
const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');

const baseUrl = 'https://api.unitworkshopst.com/';
const compilehtml = async (data) => {
  const filehtml = path.join(process.cwd(), 'resources\\', 'formGeneratePDF.hbs');
  const file = await fse.readFile(filehtml, 'utf8');

  return hbs.compile(file)(data);
};

const fetchData = async (idLap, token) => {
  const myHeaders = new fetch.Headers();
  myHeaders.append('Authorization', token);
  const setting = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
  };
  const response = await fetch(`http://localhost:3000/detaillapHarian/${idLap}`, setting);
  // const response = await fetch(url, setting);
  const dataLap = await response.json();
  console.log('ini datanyaa', dataLap.data);
  return dataLap.data;
};

const resAllLap = (data) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  let objData = data.map((obj) => (typeof (obj.id) === 'number' ? {
    ...obj,
    file: {
      download: `${baseUrl}download/${obj.file}`,
      preview: `${baseUrl}preview/${obj.file}`,
    },
    created_at: (obj.created_at).toLocaleString('id-ID', options),
  } : obj));

  objData = objData.map((obj) => (!obj.catatan ? {
    ...obj,
    catatan: '-',
  } : obj));

  objData = objData.map((obj) => (obj.urutan_lap ? {
    ...obj,
    jenis_laporan: `${obj.jenis_laporan} ke-${obj.urutan_lap}`,
  } : obj));

  objData = objData.map((obj) => (!obj.stat_laphar ? {
    ...obj,
    stat_laphar: '',
  } : obj));
  return objData;
};

const resLap = (data) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  let objData = data.map((obj) => (!obj.catatan ? {
    ...obj,
    catatan: '-',
  } : obj));

  objData = objData.map((obj) => (obj.urutan_lap ? {
    ...obj,
    jenis_laporan: `${obj.jenis_laporan} ke-${obj.urutan_lap}`,
  } : obj));

  objData = objData.map((obj) => (!obj.stat_laphar ? {
    ...obj,
    stat_laphar: '',
  } : obj));
  objData = data.map((obj) => (typeof (obj.id) === 'number' ? {
    ...obj,
    created_at: (obj.created_at).toLocaleString('id-ID', options),
  } : obj));
  objData = objData.map((obj) => (!obj.catatan ? {
    ...obj,
    catatan: '-',
  } : obj));
  objData = objData.map((obj) => (obj.urutan_lap ? {
    ...obj,
    jenis_laporan: `${obj.jenis_laporan} ke-${obj.urutan_lap}`,
  } : obj));
  objData = objData.map((obj) => (!obj.stat_laphar ? {
    ...obj,
    stat_laphar: '',
  } : obj));
  return objData;
};

const createLaporan = async (req, res) => {
  try {
    const namaFile = req.file.filename;
    const {
      jenisLaporan,
      urutanLap,
      noProyek,
      idUser,
    } = req.body;

    if (!namaFile || !jenisLaporan || !noProyek) {
      throw new InvariantError('Semua field wajib diisi!');
    }
    if (jenisLaporan === 'Laporan Mingguan' || jenisLaporan === 'Laporan Bulanan') {
      if (!urutanLap) {
        throw new InvariantError('urutan laporan wajib diisi');
      }
    }
    const qIdData = {
      text: 'SELECT k.id_datum, k.id_user, d.no_proyek FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE d.no_proyek = $1',
      values: [noProyek],
    };
    const resQId = await pool.query(qIdData);
    if (!resQId.rows.length) {
      throw new NotFoundError(`noProyek ${noProyek} tidak ditemukan`);
    }

    const qIdKon = {
      text: 'SELECT id_user FROM kontraktor_conn WHERE id_user = $1',
      values: [idUser],
    };
    const resQIdKon = await pool.query(qIdKon);
    if (!resQIdKon.rows.length) {
      throw new NotFoundError('Pengguna tidak ditemukan atau tidak memiliki role kontraktor');
    }

    const createdAt = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
    const query = {
      text: `INSERT INTO laporan (id, jenis_laporan, urutan_lap, file, created_at, catatan, status, id_datum, id_user) VALUES (DEFAULT, '${jenisLaporan}', '${urutanLap}', '${namaFile}', '${createdAt}', null, 'Ditinjau', '${resQId.rows[0].id_datum}', '${idUser}') RETURNING *;`,
    };
    await pool.query(query);
    return res.status(201).send({
      status: 'success',
      message: 'laporan has been created successfully',
    });
  } catch (e) {
    if (e instanceof ClientError) {
      return res.status(e.statusCode).send({
        status: 'fail',
        message: e.message,
      });
    }
    console.log(e.message);
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const getLaporanByNoProyekKont = async (req, res) => {
  try {
    const { noProyek } = req.params;
    const { pageSize, currentPage, search } = req.query;

    let qFilter;
    if (!search) {
      qFilter = `SELECT l.id, l.created_at, l.jenis_laporan, l.urutan_lap, l.catatan, l.status, d.nm_rekanan, d.no_proyek, d.nm_proyek, lh.status AS stat_laphar FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum LEFT JOIN lap_harian AS lh ON l.id = lh.id_laporan WHERE d.no_proyek = '${noProyek}' ORDER BY LOWER(d.no_proyek) ASC`;
    } else {
      qFilter = `SELECT l.id, l.jenis_laporan, l.urutan_lap, l.catatan, l.status, d.nm_rekanan, d.no_proyek, d.nm_proyek, lh.status AS stat_laphar FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum LEFT JOIN lap_harian AS lh ON l.id = lh.id_laporan WHERE LOWER(l.jenis_laporan) LIKE LOWER('%${search}%') OR LOWER(d.nm_proyek) LIKE LOWER('%${search}%') OR LOWER(nama_vendor) LIKE LOWER('%${search}%') AND d.no_proyek = '${noProyek}' ORDER BY LOWER(d.no_proyek) ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id) FROM (${qFilter})sub`);
      const totalPages = Math.ceil(totalRows.rows[0].count / pageSize);
      const offset = (currentPage - 1) * pageSize;
      result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(no_proyek) ASC LIMIT ${pageSize} OFFSET ${offset};`);
      const data = result.rows;
      const newRes = resLap(data);
      return res.status(200).send({
        status: 'success',
        data: newRes,
        page: {
          page_size: pageSize,
          total_rows: totalRows.rows[0].count,
          total_pages: totalPages,
          current_page: currentPage,
        },
      });
    }
    result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY LOWER(no_proyek) ASC;`);

    const data = result.rows;
    const newRes = resLap(data);
    return res.status(200).send({
      status: 'success',
      data: newRes,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const getLaporanDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const query = {
      text: 'SELECT l.id, l.jenis_laporan, l.urutan_lap, d.nm_rekanan, l.catatan, l.status, d.no_proyek, d.nm_proyek, lh.status AS stat_laphar FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum LEFT JOIN lap_harian AS lh ON l.id = lh.id_laporan WHERE l.id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError(`Admin dengan id ${id} tidak ditemukan`);
    }

    const data = result.rows;
    const newRes = resLap(data);
    return res.status(200).send({
      status: 'success',
      data: newRes,
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

const updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const namaFile = req.file.filename;

    if (!namaFile) {
      throw new InvariantError('File harus diisi');
    }
    const directoryPath = path.join(__dirname, '..', '..', 'resources\\');

    const qFile = {
      text: `SELECT file, status, id FROM laporan WHERE id = ${id}`,
    };
    const resFile = await pool.query(qFile);
    // const qIdData = {
    //   text: 'SELECT id_datum, no_proyek FROM data WHERE no_proyek = $1',
    //   values: [noProyek],
    // };
    // const resQId = await pool.query(qIdData);
    if (resFile.rows[0].status !== 'Revisi') {
      throw new InvariantError('Laporan gagal diperbarui. Status laporan bukan revisi');
    }

    const query = {
      text: `UPDATE laporan SET file = '${namaFile}', status = 'Ditinjau' WHERE id = ${id} RETURNING *`,
    };
    await pool.query(query);
    fs.unlink(directoryPath + resFile.rows[0].file, (err) => {
      if (err) {
        console.log('File tidak ditemukan');
      }
      console.log('deleted');
    });
    return res.status(201).send({
      status: 'success',
      message: 'Laporan has been updated successfully',
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

const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = path.join(__dirname, '..', '..', 'resources\\');

  // eslint-disable-next-line consistent-return
  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        status: 'error',
        message: err,
      });
    }
  });
};

const getAllLaporan = async (req, res) => {
  try {
    const { pageSize, currentPage, search } = req.query;

    let qFilter;
    if (!search) {
      qFilter = 'SELECT l.id, l.jenis_laporan, l.urutan_lap, l.catatan, l.status, l.file, l.created_at, d.nm_proyek, d.no_proyek, d.nm_rekanan, lh.status AS stat_laphar FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum LEFT JOIN lap_harian AS lh ON l.id = lh.id_laporan ORDER BY l.created_at ASC';
    } else {
      qFilter = `SELECT l.id, l.jenis_laporan, l.urutan_lap, l.catatan, l.status, l.file, l.created_at, d.nm_proyek, d.no_proyek, nm_rekanan, lh.status AS stat_laphar FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum LEFT JOIN lap_harian AS lh ON l.id = lh.id_laporan WHERE LOWER(l.jenis_laporan) LIKE LOWER('%${search}%') OR LOWER(d.nm_proyek) LIKE LOWER('%${search}%') OR LOWER(d.no_proyek) LIKE LOWER('%${search}%') OR LOWER(l.catatan) LIKE LOWER('%${search}%') OR LOWER(l.status) LIKE LOWER('%${search}%') ORDER BY l.created_at ASC`;
    }
    let result = await pool.query(qFilter);

    if (pageSize && currentPage) {
      const totalRows = await pool.query(`SELECT COUNT (id) FROM (${qFilter})sub`);
      const totalPages = Math.ceil(totalRows.rows[0].count / pageSize);
      const offset = (currentPage - 1) * pageSize;
      result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY created_at ASC LIMIT ${pageSize} OFFSET ${offset};`);
      const data = result.rows;
      const newRes = resAllLap(data);

      return res.status(200).send({
        status: 'success',
        data: newRes,
        page: {
          page_size: pageSize,
          total_rows: totalRows.rows[0].count,
          total_pages: totalPages,
          current_page: currentPage,
        },
      });
    }
    result = await pool.query(`SELECT * FROM (${qFilter})sub ORDER BY created_at ASC;`);
    const data = result.rows;
    const newRes = resAllLap(data);

    return res.status(200).send({
      status: 'success',
      data: newRes,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: e.message,
    });
  }
};

const updateStat = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      catatan,
    } = req.body;

    if (!id || Number.isNaN(Number(id))) {
      throw new InvariantError('Gagal mengupdate status laporan. Mohon isi id dengan benar');
    }

    const query = {
      text: `UPDATE laporan SET status = '${status}', catatan = '${catatan}' WHERE id = ${id} RETURNING *`,
    };
    await pool.query(query);

    return res.status(201).send({
      status: 'success',
      message: 'status laporan has been updated!',
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

const deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const directoryPath = path.join(__dirname, '..', '..', 'resources\\');

    if (!id || Number.isNaN(Number(id))) {
      throw new InvariantError('Gagal menghapus laporan. Mohon isi id laporan dengan benar');
    }

    const qFile = {
      text: 'SELECT file, id FROM laporan WHERE id = $1',
      values: [id],
    };
    const resFile = await pool.query(qFile);
    if (!resFile.rows.length) {
      throw new NotFoundError('Gagal menghapus laporan. Data tidak ditemukan');
    }

    const query = {
      text: 'DELETE FROM laporan WHERE id=$1',
      values: [id],
    };
    await pool.query(query);
    fs.unlink(directoryPath + resFile.rows[0].file, (err) => {
      if (err) {
        console.log('File tidak ditemukan');
      }
      console.log('deleted');
    });

    return res.status(201).send({
      status: 'success',
      message: 'laporan laporan has been deleted!',
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

const updateBastStatus = async (req, res) => {
  try {
    const { noProyek } = req.params;
    const { statusBast, catatanBast } = req.body;

    if (statusBast === 'Rejected' && !catatanBast) {
      throw new InvariantError('Catatan Bast tidak boleh kosong');
    }

    const qUpdateStatus = {
      text: 'UPDATE data SET status_bast1 = $1, catatan_bast = $2 WHERE no_proyek = $3 RETURNING *',
      values: [statusBast, catatanBast, noProyek],
    };
    const result = await pool.query(qUpdateStatus);

    if (statusBast === 'Approved') {
      return res.status(201).send({
        status: 'success',
        data: {
          statusBast: result.rows[0].status_bast1,
          urlFormBast: 'ini link download bast',
          catatanBast: result.rows[0].catatan_bast,
        },
      });
    }
    return res.status(201).send({
      status: 'success',
      data: {
        statusBast: result.rows[0].status_bast1,
        urlFormBast: null,
        catatanBast: result.rows[0].catatan_bast,
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

const previewPdf = (req, res) => {
  const fileName = req.params.name;
  fs.readFile(path.join(__dirname, '..', '..', 'resources\\', `${fileName}`), (err, data) => {
    res.contentType('application/pdf');
    res.send(data);
  });
};

const createLapHarian = async (req, res) => {
  try {
    const {
      urutanLap,
      noProyek,
      idUser,
      tgl,
      aktivitas,
      rencana,
      note,
      jabatanhrini,
      jmlhhrini,
      jabatanbsk,
      jmlhbsk,
      baik,
      mendung,
      hujanTinggi,
      hujanRendah,
      alat,
      qty,
      masalah,
      solusi,
      mhToday,
      mhLstDay,
      token,
    } = req.body;

    // Validate the body request
    // eslint-disable-next-line max-len
    if (!aktivitas || !rencana || !jabatanhrini || !jmlhhrini || !alat || !qty || !jabatanbsk || !jmlhbsk || !mhToday || !mhLstDay) {
      throw new InvariantError('Pastikan setiap field telah diisi!');
    }

    if (typeof (aktivitas) !== 'object' || typeof (rencana) !== 'object' || typeof (note) !== 'object' || typeof (baik) !== 'object' || typeof (mendung) !== 'object' || typeof (hujanTinggi) !== 'object' || typeof (hujanRendah) !== 'object' || typeof (jabatanhrini) !== 'object' || typeof (jmlhhrini) !== 'object' || typeof (jabatanbsk) !== 'object' || typeof (jmlhbsk) !== 'object' || typeof (alat) !== 'object' || typeof (qty) !== 'object' || typeof (masalah) !== 'object' || typeof (solusi) !== 'object' || typeof (mhToday) !== 'object' || typeof (mhLstDay) !== 'object') {
      throw new InvariantError('Pastikan semua tipe data tiap field sudah benar');
    }

    // eslint-disable-next-line max-len
    if (jabatanhrini.length !== jmlhhrini.length || jabatanbsk.length !== jmlhbsk.length || alat.length !== qty.length || masalah.length !== solusi.length || mhToday.length !== mhLstDay.length || aktivitas.length > 10 || rencana.length > 10 || jabatanhrini.length > 9 || jmlhhrini.length > 9 || jabatanbsk.length > 9 || jmlhbsk.length > 9 || baik.length > 3 || mendung.length > 3 || hujanTinggi.length > 3 || hujanRendah.length > 3 || alat.length > 10 || qty.length > 10 || mhLstDay.length > 3 || mhToday.length > 3 || note.length > 3 || masalah.length > 5 || solusi.length > 5) {
      throw new InvariantError('Pastikan panjang field pada array sudah benar');
    }

    const qIdData = {
      text: 'SELECT k.id_datum, k.id_user, d.no_proyek FROM kontraktor_conn AS k INNER JOIN data AS d ON k.id_datum = d.id_datum WHERE d.no_proyek = $1',
      values: [noProyek],
    };
    const resQId = await pool.query(qIdData);
    if (!resQId.rows.length) {
      throw new NotFoundError(`noProyek ${noProyek} tidak ditemukan`);
    }

    const qIdKon = {
      text: 'SELECT id_user FROM kontraktor_conn WHERE id_user = $1',
      values: [idUser],
    };
    const resQIdKon = await pool.query(qIdKon);
    if (!resQIdKon.rows.length) {
      throw new NotFoundError('Pengguna tidak ditemukan atau tidak memiliki role kontraktor');
    }

    const currDate = new Date().getTime();
    const tglLap = Date.parse(tgl);
    const status = tglLap <= currDate ? 'Tepat Waktu' : 'Terlambat';
    console.log('status lapharr', status);

    const createdAt = new Date(new Date().setHours(0, 0, 0, 0));
    const pdfName = `${Date.now()}-Lap-${noProyek}-lapharian.pdf`;
    const qLap = {
      text: 'INSERT INTO laporan (id, jenis_laporan, urutan_lap, created_at, catatan, status, file, id_datum, id_user) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      values: ['Laporan Harian', urutanLap, createdAt, null, 'Ditinjau', pdfName, resQId.rows[0].id_datum, idUser],
    };
    const rLap = await pool.query(qLap);

    const qLapHar = {
      text: 'INSERT INTO lap_harian (id, id_laporan, aktivitas, rencana, status, tgl, note) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6) RETURNING *;',
      values: [rLap.rows[0].id, aktivitas, rencana, status, tgl, note],
    };
    const rLapHar = await pool.query(qLapHar);

    const ptenKerjaHrIni = [];
    let qTenKerjaHrIni;
    for (let i = 0; i < jabatanhrini.length; i += 1) {
      qTenKerjaHrIni = {
        text: 'INSERT INTO tenaga_kerja (id, jabatan, jmlh, status_hari, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [
          jabatanhrini[i],
          jmlhhrini[i],
          'hari ini',
          rLapHar.rows[0].id,
        ],
      };
      ptenKerjaHrIni.push(pool.query(qTenKerjaHrIni));
    }

    const ptenKerjaBsk = [];
    let qTenKerjaBsk;
    for (let i = 0; i < jabatanbsk.length; i += 1) {
      qTenKerjaBsk = {
        text: 'INSERT INTO tenaga_kerja (id, jabatan, jmlh, status_hari, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [
          jabatanbsk[i],
          jmlhbsk[i],
          'besok',
          rLapHar.rows[0].id,
        ],
      };
      ptenKerjaBsk.push(pool.query(qTenKerjaBsk));
    }

    const qkondCuaca = {
      text: 'INSERT INTO kond_cuaca (id, baik, mendung, hujan_tinggi, hujan_rendah, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4, $5)',
      values: [
        baik,
        mendung,
        hujanTinggi,
        hujanRendah,
        rLapHar.rows[0].id,
      ],
    };

    const pAlatKerja = [];
    let qAlatKerja;
    for (let i = 0; i < alat.length; i += 1) {
      qAlatKerja = {
        text: 'INSERT INTO alat_kerja (id, alat, qty, id_lap_harian) VALUES (DEFAULT, $1, $2, $3)',
        values: [
          alat[i],
          qty[i],
          rLapHar.rows[0].id,
        ],
      };
      pAlatKerja.push(pool.query(qAlatKerja));
    }

    const pNote = [];
    let qNote;
    for (let i = 0; i < masalah.length; i += 1) {
      qNote = {
        text: 'INSERT INTO note (id, masalah, solusi, id_lap_harian) VALUES (DEFAULT, $1, $2, $3)',
        values: [
          masalah[i],
          solusi[i],
          rLapHar.rows[0].id,
        ],
      };
      pNote.push(pool.query(qNote));
    }

    const pMh = [];
    let qMh;
    for (let i = 0; i < mhToday.length; i += 1) {
      qMh = {
        text: 'INSERT INTO man_hours (id, last_day, today, acum, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [
          mhLstDay[i],
          mhToday[i],
          mhLstDay[i] + mhToday[i],
          rLapHar.rows[0].id,
        ],
      };
      pMh.push(pool.query(qMh));
    }

    try {
      await Promise.all(ptenKerjaHrIni);
      await Promise.all(ptenKerjaBsk);
      await pool.query(qkondCuaca);
      await Promise.all(pAlatKerja);
      await Promise.all(pNote);
      await Promise.all(pMh);
    } catch (e) {
      const qDelLaphar = {
        text: 'DELETE FROM laporan WHERE id = $1;',
        values: [rLap.rows[0].id],
      };
      await pool.query(qDelLaphar);
      throw new InvariantError(e);
    }
    // const qLapFile = {
    //   text: 'UPDATE laporan SET (file) VALUES ($1) WHERE id = $2 RETURNING *;',
    //   values: [pdfName, rLap.rows[0].id],
    // };
    // try {
    //   await pool.query(qLapFile);
    // } catch (e) {
    //   throw new InvariantError(e);
    // }
    try {
      // const myHeaders = new fetch.Headers();
      // myHeaders.append("Authorization", token);
      // const setting = {
      //   method: 'GET',
      //   // headers: myHeaders,
      //   redirect: 'follow',
      // };
      // const response = await fetch(`http://localhost:3000/detaillapHarian/${rLap.rows[0].id}`, setting);
      // const data = await response.json();
      // console.log('ini datanyaa', data.data);
      console.log('ini id', rLap.rows[0].id);
      const data = await fetchData(rLap.rows[0].id, token);
      console.log('dataa', data);
      if (!data) {
        throw new NotFoundError('Data undefined');
      }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const content = await compilehtml(data);
      await page.setContent(content);
      const pdfPath = path.join(process.cwd(), 'resources\\', `${pdfName}`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
      });

      console.log('success');
      await browser.close();
    } catch (e) {
      const qDelLaphar = {
        text: 'DELETE FROM laporan WHERE id = $1;',
        values: [rLap.rows[0].id],
      };
      await pool.query(qDelLaphar);
      throw new InvariantError(e);
    }

    return res.status(201).send({
      status: 'success',
      message: 'laporan has been created successfully',
      url: `${baseUrl}preview/${pdfName}`,
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

const getDetailLapHarian = async (req, res) => {
  try {
    // id dari tabel laporan
    const { id } = req.params;

    const queryGetInfoLH = {
      text: 'SELECT d.id_datum, d.nm_proyek as pekerjaan, d.nm_rekanan as vendor, lh.tgl as tanggal, d.no_proyek, l.urutan_lap as urutan_ke FROM data as d INNER JOIN laporan as l ON l.id_datum = d.id_datum INNER JOIN lap_harian as lh ON lh.id_laporan = l.id WHERE l.id = $1;',
      values: [id],
    };
    const poolInfoLH = await pool.query(queryGetInfoLH);
    let infoLH = poolInfoLH.rows[0];

    infoLH.tanggal = (infoLH.tanggal).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!infoLH) {
      throw new NotFoundError(`Tidak ada data laporan harian dengan id laporan : ${id}`);
    }

    const queryGetDescLH = {
      text: 'SELECT lh.id as id_lapharian, lh.aktivitas as aktivitas, lh.rencana as rencana, lh.note as note FROM lap_harian as lh INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY lh.id',
      values: [id],
    };
    const poolDescLH = await pool.query(queryGetDescLH);
    // const descLH = poolDescLH.rows[0];

    const queryGetTenaKer = {
      // eslint-disable-next-line max-len
      // text: "SELECT tk.id, tk.jabatan, tk.jmlh FROM tenaga_kerja as tk INNER JOIN lap_harian as lh ON tk.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 AND tk.status_hari = 'hari ini' ORDER BY tk.id",
      text: "SELECT ARRAY_AGG(id) as id_tdy, ARRAY_AGG(jabatan) as jabatan_tdy, ARRAY_AGG(jmlh) as qty_tdy FROM(SELECT tk.id, tk.jabatan, tk.jmlh FROM tenaga_kerja as tk INNER JOIN lap_harian as lh ON tk.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 AND tk.status_hari = 'hari ini' ORDER BY tk.id)sub;",
      values: [id],
    };

    const queryGetTenaKerB = {
      // eslint-disable-next-line max-len
      // text: "SELECT tk.id, tk.jabatan, tk.jmlh FROM tenaga_kerja as tk INNER JOIN lap_harian as lh ON tk.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 AND tk.status_hari = 'besok' ORDER BY tk.id",
      text: "SELECT ARRAY_AGG(id) as id_bsk, ARRAY_AGG(jabatan) as jabatan_bsk, ARRAY_AGG(jmlh) as qty_bsk FROM(SELECT tk.id, tk.jabatan, tk.jmlh FROM tenaga_kerja as tk INNER JOIN lap_harian as lh ON tk.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 AND tk.status_hari = 'besok' ORDER BY tk.id)sub;",
      values: [id],
    };
    const poolTenaKer = await pool.query(queryGetTenaKer);
    const poolTenaKerB = await pool.query(queryGetTenaKerB);

    const queryGetAlatKerja = {
      // eslint-disable-next-line max-len
      // text: 'SELECT ak.id, ak.alat, ak.qty FROM alat_kerja as ak INNER JOIN lap_harian as lh ON ak.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY ak.id',
      text: 'SELECT ARRAY_AGG(id) as id_alat, ARRAY_AGG(alat) as alat, ARRAY_AGG(qty) as qty_alat FROM(SELECT ak.id, ak.alat, ak.qty FROM alat_kerja as ak INNER JOIN lap_harian as lh ON ak.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY ak.id)sub',
      values: [id],
    };
    const poolAlatKerja = await pool.query(queryGetAlatKerja);

    const queryGetNote = {
      // eslint-disable-next-line max-len
      // text: 'SELECT n.id, n.masalah, n.solusi FROM note as n INNER JOIN lap_harian as lh ON n.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY n.id',
      text: 'SELECT ARRAY_AGG(id) as id_massol, ARRAY_AGG(masalah) as masalah, ARRAY_AGG(solusi) as solusi FROM (SELECT n.id, n.masalah, n.solusi FROM note as n INNER JOIN lap_harian as lh ON n.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY n.id)sub;',
      values: [id],
    };
    const poolNote = await pool.query(queryGetNote);

    const queryGetCuaca = {
      text: 'SELECT c.id as id_cuaca, c.baik, c.mendung, c.hujan_tinggi, c.hujan_rendah FROM kond_cuaca as c INNER JOIN lap_harian as lh ON c.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY c.id',
      values: [id],
    };
    const poolCuaca = await pool.query(queryGetCuaca);

    const queryGetManHours = {
      text: 'SELECT ARRAY_AGG(id) as id_mh, ARRAY_AGG(last_day) as mh_lastday, ARRAY_AGG(today) as mh_today, ARRAY_AGG(acum) as mh_acum FROM (SELECT mh.id, mh.last_day, mh.today, mh.acum FROM man_hours as mh INNER JOIN lap_harian as lh ON mh.id_lap_harian = lh.id INNER JOIN laporan as l ON l.id = lh.id_laporan WHERE l.id = $1 ORDER BY mh.id)sub;',
      values: [id],
    };
    const poolManHours = await pool.query(queryGetManHours);

    // descLH.tkToday = poolTenaKer.rows;
    // descLH.tkTomorrow = poolTenaKerB.rows;
    // descLH.alatKerja = poolAlatKerja.rows;
    // descLH.trouble = poolNote.rows;
    // descLH.cuaca = poolCuaca.rows;

    // descLH = { ...descLH, ...poolTenaKer.rows[0], ...poolTenaKerB.rows[0] };

    infoLH = {
      ...infoLH,
      ...poolDescLH.rows[0],
      ...poolTenaKer.rows[0],
      ...poolTenaKerB.rows[0],
      ...poolAlatKerja.rows[0],
      ...poolNote.rows[0],
      ...poolCuaca.rows[0],
      ...poolManHours.rows[0],
    };

    Object.keys(infoLH).forEach((key) => {
      if (infoLH[key] == null) { infoLH[key] = ''; }
    });

    // return res.status(200).send({
    //   status: 'success',
    //   data: infoLH,
    //   // descLH,
    // });

    return res.status(200).send({
      status: 'success',
      data: infoLH,
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
      message: 'Gagal mengambil data',
    });
  }
};

const editDetailLapHarian = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      tgl,
      aktivitas, rencana, note, jabatanhrini, jmlhhrini,
      jabatanbsk, jmlhbsk, baik, mendung, hujanTinggi, hujanRendah, alat, qty, masalah, solusi,
      mhToday, mhLstDay, token,
    } = req.body;

    // Validate the body request
    // eslint-disable-next-line max-len
    if (!aktivitas || !rencana || !jabatanhrini || !jmlhhrini || !alat || !qty || !jabatanbsk || !jmlhbsk || !mhToday || !mhLstDay) {
      throw new InvariantError('Pastikan setiap field telah diisi!');
    }

    // eslint-disable-next-line max-len
    if (!Array.isArray(aktivitas) || !Array.isArray(rencana) || !Array.isArray(note) || !Array.isArray(baik) || !Array.isArray(mendung) || !Array.isArray(hujanTinggi) || !Array.isArray(hujanRendah) || !Array.isArray(jabatanhrini) || !Array.isArray(jmlhhrini) || !Array.isArray(jabatanbsk) || !Array.isArray(jmlhbsk) || !Array.isArray(alat) || !Array.isArray(qty) || !Array.isArray(masalah) || !Array.isArray(solusi) || !Array.isArray(mhToday) || !Array.isArray(mhLstDay)) {
      throw new InvariantError('Pastikan semua tipe data tiap field sudah benar');
    }

    // eslint-disable-next-line max-len
    if (jabatanhrini.length !== jmlhhrini.length || jabatanbsk.length !== jmlhbsk.length || alat.length !== qty.length || masalah.length !== solusi.length || mhToday.length !== mhLstDay.length) {
      throw new InvariantError('Pastikan panjang field pada array sudah benar');
    }
    const qGetLap = {
      text: 'SELECT l.file, d.no_proyek, l.status FROM laporan AS l INNER JOIN data AS d ON l.id_datum = d.id_datum WHERE l.id = $1',
      values: [id],
    };
    const rGetLap = await pool.query(qGetLap);
    if (rGetLap.rows[0].status !== 'Revisi') {
      throw new InvariantError('Laporan gagal diperbarui. Status laporan bukan revisi');
    }
    // Deleting Previous data
    const qDelLaphar = {
      text: 'DELETE FROM lap_harian WHERE id_laporan = $1;',
      values: [id],
    };
    await pool.query(qDelLaphar);

    // // UNCOMMENT JIKA CREATED AT DAPAT BERUBAH SESUAI DENGAN TANGGAL EDITNYA
    const currDate = new Date().getTime();
    const tglLap = Date.parse(tgl);
    const status = tglLap <= currDate ? 'Tepat Waktu' : 'Terlambat';

    const createdAt = new Date(new Date().setHours(0, 0, 0, 0));
    // const pdfName = `${Date.now()}-lap-${rGetLap.rows[0].no_proyek}-harian.pdf`;
    const qUpdateLap = {
      text: "UPDATE laporan SET created_at= $1, status = 'Ditinjau' WHERE id = $2 RETURNING *",
      values: [createdAt, id],
    };
    // const poolLap = await pool.query(qUpdateLap);
    await pool.query(qUpdateLap);

    const qInsertLapHar = {
      text: 'INSERT INTO lap_harian (id, id_laporan, aktivitas, rencana, status, tgl, note) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6) RETURNING *;',
      values: [id, aktivitas, rencana, status, tgl, note],
    };
    const poolLapHar = await pool.query(qInsertLapHar);

    const ptenKerjaHrIni = [];
    let qTenKerjaHrIni;
    for (let i = 0; i < jabatanhrini.length; i += 1) {
      qTenKerjaHrIni = {
        text: 'INSERT INTO tenaga_kerja (id, jabatan, jmlh, status_hari, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [jabatanhrini[i], jmlhhrini[i], 'hari ini', poolLapHar.rows[0].id],
      };
      ptenKerjaHrIni.push(pool.query(qTenKerjaHrIni));
    }

    const ptenKerjaBsk = [];
    let qTenKerjaBsk;
    for (let i = 0; i < jabatanbsk.length; i += 1) {
      qTenKerjaBsk = {
        text: 'INSERT INTO tenaga_kerja (id, jabatan, jmlh, status_hari, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [jabatanbsk[i], jmlhbsk[i], 'besok', poolLapHar.rows[0].id],
      };
      ptenKerjaBsk.push(pool.query(qTenKerjaBsk));
    }

    const qkondCuaca = {
      text: 'INSERT INTO kond_cuaca (id, baik, mendung, hujan_tinggi, hujan_rendah, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4, $5)',
      values: [baik, mendung, hujanTinggi, hujanRendah, poolLapHar.rows[0].id],
    };

    const pAlatKerja = [];
    let qAlatKerja;
    for (let i = 0; i < alat.length; i += 1) {
      qAlatKerja = {
        text: 'INSERT INTO alat_kerja (id, alat, qty, id_lap_harian) VALUES (DEFAULT, $1, $2, $3)',
        values: [alat[i], qty[i], poolLapHar.rows[0].id],
      };
      pAlatKerja.push(pool.query(qAlatKerja));
    }

    const pNote = [];
    let qNote;
    for (let i = 0; i < masalah.length; i += 1) {
      qNote = {
        text: 'INSERT INTO note (id, masalah, solusi, id_lap_harian) VALUES (DEFAULT, $1, $2, $3)',
        values: [masalah[i], solusi[i], poolLapHar.rows[0].id],
      };
      pNote.push(pool.query(qNote));
    }

    const pMh = [];
    let qMh;
    for (let i = 0; i < mhToday.length; i += 1) {
      qMh = {
        text: 'INSERT INTO man_hours (id, last_day, today, acum, id_lap_harian) VALUES (DEFAULT, $1, $2, $3, $4)',
        values: [
          mhLstDay[i],
          mhToday[i],
          mhLstDay[i] + mhToday[i],
          poolLapHar.rows[0].id,
        ],
      };
      pMh.push(pool.query(qMh));
    }

    try {
      await Promise.all(ptenKerjaHrIni);
      await Promise.all(ptenKerjaBsk);
      await pool.query(qkondCuaca);
      await Promise.all(pAlatKerja);
      await Promise.all(pNote);
      await Promise.all(pMh);
    } catch (e) {
      throw new InvariantError(e);
    }
    const directoryPath = path.join(__dirname, '..', '..', 'resources\\');
    fs.unlink(directoryPath + rGetLap.rows[0].file, (err) => {
      if (err) {
        console.log('file tidak ditemukan');
      }
      console.log('deleted');
    });
    try {
      // const myHeaders = new fetch.Headers();
      // myHeaders.append("Authorization", token);
      // const setting = {
      //   method: 'GET',
      //   // headers: myHeaders,
      //   redirect: 'follow',
      // };
      // const response = await fetch(`http://localhost:3000/detaillapHarian/${rLap.rows[0].id}`, setting);
      // const data = await response.json();
      // console.log('ini datanyaa', data.data);
      console.log('ini id', id);
      const data = await fetchData(id, token);
      if (!data) {
        throw new NotFoundError('Data undefined');
      }
      console.log('dataa', data);
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const content = await compilehtml(data);
      await page.setContent(content);
      const pdfPath = path.join(process.cwd(), 'resources\\', `${rGetLap.rows[0].file}`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
      });

      console.log('success');
      await browser.close();
    } catch (e) {
      throw new InvariantError(e);
    }
    return res.status(201).send({
      status: 'success',
      message: 'laporan has been created successfully',
      url: `${baseUrl}/preview${rGetLap.rows[0].file}`,
    });
  } catch (e) {
    console.error(e);
    const qUpdateLap = {
      text: "UPDATE laporan SET status = 'Revisi' WHERE id = $1 RETURNING *",
      values: [id],
    };
    // const poolLap = await pool.query(qUpdateLap);
    await pool.query(qUpdateLap);
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

module.exports = {
  createLaporan,
  getLaporanByNoProyekKont,
  getLaporanDetail,
  download,
  getAllLaporan,
  updateLaporan,
  updateStat,
  deleteLaporan,
  updateBastStatus,
  previewPdf,
  createLapHarian,
  getDetailLapHarian,
  editDetailLapHarian,
};
