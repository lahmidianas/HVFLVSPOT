export class TicketingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TicketingError';
  }
}