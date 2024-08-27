import PlaidService from './PlaidService';


jest.mock('axios', () => {
  return {
    default: {
      post: jest.fn()
    },
  };
});
const mockedAxios = require('axios').default;

describe('PlaidService', () => {
  const service = PlaidService.getInstance();

  describe('createLinkToken()', () => {
    it('should create a link token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          link_token: 'fake_link_token'
        },
      });

      const result = await service.createLinkToken();
      expect(result).toEqual('fake_link_token');

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:8080/api/plaid/create_link_token', {
        linkTokenRequest: { userId: "1" }
      });
    });

    it('should throw an error if there is an error creating a link token', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Failed to create link token'));

      await expect(service.createLinkToken()).rejects.toThrow('Failed to create link token');
    });
  });
  
  describe('exchangePublicToken()', () => {
    it('should exchange public token', async () => {
      const fakeResponseData = {
        some_property: "fake_property",
        another_property: "fake_property"
      }
      mockedAxios.post.mockResolvedValueOnce({
        data: fakeResponseData
      });

      const result = await service.exchangePublicToken('fake_public_token');
      expect(result).toEqual(fakeResponseData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/exchange-public-token', {
        public_token: 'fake_public_token'
      });
    });

    it('should throw an error if the public token is null', async () => {
      await expect(service.exchangePublicToken(null!)).rejects.toThrow('Public Token cannot be null');
    });

    it('should throw an error if there is an error exchanging the public token', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Failed to exchange public token'));

      await expect(service.exchangePublicToken('fake_public_token')).rejects.toThrow('Failed to exchange public token');
    });
  });

  // Add more test cases for other methods as per the pattern above
});