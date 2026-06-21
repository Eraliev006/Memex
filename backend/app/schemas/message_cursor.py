

import datetime
import uuid

from pydantic import BaseModel


class MessageCursor(BaseModel):
    created_at: datetime.datetime
    id: uuid.UUID