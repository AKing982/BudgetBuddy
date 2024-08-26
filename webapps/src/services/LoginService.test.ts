// System imports
import LoginService from './LoginService';
import axios from "axios";


//Mock axios
jest.mock('axios');

// A mock for our API call
const mockGet = axios.get as jest.MockedFunction<typeof axios.get>;

const apiUrl: string = 'https://localhost:8080'; // Replace with your API url

describe('LoginService', () => {
  const user = 'test_user';
  const pass = 'test_pass';

  beforeEach(() => {
    mockGet.mockClear();
  });

  it('fetchUserIdByUsername should fetch userId using username', async () => {
    const userId: number = 1;
    
    // Mocking axios.get response
    mockGet.mockResolvedValueOnce({
      data: userId
    });

    const loginService: LoginService = new LoginService(user, pass);
    const result: number = await loginService.fetchUserIdByUsername(user);

    expect(result).toEqual(userId);
    expect(mockGet).toHaveBeenCalledWith(
      `${apiUrl}/api/users/username`, 
      { params: { username: user } }
    );
  });

  it('fetchUserIdByUsername should throw error if request fails', async () => {
    const error = new Error('There was an error fetching the userId');
    mockGet.mockRejectedValueOnce(error);

    const loginService: LoginService = new LoginService(user, pass);

    await expect(loginService.fetchUserIdByUsername(user))
      .rejects.toThrow('There was an error fetching the userId');
      
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      `${apiUrl}/api/users/username`, 
      { params: { username: user } }
    );
  });
});