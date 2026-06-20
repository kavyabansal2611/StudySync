import { User } from '../models/user.model.js';
import crypto from 'crypto';
import { updateUserSchema } from '../validators/user.validator.js';


export const register=async(req,res)=>{
try{
    const{first_name,last_name,email,password,username,year_of_study}=req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid input' });}
 
    const existingUser=await User.findOne({$or:[{email},{username}]});   // req.body.email should be asserted as string before it touches any query
    
    if(existingUser){
        return res.status(400).json({error:'Registration failed'});
    }
    const newUser=new User(
        {first_name,last_name,email,username,password,year_of_study}
    )
    const accessToken=newUser.generateAccessToken();
    const refreshToken=newUser.generateRefreshToken();
  
    newUser.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    newUser.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Set refresh token expiration to 7 days

    await newUser.save();
    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure:process.env.SECURE_COOKIES === 'true',
        sameSite:'strict',
        maxAge:7*24*60*60*1000
    });
    return res.status(201).json({
        accessToken,
        user:newUser.toSafeObject(),
    });
}catch(err){
    if (err.code===11000){
        return res.status(400).json({error:'Registration failed'});
    }
    console.error(err);
    return res.status(500).json({error:'Internal server error'});
    }
};


export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        if (!email||!password){
            return res.status(400).json({error:"Input email and password"});
        }
        const user=await User.findOne({email}).select('+password');
        if(!user|| !(await user.comparePassword(password))){
            return res.status(401).json({error:'Invalid credentials'});
        }
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        
        user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Set refresh token expiration to 7 days
        await user.save();

        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure: process.env.SECURE_COOKIES === 'true',
            sameSite:'strict',
            maxAge:7*24*60*60*1000
        });
        return res.json({accessToken,user:user.toSafeObject()});
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}
};
export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Hash what came in from the cookie
        const hashedToken = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');
       
        const user = await User.findOne({ 
            refreshToken: hashedToken,
            refreshTokenExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid' });
        }
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        const accessToken = user.generateAccessToken();

        return res.json({ accessToken });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserInfo=async(req,res)=>{
    try{
        const user=await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({error:'Invalid'});
        }
        return res.json({
            user:user.toSafeObject(),
        });
    
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}
};

export const UpdateUserInfo = async (req, res) => {
    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten() });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (Object.keys(result.data).length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        const { first_name, last_name, year_of_study } = result.data;

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (year_of_study !== undefined) user.year_of_study = year_of_study;
    await user.save();
       
    return res.json({ user: user.toSafeObject() });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendEmailVerification=async(req,res)=>{
    try{
        const user=await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({error:'Invalid'});
        }   
        const emailToken=user.emailVerifyToken();
        await user.save({validateBeforeSave:false});

        // send email with token
        return res.json({message:'Verification email sent'});
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}  
};

export const verifyEmail=async(req,res)=>{
    const hashedToken=crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
    
    const user=await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationTokenExpires:{$gt:Date.now()},
    }); 
    if(!user){
        return res.status(400).json({error:'Invalid or expired token'});
    }
    user.isEmailVerified=true;
    user.emailVerificationToken=undefined;
    user.emailVerificationTokenExpires=undefined;
    await user.save();
    return res.json({message:'Email verified successfully'});
};

export const sendPasswordResetEmail=async(req,res)=>{
    try{
        const {email}=req.body;
        if(!email){
            return res.status(400).json({error:'Email is required'});
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({error:'Invalid'});
        }
        const resetToken=user.passwordResetToken();
        await user.save({validateBeforeSave:false});
        return res.json({message:'Password reset email sent'});
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}

};

export const resetPassword=async(req,res)=>{
    try{
        const hashedToken=crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user=await User.findOne({
            passwordResetToken:hashedToken,
            passwordResetTokenExpires:{$gt:Date.now()},
        });

        if(!user){
            return res.status(400).json({error:'Invalid'});
        }
        const {password}=req.body;
        if(!password){
            return res.status(400).json({error:'Password is required'});
        }
        user.password=password;
        user.passwordResetToken=undefined;
        user.passwordResetTokenExpires=undefined;
        user.refreshToken=undefined;
        user.refreshTokenExpires=undefined;
        await user.save();
        return res.json({message:'Password reset successfully'});
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}
    };

    export const logout=async(req,res)=>{
        try{
            const refreshToken=req.cookies.refreshToken;
            if (!refreshToken) {
                res.clearCookie('refreshToken');
                return res.json({ message: 'Logged out successfully' });
            }
            const hashedToken=crypto
                .createHash("sha256")
                .update(refreshToken)
                .digest("hex");
            const user=await User.findOneAndUpdate(
                {refreshToken:hashedToken},
                { $unset: { refreshToken: '', refreshTokenExpires: '' } }
            );
        
        res.clearCookie('refreshToken',{
            httpOnly:true,
        });
        return res.json({message:'Logged out successfully'});
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal server error'});}  
    };



