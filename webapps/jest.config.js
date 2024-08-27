module.exports = {
    globals: {
        "ts-jest": {
            isolatedModules: true,
        },
    },
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
        'webapps/node_modules/(?!(axios)/)',
    ],
    moduleNameMapper: {
        '^axios$': require.resolve('axios'),
    },
};