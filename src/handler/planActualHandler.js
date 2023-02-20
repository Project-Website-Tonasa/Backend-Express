const pool = require('../config/db');
const ClientError = require('../exceptions/clientError');
const InvariantError = require('../exceptions/invariantError');
const NotFoundError = require('../exceptions/notFoundError');

const addPlan = async (req, res) => {
  try {
    const { idDatum, arrPlan } = req.body;

    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    if (!Array.isArray(arrPlan)) {
      throw new InvariantError('Masukkan array arrPlan dengan benar! Pastikan bertipe array (bukan string)');
    }

    const queryInsert = {
      text: 'INSERT INTO plan (datum_id, arr_value) VALUES ($1, $2) RETURNING *;',
      values: [idDatum, arrPlan],
    };

    const poolRes = await pool.query(queryInsert);
    return res.status(201).send({
      status: 'success',
      message: 'Berhasil menambahkan data baru',
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
    if ((e.message).includes('duplicate key')) {
      return res.status(400).send({
        status: 'fail',
        message: 'Duplikat id datum. Data proyek ini sudah memiliki plan',
      });
    }
    if ((e.message).includes('foreign key constraint')) {
      return res.status(400).send({
        status: 'fail',
        message: 'Id proyek tidak terdaftar pada data proyek manapun',
      });
    }
    if ((e.message).includes('invalid input syntax for type double precision')) {
      return res.status(400).send({
        status: 'fail',
        message: 'Pastikan arrplan merupakan array yang setiap elemennya hanya berisi angka',
      });
    }
    return res.status(500).send({
      status: 'error',
      message: 'Gagal menambahkan data',
    });
  }
};

const getPlan = async (req, res) => {
  try {
    const queryGet = {
      text: 'SELECT * FROM plan order by id_plan',
    };
    const dataRes = await pool.query(queryGet);
    const data = dataRes.rows;

    return res.status(200).send({
      status: 'success',
      data,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengambil data',
    });
  }
};

const getPlanDetail = async (req, res) => {
  try {
    const { idDatum } = req.params;

    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    const queryGet = {
      text: 'SELECT * FROM plan WHERE datum_id = $1 order by id_plan',
      values: [idDatum],
    };
    const dataRes = await pool.query(queryGet);

    if (!((dataRes.rows).length)) {
      throw new NotFoundError('Tidak ada data plan pada proyek tersebut');
    }
    const data = dataRes.rows[0];

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

const editPlanDetail = async (req, res) => {
  try {
    const { idDatum } = req.params;
    const { arrPlan } = req.body;

    // if (Number.isNaN(Number(idDatum))) {
    //   throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    // }
    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    if (!Array.isArray(arrPlan)) {
      throw new InvariantError('Masukkan array arrPlan dengan benar!');
    }

    const queryUpdate = {
      text: 'UPDATE plan SET arr_value = $1 WHERE datum_id = $2 RETURNING *;',
      values: [arrPlan, idDatum],
    };

    const poolRes = await pool.query(queryUpdate);
    if (!((poolRes.rows).length)) {
      throw new NotFoundError('Data plan tidak terdaftar');
    }

    return res.status(201).send({
      status: 'success',
      message: 'Berhasil mengedit data plan',
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

    if ((e.message).includes('invalid input syntax for type double precision')) {
      return res.status(400).send({
        status: 'fail',
        message: 'Pastikan arrplan merupakan array yang setiap elemennya hanya berisi angka',
      });
    }

    return res.status(500).send({
      status: 'error',
      message: 'Gagal menambahkan data',
    });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { idDatum } = req.params;

    if (!idDatum || Number.isNaN(Number(idDatum))) {
      throw new InvariantError('Gagal menghapus data plan. Mohon isi idDatum proyek dengan benar');
    }

    const queryDel = {
      text: 'DELETE FROM plan WHERE datum_id = $1 RETURNING *',
      values: [idDatum],
    };
    const poolDel = await pool.query(queryDel);

    if (!(poolDel.rows[0])) {
      throw new NotFoundError(`Data dengan id: ${idDatum} tidak ditemukan`);
    }

    return res.status(200).send({
      status: 'success',
      message: `Data plan ${poolDel.rows[0].datum_id} berhasil dihapus`,
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
      message: 'Gagal menghapus data plan',
    });
  }
};

const addActual = async (req, res) => {
  try {
    const { idDatum, arrActual } = req.body;

    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    if (!Array.isArray(arrActual)) {
      throw new InvariantError('Masukkan array arrActual dengan benar! Pastikan bertipe array (bukan string)');
    }

    let poolRes;

    const queryInsert = {
      text: 'INSERT INTO real (datum_id, arr_value) VALUES ($1, $2) RETURNING *;',
      values: [idDatum, arrActual],
    };

    const queryUpdate = {
      text: 'UPDATE real SET arr_value = $1 WHERE datum_id = $2 RETURNING *;',
      values: [arrActual, idDatum],
    };

    const queryGetCheck = {
      text: 'SELECT * FROM real WHERE datum_id = $1',
      values: [idDatum],
    };
    const poolGet = await pool.query(queryGetCheck);

    if (!poolGet.rows[0]) {
      poolRes = await pool.query(queryInsert);
    } else {
      poolRes = await pool.query(queryUpdate);
    }
    return res.status(201).send({
      status: 'success',
      message: 'Berhasil menambahkan data baru',
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

    if ((e.message).includes('violates foreign key constraint')) {
      return res.status(404).send({
        status: 'fail',
        message: 'Tidak dapat memasukkan array actual. Tidak ada data proyek dengan id tersebut',
      });
    }

    return res.status(500).send({
      status: 'error',
      message: 'Gagal menambahkan data',
    });
  }
};

const getActual = async (req, res) => {
  try {
    const queryGet = {
      text: 'SELECT * FROM real order by id_real',
    };
    const dataRes = await pool.query(queryGet);
    const data = dataRes.rows;

    return res.status(200).send({
      status: 'success',
      data,
    });
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengambil data',
    });
  }
};

const getActualDetail = async (req, res) => {
  try {
    const { idDatum } = req.params;

    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    const queryGet = {
      text: 'SELECT * FROM real WHERE datum_id = $1 order by id_real',
      values: [idDatum],
    };
    const dataRes = await pool.query(queryGet);

    if (!((dataRes.rows).length)) {
      throw new NotFoundError('Tidak ada data actual pada proyek tersebut');
    }
    const data = dataRes.rows[0];

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

const editActualDetail = async (req, res) => {
  try {
    const { idDatum } = req.params;
    const { arrActual } = req.body;

    if (!(Number.isInteger(Number(idDatum))) || Array.isArray(idDatum)) {
      throw new InvariantError('Masukkan id datum dengan benar (bertipe integer)');
    }

    if (!Array.isArray(arrActual)) {
      throw new InvariantError('Masukkan array arrPlan dengan benar!');
    }

    const queryUpdate = {
      text: 'UPDATE real SET arr_value = $1 WHERE datum_id = $2 RETURNING *;',
      values: [arrActual, idDatum],
    };

    const poolRes = await pool.query(queryUpdate);
    if (!((poolRes.rows).length)) {
      throw new NotFoundError('Data actual tidak terdaftar');
    }

    return res.status(201).send({
      status: 'success',
      message: 'Berhasil mengedit data actual',
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

    if ((e.message).includes('invalid input syntax for type double precision')) {
      return res.status(400).send({
        status: 'fail',
        message: 'Pastikan arrplan merupakan array yang setiap elemennya hanya berisi angka',
      });
    }

    return res.status(500).send({
      status: 'error',
      message: 'Gagal mengedit data',
    });
  }
};

const deleteActual = async (req, res) => {
  try {
    const { idDatum } = req.params;

    if (!idDatum || Number.isNaN(Number(idDatum))) {
      throw new InvariantError('Gagal menghapus data actual. Mohon isi idDatum proyek dengan benar');
    }

    const queryDel = {
      text: 'DELETE FROM real WHERE datum_id = $1 RETURNING *',
      values: [idDatum],
    };
    const poolDel = await pool.query(queryDel);

    if (!(poolDel.rows[0])) {
      throw new NotFoundError(`Data dengan id: ${idDatum} tidak ditemukan`);
    }

    return res.status(200).send({
      status: 'success',
      message: `Data actual ${poolDel.rows[0].datum_id} berhasil dihapus`,
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
      message: 'Gagal menghapus data actual',
    });
  }
};

const getPlanActual = async (req, res) => {
  try {
    const queryGet = {
      text: 'SELECT d.nm_proyek, d.tahun, p.datum_id, p.arr_value AS arrplan, r.arr_value as arractual FROM plan AS p LEFT JOIN real AS r ON p.datum_id = r.datum_id INNER JOIN data AS d ON p.datum_id = d.id_datum ORDER BY p.datum_id',
    };
    const dataRes = await pool.query(queryGet);
    const data = dataRes.rows;

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

module.exports = {
  addPlan,
  getPlan,
  getPlanDetail,
  deletePlan,
  editPlanDetail,
  addActual,
  getActual,
  getActualDetail,
  editActualDetail,
  deleteActual,
  getPlanActual,
};
