// User Model
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

class User {
  static collectionName = 'users';

  static async getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Crear nuevo usuario
  static async create(userData) {
    const collection = await this.getCollection();
    
    // Verificar si el usuario ya existe
    const existingUser = await collection.findOne({ 
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });
    
    if (existingUser) {
      throw new Error('Usuario o email ya existe');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'receptionist', // 'admin', 'doctor', 'receptionist'
      profile: {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(user);
    
    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: result.insertedId };
  }

  // Buscar usuario por ID
  static async findById(id) {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!user) return null;
    
    // Remover contraseña antes de retornar
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  // Buscar usuario por username
  static async findByUsername(username) {
    const collection = await this.getCollection();
    return await collection.findOne({ username });
  }

  // Validar contraseña
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar usuario
  static async update(id, updateData) {
    const collection = await this.getCollection();
    
    // Si se actualiza la contraseña, hashearla
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    updateData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return null;

    // Remover contraseña antes de retornar
    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
  }

  // Obtener todos los usuarios
  static async findAll(filter = {}) {
    const collection = await this.getCollection();
    const users = await collection.find(filter).toArray();
    
    // Remover contraseñas de todos los usuarios
    return users.map(({ password, ...user }) => user);
  }

  // Eliminar usuario (soft delete)
  static async delete(id) {
    const collection = await this.getCollection();
    return await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'inactive',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
  }

  // Crear índices
  static async createIndexes() {
    const collection = await this.getCollection();
    
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ username: 1 }, { unique: true });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ role: 1 });
    
    console.log('✅ Índices de usuarios creados');
  }
}

module.exports = User;
