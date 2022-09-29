const { buyerModel } = require("../schemas/buyer");
require('dotenv').config('../.env');

exports.authorisationHandler = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET, async (err, userObj) => {
                if (err) {
                    res.status(400).json({
                        success: false,
                        message: process.env.DEBUG_MODE? err.message : 'An error was encountered, check your request and try again'
                    });
                } else if (await rtokenModel.findOne({ email: userObj.email, utype: 'buyer' }) != null) {
                    req.IS_AUTH = true;
                    req.USEROBJ = await buyerModel.findOne({ _id: userObj._id });
                    return next();
                } else {
                    return res.status(403).json({
                        success: false,
                        message: 'Login to continue'
                    });
                }
            });
        } else {
            res.status(403).json({
                success: false,
                message: 'Token missing in payload'
            });
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: process.env.DEBUG_MODE? e.message : 'An error was encountered, check your request and try again'
        });
    }
};


/* Function to create new authorisation token from refresh token after the latter's expiry */
exports.refreshAuthorisationHandler = async (req, res) => {
    try {
        if (req.headers.authorization) {
            const rtokenObj = await rtokenModel.findOne({ rtoken: req.headers.authorization.split(' ')[1] });
            
            if (rtokenObj == null)
                return res.status(400).json({
                    success: false,
                    message: 'Invalid token'
                });

            const userObj = await buyerModel.findOne({ email: rtokenObj.email });

            if (userObj == null)
                return res.status(400).json({
                    success: false,
                    message: 'Invalid token'
                });

            const token = jwt.sign({
                    _id: userObj._id,
                    email: userObj.email
                },
                process.env.JWT_SECRET,
                { expiresIn: parseInt(process.env.JWT_EXP) }
            );

            return res.status(200).json({
                success: true,
                message: 'Token generated',
                jwt: token
            });
        } else {
            res.status(403).json({
                success: false,
                message: 'Token payload missing'
            });
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: process.env.DEBUG_MODE? e.message : 'An error was encountered, check your request and try again'
        });
    }
};