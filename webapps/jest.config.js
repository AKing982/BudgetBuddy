module.exports = {
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'webapps/node_modules/(?!(axios)/)',
    ],
    moduleNameMapper: {
        '^axios$': require.resolve('axios'),
    },
};