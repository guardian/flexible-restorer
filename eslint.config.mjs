import guardian from '@guardian/eslint-config';
import prettier from 'eslint-plugin-prettier';

export default [
	...guardian.configs.recommended,
	...guardian.configs.jest,
	{
		plugins: {
			prettier,
		},
		rules: {
			'prettier/prettier': 'error',
		},
	},
	{
		// CSF Next stories export named stories only; there is no default export.
		files: ['**/*.stories.tsx'],
		rules: {
			'import/prefer-default-export': 'off',
		},
	},
];
