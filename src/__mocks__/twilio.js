const mockMessages = {
  create: jest.fn((msg) => {}),
};

module.exports = class Twilio {
  constructor(sid, token) {
    this.messages = mockMessages;
  }
};
