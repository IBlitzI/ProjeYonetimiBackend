const { verifyToken } = require("../utils/auth");
const Organization = require("../models/organization.model");

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;

      if (roles.length) {
        let organizationId = req.params.organizationId;
        if (!organizationId) {
          organizationId = req.body.organizationId;
        }
        if (!organizationId) {
          return res
            .status(400)
            .json({ message: "Organization ID is required" });
        }

        const organization = await Organization.findById(
          organizationId
        ).populate("members.user");
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const userInOrganization = organization.members.find(
          (member) => member.user._id.toString() === req.user.id
        );
        if (!userInOrganization || !roles.includes(userInOrganization.role)) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token", error });
    }
  };
};

module.exports = authMiddleware;
