import bcrypt from 'bcrypt';
import { userModel } from "../Model/UserModel.js";
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import TokenModel from '../Model/userToken.js';
import { reminderModel } from '../Model/ReminderModel.js';
import nodemailer from 'nodemailer';
import OtpModel from '../Model/OTPModel.js';
import crypto from 'crypto';










// To get user 

export const getUser = async (req, res) => {

    try {
        const getUser = await userModel.find({});
        return res.status(200).json({ res: getUser });
    } catch (err) {
        return res.status(400).json({ res: 'Error while fetching the data from server' });
    }
};



const USER = process.env.USER;
const PASS = process.env.PASSWORD;





// To register user ---------------------------------------------------------------


export const addSignupUser = async (req, res) => {

    try {
        const findUserExist = await userModel.findOne({ email: req.body.email });

        if (findUserExist) {
            return res.status(400).json({ 'res': 'User is already registered' });
        }
        // Generate a random 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        if (req.body.password === '') {
            return res.status(400).json({ "res": 'Password is empty' });
        } else {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const addSignupUser = new userModel({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                userrole: 0,
                isVerified: false
            });

            const newUser = await addSignupUser.save();

            // Save the OTP to the OTP collection

            const otpEntry = new OtpModel({
                email: req.body.email,
                otp: otp,
            });

            await otpEntry.save();

            res.status(200).json({ res: 'User has been registered successfully', newUser });


            //  NodeMailer Transporter :

            const transporter = nodemailer.createTransport({
                port: 465,
                host: "smtp.gmail.com",
                auth: {
                    user: USER,
                    pass: PASS,
                },
                secure: true,
            });

            await new Promise((resolve, reject) => {

                // verify connection configuration

                transporter.verify(function (error, success) {
                    if (error) {
                        console.log(error);
                        reject(error);
                    } else {
                        console.log("OTP has been sent to your Email");
                        resolve(success);
                    }
                });
            });

            // send mail with defined transport object

            const message = await transporter.sendMail({

                from: USER,
                to: req.body.email,
                subject: "Verify your Email ✔",
                html: `Your Email verification OTP IS : ${otp}`
            });

            // Send Mail :

            await new Promise((resolve, reject) => {
                transporter.sendMail(message, (err, info) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ res: 'Error while signing up user', err });
    }
};




//-------------------------------------------------------------------------------------------------

// OTP Verify :


export const otpVerify = async (req, res) => {
    const { email, emailToken } = req.body

    // Validate that both email and emailToken are provided
    if (!email || !emailToken) {
        return res.status(400).json({ 'res': 'Both email and emailToken are required' });
    }

    try {
        if (emailToken && emailToken.length === 6 && !isNaN(Number(emailToken))) {
            // Find the OTP in the OTP collection
            const findOtp = await OtpModel.findOne({ email: email, otp: emailToken });

            if (!findOtp) {
                return res.status(404).json({ 'res': 'User not found or OTP is not verified' });
            }

            // Find the user with the specified email and update the isVerified field to true
            const updatedUser = await userModel.findOneAndUpdate(
                { email: email },
                { $set: { isVerified: true } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ 'res': 'User not found or OTP is not verified' });
            }
            // Delete the OTP entry from the OTP collection since it is no longer needed
            // await findOtp.remove();

            res.status(200).json({ 'res': 'Account has been registered', 'user': updatedUser });
        } else {
            res.status(400).json({ 'res': 'Invalid OTP format' });
        }
    } catch (error) {
        return res.status(500).json({ 'res': `The Error is : ${error}` });
    }
};





// To login user 

export const loginUser = async (req, res) => {

    try {
        const user = await userModel.findOne({ email: req.body.email });


        if (!user) {
            return res.status(400).json({ "res": 'Invalid credential' })
        } else if (user?.isVerified === false) {
            return res.status(404).json({ 'res': 'You are not Verified' });
        }

        const match = await bcrypt.compare(req.body.password, user.password);

        if (match) {
            const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_TOKEN, { expiresIn: '10m' });
            const refreshToken = jwt.sign(user.toJSON(), process.env.REFRESH_TOKEN);

            const token = new TokenModel({ token: refreshToken });
            await token.save();

            return res.status(200).json({ myAccessToken: accessToken, myRefreshToken: refreshToken, username: user.username, email: user.email, userrole: user.userrole })

        } else {
            return res.status(400).json({ 'res': 'Invalid credential' });
        }
    } catch (error) {
        return res.status(500).json({ 'res': 'Error occurred occurred while login' });
    };
}



export const createReminders = async (req, res) => {
    const addData = await reminderModel.insertMany(req.body);
    console.log(addData);
    res.json(addData);
};


//get all Products : 
export const viewReminders = async (req, res) => {

    const getAllData = await reminderModel.find({});
    console.log(getAllData);
    res.json(getAllData);

};

//get particular Product : 
export const viewSingleReminder = async (req, res) => {
    const paramsId = req.params.id;
    const productIndex = await reminderModel.findById({ _id: paramsId });
    console.log(productIndex);
    res.json(productIndex);
};

// replace reminder : 
export const replaceReminder = async (req, res) => {
    const paramsId = req.params.id;
    const doc = await reminderModel.findOneAndReplace({ _id: paramsId }, req.body, { new: true });
    console.log(doc);
    res.json(doc);

};

// Update reminder :
export const updateReminder = async (req, res) => {
    const paramsId = req.params.id;
    const doc = await reminderModel.findByIdAndUpdate({ _id: paramsId }, req.body, { new: true });
    console.log(doc);
    res.json(doc);
};

// Delete reminder : 
export const deleteReminder = async (req, res) => {
    const paramsId = req.params.id;
    const doc = await reminderModel.findOneAndDelete({ _id: paramsId, });
    console.log('Object deleted from the DB');
    res.json({ "delete": true });
};





