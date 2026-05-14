import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { UserService } from '../modules/user/user.service';

/**
 * Google OAuth 2.0 Strategy Configuration
 *
 * How it works:
 * 1. User clicks "Sign in with Google" on the frontend
 * 2. Frontend redirects to our /api/auth/google endpoint
 * 3. We redirect the user to Google's login page
 * 4. Google asks the user to allow Gurukool to access their profile
 * 5. Google redirects back to our callback URL with an auth code
 * 6. This strategy exchanges the code for the user's profile info
 * 7. We create/find the user in our database and issue our own JWT
 */
export const configurePassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          // Extract user info from Google profile
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const fullName = profile.displayName || 'Gurukool User';
          const avatarUrl = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Find existing user or create a new one
          const userService = new UserService();
          let user = await userService.findByGoogleId(googleId);

          if (!user) {
            // Check if a user with this email already exists (maybe signed up via OTP)
            user = await userService.findByEmail(email);

            if (user) {
              // Link Google account to existing user
              user = await userService.linkGoogleAccount(user.id, googleId, avatarUrl);
            } else {
              // Create brand new user
              user = await userService.createUser({
                email,
                fullName,
                avatarUrl,
                googleId,
                authProvider: 'google',
                isVerified: true, // Google already verified the email
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Serialize user for session (we use JWT so this is minimal)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    done(null, false);
  });
};

export default passport;
