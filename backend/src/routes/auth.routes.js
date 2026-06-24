import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.js'
import { register, login, getUserInfo, UpdateUserInfo, sendEmailVerification, verifyEmail, sendPasswordResetEmail, resetPassword, logout } from '../controllers/authcontroller.js'
import { limiter } from '../middlewares/limiter.js'
import { registerSchema, loginSchema } from '../validators/user.validator.js';
import { validate } from '../middlewares/validator.js'

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.get('/me', verifyJWT, getUserInfo);
router.patch('/me', verifyJWT, UpdateUserInfo);
router.post('/emailverify', verifyJWT, sendEmailVerification);
router.get('/emailverify', verifyEmail);
router.post('/forgot_password', sendPasswordResetEmail);
router.post('/reset_password', resetPassword);
router.post('/logout', verifyJWT, logout);

export default router;