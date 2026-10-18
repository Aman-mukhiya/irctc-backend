import cors from "cors"
// const { config } = require('../config');
import config from "../config/index.js";

const corsMiddleware = cors({
     origin: config.ALLOWED_ORIGINS.split(','),
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
     ],
});

export default corsMiddleware


