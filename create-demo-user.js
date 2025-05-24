const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user.model');
const Organization = require('./models/organization.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winx-project');
    console.log('MongoDB connected for demo user creation');
  } catch (error) {
    console.error('DB connection error:', error);
    process.exit(1);
  }
};

const createDemoUser = async () => {
  try {
    // Mevcut demo kullanıcısını sil
    await User.deleteMany({ email: 'demo@winx.com' });
    await Organization.deleteMany({ name: 'Demo Organizasyon' });

    // Demo kullanıcı oluştur (organizasyon olmadan)
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = new User({
      name: 'Demo Kullanıcı',
      username: 'demo',
      email: 'demo@winx.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });
    await user.save();

    // Demo organizasyon oluştur (kullanıcı ID'si ile)
    const organization = new Organization({
      name: 'Demo Organizasyon',
      description: 'Test amaçlı demo organizasyon',
      inviteCode: 'DEMO123',
      createdBy: user._id,
      members: [user._id]
    });
    await organization.save();

    // Kullanıcıya organizasyon atama
    user.organization = organization._id;
    await user.save();

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email: demo@winx.com');
    console.log('🔐 Password: demo123');
    console.log('🏢 Organization: Demo Organizasyon');
    console.log('🎫 Invite Code: DEMO123');

  } catch (error) {
    console.error('Demo user creation error:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => {
  createDemoUser();
}); 