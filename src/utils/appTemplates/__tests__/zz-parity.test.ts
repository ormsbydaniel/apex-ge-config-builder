import { describe, it, expect } from 'vitest';
import { parseCommunityTemplate } from '@/utils/appTemplates/communityTemplates';
import { APP_TEMPLATES, getDefaultValues } from '@/utils/appTemplates/templates';
import wizardJson from '/dev-server/community-templates/apps/change-swipe/wizard.json';
import baseConfig from '/dev-server/community-templates/apps/change-swipe/config.json';

describe('change-swipe community parity', () => {
  it('matches the built-in output with default answers', () => {
    const builtin = APP_TEMPLATES.find((t) => t.id === 'change-swipe')!;
    const community = parseCommunityTemplate(wizardJson, baseConfig);
    const params = { title: 'Change Explorer', center: [15, 52] as [number, number], zoom: 4, values: getDefaultValues(builtin) };
    expect(community.build(params)).toEqual(builtin.build(params));
  });
  it('matches for custom years 2016 vs 2021', () => {
    const builtin = APP_TEMPLATES.find((t) => t.id === 'change-swipe')!;
    const community = parseCommunityTemplate(wizardJson, baseConfig);
    const values = { ...getDefaultValues(builtin), before: '2016', after: '2021' };
    const params = { title: 'My App', center: [2.35, 48.86] as [number, number], zoom: 11, values };
    expect(community.build(params)).toEqual(builtin.build(params));
  });
});
