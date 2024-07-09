'use client';

import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounceCallback } from 'usehooks-ts';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signUpSchema } from '@/schemas/signUpSchema';

export default function SignUpForm() {
// username state
  const [username, setUsername] = useState('');
//   username message state
  const [usernameMessage, setUsernameMessage] = useState('');
//   username checking state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
//   submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
//   debounce function
  const debounced = useDebounceCallback(setUsername, 400);
//  every 4 sec the function will be called and username will be set
//  router
  const router = useRouter();
//   toast
  const { toast } = useToast();
// form hook
  const form = useForm<z.infer<typeof signUpSchema>>({
    //  resolver for zod
    resolver: zodResolver(signUpSchema),
    // default values
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });
//   useEffect to check username unique and runs depending on username change which passes through debounced function
  useEffect(() => {
    // method to check username unique
    const checkUsernameUnique = async () => {
        // if username is not empty
      if (username) {
        // set username checking to
        setIsCheckingUsername(true);
        // set username message to empty
        setUsernameMessage(''); // Reset message
        try {
            // get request to check username unique
          const response = await axios.get<ApiResponse>(
            // embbed username in the url since handling query params in backend
            `/api/check-username-unique?username=${username}`
          );
        //   set username message to response data message
          setUsernameMessage(response.data.message);
        } catch (error) {
            // axios error
          const axiosError = error as AxiosError<ApiResponse>;
        //   set username message to response data message error
          setUsernameMessage(
            axiosError.response?.data.message ?? 'Error checking username'
          );
        } finally {
            // set username checking to false once all done
          setIsCheckingUsername(false);
        }
      }
    };

    // Run the function
    checkUsernameUnique();
  }, [username]);

//   on submit function to sign up
  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    // set submitting to true
    setIsSubmitting(true);
    try {
        // post request to sign up
      const response = await axios.post<ApiResponse>('/api/sign-up', data);
        // toast success message
      toast({
        title: 'Success',
        description: response.data.message,
      });
    //   replace router to verify username
      router.replace(`/verify/${username}`);
    //   set submitting to false
      setIsSubmitting(false);
    } catch (error) {
        // console error
      console.error('Error during sign-up:', error);
        // axios error
      const axiosError = error as AxiosError<ApiResponse>;

      // Default error message
      let errorMessage = axiosError.response?.data.message;
      ('There was a problem with your sign-up. Please try again.');
        // if error message is not empty
      toast({
        title: 'Sign Up Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    //   finally set submitting to false
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join True Feedback
          </h1>
          <p className="mb-4">Sign up to start your anonymous adventure</p>
        </div>
        {/* docs for react form shadcn */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input
                    {...field}
                    // onchange event to set username and debounced function
                    onChange={(e) => {
                      field.onChange(e);
                      debounced(e.target.value);
                    }}
                  />
                  {/* if checking username display a loader else display the message */}
                  {isCheckingUsername && <Loader2 className="animate-spin" />}
                  {!isCheckingUsername && usernameMessage && (
                    <p
                      className={`text-sm ${
                        usernameMessage === 'Username is unique'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input {...field} name="email" />
                  <p className='text-muted text-gray-400 text-sm'>We will send you a verification code</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} name="password" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='w-full' disabled={isSubmitting}>
                {/* if it is submitting then load a loader else show sign up button */}
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p>
            Already a member?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}