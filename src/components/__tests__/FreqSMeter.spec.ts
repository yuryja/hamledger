import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FreqSMeter from '../header/FreqSMeter.vue';

describe('FreqSMeter', () => {
  it('renders properly', () => {
    const wrapper = mount(FreqSMeter);
    expect(wrapper.find('.freq-s-meter').exists()).toBe(true);
  });

  it('displays frequency correctly', () => {
    const wrapper = mount(FreqSMeter);
    expect(wrapper.find('.rig-frequency').text()).toContain('7.093');
    expect(wrapper.find('.rig-frequency').text()).toContain('kHz');
  });

  it('has correct S-meter ticks', () => {
    const wrapper = mount(FreqSMeter);
    const majorTicks = wrapper.findAll('.major-tick');
    expect(majorTicks.length).toBe(8); // S1, S3, S5, S7, S9, +10, +20, +30

    const expectedLabels = ['S1', 'S3', 'S5', 'S7', 'S9', '+10', '+20', '+30'];
    majorTicks.forEach((tick, index) => {
      expect(tick.find('.tick-label').text()).toBe(expectedLabels[index]);
    });
  });

  it('allows frequency editing', async () => {
    const wrapper = mount(FreqSMeter);

    // Initial state - showing frequency as text
    expect(wrapper.find('input').exists()).toBe(false);

    // Click to edit
    await wrapper.find('.rig-frequency').trigger('click');

    // Should now show input
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input').element.value).toBe('7.093');
  });
});
