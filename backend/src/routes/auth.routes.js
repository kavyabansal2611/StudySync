import {Router} from 'express';
import verifyJWT from '../middlewares/auth.js'
import {register,login,getUserInfo,UpdateUserInfo,sendEmailVerification,verifyEmail,sendPasswordResetEmail,resetPassword,logout} from '../controllers/authcontroller.js'
import {limiter} from '../middlewares/limiter.js'
import { registerSchema } from '../validators/user.validator.js';

const router=Router();

router.post('/register',limiter,validate(registerSchema),register);
router.post('/login',limiter,validate(loginSchema),login);

router.get('/me',verifyJWT,getUserInfo);
router.patch('/me',verifyJWT,UpdateUserInfo);
router.post('/login/emailverify',limiter,verifyJWT,sendEmailVerification);
router.get('/login/emailverify',limiter,verifyJWT,verifyEmail);
router.post('/forgot_password',limiter,sendPasswordResetEmail);
router.post('/reset_password',limiter,resetPassword);
router.post('/logout',limiter,verifyJWT,logout);




