from typing import Any

from httpx import AsyncClient, Response
import pytest

async def test_register_success(client: AsyncClient, user_create_schema):
    # Arrange
    payload: dict[str, Any] = user_create_schema.model_dump()
    
    # Act
    response = await client.post(
        url='/api/v1/auth/register',
        json=payload
    )
    
    # Assert
    assert response.status_code == 201
    
    
async def test_login(client: AsyncClient):
    # Arrange
    register_payload = {
        "name": "Test User",
        "email": "test@test.com", 
        "password": "testpass123"
    }
    await client.post(url='/api/v1/auth/register', json=register_payload)
    
    login_payload = {
        "username": "test@test.com",
        "password": "testpass123"
    }
    response = await client.post(url='/api/v1/auth/login', data=login_payload)
    assert response.status_code == 200
    print(response)

def test_reset_password():
    # Arrange
    
    # Act
    
    # Assert
    pass
