import os
import uuid
from fastapi import Depends, Request, HTTPException
from fastapi_users import BaseUserManager, UUIDIDMixin, FastAPIUsers
from app.db import User, get_user_db
from fastapi_users.authentication import AuthenticationBackend, JWTStrategy, CookieTransport
from fastapi_users.db import SQLAlchemyUserDatabase
from httpx_oauth.clients.google import GoogleOAuth2
from app.email_sender import SendEmail
from dotenv import load_dotenv

load_dotenv()
SECRET = os.getenv("JWT_SECRET")

class DebugGoogleOAuth2(GoogleOAuth2):
    async def get_profile(self, token: str):
        try:
            return await super().get_profile(token)
        except Exception as e:
            print(f"Profile request failed: {e}")
            if hasattr(e, 'response'):
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            raise

google_oauth_client = DebugGoogleOAuth2(os.getenv("GOOGLE_OAUTH_CLIENT_ID", ""), os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", ""), scopes=["openid", "email", "profile"])

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET
    

    async def on_after_register(self, user: User, request: Request | None = None):
        SendEmail(user.email, "Welcome to Recipizer", f"<p>Welcome to Recipizer</p><p>We hope you enjoy your time here</p>")
    
    async def on_after_login(self, user, request = None, response = None):
        if user.is_deleted:
            raise HTTPException(status_code=403, detail="Account has been deleted")

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None):
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        SendEmail(user.email, "Password Reset", f"<p>Click <a href='{reset_link}'>here</a> to reset your password</p>")

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None):
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
    
cookie_transport = CookieTransport(
    cookie_max_age=7200,
    cookie_httponly=True,
    cookie_secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    cookie_samesite="lax"
    )

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=7200)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])
current_active_user = fastapi_users.current_user(active=True)