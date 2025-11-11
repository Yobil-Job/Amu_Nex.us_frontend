# Cloudinary Setup Guide

## ⚠️ Important: You DON'T Need API Key/Secret for Client-Side Uploads

For client-side image uploads (what we're doing), you **only need**:
1. **Cloud Name** (found in your Dashboard)
2. **Upload Preset** (unsigned preset you create)

You can ignore the API Key and API Secret - those are only for server-side operations.

---

## Step-by-Step Setup Instructions

### Step 1: Get Your Cloud Name

1. Log in to your Cloudinary account at https://cloudinary.com/
2. Go to your **Dashboard** (you should see it when you log in)
3. Look for **"Account Details"** section
4. Find **"Cloud name"** - it looks something like: `dxyz1234` or `my-cloud-name`
5. **Copy this cloud name** - you'll need it for the `.env` file

### Step 2: Create an Upload Preset

1. In your Cloudinary Dashboard, click on **"Settings"** (gear icon) in the top menu
2. Click on **"Upload"** in the left sidebar
3. Scroll down to the **"Upload presets"** section
4. Click the **"Add upload preset"** button
5. Fill in the following settings:

   **Basic Settings:**
   - **Preset name**: `club_management` (or any name you like)
   - **Signing mode**: Select **"Unsigned"** ⚠️ (This is important!)
   - **Folder**: `clubs/logos` (optional, but helps organize images)

   **Upload Manipulations (Optional but Recommended):**
   - Scroll down to find transformation settings
   - You can set:
     - **Max file size**: 5MB
     - **Allowed formats**: jpg, png, gif, webp
     - **Auto-format**: Enable (automatically converts to best format)

6. Click **"Save"** at the bottom

### Step 3: Add Environment Variables

1. Open your `.env` file in the `guildmate-nexus-main` directory
   - If it doesn't exist, create a new file named `.env` in the root of `guildmate-nexus-main`

2. Add these two lines:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_UPLOAD_PRESET=club_management
   ```

3. Replace `your_cloud_name_here` with the actual cloud name you copied from Step 1
   - Example: `VITE_CLOUDINARY_CLOUD_NAME=dxyz1234`

4. Make sure the preset name matches what you created in Step 2
   - If you named it differently, use that name instead of `club_management`

### Step 4: Restart Your Development Server

1. Stop your current dev server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

3. The new environment variables will be loaded

---

## Example .env File

Your `.env` file should look something like this:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_CLOUDINARY_CLOUD_NAME=dxyz1234
VITE_CLOUDINARY_UPLOAD_PRESET=club_management
```

---

## Verify Your Setup

1. Open the Create Club dialog in your app
2. Try uploading an image
3. Check the browser console (F12) for any errors
4. If you see "Cloudinary cloud name is not configured", double-check your `.env` file

---

## Troubleshooting

**Problem: "Cloudinary cloud name is not configured"**
- Make sure your `.env` file is in the `guildmate-nexus-main` root directory
- Make sure the variable name is exactly `VITE_CLOUDINARY_CLOUD_NAME`
- Restart your dev server after adding the variables

**Problem: "Upload failed" or 401 error**
- Make sure your upload preset is set to **"Unsigned"**
- Check that the preset name in `.env` matches the preset name in Cloudinary

**Problem: Image uploads but doesn't show**
- Check the browser console for the uploaded URL
- Verify the URL is being saved to `formData.logo`

---

## Security Notes

✅ **Safe for Client-Side:**
- Using unsigned upload presets is safe because:
  - You can restrict file types, sizes, and formats in the preset
  - The preset doesn't expose your API secret
  - Images are uploaded directly from the browser to Cloudinary

⚠️ **What NOT to Do:**
- Don't put your API Secret in the `.env` file (it's not needed)
- Don't use signed uploads unless you implement server-side signing

---

## Image Upload Features

- **Supported formats**: PNG, JPG, GIF, WebP
- **Max file size**: 5MB (configurable in code)
- **Automatic optimization**: Images are automatically optimized (500x500, quality auto)
- **Storage location**: Images are stored in `clubs/logos` folder in Cloudinary
- **Auto-upload**: Images upload automatically when selected

