const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user.model');
const Organization = require('./models/organization.model');
const Project = require('./models/project.model');
const Task = require('./models/task.model');
const Meeting = require('./models/meeting.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winx-project');
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('DB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Mevcut verileri temizle
    console.log('Clearing existing meetings and time entries...');
    await Meeting.deleteMany({});
    await Task.updateMany({}, { $unset: { timeEntries: "", totalTimeSpent: "" } });

    // Örnek kullanıcı ve organizasyon bul
    const user = await User.findOne({}).populate('organization');
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }

    const project = await Project.findOne({ organization: user.organization._id });
    if (!project) {
      console.log('No project found. Creating sample project...');
      const newProject = new Project({
        name: 'Demo Proje',
        description: 'Demo amaçlı örnek proje',
        organization: user.organization._id,
        createdBy: user._id,
        status: 'active',
        priority: 'medium'
      });
      await newProject.save();
    }

    const activeProject = project || await Project.findOne({ organization: user.organization._id });

    // Örnek görevler oluştur/güncelle
    console.log('Creating/updating sample tasks...');
    
    const task1 = new Task({
      title: 'UI Tasarım Geliştirme',
      description: 'Ana sayfanın UI tasarımını geliştir',
      project: activeProject._id,
      assignedTo: user._id,
      createdBy: user._id,
      status: 'completed',
      priority: 'high',
      totalTimeSpent: 180, // 3 saat
      timeEntries: [
        {
          user: user._id,
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 saat çalışma
          duration: 120,
          description: 'Ana sayfa tasarımı'
        },
        {
          user: user._id,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
          endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 saat çalışma
          duration: 60,
          description: 'Son rötuşlar'
        }
      ]
    });

    const task2 = new Task({
      title: 'API Entegrasyonu',
      description: 'Backend API entegrasyonunu tamamla',
      project: activeProject._id,
      assignedTo: user._id,
      createdBy: user._id,
      status: 'in-progress',
      priority: 'medium',
      totalTimeSpent: 240, // 4 saat
      timeEntries: [
        {
          user: user._id,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gün önce
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 saat çalışma
          duration: 240,
          description: 'API endpoint\'leri bağlama'
        }
      ]
    });

    const task3 = new Task({
      title: 'Test Yazma',
      description: 'Unit testleri yaz',
      project: activeProject._id,
      assignedTo: user._id,
      createdBy: user._id,
      status: 'pending',
      priority: 'low',
      totalTimeSpent: 0
    });

    await Task.deleteMany({ project: activeProject._id });
    await task1.save();
    await task2.save();
    await task3.save();

    // Örnek toplantılar oluştur
    console.log('Creating sample meetings...');
    
    const meeting1 = new Meeting({
      title: 'Haftalık Sprint Toplantısı',
      description: 'Haftalık gelişme durumu değerlendirmesi',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 saat
      meetingType: 'online',
      organizer: user._id,
      organization: user.organization._id,
      project: activeProject._id,
      attendees: [{ user: user._id, status: 'accepted' }],
      status: 'scheduled'
    });

    const meeting2 = new Meeting({
      title: 'Proje Planlama Toplantısı',
      description: 'Yeni sprint planlaması',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 saat
      meetingType: 'physical',
      location: 'Toplantı Odası A',
      organizer: user._id,
      organization: user.organization._id,
      project: activeProject._id,
      attendees: [{ user: user._id, status: 'accepted' }],
      status: 'scheduled'
    });

    const meeting3 = new Meeting({
      title: 'Demo Sunumu',
      description: 'Müşteriye demo sunumu',
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 gün sonra
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 dakika
      meetingType: 'hybrid',
      location: 'Konferans Salonu',
      organizer: user._id,
      organization: user.organization._id,
      attendees: [{ user: user._id, status: 'accepted' }],
      status: 'scheduled'
    });

    await meeting1.save();
    await meeting2.save();
    await meeting3.save();

    console.log('✅ Sample data created successfully!');
    console.log('📊 Created:');
    console.log(`   - 3 tasks with time tracking`);
    console.log(`   - 3 upcoming meetings`);
    console.log(`   - Total time spent: ${(180 + 240) / 60} hours`);

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => {
  seedData();
}); 