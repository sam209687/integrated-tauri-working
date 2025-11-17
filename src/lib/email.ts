// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 💡 FIX: Removed the incorrect import of 'resend/build/src/errors'.

// Define a type that potentially includes undocumented Resend error properties
// This type is kept to avoid the 'no-explicit-any' error for accessing 'statusCode'.
interface ResendExtendedError extends Error {
  statusCode?: number;
  message: string;
  name: string;
}

export async function sendOTP(toEmail: string, otp: string, subject: string = "Your OTP") {
  try {
    // Log the API key to confirm it's loaded (for debugging only, remove in production)
    console.log('Using RESEND_API_KEY:', process.env.RESEND_API_KEY ? '******' + process.env.RESEND_API_KEY.slice(-4) : 'NOT SET');
    console.log('Attempting to send OTP email to:', toEmail, 'with OTP:', otp);

    const { data, error } = await resend.emails.send({
      from: 'POS System <onboarding@resend.dev>', // REMINDER: Replace with your VERIFIED Resend domain email
      to: toEmail,
      subject: subject,
      html: `
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p><p>This OTP is valid for 30 minutes (or as specified).</p>
      `,
    });

    if (error) {
      console.error("Error sending OTP email:", error);
      
      console.error("Resend specific error details:");
      console.error("Name:", error.name);
      console.error("Message:", error.message);

      // Cast to the defined interface (ResendExtendedError) instead of 'any'
      // Note: The 'error' object from the Resend SDK should already conform to Error and be safe to cast to our extended type.
      const resendError = error as ResendExtendedError; 
      if (resendError.statusCode) {
        console.error("Status Code:", resendError.statusCode);
      } else {
        console.warn("statusCode property not found on Resend error object directly.");
        // console.error("Full error object:", error);
      }
      
      // Re-throw the error message for consistent error handling in calling functions
      throw new Error(error.message || "Failed to send OTP email.");
    }
    console.log("OTP email sent successfully:", data);
    return data;
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Fallback for non-standard error objects
        errorMessage = (error as { message: string }).message;
    }
    
    console.error("Unhandled error in sendOTP:", errorMessage);
    throw new Error(errorMessage); 
  }
};