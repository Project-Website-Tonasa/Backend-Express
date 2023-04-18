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

const getProgress = async (req, res) => {
  try {
    const { tahun, idUser } = req.query;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil data status proyek. Mohon isi tahun project dengan benar');
    }

    let queryGet;
    if (idUser) {
      queryGet = {
        text: "SELECT COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'leading') as leading, COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'late') as late, COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'on track') as onTrack FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE k.id_user= $1, LOWER(d.status) = 'in progress' AND d.tahun = $2;",
        values: [idUser, tahun],
      };
    } else {
      queryGet = {
        text: "SELECT COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'leading') as leading, COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'late') as late, COUNT(d.id_datum) FILTER (WHERE LOWER(d.progress) = 'on track') as onTrack FROM data as d WHERE LOWER(d.status) = 'in progress' AND d.tahun = $1;",
        values: [tahun],
      };
    }
    const poolRes = await pool.query(queryGet);
    const data = poolRes.rows[0];
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

const getListProyekByProgress = async (req, res) => {
  try {
    const { idUser, tahun } = req.query;

    let queryGetLeading;
    let queryGetLate;
    let queryGetOnTrack;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil daftar nama proyek. Mohon isi tahun dengan benar');
    }

    if (idUser) {
      queryGetLeading = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.progress) = 'leading' AND k.id_user= $1 AND d.tahun = $2;",
        values: [idUser, tahun],
      };
      queryGetLate = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.progress) = 'late' AND k.id_user= $1 ANd d.tahun = $2;",
        values: [idUser, tahun],
      };
      queryGetOnTrack = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.progress) = 'on track' AND k.id_user= $1 AND d.tahun = $2;",
        values: [idUser, tahun],
      };
    } else {
      queryGetLeading = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.progress) = 'leading' AND tahun = $1;",
        values: [tahun],
      };
      queryGetLate = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.progress) = 'late' AND tahun = $1;",
        values: [tahun],
      };
      queryGetOnTrack = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.progress) = 'on track' AND tahun = $1",
        values: [tahun],
      };
    }
    const poolLeading = await pool.query(queryGetLeading);
    const poolLate = await pool.query(queryGetLate);
    const poolOnTrack = await pool.query(queryGetOnTrack);

    const leading = poolLeading.rows;
    const late = poolLate.rows;
    const onTrack = poolOnTrack.rows;

    return res.status(200).send({
      status: 'success',
      data: {
        leading,
        late,
        onTrack,
      },
    });
  } catch (e) {
    console.log(e);

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

const getListProyekByStatus = async (req, res) => {
  try {
    const { idUser, tahun } = req.query;

    let queryGetCompleted;
    let queryGetPreparing;
    let queryGetInProgress;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil daftar nama proyek. Mohon isi tahun dengan benar');
    }

    if (idUser) {
      queryGetCompleted = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.status) = 'completed' AND k.id_user= $1 AND d.tahun = $2;",
        values: [idUser, tahun],
      };
      queryGetPreparing = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.status) = 'preparing' AND k.id_user= $1 AND d.tahun = $2;",
        values: [idUser, tahun],
      };
      queryGetInProgress = {
        text: "SELECT nm_proyek, nm_rekanan FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE LOWER(d.status) = 'in progress' AND k.id_user= $1 AND d.tahun = $2;",
        values: [idUser, tahun],
      };
    } else {
      queryGetCompleted = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.status) = 'completed' AND tahun = $1;",
        values: [tahun],
      };
      queryGetPreparing = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.status) = 'preparing' AND tahun = $1;",
        values: [tahun],
      };
      queryGetInProgress = {
        text: "SELECT id_datum, nm_proyek, nm_rekanan FROM data as d WHERE LOWER(d.status) = 'in progress' AND tahun = $1;",
        values: [tahun],
      };
    }
    const poolCompleted = await pool.query(queryGetCompleted);
    const poolPreparing = await pool.query(queryGetPreparing);
    const poolInProgress = await pool.query(queryGetInProgress);

    const completed = poolCompleted.rows;
    const preparing = poolPreparing.rows;
    const inProgress = poolInProgress.rows;

    return res.status(200).send({
      status: 'success',
      data: {
        completed,
        preparing,
        inProgress,
      },
    });
  } catch (e) {
    console.log(e);

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

const getStatistikbyDataStatus = async (req, res) => {
  try {
    const { tahun, idUser } = req.query;

    if (!tahun || Number.isNaN(Number(tahun))) {
      throw new InvariantError('Gagal mengambil data. Mohon isi tahun project dengan benar');
    }
    let queryGet;
    if (idUser) {
      queryGet = {
        text: "SELECT COUNT(d.id_datum) as totalProject, COUNT(d.id_datum) FILTER (WHERE LOWER(d.status) = 'completed') as completed, COUNT(d.id_datum) FILTER (WHERE LOWER(d.status) = 'preparing') as preparing, COUNT(d.id_datum) FILTER (WHERE LOWER(d.status) = 'in progress') as inPro, COUNT(d.id_datum) FILTER (WHERE LOWER(d.nm_jenis) = 'opex') as opex, SUM(d.nilai) FILTER (WHERE LOWER(d.nm_jenis) = 'opex') as opex_nilai, COUNT(d.id_datum) FILTER (WHERE LOWER(d.nm_jenis) = 'capex') as capex, SUM(d.nilai) FILTER (WHERE LOWER(d.nm_jenis) = 'capex') as capex_nilai FROM data as d INNER JOIN kontraktor_conn as k ON d.id_datum = k.id_datum WHERE d.tahun = $1 AND  k.id_user= $2;",
        values: [tahun, idUser],
      };
    } else {
      queryGet = {
        text: "SELECT COUNT(id_datum) as totalProject, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'completed') as completed, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'preparing') as preparing, COUNT(id_datum) FILTER (WHERE LOWER(status) = 'in progress') as inPro, COUNT(id_datum) FILTER (WHERE LOWER(nm_jenis) = 'opex') as opex, SUM(nilai) FILTER (WHERE LOWER(nm_jenis) = 'opex') as opex_nilai, COUNT(id_datum) FILTER (WHERE LOWER(nm_jenis) = 'capex') as capex, SUM(nilai) FILTER (WHERE LOWER(nm_jenis) = 'capex') as capex_nilai FROM data WHERE tahun = $1;",
        values: [tahun],
      };
    }
    const poolRes = await pool.query(queryGet);
    const data = poolRes.rows[0];

    data.opex_nilai = (Number(data.opex_nilai)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

    data.capex_nilai = (Number(data.capex_nilai)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

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

    if (Number.isNaN(Number(persenComp))) {
      data.persenComp = [completed, (100 - completed)];
    }
    if (Number.isNaN(Number(persenInpro))) {
      data.persenInpro = [inpro, (100 - inpro)];
    }
    if (Number.isNaN(Number(persenprep))) {
      data.persenprep = [preparing, (100 - preparing)];
    }

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
      text: 'SELECT p.arr_value as strplan, r.arr_value as strreal FROM plan as p LEFT JOIN real as r ON r.datum_id=p.datum_id where p.datum_id=$1;',
      values: [idDatum],
    };
    const poolRes = await pool.query(queryGet);

    if (!(poolRes.rows[0])) {
      throw new NotFoundError(`Data dengan id: ${idDatum} tidak ditemukan`);
    }
    // console.log(poolRes.rows[0]);

    let {
      strplan: stringPlan = [], strreal: stringReal = [],
    } = poolRes.rows[0];
    stringPlan ||= [];
    stringReal ||= [];

    // const arrPlan = JSON.parse(stringPlan);
    // const arrReal = JSON.parse(stringReal);
    // console.log(stringPlan);
    // console.log(stringReal);
    const totalWeek = Math.max((stringPlan).length, (stringReal).length);

    const arrOfchart = [];

    for (let i = 0; i < totalWeek; i += 1) {
      const chartObj = {};
      chartObj.week = i + 1;
      chartObj.plan = stringPlan[i];
      chartObj.actual = stringReal[i];

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
      text: "SELECT COUNT(id_monitor) as total, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'user') as user, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'rb/capex') as rbCapex, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'pengadaan') as pengadaan, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'konstruksi') as konstruksi, COUNT(id_monitor) FILTER (WHERE LOWER(pic) = 'not_set') as not_set FROM monitoring_pr;",
    };
    const poolRes = await pool.query(queryGet);
    const data = poolRes.rows[0];

    data.user = ((data.user / data.total) * 100).toFixed(1);
    data.rbcapex = ((data.rbcapex / data.total) * 100).toFixed(1);
    data.pengadaan = ((data.pengadaan / data.total) * 100).toFixed(1);
    data.konstruksi = ((data.konstruksi / data.total) * 100).toFixed(1);
    data.not_set = ((data.not_set / data.total) * 100).toFixed(1);

    delete data.total;

    return res.status(200).send({
      status: 'success',
      data: {
        chart: data,
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

    const { realisasi, bapp } = poolResRp.rows[0];
    const resRp = {};

    resRp.outstand = (realisasi - bapp).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    resRp.realisasi = (Number(realisasi)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    resRp.bapp = (Number(bapp)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

    return res.status(200).send({
      status: 'success',
      data: {
        qty: poolResQty.rows[0],
        rp: resRp,
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
  getProgress,
  getListProyekByProgress,
  getListProyekByStatus,
};
