import {z} from 'zod';

// Define the schema for the sign in request
export const signInSchema = z.object({
    identifer: z.string(),
    password: z.string(),
});