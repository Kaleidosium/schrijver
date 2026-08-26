import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	staged: {
		'*': 'vp check --fix'
	},
	lint: {
		plugins: ['oxc', 'typescript', 'unicorn'],
		jsPlugins: [
			'eslint-plugin-svelte',
			{
				name: 'vite-plus',
				specifier: 'vite-plus/oxlint-plugin'
			}
		],
		categories: {
			correctness: 'warn'
		},
		env: {
			builtin: true,
			browser: true,
			node: true
		},
		ignorePatterns: [
			'**/node_modules',
			'**/.output',
			'**/.vercel',
			'**/.netlify',
			'**/.wrangler',
			'.svelte-kit',
			'build',
			'**/.DS_Store',
			'**/Thumbs.db',
			'.agents',
			'.claude',
			'skills-lock.json',
			'**/.env',
			'**/.env.*',
			'!**/.env.example',
			'!**/.env.test',
			'**/vite.config.js.timestamp-*',
			'**/vite.config.ts.timestamp-*',
			'!**/.vscode/',
			'!.vscode/settings.json',
			'!.vscode/extensions.json'
		],
		rules: {
			curly: 'error',
			eqeqeq: 'error',
			'no-restricted-properties': [
				'error',
				{ object: 'describe', property: 'only' },
				{ object: 'it', property: 'only' }
			],
			'vite-plus/prefer-vite-plus-imports': 'error'
		},
		overrides: [
			{
				files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
				rules: {
					'constructor-super': 'off',
					'getter-return': 'off',
					'no-class-assign': 'off',
					'no-const-assign': 'off',
					'no-dupe-class-members': 'off',
					'no-dupe-keys': 'off',
					'no-func-assign': 'off',
					'no-import-assign': 'off',
					'no-new-native-nonconstructor': 'off',
					'no-obj-calls': 'off',
					'no-redeclare': 'off',
					'no-setter-return': 'off',
					'no-this-before-super': 'off',
					'no-undef': 'off',
					'no-unreachable': 'off',
					'no-unsafe-negation': 'off',
					'no-var': 'error',
					'no-with': 'off',
					'prefer-const': 'error',
					'prefer-rest-params': 'error',
					'prefer-spread': 'error'
				}
			},
			{
				files: ['*.svelte', '**/*.svelte'],
				rules: {
					'no-inner-declarations': 'off',
					'no-self-assign': 'off',
					'no-unassigned-vars': 'off',
					'no-undef': 'off'
				},
				jsPlugins: ['eslint-plugin-svelte']
			}
		],
		options: {
			typeAware: true,
			typeCheck: true
		}
	},
	fmt: {
		useTabs: true,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100,
		sortTailwindcss: {
			stylesheet: './src/routes/layout.css'
		},
		sortPackageJson: false,
		ignorePatterns: [
			'package-lock.json',
			'pnpm-lock.yaml',
			'yarn.lock',
			'bun.lock',
			'bun.lockb',
			'.agents',
			'.claude',
			'skills-lock.json',
			'/static/'
		]
	},
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
