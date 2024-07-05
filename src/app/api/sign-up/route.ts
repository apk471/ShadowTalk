import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from 'bcryptjs';


import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request){
    // Connection to database
    await dbConnect();
    try {
        // Parsing the request body to get the username, email and password
        const {username , email , password} = await request.json();
        // Checking if the username already exists and is verified
        const exsistingUserVerifiedByUsername =  await UserModel.findOne({ 
            username ,
            isVerified: true
        })
        // If the username already exists and is verified, then return the response
        if(exsistingUserVerifiedByUsername){
            return Response.json({
                success: false,
                message: "Username already exists. Please try another one."
            }, {
                status: 400
            });
        }
        // Checking if the email already exists
        const exsistingUserByEmail = await UserModel.findOne({
            email
        });
        // Generating a random code for verification
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        // If the email already exists
        if(exsistingUserByEmail){
            // If the email is already verified, then return the response
            if(exsistingUserByEmail.isVerified){
                return Response.json({
                    success: false,
                    message: "Email already exists. Please try another one."
                }, {
                    status: 400
                });
            }else{
                // If the email is not verified, then update the password and verification code
                const hashedPassword = await bcrypt.hash(password, 10);
                exsistingUserByEmail.password = hashedPassword;
                exsistingUserByEmail.verifyCode = verifyCode;
                exsistingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
                // Save the updated user
                await exsistingUserByEmail.save();

            }
        }else{
            // If the email does not exist, then create a new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
            // Creating a new user
            const newUser = await new UserModel({
                username,
                email,
                password: hashedPassword,
                verifyCode, 
                verifyCodeExpiry: expiryDate,
                isVerified: false,
                isAcceptingMessage: true,
                message: []
            })
            // Saving the new user
            await newUser.save();
        }
        // Sending the verification email
        const emailResponse = await sendVerificationEmail(email , username , verifyCode);
        // If the email is not sent, then return the response
        if(!emailResponse.success){
            return Response.json({
                success: false,
                message: emailResponse.message
            }, {
                status: 500
            });
        }
        // Return the response if the email is sent
        return Response.json({
            success: true,
            message: "Verification email has been sent to your email address."
        }, {
            status: 201
        });


    } catch (error) {
        // If there is an error, then return the response
        console.error("Error in sign-up route: ", error);
        return Response.json({
            success: false,
            message: "Error in sign-up route. Please try again later.",
        } , {
            status: 500
        });
    }

    
    
}


