// controllers/device.controller.js

const Wallet = require('../models/Wallet.model');
const DeviceRegistry = require('../models/DeviceRegistry.model');

module.exports = (context) => {
    // Stage 0: Bind device to wallet

    const registerDevice = async (req, res) => {
        const { wallet_id, device_id, public_key } = req.body;

        if (!wallet_id || !device_id || !public_key) {
            return res.status(400).json({ error: 'wallet_id, device_id, and public_key are required.' });
        }
        
        try {
            // 1. Validate Wallet Existence 
            const existingWallet = await Wallet.findOne({ wallet_id });

            if (!existingWallet) {
                return res.status(404).json({ error: `Wallet ID ${wallet_id} not found.` });
            }

            // 2. Cross-check data consistency (Ensure wallet has the same key/device ID)
            if (existingWallet.device_id !== device_id || existingWallet.public_key !== public_key) {
                return res.status(409).json({ error: 'Device details mismatch with wallet binding.' });
            }
            
            // 3. Prevent re-registration in Device Registry
            const existingDevice = await DeviceRegistry.findOne({ device_id });
            if (existingDevice) {
                 return res.status(409).json({ error: 'Device is already registered.' });
            }

            // 4. Create Device Registry Entry
            const newDevice = new DeviceRegistry({
                device_id,
                wallet_id,
                public_key,
                status: 'ACTIVE',
            });

            await newDevice.save();

            // 5. Success Response
            return res.status(201).json({
                message: "Device registered successfully. Stage 0 complete."
            });

        } catch (error) {
            console.error("Error registering device:", error);
            return res.status(500).json({ error: "Internal Server Error during device registration." });
        }
    };

    return { registerDevice };
};