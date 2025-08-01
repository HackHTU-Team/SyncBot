/**
 * @class SyncBotError
 * @description Base error class for all custom errors thrown by the SyncBot.
 */
export class SyncBotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncBotError';
  }
}

/**
 * @class AdaptorNotFoundError
 * @description Error thrown when an adaptor cannot be found for a given request.
 */
export class AdaptorNotFoundError extends SyncBotError {
  constructor(adaptorId: string) {
    super(`Adaptor with id '${adaptorId}' not found.`);
    this.name = 'AdaptorNotFoundError';
  }
}

/**
 * @class DuplicateAdaptorError
 * @description Error thrown when attempting to register an adaptor with an ID that is already in use.
 */
export class DuplicateAdaptorError extends SyncBotError {
  constructor(adaptorId: string) {
    super(`An adaptor with id '${adaptorId}' is already registered.`);
    this.name = 'DuplicateAdaptorError';
  }
}