import enum


class DocumentStatuses(enum.Enum):
    ready = 'ready'
    processing = 'processing'
    pending = 'pending'
    failed = 'failed'
