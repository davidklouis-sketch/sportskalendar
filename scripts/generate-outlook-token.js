#!/usr/bin/env node

/**
 * Outlook OAuth2 Token Generator
 * 
 * This script helps you generate a refresh token for Outlook OAuth2
 * Run this once to get your refresh token, then use it in your app
 */

const readline = require('readline');
const https = require('https');
const querystring = require('querystring');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Outlook OAuth2 Token Generator');
console.log('=====================================\n');

console.log('📋 You need these values from Azure App Registration:');
console.log('1. Application (client) ID');
console.log('2. Client Secret');
console.log('3. Your email: sportskalendar@outlook.de\n');

console.log('🔗 Azure App Registration Setup:');
console.log('1. Go to: https://portal.azure.com');
console.log('2. Azure Active Directory → App registrations');
console.log('3. New registration → Name: "Sportskalendar Email"');
console.log('4. Redirect URI: http://localhost:4000/auth/callback');
console.log('5. API permissions → Microsoft Graph → Mail.Send');
console.log('6. Certificates & secrets → New client secret\n');

rl.question('Enter your Application (client) ID: ', (clientId) => {
  rl.question('Enter your Client Secret: ', (clientSecret) => {
    rl.question('Enter your email (sportskalendar@outlook.de): ', (email) => {
      
      console.log('\n🌐 Open this URL in your browser:');
      console.log('=====================================');
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=http://localhost:4000/auth/callback&` +
        `scope=https://graph.microsoft.com/Mail.Send&` +
        `response_mode=query&` +
        `state=12345`;
      
      console.log(authUrl);
      console.log('\n📝 Steps:');
      console.log('1. Open the URL above');
      console.log('2. Login with your Outlook account');
      console.log('3. Grant permissions');
      console.log('4. Copy the "code" parameter from the redirect URL');
      console.log('5. Paste it here\n');
      
      rl.question('Enter the authorization code: ', (authCode) => {
        
        console.log('\n🔄 Exchanging code for tokens...');
        
        // Exchange authorization code for tokens
        const tokenData = querystring.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          redirect_uri: 'http://localhost:4000/auth/callback',
          grant_type: 'authorization_code'
        });
        
        const options = {
          hostname: 'login.microsoftonline.com',
          port: 443,
          path: '/common/oauth2/v2.0/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenData)
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              
              if (response.error) {
                console.log('❌ Error:', response.error_description);
                console.log('Response:', data);
                rl.close();
                return;
              }
              
              console.log('✅ Tokens received successfully!\n');
              
              console.log('🔧 Add these to your .env file:');
              console.log('=====================================');
              console.log(`OAUTH_CLIENT_ID=${clientId}`);
              console.log(`OAUTH_CLIENT_SECRET=${clientSecret}`);
              console.log(`OAUTH_REFRESH_TOKEN=${response.refresh_token}`);
              console.log(`OAUTH_ACCESS_TOKEN=${response.access_token}`);
              console.log(`SMTP_USER=${email}`);
              console.log(`SMTP_HOST=smtp-mail.outlook.com`);
              console.log(`SMTP_PORT=587`);
              
              console.log('\n📋 Token Details:');
              console.log(`Access Token: ${response.access_token.substring(0, 20)}...`);
              console.log(`Refresh Token: ${response.refresh_token.substring(0, 20)}...`);
              console.log(`Expires In: ${response.expires_in} seconds`);
              
              console.log('\n✅ OAuth2 setup complete!');
              console.log('Your email service will now use OAuth2 authentication.');
              
            } catch (error) {
              console.log('❌ Error parsing response:', error.message);
              console.log('Raw response:', data);
            }
            
            rl.close();
          });
        });
        
        req.on('error', (error) => {
          console.log('❌ Request error:', error.message);
          rl.close();
        });
        
        req.write(tokenData);
        req.end();
      });
    });
  });
});
