const { rtokenModel } = require("../../schemas/rtoken");
const { userModel } = require("../../schemas/user");
const { decrypt } = require("../../utils/rsa_4096");
const { sha256_hex } = require("../../utils/sha256");
require('dotenv').config();

exports.registrationHandler = async (req, res) => {
    try {
        if (!!(await userModel.findOne({ email: req.body.email }))) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const newUserObj = new userModel(req.body);
        newUserObj.password = sha256_hex(decrypt(newUserObj.password));
        await newUserObj.save();

        res.status(200).json({
            success: true,
            message: 'Registered'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: process.env.DEBUG_MODE? e.message : 'An error was encountered, check your request and try again'
        });
    }
};

exports.deregistrationHandler = async (req, res) => {
    try {
        if (!req.USEROBJ)
            throw new Error('Fatal: USEROBJ key not found on request');
            
        if (sha256_hex(decrypt(req.body.password)) !== userObj.password) {
            res.status(401).json({
                success: false,
                message: 'User credentials invalid'
            });
        } else {
            await userModel.deleteMany({ _id: userObj._id });
            await rtokenModel.deleteMany({
                email: req.USEROBJ.email,
                utype: 'user'
            });
            res.status(200).json({
                success: true,
                message: 'Deregistered'
            });
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: process.env.DEBUG_MODE? e.message : 'An error was encountered, check your request and try again'
        });
    }
};