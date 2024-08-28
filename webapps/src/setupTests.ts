// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import {AxiosStatic} from 'axios';
const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
};

const mockAxios: jest.Mocked<AxiosStatic> = {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    all: jest.fn(),
    spread: jest.fn(),
    isAxiosError: jest.fn(),
    isCancel: jest.fn(),
    CancelToken: {
        source: jest.fn()
    },
    defaults: {
        headers: {
            common: {},
            delete: {},
            get: {},
            head: {},
            post: {},
            put: {},
            patch: {}
        },
        transformRequest: [],
        transformResponse: [],
        timeout: 0,
        withCredentials: false,
        adapter: jest.fn(),
        responseType: 'json',
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        validateStatus: jest.fn(),
        maxBodyLength: -1,
        maxRedirects: 5,
        decompress: true
    },
    interceptors: {
        request: {
            use: jest.fn(),
            eject: jest.fn(),
            clear: jest.fn()
        },
        response: {
            use: jest.fn(),
            eject: jest.fn(),
            clear: jest.fn()
        }
    }
} as any;

jest.mock('axios', () => mockAxios);