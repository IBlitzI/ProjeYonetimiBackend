const Organization = require("../models/organization.model");
const User = require("../models/user.model");

exports.createOrganization = async (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.user.id;

  try {
    const organization = new Organization({
      name,
      description,
      createdBy,
    });

    await organization.save();

    const user = await User.findById(createdBy);
    user.organizations.push({ organization: organization._id, role: "admin" });
    await user.save();

    organization.members.push({ user: createdBy, role: "admin" });
    await organization.save();

    res
      .status(201)
      .json({ message: "Organization created successfully", organization });
  } catch (error) {
    res.status(400).json({ message: "Error creating organization", error });
  }
};

exports.addUserToOrganization = async (req, res) => {
  const { organizationId, userId, role } = req.body;
  try {
    const organization = await Organization.findById(organizationId);
    const user = await User.findById(userId);

    if (!organization || !user) {
      return res
        .status(404)
        .json({ message: "Organization or user not found" });
    }
    const isUserInOrganization = user.organizations.some(
      (org) => org.organization.toString() === organizationId
    );
    if (isUserInOrganization) {
      return res.status(400).json({ message: "User already in organization" });
    }

    user.organizations.push({ organization: organizationId, role });
    await user.save();

    organization.members.push({ user: userId, role });
    await organization.save();

    res.status(200).json({
      message: "User added to organization successfully",
      organization,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error adding user to organization", error });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    if (!organizations) {
      return res.status(404).json({ message: "No organizations found" });
    }
    res.status(200).json(organizations);
  } catch (error) {
    res.status(400).json({ message: "Error fetching organizations", error });
  }
};
