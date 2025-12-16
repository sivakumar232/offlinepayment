// src/models/DeviceRegistry.model.js

const mongoose = require('mongoose');

const DeviceRegistrySchema = new mongoose.Schema({
    device_id: {
        type: String,
        required: true,
        unique: true, // One device_id record per system
        trim: true,
    },
    wallet_id: {
        type: String,
        required: true,
        unique: true, // One wallet_id per registered device (1:1 binding)
    },
    public_key: {
        type: String,
        required: true,
        // Key stored for verification (should match wallet's public_key)
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'REVOKED'],
        default: 'ACTIVE',
    }
}, {
    // renamed registered_at to created_at (Mongoose default) for simplicity
    timestamps: { createdAt: 'registered_at', updatedAt: false }
});

const DeviceRegistry = mongoose.model('DeviceRegistry', DeviceRegistrySchema);

module.exports = DeviceRegistry;