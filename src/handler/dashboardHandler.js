const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');

const getData = async (req, res) => {
  const queryGet = {
    text: 'SELECT * FROM data',
  };
  const data = await pool.query(queryGet);
  // console.log(data.rows);

  return res.status(200).send({
    status: 'success',
    data: data.rows,
  });
};

const getStatistikbyDataStatus = async (req, res) => {
  try {
    const { tahun } = req.query;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil data. Mohon isi tahun project dengan benar');
    }
    const queryGet = {
      text: "SELECT COUNT(id_datum) as totalProject, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'completed') as completed, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'preparing') as preparing, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'in progress') as inPro, COUNT(id_datum) FILTER (WHERE LOWER(nm_jenis) = 'opex') as opex, COUNT(id_datum) FILTER (WHERE LOWER(nm_jenis) = 'capex') as capex FROM data WHERE tahun = $1;",
      values: [tahun],
    };
    const poolRes = await pool.query(queryGet);
    const data = poolRes.rows[0];

    const {
      totalproject, completed, preparing, inpro,
    } = data;

    // data.persenComp = ((completed / totalproject) * 100).toFixed(1);
    // data.persenInpro = ((inpro / totalproject) * 100).toFixed(1);
    // data.persenprep = ((preparing / totalproject) * 100).toFixed(1);

    const persenComp = ((completed / totalproject) * 100).toFixed(1);
    const persenInpro = ((inpro / totalproject) * 100).toFixed(1);
    const persenprep = ((preparing / totalproject) * 100).toFixed(1);

    data.persenComp = [persenComp, (100 - persenComp).toFixed(1)];
    data.persenInpro = [persenInpro, (100 - persenInpro).toFixed(1)];
    data.persenprep = [persenprep, (100 - persenprep).toFixed(1)];

    return res.status(200).send({
      status: 'success',
      data,
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

const getStatistikPlanVsActual = async (req, res) => {
  try {
    const { id_datum: idDatum } = req.params;

    if (!idDatum || Number.isNaN(Number(idDatum))) {
      throw new InvariantError('Gagal mengambil data. Masukkan id datum yang benar');
    }

    const queryGet = {
      text: 'SELECT p.arr_value as strplan, r.arr_value as strreal FROM plan as p INNER JOIN real as r ON r.datum_id=p.datum_id where p.datum_id=$1;',
      values: [idDatum],
    };
    const poolRes = await pool.query(queryGet);

    if (!(poolRes.rows[0])) {
      throw new NotFoundError(`Data dengan id: ${idDatum} tidak ditemukan`);
    }

    const {
      strplan: stringPlan, strreal: stringReal,
    } = poolRes.rows[0];

    const arrPlan = JSON.parse(stringPlan);
    const arrReal = JSON.parse(stringReal);
    const totalWeek = Math.max((arrPlan).length, (arrReal).length);

    const arrOfchart = [];

    for (let i = 0; i < totalWeek; i += 1) {
      const chartObj = {};
      chartObj.week = i + 1;
      chartObj.plan = arrPlan[i];
      chartObj.actual = arrReal[i];

      if (!chartObj.actual) {
        chartObj.actual = null;
      }
      if (!chartObj.plan) {
        chartObj.plan = null;
      }

      arrOfchart.push(chartObj);
    }

    return res.status(200).send({
      status: 'success',
      data: {
        idDatum,
        totalWeek,
        arrOfchart,
      },
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

const getStatistikMonPr = async (req, res) => {
  try {
    // const queryGet = {
    //   text: 'SELECT coll_status as statuspr, COUNT(id_monitor) as jumlahpr
    // FROM monitoring_pr GROUP BY coll_status;'
    // };
    // const poolRes = await pool.query(queryGet);

    const queryGet = {
      text: "SELECT COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'tender') as tender, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'po') as PO, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'evalkom') as evalkom, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'evaltek') as evaltek, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'approval pr') as approval_pr, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'submit eproc') as submit_eproc, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'eval ece') as eval_ece, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'ece/boq not ok') as eceboq, COUNT(id_monitor) FILTER (WHERE LOWER(coll_status) = 'not_set') as not_set FROM monitoring_pr;",
    };
    const poolRes = await pool.query(queryGet);

    return res.status(200).send({
      status: 'success',
      data: {
        chart: poolRes.rows[0],
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengambil data',
    });
  }
};

const getStatistikPrKonstruksi = async (req, res) => {
  try {
    const queryGet = {
      text: "SELECT COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'user') as user, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'rb/capex') as rbCapex, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'pengadaan') as pengadaan, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'konstruksi') as konstruksi, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'not_set') as not_set FROM monitoring_pr;",
    };
    const poolRes = await pool.query(queryGet);

    return res.status(200).send({
      status: 'success',
      data: {
        chart: poolRes.rows[0],
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengambil data',
    });
  }
};

const getStatistikPko = async (req, res) => {
  try {
    const { tahun } = req.query;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil data. Mohon isi tahun project dengan benar');
    }

    const queryGetQty = {
      text: "SELECT COUNT(id_pko) FILTER (WHERE LOWER(status) = 'completed') as completed, COUNT(id_pko) FILTER (WHERE LOWER(status) = 'in progress') as inPro, COUNT(id_pko) FILTER (WHERE LOWER(status) = 'pending') as pending FROM pko WHERE tahun = $1;",
      values: [tahun],
    };
    const queryGetValRp = {
      text: "SELECT SUM(nilai_project) FILTER (WHERE LOWER(status) = 'completed') as realisasi, SUM(nilai_project) FILTER(WHERE LOWER(status_penagihan) = 'bapp') as bapp FROM pko;",
    };
    const poolResQty = await pool.query(queryGetQty);
    const poolResRp = await pool.query(queryGetValRp);

    poolResRp.rows[0].outstand = (poolResRp.rows[0].realisasi - poolResRp.rows[0].bapp).toString();

    return res.status(200).send({
      status: 'success',
      data: {
        qty: poolResQty.rows[0],
        rp: poolResRp.rows[0],
      },
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

module.exports = {
  getData,
  getStatistikbyDataStatus,
  getStatistikPlanVsActual,
  getStatistikMonPr,
  getStatistikPrKonstruksi,
  getStatistikPko,
};