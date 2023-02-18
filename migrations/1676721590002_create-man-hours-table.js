exports.up = ((pgm) => {
  pgm.createTable('man_hours', {
    id: {
      type: 'SERIAL',
      notNull: true,
      primaryKey: true,
    },
    last_day: {
      type: 'FLOAT',
      notNull: false,
    },
    today: {
      type: 'FLOAT',
      notNull: false,
    },
    acum: {
      type: 'FLOAT',
      notNull: false,
    },
    id_lap_harian: {
      type: 'INTEGER',
      notNull: true,
    },
  });
  pgm.addConstraint(
    'man_hours',
    'fk_man_hours.id_lap_harian_lap_harian.id',
    'FOREIGN KEY(id_lap_harian) REFERENCES lap_harian(id) ON DELETE CASCADE',
  );
});

exports.down = (pgm) => {
  pgm.dropTable('man_hours');
};
