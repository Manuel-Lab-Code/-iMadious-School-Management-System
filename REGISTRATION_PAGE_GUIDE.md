# EduPortal Student Registration Page

## ✅ Features Implemented

### 1. **Dynamic Class/Grade Selection**
   - 6 buttons for selecting class: JSS1, JSS2, JSS3, SSS1, SSS2, SSS3
   - Visual feedback with active state highlighting
   - Smooth transitions

### 2. **Conditional Subject/Department Display**

   **For JSS Students (JSS1-JSS3):**
   - Shows all 20 Junior subjects as checkboxes
   - Can select multiple subjects (at least 1 required)
   - Real-time counter showing selected subjects
   - Scrollable subjects list
   - Selected subjects displayed as tags below

   **For SSS Students (SSS1-SSS3):**
   - Shows 3 department options: SCIENCE, ART, COMMERCIAL
   - Click to select one department
   - Displays all subjects for selected department
   - Subject count shown on each button
   - Department subjects auto-populate when selected

### 3. **Scrollable Design**
   - Main form container is scrollable
   - Custom scrollbar styling (blue color matching theme)
   - Form content flows naturally
   - Responsive on mobile devices

### 4. **Complete Registration Flow**
   - **Step 1**: Personal Information (Name, Email, Username, Password, Parent Phone)
   - **Step 2**: Class/Grade Selection
   - **Step 3**: Subject/Department Selection
   - **Step 4**: OTP Verification

### 5. **Form Features**
   - Real-time validation
   - Error messages with red highlights
   - Success messages with green highlights
   - Loading spinners during API calls
   - Reset button to clear form
   - Required field indicators

### 6. **Visual Design**
   - Modern gradient background (purple theme)
   - Clean card layout with shadow
   - Mobile-responsive design
   - Professional color scheme (#667eea primary color)
   - Smooth animations and transitions

---

## 📍 Accessing the Registration Page

### Option 1: Direct URL
```
http://localhost:5000/register.html
```

### Option 2: Add Link to Index Page
Edit `public/index.html` and add:
```html
<a href="/register.html" class="btn btn-primary">Student Registration</a>
```

---

## 🔄 How It Works

### Step 1: Personal Information
```
User fills in:
- First Name
- Last Name
- Username (must be unique)
- Email (must be unique)
- Password (will be hashed)
- Parent/Guardian Phone (optional)
```

### Step 2: Select Class
```
User clicks on one of these:
JSS1 | JSS2 | JSS3 | SSS1 | SSS2 | SSS3
```

### Step 3a: JSS Subject Selection (if JSS selected)
```
✅ All 20 JSS subjects appear as checkboxes
✅ Can select multiple subjects
✅ Real-time counter: "Selected Subjects (5)"
✅ Selected subjects shown as blue tags
```

### Step 3b: SSS Department Selection (if SSS selected)
```
✅ Three department buttons appear:
   - SCIENCE (9 subjects)
   - ART (9 subjects)
   - COMMERCIAL (10 subjects)
✅ Click to select department
✅ Department subjects auto-display
```

### Step 4: Send OTP
```
Click "Send OTP" button
→ Backend sends 6-digit OTP to email
→ OTP form appears
```

### Step 5: Verify OTP
```
User enters 6-digit OTP
Click "Verify & Create Account"
→ Account created
→ Redirect to login page
```

---

## 🎨 Key UI Elements

### Class Selection Buttons
- 6 buttons in 2-column grid (mobile: 1 column)
- Inactive: Gray border, white background
- Active: Blue background, white text
- Hover: Light blue background

### Subject Checkboxes (JSS)
- Scrollable container (max 300px height)
- Each subject has checkbox + label
- Visual feedback on hover
- Real-time update of selected count
- Selected subjects shown as tags at bottom

### Department Buttons (SSS)
- Full-width buttons
- Show department name + subject count
- Click to select (one only)
- Shows all department subjects below when selected

### Scrollbars
- Custom styled blue scrollbars
- Smooth scrolling
- Visible on hover
- Matches theme color

---

## 🛡️ Validation

**Client-side validation:**
- All required fields must be filled
- JSS: At least 1 subject required
- SSS: Department selection required
- OTP: Must be exactly 6 digits
- Email: Valid email format
- Username/Email: Uniqueness checked by backend

**Backend validation:**
- Username uniqueness
- Email uniqueness
- Valid class level
- Valid subject list (JSS)
- Valid department (SSS)
- Password hashing

---

## 📱 Mobile Responsive

The page adapts to mobile screens:
- Single column grid for classes (instead of 2)
- Full-width buttons
- Adjusted font sizes
- Touch-friendly spacing
- Scrollable form container

---

## 🔗 API Integration

The registration page communicates with:

1. **GET /api/subjects/registration-data**
   - Loads all JSS subjects
   - Loads all departments and their subjects

2. **POST /api/auth/send-otp**
   - Sends registration info + OTP
   - Returns success message

3. **POST /api/auth/verify-otp**
   - Verifies OTP code
   - Creates account
   - Returns success/error

4. **POST /api/auth/resend-otp**
   - Resends OTP if needed

---

## ⚙️ To Use This Page

1. **Make sure your backend server is running:**
   ```bash
   npm start
   # or
   node server.js
   ```

2. **Open in browser:**
   ```
   http://localhost:5000/register.html
   ```

3. **Test registration:**
   - Fill in personal info
   - Select class (try JSS1 and SSS1)
   - See subjects/departments dynamically appear
   - Click "Send OTP"
   - Check email for OTP
   - Enter OTP and verify

---

## 🎯 Example Registration Flows

### JSS1 Student
1. Fill personal info
2. Click "JSS 1"
3. Select 3-4 subjects (English Studies, Mathematics, Basic Science)
4. Click "Send OTP"
5. Enter OTP from email
6. Account created!

### SSS1 Science Student
1. Fill personal info
2. Click "SSS 1"
3. Click "SCIENCE" department
4. See all 9 Science subjects
5. Click "Send OTP"
6. Enter OTP from email
7. Account created with auto-assigned Science subjects!

---

## 🐛 Troubleshooting

### "JSS students must select at least one subject"
- **Cause**: Didn't select class properly
- **Fix**: Make sure to click on a class button - it should turn blue

### "Department is required for SSS"
- **Cause**: Selected SSS but didn't select department
- **Fix**: Click on SCIENCE, ART, or COMMERCIAL button

### Form doesn't slide to show hidden sections
- **Cause**: JavaScript not loading
- **Fix**: Check browser console for errors

### Can't see OTP email
- **Cause**: Email settings not configured
- **Fix**: Check .env file for EMAIL_USER and EMAIL_PASS

---

## 📝 Notes

- All form fields are validated client-side before sending to server
- Main form container is scrollable for long content
- Custom blue scrollbars match the theme
- Responsive design works on all screen sizes
- Loading spinners show during API calls
- Error/success messages display appropriately
