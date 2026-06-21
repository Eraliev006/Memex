from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas import UserCreate
from sqlalchemy import select


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def get_by_id(self, user_id: str) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """

        Args:
            email (str): users email

        Returns:
            User | None: returned user by email or None
        """
        stmt = select(User).where(User.email == email)
        
        result = await self.db.execute(stmt)
        
        return result.scalar_one_or_none()
    

    async def update_password(self, user: User, new_password: str) -> None:
        """
        Args:
            user (User): user object
            new_password (str): new password
        Update password for user
        """
        user.hashed_password = new_password
        self.db.add(user)
        await self.db.flush()

        
    async def create_user(self, user_in: UserCreate, hashed_password: str) -> User:
        """create user in db

        Args:
            user (UserCreate): get user schemas for create
            hashed_password (str): get already hashed password and save

        Returns:
            User: return User object
        """
        user_data = user_in.model_dump(exclude={'password'})
        
        db_user = User(**user_data, hashed_password=hashed_password)
        self.db.add(db_user)
        await self.db.flush()
        await self.db.refresh(db_user)
        return db_user
        
        
    