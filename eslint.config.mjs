import guardian from '@guardian/eslint-config';
import prettier from 'eslint-plugin-prettier';

export default [
	{
		// Legacy AngularJS-era utilities, superseded by the React migration.
		ignores: ['public/javascripts/app/utils/**'],
	},
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
];
