// routes/devices.routes.js

const express = require('express');
const deviceController = require('../controllers/device.controller'); // Path from 'routes' to 'controllers'

module.exports = (context) => {
    const router = express.Router();
    const controller = deviceController(context);

    // ROUTE: POST /api/devices/register (Device Registration)
    router.post('/devices/register', controller.registerDevice);

    return router;
};