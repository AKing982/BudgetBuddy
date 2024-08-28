module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(axios)/)',
    ],
    moduleNameMapper: {
        '^axios$': require.resolve('axios'),
    },
};