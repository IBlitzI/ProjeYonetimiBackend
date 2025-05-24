const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/auth");
const { isValidEmail } = require("../utils/helpers");

exports.register = async (req, res) => {
  const { username, email, password, name } = req.body;
  try {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Geçersiz e-posta adresi", error: "INVALID_EMAIL" });
    }

    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });

    if (existingUserByEmail) {
      return res.status(400).json({ 
        message: "Bu e-posta adresi zaten kullanımda", 
        error: "EMAIL_EXISTS" 
      });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ 
        message: "Bu kullanıcı adı zaten alınmış", 
        error: "USERNAME_EXISTS" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword,
      name: name || username,
      role: "employee",
      status: "pending"
    });
    
    await user.save();

    // Token oluştur ama organizasyon bilgisi olmadan
    const token = generateToken(user._id, user.role);

    res.status(201).json({ 
      message: "Kullanıcı başarıyla oluşturuldu", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        needsOnboarding: true
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ message: "Kullanıcı oluşturulurken hata", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login attempt for:', email);
    const user = await User.findOne({ email }).populate('organization');
    console.log('User found:', user ? user.email : 'not found');
    console.log('Organization:', user?.organization ? user.organization.name : 'none');
    console.log('Invite code:', user?.organization?.inviteCode);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı", error: "USER_NOT_FOUND" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Geçersiz kimlik bilgileri", error: "INVALID_CREDENTIALS" });
    }

    const token = generateToken(user._id, user.role);
    
    res.status(200).json({ 
      message: "Giriş başarılı", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organization: user.organization ? {
          _id: user.organization._id,
          name: user.organization.name,
          description: user.organization.description,
          inviteCode: user.organization.inviteCode
        } : null,
        needsOnboarding: !user.organization
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "Giriş yapılırken hata", error: error.message });
  }
};

// Onboarding - Organizasyon oluşturma
exports.createOrganization = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;
  
  try {
    console.log('Create organization request:', {
      userId,
      name,
      description,
      user: req.user
    });
    
    const user = await User.findById(userId);
    console.log('User found:', user ? { id: user._id, email: user.email, organization: user.organization } : 'not found');
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (user.organization) {
      return res.status(400).json({ message: "Zaten bir organizasyona üyesiniz" });
    }

    console.log('Creating organization with data:', { name, description, createdBy: userId });

    // Organizasyon oluştur
    const organization = new Organization({
      name,
      description,
      createdBy: userId,
      members: [userId]
    });
    
    await organization.save();
    console.log('Organization created:', { id: organization._id, name: organization.name, inviteCode: organization.inviteCode });

    // Kullanıcıyı güncelle
    user.organization = organization._id;
    user.role = "admin"; // Kurucu otomatik admin
    user.status = "active";
    await user.save();
    console.log('User updated:', { id: user._id, role: user.role, organization: user.organization });

    res.status(201).json({
      message: "Organizasyon başarıyla oluşturuldu",
      organization: {
        _id: organization._id,
        name: organization.name,
        description: organization.description,
        inviteCode: organization.inviteCode
      },
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organization: {
          _id: organization._id,
          name: organization.name,
          description: organization.description,
          inviteCode: organization.inviteCode
        },
        needsOnboarding: false
      }
    });
  } catch (error) {
    console.error("Create organization error:", error);
    res.status(400).json({ message: "Organizasyon oluşturulurken hata", error: error.message });
  }
};

// Onboarding - Organizasyona katılma
exports.joinOrganization = async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.userId;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (user.organization) {
      return res.status(400).json({ message: "Zaten bir organizasyona üyesiniz" });
    }

    const organization = await Organization.findOne({ inviteCode });
    if (!organization) {
      return res.status(404).json({ message: "Geçersiz davet kodu" });
    }

    // Organizasyona ekle
    organization.members.push(userId);
    await organization.save();

    // Kullanıcıyı güncelle
    user.organization = organization._id;
    user.status = "active";
    await user.save();

    res.status(200).json({
      message: "Organizasyona başarıyla katıldınız",
      organization: {
        id: organization._id,
        name: organization.name,
        description: organization.description
      }
    });
  } catch (error) {
    console.error("Join organization error:", error);
    res.status(400).json({ message: "Organizasyona katılırken hata", error: error.message });
  }
};

// Organizasyon ile birlikte kayıt (Admin)
exports.registerWithOrganization = async (req, res) => {
  const { username, email, password, name, organizationName, organizationDescription } = req.body;
  
  try {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Geçersiz e-posta adresi", error: "INVALID_EMAIL" });
    }

    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });

    if (existingUserByEmail) {
      return res.status(400).json({ 
        message: "Bu e-posta adresi zaten kullanımda", 
        error: "EMAIL_EXISTS" 
      });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ 
        message: "Bu kullanıcı adı zaten alınmış", 
        error: "USERNAME_EXISTS" 
      });
    }

    // Kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword,
      name: name || username,
      role: "admin",
      status: "active"
    });
    
    await user.save();

    // Organizasyon oluştur
    const organization = new Organization({
      name: organizationName,
      description: organizationDescription || '',
      createdBy: user._id,
      members: [user._id]
    });
    
    await organization.save();

    // Kullanıcıya organizasyon ata
    user.organization = organization._id;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({ 
      message: "Organizasyon ve hesap başarıyla oluşturuldu", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organization: {
          _id: organization._id,
          name: organization.name,
          description: organization.description,
          inviteCode: organization.inviteCode
        }
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        description: organization.description,
        inviteCode: organization.inviteCode
      }
    });
  } catch (error) {
    console.error("Register with organization error:", error);
    res.status(400).json({ message: "Kayıt yapılırken hata", error: error.message });
  }
};

// Davet kodu ile kayıt (Çalışan)
exports.registerWithInviteCode = async (req, res) => {
  const { username, email, password, name, inviteCode } = req.body;
  
  try {
    console.log('Register with invite code request:', { username, email, inviteCode });

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Geçersiz e-posta adresi", error: "INVALID_EMAIL" });
    }

    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });

    if (existingUserByEmail) {
      return res.status(400).json({ 
        message: "Bu e-posta adresi zaten kullanımda", 
        error: "EMAIL_EXISTS" 
      });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ 
        message: "Bu kullanıcı adı zaten alınmış", 
        error: "USERNAME_EXISTS" 
      });
    }

    // Organizasyonu davet kodu ile bul
    console.log('Looking for organization with invite code:', inviteCode);
    const organization = await Organization.findOne({ inviteCode });
    console.log('Organization found:', organization ? organization.name : 'not found');
    
    if (!organization) {
      return res.status(404).json({ message: "Geçersiz davet kodu" });
    }

    // Kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword,
      name: name || username,
      role: "employee",
      status: "active",
      organization: organization._id
    });
    
    await user.save();

    // Organizasyona kullanıcı ekle
    organization.members.push(user._id);
    await organization.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({ 
      message: "Organizasyona başarıyla katıldınız", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organization: {
          _id: organization._id,
          name: organization.name,
          description: organization.description,
          inviteCode: organization.inviteCode
        }
      }
    });
  } catch (error) {
    console.error("Register with invite code error:", error);
    res.status(400).json({ message: "Kayıt yapılırken hata", error: error.message });
  }
};
