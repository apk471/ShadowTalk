import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

// POST /api/verify-code
export async function POST(request: Request) {
  // Connect to the database
  await dbConnect();
  // Get the request body
  try {
    const { username, code } = await request.json();
    // Decode the username from URI
    const decodedUsername = decodeURIComponent(username);
    // Find the user in the database
    const user = await UserModel.findOne({ username: decodedUsername });
    // If the user is not found, return an error response
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the code is correct and not expired
    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    // If the code is correct and not expired, update the user's verification status
    if (isCodeValid && isCodeNotExpired) {
      // Update the user's verification status
      user.isVerified = true;
      await user.save();

      return Response.json(
        { success: true, message: 'Account verified successfully' },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      // Code has expired
      return Response.json(
        {
          success: false,
          message:
            'Verification code has expired. Please sign up again to get a new code.',
        },
        { status: 400 }
      );
    } else {
      // Code is incorrect
      return Response.json(
        { success: false, message: 'Incorrect verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    return Response.json(
      { success: false, message: 'Error verifying user' },
      { status: 500 }
    );
  }
}