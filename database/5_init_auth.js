const { connectDB, closeDB } = require('../backend/config/database');
const User = require('../backend/models/User');

async function initializeDatabase() {
  try {
    await connectDB();

    await User.createIndexes();

    const existingAdmin = await User.findByUsername('admin');

    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: 'admin@medicare.com',
        password: 'admin123',
        firstName: 'Administrador',
        lastName: 'Sistema',
        role: 'admin'
      });
      console.log('✅ Usuario admin creado');
    }

    const existingDoctor = await User.findByUsername('doctor1');
    if (!existingDoctor) {
      await User.create({
        username: 'doctor1',
        email: 'doctor@medicare.com',
        password: 'doctor123',
        firstName: 'María',
        lastName: 'González',
        role: 'doctor'
      });
      console.log('✅ Usuario doctor creado');
    }

    const existingUser = await User.findByUsername('user1');
    if (!existingUser) {
      await User.create({
        username: 'user1',
        email: 'user@medicare.com',
        password: 'user123',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'user'
      });
      console.log('✅ Usuario regular creado');
    }

    console.log('✅ Inicialización completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

initializeDatabase();
