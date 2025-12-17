// src/controllers/otp.controller.js
const User = require('../models/User.model');
const axios = require('axios');
const { logTx } = require('../utils/logger');

module.exports = (context) => {
    const API_KEY = process.env.TWO_FACTOR_API_KEY;

    // 1. Request OTP (Force 6-Digit SMS)
    const requestOtp = async (req, res) => {
        const { phone } = req.body; 
        if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

        try {
            const user = await User.findOne({ phone });
            if (!user) return res.status(404).json({ error: 'User not found.' });

            /**
             * ROBUST URL BREAKDOWN:
             * AUTOGEN2: Forces SMS generation.
             * {phone}: The target mobile number.
             * 6: Specifies a 6-digit OTP.
             * OTP_MSG: Uses the default SMS Template.
             */
            const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN/OTP_MSG`;
            
            const response = await axios.get(url);

            if (response.data.Status === "Success") {
                logTx('INFO', `Robust 6-digit SMS OTP Sent to ${phone}. Session: ${response.data.Details}`);
                
                return res.status(200).json({ 
                    message: '6-digit OTP sent via SMS successfully.',
                    sessionId: response.data.Details // Important for verification
                });
            } else {
                throw new Error(response.data.Details);
            }
        } catch (error) {
            logTx('ERROR', '2Factor SMS Gateway Error', error.message);
            return res.status(500).json({ error: 'Failed to send SMS. Please try again.' });
        }
    };

    // 2. Verify OTP
    const verifyOtp = async (req, res) => {
        const { phone, code, sessionId } = req.body; 
        
        if (!phone || !code) {
            return res.status(400).json({ error: 'Phone and OTP Code are required.' });
        }

        try {
            /**
             * VERIFYING VIA SESSION ID:
             * Using the SessionID is more robust than just the phone number.
             */
            const verificationUrl = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${code}`;
            
            const response = await axios.get(verificationUrl);

            if (response.data.Status === "Success" && response.data.Details === "OTP Matched") {
                // Update User Status in Database
                const updatedUser = await User.findOneAndUpdate(
                    { phone }, 
                    { is_phone_verified: true },
                    { new: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({ error: "User record update failed." });
                }
                
                logTx('INFO', `Phone ${phone} verified successfully.`);
                return res.status(200).json({ message: 'Phone number verified successfully!' });
            } else {
                return res.status(401).json({ error: 'Invalid or Expired OTP.' });
            }
        } catch (error) {
            logTx('ERROR', 'OTP Verification Error', error.message);
            return res.status(401).json({ error: 'Verification failed. Code may be incorrect or expired.' });
        }
    };

    return { requestOtp, verifyOtp };
};