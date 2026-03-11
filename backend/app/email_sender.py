import os
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()
def SendEmail(to: str, subject: str, html: str):
    message = Mail(
        from_email=os.getenv("FROM_EMAIL"),
        to_emails=to,
        subject=subject,
        html_content=html
    )
    try:
        sg = SendGridAPIClient(os.getenv("SENGRID_API_KEY"))
        sg.send(message)
    except Exception as e:
        print(e)