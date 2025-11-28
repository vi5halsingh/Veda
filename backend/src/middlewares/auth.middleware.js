const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

async function authUser(req, res, next) {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }
  
  try {
    // Use jwt.verify instead of jwt.decode to verify the signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

module.exports = {authUser}