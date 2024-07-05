import {resend} from "@/lib/resend";
import VerificationEmail from "../../emails/verificationEmail";
import { ApiResponse } from "@/types/ApiResponse";


// Purpose: Send a verification email to the user
export async function sendVerificationEmail(
    email: string,
    username: string,
    verifyCode: string
) : Promise<ApiResponse> {
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Mystery Message Verification Code',
            react: VerificationEmail({ username, otp: verifyCode }),
          });
        return{success: true , message: " Sending verification email successfull"}
    } catch (error) {
        console.log("error sending verification email" , error);
        return{success: false , message: "Error sending verification email"}
        
    }
}