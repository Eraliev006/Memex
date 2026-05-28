

from faker import Faker
import jwt

from app.core import security, settings



faker = Faker()

def test_password_hash():
    random_pass = faker.password(special_chars=False, length=8)
    
    hashed = security.hash_password(plain_password=random_pass)
    is_valid, _ = security.verify_password(
        plain_password=random_pass,
        hashed_password=hashed
    )

    assert random_pass != hashed
    assert is_valid is True
    
def test_verify_wrong_password():
    valid_password = 'valid'
    wrong = 'wrong'
    
    hashed = security.hash_password(valid_password)
    
    is_valid, _ = security.verify_password(
        wrong,
        hashed_password=hashed
    )
    
    assert is_valid is False
    
        
def test_create_access_token():
    subject = '123'
    
    token = security.create_access_token(subject=subject)
    
    decoded = jwt.decode(token,
                         settings.SECRET_KEY,
                         algorithms=['HS256'])
    
    
    assert isinstance(token, str)
    assert decoded['sub'] == subject
    assert decoded['type'] == 'access'


def test_create_refresh_token():
    subject = '123'
    
    token = security.create_refresh_token(subject=subject)
    
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    
    assert isinstance(token, str)
    assert decoded['sub'] == subject
    assert decoded['type'] == 'refresh'
    assert 'exp' in decoded