// Function for sending email
export async function sendEmail(message: string, email: string) {
    console.log(`Sending ${message} email to ${email}`);
    const url = process.env.EMAIL_SERVICE_URL;
    const payload = {
      to_email: email,
      subject: "Upstash Newsletter",
      content: message,
    };
  
    if (!url) {
      console.error("EMAIL_SERVICE_URL is not defined.");
      return;
    }
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
    }
  }