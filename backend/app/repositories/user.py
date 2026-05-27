from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from sqlalchemy import select


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        
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
        await self.db.commit()
        await self.db.refresh(user)
        
    