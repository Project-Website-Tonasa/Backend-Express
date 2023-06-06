exports.up = ((pgm) => {
  pgm.createTable('kontraktor_conn', {
    id: {
      type: 'SERIAL',
      notNull: true,
      primaryKey: true,
    },
    id_user: {
      type: 'INTEGER',
      notNull: true,
    },
    id_datum: {
      type: 'INTEGER',
      notNull: false,
    },
  });
  pgm.addConstraint(
    'kontraktor_conn',
    'fk_kontraktor_conn.id_user_users.id',
    'FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'kontraktor_conn',
    'fk_kontraktor_conn.id_datum_data.id_datum',
    'FOREIGN KEY(id_datum) REFERENCES data(id_datum) ON DELETE CASCADE',
  );
});

exports.down = (pgm) => {
  pgm.dropTable('kontraktor_conn');
};
