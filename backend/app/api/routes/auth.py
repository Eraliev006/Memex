from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import AuthServiceDep
from app.schemas import (
    UserCreate,
    UserResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    LoginWithPasswordRequest,
    TokenResponse,
    RefreshTokenRequest,
)


router = APIRouter(tags=['auth'], prefix='/auth')

@router.post('/login', status_code=200, response_model=TokenResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: AuthServiceDep):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    return await auth_service.login_with_password(LoginWithPasswordRequest(
        email=form_data.username,
        password=form_data.password
    ))

@router.post('/register', status_code=201, response_model=UserResponse)
async def register(
    user: UserCreate,
    auth_service: AuthServiceDep):
    return await auth_service.register(user)

@router.post('/refresh', status_code=200, response_model=TokenResponse)
async def refresh(
    body: RefreshTokenRequest,
    auth_service: AuthServiceDep,
):
    return await auth_service.refresh_tokens(body.refresh_token)


@router.post('/reset-password', status_code=200, response_model=ResetPasswordResponse)
async def reset_password(
    body: ResetPasswordRequest,
    auth_service: AuthServiceDep,
):
    await auth_service.reset_password(body)
    return ResetPasswordResponse(message="Password updated successfully")
