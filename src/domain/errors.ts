export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) { super(`${entity} not found: ${id}`, 'NOT_FOUND'); }
}

export class ConflictError extends DomainError {
  constructor(message: string) { super(message, 'CONFLICT'); }
}

export class ValidationError extends DomainError {
  constructor(message: string) { super(message, 'VALIDATION_ERROR'); }
}
