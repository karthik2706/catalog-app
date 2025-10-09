# Guest Access Feature

## Overview

The Guest Access feature allows you to share your product catalog with external users (guests) using a simple password-protected link. Guests can view your products without needing to create an account or log in with full credentials.

## Features

- **Password Protection**: Set a simple password for guest access
- **Read-Only Access**: Guests can only view products, not modify them
- **Tenant Isolation**: Each client has their own guest access URL and password
- **Easy Management**: Enable/disable guest access and update passwords from settings
- **Product Search**: Guests can search and browse through products
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### For Administrators

1. **Enable Guest Access**
   - Navigate to **Settings** → **Guest Access** tab
   - Toggle "Enable Guest Access" to ON
   - Set a password or click "Generate" for a random secure password
   - Click "Save Settings"

2. **Share the Guest URL**
   - Once enabled, you'll see a "Guest Access URL" field
   - Click "Copy" to copy the URL
   - Share this URL along with the password with your guests

3. **Update Password**
   - Go to Settings → Guest Access
   - Enter a new password
   - Click "Save Settings"
   - Share the new password with your guests

4. **Disable Guest Access**
   - Toggle "Enable Guest Access" to OFF
   - Click "Save Settings"
   - The guest link will no longer work

### For Guests

1. **Access the Catalog**
   - Open the guest URL provided by the administrator
   - Example: `https://yourdomain.com/guest/your-company-slug`

2. **Enter Password**
   - Enter the password provided by the administrator
   - Click "Access Catalog"

3. **Browse Products**
   - View all active products in a grid layout
   - Search for specific products using the search bar
   - View product details including:
     - Product name
     - SKU
     - Description
     - Price
     - Category
     - Images and videos
   - Navigate through pages using pagination controls

4. **Logout**
   - Click the "Logout" button in the header to end your session

## Security Features

- **Password Protected**: Guest access requires a password set by the admin
- **JWT Token Authentication**: Sessions are managed using secure JWT tokens
- **Tenant Isolation**: Guests can only see products from the specific client
- **24-Hour Sessions**: Guest tokens expire after 24 hours for security
- **No Write Access**: Guests cannot create, update, or delete products

## Technical Details

### API Endpoints

- `POST /api/guest/auth` - Authenticate guest with password
- `GET /api/guest/products` - Fetch products for guest view
- `GET /api/settings/guest-access` - Get guest access settings (admin only)
- `PUT /api/settings/guest-access` - Update guest access settings (admin only)

### Database Schema

Added fields to `Client` model:
```prisma
model Client {
  // ... existing fields
  guestPassword      String?
  guestAccessEnabled Boolean @default(false)
}
```

### Routes

- `/guest/[slug]` - Guest login page
- `/guest/[slug]/catalog` - Guest catalog view page

## Best Practices

1. **Strong Passwords**: Use the "Generate" button to create secure passwords
2. **Regular Updates**: Change the guest password periodically for security
3. **Limited Sharing**: Only share the guest URL and password with trusted parties
4. **Monitor Usage**: Keep track of who has access to your guest catalog
5. **Disable When Not Needed**: Turn off guest access when you don't need it

## Example Use Cases

- **B2B Catalogs**: Share product catalogs with potential business partners
- **Trade Shows**: Provide quick access to your catalog at events
- **Client Presentations**: Show products to clients without giving full system access
- **External Stakeholders**: Allow vendors or partners to view inventory
- **Quick Demos**: Demonstrate your product range without account setup

## Troubleshooting

### "Invalid credentials" error
- Check that you're using the correct password
- Verify that guest access is enabled in settings
- Contact the administrator if issues persist

### "Guest access is not enabled" error
- The administrator needs to enable guest access in settings
- Contact your administrator

### Token expired
- Your session has expired after 24 hours
- Simply log in again with the password

### Products not loading
- Check your internet connection
- Try refreshing the page
- Contact the administrator if products are missing

## Future Enhancements

Potential improvements for future versions:
- Custom expiry dates for guest access
- Usage analytics for guest sessions
- Multiple guest passwords for different groups
- Custom branding for guest pages
- Export product data for guests
- Email sharing with automatic password generation

