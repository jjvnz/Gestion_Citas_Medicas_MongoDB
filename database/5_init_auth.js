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

    const existingReceptionist = await User.findByUsername('recepcion');
    if (!existingReceptionist) {
      await User.create({
        username: 'recepcion',
        email: 'recepcion@medicare.com',
        password: 'recepcion123',
        firstName: 'Laura',
        lastName: 'Martínez',
        role: 'receptionist'
      });
      console.log('✅ Usuario recepcionista creado');
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
