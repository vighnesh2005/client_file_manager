import rateLimit from 'express-rate-limit';

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
