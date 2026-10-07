class NotFoundException(Exception):
    def __init__(self, message: str):
        self.message = message


class ConflictException(Exception):
    def __init__(self, message: str):
        self.message = message


class BadRequestException(Exception):
    def __init__(self, message: str):
        self.message = message


class ForbiddenException(Exception):
    def __init__(self, message: str):
        self.message = message
        