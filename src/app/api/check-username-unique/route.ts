import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { z } from 'zod';
import { usernameValidation } from '@/schemas/signUpSchema';

// username validation schema
const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

// GET /api/check-username-unique
export async function GET(request: Request) {
  // Connect to the database
  await dbConnect();

  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    // Parse the query parameters to get the username
    const queryParams = {
      username: searchParams.get('username'),
    };
    // Validate the query parameters
    const result = UsernameQuerySchema.safeParse(queryParams);
    // If the query parameters are invalid, return an error response
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            usernameErrors?.length > 0
              ? usernameErrors.join(', ')
              : 'Invalid query parameters',
        },
        { status: 400 }
      );
    }
    // Get the username from the query parameters
    const { username } = result.data;
    // Check if the username is unique and verified
    const existingVerifiedUser = await UserModel.findOne({
      username,
      isVerified: true,
    });
    // If the username is already taken, return an error response
    if (existingVerifiedUser) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 200 }
      );
    }
    // If the username is unique, return a success response
    return Response.json(
      {
        success: true,
        message: 'Username is unique',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking username:', error);
    return Response.json(
      {
        success: false,
        message: 'Error checking username',
      },
      { status: 500 }
    );
  }
}