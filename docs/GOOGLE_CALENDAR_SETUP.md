# Google Calendar API Setup Guide

## Complete Step-by-Step Instructions

### Prerequisites
- Google Account
- Access to Google Cloud Console

### Step 1: Create Google Cloud Project (5 minutes)

1. **Navigate to Google Cloud Console**
   - Open: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click on the project dropdown (top left, next to "Google Cloud")
   - Click "NEW PROJECT"
   - Enter project name: `Smart Interview Platform`
   - Organization: Leave as default
   - Location: Leave as default
   - Click **CREATE**
   - Wait for project creation (usually takes 10-30 seconds)
   - Click "SELECT PROJECT" when notification appears

### Step 2: Enable Google Calendar API (2 minutes)

1. **Access API Library**
   - From the left sidebar, click "APIs & Services" > "Library"
   - Or use the search bar at the top

2. **Find and Enable Calendar API**
   - In the API Library search box, type: `Google Calendar API`
   - Click on "Google Calendar API" from the results
   - Click the blue **ENABLE** button
   - Wait for API to be enabled (takes a few seconds)

### Step 3: Configure OAuth Consent Screen (5 minutes)

1. **Navigate to OAuth Consent Screen**
   - Left sidebar: "APIs & Services" > "OAuth consent screen"

2. **Choose User Type**
   - Select **External** (allows any Google user to sign in)
   - Click **CREATE**

3. **Fill App Information**
   
   **OAuth consent screen tab:**
   - App name: `Smart Interview Platform`
   - User support email: Select your email from dropdown
   - App logo: (Optional - skip for now)
   - Application home page: Your domain (e.g., `https://your-domain.com`)
   - Application privacy policy link: (Optional - can add later)
   - Application terms of service link: (Optional - can add later)
   - Authorized domains: Add your domain without https:// (e.g., `your-domain.com`)
   - Developer contact information: Enter your email
   - Click **SAVE AND CONTINUE**

4. **Configure Scopes**
   
   **Scopes tab:**
   - Click **ADD OR REMOVE SCOPES**
   - In the "Manually add scopes" section, paste:
     ```
     https://www.googleapis.com/auth/calendar
     ```
   - Click **ADD TO TABLE**
   - Verify the scope appears in the list
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

5. **Add Test Users** (Required for External apps in testing)
   
   **Test users tab:**
   - Click **+ ADD USERS**
   - Enter the Google email addresses that will test the app
   - Example: `your-email@gmail.com`
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

6. **Review Summary**
   - Review all information
   - Click **BACK TO DASHBOARD**

### Step 4: Create OAuth 2.0 Credentials (3 minutes)

1. **Navigate to Credentials**
   - Left sidebar: "APIs & Services" > "Credentials"
   - Click **+ CREATE CREDENTIALS** (top)
   - Select **OAuth client ID**

2. **Configure OAuth Client**
   
   **Application type:**
   - Select **Web application**
   
   **Name:**
   - Enter: `Smart Interview Platform Web Client`
   
   **Authorized JavaScript origins:**
   - Click **+ ADD URI**
   - For production: `https://your-domain.com`
   - For local testing: `http://localhost:3000`
   - Add both if needed
   
   **Authorized redirect URIs:**
   - Click **+ ADD URI**
   - For production: `https://your-domain.com/api/oauth/calendar/callback`
   - For local testing: `http://localhost:8001/api/oauth/calendar/callback`
   - **IMPORTANT**: The path must be exactly `/api/oauth/calendar/callback`
   
   - Click **CREATE**

3. **Save Credentials**
   - A popup will appear with your credentials
   - **Client ID**: Copy this (starts with something like `123456-abc.apps.googleusercontent.com`)
   - **Client Secret**: Copy this (looks like `GOCSPX-abc123...`)
   - Click **OK**
   - You can always view these again by clicking the credential name

### Step 5: Configure Backend Environment (2 minutes)

1. **Open Backend .env File**
   ```bash
   nano /app/backend/.env
   ```

2. **Add Google Credentials**
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
   GOOGLE_REDIRECT_URI=https://your-domain.com/api/oauth/calendar/callback
   ```

3. **Save and Restart Backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### Step 6: Test the Integration (5 minutes)

1. **Login to Application**
   - Navigate to your application
   - Login as an INTERVIEWER or ADMIN

2. **Connect Google Calendar**
   - Go to the Interviews page
   - Click "Connect Calendar" button
   - You'll be redirected to Google's authorization page

3. **Authorize Access**
   - Select the Google account you want to use
   - If you see "This app isn't verified":
     - Click "Advanced"
     - Click "Go to Smart Interview Platform (unsafe)"
     - This is normal for apps in testing mode
   - Review permissions
   - Click **Continue** or **Allow**

4. **Verify Connection**
   - You should be redirected back to your application
   - Calendar should now be connected
   - Try scheduling an interview to test

### Common Issues and Solutions

#### Issue 1: "Redirect URI Mismatch"
**Solution:**
- Go to Google Cloud Console > Credentials
- Edit your OAuth client
- Ensure redirect URI exactly matches: `https://your-domain.com/api/oauth/calendar/callback`
- No trailing slashes
- Must use HTTPS in production

#### Issue 2: "Access Blocked: This app's request is invalid"
**Solution:**
- Check that Google Calendar API is enabled
- Verify OAuth consent screen is configured
- Ensure test user email is added to test users list

#### Issue 3: "The OAuth client was not found"
**Solution:**
- Verify Client ID and Client Secret are correctly copied
- Check for extra spaces or line breaks
- Ensure credentials are from the correct project

#### Issue 4: "Calendar events not appearing"
**Solution:**
- Check that scope `https://www.googleapis.com/auth/calendar` is added
- Re-authorize by disconnecting and reconnecting
- Verify the Google account has calendar events

### Production Checklist

Before going to production:

- [ ] Change redirect URI to production domain (HTTPS required)
- [ ] Update authorized JavaScript origins
- [ ] Consider publishing OAuth app (moves from testing to production)
  - Go to OAuth consent screen
  - Click "PUBLISH APP"
  - Submit for verification (required for >100 users)
- [ ] Set up proper error handling
- [ ] Monitor API quotas
- [ ] Set up logging for OAuth flows

### API Quotas

Google Calendar API has these default quotas:
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 20,000

For most applications, these limits are sufficient. If you need more:
1. Go to APIs & Services > Calendar API
2. Click "Quotas"
3. Request quota increase

### Security Best Practices

1. **Never commit credentials**
   - Keep .env file out of version control
   - Use .gitignore to exclude .env files

2. **Use HTTPS in production**
   - Google requires HTTPS for OAuth redirects in production
   - Set up SSL certificate (Let's Encrypt is free)

3. **Rotate credentials periodically**
   - Generate new OAuth client every 6-12 months
   - Update all services using the old credentials

4. **Monitor access logs**
   - Check Google Cloud Console logs regularly
   - Watch for unusual patterns

### Testing Without Google Calendar

The application includes mock data fallback:
- If Google Calendar is not configured
- Scheduling will still work with mock availability
- Displays test meeting links
- Useful for development and testing

### Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [API Quotas and Limits](https://developers.google.com/calendar/api/guides/quota)

### Support

If you encounter issues:
1. Check the backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Verify credentials in .env file
3. Test OAuth flow manually
4. Review Google Cloud Console error logs

### Success Indicators

✅ Successfully authorized Google Calendar
✅ Can view interviewer availability
✅ Can schedule interviews
✅ Events appear in Google Calendar
✅ Meeting links are generated

---

**Setup Time**: Approximately 20-25 minutes
**Difficulty**: Intermediate
**Cost**: Free (within Google's quotas)