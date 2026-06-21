"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfigAppModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var Joi = _interopRequireWildcard(require("joi"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let ConfigAppModule = exports.ConfigAppModule = class ConfigAppModule {};
exports.ConfigAppModule = ConfigAppModule = __decorate([(0, _common.Module)({
  imports: [_config.ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.local', '.env'],
    validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      PORT: Joi.number().default(3001),
      // Database
      DATABASE_URL: Joi.string().required(),
      DIRECT_URL: Joi.string().optional(),
      // JWT
      JWT_SECRET: Joi.string().min(32).required(),
      JWT_EXPIRES_IN: Joi.string().default('15m'),
      JWT_REFRESH_SECRET: Joi.string().min(32).required(),
      JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
      // Redis
      REDIS_HOST: Joi.string().default('localhost'),
      REDIS_PORT: Joi.number().default(6379),
      REDIS_PASSWORD: Joi.string().optional().allow(''),
      REDIS_DB: Joi.number().default(0),
      // CORS
      ALLOWED_ORIGINS: Joi.string().optional(),
      CORS_ALLOW_ALL: Joi.boolean().default(false),
      // Stripe
      STRIPE_SECRET_KEY: Joi.string().optional(),
      STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
      STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
      // AI
      OPENAI_API_KEY: Joi.string().optional(),
      ANTHROPIC_API_KEY: Joi.string().optional(),
      // Email
      SMTP_HOST: Joi.string().default('smtp.gmail.com'),
      SMTP_PORT: Joi.number().default(587),
      SMTP_USER: Joi.string().optional(),
      SMTP_PASS: Joi.string().optional(),
      EMAIL_FROM: Joi.string().default('noreply@eduai.app'),
      // Twilio
      TWILIO_ACCOUNT_SID: Joi.string().optional(),
      TWILIO_AUTH_TOKEN: Joi.string().optional(),
      TWILIO_PHONE_NUMBER: Joi.string().optional(),
      // AWS S3
      AWS_ACCESS_KEY_ID: Joi.string().optional(),
      AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
      AWS_REGION: Joi.string().default('us-east-1'),
      AWS_S3_BUCKET: Joi.string().default('eduai-uploads'),
      // Elasticsearch
      ELASTICSEARCH_NODE: Joi.string().default('http://localhost:9200'),
      ELASTICSEARCH_USERNAME: Joi.string().optional(),
      ELASTICSEARCH_PASSWORD: Joi.string().optional(),
      // FCM
      FCM_SERVER_KEY: Joi.string().optional()
    }),
    validationOptions: {
      allowUnknown: true,
      abortEarly: false
    }
  })]
})], ConfigAppModule);