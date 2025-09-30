import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';

// Global test setup
config.global.plugins = [createPinia()];
