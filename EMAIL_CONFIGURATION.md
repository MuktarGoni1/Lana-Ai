# Email Configuration Guide

This guide explains how to configure and use the email functionality for the monthly child performance reports.

## Overview

The monthly report system can send emails to parents with their child's learning progress. The system supports both development and production configurations.

## Configuration Options

### Environment Variables

The email functionality is configured through environment variables. Here are the required variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_SERVER` | SMTP server address | "" |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USERNAME` | SMTP username | "" |
| `SMTP_PASSWORD` | SMTP password | "" |

### Development Mode

In development mode (when SMTP_SERVER is not set), the system will log the email content instead of sending actual emails. This is useful for testing and development.

### Production Mode

In production mode (when SMTP_SERVER is set), the system will send actual emails using the provided SMTP configuration.

## Setting Up Email Providers

### Gmail

To use Gmail as your email provider:

1. Set the following environment variables:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. Enable 2-factor authentication on your Gmail account.

3. Generate an App Password:
   - Go to Google Account settings
   - Navigate to Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password as your SMTP_PASSWORD

### Other Providers

For other email providers, use their respective SMTP settings:

- **Outlook/Hotmail**: 
  - SMTP_SERVER: smtp-mail.outlook.com
  - SMTP_PORT: 587

- **Yahoo**: 
  - SMTP_SERVER: smtp.mail.yahoo.com
  - SMTP_PORT: 587

- **Custom SMTP**:
  - Use your provider's SMTP server and port

## Render Deployment Configuration

The `render.yaml` file already includes the necessary environment variables for both the web service and CRON job. You need to set the values in the Render dashboard:

1. Go to your Render dashboard
2. Navigate to your service settings
3. Go to the "Environment" tab
4. Add the following environment variables:
   - `SMTP_SERVER`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`

Set `sync: false` for sensitive variables to prevent them from being exposed in the configuration file.

## Testing Email Functionality

### Running the Test Script

You can test the email functionality using the provided test script:

```bash
cd backend
python test_email_functionality.py
```

### Manual Testing

You can also manually trigger the monthly reports job to test email functionality:

1. Ensure you have a valid admin API key
2. Make a POST request to `/api/jobs/monthly-reports` with the appropriate authorization header
3. Check the logs to see if emails are being sent or logged

## Security Considerations

### Credential Storage

- Never commit SMTP credentials to version control
- Use environment variables with `sync: false` in Render
- Rotate passwords regularly

### Email Content

- All user data is sanitized before being included in emails
- Email addresses are validated before sending
- No sensitive system information is included in email content

## Troubleshooting

### Common Issues

1. **Emails not being sent**:
   - Check that SMTP_SERVER is set
   - Verify SMTP credentials
   - Check firewall settings

2. **Authentication failures**:
   - Ensure you're using an App Password for Gmail
   - Verify username and password
   - Check if 2FA is required

3. **Connection timeouts**:
   - Verify SMTP server address and port
   - Check network connectivity
   - Ensure the SMTP server is accepting connections

### Log Messages

- Look for "Monthly report email sent successfully" in the logs
- Check for error messages related to SMTP connections
- Review security logs for authentication issues

## Best Practices

1. **Use App Passwords**: For Gmail and other providers that support it
2. **Monitor Quotas**: Be aware of daily/weekly email sending limits
3. **Test Regularly**: Regularly test email functionality to ensure it's working
4. **Handle Errors Gracefully**: The system continues processing even if individual emails fail
5. **Log Appropriately**: All email sending attempts are logged for debugging

## Example Configuration

### Development Environment (.env file)
```
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
```

### Production Environment (Render)
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=reports@lanamind.com
SMTP_PASSWORD=your-app-password
```

With this configuration, the monthly report system will send actual emails to parents with their child's learning progress.