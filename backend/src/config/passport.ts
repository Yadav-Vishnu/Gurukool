import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
// @ts-ignore
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { env } from './env';
import { UserService } from '../modules/user/user.service';

/**
 * Configure Passport strategies for multi-provider OAuth (Google, GitHub, LinkedIn)
 */
export const configurePassport = (): void => {
  const userService = new UserService();

  // 1. Google OAuth 2.0 Strategy
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
        profile: GoogleProfile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const fullName = profile.displayName || 'Gurukool User';
          const avatarUrl = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          let user = await userService.findByGoogleId(googleId);

          if (!user) {
            user = await userService.findByEmail(email);
            if (user) {
              user = await userService.linkGoogleAccount(user.id, googleId, avatarUrl);
            } else {
              user = await userService.createUser({
                email,
                fullName,
                avatarUrl,
                googleId,
                authProvider: 'google',
                isVerified: true,
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

  // 2. GitHub OAuth 2.0 Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const githubId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const fullName = profile.displayName || profile.username || 'Gurukool User';
          const avatarUrl = profile.photos?.[0]?.value || null;

          let user = await userService.findByGithubId(githubId);

          if (!user) {
            if (email) {
              user = await userService.findByEmail(email);
              if (user) {
                user = await userService.linkGithubAccount(user.id, githubId, avatarUrl);
              }
            }

            if (!user) {
              user = await userService.createUser({
                email: email || undefined,
                fullName,
                avatarUrl,
                githubId,
                authProvider: 'github',
                isVerified: !!email,
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

  // 3. LinkedIn OAuth 2.0 Strategy
  passport.use(
    new LinkedInStrategy(
      {
        clientID: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        callbackURL: env.LINKEDIN_CALLBACK_URL,
        scope: ['r_emailaddress', 'r_liteprofile'],
        state: true,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const linkedinId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const fullName = profile.displayName || 'Gurukool User';
          const avatarUrl = profile.photos?.[0]?.value || null;

          let user = await userService.findByLinkedinId(linkedinId);

          if (!user) {
            if (email) {
              user = await userService.findByEmail(email);
              if (user) {
                user = await userService.linkLinkedinAccount(user.id, linkedinId, avatarUrl);
              }
            }

            if (!user) {
              user = await userService.createUser({
                email: email || undefined,
                fullName,
                avatarUrl,
                linkedinId,
                authProvider: 'linkedin',
                isVerified: !!email,
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

  // Serialize user minimal properties
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    done(null, false);
  });
};

export default passport;
