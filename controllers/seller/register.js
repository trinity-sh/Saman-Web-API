const { rtokenModel } = require("../../schemas/rtoken");
const { sellerModel } = require("../../schemas/seller");
const { decrypt } = require("../../utils/rsa_4096");
const { sha256_hex } = require("../../utils/sha256");
require('dotenv').config();

exports.registrationHandler = async (req, res) => {
    try {
        if (!!(await sellerModel.findOne({ email: req.body.email }))) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const newUserObj = new sellerModel(req.body);
        const decryptedPwd = decrypt(newUserObj.password);
        const pwdHash = sha256_hex(decryptedPwd);
        newUserObj.password = pwdHash;
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
            
        const decryptedPwd = decrypt(req.body.password);
        const pwdHash = sha256_hex(decryptedPwd);
        const userObj = req.USEROBJ;
        if (pwdHash !== userObj.password) {
            res.status(401).json({
                success: false,
                message: 'User credentials invalid'
            });
        } else {
            await sellerModel.deleteMany({ _id: userObj._id });
            await rtokenModel.deleteMany({ 
                email: req.USEROBJ.email, 
                utype: 'seller'
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