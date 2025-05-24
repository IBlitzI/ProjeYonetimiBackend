const Organization = require("../models/organization.model");

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getUserRole = async (userId, organizationId) => {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return null;
  }
  const member = organization.members.find(
    (member) => member.user.toString() === userId
  );
  if (!member) {
    return null;
  }
  return member.role;
};

module.exports = { isValidEmail, getUserRole };
