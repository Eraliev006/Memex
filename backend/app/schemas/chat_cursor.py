

import datetime
import uuid

from pydantic import BaseModel


class ChatCursor(BaseModel):
    last_message_at: datetime.datetime
    id: uuid.UUID