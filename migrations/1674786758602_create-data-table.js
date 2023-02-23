exports.up = ((pgm) => {
  pgm.createTable('data', {
    id_datum: {
      type: 'SERIAL',
      notNull: true,
      primaryKey: true,
    },
    nm_jenis: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    tahun: {
      type: 'INTEGER',
      notNull: true,
    },
    no_proyek: {
      type: 'VARCHAR(15)',
      notNull: true,
    },
    tgl_mulai: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    tgl_akhir: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    nm_proyek: {
      type: 'TEXT',
      notNull: true,
    },
    nm_rekanan: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    nm_kota: {
      type: 'VARCHAR(100)',
      // notNull: true,
    },
    nm_lokasi: {
      type: 'VARCHAR(100)',
      // notNull: true,
    },
    nilai: {
      type: 'BIGINT',
      notNull: true,
    },
    plan: {
      type: 'FLOAT',
      // notNull: true,
    },
    real: {
      type: 'FLOAT',
      // notNull: true,
    },
    deviasi: {
      type: 'FLOAT',
      // notNull: true,
    },
    tgl_selesai: {
      type: 'TIMESTAMP',
      // notNull: true,
    },
    status: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    tgl_bast1: {
      type: 'TIMESTAMP',
      // notNull: true,
    },
    batas_retensi: {
      type: 'TIMESTAMP',
      // notNull: true,
    },
    keterangan: {
      type: 'TEXT',
      // notNull: true,
    },
    no_kontrak: {
      type: 'VARCHAR',
      notNull: true,
    },
    edited_by: {
      type: 'VARCHAR',
      notNull: true,
    },
    edited_at: {
      type: 'TIMESTAMP',
      notNull: true,
    },
  });
});

exports.down = (pgm) => {
  pgm.dropTable('data');
};
